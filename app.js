const express = require("express");
/* const fs = require('fs');
const path = require('path'); */
//const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");
const fileDelete = require('./middleware/file-delete');

const app = express();

app.use(express.json()); // based on body-parser.
app.use(cookieParser());

//app.use('/uploads/images', express.static(path.join('uploads', 'images')));//serving images statically

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

  if (req.file) {
    fileDelete(req.file.location);//location is respective to our aws bucket
    /* fs.unlink(req.file.path, err => {
      console.log(err, 'rolling back the DP signupimage when validation error happens ');
    }); */
  }

  if (res.headerSent) {
    return next(error);
  }
  ///this check is necessary for scenarios where a response header has already been sent but you encounter 
  //an error while streaming the response to a client 
  //Then, you forward the error encountered to the default express error handler that will handle it for you 
  
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});
 
mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1yxe9.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`)
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log("Connection is UP");
    });
  })
  .catch((err) => {
    console.log(err,'Error in Connection XXVVXX');
  });
