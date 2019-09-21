const router = require('express').Router();
const jwt = require('jsonwebtoken')
const fs = require('fs')
const freshJwt = require('../util/freshJwt')

const verifyJwt = async (req, res, next) => {
  const token = req.header('Authorization');
  if(!token || token === 'null'){ //No token means they are requesting the client code.
    let safeUrl = req.originalUrl.replace(/\.\.\//g, '') //Let not leave this just to node.
    let path = `${__dirname.replace('/middleware', '')}/publichtml${safeUrl}`
    if(fs.existsSync(path)){ //If we have it in that folder, it should be accessable.
      return res.sendFile(path)
    }
    return res.json('Login Required')
  }
  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = verified;
    if(req.user){
      if(req.user.exp - (new Date() / 1000) < 3600){ //Freshen up the jwt if expiring in < 10 minutes.
        try{res.set('Authorization', await freshJwt(req.user._id))}
        catch(e) {console.log(e, 'Fresh jwt didn\'t work.')}
      }
      next()
    }
    else res.status(401).json('Login Required');
  } catch(e) {
    res.status(403).json('Login Required');
  }
}

//We need these open for the user to get the jwt in the first place so they should be excluded.
const jwtVerify = /^(?!\/api\/auth).*/

//Authenticate token for all other requests.
router.use(jwtVerify, verifyJwt)

module.exports = router
