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

console.log('Film is: ',typeof swapiFilm);

chai.use(chaiHttp);

// used to put randomish documents in db
// so we have data to work with and assert about.
// we use the Faker library to automatically
// generate placeholder values for author, title, content
// and then we insert that data into mongo
function seedSwapiFilmData() {
  console.info('seeding swapi film data');
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

    it('should return all existing films', function() {
      // strategy:
      //    1. get all films returned by by GET request to `/films`
      //    2. prove res has right status, data type
      //    3. prove the number of films we got back is equal to number
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
          res.body.forEach(function(film) {
            film.should.be.a('object');
            film.should.include.keys(
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
          resSwapiFilm.created.should.equal(film.created);
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
          //I forgot that the id doesn't get assigned until Mongo assigns it...
          //newSwapiFilm.id.should.equal(film.id);
          newSwapiFilm.opening_crawl.should.equal(film.opening_crawl);
          newSwapiFilm.created.should.equal(film.created);

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
        title: 'fofofofofofofof',
        director: 'foo bar baz bee bop aree bop ruhbarb pie'
      };


      return swapiFilm
        .findOne()
        .exec()
        .then(function(film) {
          updateData.id = film.id;

          // make request then inspect it to make sure it reflects
          // data we sent
          return chai.request(app)
            .put(`/films/${film.id}`)
            .send(updateData);

        })
        .then(function(res) {
          // server.js file specifies status 201 on success...
          res.should.have.status(201);

          return swapiFilm.findById(updateData.id).exec();
        })
        .then(function(film) {
          film.title.should.equal(updateData.title);
          film.director.should.equal(updateData.director);
        });
      });
  });

  describe('DELETE endpoint', function() {
    // strategy:
    //  1. get a film
    //  2. make a DELETE request for that film's id
    //  3. assert that response has right status code
    //  4. prove that film with the id doesn't exist in db anymore
    it('delete a film by id', function() {

      let film;

      return swapiFilm
        .findOne()
        .exec()
        .then(function(_film) {
          film = _film;
          return chai.request(app).delete(`/films/${film.id}`);
        })
        .then(function(res) {
          res.should.have.status(204);
          return swapiFilm.findById(film.id).exec();
        })
        .then(function(film) {
          // when a variable's value is null, chaining `should`
          // doesn't work. so `_film.should.be.null` would raise
          // an error. `should.be.null(_post)` is how we can
          // make assertions about a null value.
          should.not.exist(film);
        });
    });
  });


});
