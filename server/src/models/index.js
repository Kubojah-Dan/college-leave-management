const { Sequelize, DataTypes } = require('sequelize');

// ── Database Connection ─────────────────────────────────────────────────────
// Always uses PostgreSQL via DATABASE_URL.
// For local dev: set DATABASE_URL=postgresql://... in server/.env
// For Render:    DATABASE_URL is injected automatically by Render.
if (!process.env.DATABASE_URL) {
  console.error('❌  DATABASE_URL is not set. Please add it to your .env file.');
  process.exit(1);
}

// Detect Render / any remote host by checking for non-localhost hostname
const isRemote = !process.env.DATABASE_URL.includes('localhost') &&
  !process.env.DATABASE_URL.includes('127.0.0.1');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  ...(isRemote && {
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,   // required by Render's managed Postgres
      },
    },
  }),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// ── USERS ──────────────────────────────────────────────────────────────────
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'principal', 'hod', 'student'), allowNull: false, defaultValue: 'student' },
  firstName: { type: DataTypes.STRING, defaultValue: '' },
  lastName: { type: DataTypes.STRING, defaultValue: '' },
  phone: { type: DataTypes.STRING, defaultValue: '' },
  avatarUrl: { type: DataTypes.STRING, defaultValue: '' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  departmentId: { type: DataTypes.INTEGER, allowNull: true },
  sectionId: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'users' });

// ── DEPARTMENTS ────────────────────────────────────────────────────────────
const Department = sequelize.define('Department', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, defaultValue: '' },
  hodId: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'departments' });

// ── SECTIONS ───────────────────────────────────────────────────────────────
const Section = sequelize.define('Section', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  departmentId: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'sections' });

// ── LEAVE TYPES ────────────────────────────────────────────────────────────
const LeaveType = sequelize.define('LeaveType', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  maxDays: { type: DataTypes.INTEGER, defaultValue: 10 },
  requiresDocument: { type: DataTypes.BOOLEAN, defaultValue: false },
  colorCode: { type: DataTypes.STRING, defaultValue: '#3B82F6' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'leave_types' });

// ── LEAVE REQUESTS ─────────────────────────────────────────────────────────
const LeaveRequest = sequelize.define('LeaveRequest', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  leaveTypeId: { type: DataTypes.INTEGER, allowNull: true },
  leaveType: { type: DataTypes.STRING, defaultValue: 'Sick' },
  startDate: { type: DataTypes.DATEONLY, allowNull: false },
  endDate: { type: DataTypes.DATEONLY, allowNull: false },
  totalDays: { type: DataTypes.INTEGER, defaultValue: 1 },
  reason: { type: DataTypes.TEXT, defaultValue: '' },
  status: { type: DataTypes.ENUM('pending_hod', 'pending_principal', 'approved', 'rejected', 'cancelled'), defaultValue: 'pending_hod' },
  hodId: { type: DataTypes.INTEGER, allowNull: true },
  principalId: { type: DataTypes.INTEGER, allowNull: true },
  hodRemarks: { type: DataTypes.TEXT, defaultValue: '' },
  principalRemarks: { type: DataTypes.TEXT, defaultValue: '' },
  hodActionAt: { type: DataTypes.DATE, allowNull: true },
  principalActionAt: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'leave_requests' });

// ── LEAVE DOCUMENTS ────────────────────────────────────────────────────────
const LeaveDocument = sequelize.define('LeaveDocument', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  leaveRequestId: { type: DataTypes.INTEGER, allowNull: false },
  fileName: { type: DataTypes.STRING, allowNull: false },
  filePath: { type: DataTypes.STRING, allowNull: false },
  fileType: { type: DataTypes.STRING, defaultValue: '' },
  fileSize: { type: DataTypes.INTEGER, defaultValue: 0 },
  uploadedBy: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'leave_documents' });

// ── NOTIFICATIONS ──────────────────────────────────────────────────────────
const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.STRING, defaultValue: 'info' },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  relatedLeaveId: { type: DataTypes.INTEGER, allowNull: true },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'notifications' });

// ── ASSOCIATIONS ───────────────────────────────────────────────────────────
Department.hasMany(Section, { foreignKey: 'departmentId', as: 'sections' });
Section.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

Department.belongsTo(User, { foreignKey: 'hodId', as: 'hod' });
User.hasOne(Department, { foreignKey: 'hodId', as: 'managedDepartment' });

User.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
User.belongsTo(Section, { foreignKey: 'sectionId', as: 'section' });

User.hasMany(LeaveRequest, { foreignKey: 'studentId', as: 'leaveRequests' });
LeaveRequest.belongsTo(User, { as: 'student', foreignKey: 'studentId' });
LeaveRequest.belongsTo(User, { as: 'hod', foreignKey: 'hodId' });
LeaveRequest.belongsTo(User, { as: 'principal', foreignKey: 'principalId' });
LeaveRequest.belongsTo(LeaveType, { as: 'leaveTypeInfo', foreignKey: 'leaveTypeId' });

LeaveRequest.hasMany(LeaveDocument, { foreignKey: 'leaveRequestId', as: 'documents' });
LeaveDocument.belongsTo(LeaveRequest, { foreignKey: 'leaveRequestId' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId' });

module.exports = { sequelize, User, Department, Section, LeaveType, LeaveRequest, LeaveDocument, Notification };
