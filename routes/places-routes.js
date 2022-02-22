const express = require("express");
const { check } = require("express-validator");

const placesControllers = require("../controllers/places-controllers");
const fileUpload = require('../middleware/file-upload');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.get("/", placesControllers.getPlaces);

router.get("/:pid", placesControllers.getPlaceById);

router.get("/user/:uid", placesControllers.getPlacesByUserId);

router.use(checkAuth); //protection MW for below routes

router.post(
  "/",
  fileUpload.single('image'),//same key as formData identifier
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  placesControllers.createPlace
);

router.post("/comment/:pid", placesControllers.addComment);

router.put("/like/:pid", placesControllers.likePlace);
router.put("/unlike/:pid", placesControllers.unlikePlace);

router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  placesControllers.updatePlace
);

router.delete("/:pid", placesControllers.deletePlace);

module.exports = router;
