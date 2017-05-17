const mongoose = require('mongoose');

const starWarsCharacter = mongoose.Schema({
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
  edited: String,
  url: {type: String, required: true}
});

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

const starWarsPlanet = mongoose.Schema({
  name: String,
  rotation_period: String,
  orbital_period: String,
  diameter: String,
  climate: String,
  gravity: String,
  terrain: String,
  surface_water: String,
  population: String,
  residents: [],
  films: [],
  created: String,
  edited: String,
  url: String
})

// blogPostSchema.virtual('authorName').get(function() {
//   return `${this.author.firstName} ${this.author.lastName}`.trim();
// });
//


starWarsCharacter.methods.apiRepr = function() {
  return {
    name: this.name,
    gender: this.gender,
    species: this.species,
    homeworld: this.homeworld,
    created: this.created
  };
}

starWarsSpecies.methods.apiRepr = function() {
  return {
    name: this.name,
    homeworld: this.homeworld,
    classification: this.classification,
    designation: this.classification,
    average_lifespan: this.average_lifespan,
    average_height: this.average_height,
    people: this.people,
    url: this.url
  };
}


starWarsPlanet.methods.apiRepr = function() {
  return {
    name: this.name,
    diameter: this.diameter,
    climate: this.climate,
    gravity: this.gravity,
    terrain: this.terrain,
    population: this.population,
    surface_water: this.surface_water,
    residents: this.residents
  }
}

const swapiCharacter = mongoose.model('Characters', starWarsCharacter);
const swapiSpecies = mongoose.model('Species', starWarsSpecies);
const swapiPlanet = mongoose.model('Planet', starWarsPlanet);

module.exports = {swapiCharacter, swapiSpecies, swapiPlanet};
