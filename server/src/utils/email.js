const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  // Allow disabling email sending in development/test by setting MAIL_DISABLED=true
  if (process.env.MAIL_DISABLED === 'true') return null;
  if (!transporter && process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

async function sendMail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) return; // SMTP not configured – skip silently
  try {
    await t.sendMail({ from: process.env.FROM_EMAIL || 'noreply@college.edu', to, subject, html });
  } catch (err) {
    console.error('[email]', err.message);
  }
}

module.exports = { sendMail };
