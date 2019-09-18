const router = require('express').Router();
const Meal = require('../model/Meal')
const User = require('../model/User'); //for validating the user's role.

const mealValidation = require('../validation/meals')
const {skipMaxSearchValidation}  = require('../validation/search')

router.route('/').all(async (req, res, next) => {
  //AUTH
  var query = req.method.toLowerCase() === 'get' ? req.query : req.body
  if(query.userId){ //If they passed in an _id that isn't theirs, we need to validate their role.
    if(query.userId !== req.user._id){
      let requesterRole = (await User.findOne({_id: req.user._id})).role
      if(requesterRole !== 'admin'){
        return res.status(401).json('Insufficient Role') //Only admins should doing anything to someone else's meals.
      }
    }
  } else if(req.query){ //Of course you can view and edit yourself.
    req.query.userId = req.user._id
    query.userId = req.user._id
  } else {
    req.body.userId = req.user._id
    query.userId = req.user._id
  }

  //VALIDATE
  const {error} = mealValidation[req.method.toLowerCase()](query)
  if(error) return res.status(400).json(error.details[0].message);

  next()
}).get(async (req, res) => {

  const query = {
    userId: req.query.userId, //indexed
    date: {'$gte': new Date(req.query.fromDate), '$lte': new Date(req.query.toDate)} //indexed
  }

  try{
    var mealData = await Meal.find(query).select({userId: 0, __v: 0}).limit(1000);
  } catch(e){
    return res.status(400).json(e.message)
  }
  res.json(mealData);
}).post(async (req, res) => {
  const meal = new Meal(req.body);

  try {
    await meal.save()
    res.json({description: req.body.description});
  } catch (e) {
    res.status(400).json(e.message);
  }
}).patch(async (req, res) => {

  try {
    const updatedMeal = await Meal.findOneAndUpdate({_id: req.body._id}, req.body, {new: true}).select({userId: 0})
    res.json(updatedMeal);
  } catch (e) {
    res.status(400).json(e.message);
  }
}).delete(async (req,res) => {
  var query = {_id: req.body._id}

  try {
    await Meal.deleteOne(query);
    res.json('Deleted!')
  } catch (e) {
    res.status(400).json(e.message);
  }
})

module.exports = router;
