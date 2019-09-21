const User = require('../model/User');
const jwt = require('jsonwebtoken')

module.exports = (_id) => {
  return new Promise(async (resolve, reject) => {
    try{
      const user = await User.findOne({_id: _id});
      const token = jwt.sign({_id: user._id, role: user.role}, process.env.TOKEN_SECRET, { expiresIn: process.env.jwtExp || '1h' });
      resolve(token)
    } catch(e) {
      reject(e.message)
    }
  })
}
