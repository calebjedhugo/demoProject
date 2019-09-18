const router = require('express').Router();
const User = require('../model/User');
const Meal = require('../model/Meal'); //for clearing out deleted user's meals.

const {userChangeValidation} = require('../validation/users')
const {skipMaxSearchValidation}  = require('../validation/search')

//This is called to get a user's complete data when an admin clicks on a "Edit Meals Data" button.
router.route('/').get(async (req, res) => {
  var userId
  if(req.query._id){
    const requesterRole = (await User.findOne({_id: req.user._id})).role
    if(!/^admin$/.test(requesterRole) && req.user._id !== req.body._id){
      return res.status(401).json('Insufficient Role')
    } else {
      userId = req.query._id //Admins can have other's data.
    }
  } else {
    userId = req.user._id //just return the active user's data.
  }

  try{
    var userData = await User.findOne({_id: userId}).select({password: 0, __v: 0})
    res.json(userData)
  } catch(e){
    res.status(500).json(e.message)
  }
}).patch(async (req, res) => {
  const requesterRole = (await User.findOne({_id: req.user._id})).role
  if(!/^(admin|manager)$/.test(requesterRole) && req.user._id !== req.body._id){
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

    var data = await User.findOneAndUpdate({_id: req.body._id}, req.body, {new: true}).select({password: 0, __v: 0})
    res.json(data);
  } catch (e) {
    res.status(400).json(e.message);
  }
}).delete(async (req, res) => {
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

router.get('/getUserList', async (req, res) => {
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

module.exports = router
