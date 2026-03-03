const Joi = require("joi");
const asyncHandler = require("../utils/asyncHandler");

function validate(schemaFactory, property = "body") {
  return asyncHandler(async (req, res, next) => {
    const schema =
      typeof schemaFactory === "function" ? schemaFactory(Joi) : schemaFactory;
    const value = await schema.validateAsync(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });
    req[property] = value;
    next();
  });
}

module.exports = {
  validate,
};
