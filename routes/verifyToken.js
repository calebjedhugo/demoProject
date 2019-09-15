const jwt = require('jsonwebtoken')
const fs = require('fs')

module.exports = function (req, res, next){
  const token = req.header('Authorization');
  if(!token || token === 'null'){ //No token means they are requesting the client code.
    let safeUrl = req.originalUrl.replace(/\.\.\//g, '') //Let not leave this just to node.
    let path = `${__dirname.replace('/routes', '')}/publichtml${safeUrl}`
    if(fs.existsSync(path)){ //If we have it in that folder, it should be accessable.
      return res.sendFile(path)
    }
    return res.json('Login Required')
  }
  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = verified;
    if(req.user) next();
    else res.status(401).json('Login Required');
  } catch(e) {
    res.status(403).json('Login Required');
  }
}
