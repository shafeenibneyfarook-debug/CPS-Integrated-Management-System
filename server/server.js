// ======================================================
// CPS MANAGEMENT SYSTEM - BACKEND SERVER (LOCAL DEV)
// ======================================================

require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5001;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`CPS Server running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
    }
};

startServer();
