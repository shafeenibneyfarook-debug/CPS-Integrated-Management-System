const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("⚠️ MONGO_URI is missing in server/.env");
            return;
        }

        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });

        console.log("MongoDB Connected");
        console.log("Database Name:", mongoose.connection.name);
    } catch (error) {
        console.error("MongoDB Connection Error:", error.message);
        if (error.message.includes("bad auth") || error.message.includes("authentication failed")) {
            console.error("👉 Check your MongoDB Atlas credentials (username/password) in server/.env");
        }
    }
};

module.exports = connectDB;