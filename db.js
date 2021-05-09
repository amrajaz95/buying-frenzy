const { MongoClient } = require("mongodb");

const connectionURL = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const databaseName = "BuyingFrenzy";

MongoClient.connect(connectionURL, { useNewUrlParser: true, useUnifiedTopology: true }, (error, client) => {
    if (error) {
        return console.log("Unable to connect to database");
    }
    module.exports.db = client.db(databaseName);
})
