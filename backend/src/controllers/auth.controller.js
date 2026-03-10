const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { successResponse, errorResponse } = require("../utils/apiResponse");

function toUserPayload(user) {
  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
}

exports.register = async (req, res, next) => {
  try {
    const { name, username, email, phone, password } = req.body;

    const user = await User.create({ name, username, email, phone, password });

  const token = user.generateToken();

    return successResponse(res, 201, "Account created", {
      token,
      user: toUserPayload(user),
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email, { select: "+password" });
    if (!user) {
      return errorResponse(res, 401, "Invalid email or password");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, "Invalid email or password");
    }

    const token = user.generateToken();
    return successResponse(res, 200, "Logged in", {
      token,
      user: toUserPayload(user),
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    return successResponse(res, 200, "Success", {
      user: toUserPayload(req.user),
    });
  } catch (err) {
    next(err);
  }
};
