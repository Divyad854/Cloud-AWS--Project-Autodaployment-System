const { cognitoISP } = require('../config/aws');
const { dynamo, TABLES } = require('../config/dynamo');
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});
const sendEmail = async (to, subject, htmlContent) => {
  try {
    await transporter.sendMail({
      from: `"AutoDeployment System" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html: htmlContent, // ✅ IMPORTANT
    });

    console.log("✅ Email sent to:", to);
  } catch (err) {
    console.error("❌ Email error:", err);
  }
};
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
// 🔥 FETCH ALL PROJECTS FROM DYNAMODB
const allProjects = await dynamo.scan({
  TableName: TABLES.PROJECTS,
}).promise();

const projectItems = allProjects.Items || [];

    const users = (result.Users || [])
      .map(user => {
        const attrs = {};
        user.Attributes.forEach(attr => {
          attrs[attr.Name] = attr.Value;
        });

        const role = attrs['custom:role'] || 'user';

      const userId = user.Username;

// ✅ COUNT PROJECTS
const projectCount = projectItems.filter(
  (p) => p.partitionid === userId
).length;

return {
  id: userId,
  email: attrs.email,
  name: attrs.name,
  role,
  status: user.Enabled ? 'active' : 'blocked',
  createdAt: user.UserCreateDate,
  projectCount, // ✅ ADD THIS
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
const blockedTemplate = (name = "User") => `
<div style="font-family: Arial, sans-serif; background:#f4f6f9; padding:20px;">
  <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden; box-shadow:0 5px 15px rgba(0,0,0,0.1);">

    <div style="background:#e74c3c; color:white; padding:20px; text-align:center;">
      <h2>🚫 Account Blocked</h2>
    </div>

    <div style="padding:25px; color:#333;">
      <h3>Hello ${name},</h3>
      <p>Your account has been <b style="color:#e74c3c;">blocked</b> by the administrator.</p>

      <div style="margin:20px 0; padding:15px; background:#fff3f3; border-left:5px solid #e74c3c;">
        ⚠️ You currently cannot access the platform.
      </div>

      <p>If this is a mistake, contact support.</p>

      <p>Regards,<br/><b>AutoDeployment System</b></p>
    </div>

    <div style="background:#f1f1f1; text-align:center; padding:10px; font-size:12px;">
      © 2026 AutoDeployment System
    </div>

  </div>
</div>
`;

const unblockedTemplate = (name = "User") => `
<div style="font-family: Arial, sans-serif; background:#f4f6f9; padding:20px;">
  <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden; box-shadow:0 5px 15px rgba(0,0,0,0.1);">

    <div style="background:#2ecc71; color:white; padding:20px; text-align:center;">
      <h2>✅ Account Restored</h2>
    </div>

    <div style="padding:25px; color:#333;">
      <h3>Hello ${name},</h3>
      <p>Your account has been <b style="color:#2ecc71;">reactivated</b>.</p>

      <p>You can now login and continue using the platform.</p>

      <div style="text-align:center; margin:25px 0;">
        <a href="#" style="background:#2ecc71; color:white; padding:12px 20px; border-radius:5px; text-decoration:none;">
          Login Now
        </a>
      </div>

      <p>Welcome back 🚀</p>

      <p>Regards,<br/><b>AutoDeployment System</b></p>
    </div>

    <div style="background:#f1f1f1; text-align:center; padding:10px; font-size:12px;">
      © 2026 AutoDeployment System
    </div>

  </div>
</div>
`;



exports.blockUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const usersRes = await cognitoISP.send(
      new ListUsersCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
      })
    );

    const user = usersRes.Users.find(u => u.Username === userId);

    const email = user?.Attributes.find(a => a.Name === "email")?.Value;
    const name = user?.Attributes.find(a => a.Name === "name")?.Value;

    await cognitoISP.send(
      new AdminDisableUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: userId,
      })
    );

    if (email) {
      await sendEmail(
        email,
        "🚫 Account Blocked - AutoDeployment System",
        blockedTemplate(name)
      );
    }

    res.json({ message: "User blocked successfully" });

  } catch (err) {
    console.error("❌ BLOCK ERROR:", err);
    res.status(500).json({ message: "Failed to block user" });
  }
};



exports.unblockUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const usersRes = await cognitoISP.send(
      new ListUsersCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
      })
    );

    const user = usersRes.Users.find(u => u.Username === userId);

    const email = user?.Attributes.find(a => a.Name === "email")?.Value;
    const name = user?.Attributes.find(a => a.Name === "name")?.Value;

    await cognitoISP.send(
      new AdminEnableUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: userId,
      })
    );

    if (email) {
      await sendEmail(
        email,
        "✅ Account Restored - AutoDeployment System",
        unblockedTemplate(name)
      );
    }

    res.json({ message: "User unblocked" });

  } catch (err) {
    console.error("❌ UNBLOCK ERROR:", err);
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

    // ✅ get users from Cognito
    const usersRes = await cognitoISP.send(
      new ListUsersCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
      })
    );

    const users = usersRes.Users || [];

    // ✅ map userId → email
    const userMap = {};
    users.forEach(u => {
      const emailAttr = u.Attributes.find(a => a.Name === 'email');
      if (emailAttr) {
        userMap[u.Username] = emailAttr.Value;
      }
    });

    // ✅ attach email to each project
    const projects = (result.Items || []).map(p => ({
      ...p,
      userEmail: userMap[p.partitionid] || "Unknown",
    }));

    res.json({
      projects,
    });

  } catch (err) {
    console.error('LIST PROJECTS ERROR:', err);
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
};



/* ==============================
   DELETE PROJECT
============================== */
exports.deleteProject = async (req, res) => {
  try {
    const { projectId, partitionId } = req.params;

    await dynamo.delete({
      TableName: TABLES.PROJECTS,
      Key: {
        partitionid: partitionId, // ✅ REQUIRED
        projectid: projectId,     // ✅ REQUIRED
      },
    }).promise();

    res.json({ message: 'Project deleted successfully' });

  } catch (err) {
    console.error('DELETE PROJECT ERROR:', err);
    res.status(500).json({ message: 'Failed to delete project' });
  }
};