const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/meals', require('./meals'));
router.use('/users', require('./users'));
router.use('/jwt', require('./jwt'));

module.exports = router
