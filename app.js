const express = require("express");
//const bodyParser = require('body-parser');
const mongoose = require("mongoose");

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");

const app = express();

app.use(express.json()); // based on body-parser.

app.use("/api/places", placesRoutes); // => /api/places...
app.use("/api/users", usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

mongoose.connect("mongodb+srv://Sid_101:SElfC4XvEVXhWasF@cluster0.oup02.mongodb.net/MemoriesDB?retryWrites=true&w=majority")
  .then(() => {
    app.listen(8000, () => {
      console.log("Connection is UP");
    });
  })
  .catch((err) => {
    console.log(err,'Error in Connection XXVVXX');
  });
