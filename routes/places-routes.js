const express = require('express');

const router = express.Router();

const DUMMY_PLACES = [
  {
    id: 'p1',
    title: 'Vietnam Jungle',
    description: 'Dense Asian jungle can be a "dark and forbidding place"',
    imageUrl: 'https://static1.thetravelimages.com/wordpress/wp-content/uploads/2018/08/china-chinese.fansshare.com_.jpg?q=50&fit=crop&w=740&h=556&dpr=1.5',
    address: 'Hamlet 4, Nam Cat Tien, Tan Phu District, Nam Cat Tien Vietnam',
    location: {
      lat: 11.752252284264282, 
      lng: 107.46413427724953,
    },
    creator: 'u1'
  }
];

router.get('/:pid', (req, res, next) => {
  const placeId = req.params.pid; // { pid: 'p1' }
  const place = DUMMY_PLACES.find(p => {
    return p.id === placeId;
  });
  res.json({place}); // => { place } => { place: place }
});

module.exports = router;