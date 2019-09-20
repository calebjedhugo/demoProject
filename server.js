'use strict';
const express = require('express')
const app = express()

//Start up controller
app.use(require('./controller'))

//sererside is 3001 until there is a reason for it to be something else.
const port = 3001
app.listen(port, () => console.log(`Server listening on port ${port}!`))
