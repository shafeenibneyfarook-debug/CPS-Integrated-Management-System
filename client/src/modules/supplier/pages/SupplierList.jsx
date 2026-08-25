import { useCallback, useEffect, useState } from "react";
import { deleteSupplier, getSuppliers } from "../supplierApi";
import SupplierForm from "../components/SupplierForm";
import { useAuth } from "../../auth/authStore";
import "../supplier.css";

const errorText = (error) => error.response?.data?.message || "Unable to load suppliers.";

function SupplierList() {
    const { user } = useAuth();
    const canManage = user?.role === "admin"; // RESTRICTED STRICTLY TO ADMIN

    const [suppliers, setSuppliers] = useState([]);
    const [selected, setSelected] = useState(null);
    const [filters, setFilters] = useState({ search: "", status: "", country: "", productCategory: "" });
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setSuppliers((await getSuppliers(filters)).data);
        } catch (e) {
            setError(errorText(e));
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const timer = setTimeout(load, 300);
        return () => clearTimeout(timer);
    }, [load]);

    const filter = ({ target: { name, value } }) => setFilters((current) => ({ ...current, [name]: value }));

    const saved = async (text) => {
        setSelected(null);
        setMessage(text);
        await load();
    };

    const remove = async (supplier) => {
        if (!canManage) return;
        const title = supplier.supplierName || supplier.company || supplier.name;
        if (!window.confirm(`Delete ${title}? This cannot be undone.`)) return;
        setDeleting(supplier._id);
        setError("");
        try {
            await deleteSupplier(supplier._id);
            if (selected?._id === supplier._id) setSelected(null);
            setMessage("Supplier deleted successfully.");
            await load();
        } catch (e) {
            setError(errorText(e));
        } finally {
            setDeleting("");
        }
    };

    return (
        <main className="supplier-page">
            <header className="supplier-page-header">
                <div>
                    <p className="supplier-eyebrow">Vendor Directory & Sourcing</p>
                    <h1>Supplier Management Directory</h1>
                    <p>Maintain supplier contacts, sourcing categories, locations, and status.</p>
                </div>
                <div className="supplier-total"><strong>{suppliers.length}</strong><span>suppliers shown</span></div>
            </header>

            {message && <div className="supplier-alert success">{message}<button onClick={() => setMessage("")}>×</button></div>}
            {error && <div className="supplier-alert error">{error}</div>}

            {canManage && (
                <SupplierForm key={selected?._id || "new-supplier"} selectedSupplier={selected} onSaved={saved} onCancel={() => setSelected(null)} />
            )}

            <section className="supplier-card">
                <div className="supplier-heading"><div><p className="supplier-eyebrow">Directory</p><h2>Supplier list</h2></div></div>
                <div className="supplier-filters">
                    <label className="supplier-search">Search<input name="search" placeholder="Name, contact, product, email or phone" value={filters.search} onChange={filter} /></label>
                    <label>Status<select name="status" value={filters.status} onChange={filter}><option value="">All statuses</option><option>Active</option><option>Inactive</option></select></label>
                    <label>Country<input name="country" value={filters.country} onChange={filter} placeholder="All countries" /></label>
                    <label>Category<input name="productCategory" value={filters.productCategory} onChange={filter} placeholder="All categories" /></label>
                    <button className="supplier-button ghost" onClick={() => setFilters({ search: "", status: "", country: "", productCategory: "" })}>Clear</button>
                </div>

                <div className="supplier-table-wrap">
                    <table className="supplier-table">
                        <thead>
                            <tr>
                                <th>Supplier</th>
                                <th>Contact</th>
                                <th>Country</th>
                                <th>Category</th>
                                <th>Status</th>
                                <th>Address</th>
                                {canManage && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && suppliers.map((item) => (
                                <tr key={item._id}>
                                    <td><strong>{item.supplierName || item.company || item.name || "—"}</strong><span>{item.email}</span></td>
                                    <td>{item.contactPerson || item.name || "—"}<span>{item.phone}</span></td>
                                    <td>{item.country || "—"}</td>
                                    <td>{item.productCategory || "—"}</td>
                                    <td><span className={`supplier-status ${(item.status || "Active").toLowerCase()}`}>{item.status || "Active"}</span></td>
                                    <td>{item.address || "—"}</td>
                                    {canManage && (
                                        <td>
                                            <div className="supplier-row-actions">
                                                <button className="supplier-button edit" onClick={() => { setSelected(item); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>
                                                <button className="supplier-button danger" disabled={deleting === item._id} onClick={() => remove(item)}>{deleting === item._id ? "Deleting..." : "Delete"}</button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {loading && <div className="supplier-state">Loading suppliers...</div>}
                    {!loading && !suppliers.length && <div className="supplier-state">No suppliers match your search.</div>}
                </div>
            </section>
        </main>
    );
}

export default SupplierList;
