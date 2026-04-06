const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
const { User, Department, Section } = require('../models');
const { auth, requireRole } = require('../middleware/auth');

const avatarStorage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (req, file, cb) => cb(null, `avatar_${req.params.id}_${Date.now()}${path.extname(file.originalname)}`),
});
const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 3 * 1024 * 1024 }, fileFilter: (_, f, cb) => cb(null, f.mimetype.startsWith('image/')) });

// GET all users (admin/principal)
router.get('/', auth, requireRole('admin', 'principal'), async (req, res) => {
  const users = await User.findAll({
    attributes: { exclude: ['passwordHash'] },
    include: [{ association: 'department' }, { association: 'section' }],
    order: [['firstName', 'ASC']],
  });
  res.json(users);
});

// GET users by role — pass 'all' to get every non-admin user (for HOD picker)
router.get('/role/:role', auth, requireRole('admin', 'principal', 'hod'), async (req, res) => {
  const where = req.params.role === 'all' ? {} : { role: req.params.role };
  const users = await User.findAll({
    where,
    attributes: { exclude: ['passwordHash'] },
    include: [{ association: 'department' }, { association: 'section' }],
    order: [['firstName', 'ASC']],
  });
  res.json(users);
});

// POST create user (admin only)
router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role, departmentId, sectionId } = req.body;
    if (!email || !password || !firstName) return res.status(400).json({ message: 'Missing required fields' });
    if (await User.findOne({ where: { email } })) return res.status(400).json({ message: 'Email already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, firstName, lastName: lastName || '', phone: phone || '', role: role || 'student', departmentId: departmentId || null, sectionId: sectionId || null });
    const { passwordHash: _, ...safe } = user.toJSON();
    res.json(safe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update user (admin only)
router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    const { firstName, lastName, phone, role, departmentId, sectionId, isActive, password } = req.body;
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role;
    if (departmentId !== undefined) user.departmentId = departmentId || null;
    if (sectionId !== undefined) user.sectionId = sectionId || null;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();
    const { passwordHash: _, ...safe } = user.toJSON();
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST upload avatar for a user (admin only)
router.post('/:id/avatar', auth, requireRole('admin'), uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    const BASE = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 4000}`;
    user.avatarUrl = `${BASE}/uploads/${req.file.filename}`;
    await user.save();
    res.json({ avatarUrl: user.avatarUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE user (admin only)
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: 'Not found' });
  if (user.role === 'admin') return res.status(400).json({ message: 'Cannot delete admin' });
  await user.destroy();
  res.json({ message: 'Deleted' });
});

module.exports = router;
