const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

// this makes the should syntax available throughout
// this module
const should = chai.should();

const {User} = require('../src/js/users/models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');




chai.use(chaiHttp);

// used to put randomish documents in db
// so we have data to work with and assert about.
// we use the Faker library to automatically
// generate placeholder values for author, title, content
// and then we insert that data into mongo
function seedSwapiUserData() {
  console.info('seeding swapi character data');
  const seedData = [];

  for (let i=1; i<=10; i++) {
    seedData.push(generateSwapiUserData());
  }
  // this will return a promise
  return User.insertMany(seedData);
}


// generate an object representing a planet.
// can be used to generate seed data for db
// or request.body data
function generateSwapiUserData() {
  return {
    username: `${faker.internet.userName()}`,
    firstName: `${faker.name.firstName()}`,
    lastName: `${faker.name.lastName()}`,
    password: `${faker.lorem.words()}`
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

describe('swapiUser API resource', function() {

  // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `runServer`,
  // `seedCharacterData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedSwapiUserData();
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

    it('should return all existing swapi Users', function() {
      // strategy:
      //    1. get all planets returned by by GET request to `/users`
      //    2. prove res has right status, data type
      //    3. prove the number of users we got back is equal to number
      //       in db.
      //
      // need to have access to mutate and access `res` across
      // `.then()` calls below, so declare it here so can modify in place
      let res;
      return chai.request(app)
        .get('/users')
        .then(function(_res) {
          // so subsequent .then blocks can access resp obj.
          res = _res;
          res.should.have.status(200);
          // otherwise our db seeding didn't work
          res.body.should.have.length.of.at.least(1);
          return User.count();
        })
        .then(function(count) {
          res.body.should.have.length.of(count);
        });
    });


    it('should return users with right fields', function() {
      // Strategy: Get back all planets, and ensure they have expected keys

      let resSwapiUser;
      return chai.request(app)
        .get('/users')
        .then(function(res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length.of.at.least(1);

          res.body.forEach(function(user) {
            user.should.be.a('object');
            user.should.include.keys(

              'username', 'firstName', 'lastName');
          });
          resSwapiUser = res.body[0];
          //console.log('resSwapiUser: ', resSwapiUser);
          return User.findById(resSwapiUser.id);
        })
        .then(function(user) {
          //console.log('RESSwapiUser: ', resSwapiUser.username, 'user: ',user.username);
          resSwapiUser.username.should.equal(user.username);
          resSwapiUser.firstName.should.equal(user.firstName);
          resSwapiUser.lastName.should.equal(user.lastName);
        });
    });
  });

  describe('POST endpoint', function() {
    // strategy: make a POST request with data,
    // then prove that the user we get back has
    // right keys, and that `id` is there (which means
    // the data was inserted into db)
    it('should add a new user', function() {

      const newSwapiUser = generateSwapiUserData();


      return chai.request(app)
        .post('/users')
        .send(newSwapiUser)
        .then(function(res) {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys(
            'username', 'id','firstName', 'lastName');
          res.body.username.should.equal(newSwapiUser.username);
          // cause Mongo should have created id on insertion
          res.body.id.should.not.be.null;

          return User.findById(res.body.id);
        })
        .then(function(user) {

          //console.log('What? ',user.username);

          newSwapiUser.username.should.equal(user.username);
          newSwapiUser.firstName.should.equal(user.firstName);
          newSwapiUser.lastName.should.equal(user.lastName);

        });
    });
  });

  describe('PUT endpoint', function() {

    // strategy:
    //  1. Get an existing user from db
    //  2. Make a PUT request to update that entry
    //  3. Prove user returned by request contains data we sent
    //  4. Prove user in db is correctly updated
    it('should update fields you send over', function() {
      const updateData = {
        firstName: 'fofofofofofofof',
        lastName: 'foo bar baz bee bop aree bop ruhbarb pie'
      };


      return User
        .findOne()
        .exec()
        .then(function(user) {
          //console.log('HEY:  ',user.id);
          updateData.id = user.id;

          // make request then inspect it to make sure it reflects
          // data we sent

          return chai.request(app)
            .put(`/users/${user.id}`)
            .send(updateData);

        })
        .then(function(res) {
          // server.js file specifies status 201 on success...

          res.should.have.status(201);

          return User.findById(updateData.id).exec();
        })
        .then(function(user) {
          console.log('HEY YOU: ',user.firstName);
          user.firstName.should.equal(updateData.firstName);
          user.lastName.should.equal(updateData.lastName);
        });
      });
  });

  describe('DELETE endpoint', function() {
    // strategy:
    //  1. get a user
    //  2. make a DELETE request for that user's id
    //  3. assert that response has right status code
    //  4. prove that user with the id doesn't exist in db anymore
    it('delete a user by id', function() {

      let user;

      return User
        .findOne()
        .exec()
        .then(function(_user) {
          user = _user;
          return chai.request(app).delete(`/users/${user.id}`);
        })
        .then(function(res) {
          res.should.have.status(204);
          return User.findById(user.id).exec();
        })
        .then(function(user) {
          // when a variable's value is null, chaining `should`
          // doesn't work. so `_user.should.be.null` would raise
          // an error. `should.be.null(_post)` is how we can
          // make assertions about a null value.
          should.not.exist(user);
        });
    });
  });


});
