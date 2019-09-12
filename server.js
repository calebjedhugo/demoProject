'use strict';

const express = require('express')
const app = express()

//A production environment should alreay have this. This is pretty much for developement. See the README.md for details.
if(!process.env.username){
  require('dotenv').config();
}
const env = process.env.env

const bodyParser = require('body-parser')
app.use(bodyParser.json({type: 'application/json'}))

const mongoose = require('mongoose')
var connStr = `mongodb+srv://${process.env.username}:${process.env.password}@${process.env.database}?retryWrites=true&w=majority`
var conn = mongoose.connect(connStr,
  {
    useNewUrlParser: true,
    useFindAndModify: false,
    autoIndex: false
  },
  e => {
    if(e) console.log(e.message)
    else console.log('connected to DB!')
})

//cors for developement environment.
if(env === 'dev'){
  const cors = require('cors')
  app.options('*', cors())
  app.use(/.*/, cors())
}

//Route Middlewares
const verifyJwt = require('./routes/verifyToken')

//We need these open for the user to get the jwt in the first place so they should be excluded.
const jwtVerify = /^(?!\/api\/auth).*/

//Authenticate token for all other requests.
app.use(jwtVerify, verifyJwt)

//Import Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/data', require('./routes/data'));
app.use('/api/jwt', require('./routes/jwt'));

//sererside is 3001 until there is a reason for it to be something else.
const port = 3001
app.listen(port, () => console.log(`Server listening on port ${port}!`))
