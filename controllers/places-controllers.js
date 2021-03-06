//const { v4: uuidv4 } = require('uuid');
//const uuid = require('uuid').v4;
const fs = require('fs');
// const path = require('path');

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const Place = require('../models/place');
const HttpError = require("../models/http-error");
const User = require('../models/user');
const fileDelete = require('../middleware/file-delete');


const getPlaces = async (req, res, next) => {
  let places;

  try {
    places = await Place.find({}).sort({ date: -1 }).populate("creator", "-password");
    //.sort({ date: -1 }) new ones on top 
    //not including password field while getting user data
    //.populate("creator", "-password")
  } catch (err) {
    return next(new HttpError('Fetching places failed, please try again later.',500));
  }

  //console.log(places);
  res.json({places: places.map(place => place.toObject({ getters: true }))});
};


const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; // { pid: 'p1' }
  //console.log(placeId);

  let place;
  try{
    place = await Place.findById(placeId).populate("creator", "-password");
  }catch(err){
    return next (new HttpError ('Something went wrong, could not find a place.', 500));
  }

  if (!place) {
    return next (new HttpError("Could not find a place for the provided id.", 404));
  }
  //console.log(place,'query obj');

//toObject to access the getters //transforming the _id data into id when retrieved from db
  res.json({ place: place.toObject({ getters: true }) }); // => { place } => { place: place }
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let userWithPlaces;
  //let random
  try {
    //userWithPlaces = await User.findById(userId).populate('places');
    userWithPlaces = await User.findById(userId).populate({
      path: 'places',
      populate: { path: 'creator' }
    });
  } catch (err) {
    return next(new HttpError('Fetching places failed, please try again later',500));
  }


  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(new HttpError('Could not find places for the user. Try adding some places first.', 404));
  }
  //const userPlaces = userWithPlaces.places.map(place => place.toObject({ getters: true }));
  //console.log(userPlaces);
  //console.log(random);
  //res.json({places: userWithPlaces.places.map(place => place.toObject({ getters: true })), creator:userWithPlaces});
  //console.log(userWithPlaces)
  res.json({places: userWithPlaces.places.map(place => place.toObject({ getters: true }))});
  //res.json({places: userWithPlaces.places});
};

const createPlace = async (req, res, next) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    //console.log(errors)
    return next( new HttpError('Invalid inputs passed, please check your data.', 422));
  }

  const { title, description, address} = req.body;
  // const title = req.body.title;

  const createdPlace = new Place({
    title,
    description,
    address,
    image: req.file.location,//req.file.path,
    creator: req.userData.userId //protection MW
  });
  //console.log(req.file.path);
  let user;
  try {
    user = await User.findById(req.userData.userId); 
  } catch (err) {
    return next(new HttpError('Creating place failed, please try again', 500));
  }

  if (!user) {
    return next(new HttpError('Could not find user for provided id', 404));
  }

  //console.log(user, 'creating user');
  let sess
  try {
    sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
    sess.endSession()
    //console.log(user, 'user session ending line')
  } catch(err){
    await sess.abortTransaction()
    sess.endSession()
    //console.log(err)
    return next(new HttpError('Creating place failed, please try again XVXVXV', 500));
  }
  //console.log(user, 'creating user after after sessionb');

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

/*   console.log('place creator: ', place.creator);
  console.log('place creator: ', typeof place.creator);
  console.log('req.userData.userId : ', req.userData.userId);
  console.log('req.userData.userId : ', typeof req.userData.userId); */
  
  console.log(req.userData, 'userdata via protecting mw');
  //console.log(place.creator, 'creator just a field with id as its value; type objectId');
  
  //authorization
  if (place.creator.toString() !== req.userData.userId) {//creaotr id is objectId type in db, to compare ;convert it to string
    return next(new HttpError('You are not allowed to edit this place.', 401));
    //authorizing on BE//req.userData.userId passed from protection MW
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
  //const doc = await Model.findByIdAndDelete(req.params.id)
  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
    
    //console.log(place,'place object to be deleted populated with creator');

  } catch (err) {
    return next(new HttpError('Something went wrong, could not delete place.',500));
  };

  if (!place) {
    return next(new HttpError('Could not find place for this id.', 404));
  }

  //console.log(place, place.creator, 'on deletion place and place.creator');
  //place.creator.id.toString !== req.userData.userId
  if (place.creator.id !== req.userData.userId) {
    return next(new HttpError('You are not allowed to delete this place.',401));
  }

  //const imagePath = place.image;
  //console.log(imagePath);
  let sess
  try {
    sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
    sess.endSession();
  } catch (err) {
    await sess.abortTransaction()
    sess.endSession()
    //console.log(err)
    return next(new HttpError('Something went wrong, could not delete place.',500));
  }

  const imagePath = place.image;
  fileDelete(imagePath);
  //fs.unlink(imagePath, err => { console.log(err); });//deleting file once the respective place is deleted

  res.status(200).json({ message: 'Deleted place.' });
};

