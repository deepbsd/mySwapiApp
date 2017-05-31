const mongoose = require('mongoose');

const starWarsSpecies = mongoose.Schema({
  name: {type: String, required: true},
  classification: String,
  designation: String,
  average_height: String,
  skin_colors: String,
  hair_colors: String,
  eye_colors: String,
  average_lifespan: String,
  homeworld: String,
  language: String,
  people: [],
  films: [],
  created: {type: String, default: Date.now},
  edited: String,
  url: String
})

starWarsSpecies.methods.apiRepr = function() {
  return {
    id: this._id,
    name: this.name,
    homeworld: this.homeworld,
    classification: this.classification,
    designation: this.designation,
    average_lifespan: this.average_lifespan,
    average_height: this.average_height,
    people: this.people,
    url: this.url
  };
}

const swapiSpecies = mongoose.model('Species', starWarsSpecies);

module.exports = {swapiSpecies};
