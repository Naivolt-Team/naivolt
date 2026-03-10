const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { errorResponse } = require('../utils/apiResponse');

exports.protect = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (!token) {
      return errorResponse(res, 401, 'Please log in to continue');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return errorResponse(res, 401, 'User no longer exists');
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Please log in to continue');
    }
    return errorResponse(res, 500, 'Something went wrong. Please try again');
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return errorResponse(res, 403, 'You do not have permission to do this');
};
