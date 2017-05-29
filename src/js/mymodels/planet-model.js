const mongoose = require('mongoose');

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

starWarsPlanet.methods.apiRepr = function() {
  return {
    id: this._id,
    name: this.name,
    diameter: this.diameter,
    climate: this.climate,
    gravity: this.gravity,
    terrain: this.terrain,
    population: this.population,
    surface_water: this.surface_water,
    residents: this.residents,
    films: this.films
  }
}

const swapiPlanet = mongoose.model('Planet', starWarsPlanet);

module.exports = {swapiPlanet};
