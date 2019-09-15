const router = require('express').Router();
const Meal = require('../model/Meal')
const User = require('../model/User'); //for validating the user's role.

const {mealValidation, getMealsValidation, skipMaxSearchValidation} = require('../validation')

router.route('/').get(async (req, res) => {
  const requesterRole = (await User.findOne({_id: req.user._id})).role
  if(requesterRole !== 'admin' && req.user._id !== req.query._id){
    return res.status(401).json('Insufficient Role') //Only admins should be viewing meals that aren't theirs.
  }

  const {error} = getMealsValidation(req.query)
  if(error) return res.status(400).json(error.details[0].message);

  const query = {
    userId: req.query._id, //indexed
    date: {'$gte': new Date(req.query.fromDate), '$lte': new Date(req.query.toDate)} //indexed
  }

  try{
    var mealData = await Meal.find(query).select({userId: 0, __v: 0}).limit(1000);
  } catch(e){
    return res.status(400).json(e.message)
  }
  res.json(mealData);
}).post(async (req, res) => {
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
}).patch(async (req, res) => {
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
}).delete(async (req,res) => {
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

module.exports = router;
