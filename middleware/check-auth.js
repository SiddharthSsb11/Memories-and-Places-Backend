const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');

const checkAuth = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    //workaround for options req as id doesnt have token attached to it//for req other than get,post,patch,put,delete
    return next();

  }
  //let token
  try {

  /*   if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if(req.cookies.jwt) {
      token = req.cookies.jwt;
    } */
    const token = req.headers.authorization.split(' ')[1]; // Authorization: 'Bearer TOKEN'
    //console.log(req.headers, 'headers on req object')
    if (!token) {
      throw new Error('Authentication failed. You are not Logged IN!');
    }
    // Verification token
    const decodedTokenPayload = jwt.verify(token, 'supersecret_dont_share');

    req.userData = { userId: decodedTokenPayload.userId };
    //console.log(req.userData,'req.userData from protection mw decode decodedTokenPayload');
    next();

  } catch (err) {
    return next(new HttpError('Authentication failed!', 401));
  }
};

module.exports = checkAuth;