const Joi = require('@hapi/joi')

const registerValidation = data => {
  const schema = {
    name: Joi.string().min(2).required(),
    email: Joi.string().min(6).required().email(),
    role: Joi.string().min(2), //defaults to regular.
    password: Joi.string().min(6).required(),
    parCalories: Joi.number().integer().min(0) //defaults to 2000
  }
  return Joi.validate(data, schema)
}

//This version has nothing required so we can validate data even if it's missing for editing users.
const userChangeValidation = data => {
  const schema = {
    _id: Joi.string(),
    name: Joi.string().min(3),
    email: Joi.string().min(6).email(),
    role: Joi.string().min(2),
    parCalories: Joi.number().integer().min(0)
  }
  return Joi.validate(data, schema)
}

const loginValidation = data => {
  const schema = {
    email: Joi.string().min(6).required().email(),
    password: Joi.string().min(6).required()
  }
  return Joi.validate(data, schema)
}

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
module.exports.userChangeValidation = userChangeValidation;
