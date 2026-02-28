// middleware/auth.js
const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const region = process.env.AWS_REGION || 'us-east-1';
const userPoolId = process.env.COGNITO_USER_POOL_ID;
const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
const jwksUri = `${issuer}/.well-known/jwks.json`;

const authMiddleware = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true, rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri,
  }),
  audience: process.env.COGNITO_CLIENT_ID,
  issuer,
  algorithms: ['RS256'],
});

const adminMiddleware = (req, res, next) => {
  const groups = req.auth?.['cognito:groups'] || [];
  if (!groups.includes('admin')) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };
