const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGO_DB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

const connectDB = async () => {
  if (!db) {
    await client.connect();
    db = client.db('SunPet');
    console.log('MongoDB connected');
  }
  return db;
};

module.exports = connectDB;