 function successResponse(res, statusCode, message, data = {}) {
  return res.status(statusCode).json({
    status: 'success',
    message,
    ...data,
  });
}

function errorResponse(res, statusCode, message) {
  return res.status(statusCode).json({
    status: "error",
    message,
  });
}

  module.exports = { successResponse, errorResponse };
