const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const axios = require('axios');

let pems = {};

// Load Cognito public keys
async function loadKeys() {
  if (Object.keys(pems).length > 0) return;

  const url = `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`;

  const response = await axios.get(url);

  response.data.keys.forEach(key => {
    pems[key.kid] = jwkToPem(key);
  });
}

module.exports = async (req, res, next) => {
  try {
    await loadKeys();

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'No Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token missing' });
    }

    const decoded = jwt.decode(token, { complete: true });

    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const pem = pems[decoded.header.kid];

    if (!pem) {
      return res.status(401).json({ message: 'Invalid token key' });
    }

    jwt.verify(token, pem, { algorithms: ['RS256'] }, (err, payload) => {
      if (err) {
        console.log('JWT VERIFY ERROR:', err.message);
        return res.status(401).json({ message: 'Token verification failed' });
      }

      req.user = payload;
      req.auth = payload; // keep backwards compatibility
      next();
    });

  } catch (err) {
    console.error('AUTH ERROR:', err.message);
    res.status(401).json({ message: 'Authentication failed' });
  }
};