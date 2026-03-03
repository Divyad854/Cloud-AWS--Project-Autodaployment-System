// // controllers/adminController.js
// const { cognitoISP, cloudwatch } = require('../config/aws');
// const { dynamo, TABLES } = require('../config/dynamo');

// exports.listUsers = async (req, res, next) => {
//   try {
//     const result = await cognitoISP.listUsers({
//       UserPoolId: process.env.COGNITO_USER_POOL_ID,
//       Limit: 60,
//     }).promise();

//     const users = (result.Users || []).map(u => {
//       const attrs = {};
//       u.Attributes.forEach(a => { attrs[a.Name] = a.Value; });
//       return {
//         id: attrs.sub,
//         email: attrs.email,
//         name: attrs.name,
//         status: u.Enabled ? 'active' : 'blocked',
//         createdAt: u.UserCreateDate,
//       };
//     });
//     res.json({ users });
//   } catch (err) { next(err); }
// };

// exports.blockUser = async (req, res, next) => {
//   try {
//     await cognitoISP.adminDisableUser({
//       UserPoolId: process.env.COGNITO_USER_POOL_ID,
//       Username: req.params.userId,
//     }).promise();
//     res.json({ message: 'User blocked' });
//   } catch (err) { next(err); }
// };

// exports.deleteUser = async (req, res, next) => {
//   try {
//     await cognitoISP.adminDeleteUser({
//       UserPoolId: process.env.COGNITO_USER_POOL_ID,
//       Username: req.params.userId,
//     }).promise();
//     res.json({ message: 'User deleted' });
//   } catch (err) { next(err); }
// };

// exports.listAllProjects = async (req, res, next) => {
//   try {
//     const result = await dynamo.scan({ TableName: TABLES.PROJECTS }).promise();
//     res.json({ projects: result.Items || [] });
//   } catch (err) { next(err); }
// };

// exports.stopProject = async (req, res, next) => {
//   try {
//     const fetch = require('node-fetch');
//     try {
//       await fetch(`http://${process.env.EC2_HOST}:8080/container/stop/${req.params.id}`, { method: 'POST' });
//     } catch {}
//     await dynamo.update({
//       TableName: TABLES.PROJECTS,
//       Key: { id: req.params.id },
//       UpdateExpression: 'set #s = :s',
//       ExpressionAttributeNames: { '#s': 'status' },
//       ExpressionAttributeValues: { ':s': 'stopped' },
//     }).promise();
//     res.json({ message: 'Project stopped' });
//   } catch (err) { next(err); }
// };

// exports.deleteProject = async (req, res, next) => {
//   try {
//     try {
//       const fetch = require('node-fetch');
//       await fetch(`http://${process.env.EC2_HOST}:8080/container/stop/${req.params.id}`, { method: 'POST' });
//     } catch {}
//     await dynamo.delete({ TableName: TABLES.PROJECTS, Key: { id: req.params.id } }).promise();
//     res.json({ message: 'Project deleted' });
//   } catch (err) { next(err); }
// };

// exports.getSystemLogs = async (req, res, next) => {
//   try {
//     const result = await cloudwatch.filterLogEvents({
//       logGroupName: process.env.CLOUDWATCH_LOG_GROUP || '/cloudlaunch/system',
//       limit: 200,
//     }).promise();
//     const logs = (result.events || [])
//       .map(e => `[${new Date(e.timestamp).toISOString()}] ${e.message}`)
//       .join('');
//     res.json({ logs: logs || 'No system logs found.' });
//   } catch {
//     res.json({ logs: 'System logs unavailable. Check CloudWatch configuration.' });
//   }
// };
// controllers/adminController.js
const { cognitoISP, cloudwatch } = require('../config/aws');
const { dynamo, TABLES } = require('../config/dynamo');

/* ===============================
   LIST USERS (ADMIN ONLY)
================================ */
exports.listUsers = async (req, res, next) => {
  try {
    // 🔐 SAFETY CHECK
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }

    const result = await cognitoISP.listUsers({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Limit: 60,
    }).promise();

    const users = (result.Users || []).map(u => {
      const attrs = {};
      u.Attributes.forEach(a => {
        attrs[a.Name] = a.Value;
      });

      return {
        id: u.Username,               // important
        email: attrs.email,
        name: attrs.name,
        role: attrs['custom:role'] || 'user',
        status: u.Enabled ? 'active' : 'blocked',
        createdAt: u.UserCreateDate,
      };
    });

    // 👉 ADMIN ko sab users dikhenge (admin + user)
    res.json({ users });

  } catch (err) {
    next(err);
  }
};

/* ===============================
   BLOCK USER (ADMIN ONLY)
================================ */
exports.blockUser = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }

    await cognitoISP.adminDisableUser({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: req.params.userId,
    }).promise();

    res.json({ message: 'User blocked successfully' });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   DELETE USER (ADMIN ONLY)
================================ */
exports.deleteUser = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }

    await cognitoISP.adminDeleteUser({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: req.params.userId,
    }).promise();

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   LIST ALL PROJECTS (ADMIN ONLY)
================================ */
exports.listAllProjects = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }

    const result = await dynamo.scan({
      TableName: TABLES.PROJECTS
    }).promise();

    res.json({ projects: result.Items || [] });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   STOP PROJECT (ADMIN ONLY)
================================ */
exports.stopProject = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }

    const fetch = require('node-fetch');

    try {
      await fetch(
        `http://${process.env.EC2_HOST}:8080/container/stop/${req.params.id}`,
        { method: 'POST' }
      );
    } catch {}

    await dynamo.update({
      TableName: TABLES.PROJECTS,
      Key: { id: req.params.id },
      UpdateExpression: 'set #s = :s',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'stopped' },
    }).promise();

    res.json({ message: 'Project stopped successfully' });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   DELETE PROJECT (ADMIN ONLY)
================================ */
exports.deleteProject = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }

    const fetch = require('node-fetch');

    try {
      await fetch(
        `http://${process.env.EC2_HOST}:8080/container/stop/${req.params.id}`,
        { method: 'POST' }
      );
    } catch {}

    await dynamo.delete({
      TableName: TABLES.PROJECTS,
      Key: { id: req.params.id }
    }).promise();

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   SYSTEM LOGS (ADMIN ONLY)
================================ */
exports.getSystemLogs = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }

    const result = await cloudwatch.filterLogEvents({
      logGroupName:
        process.env.CLOUDWATCH_LOG_GROUP || '/cloudlaunch/system',
      limit: 200,
    }).promise();

    const logs = (result.events || [])
      .map(e => `[${new Date(e.timestamp).toISOString()}] ${e.message}`)
      .join('\n');

    res.json({ logs: logs || 'No system logs found.' });
  } catch {
    res.json({
      logs: 'System logs unavailable. Check CloudWatch configuration.'
    });
  }
};