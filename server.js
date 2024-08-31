const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');

let DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
); /*'mongodb://localhost:27017';*/
mongoose.connect(DB).then(() => console.log('DB Connection successful'));

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server listening at port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log(err);
  console.log('Unhandled rejection occurred! Shutting down....');
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.log(err.name, 'causes', err.message);
  console.log('Uncaught exception occurred! Shutting down....');
  server.close(() => {
    process.exit(1);
  });
});
