const express = require('express');
const router = express.Router();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();


const {swapiFilm} = require('./mymodels/films-model');


router.get('/', (req, res) => {
  swapiFilm
    .find()
    .exec()
    .then(film => {
      res.json(film.map(film => film.apiRepr()));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'something went terribly wrong'});
    });
});

router.get('/:id', (req, res) => {
  swapiFilm
    .findById(req.params.id)
    .exec()
    .then(film => res.json(film.apiRepr()))
    //.then(film => res.json(film.apiTestRepr()))
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'something went horribly awry'});
    });
});

router.post('/', jsonParser, (req, res) => {
  const requiredFields = ['title', 'episode_id', 'release_date', 'director', 'opening_crawl', 'created'];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`
      console.error(message);
      return res.status(400).send(message);
    }
  }

  swapiFilm
    .create({
      title: req.body.title,
      episode_id: req.body.episode_id,
      release_date: req.body.release_date,
      director: req.body.director,
      opening_crawl: req.body.opening_crawl,
      created: req.body.created
    })
    .then(film => res.status(201).json(film.apiRepr()))
    .catch(err => {
        console.error(err);
        res.status(500).json({error: 'Something went wrong'});
    });
});

router.delete('/:id', (req, res) => {
  swapiFilm
    .findByIdAndRemove(req.params.id)
    .exec()
    .then(() => {
      res.status(204).json({message: 'success'});
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'something went terribly wrong'});
    });
});

router.put('/:id', jsonParser, (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    res.status(400).json({
      error: 'Request path id and request body id values must match'
    });
  }

  const updated = {};
  const updateableFields = ['title', 'episode_id', 'opening_crawl', 'director', 'producer', 'release_date', ['characters'], ['planets'], ['starships'], ['vehicles'], ['species'], 'created', 'edited', 'url'];
  updateableFields.forEach(field => {
    if (field in req.body) {
      updated[field] = req.body[field];
    }
  });

  swapiFilm
    .findByIdAndUpdate(req.params.id, {$set: updated}, {new: true})
    .exec()
    .then(updatedFilm => res.status(201).json(updatedFilm.apiRepr()))
    .catch(err => res.status(500).json({message: 'Something went wrong'}));
});



module.exports = router;
