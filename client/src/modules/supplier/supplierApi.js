import API from "../../api/axiosConfig";

export const getSuppliers = (params = {}) => {
    return API.get("/suppliers", { params });
};

export const createSupplier = (data) => {
    return API.post("/suppliers", data);
};

export const deleteSupplier = (id) => {
    return API.delete(`/suppliers/${id}`);
};

export const getSupplierById = (id) => API.get(`/suppliers/${id}`);

export const updateSupplier = (id, data) => API.put(`/suppliers/${id}`, data);
