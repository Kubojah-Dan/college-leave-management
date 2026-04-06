const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Op } = require('sequelize');
const { auth, requireRole } = require('../middleware/auth');
const { User, LeaveRequest, LeaveDocument, LeaveType, Department } = require('../models');
const { notify } = require('../utils/notify');
const { generateLeavePDF } = require('../utils/pdf');

// ── Multer setup ────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`),
});
const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_MB) || 10) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// ── Helpers ─────────────────────────────────────────────────────────────────
function daysBetween(start, end) {
  const s = new Date(start), e = new Date(end);
  return Math.max(1, Math.round((e - s) / 86400000) + 1);
}

const INCLUDE_FULL = [
  { model: User, as: 'student', attributes: ['id','firstName','lastName','email','phone','departmentId','sectionId'], include: [{ association: 'department' }, { association: 'section' }] },
  { model: User, as: 'hod', attributes: ['id','firstName','lastName','email'] },
  { model: User, as: 'principal', attributes: ['id','firstName','lastName','email'] },
  { model: LeaveType, as: 'leaveTypeInfo' },
  { model: LeaveDocument, as: 'documents' },
];

// ── POST /api/leaves  – student submits leave ───────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { leaveType, leaveTypeId, startDate, endDate, reason } = req.body;
    if (!startDate || !endDate) return res.status(400).json({ message: 'Dates required' });
    const totalDays = daysBetween(startDate, endDate);
    const leave = await LeaveRequest.create({
      studentId: req.user.id, leaveType: leaveType || 'Sick', leaveTypeId: leaveTypeId || null,
      startDate, endDate, totalDays, reason: reason || '', status: 'pending_hod',
    });

    // Notify HOD of the student's department
    const student = await User.findByPk(req.user.id, { include: [{ association: 'department' }] });
    if (student?.departmentId) {
      const dept = await Department.findByPk(student.departmentId);
      if (dept?.hodId) {
        await notify({ userId: dept.hodId, type: 'approval_required', title: 'New Leave Request', message: `${student.firstName} ${student.lastName} submitted a ${leaveType} leave request.`, relatedLeaveId: leave.id, sendEmail: true });
      }
    }
    res.json(leave);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating leave' });
  }
});

// ── GET /api/leaves  – list leaves ─────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { status, from, to } = req.query;
    const where = {};
    if (status) where.status = status;
    if (from || to) where.startDate = {};
    if (from) where.startDate[Op.gte] = from;
    if (to) where.startDate[Op.lte] = to;

    if (req.user.role === 'student') {
      where.studentId = req.user.id;
    } else if (req.user.role === 'hod') {
      // HOD sees leaves from their department students
      const dept = await Department.findOne({ where: { hodId: req.user.id } });
      if (dept) {
        const students = await User.findAll({ where: { departmentId: dept.id, role: 'student' }, attributes: ['id'] });
        where.studentId = { [Op.in]: students.map(s => s.id) };
      }
    }
    // admin & principal see all

    const leaves = await LeaveRequest.findAll({ where, include: INCLUDE_FULL, order: [['createdAt', 'DESC']] });
    res.json(leaves);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching leaves' });
  }
});

// ── GET /api/leaves/stats  – dashboard stats ────────────────────────────────
router.get('/stats', auth, async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'student') where.studentId = req.user.id;
    else if (req.user.role === 'hod') {
      const dept = await Department.findOne({ where: { hodId: req.user.id } });
      if (dept) {
        const students = await User.findAll({ where: { departmentId: dept.id, role: 'student' }, attributes: ['id'] });
        where.studentId = { [Op.in]: students.map(s => s.id) };
      }
    }
    const [total, pending_hod, pending_principal, approved, rejected] = await Promise.all([
      LeaveRequest.count({ where }),
      LeaveRequest.count({ where: { ...where, status: 'pending_hod' } }),
      LeaveRequest.count({ where: { ...where, status: 'pending_principal' } }),
      LeaveRequest.count({ where: { ...where, status: 'approved' } }),
      LeaveRequest.count({ where: { ...where, status: 'rejected' } }),
    ]);
    res.json({ total, pending_hod, pending_principal, approved, rejected });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// ── GET /api/leaves/:id ─────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  const leave = await LeaveRequest.findByPk(req.params.id, { include: INCLUDE_FULL });
  if (!leave) return res.status(404).json({ message: 'Not found' });
  if (leave.studentId !== req.user.id && !['admin','hod','principal'].includes(req.user.role))
    return res.status(403).json({ message: 'Forbidden' });
  res.json(leave);
});

