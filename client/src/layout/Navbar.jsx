import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../modules/auth/authStore";
import API from "../api/axiosConfig";

export default function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const role = user?.role || "client";
    const userId = user?._id || user?.id || "guest";

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const [notificationList, setNotificationList] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    const getSeenStorageKey = () => `cps_seen_notifs_${userId}`;

    const markSeen = (id, e) => {
        if (e) e.stopPropagation();
        try {
            const key = getSeenStorageKey();
            const existing = JSON.parse(localStorage.getItem(key) || "[]");
            if (!existing.includes(String(id))) {
                const updated = [...existing, String(id)];
                localStorage.setItem(key, JSON.stringify(updated));
            }
            setNotificationList(prev => prev.filter(item => String(item.id) !== String(id)));
        } catch (err) {
            console.error("Error saving seen notification", err);
        }
    };

    const markAllSeen = () => {
        try {
            const key = getSeenStorageKey();
            const existing = JSON.parse(localStorage.getItem(key) || "[]");
            const allIds = notificationList.map(n => String(n.id));
            const updated = Array.from(new Set([...existing, ...allIds]));
            localStorage.setItem(key, JSON.stringify(updated));
            setNotificationList([]);
        } catch (err) {
            console.error("Error marking all notifications seen", err);
        }
    };

    useEffect(() => {
        let active = true;
        const fetchNotifications = async () => {
            try {
                const alerts = [];

                if (role === "manager") {
                    const res = await API.get("/quotations");
                    const pending = (res.data || []).filter(q => q.status === "Submitted" || q.adminVerificationStatus === "Pending Admin Approval");
                    pending.forEach(q => {
                        alerts.push({
                            id: q._id,
                            title: `Client Proposal: ${q.title}`,
                            subtitle: `From ${q.client?.companyName || q.client?.name || "Client"} (${q.constructionSiteLocation || "Site"})`,
                            target: "/boq-estimator",
                            tag: "Action Required"
                        });
                    });
                } else if (role === "admin") {
                    const [qRes, pRes] = await Promise.all([
                        API.get("/quotations"),
                        API.get("/price-scraper")
                    ]);
                    const pendingOffers = (qRes.data || []).filter(q => q.adminVerificationStatus === "Pending Admin Approval");
                    const duplicates = (pRes.data.prices || []).filter(p => p.flagReason?.toLowerCase().includes("duplicate"));

                    pendingOffers.forEach(q => {
                        alerts.push({
                            id: q._id,
                            title: `Manager Offer Verification: ${q.quotationNumber}`,
                            subtitle: `${q.title} — BDT ${q.total?.toLocaleString()}`,
                            target: "/quotations",
                            tag: "Offer Verification"
                        });
                    });

                    duplicates.forEach(p => {
                        alerts.push({
                            id: p._id,
                            title: `Duplicate Scraped Price: ${p.itemName}`,
                            subtitle: `Category: ${p.category} (${p.brand})`,
                            target: "/price-scraper",
                            tag: "Cleanup Alert"
                        });
                    });
                } else if (role === "client") {
                    const [qRes, iRes, pRes] = await Promise.all([
                        API.get("/quotations").catch(() => ({ data: [] })),
                        API.get("/invoices").catch(() => ({ data: { invoices: [] } })),
                        API.get("/projects").catch(() => ({ data: [] }))
                    ]);
                    const verifiedOffers = (qRes.data || []).filter(q => q.adminVerificationStatus === "Admin Verified" && q.status !== "Approved" && q.status !== "Rejected");
                    const verifiedInvoices = (iRes.data.invoices || []).filter(i => i.paymentStatus !== "Paid");
                    const runningProjects = (pRes.data || []).filter(p => p.status === "Running" || p.status === "Pending");

                    verifiedOffers.forEach(q => {
                        alerts.push({
                            id: q._id,
                            title: `Verified Offer Ready: ${q.quotationNumber}`,
                            subtitle: `${q.title} — Review & Accept/Decline`,
                            target: "/quotations",
                            tag: "Offer Ready"
                        });
                    });

                    verifiedInvoices.forEach(i => {
                        alerts.push({
                            id: i._id,
                            title: `Finance Verified Invoice: ${i.invoiceNumber}`,
                            subtitle: `Due: BDT ${i.dueAmount?.toLocaleString()}`,
                            target: "/invoices",
                            tag: "Payment Due"
                        });
                    });

                    runningProjects.forEach(p => {
                        alerts.push({
                            id: p._id,
                            title: `Active Construction Project: ${p.projectName}`,
                            subtitle: `Status: ${p.status} • Site: ${p.projectLocation}`,
                            target: "/projects",
                            tag: "Project Active"
                        });
                    });
                } else if (role === "accounts_officer") {
                    const res = await API.get("/invoices");
                    const pending = (res.data.invoices || []).filter(i => i.financeVerificationStatus === "Pending Finance Verification");
                    pending.forEach(i => {
                        const projTitle = i.quotation?.title || i.project?.projectName || "Building Project";
                        const projSite = i.quotation?.constructionSiteLocation || i.project?.siteAddress || "Site";
                        alerts.push({
                            id: i._id,
                            title: `Project Invoice: ${projTitle}`,
                            subtitle: `Invoice #${i.invoiceNumber} (BDT ${i.totalAmount?.toLocaleString()}) — ${projSite}`,
                            target: "/invoices",
                            tag: "Finance Verification"
                        });
                    });
                } else if (role === "operations_officer" || role === "staff") {
                    const [qRes, pRes] = await Promise.all([
                        API.get("/quotations"),
                        API.get("/price-scraper")
                    ]);
                    const approvedProposals = (qRes.data || []).filter(q => q.status === "Approved");
                    const unverifiedQty = (pRes.data.prices || []).filter(p => p.availableQuantity > 0 && p.quantityVerificationStatus !== "Logistics Verified");

                    approvedProposals.forEach(q => {
                        alerts.push({
                            id: q._id,
                            title: `Approved Site Execution: ${q.quotationNumber}`,
                            subtitle: `Location: ${q.constructionSiteLocation || "Site"}`,
                            target: "/shipments",
                            tag: "Logistics Action"
                        });
                    });

                    unverifiedQty.forEach(p => {
                        alerts.push({
                            id: p._id,
                            title: `Supplier Qty Verification: ${p.itemName}`,
                            subtitle: `Supplier Qty: ${p.availableQuantity} ${p.unit}`,
                            target: "/price-scraper",
                            tag: "Qty Verification"
                        });
                    });
                } else if (role === "supplier") {
                    const [res, invRes] = await Promise.all([
                        API.get("/price-scraper").catch(() => ({ data: { prices: [] } })),
                        API.get("/inventory/alerts").catch(() => ({ data: { alerts: [] } }))
                    ]);

                    const unsupplied = (res.data.prices || []).filter(p => p.verificationStatus === "Verified" && (!p.availableQuantity || p.availableQuantity === 0));
                    unsupplied.forEach(p => {
                        alerts.push({
                            id: p._id,
                            title: `Material Verified: ${p.itemName}`,
                            subtitle: `Submit firm's available supply quantity`,
                            target: "/price-scraper",
                            tag: "Capacity Offer"
                        });
                    });

                    const outOfStockItems = (invRes.data.alerts || []).filter(item => item.currentStock === 0 || item.status === "Out of Stock");
                    outOfStockItems.forEach(item => {
                        alerts.push({
                            id: `inv-${item._id}`,
                            title: `🚨 Stock Out Alert: ${item.itemName}`,
                            subtitle: `Stock hit 0 ${item.unit} (${item.category}) — Open to all suppliers to add stock`,
                            target: "/inventory",
                            tag: "Supplier Stock-Out Alert"
                        });
                    });
                }

                if (active) {
                    const seenIds = JSON.parse(localStorage.getItem(getSeenStorageKey()) || "[]");
                    const unreadAlerts = alerts.filter(a => !seenIds.includes(String(a.id)));
                    setNotificationList(unreadAlerts);
                }
            } catch (e) {
                console.error("Notification check error", e);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => { active = false; clearInterval(interval); };
    }, [role, userId]);

    const getPageTitle = (path) => {
        if (path.includes("/clients")) return "Client Directory";
        if (path.includes("/suppliers")) return "Supplier Directory";
        if (path.includes("/projects")) return "Projects & Site Locations";
        if (path.includes("/quotations")) return "Tenders & Quotations";
        if (path.includes("/purchase-orders")) return "Purchase Orders";
        if (path.includes("/shipments")) return "Shipment Tracking";
        if (path.includes("/invoices")) return "Invoices & Finance";
        if (path.includes("/inventory")) return "Inventory & Stock";
        if (path.includes("/import-costs")) return "Import Cost & Currency";
        if (path.includes("/price-scraper")) return "Material Price Scraper";
        if (path.includes("/boq-estimator")) return "Draft BOQ Estimator";
        if (path.includes("/product-recommendations")) return "Product Recommendations & Alerts";
        if (path.includes("/admin/users")) return "Users & Access Control";
        if (path.includes("/profile")) return "Account Profile";
        return "Operations Dashboard";
    };

    const formatRole = (r) => {
        switch (r) {
            case "admin": return "Administrator";
            case "manager": return "Manager";
            case "accounts_officer": return "Unified Head of Finance";
            case "operations_officer": return "Operations Officer";
            case "supplier": return "Material Vendor";
            case "staff": return "Staff";
            default: return "Client Account";
        }
    };

    const currentTitle = getPageTitle(location.pathname);
    const unreadCount = notificationList.length;

    return (
        <header className="dashboard-topbar">
            {/* Left: Workspace Title */}
            <div className="topbar-left">
                <span className="topbar-breadcrumb">Workspace</span>
                <span className="topbar-divider">/</span>
                <strong className="topbar-title">{currentTitle}</strong>
            </div>

            {/* Right: Header Actions & Permanently Visible Notification Center */}
            <div className="topbar-right" style={{ position: "relative" }}>

                {/* PERMANENTLY VISIBLE NOTIFICATION BELL BUTTON */}
                <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    title="View Role Notifications"
                    style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "38px",
                        height: "38px",
                        borderRadius: "50%",
                        background: unreadCount > 0 ? "#fef2f2" : "#f1f5f9",
                        border: unreadCount > 0 ? "1px solid #fca5a5" : "1px solid #cbd5e1",
                        fontSize: "18px",
                        cursor: "pointer",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                    }}
                >
                    <span>🔔</span>
                    <span style={{
                        position: "absolute",
                        top: "-4px",
                        right: "-4px",
                        background: unreadCount > 0 ? "#dc2626" : "#64748b",
                        color: "#ffffff",
                        fontSize: "10px",
                        fontWeight: "800",
                        padding: "2px 6px",
                        borderRadius: "999px",
                        minWidth: "18px",
                        textAlign: "center"
                    }}>
                        {unreadCount}
                    </span>
                </button>

                {/* INTERACTIVE NOTIFICATION DROPDOWN PANEL */}
                {showDropdown && (
                    <div style={{
                        position: "absolute",
                        top: "48px",
                        right: "0",
                        width: "380px",
                        background: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #cbd5e1",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                        zIndex: 2000,
                        overflow: "hidden"
                    }}>
                        <div style={{ padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong style={{ fontSize: "14px", color: "#0f172a" }}>Role Alerts ({unreadCount})</strong>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllSeen}
                                        style={{ background: "none", border: "none", fontSize: "11px", fontWeight: "700", color: "#2563eb", cursor: "pointer", textDecoration: "underline" }}
                                    >
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowDropdown(false)}
                                    style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                            {unreadCount === 0 ? (
                                <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                                    ✨ No unread alerts — All operational tasks clear.
                                </div>
                            ) : (
                                notificationList.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            markSeen(item.id);
                                            setShowDropdown(false);
                                            navigate(item.target);
                                        }}
                                        style={{
                                            padding: "12px 16px",
                                            borderBottom: "1px solid #f1f5f9",
                                            cursor: "pointer",
                                            transition: "background 0.15s ease",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            gap: "8px"
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                    >
                                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px" }}>
                                                <strong style={{ fontSize: "13px", color: "#0f172a" }}>{item.title}</strong>
                                                <span style={{ fontSize: "10px", fontWeight: "800", background: "#eff6ff", color: "#2563eb", padding: "2px 6px", borderRadius: "4px", whiteSpace: "nowrap" }}>
                                                    {item.tag}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#64748b" }}>{item.subtitle}</div>
                                        </div>
                                        <button
                                            type="button"
                                            title="Dismiss notification"
                                            onClick={(e) => markSeen(item.id, e)}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: "#94a3b8",
                                                fontSize: "14px",
                                                cursor: "pointer",
                                                padding: "2px 4px",
                                                borderRadius: "4px"
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = "#dc2626"}
                                            onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}


                <div className="topbar-user">
                    <Link to="/profile" className="user-profile-link" title="View Account Profile">
                        <div className="user-initials">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="user-fullname">{user?.name}</span>
                    </Link>

                    <button onClick={handleLogout} className="topbar-logout-btn" title="Sign out">
                        Sign Out
                    </button>
                </div>
            </div>
        </header>
    );
}
