const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

// this makes the should syntax available throughout
// this module
const should = chai.should();

const {swapiVehicle} = require('../src/js/mymodels/vehicles-model');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

//console.log('Film is: ',typeof swapiFilm);

chai.use(chaiHttp);

// used to put randomish documents in db
// so we have data to work with and assert about.
// we use the Faker library to automatically
// generate placeholder values for author, title, content
// and then we insert that data into mongo
function seedSwapiVehicleData() {
  console.info('seeding swapi vehicle data');
  const seedData = [];

  for (let i=1; i<=10; i++) {
    seedData.push(generateSwapiVehicleData());
  }
  // this will return a promise
  return swapiVehicle.insertMany(seedData);
}


// generate an object representing a vehicle.
// can be used to generate seed data for db
// or request.body data
function generateSwapiVehicleData() {
  return {
    name: `${faker.name.firstName()}`,
    model: `${faker.random.number()}`,
    manufacturer: `${faker.name.lastName()}`,
    cost_in_credits: `${faker.random.number()}`,
    length: `${faker.random.number()}`,
    crew: `${faker.random.number()}`
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

describe('swapiVehicle API resource', function() {

  // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `runServer`,
  // `seedRestaurantData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedSwapiVehicleData();
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

    it('should return all existing vehicles', function() {
      // strategy:
      //    1. get all films returned by by GET request to `/vehicles`
      //    2. prove res has right status, data type
      //    3. prove the number of films we got back is equal to number
      //       in db.
      //
      // need to have access to mutate and access `res` across
      // `.then()` calls below, so declare it here so can modify in place
      let res;
      return chai.request(app)
        .get('/vehicles')
        .then(function(_res) {
          // so subsequent .then blocks can access resp obj.
          res = _res;
          res.should.have.status(200);
          // otherwise our db seeding didn't work
          res.body.should.have.length.of.at.least(1);
          return swapiVehicle.count();
        })
        .then(function(count) {
          res.body.should.have.length.of(count);
        });
    });


    it('should return vehicles with right fields', function() {
      // Strategy: Get back all planets, and ensure they have expected keys

      let resSwapiVehicle;
      return chai.request(app)
        .get('/vehicles')
        .then(function(res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length.of.at.least(1);
          res.body.forEach(function(film) {
            film.should.be.a('object');
            film.should.include.keys(

              'name', 'model', 'manufacturer', 'cost_in_credits', 'length', 'crew');
          });
          resSwapiVehicle = res.body[0];
          return swapiVehicle.findById(resSwapiVehicle.id);
        })
        .then(function(vehicle) {

          resSwapiVehicle.name.should.equal(vehicle.name);
          resSwapiVehicle.model.should.equal(vehicle.model);
          resSwapiVehicle.manufacturer.should.equal(vehicle.manufacturer);
          resSwapiVehicle.cost_in_credits.should.equal(vehicle.cost_in_credits);
          resSwapiVehicle.length.should.equal(vehicle.length);
          resSwapiVehicle.crew.should.equal(vehicle.crew);
        });
    });
  });

  describe('POST endpoint', function() {
    // strategy: make a POST request with data,
    // then prove that the planet we get back has
    // right keys, and that `id` is there (which means
    // the data was inserted into db)
    it('should add a new vehicle', function() {

      const newSwapiVehicle = generateSwapiVehicleData();

      return chai.request(app)
        .post('/vehicles')
        .send(newSwapiVehicle)
        .then(function(res) {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys(
            'name', 'model', 'manufacturer', 'cost_in_credits', 'id', 'length', 'crew');
          res.body.name.should.equal(newSwapiVehicle.name);
          // cause Mongo should have created id on insertion
          res.body.id.should.not.be.null;

          return swapiVehicle.findById(res.body.id);
        })
        .then(function(vehicle) {

          newSwapiVehicle.name.should.equal(vehicle.name);
          newSwapiVehicle.model.should.equal(vehicle.model);
          newSwapiVehicle.manufacturer.should.equal(vehicle.manufacturer);
          newSwapiVehicle.cost_in_credits.should.equal(vehicle.cost_in_credits);
          //I forgot that the id doesn't get assigned until Mongo assigns it...
          //newSwapiFilm.id.should.equal(film.id);
          newSwapiVehicle.length.should.equal(vehicle.length);
          newSwapiVehicle.crew.should.equal(vehicle.crew);

        });
    });
  });

  describe('PUT endpoint', function() {

    // strategy:
    //  1. Get an existing vehicle from db
    //  2. Make a PUT request to update that entry
    //  3. Prove vehicle returned by request contains data we sent
    //  4. Prove vehicle in db is correctly updated
    it('should update fields you send over', function() {
      const updateData = {
        name: 'fofofofofofofof',
        model: 'foo bar baz bee bop aree bop ruhbarb pie'
      };


      return swapiVehicle
        .findOne()
        .exec()
        .then(function(vehicle) {
          updateData.id = vehicle.id;

          // make request then inspect it to make sure it reflects
          // data we sent
          return chai.request(app)
            .put(`/vehicles/${vehicle.id}`)
            .send(updateData);

        })
        .then(function(res) {
          // server.js file specifies status 201 on success...
          res.should.have.status(201);

          return swapiVehicle.findById(updateData.id).exec();
        })
        .then(function(vehicle) {
          vehicle.name.should.equal(updateData.name);
          vehicle.model.should.equal(updateData.model);
        });
      });
  });

  describe('DELETE endpoint', function() {
    // strategy:
    //  1. get a vehicle
    //  2. make a DELETE request for that vehicle's id
    //  3. assert that response has right status code
    //  4. prove that vehicle with the id doesn't exist in db anymore
    it('delete a vehicle by id', function() {

      let vehicle;

      return swapiVehicle
        .findOne()
        .exec()
        .then(function(_vehicle) {
          vehicle = _vehicle;
          return chai.request(app).delete(`/vehicles/${vehicle.id}`);
        })
        .then(function(res) {
          res.should.have.status(204);
          return swapiVehicle.findById(vehicle.id).exec();
        })
        .then(function(vehicle) {
          // when a variable's value is null, chaining `should`
          // doesn't work. so `_film.should.be.null` would raise
          // an error. `should.be.null(_post)` is how we can
          // make assertions about a null value.
          should.not.exist(vehicle);
        });
    });
  });


});
