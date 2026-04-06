const { Notification, User } = require('../models');
const { sendMail } = require('./email');

let _io = null;
function setIo(io) { _io = io; }

async function notify({ userId, type = 'info', title, message, relatedLeaveId = null, sendEmail = false }) {
  try {
    const n = await Notification.create({ userId, type, title, message, relatedLeaveId });
    if (_io) _io.to(`user_${userId}`).emit('notification', { id: n.id, type, title, message, relatedLeaveId, isRead: false, createdAt: n.createdAt });
    if (sendEmail) {
      const user = await User.findByPk(userId);
      if (user) await sendMail({ to: user.email, subject: title, html: `<p>${message}</p>` });
    }
  } catch (err) {
    console.error('[notify]', err.message);
  }
}

module.exports = { setIo, notify };
