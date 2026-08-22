const app = require("../server/server");
const connectDB = require("../server/config/db");

let databaseConnection;

module.exports = async (req, res) => {
    try {
        databaseConnection ||= connectDB();
        await databaseConnection;
        return app(req, res);
    } catch (error) {
        databaseConnection = undefined;
        console.error("Database unavailable:", error.message);
        return res.status(503).json({ message: "Database connection unavailable" });
    }
};
