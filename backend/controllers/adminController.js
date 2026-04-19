const { cognitoISP } = require('../config/aws');
const { dynamo, TABLES } = require('../config/dynamo');

const {
  ListUsersCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminDeleteUserCommand
} = require('@aws-sdk/client-cognito-identity-provider');

const resolveRuntimeHost = (runtime) => {
  const normalized = String(runtime || '').trim().toLowerCase();
  if (normalized.includes('python')) return process.env.EC2_HOST_PYTHON || 'python-ec2';
  if (normalized.includes('java')) return process.env.EC2_HOST_JAVA || 'javadeploy';
  if (normalized.includes('node')) return process.env.EC2_HOST_NODE || 'deploy';
  return process.env.EC2_HOST || 'deploy';
};

/* ==============================
   LIST USERS (FIXED v3)
============================== */
exports.listUsers = async (req, res) => {
  try {
    const command = new ListUsersCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Limit: 60,
    });

    const result = await cognitoISP.send(command);

    const users = (result.Users || [])
      .map(user => {
        const attrs = {};
        user.Attributes.forEach(attr => {
          attrs[attr.Name] = attr.Value;
        });

        const role = attrs['custom:role'] || 'user';

        return {
          id: user.Username,
          email: attrs.email,
          name: attrs.name,
          role,
          status: user.Enabled ? 'active' : 'blocked',
          createdAt: user.UserCreateDate,
        };
      })
      .filter(user => user.role !== 'admin');

    res.json({
      count: users.length,
      users,
    });

  } catch (err) {
    console.error('LIST USERS ERROR:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

/* ==============================
   BLOCK USER (v3)
============================== */
exports.blockUser = async (req, res) => {
  try {
    await cognitoISP.send(
      new AdminDisableUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: req.params.userId,
      })
    );

    res.json({ message: 'User blocked successfully' });

  } catch (err) {
    console.error('BLOCK USER ERROR:', err);
    res.status(500).json({ message: 'Failed to block user' });
  }
};

/* ==============================
   UNBLOCK USER (v3)
============================== */
exports.unblockUser = async (req, res) => {
  try {
    await cognitoISP.send(
      new AdminEnableUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: req.params.id,
      })
    );

    res.json({ message: "User unblocked" });

  } catch (err) {
    console.error('UNBLOCK USER ERROR:', err);
    res.status(500).json({ message: "Failed to unblock user" });
  }
};

/* ==============================
   DELETE USER (v3)
============================== */
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    await cognitoISP.send(
      new AdminDeleteUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: userId,
      })
    );

    await dynamo.delete({
      TableName: TABLES.USERS,
      Key: { id: userId }
    }).promise();

    res.json({ message: 'User deleted successfully' });

  } catch (err) {
    console.error('DELETE USER ERROR:', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

/* ==============================
   LIST PROJECTS
============================== */
exports.listAllProjects = async (req, res) => {
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
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
};

/* ==============================
   STOP PROJECT
============================== */
exports.stopProject = async (req, res) => {
  try {
    const fetch = require('node-fetch');

    const result = await dynamo.get({
      TableName: TABLES.PROJECTS,
      Key: { partitionid: req.params.id }
    }).promise();

    const runtimeHost =
      result?.Item?.runtimeHost ||
      resolveRuntimeHost(result?.Item?.runtime);

    try {
      await fetch(
        `http://${runtimeHost}:8080/container/stop/${req.params.id}`,
        { method: 'POST' }
      );
    } catch (err) {}

    await dynamo.update({
      TableName: TABLES.PROJECTS,
      Key: { partitionid: req.params.id },
      UpdateExpression: 'set #s = :s',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'stopped' },
    }).promise();

    res.json({ message: 'Project stopped successfully' });

  } catch (err) {
    console.error('STOP PROJECT ERROR:', err);
    res.status(500).json({ message: 'Failed to stop project' });
  }
};

/* ==============================
   DELETE PROJECT
============================== */
exports.deleteProject = async (req, res) => {
  try {
    await dynamo.delete({
      TableName: TABLES.PROJECTS,
      Key: { partitionid: req.params.id },
    }).promise();

    res.json({ message: 'Project deleted successfully' });

  } catch (err) {
    console.error('DELETE PROJECT ERROR:', err);
    res.status(500).json({ message: 'Failed to delete project' });
  }
};