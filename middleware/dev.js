const router = require('express').Router();

//cors for developement environment.
const cors = require('cors')
router.options('*', cors())
router.use(/.*/, cors())

//A production environment should already have this.
require('dotenv').config();

module.exports = router
