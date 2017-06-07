const express = require('express');
const router = express.Router();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();


const {swapiStarship} = require('./mymodels/starships-model');


router.get('/', (req, res) => {
  swapiStarship
    .find()
    .exec()
    .then(starship => {
      res.json(starship.map(starship => starship.apiRepr()));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'something went terribly wrong'});
    });
});

router.get('/:id', (req, res) => {
  swapiStarship
    .findById(req.params.id)
    .exec()
    .then(starship => res.json(starship.apiRepr()))
    //.then(film => res.json(film.apiTestRepr()))
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'something went horribly awry'});
    });
});

router.post('/', jsonParser, (req, res) => {
  const requiredFields = ['name', 'model', 'manufacturer', 'cost_in_credits', 'length', 'crew', 'cargo_capacity', 'hyperdrive_rating', 'starship_class'];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`
      console.error(message);
      return res.status(400).send(message);
    }
  }

  swapiStarship
    .create({
      name: req.body.name,
      model: req.body.model,
      manufacturer: req.body.manufacturer,
      cost_in_credits: req.body.cost_in_credits,
      length: req.body.length,
      crew: req.body.crew,
      cargo_capacity: req.body.cargo_capacity,
      hyperdrive_rating: req.body.hyperdrive_rating,
      starship_class: req.body.starship_class
    })
    .then(starship => res.status(201).json(starship.apiRepr()))
    .catch(err => {
        console.error(err);
        res.status(500).json({error: 'Something went wrong'});
    });
});

router.delete('/:id', (req, res) => {
  swapiStarship
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

  const updateableFields = ['name', 'model', 'manufacturer', 'cost_in_credits', 'length', 'crew', 'cargo_capacity', 'hyperdrive_rating', 'starship_class'];
  updateableFields.forEach(field => {
    if (field in req.body) {
      updated[field] = req.body[field];
    }
  });

  swapiStarship
    .findByIdAndUpdate(req.params.id, {$set: updated}, {new: true})
    .exec()
    .then(updatedStarship => res.status(201).json(updatedStarship.apiRepr()))
    .catch(err => res.status(500).json({message: 'Something went wrong'}));
});



module.exports = router;