// @route    PUT api/place/like/:pid
// @desc     Like a post
// @access   Private

const likePlace = async (req, res, next) => {
  let place
  try {
    place = await Place.findById(req.params.pid);
    
    // Check if the place has already been liked
    if (place.likes.some((like) => like.user.toString() === req.userData.userId)) {
      //return res.status(400).json({ msg: 'Place already liked' });
      return next(new HttpError('Place already liked', 400))
    }

    place.likes.unshift({ user: req.userData.userId }); //adds logged in user who liked it, in the beginning

    await place.save();

    //console.log('place likes array see', place);
    //return res.json(place.likes);
    return res.status(200).json({ place: place.toObject({ getters: true }) });
    
  } catch (err) {
    //console.error(err.message);
    //res.status(500).send('Server Error');
    return next(new HttpError('Something went wrong, could not like the place.',500));
  }
};

// @route    PUT api/place/unlike/:id
// @desc     Unlike a post
// @access   Private

const unlikePlace = async (req, res, next) => {

  let place
  try {
    place = await Place.findById(req.params.pid);
    if (!place) {
      return next(new HttpError('Could not find place for this id.', 404));
    }
    
     // Check if the place has not yet been liked
    if (!place.likes.some((like) => like.user.toString() === req.userData.userId)) {
      return next(new HttpError('Place has not yet been liked', 400));
    }

    // remove the like
    place.likes = place.likes.filter( ({ user }) => user.toString() !== req.userData.userId );

    await place.save();

    console.log('place likes array see', place);
    //return res.json(place.likes);
    return res.status(200).json({ place: place.toObject({ getters: true }) });
    
  } catch (err) {
    console.error(err.message);
    //res.status(500).send('Server Error');
    return next(new HttpError('Something went wrong, could not unlike the place.',500));
  }

}

// @route   POST api/places/comment/:pid
// @desc    Add comment to post
// @access  Private
const addComment = async(req, res, next) => {
  
  let place
  try{
    const user = await User.findById(req.userData.userId);
    place = await Place.findById(req.params.pid);
    if (!place) {
      return next(new HttpError('Could not find place for this id.', 404));
    }

    const newComment = {
      text: req.body.text,
      name: user.name,
      avatar: user.image, //or on fe use logged in user.image as UI avatar src
      user: req.userData.userId
    }

    place.comments.unshift(newComment);
    await place.save();
    //console.log(place, "comments array check");

    //res.json(place.comments);
    return res.status(200).json({ place: place.toObject({ getters: true }) });

  }catch(err){
    console.error(err.message);
    //res.status(500).send('Server Error');
    return next(new HttpError('Something went wrong, could not add the comment.',500));
  }
}

// @route   DELETE api/places/comment/:pid/:cid
// @desc    Remove comment from post
// @access  Private

const deleteComment = async(req, res, next) => {

  let place;
  try{
    place = await Place.findById(req.params.pid);
    if (!place) {
      return next(new HttpError('Could not find place for this id.', 404));
    }

    const comment = place.comments.find(comment => comment.id === req.params.cid);
    if (!comment) {
      return next(new HttpError('Could not find comment. Doesnt exist.', 404));
    }

    if(comment.user.toString() !== req.userData.userId){
      return next(new HttpError('User not authorized to delete this comment', 401));
    }
    //console.log(comment, "comment to be deleted");

    // deleting the comment
    //place.comments = place.comments.filter(({ user }) => user.toString() !== req.userData.userId );//will delete all the users comment 
    place.comments = place.comments.filter((c) => c._id !==  comment._id );
    //const commentIndexToBeDeleted = place.comments.map(comment => comment._id.toString()).indexOf(req.params.cid)
    //place.comments.splice(commentIndexToBeDeleted, 1);

    await place.save();

    console.log('place comments array see', place);
    //return res.json(place.comments);
    return res.status(200).json({ place: place.toObject({ getters: true }) });

  }catch(err){
    console.error(err.message);
    //res.status(500).send('Server Error');
    return next(new HttpError('Something went wrong, could not delete the comment.',500));
  }

}

exports.getPlaces = getPlaces;
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
exports.likePlace = likePlace;
exports.unlikePlace = unlikePlace;
exports.addComment = addComment;
exports.deleteComment = deleteComment;
