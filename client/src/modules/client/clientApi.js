// Import configured axios instance
// This already contains:
// http://localhost:5000/api
import API from "../../api/axiosConfig";



// ==========================================
// GET ALL CLIENTS
// ==========================================
// Fetch all clients from backend
// API:
// GET /api/clients

export const getClients = (params = {}) => {

    return API.get("/clients", { params });

};




// ==========================================
// CREATE CLIENT
// ==========================================
// Create a new client
// API:
// POST /api/clients

export const createClient = (data) => {

    return API.post("/clients", data);

};




// ==========================================
// GET SINGLE CLIENT
// ==========================================
// Get one client using ID
// API:
// GET /api/clients/:id

export const getClientById = (id) => {

    return API.get(`/clients/${id}`);

};




// ==========================================
// UPDATE CLIENT
// ==========================================
// Update existing client
// API:
// PUT /api/clients/:id

export const updateClient = (id, data) => {

    return API.put(`/clients/${id}`, data);

};




// ==========================================
// DELETE CLIENT
// ==========================================
// Delete client using ID
// API:
// DELETE /api/clients/:id

export const deleteClient = (id) => {

    return API.delete(`/clients/${id}`);

};
