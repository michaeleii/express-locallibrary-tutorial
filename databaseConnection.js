require("dotenv").config();

let { MONGODB_URL } = process.env;

// Import the mongoose module
const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

// Define the database URL to connect to.
const mongoDB = MONGODB_URL;

// Wait for database to connect, logging an error if there is a problem
const connectToMongoDB = async () => {
	await mongoose.connect(mongoDB);
};

module.exports = connectToMongoDB;
