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
                    const [qRes, pRes] = await Promise.all([
                        API.get("/quotations").catch(() => ({ data: [] })),
                        API.get("/projects").catch(() => ({ data: [] }))
                    ]);
                    const quotations = Array.isArray(qRes.data) ? qRes.data : [];
                    const projects = Array.isArray(pRes.data) ? pRes.data : [];

                    const pending = quotations.filter(q => q && (q.status === "Submitted" || q.adminVerificationStatus === "Pending Admin Approval"));
                    pending.forEach(q => {
                        alerts.push({
                            id: q._id,
                            title: `Client Proposal: ${q.title || q.quotationNumber || "Proposal"}`,
                            subtitle: `From ${q.client?.companyName || q.client?.name || "Client"} (${q.constructionSiteLocation || "Site"})`,
                            target: "/boq-estimator",
                            tag: "Action Required"
                        });
                    });

                    // Construction Progress Photo Verification Alerts for Manager
                    projects.forEach(p => {
                        if (p && p.progressUpdates && Array.isArray(p.progressUpdates)) {
                            p.progressUpdates.filter(u => u && u.status === "Pending Approval").forEach(u => {
                                alerts.push({
                                    id: `photo-verify-${p._id}-${u._id}`,
                                    title: `📸 Photo Verification: ${p.projectName}`,
                                    subtitle: `Logistics logged ${u.percentage}% (${u.stageName}) — Site photo awaiting approval`,
                                    target: `/projects/${p._id}`,
                                    tag: "Photo Verification"
                                });
                            });
                        }
                    });
                } else if (role === "admin") {
                    const [qRes, pRes, prRes] = await Promise.all([
                        API.get("/quotations").catch(() => ({ data: [] })),
                        API.get("/price-scraper").catch(() => ({ data: { prices: [] } })),
                        API.get("/projects").catch(() => ({ data: [] }))
                    ]);
                    const quotations = Array.isArray(qRes.data) ? qRes.data : [];
                    const prices = Array.isArray(pRes.data?.prices) ? pRes.data.prices : (Array.isArray(pRes.data) ? pRes.data : []);
                    const projects = Array.isArray(prRes.data) ? prRes.data : [];

                    const pendingOffers = quotations.filter(q => q && q.adminVerificationStatus === "Pending Admin Approval");
                    const duplicates = prices.filter(p => p && p.flagReason?.toLowerCase().includes("duplicate"));

                    pendingOffers.forEach(q => {
                        alerts.push({
                            id: q._id,
                            title: `Manager Offer Verification: ${q.quotationNumber || "Quote"}`,
                            subtitle: `${q.title || "Offer"} — BDT ${(q.total || 0).toLocaleString()}`,
                            target: "/quotations",
                            tag: "Offer Verification"
                        });
                    });

                    duplicates.forEach(p => {
                        alerts.push({
                            id: p._id,
                            title: `Duplicate Scraped Price: ${p.itemName || "Item"}`,
                            subtitle: `Category: ${p.category || "General"} (${p.brand || "Standard"})`,
                            target: "/price-scraper",
                            tag: "Cleanup Alert"
                        });
                    });

                    // Admin also oversees pending photo verifications
                    projects.forEach(p => {
                        if (p && p.progressUpdates && Array.isArray(p.progressUpdates)) {
                            p.progressUpdates.filter(u => u && u.status === "Pending Approval").forEach(u => {
                                alerts.push({
                                    id: `admin-photo-verify-${p._id}-${u._id}`,
                                    title: `📸 Photo Verification: ${p.projectName}`,
                                    subtitle: `Logistics logged ${u.percentage}% (${u.stageName}) — Awaiting sign-off`,
                                    target: `/projects/${p._id}`,
                                    tag: "Photo Sign-Off"
                                });
                            });
                        }
                    });
                } else if (role === "client") {
                    const [qRes, iRes, pRes] = await Promise.all([
                        API.get("/quotations").catch(() => ({ data: [] })),
                        API.get("/invoices").catch(() => ({ data: { invoices: [] } })),
                        API.get("/projects").catch(() => ({ data: [] }))
                    ]);
                    const quotations = Array.isArray(qRes.data) ? qRes.data : [];
                    const invoices = Array.isArray(iRes.data?.invoices) ? iRes.data.invoices : (Array.isArray(iRes.data) ? iRes.data : []);
                    const projects = Array.isArray(pRes.data) ? pRes.data : [];

                    const verifiedOffers = quotations.filter(q => q && q.adminVerificationStatus === "Admin Verified" && q.status !== "Approved" && q.status !== "Rejected");
                    const verifiedInvoices = invoices.filter(i => i && i.paymentStatus !== "Paid");

                    verifiedOffers.forEach(q => {
                        alerts.push({
                            id: q._id,
                            title: `Verified Offer Ready: ${q.quotationNumber || "Quote"}`,
                            subtitle: `${q.title || "Offer"} — Review & Accept/Decline`,
                            target: "/quotations",
                            tag: "Offer Ready"
                        });
                    });

                    verifiedInvoices.forEach(i => {
                        alerts.push({
                            id: i._id,
                            title: `Finance Verified Invoice: ${i.invoiceNumber || "Invoice"}`,
                            subtitle: `Due: BDT ${(i.dueAmount || 0).toLocaleString()}`,
                            target: "/invoices",
                            tag: "Payment Due"
                        });
                    });

                    // Client live verified photo proof notifications
                    projects.forEach(p => {
                        if (p && p.progressUpdates && Array.isArray(p.progressUpdates)) {
                            p.progressUpdates.filter(u => u && u.status === "Approved").forEach(u => {
                                alerts.push({
                                    id: `client-proof-${p._id}-${u._id}`,
                                    title: `🏗️ Verified Site Progress: ${p.projectName}`,
                                    subtitle: `Reached ${u.percentage}% (${u.stageName}) with manager-verified photo proof`,
                                    target: `/projects/${p._id}`,
                                    tag: "Verified Proof"
                                });
                            });
                        }
                    });
                } else if (role === "accounts_officer") {
                    const res = await API.get("/invoices").catch(() => ({ data: { invoices: [] } }));
                    const invoices = Array.isArray(res.data?.invoices) ? res.data.invoices : (Array.isArray(res.data) ? res.data : []);
                    const pending = invoices.filter(i => i && i.financeVerificationStatus === "Pending Finance Verification");
                    pending.forEach(i => {
                        const projTitle = i.quotation?.title || i.project?.projectName || "Building Project";
                        const projSite = i.quotation?.constructionSiteLocation || i.project?.siteAddress || "Site";
                        alerts.push({
                            id: i._id,
                            title: `Project Invoice: ${projTitle}`,
                            subtitle: `Invoice #${i.invoiceNumber || "Inv"} (BDT ${(i.totalAmount || 0).toLocaleString()}) — ${projSite}`,
                            target: "/invoices",
                            tag: "Finance Verification"
                        });
                    });
                } else if (role === "operations_officer" || role === "staff") {
                    const [qRes, pRes, prRes] = await Promise.all([
                        API.get("/quotations").catch(() => ({ data: [] })),
                        API.get("/price-scraper").catch(() => ({ data: { prices: [] } })),
                        API.get("/projects").catch(() => ({ data: [] }))
                    ]);
                    const quotations = Array.isArray(qRes.data) ? qRes.data : [];
                    const prices = Array.isArray(pRes.data?.prices) ? pRes.data.prices : (Array.isArray(pRes.data) ? pRes.data : []);
                    const projects = Array.isArray(prRes.data) ? prRes.data : [];

                    const approvedProposals = quotations.filter(q => q && q.status === "Approved");
                    const unverifiedQty = prices.filter(p => p && p.availableQuantity > 0 && p.quantityVerificationStatus !== "Logistics Verified");

                    approvedProposals.forEach(q => {
                        alerts.push({
                            id: q._id,
                            title: `Approved Site Execution: ${q.quotationNumber || "Quote"}`,
                            subtitle: `Location: ${q.constructionSiteLocation || "Site"}`,
                            target: "/shipments",
                            tag: "Logistics Action"
                        });
                    });

                    unverifiedQty.forEach(p => {
                        alerts.push({
                            id: p._id,
                            title: `Supplier Qty Verification: ${p.itemName || "Item"}`,
                            subtitle: `Supplier Qty: ${p.availableQuantity} ${p.unit || "Units"}`,
                            target: "/price-scraper",
                            tag: "Qty Verification"
                        });
                    });

                    // Notify Logistics Officer if any update was rejected
                    projects.forEach(p => {
                        if (p && p.progressUpdates && Array.isArray(p.progressUpdates)) {
                            p.progressUpdates.filter(u => u && u.status === "Rejected").forEach(u => {
                                alerts.push({
                                    id: `rejected-update-${p._id}-${u._id}`,
                                    title: `❌ Correction Required: ${p.projectName}`,
                                    subtitle: `Manager rejected ${u.percentage}%: "${u.rejectionReason || 'Correct site photo'}"`,
                                    target: `/projects/${p._id}`,
                                    tag: "Correction Needed"
                                });
                            });
                        }
                    });
                } else if (role === "supplier") {
                    const [res, invRes] = await Promise.all([
                        API.get("/price-scraper").catch(() => ({ data: { prices: [] } })),
                        API.get("/inventory/alerts").catch(() => ({ data: { alerts: [] } }))
                    ]);
                    const prices = Array.isArray(res.data?.prices) ? res.data.prices : (Array.isArray(res.data) ? res.data : []);
                    const alertsList = Array.isArray(invRes.data?.alerts) ? invRes.data.alerts : (Array.isArray(invRes.data) ? invRes.data : []);

                    const unsupplied = prices.filter(p => p && p.verificationStatus === "Verified" && (!p.availableQuantity || p.availableQuantity === 0));
                    unsupplied.forEach(p => {
                        alerts.push({
                            id: p._id,
                            title: `Material Verified: ${p.itemName || "Material"}`,
                            subtitle: `Submit firm's available supply quantity`,
                            target: "/price-scraper",
                            tag: "Capacity Offer"
                        });
                    });

                    const outOfStockItems = alertsList.filter(item => item && (item.currentStock === 0 || item.status === "Out of Stock"));
                    outOfStockItems.forEach(item => {
                        alerts.push({
                            id: `inv-${item._id}`,
                            title: `🚨 Stock Out Alert: ${item.itemName || "Item"}`,
                            subtitle: `Stock hit 0 ${item.unit || "Pcs"} (${item.category || "General"}) — Open to all suppliers to add stock`,
                            target: "/inventory",
                            tag: "Supplier Stock-Out Alert"
                        });
                    });
                }

                if (active) {
                    let seenIds = [];
                    try {
                        seenIds = JSON.parse(localStorage.getItem(getSeenStorageKey()) || "[]");
                    } catch {
                        seenIds = [];
                    }
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
        if (!path) return "Operations Dashboard";
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

            {/* Right: Header Actions & Notification Center */}
            <div className="topbar-right" style={{ position: "relative" }}>

                {/* NOTIFICATION BELL BUTTON */}
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
                            {(user?.name || "A").charAt(0).toUpperCase()}
                        </div>
                        <span className="user-fullname">{user?.name || "User"}</span>
                    </Link>

                    <button onClick={handleLogout} className="topbar-logout-btn" title="Sign out">
                        Sign Out
                    </button>
                </div>
            </div>
        </header>
    );
}
