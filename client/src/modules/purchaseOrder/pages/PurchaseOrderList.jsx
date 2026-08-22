import { useCallback, useEffect, useState } from "react";
import PurchaseOrderForm from "../components/PurchaseOrderForm";
import ReceivingForm from "../components/ReceivingForm";
import { changeApprovalStatus, deletePurchaseOrder, getPurchaseOrders, supplierAcceptPO } from "../purchaseOrderApi";
import { useAuth } from "../../auth/authStore";
import "../purchaseOrder.css";

const errorText = (error) => error.response?.data?.message || "Unable to complete the request.";

export default function PurchaseOrderList() {
    const { user } = useAuth();
    const isLogistics = user?.role === "operations_officer" || user?.role === "admin";
    const isManager = user?.role === "manager" || user?.role === "admin";
    const isAccountsOfficer = user?.role === "accounts_officer" || user?.role === "admin";
    const isSupplier = user?.role === "supplier";

    const [orders, setOrders] = useState([]);
    const [selected, setSelected] = useState(null);
    const [receiving, setReceiving] = useState(null);
    const [filters, setFilters] = useState({ search: "", approvalStatus: "", receivingStatus: "" });
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setOrders((await getPurchaseOrders(filters)).data);
            setError("");
        } catch (requestError) {
            setError(errorText(requestError));
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const timer = setTimeout(load, 250);
        return () => clearTimeout(timer);
    }, [load]);

    const saved = async (text) => {
        setSelected(null);
        setReceiving(null);
        setMessage(text);
        await load();
    };

    const run = async (id, action, text) => {
        setBusy(id);
        setError("");
        try {
            await action();
            await saved(text);
        } catch (requestError) {
            setError(errorText(requestError));
        } finally {
            setBusy("");
        }
    };

    const actions = (order) => {
        if (order.approvalStatus === "Draft") {
            return isLogistics ? ["Pending Manager Approval"] : [];
        }
        if (order.approvalStatus === "Pending Manager Approval") {
            return isManager ? ["Manager Approved", "Rejected"] : [];
        }
        if (order.approvalStatus === "Manager Approved") {
            return (isAccountsOfficer || isManager) ? ["Approved", "Rejected"] : [];
        }
        if (order.approvalStatus === "Rejected") {
            return isLogistics ? ["Draft", "Pending Manager Approval"] : [];
        }
        return [];
    };

    const changeFilter = ({ target: { name, value } }) => setFilters((old) => ({ ...old, [name]: value }));

    return (
        <main className="po-page">
            <header className="po-page-header">
                <div>
                    <p className="po-eyebrow">Procurement & Supply Chain</p>
                    <h1>Purchase Order Management</h1>
                    <p>Manage procurement orders, approvals, and stock deliveries.</p>
                </div>
                <div className="po-total">
                    <strong>{orders.length}</strong>
                    <span>orders shown</span>
                </div>
            </header>

            {message && (
                <div className="po-alert success">
                    {message}
                    <button onClick={() => setMessage("")}>×</button>
                </div>
            )}
            {error && <div className="po-alert error">{error}</div>}

            {receiving ? (
                <ReceivingForm order={receiving} onSaved={saved} onCancel={() => setReceiving(null)} />
            ) : isLogistics ? (
                <PurchaseOrderForm key={selected?._id || "new"} selected={selected} onSaved={saved} onCancel={() => setSelected(null)} />
            ) : null}

            <section className="po-card">
                <div className="po-heading">
                    <div>
                        <p className="po-eyebrow">Procurement register</p>
                        <h2>Purchase orders</h2>
                    </div>
                </div>

                <div className="po-filters">
                    <label>
                        Search
                        <input name="search" placeholder="PO number or title" value={filters.search} onChange={changeFilter} />
                    </label>
                    <label>
                        Approval
                        <select name="approvalStatus" value={filters.approvalStatus} onChange={changeFilter}>
                            <option value="">All</option>
                            {["Draft", "Pending Manager Approval", "Manager Approved", "Approved", "Rejected"].map((value) => (
                                <option key={value}>{value}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Receiving
                        <select name="receivingStatus" value={filters.receivingStatus} onChange={changeFilter}>
                            <option value="">All</option>
                            {["Not Received", "Partially Received", "Received"].map((value) => (
                                <option key={value}>{value}</option>
                            ))}
                        </select>
                    </label>
                    <button className="po-button ghost" onClick={() => setFilters({ search: "", approvalStatus: "", receivingStatus: "" })}>
                        Clear
                    </button>
                </div>

                <div className="po-table-wrap">
                    <table className="po-table">
                        <thead>
                            <tr>
                                <th>Purchase order</th>
                                <th>Supplier</th>
                                <th>Accepted Supplier</th>
                                <th>Delivery</th>
                                <th>Total</th>
                                <th>Approval</th>
                                <th>Receiving</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order._id}>
                                    <td>
                                        <strong>{order.purchaseOrderNumber}</strong>
                                        <span>{order.title}</span>
                                    </td>
                                    <td>{order.supplier?.supplierName || "—"}</td>
                                    <td>
                                        {order.supplierAcceptanceStatus === "Accepted" ? (
                                            <span style={{ padding: "4px 8px", borderRadius: "6px", background: "#dcfce7", color: "#15803d", fontWeight: "700", fontSize: "12px", display: "inline-block" }}>
                                                ✅ {order.acceptedSupplier?.supplierName || "Accepted Supplier"}
                                            </span>
                                        ) : order.approvalStatus === "Approved" ? (
                                            <span style={{ padding: "4px 8px", borderRadius: "6px", background: "#fef3c7", color: "#b45309", fontWeight: "700", fontSize: "12px", display: "inline-block" }}>
                                                ⏳ Pending Supplier
                                            </span>
                                        ) : (
                                            <span style={{ color: "#94a3b8", fontSize: "12px" }}>Awaiting Approval</span>
                                        )}
                                    </td>
                                    <td>{new Date(order.expectedDelivery).toLocaleDateString()}</td>
                                    <td>{order.total.toFixed(2)} {order.currency}</td>
                                    <td>
                                        <span className={`po-status ${order.approvalStatus.toLowerCase().replaceAll(" ", "-")}`}>
                                            {order.approvalStatus}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`po-status ${order.receivingStatus.toLowerCase().replaceAll(" ", "-")}`}>
                                            {order.receivingStatus}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="po-row-actions">
                                            {/* Supplier Acceptance Action */}
                                            {isSupplier && order.approvalStatus === "Approved" && order.supplierAcceptanceStatus !== "Accepted" && (
                                                <button
                                                    className="po-button"
                                                    style={{ background: "#059669", color: "#fff", fontWeight: "700" }}
                                                    disabled={busy === order._id}
                                                    onClick={() => run(order._id, () => supplierAcceptPO(order._id), "Purchase order accepted by your firm!")}
                                                >
                                                    ✓ Accept Request
                                                </button>
                                            )}

                                            {/* Supplier Stock Delivery / Receiving Action */}
                                            {isSupplier && order.approvalStatus === "Approved" && (
                                                <button
                                                    className="po-button receive"
                                                    style={{ background: "#2563eb", color: "#fff", fontWeight: "700" }}
                                                    onClick={() => {
                                                        setSelected(null);
                                                        setReceiving(order);
                                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                                    }}
                                                >
                                                    🚚 Deliver Stock
                                                </button>
                                            )}

                                            {/* Logistics Edit Action */}
                                            {isLogistics && ["Draft", "Rejected"].includes(order.approvalStatus) && (
                                                <button
                                                    className="po-button edit"
                                                    onClick={() => {
                                                        setReceiving(null);
                                                        setSelected(order);
                                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                            )}

                                            {/* Manager / Finance Approval Transition Actions */}
                                            {actions(order).map((status) => (
                                                <button
                                                    className="po-button ghost"
                                                    key={status}
                                                    disabled={busy === order._id}
                                                    onClick={() => run(order._id, () => changeApprovalStatus(order._id, status), `Purchase order marked ${status}.`)}
                                                >
                                                    {status}
                                                </button>
                                            ))}

                                            {/* Logistics Receive Action */}
                                            {isLogistics && order.approvalStatus === "Approved" && (
                                                <button
                                                    className="po-button receive"
                                                    onClick={() => {
                                                        setSelected(null);
                                                        setReceiving(order);
                                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                                    }}
                                                >
                                                    Receive
                                                </button>
                                            )}

                                            {/* Logistics Delete Action */}
                                            {isLogistics && order.approvalStatus === "Draft" && (
                                                <button
                                                    className="po-button danger"
                                                    disabled={busy === order._id}
                                                    onClick={() => window.confirm("Delete this draft purchase order?") && run(order._id, () => deletePurchaseOrder(order._id), "Purchase order deleted.")}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {loading && <div className="po-state">Loading purchase orders...</div>}
                    {!loading && !orders.length && <div className="po-state">No purchase orders found.</div>}
                </div>
            </section>
        </main>
    );
}

