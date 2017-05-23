const express = require('express');
const router = express.Router();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();


const {swapiPlanet} = require('./models');


router.get('/', (req, res) => {
  swapiPlanet
    .find()
    .exec()
    .then(planet => {
      res.json(planet.map(planet => planet.apiRepr()));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'something went terribly wrong'});
    });
});

router.get('/:id', (req, res) => {
  swapiPlanet
    .findById(req.params.id)
    .exec()
    .then(planet => res.json(planet.apiRepr()))
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'something went horribly awry'});
    });
});

router.post('/', jsonParser, (req, res) => {
  const requiredFields = ['name', 'diameter', 'climate', 'gravity', 'terrain', 'population', 'surface_water', 'residents'];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`
      console.error(message);
      return res.status(400).send(message);
    }
  }

  swapiPlanet
    .create({
      name: req.body.name,
      diameter: req.body.diameter,
      climate: req.body.climate,
      gravity: req.body.gravity,
      terrain: req.body.terrain,
      population: req.body.population,
      surface_water: req.body.surface_water,
      residents: req.body.residents
    })
    .then(planet => res.status(201).json(planet.apiRepr()))
    .catch(err => {
        console.error(err);
        res.status(500).json({error: 'Something went wrong'});
    });
});

router.delete('/:id', (req, res) => {
  swapiPlanet
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
  const updateableFields = ['name', 'diameter', 'climate', 'gravity', 'terrain', 'population', 'surface_water', 'residents'];
  updateableFields.forEach(field => {
    if (field in req.body) {
      updated[field] = req.body[field];
    }
  });

  swapiPlanet
    .findByIdAndUpdate(req.params.id, {$set: updated}, {new: true})
    .exec()
    .then(updatedPlanet => res.status(201).json(updatedPlanet.apiRepr()))
    .catch(err => res.status(500).json({message: 'Something went wrong'}));
});




module.exports = router;
