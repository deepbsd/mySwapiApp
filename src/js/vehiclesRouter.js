const express = require('express');
const router = express.Router();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();


const {swapiVehicle} = require('./mymodels/vehicles-model');


router.get('/', (req, res) => {
  swapiVehicle
    .find()
    .exec()
    .then(vehicle => {
      res.json(vehicle.map(vehicle => vehicle.apiRepr()));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'something went terribly wrong'});
    });
});

router.get('/:id', (req, res) => {
  swapiVehicle
    .findById(req.params.id)
    .exec()
    .then(vehicle => res.json(vehicle.apiRepr()))
    //.then(film => res.json(film.apiTestRepr()))
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'something went horribly awry'});
    });
});

router.post('/', jsonParser, (req, res) => {
  const requiredFields = ['name', 'model', 'manufacturer', 'cost_in_credits', 'length', 'crew'];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`
      console.error(message);
      return res.status(400).send(message);
    }
  }

  swapiVehicle
    .create({
      name: req.body.name,
      model: req.body.model,
      manufacturer: req.body.manufacturer,
      cost_in_credits: req.body.cost_in_credits,
      length: req.body.length,
      crew: req.body.crew
    })
    .then(vehicle => res.status(201).json(vehicle.apiRepr()))
    .catch(err => {
        console.error(err);
        res.status(500).json({error: 'Something went wrong'});
    });
});

router.delete('/:id', (req, res) => {
  swapiVehicle
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
  const updateableFields = ['name', 'model', 'manufacturer', 'cost_in_credits', 'length', 'crew'];
  updateableFields.forEach(field => {
    if (field in req.body) {
      updated[field] = req.body[field];
    }
  });

  swapiVehicle
    .findByIdAndUpdate(req.params.id, {$set: updated}, {new: true})
    .exec()
    .then(updatedVehicle => res.status(201).json(updatedVehicle.apiRepr()))
    .catch(err => res.status(500).json({message: 'Something went wrong'}));
});



module.exports = router;
