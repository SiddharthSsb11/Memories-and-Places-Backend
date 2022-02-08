const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const placeSchema = new Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    image: { type: String, required: true },
    address: { type: String, required: true },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User'},
    likes: [
        {
          user: { type: Schema.Types.ObjectId, ref: 'users'}
        }
    ]
});

const Place = mongoose.model('Place', placeSchema);

module.exports = Place;