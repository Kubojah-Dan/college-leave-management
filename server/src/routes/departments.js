const express = require('express');
const router = express.Router();
const { Department, Section, User } = require('../models');
const { auth, requireRole } = require('../middleware/auth');

// GET all departments (with sections and HOD) — public so register form can load it
router.get('/', async (req, res) => {
  const depts = await Department.findAll({
    include: [
      { model: Section, as: 'sections' },
      { model: User, as: 'hod', attributes: ['id','firstName','lastName','email'] },
    ],
    order: [['name', 'ASC']],
  });
  res.json(depts);
});

// GET single department — public
router.get('/:id', async (req, res) => {
  const dept = await Department.findByPk(req.params.id, {
    include: [{ model: Section, as: 'sections' }, { model: User, as: 'hod', attributes: ['id','firstName','lastName','email'] }],
  });
  if (!dept) return res.status(404).json({ message: 'Not found' });
  res.json(dept);
});

// POST create department (admin only)
router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { name, code, description, hodId } = req.body;
    if (!name || !code) return res.status(400).json({ message: 'name and code required' });
    const dept = await Department.create({ name, code, description: description || '', hodId: hodId || null });
    res.json(dept);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') return res.status(400).json({ message: 'Department code already exists' });
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update department (admin only)
router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  const dept = await Department.findByPk(req.params.id);
  if (!dept) return res.status(404).json({ message: 'Not found' });
  const { name, code, description, hodId } = req.body;
  if (name) dept.name = name;
  if (code) dept.code = code;
  if (description !== undefined) dept.description = description;
  if (hodId !== undefined) dept.hodId = hodId || null;
  await dept.save();
  // Update HOD user role
  if (hodId) {
    await User.update({ role: 'hod', departmentId: dept.id }, { where: { id: hodId } });
  }
  res.json(dept);
});

// DELETE department (admin only)
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  const dept = await Department.findByPk(req.params.id);
  if (!dept) return res.status(404).json({ message: 'Not found' });
  await dept.destroy();
  res.json({ message: 'Deleted' });
});

// POST add section to department
router.post('/:id/sections', auth, requireRole('admin'), async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'name required' });
  const section = await Section.create({ name, departmentId: req.params.id });
  res.json(section);
});

// DELETE section
router.delete('/:id/sections/:sectionId', auth, requireRole('admin'), async (req, res) => {
  await Section.destroy({ where: { id: req.params.sectionId, departmentId: req.params.id } });
  res.json({ message: 'Deleted' });
});

module.exports = router;
