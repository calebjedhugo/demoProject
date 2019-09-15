const router = require('express').Router();
const User = require('../model/User');
const Meal = require('../model/Meal'); //for clearing out deleted user's meals. 

const {userChangeValidation, skipMaxSearchValidation} = require('../validation')

router.get('/getUserData', async (req, res) => {
  var userData = await User.findOne({_id: req.user._id}).select({password: 0, __v: 0})
  res.json(userData);
})

router.get(/^\/getAllUserData\??.*/, async (req, res) => {
  const requesterRole = (await User.findOne({_id: req.user._id})).role
  if(!/^(admin|manager)$/.test(requesterRole)){
    return res.status(401).json('Insufficient Role')
  }

  const error = skipMaxSearchValidation(req.query)
  if(error) return res.status(400).json(error.details[0].message);

  const orQuery = {'$or': [
    {name: {$regex: new RegExp(req.query.search, 'i')}},
    {email: {$regex: new RegExp(req.query.search, 'i')}}
  ]}

  try{
    const count = await User.find(orQuery).countDocuments()
    const users = await User.find(orQuery).sort({date: -1})
      .select({password: 0, parCalories: 0, __v: 0})
      .skip(Number(req.query.skip))
      .limit(Number(req.query.max));
    res.json({users: users, count: count})
  } catch(e){
    res.status(400).json(e.message)
  }
})

//This is called to get a user's complete data when an admin clicks on a "Edit Meals Data" button.
router.post('/getOtherUserData', async (req, res) => {
  const requesterRole = (await User.findOne({_id: req.user._id})).role
  if(!/^admin$/.test(requesterRole) && req.user._id !== req.body._id){
    return res.status(401).json('Insufficient Role')
  }

  try{
    var userData = await User.findOne({_id: req.body._id}).select({password: 0, __v: 0})
    res.json(userData)
  } catch(e){
    res.status(400).json(e.message)
  }
})

router.post('/deleteUser', async (req, res) => {
  const requesterRole = (await User.findOne({_id: req.user._id})).role
  if(!/^(admin|manager)$/.test(requesterRole)){
    return res.status(401).json('Insufficient Role')
  }

  if(req.body._id === req.user._id){
    return res.status(400).json('You cannot delete yourself');
  }

  //Only admins can delete admins.
  var proposedDelete
  try{
    proposedDelete = await User.findOne({_id: req.body._id})
    if(proposedDelete.role === 'admin' && requesterRole !== 'admin'){
      return res.status(401).json('Insufficient role.')
    }
  } catch(e){
    return res.status(400).json(e.message)
  }

  try {
    await User.deleteOne({_id: req.body._id});
    await Meal.deleteMany({userId: req.body._id});
    res.json(proposedDelete)
  } catch (e) {
    res.status(400).json(e.message);
  }
})

router.post('/editUser', async (req, res) => {
  const requesterRole = (await User.findOne({_id: req.user._id})).role
  if(!/^(admin|manager)$/.test(requesterRole)){
    return res.status(401).json('Insufficient Role')
  }

  if(requesterRole !== 'admin' && req.body.role === 'admin'){
    return res.status(401).json('Insufficient Role')
  }

  try{
    //Is the user already in the database?
    const emailExist = await User.findOne({email: req.body.email}) //indexed
    if(emailExist && emailExist._id.toString() !== req.body._id) return res.status(400).json(`${req.body.email} is already associated with an account.`)

    const currentTargetRole = (await User.findOne({_id: req.body._id})).role
    if(currentTargetRole === 'admin' && requesterRole !== 'admin'){
      return res.status(401).json('Managers cannot edit admins.')
    }

    const adminCount = await User.countDocuments({role: 'admin'}) //indexed
    if(currentTargetRole === 'admin' && adminCount === 1 && req.body.role){
      return res.status(401).json('There must be at least one admin');
    }

    const { error } = userChangeValidation(req.body);
    if(error) return res.status(400).json(error.details[0].message);

    var data = await User.findOneAndUpdate({_id: req.body._id}, req.body, {new: true}).select({password: 0, parCalories: 0, __v: 0})
    res.json(data);
  } catch (e) {
    res.status(400).json(e.message);
  }
})

router.post('/updateParCalories', async (req, res) => {
  const requesterRole = (await User.findOne({_id: req.user._id})).role
  if(requesterRole !== 'admin' && req.user._id !== req.body._id){
    res.status(401).json('Insufficient Role') //Only admins can update parCalories on a record that's not theirs.
  }

  const { error } = userChangeValidation(req.body)
  if(error) return res.status(400).json(error.details[0].message);

  try {
    await User.findOneAndUpdate({_id: req.body._id || req.user._id}, {parCalories: req.body.parCalories})
    res.json(req.body);
  } catch (e) {
    res.status(400).json(e.message);
  }
})

module.exports = router
