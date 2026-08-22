import { useState } from "react";
import { createClient, updateClient } from "../clientApi";

const emptyForm = {
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    clientType: "Company",
    address: "",
    status: "Active"
};

const getErrorMessage = (error) => {
    const data = error.response?.data;
    return data?.errors?.join(". ") || data?.message || "Unable to save client.";
};

function ClientForm({ selectedClient, onSaved, onCancel }) {
    const [formData, setFormData] = useState(() => selectedClient ? {
        companyName: selectedClient.companyName || selectedClient.company || "",
        contactPerson: selectedClient.contactPerson || selectedClient.name || "",
        phone: selectedClient.phone || "",
        email: selectedClient.email || "",
        clientType: selectedClient.clientType || "Company",
        address: selectedClient.address || "",
        status: selectedClient.status || "Active"
    } : emptyForm);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const handleChange = ({ target: { name, value } }) => {
        setFormData((current) => ({ ...current, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");

        try {
            if (selectedClient) await updateClient(selectedClient._id, formData);
            else await createClient(formData);

            setFormData(emptyForm);
            await onSaved(selectedClient ? "Client updated successfully." : "Client added successfully.");
        } catch (requestError) {
            setError(getErrorMessage(requestError));
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="client-card client-form-card">
            <div className="client-card-heading">
                <div>
                    <p className="eyebrow">Client record</p>
                    <h2>{selectedClient ? "Edit client" : "Add a new client"}</h2>
                </div>
                {selectedClient && <button className="button ghost" type="button" onClick={onCancel}>Cancel</button>}
            </div>

            {error && <div className="client-alert error" role="alert">{error}</div>}

            <form className="client-form" onSubmit={handleSubmit}>
                <label>Company name<input name="companyName" value={formData.companyName} onChange={handleChange} required /></label>
                <label>Contact person<input name="contactPerson" value={formData.contactPerson} onChange={handleChange} required /></label>
                <label>Phone<input name="phone" type="tel" value={formData.phone} onChange={handleChange} required /></label>
                <label>Email<input name="email" type="email" value={formData.email} onChange={handleChange} required /></label>
                <label>Client type
                    <select name="clientType" value={formData.clientType} onChange={handleChange} required>
                        <option value="Company">Company</option>
                        <option value="Corporate">Corporate</option>
                        <option value="Individual">Individual</option>
                        <option value="Government">Government</option>
                    </select>
                </label>
                <label>Status
                    <select name="status" value={formData.status} onChange={handleChange} required>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </label>
                <label className="full-width">Address<textarea name="address" rows="3" value={formData.address} onChange={handleChange} required /></label>
                <div className="form-actions full-width">
                    <button className="button primary" type="submit" disabled={saving}>
                        {saving ? "Saving..." : selectedClient ? "Save changes" : "Add client"}
                    </button>
                </div>
            </form>
        </section>
    );
}

export default ClientForm;
