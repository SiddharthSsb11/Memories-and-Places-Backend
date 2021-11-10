const express = require("express");
//const bodyParser = require('body-parser');
const mongoose = require("mongoose");

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");

const app = express();

app.use(express.json()); // based on body-parser.

//CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');

  next();
});

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
mongoose.connect("mongodb+srv://Ssb101:memories_mern_pswd@cluster0.b70ax.mongodb.net/mernDB?retryWrites=true&w=majority")
  .then(() => {
    app.listen(8000, () => {
      console.log("Connection is UP");
    });
  })
  .catch((err) => {
    console.log(err,'Error in Connection XXVVXX');
  });
