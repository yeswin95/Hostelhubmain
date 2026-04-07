const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME || "hostelhub";
  if (!mongoUri) {
    throw new Error("MONGO_URI is required in environment variables");
  }

  await mongoose.connect(mongoUri, {
    dbName,
    serverSelectionTimeoutMS: 10000
  });
  console.log(`MongoDB Atlas connected (db: ${dbName})`);
};

module.exports = connectDB;
