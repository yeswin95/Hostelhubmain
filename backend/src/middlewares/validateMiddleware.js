const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(
      400,
      errors
        .array()
        .map((error) => error.msg)
        .join(", ")
    );
  }
  next();
};

module.exports = validate;
