//const { v4: uuidv4 } = require('uuid');
//const uuid = require('uuid').v4;
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const Place = require('../models/place');
const HttpError = require("../models/http-error");
const User = require('../models/user');

let DUMMY_PLACES = [
  {
    id: "p1",
    title: "Vietnam Jungle",
    description: 'Dense Asian jungle can be a "dark and forbidding place"',
    imageUrl:
      "https://static1.thetravelimages.com/wordpress/wp-content/uploads/2018/08/china-chinese.fansshare.com_.jpg?q=50&fit=crop&w=740&h=556&dpr=1.5",
    address: "Hamlet 4, Nam Cat Tien, Tan Phu District, Nam Cat Tien Vietnam",
    location: {
      lat: 11.752252284264282,
      lng: 107.46413427724953,
    },
    creator: "u1",
  },
];

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
  console.log(userId, 'creator id');

  let places;
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
  res.json({ places: places.map(place => place.toObject({ getters: true })) });
};

const createPlace = async (req, res, next) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    //console.log(errors)
    return next( new HttpError('Invalid inputs passed, please check your data.', 422));
  }

  const { title, description, coordinates, address, creator } = req.body;
  // const title = req.body.title;
  /* const createdPlace = {
    id: uuid(),
    title,
    description,
    location: coordinates,
    address,
    creator
  }; */

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: "https://static1.thetravelimages.com/wordpress/wp-content/uploads/2018/08/china-chinese.fansshare.com_.jpg?q=50&fit=crop&w=740&h=556&dpr=1.5",
    creator
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError('Creating place failed, please try again', 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError('Could not find user for provided id', 404);
    return next(error);
  }

  console.log(user);
  
  try {
    /* const sess = await mongoose.startSession();
    sess.startTransaction(); */
    await createdPlace.save(/* { session: sess } */);
    user.places.push(createdPlace);
    await user.save(/* { session: sess } */);
    //await sess.commitTransaction();
  }catch(err){
    const error = new HttpError('Creating place failed, please try again XVXVXV', 500);
    return next(error);
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
    place = await Place.findById(placeId);
  } catch (err) {
    return next(new HttpError('Something went wrong, could not delete place.',500));
  };

  try {
    await place.remove();
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
