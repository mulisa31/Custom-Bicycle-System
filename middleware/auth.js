// This file checks if the user is logged in and if they have the right role to access a route.
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// makes sure the request has a valid JWT token and loads the user from DB
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found.' });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// returns a middleware that only allows certain roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };