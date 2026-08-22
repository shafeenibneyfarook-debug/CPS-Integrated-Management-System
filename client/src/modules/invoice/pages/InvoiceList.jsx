import React, { useState, useEffect } from "react";
import API from "../../../api/axiosConfig";
import { useAuth } from "../../auth/authStore";

export default function InvoiceList() {
    const { user } = useAuth();
    const isAccountsOfficer = user?.role === "accounts_officer" || user?.role === "admin";
    const isClient = user?.role === "client";

    const [invoices, setInvoices] = useState([]);
    const [summary, setSummary] = useState(null);
    const [emailLogs, setEmailLogs] = useState([]);
    const [approvedQuotations, setApprovedQuotations] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("invoices"); // "invoices" | "emailLogs"

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // Form states
    const [createForm, setCreateForm] = useState({
        quotationId: "",
        clientId: "",
        items: [{ description: "Construction Works", quantity: 1, unitPrice: 10000 }],
        taxRate: 5,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        notes: ""
    });

    const [paymentForm, setPaymentForm] = useState({
        amount: "",
        paymentMethod: "Bank Transfer",
        paymentDate: new Date().toISOString().slice(0, 10),
        referenceNotes: ""
    });

    const [statusFilter, setStatusFilter] = useState("");
    const [verificationFilter, setVerificationFilter] = useState(user?.role === "accounts_officer" ? "Pending Finance Verification" : "");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchData();
    }, [statusFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [invRes, sumRes, logsRes, quotesRes, clientsRes] = await Promise.all([
                API.get(`/invoices?status=${statusFilter}`),
                API.get("/invoices/summary"),
                API.get("/invoices/email-logs"),
                API.get("/quotations"),
                API.get("/clients")
            ]);
            setInvoices(invRes.data.invoices || []);
            setSummary(sumRes.data.summary || null);
            setEmailLogs(logsRes.data.logs || []);

            const quotesList = quotesRes.data.quotations || quotesRes.data || [];
            setApprovedQuotations(quotesList.filter(q => q.status === "Approved"));
            setClients(clientsRes.data.clients || clientsRes.data || []);
        } catch (err) {
            console.error("Error fetching invoice data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInvoice = async (e) => {
        e.preventDefault();
        try {
            await API.post("/invoices", createForm);
            setShowCreateModal(false);
            fetchData();
            alert("Invoice created and submitted for Accounts/Finance verification!");
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create invoice");
        }
    };

    const handleVerifyFinance = async (invoiceId, status = "Finance Verified") => {
        try {
            const res = await API.put(`/invoices/${invoiceId}/verify-finance`, { status });
            alert(res.data.message);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to verify invoice");
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        if (!selectedInvoice) return;
        const parsedAmount = Number(paymentForm.amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            alert("Please enter a valid payment amount greater than 0.");
            return;
        }
        try {
            await API.post(`/invoices/${selectedInvoice._id}/payments`, {
                ...paymentForm,
                amount: parsedAmount
            });
            setShowPaymentModal(false);
            fetchData();
            alert("Payment recorded successfully!");
        } catch (err) {
            alert(err.response?.data?.message || "Failed to record payment");
        }
    };

    const handleSendReminder = async (invoiceId) => {
        try {
            const res = await API.post(`/invoices/${invoiceId}/reminder`, {});
            alert(res.data.message || "Payment reminder sent!");
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to send reminder");
        }
    };

    const handleRetryEmail = async (logId) => {
        try {
            await API.post(`/invoices/email-logs/${logId}/retry`, {});
            fetchData();
            alert("Email retry executed successfully!");
        } catch (err) {
            alert(err.response?.data?.message || "Email retry failed");
        }
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.client?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.client?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesVerification = !verificationFilter || inv.financeVerificationStatus === verificationFilter;
        return matchesSearch && matchesVerification;
    });

    const pendingVerificationCount = invoices.filter(i => i.financeVerificationStatus === "Pending Finance Verification").length;

    return (
        <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
            {/* Header & Title */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                        {isClient
                            ? "My Invoices & Online Payments"
                            : user?.role === "accounts_officer"
                            ? "Finance Department — Invoice Verification & Revenue Collection"
                            : user?.role === "supplier"
                            ? "Supplier Material Invoices & Billing Register"
                            : user?.role === "operations_officer"
                            ? "Operations & Field Site Logistics Invoices"
                            : user?.role === "manager"
                            ? "Project Invoicing & Billing Control"
                            : "Invoicing & Financial Verification Engine"}
                    </h1>
                    <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>
                        {isClient
                            ? "Review official invoices verified by Accounts/Finance and complete online payments securely."
                            : user?.role === "accounts_officer"
                            ? "Review and approve Manager-generated invoices, verify incoming client payments, and track collected revenue."
                            : user?.role === "supplier"
                            ? "Monitor material delivery invoices, track payment receipts from Finance, and review billing verifications."
                            : user?.role === "operations_officer"
                            ? "Inspect field site material invoices, verify logistics delivery documentation, and track payment status."
                            : "Generate project billing invoices, submit for Finance verification, and track client payments."}
                    </p>
                </div>

                {!isClient && user?.role !== "supplier" && user?.role !== "accounts_officer" && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            padding: "10px 18px",
                            backgroundColor: "#2563eb",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "800",
                            fontSize: "14px",
                            cursor: "pointer"
                        }}
                    >
                        + Generate New Invoice
                    </button>
                )}
            </div>

            {/* FINANCE OFFICER SPECIAL PENDING ALERT BANNER */}
            {isAccountsOfficer && pendingVerificationCount > 0 && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "16px 20px", borderRadius: "12px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "22px" }}>💳</span>
                        <div>
                            <strong style={{ color: "#b45309", fontSize: "15px" }}>
                                {pendingVerificationCount} Manager Invoice(s) Awaiting Finance Verification & Approval
                            </strong>
                            <div style={{ fontSize: "12px", color: "#92400e" }}>
                                Check financial figures and click "Verify & Approve" to publish invoices to Client Dashboards for online payment.
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setVerificationFilter("Pending Finance Verification")}
                        style={{ padding: "8px 14px", background: "#b45309", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer", fontSize: "13px" }}
                    >
                        Filter Pending ({pendingVerificationCount})
                    </button>
                </div>
            )}

            {/* KPI Summary Row */}
            {summary && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                    <div style={{ background: "#fff", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>
                            {isClient ? "TOTAL INVOICED TO ME" : user?.role === "supplier" ? "TOTAL MATERIAL INVOICES" : "TOTAL INVOICED REVENUE"}
                        </span>
                        <h2 style={{ margin: "6px 0 0 0", color: "#1e293b", fontSize: "22px" }}>BDT {summary.totalInvoiced.toLocaleString()}</h2>
                    </div>
                    <div style={{ background: "#fff", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "12px", color: "#059669", fontWeight: "700" }}>
                            {isClient ? "TOTAL PAID BY ME" : user?.role === "supplier" ? "PAYMENTS RECEIVED" : "TOTAL REVENUE COLLECTED"}
                        </span>
                        <h2 style={{ margin: "6px 0 0 0", color: "#059669", fontSize: "22px" }}>BDT {summary.totalCollected.toLocaleString()}</h2>
                    </div>
                    <div style={{ background: "#fff", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "12px", color: "#d97706", fontWeight: "700" }}>
                            {isClient ? "MY PAYABLE BALANCE" : user?.role === "supplier" ? "PENDING RECEIVABLES" : "OUTSTANDING RECEIVABLES"}
                        </span>
                        <h2 style={{ margin: "6px 0 0 0", color: "#d97706", fontSize: "22px" }}>BDT {summary.totalDue.toLocaleString()}</h2>
                    </div>
                    <div style={{ background: "#fff", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "12px", color: "#dc2626", fontWeight: "700" }}>
                            {isClient ? "MY OVERDUE INVOICES" : "OVERDUE INVOICES"}
                        </span>
                        <h2 style={{ margin: "6px 0 0 0", color: "#dc2626", fontSize: "22px" }}>{summary.overdueCount}</h2>
                    </div>
                </div>
            )}

            {/* TAB Navigation */}
            <div style={{ display: "flex", borderBottom: "2px solid #e2e8f0", marginBottom: "20px" }}>
                <button
                    onClick={() => setActiveTab("invoices")}
                    style={{
                        padding: "10px 20px",
                        background: "none",
                        border: "none",
                        fontWeight: "800",
                        fontSize: "14px",
                        color: activeTab === "invoices" ? "#2563eb" : "#64748b",
                        borderBottom: activeTab === "invoices" ? "3px solid #2563eb" : "none",
                        cursor: "pointer"
                    }}
                >
                    Invoices ({filteredInvoices.length})
                </button>

                {!isClient && (
                    <button
                        onClick={() => setActiveTab("emailLogs")}
                        style={{
                            padding: "10px 20px",
                            background: "none",
                            border: "none",
                            fontWeight: "800",
                            fontSize: "14px",
                            color: activeTab === "emailLogs" ? "#2563eb" : "#64748b",
                            borderBottom: activeTab === "emailLogs" ? "3px solid #2563eb" : "none",
                            cursor: "pointer"
                        }}
                    >
                        Email Logs & Dispatches ({emailLogs.filter(l => l.status === "Failed").length} Failed)
                    </button>
                )}
            </div>

            {/* TAB 1: Invoices */}
            {activeTab === "invoices" && (
                <div>
                    {/* Filters & Search */}
                    <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
                        <input
                            type="text"
                            placeholder="Search by invoice # or client..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", width: "280px" }}
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        >
                            <option value="">All Payment Statuses</option>
                            <option value="Paid">Paid</option>
                            <option value="Partially Paid">Partially Paid</option>
                            <option value="Unpaid">Unpaid</option>
                        </select>

                        {isAccountsOfficer && (
                            <select
                                value={verificationFilter}
                                onChange={(e) => setVerificationFilter(e.target.value)}
                                style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #059669", fontWeight: "700", color: "#047857" }}
                            >
                                <option value="">All Finance Verification Statuses</option>
                                <option value="Pending Finance Verification">⚡ Pending Finance Verification</option>
                                <option value="Finance Verified">✓ Finance Verified</option>
                                <option value="Finance Rejected">✕ Finance Rejected</option>
                            </select>
                        )}
                    </div>

                    {/* Table */}
                    <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                            <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                                <tr>
                                    <th style={{ padding: "14px 16px" }}>Invoice #</th>
                                    <th style={{ padding: "14px 16px" }}>Project & Site Location</th>
                                    <th style={{ padding: "14px 16px" }}>{isClient ? "Client Account" : "Client"}</th>
                                    <th style={{ padding: "14px 16px" }}>Total Amount</th>
                                    <th style={{ padding: "14px 16px" }}>{isClient ? "Payable Balance" : "Due Amount"}</th>
                                    <th style={{ padding: "14px 16px" }}>Finance Status</th>
                                    <th style={{ padding: "14px 16px" }}>Payment Status</th>
                                    <th style={{ padding: "14px 16px", textAlign: "center" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.map((inv) => {
                                    const isFinanceVerified = inv.financeVerificationStatus === "Finance Verified";
                                    const projTitle = inv.quotation?.title || inv.project?.projectName || "Building Project";
                                    const projSite = inv.quotation?.constructionSiteLocation || inv.project?.siteAddress || "Site Location";

                                    return (
                                        <tr key={inv._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "14px 16px", fontWeight: "700", color: "#1e293b" }}>{inv.invoiceNumber}</td>
                                            <td style={{ padding: "14px 16px" }}>
                                                <strong style={{ color: "#2563eb" }}>{projTitle}</strong>
                                                <div style={{ fontSize: "12px", color: "#475569" }}>📍 {projSite}</div>
                                            </td>
                                            <td style={{ padding: "14px 16px" }}>
                                                <strong>{inv.client?.companyName || inv.client?.name || "Client Account"}</strong>
                                                <div style={{ fontSize: "12px", color: "#64748b" }}>{inv.client?.email}</div>
                                            </td>
                                            <td style={{ padding: "14px 16px", fontWeight: "700" }}>BDT {inv.totalAmount.toLocaleString()}</td>
                                            <td style={{ padding: "14px 16px", color: "#d97706", fontWeight: "700" }}>BDT {inv.dueAmount.toLocaleString()}</td>

                                            {/* Finance Verification Column */}
                                            <td style={{ padding: "14px 16px" }}>
                                                <span style={{
                                                    padding: "4px 10px",
                                                    borderRadius: "999px",
                                                    fontSize: "12px",
                                                    fontWeight: "800",
                                                    background: isFinanceVerified ? "#dcfce7" : inv.financeVerificationStatus === "Finance Rejected" ? "#fef2f2" : "#fffbeb",
                                                    color: isFinanceVerified ? "#15803d" : inv.financeVerificationStatus === "Finance Rejected" ? "#991b1b" : "#b45309"
                                                }}>
                                                    {inv.financeVerificationStatus || "Pending Finance Verification"}
                                                </span>
                                            </td>

                                            <td style={{ padding: "14px 16px" }}>
                                                <span style={{
                                                    padding: "4px 10px",
                                                    borderRadius: "999px",
                                                    fontSize: "12px",
                                                    fontWeight: "700",
                                                    background: inv.paymentStatus === "Paid" ? "#dcfce7" : inv.paymentStatus === "Partially Paid" ? "#fef3c7" : "#ffe4e6",
                                                    color: inv.paymentStatus === "Paid" ? "#15803d" : inv.paymentStatus === "Partially Paid" ? "#b45309" : "#be123c"
                                                }}>
                                                    {inv.paymentStatus}
                                                </span>
                                            </td>

                                            <td style={{ padding: "14px 16px", textAlign: "center" }}>
                                                <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                                                    {/* Accounts Officer Verification Actions */}
                                                    {isAccountsOfficer && !isFinanceVerified && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleVerifyFinance(inv._id, "Finance Verified")}
                                                                style={{ padding: "6px 12px", background: "#059669", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}
                                                            >
                                                                ✓ Verify & Approve
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleVerifyFinance(inv._id, "Finance Rejected")}
                                                                style={{ padding: "6px 12px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}
                                                            >
                                                                ✕ Reject
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Record Payment / Online Payment */}
                                                    {inv.paymentStatus !== "Paid" && user?.role !== "supplier" && (
                                                        <button
                                                            onClick={() => { setSelectedInvoice(inv); setPaymentForm(p => ({ ...p, amount: inv.dueAmount })); setShowPaymentModal(true); }}
                                                            style={{ padding: "6px 12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}
                                                        >
                                                            {isClient ? "💳 Pay Invoice Now" : user?.role === "accounts_officer" ? "📥 Record Payment Collected" : "📥 Log Payment Received"}
                                                        </button>
                                                    )}

                                                    {!isClient && user?.role !== "supplier" && (
                                                        <button
                                                            onClick={() => handleSendReminder(inv._id)}
                                                            style={{ padding: "6px 12px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                                                        >
                                                            ✉ Remind
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filteredInvoices.length === 0 && (
                                    <tr>
                                        <td colSpan="7" style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                                            No invoices found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: Email Logs */}
            {activeTab === "emailLogs" && !isClient && (
                <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                        <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                            <tr>
                                <th style={{ padding: "14px 16px" }}>Recipient Email</th>
                                <th style={{ padding: "14px 16px" }}>Subject</th>
                                <th style={{ padding: "14px 16px" }}>Status</th>
                                <th style={{ padding: "14px 16px" }}>Dispatched At</th>
                                <th style={{ padding: "14px 16px", textAlign: "center" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {emailLogs.map((log) => (
                                <tr key={log._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                    <td style={{ padding: "14px 16px", fontWeight: "700" }}>{log.recipientEmail}</td>
                                    <td style={{ padding: "14px 16px" }}>{log.subject}</td>
                                    <td style={{ padding: "14px 16px" }}>
                                        <span style={{
                                            padding: "4px 10px",
                                            borderRadius: "999px",
                                            fontSize: "12px",
                                            fontWeight: "700",
                                            background: log.status === "Sent" ? "#dcfce7" : "#ffe4e6",
                                            color: log.status === "Sent" ? "#15803d" : "#be123c"
                                        }}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: "14px 16px", color: "#64748b" }}>{new Date(log.createdAt).toLocaleString()}</td>
                                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                                        {log.status === "Failed" && (
                                            <button
                                                onClick={() => handleRetryEmail(log._id)}
                                                style={{ padding: "6px 12px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}
                                            >
                                                🔄 Retry Dispatch
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {emailLogs.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                                        No email dispatch logs recorded.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* CREATE INVOICE MODAL */}
            {showCreateModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                    <div style={{ background: "#fff", padding: "28px", borderRadius: "14px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}>
                        <h2 style={{ marginTop: 0, color: "#0f172a" }}>Generate New Invoice (Manager Panel)</h2>
                        <form onSubmit={handleCreateInvoice} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Approved Quotation Reference (Optional):</label>
                                <select
                                    value={createForm.quotationId}
                                    onChange={(e) => {
                                        const qId = e.target.value;
                                        const quote = approvedQuotations.find(q => q._id === qId);
                                        setCreateForm(prev => ({
                                            ...prev,
                                            quotationId: qId,
                                            clientId: quote?.client?._id || quote?.client || prev.clientId
                                        }));
                                    }}
                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                >
                                    <option value="">Select Approved Quotation</option>
                                    {approvedQuotations.map(q => (
                                        <option key={q._id} value={q._id}>{q.quotationNumber} - {q.title} (BDT {q.total?.toLocaleString()})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Target Client Account *</label>
                                <select
                                    required
                                    value={createForm.clientId}
                                    onChange={(e) => setCreateForm({ ...createForm, clientId: e.target.value })}
                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                >
                                    <option value="">Select Client</option>
                                    {clients.map(c => (
                                        <option key={c._id} value={c._id}>{c.companyName || c.name} ({c.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Tax Rate (%):</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={createForm.taxRate}
                                    onChange={(e) => setCreateForm({ ...createForm, taxRate: Number(e.target.value) })}
                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Payment Due Date:</label>
                                <input
                                    type="date"
                                    required
                                    value={createForm.dueDate}
                                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Notes & Bank Details:</label>
                                <textarea
                                    rows="3"
                                    value={createForm.notes}
                                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                                    placeholder="Payment instructions, bank routing details..."
                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: "10px 16px", background: "#cbd5e1", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "700" }}>Cancel</button>
                                <button type="submit" style={{ padding: "10px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "800" }}>Submit for Finance Verification</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PAYMENT MODAL */}
            {showPaymentModal && selectedInvoice && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                    <div style={{ background: "#fff", padding: "28px", borderRadius: "14px", width: "100%", maxWidth: "500px" }}>
                        <h2 style={{ marginTop: 0, color: "#0f172a" }}>
                            {isClient
                                ? "💳 Secure Online Payment Gateway"
                                : user?.role === "accounts_officer"
                                ? "📥 Record Collected Payment (Finance)"
                                : "📥 Log Invoice Payment Received"}
                        </h2>
                        <p style={{ color: "#64748b", fontSize: "14px" }}>
                            {isClient
                                ? `Invoice: ${selectedInvoice.invoiceNumber} — Payable Balance: BDT ${selectedInvoice.dueAmount?.toLocaleString()}`
                                : `Invoice: ${selectedInvoice.invoiceNumber} — Client Due Balance: BDT ${selectedInvoice.dueAmount?.toLocaleString()}`}
                        </p>

                        <form onSubmit={handleRecordPayment} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>
                                    {isClient ? "Amount to Pay (BDT) *" : user?.role === "accounts_officer" ? "Collected Payment Amount (BDT) *" : "Payment Amount Received (BDT) *"}
                                </label>
                                <input
                                    type="number"
                                    required
                                    min={selectedInvoice.dueAmount > 0 && selectedInvoice.dueAmount < 0.01 ? selectedInvoice.dueAmount : "0.01"}
                                    step="any"
                                    max={selectedInvoice.dueAmount}
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "700" }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Payment Method:</label>
                                <select
                                    value={paymentForm.paymentMethod}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "700" }}
                                >
                                    <option value="Bank Transfer">bKash / Nagad / Online Banking</option>
                                    <option value="Credit Card">Credit / Debit Card</option>
                                    <option value="Bank Wire">Corporate Bank Wire</option>
                                    <option value="Cheque">Bank Cheque</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Transaction Reference Notes:</label>
                                <input
                                    type="text"
                                    placeholder={isClient ? "TrxID / Transaction Reference ID..." : "TrxID / Bank Deposit Receipt #..."}
                                    value={paymentForm.referenceNotes}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNotes: e.target.value })}
                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                                <button type="button" onClick={() => setShowPaymentModal(false)} style={{ padding: "10px 16px", background: "#cbd5e1", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "700" }}>Cancel</button>
                                <button type="submit" style={{ padding: "10px 18px", background: "#059669", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "800" }}>
                                    {isClient ? `🔒 Pay BDT ${paymentForm.amount ? Number(paymentForm.amount).toLocaleString() : 0} Now` : user?.role === "accounts_officer" ? "✓ Confirm Payment Collected" : "Save Payment Record"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
