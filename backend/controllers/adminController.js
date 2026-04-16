const { cognitoISP, cloudwatch } = require('../config/aws');
const { dynamo, TABLES } = require('../config/dynamo');

const resolveRuntimeHost = (runtime) => {
  const normalized = String(runtime || '').trim().toLowerCase();
  if (normalized.includes('python')) return process.env.EC2_HOST_PYTHON || 'python-ec2';
  if (normalized.includes('java')) return process.env.EC2_HOST_JAVA || 'javadeploy';
  if (normalized.includes('node')) return process.env.EC2_HOST_NODE || 'deploy';
  return process.env.EC2_HOST || 'deploy';
};

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
exports.unblockUser = async (req, res) => {

  try {

    await cognitoISP.adminEnableUser({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: req.params.id
    }).promise();

    res.json({
      message: "User unblocked"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to unblock user"
    });

  }

};
exports.deleteUser = async (req, res, next) => {
  try {

    const userId = req.params.userId;

    // Delete from Cognito
    await cognitoISP.adminDeleteUser({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: userId,
    }).promise();

    // Delete from DynamoDB
    await dynamo.delete({
      TableName: TABLES.USERS,
      Key: { id: userId }
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
    const result = await dynamo.get({ TableName: TABLES.PROJECTS, Key: { id: req.params.id } }).promise();
    const runtimeHost = result?.Item?.runtimeHost || resolveRuntimeHost(result?.Item?.runtime);

    try {
      await fetch(
        `http://${runtimeHost}:8080/container/stop/${req.params.id}`,
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