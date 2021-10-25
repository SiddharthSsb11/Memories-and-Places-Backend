//const { v4: uuidv4 } = require('uuid');
const uuid = require('uuid').v4;

const HttpError = require("../models/http-error");

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

const getPlaceById = (req, res, next) => {
  const placeId = req.params.pid; // { pid: 'p1' }

  const place = DUMMY_PLACES.find((p) => {
    return p.id === placeId;
  });

  if (!place) {
    throw new HttpError("Could not find a place for the provided id.", 404);
  }

  res.json({ place }); //{ place: place }
};

const getPlacesByUserId = (req, res, next) => {
  const userId = req.params.uid;

  const places = DUMMY_PLACES.filter((p) => {
    return p.creator === userId;
  });

  if (!places || places.length === 0) {//there can be multiple places shared/posted by a single creator/user
    return next(
      new HttpError("Could not find any places for the provided user id.", 404)
    );
  }

  res.json({ places });
};

const createPlace = (req, res, next) => {
  const { title, description, coordinates, address, creator } = req.body;
  // const title = req.body.title;
  const createdPlace = {
    id: uuid(),
    title,
    description,
    location: coordinates,
    address,
    creator
  };

  DUMMY_PLACES.push(createdPlace); //unshift(createdPlace)

  res.status(201).json({ place: createdPlace });
};

const updatePlace = (req, res, next) => {
  const { title, description } = req.body;
  const placeId = req.params.pid;
  console.log(req.params, 'url params');
  //immutabely updating
  const place = DUMMY_PLACES.find(p => p.id === placeId) ;
  const updatedPlace = {...place};
  console.log(updatedPlace, 'place');
  
  const placeIndex = DUMMY_PLACES.findIndex(p => p.id === placeId);
  updatedPlace.title = title;
  updatedPlace.description = description;

  DUMMY_PLACES[placeIndex] = updatedPlace;

  res.status(200).json({place: updatedPlace});
};

const deletePlace = (req, res, next) => {
  const placeId = req.params.pid;
  DUMMY_PLACES = DUMMY_PLACES.filter(p => p.id !== placeId); //overwriting the original array with newly filtered returned one
  res.status(200).json({ message: 'Deleted place.' });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
