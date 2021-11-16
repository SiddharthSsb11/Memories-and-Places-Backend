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
    const error = new HttpError(
      'Could not create user, please try again.',
      500
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: []
  });
  //console.log(req.file.path, 'req.file.path be server');

  try{
    await createdUser.save();
  }catch (err) {
    return next(new HttpError('Signing up failed XXXXXXXCCCCCCCVVVVVVV, please try again.', 500));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      'supersecret_dont_share',
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email })
  } catch (err) {
    return next(new HttpError('Logging in failed, please try again later.',500));
  }

  if (!existingUser || existingUser.password !== password) {
    return next(new HttpError('Invalid credentials, could not log you in.',401));
  }
 
  res.status(200).json({
    message: 'Logged in!', 
    user: existingUser.toObject({ getters: true })
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
