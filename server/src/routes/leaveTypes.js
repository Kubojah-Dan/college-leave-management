const express = require('express');
const router = express.Router();
const { LeaveType } = require('../models');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const types = await LeaveType.findAll({ where: { isActive: true }, order: [['name', 'ASC']] });
  res.json(types);
});

router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { name, code, maxDays, requiresDocument, colorCode } = req.body;
    if (!name || !code) return res.status(400).json({ message: 'name and code required' });
    const lt = await LeaveType.create({ name, code, maxDays: maxDays || 10, requiresDocument: !!requiresDocument, colorCode: colorCode || '#3B82F6' });
    res.json(lt);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') return res.status(400).json({ message: 'Code already exists' });
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  const lt = await LeaveType.findByPk(req.params.id);
  if (!lt) return res.status(404).json({ message: 'Not found' });
  Object.assign(lt, req.body);
  await lt.save();
  res.json(lt);
});

router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  const lt = await LeaveType.findByPk(req.params.id);
  if (!lt) return res.status(404).json({ message: 'Not found' });
  lt.isActive = false;
  await lt.save();
  res.json({ message: 'Deactivated' });
});

module.exports = router;
