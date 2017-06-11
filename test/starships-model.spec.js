const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

// this makes the should syntax available throughout
// this module
const should = chai.should();

const {swapiStarship} = require('../src/js/mymodels/starships-model');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

//console.log('Starship is: ',typeof swapiFilm);

chai.use(chaiHttp);

// used to put randomish documents in db
// so we have data to work with and assert about.
// we use the Faker library to automatically
// generate placeholder values for author, title, content
// and then we insert that data into mongo
function seedSwapiStarshipData() {
  console.info('seeding swapi starship data');
  const seedData = [];

  for (let i=1; i<=10; i++) {
    seedData.push(generateSwapiStarshipData());
  }
  // this will return a promise
  return swapiStarship.insertMany(seedData);
}


// generate an object representing a planet.
// can be used to generate seed data for db
// or request.body data
function generateSwapiStarshipData() {
  return {
    name: `${faker.name.firstName()}`,
    model: `${faker.random.number()}`,
    manufacturer: `${faker.name.lastName()}`,
    cost_in_credits: `${faker.random.number()}`,
    length: `${faker.random.number()}`,
    crew: `${faker.random.number()}`,
    cargo_capacity: `${faker.random.number()}`,
    hyperdrive_rating: `${faker.lorem.words()}`,
    starship_class: `${faker.lorem.words()}`
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

describe('swapiStarship API resource', function() {

  // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `runServer`,
  // `seedRestaurantData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedSwapiStarshipData();
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

    it('should return all existing starships', function() {
      // strategy:
      //    1. get all films returned by by GET request to `/starships`
      //    2. prove res has right status, data type
      //    3. prove the number of films we got back is equal to number
      //       in db.
      //
      // need to have access to mutate and access `res` across
      // `.then()` calls below, so declare it here so can modify in place
      let res;
      return chai.request(app)
        .get('/starships')
        .then(function(_res) {
          // so subsequent .then blocks can access resp obj.
          res = _res;
          res.should.have.status(200);
          // otherwise our db seeding didn't work
          res.body.should.have.length.of.at.least(1);
          return swapiStarship.count();
        })
        .then(function(count) {
          res.body.should.have.length.of(count);
        });
    });


    it('should return starships with right fields', function() {
      // Strategy: Get back all planets, and ensure they have expected keys

      let resSwapiStarship;
      return chai.request(app)
        .get('/starships')
        .then(function(res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length.of.at.least(1);
          res.body.forEach(function(film) {
            film.should.be.a('object');
            film.should.include.keys(

              'name', 'model', 'manufacturer', 'cost_in_credits', 'id', 'length', 'crew', 'cargo_capacity', 'hyperdrive_rating', 'starship_class');
          });
          resSwapiStarship = res.body[0];
          return swapiStarship.findById(resSwapiStarship.id);
        })
        .then(function(starship) {

          resSwapiStarship.name.should.equal(starship.name);
          resSwapiStarship.model.should.equal(starship.model);
          resSwapiStarship.manufacturer.should.equal(starship.manufacturer);
          resSwapiStarship.cost_in_credits.should.equal(starship.cost_in_credits);
          resSwapiStarship.id.should.equal(starship.id);
          resSwapiStarship.length.should.equal(starship.length);
          resSwapiStarship.crew.should.equal(starship.crew);
          resSwapiStarship.cargo_capacity.should.equal(starship.cargo_capacity);
          resSwapiStarship.hyperdrive_rating.should.equal(starship.hyperdrive_rating);
          resSwapiStarship.starship_class.should.equal(starship.starship_class);
        });
    });
  });

  describe('POST endpoint', function() {
    // strategy: make a POST request with data,
    // then prove that the starship we get back has
    // right keys, and that `id` is there (which means
    // the data was inserted into db)
    it('should add a new starship', function() {

      const newSwapiStarship = generateSwapiStarshipData();

      return chai.request(app)
        .post('/starships')
        .send(newSwapiStarship)
        .then(function(res) {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys(
            'name', 'model', 'manufacturer', 'cost_in_credits', 'id', 'length', 'crew', 'cargo_capacity', 'hyperdrive_rating', 'starship_class');
          res.body.name.should.equal(newSwapiStarship.name);
          // cause Mongo should have created id on insertion
          res.body.id.should.not.be.null;

          return swapiStarship.findById(res.body.id);
        })
        .then(function(starship) {

          newSwapiStarship.name.should.equal(starship.name);
          newSwapiStarship.model.should.equal(starship.model);
          newSwapiStarship.manufacturer.should.equal(starship.manufacturer);
          newSwapiStarship.cost_in_credits.should.equal(starship.cost_in_credits);
          //I forgot that the id doesn't get assigned until Mongo assigns it...
          //newSwapiFilm.id.should.equal(film.id);
          newSwapiStarship.length.should.equal(starship.length);
          newSwapiStarship.crew.should.equal(starship.crew);
          newSwapiStarship.cargo_capacity.should.equal(starship.cargo_capacity);
          newSwapiStarship.hyperdrive_rating.should.equal(starship.hyperdrive_rating);
          newSwapiStarship.starship_class.should.equal(starship.starship_class);
        });
    });
  });

  describe('PUT endpoint', function() {

    // strategy:
    //  1. Get an existing film from db
    //  2. Make a PUT request to update that entry
    //  3. Prove film returned by request contains data we sent
    //  4. Prove film in db is correctly updated
    it('should update fields you send over', function() {
      const updateData = {
        name: 'fofofofofofofof',
        manufacturer: 'foo bar baz bee bop aree bop ruhbarb pie'
      };


      return swapiStarship
        .findOne()
        .exec()
        .then(function(starship) {
          updateData.id = starship.id;

          // make request then inspect it to make sure it reflects
          // data we sent
          return chai.request(app)
            .put(`/starships/${starship.id}`)
            .send(updateData);

        })
        .then(function(res) {
          // server.js file specifies status 201 on success...
          res.should.have.status(201);

          return swapiStarship.findById(updateData.id).exec();
        })
        .then(function(starship) {
          starship.name.should.equal(updateData.name);
          starship.manufacturer.should.equal(updateData.manufacturer);
        });
      });
  });

  describe('DELETE endpoint', function() {
    // strategy:
    //  1. get a starship
    //  2. make a DELETE request for that starship's id
    //  3. assert that response has right status code
    //  4. prove that film with the id doesn't exist in db anymore
    it('delete a starship by id', function() {

      let starship;

      return swapiStarship
        .findOne()
        .exec()
        .then(function(_starship) {
          starship = _starship;
          return chai.request(app).delete(`/starships/${starship.id}`);
        })
        .then(function(res) {
          res.should.have.status(204);
          return swapiStarship.findById(starship.id).exec();
        })
        .then(function(starship) {
          // when a variable's value is null, chaining `should`
          // doesn't work. so `_film.should.be.null` would raise
          // an error. `should.be.null(_post)` is how we can
          // make assertions about a null value.
          should.not.exist(starship);
        });
    });
  });


});
