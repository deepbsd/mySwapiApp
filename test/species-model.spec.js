const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

// this makes the should syntax available throughout
// this module
const should = chai.should();

const {swapiSpecies} = require('../src/js/mymodels/species-model');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');




chai.use(chaiHttp);


// used to put randomish documents in db
// so we have data to work with and assert about.
// we use the Faker library to automatically
// generate placeholder values for author, title, content
// and then we insert that data into mongo
function seedSwapiSpeciesData() {
  console.info('seeding swapi species data');
  const seedData = [];

  for (let i=1; i<=10; i++) {
    seedData.push(generateSwapiSpeciesData());
  }
  // this will return a promise
  return swapiSpecies.insertMany(seedData);
}


// generate an object representing a planet.
// can be used to generate seed data for db
// or request.body data
function generateSwapiSpeciesData() {
  return {
    name: `${faker.name.firstName()}`,
    classification: `${faker.lorem.words()}`,
    designation: `${faker.lorem.words()}`,
    average_height: `${faker.random.number()}`,
    skin_colors: `${faker.lorem.words()}`,
    hair_colors:  `${faker.lorem.words()}`,
    eye_colors: `${faker.lorem.words()}`,
    average_lifespan: `${faker.random.number()}`,
    homeworld: `https://www.swapi.co/api/planets/${faker.lorem.words()}`,
    language: `${faker.lorem.words()}`,
    people: [`https://www.swapi.co/api/people/${faker.random.number()}`],
    films: [`https://www.swapi.co/api/films/${faker.random.number()}`],
    created: ``,
    edited: ``,
    url: `https://www.swapi.co/api/people/${faker.random.number()}`
  }
}

// this function deletes the entire database.
// we'll call it in an `afterEach` block below
// to ensure  ata from one test does not stick
// around for next one
function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}

