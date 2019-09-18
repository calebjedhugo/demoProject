const Joi = require('@hapi/joi')

const skipMaxSearchValidation = data => {
  const schema = {
    skip: Joi.number().min(0).required(),
    max: Joi.number().min(1).max(100).required(),
    search: Joi.string().required()
  }
}

module.exports.skipMaxSearchValidation = skipMaxSearchValidation;
