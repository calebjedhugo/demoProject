const Joi = require('@hapi/joi')

module.exports = {
  get: data => {
    const schema = {
      userId: Joi.string().required(),
      fromDate: Joi.date().required(),
      toDate: Joi.date().required()
    }
    return Joi.validate(data, schema)
  },
  post: data => {
    const schema = {
      userId: Joi.string().required(),
      description: Joi.string().required(),
      calories: Joi.number().integer().min(0).required(),
      date: Joi.date().required(), //having date and time seperate will make filtering easier.
      time: Joi.number().min(0).max(1439).required() //minutes in a day. Then we can filter using intergers.
    }
    return Joi.validate(data, schema)
  },
  patch: data => {
    const schema = {
      _id: Joi.string(),
      userId: Joi.string(),
      description: Joi.string(),
      calories: Joi.number().integer().min(0),
      date: Joi.date(), //having date and time seperate will make filtering easier.
      time: Joi.number().min(0).max(1439) //minutes in a day. Then we can filter using intergers.
    }
    return Joi.validate(data, schema)
  },
  delete: data => {
    const schema = {
      _id: Joi.string().required(),
      userId: Joi.string().required()
    }
    return Joi.validate(data, schema)
  }
}
