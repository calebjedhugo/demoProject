const router = require('express').Router();
const Meal = require('../model/Meal')
const User = require('../model/User'); //for validating the user's role.

const {mealValidation, getMealsValidation, skipMaxSearchValidation} = require('../validation')

router.route('/').all(async (req, res, next) => {
  if(req.query._id){
    if(req.query._id !== req.user._id){
      let requesterRole = (await User.findOne({_id: req.user._id})).role
      if(requesterRole !== 'admin'){
        return res.status(401).json('Insufficient Role') //Only admins should doing anything to someone elses meals.
      }
    }
  } else req.query._id = req.user._id //Of course you can edit yourself.
  next()
}).get(async (req, res) => {
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
  if(error) return res.status(400).json(error.details[0].message);

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
