const AdminLog = require('../models/AdminLog');
const LoginAlert = require('../models/LoginAlert');
const SuspiciousActivity = require('../models/SuspiciousActivity');

exports.getAdminLogs = async (req, res) => {
  const logs = await AdminLog.getAll({ limit: req.query.limit, skip: req.query.skip });
  res.json({ success: true, logs });
};

exports.getLoginAlerts = async (req, res) => {
  const alerts = await LoginAlert.getAll({ limit: req.query.limit, skip: req.query.skip });
  res.json({ success: true, alerts });
};

exports.getSuspiciousActivities = async (req, res) => {
  const activities = await SuspiciousActivity.getAll({ limit: req.query.limit, skip: req.query.skip });
  res.json({ success: true, activities });
};
