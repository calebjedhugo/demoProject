const router = require('express').Router();

//cors for developement environment.
const cors = require('cors')
var corsInstance = cors({
  exposedHeaders: 'Authorization'
})
router.options('*', corsInstance)
router.use(/.*/, corsInstance)

//A production environment should already have this.
require('dotenv').config();

module.exports = router
