const router = require('express').Router();
const env = process.env.env

if(env === 'dev' || !env) router.use(require('./dev.js'))
router.use(require('./util.js'))
router.use(require('./auth.js'))

module.exports = router
