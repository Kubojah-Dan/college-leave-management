require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('./src/models');

(async function() {
  try {
    await sequelize.sync();
    const email = process.env.ADMIN_EMAIL || 'admin@college.edu';
    const pw = process.env.ADMIN_PASSWORD || 'admin123';
    const existing = await User.findOne({ where: { email } });
    if (!existing) {
      const passwordHash = await bcrypt.hash(pw, 10);
      await User.create({ firstName: 'Admin', lastName: '', email, passwordHash, role: 'admin' });
      console.log('Created admin user:', email, 'password:', pw);
    } else {
      console.log('Admin already exists:', email);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
