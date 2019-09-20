const mongoose = require('mongoose')
var connStr = `mongodb+srv://${process.env.username}:${process.env.password}@${process.env.database}?retryWrites=true&w=majority`
var conn = mongoose.connect(connStr,
  {
    useNewUrlParser: true,
    useFindAndModify: false,
    autoIndex: false
  },
  e => {
    if(e) console.log(e.message, 'The server will not function until this is resolved.')
    else console.log('connected to DB!')
})
