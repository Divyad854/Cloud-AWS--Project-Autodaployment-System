require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

/* ===========================
   MIDDLEWARE
=========================== */
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/* ===========================
   ROUTES IMPORT
=========================== */

// ✅ CORRECT FILE (you said file is users.js)
const userRoutes = require('./routes/users');

const projectRoutes = require('./routes/projects');
const adminRoutes = require('./routes/admin');
const deployRoutes = require('./routes/deploy');
const logRoutes = require("./routes/logRoutes");
const adminLogRoutes = require("./routes/adminLogRoutes");
const notificationRoutes = require('./routes/notificationRoutes');

/* ===========================
   ROUTES USE
=========================== */

// 🔥 USER (profile + delete account)
app.use("/api/user", userRoutes);

// OLD USERS (if needed)
app.use('/api/users', userRoutes);

// PROJECTS
app.use('/api/projects', projectRoutes);

// ADMIN
app.use('/api/admin', adminRoutes);

// DEPLOY
app.use('/api/deploy', deployRoutes);

// LOGS
app.use("/api/logs", logRoutes);
app.use("/api/admin/logs", adminLogRoutes);

// NOTIFICATIONS
app.use('/api/notifications', notificationRoutes);

/* ===========================
   ERROR HANDLER
=========================== */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    message: err.message || 'Internal Server Error',
  });
});

/* ===========================
   SERVER
=========================== */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});