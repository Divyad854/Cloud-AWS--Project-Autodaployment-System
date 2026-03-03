const { cognitoISP, cloudwatch } = require('../config/aws');
const { dynamo, TABLES } = require('../config/dynamo');

/* ==============================
   LIST USERS (HIDE ADMIN)
============================== */
exports.listUsers = async (req, res, next) => {
  try {
    const result = await cognitoISP.listUsers({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Limit: 60,
    }).promise();

    const users = (result.Users || [])
      .map(user => {
        const attrs = {};
        user.Attributes.forEach(attr => {
          attrs[attr.Name] = attr.Value;
        });

         const role = attrs['custom:role'] || 'user'; // ✅ default

        return {
          id: user.Username,
          email: attrs.email,
          name: attrs.name,
          role,
          status: user.Enabled ? 'active' : 'blocked',
          createdAt: user.UserCreateDate,
        };
      })
      .filter(user => user.role !== 'admin'); // hide admin

    res.json({
      count: users.length,
      users,
    });

  } catch (err) {
    console.error('LIST USERS ERROR:', err);
    next(err);
  }
};


/* BLOCK USER */
exports.blockUser = async (req, res, next) => {
  try {
    await cognitoISP.adminDisableUser({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: req.params.userId,
    }).promise();

    res.json({ message: 'User blocked successfully' });

  } catch (err) {
    console.error('BLOCK USER ERROR:', err);
    next(err);
  }
};


/* DELETE USER */
exports.deleteUser = async (req, res, next) => {
  try {
    await cognitoISP.adminDeleteUser({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: req.params.userId,
    }).promise();

    res.json({ message: 'User deleted successfully' });

  } catch (err) {
    console.error('DELETE USER ERROR:', err);
    next(err);
  }
};


/* LIST PROJECTS */
exports.listAllProjects = async (req, res, next) => {
  try {
    const result = await dynamo.scan({
      TableName: TABLES.PROJECTS,
    }).promise();

    res.json({
      count: (result.Items || []).length,
      projects: result.Items || [],
    });

  } catch (err) {
    console.error('LIST PROJECTS ERROR:', err);
    next(err);
  }
};


/* STOP PROJECT */
exports.stopProject = async (req, res, next) => {
  try {
    const fetch = require('node-fetch');

    try {
      await fetch(
        `http://${process.env.EC2_HOST}:8080/container/stop/${req.params.id}`,
        { method: 'POST' }
      );
    } catch (err) {}

    await dynamo.update({
      TableName: TABLES.PROJECTS,
      Key: { id: req.params.id },
      UpdateExpression: 'set #s = :s',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'stopped' },
    }).promise();

    res.json({ message: 'Project stopped successfully' });

  } catch (err) {
    console.error('STOP PROJECT ERROR:', err);
    next(err);
  }
};


/* DELETE PROJECT */
exports.deleteProject = async (req, res, next) => {
  try {
    await dynamo.delete({
      TableName: TABLES.PROJECTS,
      Key: { id: req.params.id },
    }).promise();

    res.json({ message: 'Project deleted successfully' });

  } catch (err) {
    console.error('DELETE PROJECT ERROR:', err);
    next(err);
  }
};


/* SYSTEM LOGS */
exports.getSystemLogs = async (req, res) => {
  try {
    const result = await cloudwatch.filterLogEvents({
      logGroupName:
        process.env.CLOUDWATCH_LOG_GROUP || '/cloudlaunch/system',
      limit: 200,
    }).promise();

    const logs = (result.events || [])
      .map(e => `[${new Date(e.timestamp).toISOString()}] ${e.message}`)
      .join('\n');

    res.json({ logs: logs || 'No system logs found.' });

  } catch (err) {
    console.error('SYSTEM LOG ERROR:', err);
    res.json({ logs: 'System logs unavailable.' });
  }
};