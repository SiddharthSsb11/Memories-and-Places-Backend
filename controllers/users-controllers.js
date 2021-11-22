const { validationResult } = require("express-validator");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HttpError = require("../models/http-error");
const User = require("../models/user")

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password');//not including password field while getting user data
  } catch (err) {
    return next(new HttpError('Fetching users failed, please try again later.',500));
  }
  res.json({users: users.map(user => user.toObject({ getters: true }))});
};


const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next (new HttpError("Invalid inputs passed, please check your data.", 422)) ;
  }
  const { name, email, password } = req.body;

  let existingUser;
  try{
    existingUser = await User.findOne({ email: email });
  }catch(err){
    return next(new HttpError('Signing up failed, please try again later.', 500));
  }

  if(existingUser){
    return next(new HttpError('User exists already, please login instead.', 422));
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError('Could not create user, please try again.',500));
  }

  const createdUser = new User({
    name,
    email,
    image: req.file.location,
    password: hashedPassword,
    places: []
  });
  //console.log(req.file.path, 'req.file.path be server');

  try{
    await createdUser.save();
  }catch (err) {
    return next(new HttpError('Signing up failed XXXXX, please try again.', 500));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },//payload
      process.env.JWT_KEY,//secret-key
      { expiresIn: '23h' }
    );
  } catch (err) {
    return next(new HttpError('Signing up failed, please try again later.',500));
  }

/*   const cookieOptions = {
    expires: new Date(Date.now() + 23 * 60 * 60 * 1000),
    httpOnly: true,
    //secure: true//running https during production mode
  };

  res.cookie('jwt', token, cookieOptions); */

  res.status(201).json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email })
  } catch (err) {
    return next(new HttpError('Logging in failed, please try again later.',500));
  }

  if (!existingUser) {
    return next(new HttpError('Invalid credentials, could not log you in.',401));
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);//returns promise//yields a boolean value
  } catch (err) {
    return next(new HttpError('Could not log you in, please check your credentials and try again.',500));
  }

  if (!isValidPassword) {
    return next(new HttpError('Invalid credentials, could not log you in.',401));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: '23h' }
    );
  } catch (err) {
    return next(new HttpError('Logging in failed, please try again later.',500));
  }

/*   const cookieOptions = {
    expires: new Date(Date.now() + 23 * 60 * 60 * 1000),
    httpOnly: true,
    //secure: true//running https during production mode
  };

  res.cookie('jwt', token, cookieOptions); */
 
  res.status(200).json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token
  });
};

/* const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'successfully logged out' });
};
 */
exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
/* exports.logout = logout; */
