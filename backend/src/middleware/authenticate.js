'use strict';

const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization header missing or malformed. Expected: Bearer <token>',
      code: 401,
    });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Token has expired.',
        code: 403,
      });
    }
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or malformed token.',
      code: 401,
    });
  }
};

module.exports = authenticate;
