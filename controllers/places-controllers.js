//const { v4: uuidv4 } = require('uuid');
//const uuid = require('uuid').v4;
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const Place = require('../models/place');
const HttpError = require("../models/http-error");
const User = require('../models/user');

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; // { pid: 'p1' }
  //console.log(placeId);

  let place;
  try{
    place = await Place.findById(placeId);
  }catch(err){
    return next (new HttpError ('Something went wrong, could not find a place.', 500));
  }

  if (!place) {
    return next (new HttpError("Could not find a place for the provided id.", 404));
  }
  //console.log(place,'query obj');
  //console.log(place.toObject({ getters: true }),'converted getter id obj');

//toObject to access the getters //transforming the _id data into id when retrieved from db
  res.json({ place: place.toObject({ getters: true }) }); // => { place } => { place: place }
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  /* let places;
  try{
    places = await Place.find({creator: userId});
  }catch(err){
    return next (new HttpError ('Fetching places failed, please try again later',500));
  }

  if (!places || places.length === 0) {//there can be multiple places shared/posted by a single creator/user
    return next(
      new HttpError("Could not find any places for the provided user id.", 404)
    );
  };
  //console.log(places,'places by a particular user with only _id//no the adjusted toObject getters id property rertireved');
  res.json({ places: places.map(place => place.toObject({ getters: true })) }); */
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate('places');
  } catch (err) {
    return next(new HttpError('Fetching places failed, please try again later',500));
  }
  /* console.log(userWithPlaces, 'populated');
  const user = await User.findById(userId)
  console.log(user, 'user unpopulated') */
  // if (!places || places.length === 0) {

  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(new HttpError('Could not find places for the provided user id.', 404));
  }

  res.json({places: userWithPlaces.places.map(place => place.toObject({ getters: true }))});

};

const createPlace = async (req, res, next) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    //console.log(errors)
    return next( new HttpError('Invalid inputs passed, please check your data.', 422));
  }

  const { title, description, address, creator } = req.body;
  // const title = req.body.title;

  const createdPlace = new Place({
    title,
    description,
    address,
    image: "https://static1.thetravelimages.com/wordpress/wp-content/uploads/2018/08/china-chinese.fansshare.com_.jpg?q=50&fit=crop&w=740&h=556&dpr=1.5",
    creator
  });

  let user;
  try {
    user = await User.findById(creator); 
  } catch (err) {
    return next(new HttpError('Creating place failed, please try again', 500));
  }

  if (!user) {
    return next(new HttpError('Could not find user for provided id', 404));
  }

  //console.log(user);
  
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();

  } catch(err){
    //console.log(err)
    return next(new HttpError('Creating place failed, please try again XVXVXV', 500));
  }
  
  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed, please check your data.', 422));
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(new HttpError('Something went wrong, could not update place.',500));
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    return next(new HttpError('Something went wrong, could not update place.',500));
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch (err) {
    return next(new HttpError('Something went wrong, could not delete place.',500));
  };

  if (!place) {
    return next(new HttpError('Could not find place for this id.', 404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return next(new HttpError('Something went wrong, could not delete place.',500));
  }

  res.status(200).json({ message: 'Deleted place.' });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
