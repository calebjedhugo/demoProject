const router = require('express').Router();

const bodyParser = require('body-parser')
router.use(bodyParser.json({type: 'application/json'}))

module.exports = router
