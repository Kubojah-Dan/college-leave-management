const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const { User, Department, Section } = require('../models');
const { auth } = require('../middleware/auth');

const avatarStorage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (req, file, cb) => cb(null, `avatar_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`),
});
const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 3 * 1024 * 1024 }, fileFilter: (_, f, cb) => cb(null, f.mimetype.startsWith('image/')) });

const SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role, departmentId, sectionId } = req.body;
    if (!email || !password || !firstName) return res.status(400).json({ message: 'Missing required fields' });
    if (await User.findOne({ where: { email } })) return res.status(400).json({ message: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email, passwordHash, firstName, lastName: lastName || '', phone: phone || '',
      role: role || 'student',
      departmentId: departmentId || null,
      sectionId: sectionId || null,
    });
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: process.env.JWT_EXPIRE || '8h' });
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
    const user = await User.findOne({ where: { email }, include: [{ association: 'department' }, { association: 'section' }] });
    if (!user || !user.isActive) return res.status(400).json({ message: 'Invalid credentials' });
    if (!await bcrypt.compare(password, user.passwordHash)) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: process.env.JWT_EXPIRE || '8h' });
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  const user = await User.findByPk(req.user.id, { include: [{ association: 'department' }, { association: 'section' }] });
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json(safeUser(user));
});

// POST /api/auth/avatar – upload profile photo
router.post('/avatar', auth, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    const user = await User.findByPk(req.user.id);
    const BASE = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 4000}`;
    user.avatarUrl = `${BASE}/uploads/${req.file.filename}`;
    await user.save();
    res.json({ avatarUrl: user.avatarUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/me  – update own profile
router.put('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const { firstName, lastName, phone, password } = req.body;
    if (firstName) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (password) user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();
    res.json(safeUser(user));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

function safeUser(u) {
  return {
    id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName,
    phone: u.phone, role: u.role, isActive: u.isActive,
    departmentId: u.departmentId, sectionId: u.sectionId,
    department: u.department || null, section: u.section || null,
    avatarUrl: u.avatarUrl || '',
  };
}

module.exports = router;
