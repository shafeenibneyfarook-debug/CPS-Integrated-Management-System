// Import axios library
// Axios is used to send requests from React frontend to Express backend
import axios from "axios";


// Create a reusable API connection
// Every module (client, project, supplier) will use this
const API = axios.create({

    // Backend server base URL
    // Example:
    // API.get("/projects")
    // becomes:
    // GET http://localhost:5001/api/projects

    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api"

});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("cps_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("cps_token");
            window.dispatchEvent(new Event("cps:unauthorized"));
        }
        return Promise.reject(error);
    }
);


// Export API instance
// Other files can import this and call backend APIs
export default API;
