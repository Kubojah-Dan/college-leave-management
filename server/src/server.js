require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');

const { sequelize, User, Department, Section, LeaveType } = require('./models');
const { setIo } = require('./utils/notify');

const authRoutes         = require('./routes/auth');
const leaveRoutes        = require('./routes/leaves');
const userRoutes         = require('./routes/users');
const departmentRoutes   = require('./routes/departments');
const leaveTypeRoutes    = require('./routes/leaveTypes');
const notificationRoutes = require('./routes/notifications');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true } });
const PORT   = process.env.PORT || 4000;

setIo(io);

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

// Serve uploaded files
const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadDir));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/leaves',        leaveRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/departments',   departmentRoutes);
app.use('/api/leave-types',   leaveTypeRoutes);
app.use('/api/notifications', notificationRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Public stats for landing page (no auth)
app.get('/api/public/stats', async (req, res) => {
  try {
    const { User, Department, LeaveRequest } = require('./models');
    const [students, departments, leaves] = await Promise.all([
      User.count({ where: { role: 'student', isActive: true } }),
      Department.count(),
      LeaveRequest.count(),
    ]);
    res.json({ students, departments, leaves });
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

// ── Socket.io ───────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    if (userId) socket.join(`user_${userId}`);
  });
  socket.on('disconnect', () => {});
});

// ── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  // Admin
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const exists = await User.findOne({ where: { email: process.env.ADMIN_EMAIL } });
    if (!exists) {
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      await User.create({ firstName: 'System', lastName: 'Admin', email: process.env.ADMIN_EMAIL, passwordHash: hash, role: 'admin' });
      console.log('✅ Admin seeded:', process.env.ADMIN_EMAIL);
    }
  }

  // Default leave types
  const defaultTypes = [
    { name: 'Sick Leave',      code: 'SICK',    maxDays: 10, requiresDocument: true,  colorCode: '#ef4444' },
    { name: 'Casual Leave',    code: 'CASUAL',  maxDays: 7,  requiresDocument: false, colorCode: '#3b82f6' },
    { name: 'Medical Leave',   code: 'MEDICAL', maxDays: 15, requiresDocument: true,  colorCode: '#f97316' },
    { name: 'Emergency Leave', code: 'EMERG',   maxDays: 3,  requiresDocument: false, colorCode: '#8b5cf6' },
    { name: 'Study Leave',     code: 'STUDY',   maxDays: 5,  requiresDocument: false, colorCode: '#10b981' },
  ];
  for (const lt of defaultTypes) {
    const ex = await LeaveType.findOne({ where: { code: lt.code } });
    if (!ex) await LeaveType.create(lt);
  }

  // Default departments
  const defaultDepts = [
    { name: 'Computer Science',       code: 'CS' },
    { name: 'Electrical Engineering', code: 'EE' },
    { name: 'Mechanical Engineering', code: 'ME' },
    { name: 'Civil Engineering',      code: 'CE' },
    { name: 'Business Administration',code: 'BA' },
  ];
  for (const d of defaultDepts) {
    const ex = await Department.findOne({ where: { code: d.code } });
    if (!ex) {
      const dept = await Department.create(d);
      // Add default sections
      await Section.bulkCreate([
        { name: 'Section A', departmentId: dept.id },
        { name: 'Section B', departmentId: dept.id },
        { name: 'Section C', departmentId: dept.id },
      ]);
    }
  }
}

// ── Start ────────────────────────────────────────────────────────────────────
async function start() {
  try {
    await sequelize.sync({ alter: true });
    await seed();
    server.listen(PORT, () => console.log(`🚀 CLMS API → http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
