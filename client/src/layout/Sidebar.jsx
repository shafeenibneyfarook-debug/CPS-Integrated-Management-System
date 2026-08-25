import React from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../modules/auth/authStore";

export default function Sidebar() {
    const { user } = useAuth();
    const role = user?.role || "client";

    const getRoleBadge = (r) => {
        switch (r) {
            case "admin": return { label: "Administrator", color: "#f87171" };
            case "manager": return { label: "Manager", color: "#60a5fa" };
            case "accounts_officer": return { label: "Accounts Officer", color: "#34d399" };
            case "operations_officer": return { label: "Operations Officer", color: "#fbbf24" };
            case "staff": return { label: "Staff", color: "#fbbf24" };
            case "supplier": return { label: "Material Vendor", color: "#a855f7" };
            default: return { label: "Client Account", color: "#38bdf8" };
        }
    };

    const roleInfo = getRoleBadge(role);

    return (
        <aside className="app-sidebar">
            {/* Brand Logo & Title */}
            <div className="sidebar-brand">
                <Link to={user ? "/dashboard" : "/"} className="sidebar-logo-link">
                    <div className="sidebar-logo-icon">CPS</div>
                    <div className="sidebar-brand-text">
                        <span className="brand-name">CPS Platform</span>
                        <span className="brand-sub">Contractor Ops</span>
                    </div>
                </Link>
            </div>

            {/* User Profile Card */}
            <div className="sidebar-user-card">
                <div className="user-avatar-circle">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="user-info-text">
                    <strong className="user-name">{user?.name}</strong>
                    <span className="user-role-badge" style={{ color: roleInfo.color, borderColor: roleInfo.color }}>
                        {roleInfo.label}
                    </span>
                </div>
            </div>

            {/* Role-Isolated Navigation */}
            <nav className="sidebar-nav">
                {/* 1. Client Role Sidebar */}
                {role === "client" && (
                    <div className="nav-group">
                        <span className="nav-group-title">Client Workspace</span>
                        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">📊</span>
                            <span>Dashboard</span>
                        </NavLink>
                        <NavLink to="/quotations" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">📑</span>
                            <span>My Proposals & Requests</span>
                        </NavLink>
                        <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">🏗️</span>
                            <span>My Projects & Sites</span>
                        </NavLink>
                        <NavLink to="/product-recommendations" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">💡</span>
                            <span>Budget Recommendations</span>
                        </NavLink>
                        <NavLink to="/invoices" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">💳</span>
                            <span>My Invoices & Payments</span>
                        </NavLink>
                    </div>
                )}

                {/* 2. Supplier / Vendor Role Sidebar */}
                {role === "supplier" && (
                    <div className="nav-group">
                        <span className="nav-group-title">Vendor Workspace</span>
                        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">📊</span>
                            <span>Dashboard</span>
                        </NavLink>
                        <NavLink to="/inventory" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">📦</span>
                            <span>Inventory & Stock Supply</span>
                        </NavLink>
                        <NavLink to="/purchase-orders" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">📦</span>
                            <span>Purchase Orders</span>
                        </NavLink>
                        <NavLink to="/shipments" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">🚢</span>
                            <span>Dispatches & Tracking</span>
                        </NavLink>
                        <NavLink to="/import-costs" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">💱</span>
                            <span>Import / Export Orders</span>
                        </NavLink>
                        <NavLink to="/price-scraper" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">🌐</span>
                            <span>Market Scraped Prices</span>
                        </NavLink>
                    </div>
                )}

                {/* 3. Accounts Officer Role Sidebar */}
                {role === "accounts_officer" && (
                    <div className="nav-group">
                        <span className="nav-group-title">Finance & Approvals</span>
                        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">📊</span>
                            <span>Dashboard</span>
                        </NavLink>
                        <NavLink to="/purchase-orders" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">📦</span>
                            <span>Purchase Order Approvals</span>
                        </NavLink>
                        <NavLink to="/invoices" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">💳</span>
                            <span>Invoices & Verification</span>
                        </NavLink>
                        <NavLink to="/import-costs" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">💱</span>
                            <span>Import / Export Approvals</span>
                        </NavLink>
                    </div>
                )}

                {/* 4. Operations Officer / Staff Role Sidebar */}
                {(role === "operations_officer" || role === "staff") && (
                    <div className="nav-group">
                        <span className="nav-group-title">Field Operations</span>
                        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">📊</span>
                            <span>Dashboard</span>
                        </NavLink>
                        <NavLink to="/clients" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">🏢</span>
                            <span>Clients Directory</span>
                        </NavLink>
                        <NavLink to="/suppliers" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">🚢</span>
                            <span>Suppliers Directory</span>
                        </NavLink>
                        <NavLink to="/inventory" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">📦</span>
                            <span>Inventory & Stock</span>
                        </NavLink>
                        <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">🏗️</span>
                            <span>Projects & Site Maps</span>
                        </NavLink>
                        <NavLink to="/shipments" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">🚢</span>
                            <span>Shipment Tracking</span>
                        </NavLink>
                    </div>
                )}

                {/* 5. Manager Role Sidebar */}
                {role === "manager" && (
                    <div className="nav-group">
                        <span className="nav-group-title">Operations & Management</span>
                        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">📊</span>
                            <span>Dashboard</span>
                        </NavLink>
                        <NavLink to="/clients" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">🏢</span>
                            <span>Clients</span>
                        </NavLink>
                        <NavLink to="/suppliers" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">🚢</span>
                            <span>Suppliers</span>
                        </NavLink>
                        <NavLink to="/inventory" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">📦</span>
                            <span>Inventory Stock</span>
                        </NavLink>
                        <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">🏗️</span>
                            <span>Projects & Maps</span>
                        </NavLink>
                        <NavLink to="/quotations" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">📑</span>
                            <span>Tenders & Quotes</span>
                        </NavLink>
                        <NavLink to="/invoices" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">💳</span>
                            <span>Invoices & Payments</span>
                        </NavLink>
                        <NavLink to="/import-costs" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">💱</span>
                            <span>Import Cost & Profit</span>
                        </NavLink>
                        <NavLink to="/boq-estimator" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">🧮</span>
                            <span>BOQ Cost Estimator</span>
                        </NavLink>
                        <NavLink to="/purchase-orders" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">📦</span>
                            <span>Purchase Orders</span>
                        </NavLink>
                        <NavLink to="/shipments" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">🚢</span>
                            <span>Shipments</span>
                        </NavLink>
                    </div>
                )}

                {/* 6. Administrator Role Sidebar */}
                {role === "admin" && (
                    <div className="nav-group">
                        <span className="nav-group-title">Full Administration</span>
                        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">📊</span>
                            <span>Dashboard</span>
                        </NavLink>
                        <NavLink to="/clients" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">🏢</span>
                            <span>Clients</span>
                        </NavLink>
                        <NavLink to="/suppliers" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">🚢</span>
                            <span>Suppliers</span>
                        </NavLink>
                        <NavLink to="/invoices" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">💳</span>
                            <span>Invoices & Finance</span>
                        </NavLink>
                        <NavLink to="/inventory" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">📦</span>
                            <span>Inventory & Stock</span>
                        </NavLink>
                        <NavLink to="/import-costs" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">💱</span>
                            <span>Import Cost & Profit</span>
                        </NavLink>
                        <NavLink to="/price-scraper" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">🌐</span>
                            <span>Price Scraper Review</span>
                        </NavLink>
                        <NavLink to="/boq-estimator" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">🧮</span>
                            <span>BOQ Cost Estimator</span>
                        </NavLink>
                        <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">🏗️</span>
                            <span>Projects & Maps</span>
                        </NavLink>
                        <NavLink to="/quotations" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">📑</span>
                            <span>Tenders & Quotes</span>
                        </NavLink>
                        <NavLink to="/purchase-orders" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">📦</span>
                            <span>Purchase Orders</span>
                        </NavLink>
                        <NavLink to="/shipments" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">🚢</span>
                            <span>Shipments</span>
                        </NavLink>
                        <NavLink to="/admin/users" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <span className="nav-icon">👥</span>
                            <span>Users & Access</span>
                        </NavLink>
                    </div>
                )}

                {/* Account Settings */}
                <div className="nav-group">
                    <span className="nav-group-title">Account</span>
                    <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                        <span className="nav-icon">⚙️</span>
                        <span>My Profile</span>
                    </NavLink>
                </div>
            </nav>
        </aside>
    );
}
