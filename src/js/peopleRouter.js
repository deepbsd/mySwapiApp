const express = require('express');
const router = express.Router();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();


const {swapiCharacter} = require('./mymodels/character-model');


router.get('/', (req, res) => {
  swapiCharacter
    .find()
    .exec()
    .then(people => {
      res.json(people.map(people => people.apiRepr()));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'something went terribly wrong'});
    });
});

router.get('/:id', (req, res) => {
  swapiCharacter
    .findById(req.params.id)
    .exec()
    .then(character => res.json(character.apiRepr()))
    //.then(character => res.json(character.apiTestRepr()))
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'something went horribly awry'});
    });
});

router.post('/', jsonParser, (req, res) => {
  const requiredFields = ['name', 'gender', 'homeworld', 'species'];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`
      console.error(message);
      return res.status(400).send(message);
    }
  }

  swapiCharacter
    .create({
      name: req.body.name,
      gender: req.body.gender,
      homeworld: req.body.homeworld,
      species: req.body.species
    })
    .then(character => res.status(201).json(character.apiRepr()))
    .catch(err => {
        console.error(err);
        res.status(500).json({error: 'Something went wrong'});
    });
});

router.delete('/:id', (req, res) => {
  swapiCharacter
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
  const updateableFields = ['name', 'height', 'mass', 'hair_color', 'eye_color', 'birth_year', 'gender', 'homeworld', ['species'], ['films'], ['vehicles'], ['starships'], 'edited', 'url'];
  updateableFields.forEach(field => {
    if (field in req.body) {
      updated[field] = req.body[field];
    }
  });

  swapiCharacter
    .findByIdAndUpdate(req.params.id, {$set: updated}, {new: true})
    .exec()
    .then(updatedCharacter => res.status(201).json(updatedCharacter.apiRepr()))
    .catch(err => res.status(500).json({message: 'Something went wrong'}));
});

// // when a new shopping list item is posted, make sure it's
// // got required fields ('name' and 'checked'). if not,
// // log an error and return a 400 status code. if okay,
// // add new item to ShoppingList and return it with a 201.
// router.post('/', jsonParser, (req, res) => {
//   // ensure `name` and `budget` are in request body
//   const requiredFields = ['name', 'checked'];
//   for (let i=0; i<requiredFields.length; i++) {
//     const field = requiredFields[i];
//     if (!(field in req.body)) {
//       const message = `Missing \`${field}\` in request body`
//       console.error(message);
//       return res.status(400).send(message);
//     }
//   }
//   const item = ShoppingList.create(req.body.name, req.body.checked);
//   res.status(201).json(item);
// });
//
// // when DELETE request comes in with an id in path,
// // try to delete that item from ShoppingList.
// router.delete('/:id', (req, res) => {
//   ShoppingList.delete(req.params.id);
//   console.log(`Deleted shopping list item \`${req.params.ID}\``);
//   res.status(204).end();
// });
//
//
// // when PUT request comes in with updated item, ensure has
// // required fields. also ensure that item id in url path, and
// // item id in updated item object match. if problems with any
// // of that, log error and send back status code 400. otherwise
// // call `ShoppingList.update` with updated item.
// router.put('/:id', jsonParser, (req, res) => {
//   const requiredFields = ['name', 'budget', 'id'];
//   for (let i=0; i<requiredFields.length; i++) {
//     const field = requiredFields[i];
//     if (!(field in req.body)) {
//       const message = `Missing \`${field}\` in request body`
//       console.error(message);
//       return res.status(400).send(message);
//     }
//   }
//   if (req.params.id !== req.body.id) {
//     const message = (
//       `Request path id (${req.params.id}) and request body id `
//       `(${req.body.id}) must match`);
//     console.error(message);
//     return res.status(400).send(message);
//   }
//   console.log(`Updating shopping list item \`${req.params.id}\``);
//   const updatedItem = ShoppingList.update({
//     id: req.params.id,
//     name: req.body.name,
//     budget: req.body.budget
//   });
//   res.status(204).json(updatedItem);
// })

module.exports = router;
