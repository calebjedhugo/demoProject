const router = require('express').Router();
const User = require('../model/User');
const Meal = require('../model/Meal'); //for clearing out deleted user's meals.

const {userChangeValidation} = require('../validation/users')
const {skipMaxSearchValidation}  = require('../validation/search')

router.route('/').all(async (req, res, next) => {
  if(req.method === 'GET') req.body = req.query;

  const { error } = userChangeValidation(req.body);
  if(error) return res.status(400).json(error.details[0].message);

  //If the user is editing themselves
  if(!req.body._id || req.body._id === req.user._id){
    req.body._id = req.user._id
    return next();
  }

  if(!/^(admin|manager)$/.test(req.user.role)){
    return res.status(401).json('Insufficient Role')
  }
  next();
}).get(async (req, res) => {
  try{
    var userData = await User.findOne({_id: req.body._id}).select({password: 0, __v: 0})
    res.json(userData)
  } catch(e){
    res.status(500).json(e.message)
  }
}).patch(async (req, res) => {
  if(req.user.role !== 'admin' && req.body.role === 'admin'){
    return res.status(401).json('Insufficient Role')
  }

  try{
    //Is the user already in the database?
    if(req.body.email){
      let email = new RegExp(`^${req.body.email}$`, 'i')
      const emailExist = await User.findOne({email: {$regex: email}}) //indexed
      if(emailExist && emailExist._id.toString() !== req.body._id) return res.status(400).json(`${req.body.email} is already associated with an account.`)
    }

    if(req.user.role !== 'admin'){
      const currentTargetRole = (await User.findOne({_id: req.body._id})).role
      if(currentTargetRole === 'admin'){
        return res.status(401).json('Managers cannot edit admins.')
      }
    } else if(req.body.role !== 'admin' && req.body._id === req.user._id) {//is an admin demoting themself
      const adminCount = await User.countDocuments({role: 'admin'}) //indexed
      if(adminCount === 1){
        return res.status(401).json('There must be at least one admin');
      }
    }

    var data = await User.findOneAndUpdate({_id: req.body._id}, req.body, {new: true}).select({password: 0, __v: 0})
    if(req.body._id === req.user._id && req.body.role !== req.user.role){ //If the user demoted themself.
      res.set('Authorization', await require('../util/freshJwt')(req.user._id))
    }
    res.json(data);
  } catch (e) {
    res.status(400).json(e.message || e);
  }
}).delete(async (req, res) => {
  if(req.body._id === req.user._id){
    return res.status(400).json('You cannot delete yourself');
  }

  //Only admins can delete admins.
  var proposedDelete
  try{
    proposedDelete = await User.findOne({_id: req.body._id}) //we include the deleted user in the reponse.
    if(proposedDelete.role === 'admin' && req.user.role !== 'admin'){
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
  if(!/^(admin|manager)$/.test(req.user.role)){
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
