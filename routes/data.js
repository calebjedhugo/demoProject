const router = require('express').Router();
const verify = require('./verifyToken');
const User = require('../model/User');
const Meal = require('../model/Meal')
const {mealValidation, registerValidation, userChangeValidation, getMealsValidation, skipMaxSearchValidation} = require('../validation')

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

router.post('/getMeals', async (req, res) => {
  const requesterRole = (await User.findOne({_id: req.user._id})).role
  if(requesterRole !== 'admin' && req.user._id !== req.body._id){
    return res.status(401).json('Insufficient Role') //Only admins should be viewing meals that aren't theirs.
  }

  const {error} = getMealsValidation(req.body)
  if(error) return res.status(400).json(error.details[0].message);

  const query = {
    userId: req.body._id, //indexed
    date: {'$gte': new Date(req.body.fromDate), '$lte': new Date(req.body.toDate)} //indexed
  }

  try{
    var mealData = await Meal.find(query).select({userId: 0, __v: 0}).limit(1000);
  } catch(e){
    return res.status(400).json(e.message)
  }
  res.json(mealData);
})

router.post('/addMeal', async (req, res) => {
  const requesterRole = (await User.findOne({_id: req.user._id})).role
  if(requesterRole !== 'admin' && req.user._id !== req.body.userId){
    res.status(401).json('Insufficient Role') //Only admins should be able to add meals to other accounts.
  }

  const { error } = mealValidation(req.body);
  if(error) return res.status(400).json(error.details[0].message);

  const meal = new Meal(req.body);

  try {
    await meal.save()
    res.json({description: req.body.description});
  } catch (e) {
    res.status(400).json(e.message);
  }
})

router.post('/editMeal', async (req, res) => {
  const { error } = mealValidation(req.body);
  const requesterRole = (await User.findOne({_id: req.user._id})).role
  if(error) return res.status(400).json(error.details[0].message);

  if(requesterRole !== 'admin' && req.user._id !== req.body.userId){
    return res.status(401).json('Insufficient Role') //Only admins can update a single record that's not theirs.
  }

  try {
    const updatedMeal = await Meal.findOneAndUpdate({_id: req.body._id}, req.body, {new: true}).select({userId: 0})
    res.json(updatedMeal);
  } catch (e) {
    res.status(400).json(e.message);
  }
})

router.post('/deleteMeal', async (req,res) => {
  var query = {_id: req.body._id}
  const requesterRole = (await User.findOne({_id: req.user._id})).role
  //Only admins can delete a single record that's not theirs.
  if(requesterRole !== 'admin' && req.user._id !== req.body.userId){
    res.status(401).json('Insufficient Role')
  }

  try {
    await Meal.deleteOne(query);
    res.json('Deleted!')
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

module.exports = router;
