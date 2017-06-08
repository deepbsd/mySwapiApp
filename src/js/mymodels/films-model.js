const mongoose = require('mongoose');

const FilmsSchema = mongoose.Schema({
  title: {type: String, required: true},
  episode_id: String,
  opening_crawl: String,
  director: String,
  producer: String,
  release_date: String,
  characters: [],
  planets: [],
  starships: [],
  vehicles: [],
  species: [],
  created: {type: String, default: Date.now},
  edited: {type: String, default: Date.now},
  url: String
});

FilmsSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    title: this.title,
    episode_id: this.episode_id,
    release_date: this.release_date,
    director: this.director,
    opening_crawl: this.opening_crawl,
    created: this.created
  };
}


const swapiFilm = mongoose.model('films', FilmsSchema);

module.exports = {swapiFilm};