describe('swapiSpecies API resource', function() {

  // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `runServer`,
  // `seedCharacterData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedSwapiSpeciesData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  })


  // note the use of nested `describe` blocks.
  // this allows us to make clearer, more discrete tests that focus
  // on proving something small
  describe('GET endpoint', function() {

    it('should return all existing species', function() {
      // strategy:
      //    1. get all species returned by by GET request to `/species`
      //    2. prove res has right status, data type
      //    3. prove the number of planets we got back is equal to number
      //       in db.
      //
      // need to have access to mutate and access `res` across
      // `.then()` calls below, so declare it here so can modify in place
      let res;
      return chai.request(app)
        .get('/species')
        .then(function(_res) {
          // so subsequent .then blocks can access resp obj.
          res = _res;
          res.should.have.status(200);
          // otherwise our db seeding didn't work
          res.body.should.have.length.of.at.least(1);
          return swapiSpecies.count();
        })
        .then(function(count) {
          res.body.should.have.length.of(count);
        });
    });


    it('should return species with right fields', function() {
      // Strategy: Get back all species, and ensure they have expected keys

      let resSwapiSpecies;
      return chai.request(app)
        .get('/species')
        .then(function(res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length.of.at.least(1);

          res.body.forEach(function(species) {
            species.should.be.a('object');
            species.should.include.keys(

              //'name', 'classification', 'designation', 'average_height', 'skin_colors', 'hair_colors', 'eye_colors', 'average_lifespan', 'homeworld', 'language', 'people', 'films', 'created', 'edited', 'url');
              'name', 'classification', 'designation', 'average_lifespan', 'average_height', 'homeworld', 'people', 'url');
          });
          resSwapiSpecies = res.body[0];
          return swapiSpecies.findById(resSwapiSpecies.id);
        })
        .then(function(species) {

          //console.log('designation: ',resSwapiSpecies.designation, 'species.designation: ',species.designation);
          resSwapiSpecies.name.should.equal(species.name);
          resSwapiSpecies.classification.should.equal(species.classification);
          resSwapiSpecies.designation.should.equal(species.designation);
          resSwapiSpecies.average_height.should.equal(species.average_height);
          //resSwapiSpecies.skin_colors.should.equal(species.skin_colors);
          //resSwapiSpecies.hair_colors.should.equal(species.hair_colors);
          //resSwapiSpecies.eye_colors.should.equal(species.eye_colors);
          resSwapiSpecies.average_lifespan.should.equal(species.average_lifespan);
          resSwapiSpecies.homeworld.should.equal(species.homeworld);
          //resSwapiSpecies.language.should.equal(species.language);
          resSwapiSpecies.people.should.include.members(species.people);
          //resSwapiSpecies.films.should.include.members(species.films);
          resSwapiSpecies.url.should.equal(species.url);

        });
    });
  });

  describe('POST endpoint', function() {
    // strategy: make a POST request with data,
    // then prove that the species we get back has
    // right keys, and that `id` is there (which means
    // the data was inserted into db)
    it('should add a new species', function() {

      const newSwapiSpecies = generateSwapiSpeciesData();


      return chai.request(app)
        .post('/species')
        .send(newSwapiSpecies)
        .then(function(res) {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys(

            //'name', 'classification', 'designation', 'average_height', 'skin_colors', 'hair_colors', 'eye_colors', 'average_lifespan', 'homeworld', 'language', 'people', 'films', 'created', 'edited', 'url'
            'name', 'classification', 'designation', 'average_lifespan', 'average_height', 'homeworld', 'people', 'url'

          );
          res.body.name.should.equal(newSwapiSpecies.name);
          // cause Mongo should have created id on insertion
          res.body.id.should.not.be.null;

          return swapiSpecies.findById(res.body.id);
        })
        .then(function(species) {

          newSwapiSpecies.name.should.equal(species.name);
          newSwapiSpecies.classification.should.equal(species.classification);
          newSwapiSpecies.designation.should.equal(species.designation);
          newSwapiSpecies.average_height.should.equal(species.average_height);
          //newSwapiSpecies.skin_colors.should.equal(species.skin_colors);
          //newSwapiSpecies.hair_colors.should.equal(species.hair_colors);
          //newSwapiSpecies.eye_colors.should.equal(species.eye_colors);
          newSwapiSpecies.average_lifespan.should.equal(species.average_lifespan);
          newSwapiSpecies.homeworld.should.equal(species.homeworld);
          //newSwapiSpecies.language.should.equal(species.language);
          newSwapiSpecies.people.should.include.members(species.people);
          //newSwapiSpecies.films.should.include.members(species.films);
          // newSwapiSpecies.created.should.equal(species.created);
          // newSwapiSpecies.edited.should.equal(species.edited);
          newSwapiSpecies.url.should.equal(species.url);

        });
    });
  });

  describe('PUT endpoint', function() {

    // strategy:
    //  1. Get an existing species from db
    //  2. Make a PUT request to update that entry
    //  3. Prove character returned by request contains data we sent
    //  4. Prove character in db is correctly updated
    it('should update fields you send over', function() {
      const updateData = {
        classification: 'fofofofofofofof',
        name: 'foo bar baz bee bop aree bop ruhbarb pie'
      };


      return swapiSpecies
        .findOne()
        .exec()
        .then(function(species) {
          updateData.id = species.id;

          // make request then inspect it to make sure it reflects
          // data we sent
          return chai.request(app)
            .put(`/species/${species.id}`)
            .send(updateData);

        })
        .then(function(res) {
          // server.js file specifies status 201 on success...
          res.should.have.status(201);

          return swapiSpecies.findById(updateData.id).exec();
        })
        .then(function(species) {
          species.classification.should.equal(updateData.classification);
          species.name.should.equal(updateData.name);
        });
      });
  });

  describe('DELETE endpoint', function() {
    // strategy:
    //  1. get a species
    //  2. make a DELETE request for that species's id
    //  3. assert that response has right status code
    //  4. prove that planet with the id doesn't exist in db anymore
    it('delete a species by id', function() {

      let species;

      return swapiSpecies
        .findOne()
        .exec()
        .then(function(_species) {
          species = _species;
          return chai.request(app).delete(`/species/${species.id}`);
        })
        .then(function(res) {
          res.should.have.status(204);
          return swapiSpecies.findById(species.id).exec();
        })
        .then(function(species) {
          // when a variable's value is null, chaining `should`
          // doesn't work. so `_species.should.be.null` would raise
          // an error. `should.be.null(_post)` is how we can
          // make assertions about a null value.
          should.not.exist(species);
        });
    });
  });


});
