import { useState } from "react";
import { updateReceiving } from "../purchaseOrderApi";

export default function ReceivingForm({ order, onSaved, onCancel }) {
    const [items, setItems] = useState(() => order.items.map((item) => ({ _id: item._id, description: item.description, quantity: item.quantity, receivedQuantity: item.receivedQuantity })));
    const [saving, setSaving] = useState(false), [error, setError] = useState("");
    const submit = async (event) => {
        event.preventDefault(); setSaving(true); setError("");
        try { await updateReceiving(order._id, items.map(({ _id, receivedQuantity }) => ({ _id, receivedQuantity: Number(receivedQuantity) }))); await onSaved("Receiving quantities updated."); }
        catch (requestError) { setError(requestError.response?.data?.errors?.join(". ") || requestError.response?.data?.message || "Unable to update receiving."); }
        finally { setSaving(false); }
    };
    return <section className="po-card receiving-card"><div className="po-heading"><div><p className="po-eyebrow">Goods receipt</p><h2>Receive {order.purchaseOrderNumber}</h2></div><button className="po-button ghost" onClick={onCancel}>Cancel</button></div>
        {error && <div className="po-alert error">{error}</div>}<form onSubmit={submit}>{items.map((item, index) => <label className="receive-row" key={item._id}><span><strong>{item.description}</strong><small>Ordered: {item.quantity}</small></span><input aria-label={`Received quantity for ${item.description}`} type="number" min="0" max={item.quantity} step="0.01" value={item.receivedQuantity} onChange={(event) => setItems((old) => old.map((entry, i) => i === index ? { ...entry, receivedQuantity: event.target.value } : entry))} required /></label>)}<div className="po-actions"><button className="po-button primary" disabled={saving}>{saving ? "Saving..." : "Update receipt"}</button></div></form>
    </section>;
}
