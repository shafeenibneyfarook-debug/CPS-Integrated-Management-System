import { useState } from "react";
import { createSupplier, updateSupplier } from "../supplierApi";

const blank = { supplierName: "", country: "", contactPerson: "", productCategory: "", phone: "", email: "", address: "", status: "Active" };
const errorText = (error) => error.response?.data?.errors?.join(". ") || error.response?.data?.message || "Unable to save supplier.";

function SupplierForm({ selectedSupplier, onSaved, onCancel }) {
    const [data, setData] = useState(() => selectedSupplier ? {
        supplierName: selectedSupplier.supplierName || selectedSupplier.company || selectedSupplier.name || "",
        country: selectedSupplier.country || "",
        contactPerson: selectedSupplier.contactPerson || selectedSupplier.name || "",
        productCategory: selectedSupplier.productCategory || "",
        phone: selectedSupplier.phone || "", email: selectedSupplier.email || "",
        address: selectedSupplier.address || "", status: selectedSupplier.status || "Active"
    } : blank);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const change = ({ target: { name, value } }) => setData((current) => ({ ...current, [name]: value }));
    const submit = async (event) => {
        event.preventDefault(); setSaving(true); setError("");
        try {
            if (selectedSupplier) await updateSupplier(selectedSupplier._id, data); else await createSupplier(data);
            await onSaved(selectedSupplier ? "Supplier updated successfully." : "Supplier added successfully.");
        } catch (requestError) { setError(errorText(requestError)); }
        finally { setSaving(false); }
    };
    return <section className="supplier-card">
        <div className="supplier-heading"><div><p className="supplier-eyebrow">Supplier record</p><h2>{selectedSupplier ? "Edit supplier" : "Add a new supplier"}</h2></div>{selectedSupplier && <button className="supplier-button ghost" onClick={onCancel}>Cancel</button>}</div>
        {error && <div className="supplier-alert error" role="alert">{error}</div>}
        <form className="supplier-form" onSubmit={submit}>
            <label>Supplier name<input name="supplierName" value={data.supplierName} onChange={change} required /></label>
            <label>Country<input name="country" value={data.country} onChange={change} required /></label>
            <label>Contact person<input name="contactPerson" value={data.contactPerson} onChange={change} required /></label>
            <label>Product category<input name="productCategory" value={data.productCategory} onChange={change} required /></label>
            <label>Phone<input type="tel" name="phone" value={data.phone} onChange={change} required /></label>
            <label>Email<input type="email" name="email" value={data.email} onChange={change} required /></label>
            <label>Status<select name="status" value={data.status} onChange={change}><option>Active</option><option>Inactive</option></select></label>
            <label className="supplier-wide">Address<textarea rows="3" name="address" value={data.address} onChange={change} required /></label>
            <div className="supplier-actions supplier-wide"><button className="supplier-button primary" disabled={saving}>{saving ? "Saving..." : selectedSupplier ? "Save changes" : "Add supplier"}</button></div>
        </form>
    </section>;
}
export default SupplierForm;
