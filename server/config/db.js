// ======================================================
// CPS MANAGEMENT SYSTEM - MONGOOSE SERVERLESS DB POOL
// ======================================================

const mongoose = require("mongoose");

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    // 1. If already fully connected, reuse connection immediately
    if (mongoose.connection.readyState === 1) {
        cached.conn = mongoose.connection;
        return cached.conn;
    }

    const uri = process.env.MONGO_URI;
    if (!uri) {
        throw new Error(
            "MONGO_URI environment variable is missing. Please add MONGO_URI in your Vercel Project Settings (Settings -> Environment Variables)."
        );
    }

    // 2. If connection is already in progress, wait for it
    if (cached.promise && mongoose.connection.readyState === 2) {
        return cached.promise;
    }

    // 3. Configure Mongoose options for serverless
    mongoose.set("strictQuery", false);

    const opts = {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 30000,
        connectTimeoutMS: 8000,
        maxPoolSize: 10,
        minPoolSize: 1
    };

    // Log connection attempt (mask password)
    const maskedUri = uri.replace(/:([^@]+)@/, ":****@");
    console.log(`🔗 Attempting MongoDB connection... URI: ${maskedUri}`);

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
        cached.conn = mongooseInstance;
        console.log(`✅ MongoDB Connected successfully. Database: "${mongooseInstance.connection.name}", Host: "${mongooseInstance.connection.host}"`);
        return mongooseInstance;
    }).catch((err) => {
        cached.promise = null;
        cached.conn = null;
        console.error("❌ MongoDB Connection Error:", err.message);
        throw err;
    });

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        cached.conn = null;
        throw e;
    }

    return cached.conn;
};

module.exports = connectDB;