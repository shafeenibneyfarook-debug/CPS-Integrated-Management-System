import API from "../../api/axiosConfig";

export const getPurchaseOrders = (params = {}) => API.get("/purchase-orders", { params });
export const createPurchaseOrder = (data) => API.post("/purchase-orders", data);
export const updatePurchaseOrder = (id, data) => API.put(`/purchase-orders/${id}`, data);
export const changeApprovalStatus = (id, approvalStatus) => API.patch(`/purchase-orders/${id}/approval`, { approvalStatus });
export const supplierAcceptPO = (id, supplierAcceptanceStatus = "Accepted") => API.patch(`/purchase-orders/${id}/supplier-accept`, { supplierAcceptanceStatus });
export const updateReceiving = (id, items) => API.patch(`/purchase-orders/${id}/receiving`, { items });
export const deletePurchaseOrder = (id) => API.delete(`/purchase-orders/${id}`);
