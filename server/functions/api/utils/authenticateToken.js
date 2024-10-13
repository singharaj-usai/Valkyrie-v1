const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token === null) {
    console.log('No token provided');
    return res.sendStatus(401);
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || 'fallback_secret_key_for_development',
    (err, user) => {
      if (err) {
        console.error('Token verification error:', err);
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    }
  );
}

module.exports = authenticateToken;
