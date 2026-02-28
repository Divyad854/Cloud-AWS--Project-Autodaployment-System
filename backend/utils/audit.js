// utils/audit.js
const { dynamo, TABLES } = require('../config/dynamo');
const { v4: uuidv4 } = require('uuid');

exports.auditLog = async (userId, action, resourceId, metadata = {}) => {
  try {
    await dynamo.put({
      TableName: TABLES.AUDIT,
      Item: {
        id: uuidv4(),
        userId,
        action,
        resourceId,
        metadata,
        timestamp: new Date().toISOString(),
      },
    }).promise();
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};
