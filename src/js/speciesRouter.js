const express = require('express');
const router = express.Router();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();


const {swapiSpecies} = require('./mymodels/species-model');


router.get('/', (req, res) => {
  swapiSpecies
    .find()
    .exec()
    .then(species => {
      res.json(species.map(species => species.apiRepr()));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'something went terribly wrong'});
    });
});

router.get('/:id', (req, res) => {
  swapiSpecies
    .findById(req.params.id)
    .exec()
    .then(species => res.json(species.apiRepr()))
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'something went horribly awry'});
    });
});

router.post('/', jsonParser, (req, res) => {
  const requiredFields = ['name', 'classification', 'homeworld', 'designation', 'average_lifespan', 'average_height', 'people', 'url'];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`
      console.error(message);
      return res.status(400).send(message);
    }
  }

  swapiSpecies
    .create({
      name: req.body.name,
      classification: req.body.classification,
      homeworld: req.body.homeworld,
      designation: req.body.designation,
      average_lifespan: req.body.average_lifespan,
      average_height: req.body.average_height,
      people: [req.body.people],
      url: req.body.url
    })
    .then(species => res.status(201).json(species.apiRepr()))
    .catch(err => {
        console.error(err);
        res.status(500).json({error: 'Something went wrong'});
    });
});

router.delete('/:id', (req, res) => {
  swapiSpecies
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
  const updateableFields = ['name', 'classification', 'homeworld', 'designation', 'average_lifespan', 'average_height', 'people', 'url'];
  updateableFields.forEach(field => {
    if (field in req.body) {
      updated[field] = req.body[field];
    }
  });

  swapiSpecies
    .findByIdAndUpdate(req.params.id, {$set: updated}, {new: true})
    .exec()
    .then(updatedSpecies => res.status(201).json(updatedSpecies.apiRepr()))
    .catch(err => res.status(500).json({message: 'Something went wrong'}));
});


module.exports = router;
