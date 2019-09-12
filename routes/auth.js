const router = require('express').Router()
const User = require('../model/User');
const {registerValidation, loginValidation} = require('../validation')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

router.post('/register', async (req, res) => {
  if(req.body.role){ //Authenticate if creating new user with elevated role.
    try{
      const userRole = (await User.findOne({_id: jwt.verify(req.header('Authorization'), process.env.TOKEN_SECRET)._id})).role
      if((userRole === 'manager' && req.body.role === 'admin') ||
        !/^admin|manager$/.test(userRole)) return res.status(401).json('Insufficient role');
    } catch(e){
      console.log(e.message)
      return res.status(403).json('Access Denied')
    }
  }

  //Is the user already in the database?
  const emailExist = await User.findOne({email: req.body.email}) //indexed
  if(emailExist) return res.status(400).json(`${req.body.email} is already associated with an account.`)

  var hashedPassword
  if(req.body.password && typeof req.body.password === 'string'){ //Just in case since we didn't go through validation yet.
    const salt = await bcrypt.genSalt(10)
    hashedPassword = await bcrypt.hash(req.body.password, salt)
  }

  var userObj = {
    name: req.body.name,
    role: req.body.role || 'regular',
    email: req.body.email,
    password: hashedPassword
  }

  const { error } = registerValidation(userObj);
  if(error) return res.status(400).json(error.details[0].message);

  const user = new User(userObj);
  try {
    await user.save()
    res.json('success!');
  } catch (e) {
    res.status(400).json(e.message);
  }
});

router.post('/login', async (req, res) => {
  const { error } = loginValidation(req.body);
  if(error) return res.status(400).json(error.details[0].message);

  //Is the user already in the database?
  const user = await User.findOne({email: req.body.email}) //indexed
  if(!user) return res.status(400).json(`${req.body.email} is not associated with an account. But you can create one!`)

  const validPass = await bcrypt.compare(req.body.password, user.password)
  if(!validPass) return res.status(400).json('Password was incorrect.')

  const token = jwt.sign({_id: user._id, role: user.role}, process.env.TOKEN_SECRET, { expiresIn: '1h' })
  res.json({message: 'Login was successful!', jwt: token})
})

module.exports = router;
