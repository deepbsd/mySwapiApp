const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

// this makes the should syntax available throughout
// this module
const should = chai.should();

const {swapiCharacter} = require('../src/js/mymodels/character-model');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');




chai.use(chaiHttp);

// used to put randomish documents in db
// so we have data to work with and assert about.
// we use the Faker library to automatically
// generate placeholder values for author, title, content
// and then we insert that data into mongo
function seedSwapiCharacterData() {
  console.info('seeding swapi character data');
  const seedData = [];

  for (let i=1; i<=10; i++) {
    seedData.push(generateSwapiCharacterData());
  }
  // this will return a promise
  return swapiCharacter.insertMany(seedData);
}


// generate an object representing a planet.
// can be used to generate seed data for db
// or request.body data
function generateSwapiCharacterData() {
  return {
    name: `${faker.name.firstName()}`,
    height: `${faker.random.number()}`,
    mass: `${faker.random.number()}`,
    hair_color: `${faker.lorem.words()}`,
    eye_color: `${faker.lorem.words()}`,
    birth_year: `${faker.date.past()}`,
    gender: `${faker.lorem.words()}`,
    homeworld: `${faker.lorem.words()}`,
    films: [`https://www.swapi.co/api/films/${faker.random.number()}`],
    species: [`https://www.swapi.co/api/species/${faker.random.number()}`],
    vehicles: [`https://www.swapi.co/api/vehicles/${faker.random.number()}`],
    starships: [`https://www.swapi.co/api/starships/${faker.random.number()}`],
    created: `${faker.date.past()}`,
    edited: `${faker.date.past()}`,
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

describe('swapiPlanet API resource', function() {

  // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `runServer`,
  // `seedCharacterData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedSwapiCharacterData();
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

    it('should return all existing characters', function() {
      // strategy:
      //    1. get all planets returned by by GET request to `/planets`
      //    2. prove res has right status, data type
      //    3. prove the number of planets we got back is equal to number
      //       in db.
      //
      // need to have access to mutate and access `res` across
      // `.then()` calls below, so declare it here so can modify in place
      let res;
      return chai.request(app)
        .get('/people')
        .then(function(_res) {
          // so subsequent .then blocks can access resp obj.
          res = _res;
          res.should.have.status(200);
          // otherwise our db seeding didn't work
          res.body.should.have.length.of.at.least(1);
          return swapiCharacter.count();
        })
        .then(function(count) {
          res.body.should.have.length.of(count);
        });
    });


    it('should return characters with right fields', function() {
      // Strategy: Get back all planets, and ensure they have expected keys

      let resSwapiCharacter;
      return chai.request(app)
        .get('/people')
        .then(function(res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length.of.at.least(1);

          res.body.forEach(function(character) {
            character.should.be.a('object');
            character.should.include.keys(

              //'name', 'height', 'mass', 'hair_color', 'eye_color', 'birth_year', 'gender', 'homeworld', 'films', 'species', 'vehicles', 'starships', 'created', 'edited', 'url');
              'name', 'id','gender', 'homeworld', 'species', 'created');
          });
          resSwapiCharacter = res.body[0];
          return swapiCharacter.findById(resSwapiCharacter.id);
        })
        .then(function(character) {

          resSwapiCharacter.name.should.equal(character.name);
          //resSwapiCharacter.height.should.equal(character.height);
          //resSwapiCharacter.mass.should.equal(character.mass);
          //resSwapiCharacter.hair_color.should.equal(character.hair_color);
          resSwapiCharacter.id.should.equal(character.id);
          //resSwapiCharacter.eye_color.should.equal(character.eye_color);
          //resSwapiCharacter.birth_year.should.equal(character.birth_year);
          resSwapiCharacter.gender.should.equal(character.gender);
          resSwapiCharacter.homeworld.should.equal(character.homeworld);
          resSwapiCharacter.species.should.include.members(character.species);
          //resSwapiCharacter.films.should.include.members(character.films);
          //resSwapiCharacter.vehicles.should.include.members(character.vehicles);
          //resSwapiCharacter.starships.should.include.members(character.starships);
          resSwapiCharacter.created.should.equal(character.created);
          //resSwapiCharacter.edited.should.equal(character.edited);
          //resSwapiCharacter.url.should.equal(character.url);
        });
    });
  });

  // describe('GET /:id endpoint', function(){
  //   it('should return apiTestRepr for a character', function(){
  //     return chai.request(app)
  //       .get('/people/59284545a4da777e8f3b1517')
  //       .then(function (_res){
  //         res = _res;
  //         res.should.have.status(200);
  //         res.should.be.json();
  //       });
  //   });
  // });


  describe('POST endpoint', function() {
    // strategy: make a POST request with data,
    // then prove that the character we get back has
    // right keys, and that `id` is there (which means
    // the data was inserted into db)
    it('should add a new character', function() {

      const newSwapiCharacter = generateSwapiCharacterData();


      return chai.request(app)
        .post('/people')
        .send(newSwapiCharacter)
        .then(function(res) {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys(
            'name', 'id','gender', 'homeworld', 'species', 'created');
          res.body.name.should.equal(newSwapiCharacter.name);
          // cause Mongo should have created id on insertion
          res.body.id.should.not.be.null;

          return swapiCharacter.findById(res.body.id);
        })
        .then(function(character) {

          console.log('What? ',character.species);

          //console.log('M: newSwapiCharacter: ',newSwapiCharacter.species,'character.species:',character.species);
          newSwapiCharacter.name.should.equal(character.name);
          newSwapiCharacter.gender.should.equal(character.gender);
          newSwapiCharacter.homeworld.should.equal(character.homeworld);
          newSwapiCharacter.species.should.include.members(character.species);
          //newSwapiCharacter.created.should.equal(character.created);

        });
    });
  });

  describe('PUT endpoint', function() {

    // strategy:
    //  1. Get an existing character from db
    //  2. Make a PUT request to update that entry
    //  3. Prove character returned by request contains data we sent
    //  4. Prove character in db is correctly updated
    it('should update fields you send over', function() {
      const updateData = {
        gender: 'fofofofofofofof',
        name: 'foo bar baz bee bop aree bop ruhbarb pie'
      };


      return swapiCharacter
        .findOne()
        .exec()
        .then(function(character) {
          updateData.id = character.id;

          // make request then inspect it to make sure it reflects
          // data we sent
          return chai.request(app)
            .put(`/people/${character.id}`)
            .send(updateData);

        })
        .then(function(res) {
          // server.js file specifies status 201 on success...
          res.should.have.status(201);

          return swapiCharacter.findById(updateData.id).exec();
        })
        .then(function(character) {
          character.gender.should.equal(updateData.gender);
          character.name.should.equal(updateData.name);
        });
      });
  });

  describe('DELETE endpoint', function() {
    // strategy:
    //  1. get a character
    //  2. make a DELETE request for that character's id
    //  3. assert that response has right status code
    //  4. prove that planet with the id doesn't exist in db anymore
    it('delete a character by id', function() {

      let character;

      return swapiCharacter
        .findOne()
        .exec()
        .then(function(_character) {
          character = _character;
          return chai.request(app).delete(`/people/${character.id}`);
        })
        .then(function(res) {
          res.should.have.status(204);
          return swapiCharacter.findById(character.id).exec();
        })
        .then(function(character) {
          // when a variable's value is null, chaining `should`
          // doesn't work. so `_character.should.be.null` would raise
          // an error. `should.be.null(_post)` is how we can
          // make assertions about a null value.
          should.not.exist(character);
        });
    });
  });


});
