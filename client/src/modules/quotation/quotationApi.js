import API from "../../api/axiosConfig";

export const getQuotations = (params = {}) => API.get("/quotations", { params });
export const createQuotation = (data) => API.post("/quotations", data);
export const updateQuotation = (id, data) => API.put(`/quotations/${id}`, data);
export const changeQuotationStatus = (id, status, rejectionReason = "") => API.patch(`/quotations/${id}/status`, { status, rejectionReason });
export const adminVerifyProposal = (id, adminVerificationStatus = "Admin Verified") => API.put(`/quotations/${id}/admin-verify`, { adminVerificationStatus });
export const clientDecideProposal = (id, decision, notes = "", selectedTier = null) => API.put(`/quotations/${id}/client-decision`, { decision, notes, selectedTier });
export const reviseQuotation = (id) => API.post(`/quotations/${id}/revisions`);
export const deleteQuotation = (id) => API.delete(`/quotations/${id}`);