// ── POST /api/leaves/:id/documents  – upload document ──────────────────────
router.post('/:id/documents', auth, upload.single('file'), async (req, res) => {
  try {
    const leave = await LeaveRequest.findByPk(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Not found' });
    if (leave.studentId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const doc = await LeaveDocument.create({
      leaveRequestId: leave.id, fileName: req.file.originalname,
      filePath: req.file.filename, fileType: req.file.mimetype,
      fileSize: req.file.size, uploadedBy: req.user.id,
    });
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

// ── GET /api/leaves/:id/documents/:docId  – download document ──────────────
router.get('/:id/documents/:docId', auth, async (req, res) => {
  const doc = await LeaveDocument.findByPk(req.params.docId);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  const filePath = path.join(uploadDir, doc.filePath);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found on disk' });
  res.download(filePath, doc.fileName);
});

// ── POST /api/leaves/:id/approve  – HOD or Principal approves ──────────────
router.post('/:id/approve', auth, requireRole('hod', 'principal', 'admin'), async (req, res) => {
  try {
    const leave = await LeaveRequest.findByPk(req.params.id, { include: [{ model: User, as: 'student' }] });
    if (!leave) return res.status(404).json({ message: 'Not found' });
    const { remarks } = req.body;

    if (req.user.role === 'hod' && leave.status === 'pending_hod') {
      leave.status = 'pending_principal';
      leave.hodId = req.user.id;
      leave.hodRemarks = remarks || '';
      leave.hodActionAt = new Date();
      await leave.save();
      // Notify student
      await notify({ userId: leave.studentId, type: 'leave_status', title: 'Leave Forwarded to Principal', message: `Your ${leave.leaveType} leave has been approved by HOD and forwarded to the Principal.`, relatedLeaveId: leave.id, sendEmail: true });
      // Notify principal(s)
      const principals = await User.findAll({ where: { role: 'principal', isActive: true } });
      for (const p of principals) {
        await notify({ userId: p.id, type: 'approval_required', title: 'Leave Awaiting Your Approval', message: `${leave.student.firstName} ${leave.student.lastName}'s ${leave.leaveType} leave is pending your approval.`, relatedLeaveId: leave.id, sendEmail: true });
      }
    } else if ((req.user.role === 'principal' || req.user.role === 'admin') && (leave.status === 'pending_principal' || leave.status === 'pending_hod')) {
      leave.status = 'approved';
      leave.principalId = req.user.id;
      leave.principalRemarks = remarks || '';
      leave.principalActionAt = new Date();
      await leave.save();
      await notify({ userId: leave.studentId, type: 'leave_status', title: '✅ Leave Approved', message: `Your ${leave.leaveType} leave (${leave.startDate} – ${leave.endDate}) has been approved.`, relatedLeaveId: leave.id, sendEmail: true });
    } else {
      return res.status(400).json({ message: 'Cannot approve at this stage' });
    }
    res.json(leave);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/leaves/:id/reject  – HOD or Principal rejects ────────────────
router.post('/:id/reject', auth, requireRole('hod', 'principal', 'admin'), async (req, res) => {
  try {
    const leave = await LeaveRequest.findByPk(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Not found' });
    const { remarks } = req.body;
    leave.status = 'rejected';
    if (req.user.role === 'hod') { leave.hodId = req.user.id; leave.hodRemarks = remarks || ''; leave.hodActionAt = new Date(); }
    else { leave.principalId = req.user.id; leave.principalRemarks = remarks || ''; leave.principalActionAt = new Date(); }
    await leave.save();
    await notify({ userId: leave.studentId, type: 'leave_status', title: '❌ Leave Rejected', message: `Your ${leave.leaveType} leave has been rejected. Remarks: ${remarks || 'None'}`, relatedLeaveId: leave.id, sendEmail: true });
    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/leaves/:id/cancel  – student cancels ─────────────────────────
router.post('/:id/cancel', auth, async (req, res) => {
  const leave = await LeaveRequest.findByPk(req.params.id);
  if (!leave) return res.status(404).json({ message: 'Not found' });
  if (leave.studentId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  if (!['pending_hod','pending_principal'].includes(leave.status)) return res.status(400).json({ message: 'Cannot cancel at this stage' });
  leave.status = 'cancelled';
  await leave.save();
  res.json(leave);
});

// ── GET /api/leaves/:id/pdf ─────────────────────────────────────────────────
router.get('/:id/pdf', auth, async (req, res) => {
  const leave = await LeaveRequest.findByPk(req.params.id, { include: INCLUDE_FULL });
  if (!leave) return res.status(404).json({ message: 'Not found' });
  if (leave.studentId !== req.user.id && !['admin','hod','principal'].includes(req.user.role))
    return res.status(403).json({ message: 'Forbidden' });
  generateLeavePDF(res, leave, leave.student);
});

module.exports = router;
