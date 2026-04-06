const express = require('express');
const router = express.Router();
const { Notification } = require('../models');
const { auth } = require('../middleware/auth');

// GET my notifications
router.get('/', auth, async (req, res) => {
  const notifications = await Notification.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
    limit: 50,
  });
  res.json(notifications);
});

// PUT mark as read
router.put('/:id/read', auth, async (req, res) => {
  const n = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!n) return res.status(404).json({ message: 'Not found' });
  n.isRead = true;
  await n.save();
  res.json(n);
});

// PUT mark all as read
router.put('/read-all', auth, async (req, res) => {
  await Notification.update({ isRead: true }, { where: { userId: req.user.id, isRead: false } });
  res.json({ message: 'All marked as read' });
});

module.exports = router;
