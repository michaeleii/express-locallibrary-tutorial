require("dotenv").config();

let { MONGODB } = process.env;

// Import the mongoose module
const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

// Define the database URL to connect to.
const mongoDB = `mongodb+srv://${MONGODB}@cluster0.knxcea1.mongodb.net/local_library?retryWrites=true&w=majority`;

// Wait for database to connect, logging an error if there is a problem
const connectToMongoDB = async () => {
	await mongoose.connect(mongoDB);
};

module.exports = connectToMongoDB;
