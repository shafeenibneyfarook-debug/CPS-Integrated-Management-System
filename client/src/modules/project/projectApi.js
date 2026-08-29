// ==========================================
// PROJECT API FILE
// ==========================================
//
// Purpose:
// This file contains all communication between
// Project Management frontend and backend.
//
// React components will call these functions.
//
// Example:
//
// ProjectList.jsx
//        |
//        ↓
// projectApi.js
//        |
//        ↓
// Express API
//        |
//        ↓
// MongoDB
//
// ==========================================





// Import configured axios instance
//
// This already contains:
// - Backend URL
// - Common settings
//
// Location:
// src/api/axiosConfig.js

import API from "../../api/axiosConfig";









// ==========================================
// GET ALL PROJECTS
// ==========================================
//
// Purpose:
// Fetch all projects from database.
//
// Used in:
// ProjectList.jsx
//
// Backend Route:
//
// GET /api/projects
//
// Response example:
//
// [
//   {
//     projectName:"Building Construction",
//     clientName:"ABC Ltd",
//     status:"Running"
//   }
// ]
//
// ==========================================


export const getProjects = () => {


    return API.get("/projects");


};









// ==========================================
// GET SINGLE PROJECT BY ID
// ==========================================
//
// Purpose:
// Get one specific project.
//
// Used in:
// ProjectDetails.jsx
//
// Example:
//
// User clicks:
// Dhaka Building Project
//
// Frontend gets ID:
// 64abc123
//
// Request:
//
// GET /api/projects/64abc123
//
// Backend returns one project.
//
// ==========================================


export const getProjectById = (id) => {


    return API.get(`/projects/${id}`);


};









// ==========================================
// CREATE PROJECT
// ==========================================
//
// Purpose:
// Add a new project into database.
//
// Used in:
// ProjectForm.jsx
//
// When user clicks:
//
// Save Project
//
// Request:
//
// POST /api/projects
//
// Data sent:
//
// {
//   projectName,
//   clientName,
//   startDate,
//   deadline,
//   budget,
//   assignedEmployee,
//   status,
//   description
// }
//
// ==========================================


export const createProject = (data) => {


    return API.post("/projects", data);


};









// ==========================================
// UPDATE PROJECT
// ==========================================
//
// Purpose:
// Edit existing project information.
//
// Used in:
// ProjectForm.jsx
//
// When user clicks:
//
// Edit → Change data → Save
//
// Request:
//
// PUT /api/projects/:id
//
// Example:
//
// PUT /api/projects/64abc123
//
// Updated data:
//
// {
//    budget:6000000,
//    status:"Completed"
// }
//
// ==========================================


export const updateProject = (id, data) => {


    return API.put(`/projects/${id}`, data);


};









// ==========================================
// DELETE PROJECT
// ==========================================
//
// Purpose:
// Remove a project from database.
//
// Used in:
// ProjectList.jsx
//
// When user clicks:
//
// Delete button
//
// Request:
//
// DELETE /api/projects/:id
//
// Example:
//
// DELETE /api/projects/64abc123
//
// ==========================================


export const deleteProject = (id) => {
    return API.delete(`/projects/${id}`);
};

// Update Project Progress with Photo Proof (Logistics & Operations Officer ONLY)
export const updateProjectProgress = (id, data) => {
    return API.post(`/projects/${id}/progress`, data);
};

// Manager Review & Photo Verification (Approve / Reject)
export const reviewProgressUpdate = (id, updateId, data) => {
    return API.post(`/projects/${id}/progress/${updateId}/review`, data);
};

// Manager Approval for 100% Completed Project
export const approveProjectByManager = (id) => {
    return API.post(`/projects/${id}/approve-manager`);
};

// Finance Dues Clearance & Final Delivery Approval
export const approveProjectByFinance = (id) => {
    return API.post(`/projects/${id}/approve-finance`);
};