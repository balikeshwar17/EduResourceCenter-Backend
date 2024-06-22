const mongoose = require('mongoose');

const mongoURI = 'mongodb+srv://balikeshwart:LnxtH16bo8kdJBqx@cluster0.3qiqqay.mongodb.net/PapersDB?retryWrites=true&w=majority&appName=Cluster0';

const localDb='mongodb://127.0.0.1:27017/PapersDB';

mongoose.connect(localDb, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB successfully!');
});


module.exports = {db};
