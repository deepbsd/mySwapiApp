const mongoose = require('mongoose');

const CharacterSchema = mongoose.Schema({
  name: {type: String, required: true},
  height: String,
  mass: String,
  hair_color: String,
  eye_color: String,
  birth_year: String,
  gender: String,
  homeworld: String,
  films: [],
  species: [],
  vehicles: [],
  starships: [],
  created: {type: String, default: Date.now},
  edited: {type: String, default: Date.now},
  url: String
});

CharacterSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    name: this.name,
    gender: this.gender,
    species: this.species,
    homeworld: this.homeworld,
    created: this.created
  };
}

// CharacterSchema.methods.apiTestRepr = function() {
//   return {
//     id: this._id,
//     name: this.name,
//     height: this.height,
//     mass: this.mass,
//     gender: this.gender,
//     species: this.species,
//     homeworld: this.homeworld,
//     created: this.created
//   };
// }

const swapiCharacter = mongoose.model('Characters', CharacterSchema);

module.exports = {swapiCharacter};
