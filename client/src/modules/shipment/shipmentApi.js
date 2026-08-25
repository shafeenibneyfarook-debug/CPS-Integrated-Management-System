import API from "../../api/axiosConfig";

// Get all shipments with optional filters
export const getShipments = (params = {}) => {
    return API.get("/shipments", { params });
};

// Get single shipment by ID
export const getShipmentById = (id) => {
    return API.get(`/shipments/${id}`);
};

// Create new shipment
export const createShipment = (shipmentData) => {
    return API.post("/shipments", shipmentData);
};

// Update shipment (PUT for full edit, PATCH for partial status updates)
export const updateShipment = (id, shipmentData) => {
    return API.put(`/shipments/${id}`, shipmentData);
};

export const patchShipment = (id, partialData) => {
    return API.patch(`/shipments/${id}`, partialData);
};

// Delete shipment
export const deleteShipment = (id) => {
    return API.delete(`/shipments/${id}`);
};