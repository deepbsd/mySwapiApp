const mongoose = require('mongoose');

const VehiclesSchema = mongoose.Schema({
  name: {type: String, required: true},
  model: String,
  manufacturer: String,
  cost_in_credits: String,
  length: String,
  max_atmosphering_speed: String,
  crew: String,
  cargo_capacity: String,
  consumables: String,
  vehicle_class: String,
  pilots: [],
  films: [],
  created: {type: String, default: Date.now},
  edited: {type: String, default: Date.now},
  url: String
});

VehiclesSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    name: this.name,
    model: this.model,
    manufacturer: this.manufacturer,
    cost_in_credits: this.cost_in_credits,
    length: this.length,
    crew: this.crew
  };
}


const swapiVehicle = mongoose.model('vehicles', VehiclesSchema);

module.exports = {swapiVehicle};
