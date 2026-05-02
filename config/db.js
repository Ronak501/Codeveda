const mongoose = require("mongoose");

async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not set. Add it in your .env file.");
  }

  await mongoose.connect(mongoUri, {
    autoIndex: true,
  });

  console.log("MongoDB connected");
}

module.exports = connectDB;
