function success(message, data = null, statusCode = 200) {
  return {
    success: true,
    message,
    data,
    statusCode,
  };
}

function error(message, statusCode = 500, errors = null) {
  return {
    success: false,
    message,
    errors,
    statusCode,
  };
}

module.exports = { success, error };
