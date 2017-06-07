const express = require('express');

const morgan = require('morgan');



const app = express();

const {DATABASE_URL, PORT} = require('./config');

app.use(morgan('common'));

app.use('/', express.static(__dirname+'/public'));
app.use('/css', express.static(__dirname+'/src/css'));
app.use('/img', express.static(__dirname+'/src/img'));
app.use('/js', express.static(__dirname+'/src/js'));
app.use('/jquery', express.static(__dirname+'/node_modules/jquery/dist'));



const peopleRouter = require('./src/js/peopleRouter');
const planetsRouter = require('./src/js/planetsRouter');
const speciesRouter = require('./src/js/speciesRouter');
const filmsRouter = require('./src/js/filmsRouter');
const vehiclesRouter = require('./src/js/vehiclesRouter');
const starshipsRouter = require('./src/js/starshipsRouter');

//  I think this is all there is to setting user auth...
const {router: usersRouter} = require('./src/js/users');
app.use('/users/', usersRouter);

app.use('/people', peopleRouter);
app.use('/species', speciesRouter);
app.use('/planets', planetsRouter);
app.use('/films', filmsRouter);
app.use('/vehicles', vehiclesRouter);
app.use('/starships', starshipsRouter);




const bodyParser = require('body-parser');
const mongoose = require('mongoose');
app.use(bodyParser.json());
mongoose.Promise = global.Promise;




// app.put('/posts/:id', (req, res) => {
//   if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
//     res.status(400).json({
//       error: 'Request path id and request body id values must match'
//     });
//   }
//
//   const updated = {};
//   const updateableFields = ['title', 'content', 'author'];
//   updateableFields.forEach(field => {
//     if (field in req.body) {
//       updated[field] = req.body[field];
//     }
//   });
//
//   BlogPost
//     .findByIdAndUpdate(req.params.id, {$set: updated}, {new: true})
//     .exec()
//     .then(updatedPost => res.status(201).json(updatedPost.apiRepr()))
//     .catch(err => res.status(500).json({message: 'Something went wrong'}));
// });
//
//
// app.delete('/:id', (req, res) => {
//   BlogPosts
//     .findByIdAndRemove(req.params.id)
//     .exec()
//     .then(() => {
//       console.log(`Deleted blog post with id \`${req.params.ID}\``);
//       res.status(204).end();
//     });
// });


app.use('*', function(req, res) {
  res.status(404).json({message: 'Not Found'});
});

// closeServer needs access to a server object, but that only
// gets created when `runServer` runs, so we declare `server` here
// and then assign a value to it in run
let server;

// this function connects to our database, then starts the server
function runServer(databaseUrl=DATABASE_URL, port=PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
     return new Promise((resolve, reject) => {
       console.log('Closing server');
       server.close(err => {
           if (err) {
               return reject(err);
           }
           resolve();
       });
     });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {runServer, app, closeServer};
