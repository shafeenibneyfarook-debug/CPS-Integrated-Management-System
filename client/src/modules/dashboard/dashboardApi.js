// Import axios configuration
// This connects frontend with backend

import API from "../../api/axiosConfig";





// Get dashboard statistics
//
// API:
// GET /api/dashboard

export const getDashboardStats = () => {


    return API.get("/dashboard");


};








// Get recent activities
//
// API:
// GET /api/dashboard/activities
//
// Returns:
// latest clients
// latest projects
// latest suppliers


export const getRecentActivities = () => {


    return API.get("/dashboard/activities");


};