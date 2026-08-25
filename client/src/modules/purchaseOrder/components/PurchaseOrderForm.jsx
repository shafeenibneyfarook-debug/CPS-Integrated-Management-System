import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSuppliers } from "../../supplier/supplierApi";
import { createPurchaseOrder, updatePurchaseOrder } from "../purchaseOrderApi";

const newItem = () => ({ description: "", quantity: 1, unitPrice: 0 });
const today = () => new Date().toISOString().slice(0, 10);
const empty = () => ({ title: "", supplier: "", orderDate: today(), expectedDelivery: "", currency: "BDT", taxRate: 0, notes: "", items: [newItem()] });
const errorText = (error) => error.response?.data?.errors?.join(". ") || error.response?.data?.message || "Unable to save purchase order.";

export default function PurchaseOrderForm({ selected, onSaved, onCancel }) {
    const [form, setForm] = useState(() => selected ? {
        title: selected.title, supplier: selected.supplier?._id || selected.supplier,
        orderDate: selected.orderDate.slice(0, 10), expectedDelivery: selected.expectedDelivery.slice(0, 10),
        currency: selected.currency, taxRate: selected.taxRate, notes: selected.notes || "",
        items: selected.items.map(({ description, quantity, unitPrice }) => ({ description, quantity, unitPrice }))
    } : empty());
    const [suppliers, setSuppliers] = useState([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        setLoadingSuppliers(true);
        getSuppliers()
            .then((res) => {
                if (!active) return;
                const list = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
                setSuppliers(list);
            })
            .catch(() => {
                if (active) setError("Unable to load suppliers directory.");
            })
            .finally(() => {
                if (active) setLoadingSuppliers(false);
            });

        return () => { active = false; };
    }, []);

    const change = ({ target: { name, value } }) => setForm((old) => ({ ...old, [name]: value }));
    const itemChange = (index, field, value) => setForm((old) => ({ ...old, items: old.items.map((item, i) => i === index ? { ...item, [field]: value } : item) }));
    const subtotal = form.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
    const total = subtotal * (1 + (Number(form.taxRate) || 0) / 100);

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        try {
            const payload = { ...form, taxRate: Number(form.taxRate), items: form.items.map((item) => ({ ...item, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice) })) };
            if (selected) await updatePurchaseOrder(selected._id, payload);
            else await createPurchaseOrder(payload);
            await onSaved(selected ? "Purchase order updated." : "Purchase order created as draft.");
        } catch (requestError) {
            setError(errorText(requestError));
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="po-card">
            <div className="po-heading">
                <div>
                    <p className="po-eyebrow">Procurement record</p>
                    <h2>{selected ? `Edit ${selected.purchaseOrderNumber}` : "Create purchase order"}</h2>
                </div>
                {selected && <button type="button" className="po-button ghost" onClick={onCancel}>Cancel</button>}
            </div>

            {error && <div className="po-alert error">{error}</div>}

            <form className="po-form" onSubmit={submit}>
                <label>
                    Title *
                    <input name="title" placeholder="e.g. Steel & Structural Beams Order" value={form.title} onChange={change} required />
                </label>

                <label>
                    Supplier *
                    <select name="supplier" value={form.supplier} onChange={change} required>
                        <option value="">
                            {loadingSuppliers ? "Loading suppliers..." : suppliers.length === 0 ? "No suppliers found — Add a supplier first" : "Select Supplier"}
                        </option>
                        {suppliers.map((supplier) => {
                            const name = supplier.supplierName || supplier.company || supplier.name;
                            return (
                                <option value={supplier._id} key={supplier._id}>
                                    {name} ({supplier.country || "Supplier"})
                                </option>
                            );
                        })}
                    </select>
                    {suppliers.length === 0 && !loadingSuppliers && (
                        <small style={{ color: "#d97706", display: "block", marginTop: "4px" }}>
                            No suppliers in database. <Link to="/suppliers" style={{ color: "#2563eb", fontWeight: "700" }}>+ Add Supplier to Directory</Link>
                        </small>
                    )}
                </label>

                <label>
                    Order date *
                    <input type="date" name="orderDate" value={form.orderDate} onChange={change} required />
                </label>

                <label>
                    Expected delivery *
                    <input type="date" name="expectedDelivery" min={form.orderDate} value={form.expectedDelivery} onChange={change} required />
                </label>

                <label>
                    Currency
                    <select name="currency" value={form.currency} onChange={change}>
                        <option value="BDT">BDT (৳)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                    </select>
                </label>

                <label>
                    Tax rate (%)
                    <input type="number" name="taxRate" min="0" max="100" step="0.01" value={form.taxRate} onChange={change} />
                </label>

                <div className="po-items full">
                    <div className="po-heading">
                        <h3>Ordered items</h3>
                        <button type="button" className="po-button ghost" onClick={() => setForm((old) => ({ ...old, items: [...old.items, newItem()] }))}>
                            + Add item
                        </button>
                    </div>

                    {form.items.map((item, index) => (
                        <div className="po-item" key={index}>
                            <input aria-label="Description" placeholder="Item description" value={item.description} onChange={(event) => itemChange(index, "description", event.target.value)} required />
                            <input aria-label="Quantity" type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => itemChange(index, "quantity", event.target.value)} required />
                            <input aria-label="Unit price" type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => itemChange(index, "unitPrice", event.target.value)} required />
                            <strong>{((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toFixed(2)}</strong>
                            <button type="button" className="po-button danger" disabled={form.items.length === 1} onClick={() => setForm((old) => ({ ...old, items: old.items.filter((_, i) => i !== index) }))}>
                                Remove
                            </button>
                        </div>
                    ))}
                </div>

                <label className="full">
                    Notes
                    <textarea name="notes" rows="3" value={form.notes} onChange={change} />
                </label>

                <div className="po-summary full">
                    <span>Subtotal: {subtotal.toFixed(2)} {form.currency}</span>
                    <strong>Total: {total.toFixed(2)} {form.currency}</strong>
                </div>

                <div className="po-actions full">
                    <button className="po-button primary" disabled={saving || suppliers.length === 0}>
                        {saving ? "Saving..." : "Save draft"}
                    </button>
                </div>
            </form>
        </section>
    );
}
