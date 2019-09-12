const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    min: 6
  },
  description: {
    type: String,
    required: true,
    min: 1
  },
  calories: {
    type: Number,
    required: true,
  },
  date: { //having date and time seperate will make filtering easier.
    type: Date,
    required: true
  },
  time: {
    type: Number,
    required: true,
    min: 0,
    max: 1440
  }
})

module.exports = mongoose.model('Meal', mealSchema)
