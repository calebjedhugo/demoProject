const router = require('express').Router();

//Import middleware
router.use(require('../middleware'))

//Start up the database connection.
require('../util/database.js')

//Import Routes
router.use('/api', require('../routes'))

router.use(function(req, res){
  res.status(404).json(`Resource ${req.originalUrl} was not found`)
})

module.exports = router
