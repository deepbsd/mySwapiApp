const mongoose = require('mongoose');

const StarshipsSchema = mongoose.Schema({
  name: {type: String, required: true},
  model: String,
  manufacturer: String,
  cost_in_credits: String,
  length: String,
  max_atmosphering_speed: String,
  crew: String,
  cargo_capacity: String,
  consumables: String,
  hyperdrive_rating: String,
  MGLT: String,
  starship_class: String,
  pilots: [],
  films: [],
  created: {type: String, default: Date.now},
  edited: {type: String, default: Date.now},
  url: String
});

StarshipsSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    name: this.name,
    model: this.model,
    manufacturer: this.manufacturer,
    cost_in_credits: this.cost_in_credits,
    length: this.length,
    crew: this.crew,
    cargo_capacity: this.cargo_capacity,
    hyperdrive_rating: this.hyperdrive_rating,
    starship_class: this.starship_class
  };
}


const swapiStarship = mongoose.model('starships', StarshipsSchema);

module.exports = {swapiStarship};
