const express = require('express');
//const bodyParser = require('body-parser');

const placesRoutes = require('./routes/places-routes');

const app = express();

app.use(express.json()); // based on body-parser.

app.use('/api/places', placesRoutes); // => /api/places...


app.use((req, res, next) => {
  const error = new HttpError('Could not find this route.', 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500)
  res.json({message: error.message || 'An unknown error occurred!'});
});

app.listen(8000, ()=>{
    console.log('listening on')
});