const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../model/User');

//Reboot a user's jwt if they keep coming back.
router.get('/freshToken', async (req, res) => {
  const user = await User.findOne({_id: req.user._id});
  const token = jwt.sign({_id: user._id, role: user.role}, process.env.TOKEN_SECRET, { expiresIn: '1h' });
  res.json(token);
})

module.exports = router;
