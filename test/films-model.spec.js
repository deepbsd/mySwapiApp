const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

// this makes the should syntax available throughout
// this module
const should = chai.should();

const {swapiFilm} = require('../src/js/mymodels/films-model');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

console.log('Planet is: ',typeof swapiFilm);

chai.use(chaiHttp);

// used to put randomish documents in db
// so we have data to work with and assert about.
// we use the Faker library to automatically
// generate placeholder values for author, title, content
// and then we insert that data into mongo
function seedSwapiFilmData() {
  console.info('seeding swapi planet data');
  const seedData = [];

  for (let i=1; i<=10; i++) {
    seedData.push(generateSwapiFilmData());
  }
  // this will return a promise
  return swapiFilm.insertMany(seedData);
}


// generate an object representing a planet.
// can be used to generate seed data for db
// or request.body data
function generateSwapiFilmData() {
  return {
    title: `${faker.name.firstName()}`,
    episode_id: `${faker.random.number()}`,
    release_date: `${faker.date.past()}`,
    director: `${faker.name.findName()}`,
    opening_crawl: `${faker.lorem.words()}`,
    created: `${faker.date.past()}`
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

describe('swapiFilm API resource', function() {

  // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `runServer`,
  // `seedRestaurantData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedSwapiFilmData();
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

    it('should return all existing planets', function() {
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
        .get('/films')
        .then(function(_res) {
          // so subsequent .then blocks can access resp obj.
          res = _res;
          res.should.have.status(200);
          // otherwise our db seeding didn't work
          res.body.should.have.length.of.at.least(1);
          return swapiFilm.count();
        })
        .then(function(count) {
          res.body.should.have.length.of(count);
        });
    });


    it('should return films with right fields', function() {
      // Strategy: Get back all planets, and ensure they have expected keys

      let resSwapiFilm;
      return chai.request(app)
        .get('/films')
        .then(function(res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length.of.at.least(1);

          title: `${faker.name.firstName()}`,
          episode_id: `${faker.random.number()}`,
          release_date: `${faker.date.past()}`,
          director: `${faker.name.findName()}`,
          opening_crawl: `${faker.lorem.words()}`,
          created: `${faker.date.past()}`


          res.body.forEach(function(film) {
            planet.should.be.a('object');
            planet.should.include.keys(
              'title', 'episode_id', 'release_date', 'director', 'id', 'opening_crawl', 'created');
          });
          resSwapiFilm = res.body[0];
          return swapiFilm.findById(resSwapiFilm.id);
        })
        .then(function(film) {

          resSwapiFilm.title.should.equal(film.title);
          resSwapiFilm.episode_id.should.equal(film.episode_id);
          resSwapiFilm.release_date.should.equal(film.release_date);
          resSwapiFilm.director.should.equal(film.director);
          resSwapiFilm.id.should.equal(film.id);
          resSwapiFilm.opening_crawl.should.equal(film.opening_crawl);
          resSwapiFilm.created.should.include.members(film.created);
        });
    });
  });

  describe('POST endpoint', function() {
    // strategy: make a POST request with data,
    // then prove that the planet we get back has
    // right keys, and that `id` is there (which means
    // the data was inserted into db)
    it('should add a new film', function() {

      const newSwapiFilm = generateSwapiFilmData();

      return chai.request(app)
        .post('/films')
        .send(newSwapiFilm)
        .then(function(res) {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys(
            'title', 'episode_id', 'release_date', 'director', 'id', 'opening_crawl', 'created');
          res.body.title.should.equal(newSwapiFilm.title);
          // cause Mongo should have created id on insertion
          res.body.id.should.not.be.null;

          return swapiFilm.findById(res.body.id);
        })
        .then(function(film) {

          newSwapiFilm.title.should.equal(film.title);
          newSwapiFilm.episode_id.should.equal(film.episode_id);
          newSwapiFilm.release_date.should.equal(film.release_date);
          newSwapiFilm.director.should.equal(film.director);
          newSwapiFilm.id.should.equal(film.id);
          //I forgot that the id doesn't get assigned until Mongo assigns it...
          //newSwapiPlanet.id.should.equal(planet.id);
          newSwapiFilm.opening_crawl.should.equal(film.opening_crawl);
          newSwapiFilm.created.should.include.members(film.created);

        });
    });
  });

  describe('PUT endpoint', function() {

    // strategy:
    //  1. Get an existing planet from db
    //  2. Make a PUT request to update that entry
    //  3. Prove planet returned by request contains data we sent
    //  4. Prove planet in db is correctly updated
    it('should update fields you send over', function() {
      const updateData = {
        terrain: 'fofofofofofofof',
        population: 'foo bar baz bee bop aree bop ruhbarb pie'
      };


      return swapiPlanet
        .findOne()
        .exec()
        .then(function(planet) {
          updateData.id = planet.id;

          // make request then inspect it to make sure it reflects
          // data we sent
          return chai.request(app)
            .put(`/planets/${planet.id}`)
            .send(updateData);

        })
        .then(function(res) {
          // server.js file specifies status 201 on success...
          res.should.have.status(201);

          return swapiPlanet.findById(updateData.id).exec();
        })
        .then(function(planet) {
          planet.terrain.should.equal(updateData.terrain);
          planet.population.should.equal(updateData.population);
        });
      });
  });

  describe('DELETE endpoint', function() {
    // strategy:
    //  1. get a planet
    //  2. make a DELETE request for that planet's id
    //  3. assert that response has right status code
    //  4. prove that planet with the id doesn't exist in db anymore
    it('delete a character by id', function() {

      let planet;

      return swapiPlanet
        .findOne()
        .exec()
        .then(function(_planet) {
          planet = _planet;
          return chai.request(app).delete(`/planets/${planet.id}`);
        })
        .then(function(res) {
          res.should.have.status(204);
          return swapiPlanet.findById(planet.id).exec();
        })
        .then(function(planet) {
          // when a variable's value is null, chaining `should`
          // doesn't work. so `_planet.should.be.null` would raise
          // an error. `should.be.null(_post)` is how we can
          // make assertions about a null value.
          should.not.exist(planet);
        });
    });
  });


});
