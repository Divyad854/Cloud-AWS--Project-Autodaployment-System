// controllers/userController.js
const { cognitoISP } = require('../config/aws');

exports.getProfile = async (req, res, next) => {
  try {
    const result = await cognitoISP.adminGetUser({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: req.auth.sub,
    }).promise();

    const attrs = {};
    result.UserAttributes.forEach(a => { attrs[a.Name] = a.Value; });
    res.json({ profile: { id: req.auth.sub, email: attrs.email, name: attrs.name, emailVerified: attrs.email_verified } });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    await cognitoISP.adminUpdateUserAttributes({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: req.auth.sub,
      UserAttributes: [{ Name: 'name', Value: name }],
    }).promise();
    res.json({ message: 'Profile updated' });
  } catch (err) { next(err); }
};
