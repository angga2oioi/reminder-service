const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_DB_URL, {
  maxPoolSize: 40,
});
mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});
mongoose.connection.on('error', (error) => {
  console.log(error);
});

module.exports = mongoose;
