import { useCallback, useEffect, useState } from "react";
import { deleteClient, getClients } from "../clientApi";
import ClientForm from "../components/ClientForm";
import { useAuth } from "../../auth/authStore";
import "../client.css";

const getErrorMessage = (error) => error.response?.data?.message || "Unable to load clients.";

function ClientList() {
    const { user } = useAuth();
    const canManage = user?.role === "admin"; // RESTRICTED STRICTLY TO ADMIN

    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [filters, setFilters] = useState({ search: "", status: "", clientType: "" });
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const loadClients = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await getClients(filters);
            setClients(response.data);
        } catch (requestError) {
            setError(getErrorMessage(requestError));
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const timer = setTimeout(loadClients, 300);
        return () => clearTimeout(timer);
    }, [loadClients]);

    const updateFilter = ({ target: { name, value } }) => {
        setFilters((current) => ({ ...current, [name]: value }));
    };

    const handleSaved = async (successMessage) => {
        setSelectedClient(null);
        setMessage(successMessage);
        await loadClients();
    };

    const handleDelete = async (client) => {
        if (!canManage) return;
        if (!window.confirm(`Delete ${client.companyName || client.company}? This cannot be undone.`)) return;
        setDeletingId(client._id);
        setError("");
        try {
            await deleteClient(client._id);
            if (selectedClient?._id === client._id) setSelectedClient(null);
            setMessage("Client deleted successfully.");
            await loadClients();
        } catch (requestError) {
            setError(getErrorMessage(requestError));
        } finally {
            setDeletingId("");
        }
    };

    return (
        <main className="client-page">
            <header className="client-page-header">
                <div>
                    <p className="eyebrow">CRM & Client Accounts</p>
                    <h1>Client Management Directory</h1>
                    <p>Maintain client contacts, types, addresses, and account status.</p>
                </div>
                <div className="client-total"><strong>{clients.length}</strong><span>clients shown</span></div>
            </header>

            {message && <div className="client-alert success" role="status">{message}<button onClick={() => setMessage("")} aria-label="Dismiss">×</button></div>}
            {error && <div className="client-alert error" role="alert">{error}</div>}

            {canManage && (
                <ClientForm key={selectedClient?._id || "new-client"} selectedClient={selectedClient} onSaved={handleSaved} onCancel={() => setSelectedClient(null)} />
            )}

            <section className="client-card">
                <div className="client-card-heading"><div><p className="eyebrow">Directory</p><h2>Client list</h2></div></div>
                <div className="client-filters">
                    <label className="search-field">Search<input name="search" placeholder="Company, contact, email or phone" value={filters.search} onChange={updateFilter} /></label>
                    <label>Status<select name="status" value={filters.status} onChange={updateFilter}><option value="">All statuses</option><option>Active</option><option>Inactive</option></select></label>
                    <label>Type<select name="clientType" value={filters.clientType} onChange={updateFilter}><option value="">All types</option><option>Company</option><option>Individual</option><option>Government</option></select></label>
                    <button className="button ghost" type="button" onClick={() => setFilters({ search: "", status: "", clientType: "" })}>Clear</button>
                </div>

                <div className="client-table-wrap">
                    <table className="client-table">
                        <thead>
                            <tr>
                                <th>Company</th>
                                <th>Contact</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Address</th>
                                {canManage && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && clients.map((client) => (
                                <tr key={client._id}>
                                    <td><strong>{client.companyName || client.company || "—"}</strong><span>{client.email}</span></td>
                                    <td>{client.contactPerson || client.name || "—"}<span>{client.phone || "—"}</span></td>
                                    <td>{client.clientType || "—"}</td>
                                    <td><span className={`status-badge ${(client.status || "Active").toLowerCase()}`}>{client.status || "Active"}</span></td>
                                    <td>{client.address || "—"}</td>
                                    {canManage && (
                                        <td>
                                            <div className="row-actions">
                                                <button className="button edit" onClick={() => { setSelectedClient(client); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>
                                                <button className="button danger" disabled={deletingId === client._id} onClick={() => handleDelete(client)}>{deletingId === client._id ? "Deleting..." : "Delete"}</button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {loading && <div className="table-state">Loading clients...</div>}
                    {!loading && clients.length === 0 && <div className="table-state">No clients match your search.</div>}
                </div>
            </section>
        </main>
    );
}

export default ClientList;
