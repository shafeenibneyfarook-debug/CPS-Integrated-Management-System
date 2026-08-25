import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardStats, getRecentActivities } from "../modules/dashboard/dashboardApi";
import { getQuotations } from "../modules/quotation/quotationApi";
import { getProjects } from "../modules/project/projectApi";
import { getPurchaseOrders } from "../modules/purchaseOrder/purchaseOrderApi";
import { getShipments } from "../modules/shipment/shipmentApi";
import { useAuth } from "../modules/auth/authStore";
import "./Dashboard.css";

export default function Dashboard() {
    const { user } = useAuth();
    const role = user?.role || "client";

    const isClient = role === "client";
    const isSupplier = role === "supplier";
    const isOperations = role === "operations_officer" || role === "staff";
    const isAccounts = role === "accounts_officer";
    const isManager = role === "manager";
    const isAdmin = role === "admin";

    const [stats, setStats] = useState({
        totalClients: 0,
        totalProjects: 0,
        totalSuppliers: 0,
        activeProjects: 0
    });

    const [clientStats, setClientStats] = useState({
        myProposals: 0,
        pendingReview: 0,
        myProjects: 0
    });

    const [supplierStats, setSupplierStats] = useState({
        myOrders: 0,
        myShipments: 0
    });

    const [activities, setActivities] = useState({
        clients: [],
        projects: [],
        suppliers: []
    });

    const [clientProposals, setClientProposals] = useState([]);
    const [supplierPOs, setSupplierPOs] = useState([]);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                if (isClient) {
                    const [quoteRes, projRes] = await Promise.allSettled([
                        getQuotations(),
                        getProjects()
                    ]);
                    if (!active) return;
                    const quotes = quoteRes.status === "fulfilled" && Array.isArray(quoteRes.value?.data) ? quoteRes.value.data : [];
                    const projs = projRes.status === "fulfilled" && Array.isArray(projRes.value?.data) ? projRes.value.data : [];

                    setClientProposals(quotes);
                    setClientStats({
                        myProposals: quotes.length,
                        pendingReview: quotes.filter((q) => q.status === "Submitted").length,
                        myProjects: projs.length
                    });
                } else if (isSupplier) {
                    const [poRes, shipRes] = await Promise.allSettled([
                        getPurchaseOrders(),
                        getShipments()
                    ]);
                    if (!active) return;
                    const pos = poRes.status === "fulfilled" && Array.isArray(poRes.value?.data) ? poRes.value.data : [];
                    const ships = shipRes.status === "fulfilled" && Array.isArray(shipRes.value?.data) ? shipRes.value.data : [];

                    setSupplierPOs(pos);
                    setSupplierStats({
                        myOrders: pos.length,
                        myShipments: ships.length
                    });
                } else {
                    const [statsRes, actRes] = await Promise.allSettled([
                        getDashboardStats(),
                        getRecentActivities()
                    ]);
                    if (!active) return;
                    if (statsRes.status === "fulfilled" && statsRes.value?.data) {
                        setStats(statsRes.value.data);
                    }
                    if (actRes.status === "fulfilled" && actRes.value?.data) {
                        setActivities(actRes.value.data);
                    }
                }
            } catch (e) {
                console.error("Dashboard data load error:", e);
            }
        };
        load();
        return () => { active = false; };
    }, [isClient, isSupplier]);

    const getHeroConfig = () => {
        switch (role) {
            case "admin":
                return {
                    eyebrow: "Administrator Console",
                    subtext: "Full control over master directories, access permissions, financial approvals, and operations."
                };
            case "manager":
                return {
                    eyebrow: "Management Overview",
                    subtext: "Supervise contractor projects, client proposals, supplier purchase orders, and project team assignments."
                };
            case "accounts_officer":
                return {
                    eyebrow: "Finance & Billing Console",
                    subtext: "Manage tender quotation line items, tax rules, purchase order cost approvals, and shipment billing."
                };
            case "operations_officer":
            case "staff":
                return {
                    eyebrow: "Field Operations Console",
                    subtext: "Monitor active project site locations on Google Maps, log daily field progress, and track material shipments."
                };
            case "supplier":
                return {
                    eyebrow: "Material Vendor Portal",
                    subtext: "Review purchase orders issued to your company, process material dispatches, and log carrier tracking."
                };
            default:
                return {
                    eyebrow: "Client Portal",
                    subtext: "Submit building proposal requests, review management's supplier cost estimations, and track construction projects."
                };
        }
    };

    const heroConfig = getHeroConfig();

    return (
        <div className="dashboard-root">
            {/* Header / Intro Banner */}
            <div className="dashboard-hero-banner">
                <div>
                    <span className="eyebrow-tag">{heroConfig.eyebrow}</span>
                    <h1 className="dashboard-main-title">
                        Welcome back, {user?.name || "User"}
                    </h1>
                    <p className="dashboard-subtext">
                        {heroConfig.subtext}
                    </p>
                </div>

                <div className="quick-actions-bar">
                    {isClient ? (
                        <>
                            <Link to="/quotations" className="action-pill primary">
                                + Submit Proposal Request
                            </Link>
                            <Link to="/projects" className="action-pill secondary">
                                My Projects & Maps
                            </Link>
                        </>
                    ) : isSupplier ? (
                        <>
                            <Link to="/purchase-orders" className="action-pill primary">
                                View Purchase Orders
                            </Link>
                            <Link to="/shipments" className="action-pill secondary">
                                Dispatches & Tracking
                            </Link>
                        </>
                    ) : isOperations ? (
                        <>
                            <Link to="/projects" className="action-pill primary">
                                Field Site Maps
                            </Link>
                            <Link to="/shipments" className="action-pill secondary">
                                Track Shipments
                            </Link>
                        </>
                    ) : isAccounts ? (
                        <>
                            <Link to="/quotations" className="action-pill primary">
                                Tenders & Financials
                            </Link>
                            <Link to="/purchase-orders" className="action-pill secondary">
                                PO Costing
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link to="/projects" className="action-pill primary">
                                View Locations Map
                            </Link>
                            <Link to="/quotations" className="action-pill secondary">
                                New Quotation
                            </Link>
                            <Link to="/purchase-orders" className="action-pill secondary">
                                Create PO
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* 1. Supplier Role Dashboard */}
            {isSupplier ? (
                <>
                    <div className="stats-bento-grid">
                        <div className="bento-metric-card">
                            <div className="metric-header">
                                <span className="metric-label">Assigned Purchase Orders</span>
                                {supplierStats.myOrders > 0 && <span className="status-indicator active" />}
                            </div>
                            <strong className="metric-num font-mono">{supplierStats.myOrders}</strong>
                            <div className="metric-footer">
                                <span>Material orders issued to you</span>
                                <Link to="/purchase-orders">Orders →</Link>
                            </div>
                        </div>

                        <div className="bento-metric-card">
                            <div className="metric-header">
                                <span className="metric-label">Dispatches & Shipments</span>
                            </div>
                            <strong className="metric-num font-mono">{supplierStats.myShipments}</strong>
                            <div className="metric-footer">
                                <span>Tracked shipments in transit</span>
                                <Link to="/shipments">Shipments →</Link>
                            </div>
                        </div>
                    </div>

                    <div className="modules-quick-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                        <Link to="/purchase-orders" className="module-shortcut-card">
                            <div className="shortcut-icon amber">📦</div>
                            <div className="shortcut-text">
                                <h4>My Purchase Orders</h4>
                                <p>Review purchase orders issued by contractor management, accept items, and process fulfillments.</p>
                            </div>
                        </Link>

                        <Link to="/shipments" className="module-shortcut-card">
                            <div className="shortcut-icon rose">🚢</div>
                            <div className="shortcut-text">
                                <h4>Dispatches & Tracking</h4>
                                <p>Log carrier tracking numbers, bill of lading, and dispatch dates for site delivery.</p>
                            </div>
                        </Link>
                    </div>

                    <div className="dashboard-activity-container">
                        <div className="activity-card-header">
                            <h3>My Purchase Orders Stream</h3>
                            <span className="activity-count">Vendor stream</span>
                        </div>

                        <div className="activity-stream">
                            {supplierPOs.length === 0 ? (
                                <div className="activity-empty">No purchase orders assigned to your supplier account yet.</div>
                            ) : (
                                supplierPOs.map((po) => (
                                    <div key={po._id} className="stream-item">
                                        <span className={`stream-dot ${po.status === "Approved" ? "green" : "amber"}`} />
                                        <div className="stream-content">
                                            <p>PO <strong>{po.poNumber}</strong> — {po.title || "Material Purchase Order"}</p>
                                            <small>
                                                Status: <strong>{po.status}</strong> · Total: ${po.totalAmount?.toLocaleString()} · Target Delivery: {new Date(po.deliveryDate).toLocaleDateString()}
                                            </small>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            ) : isClient ? (
                /* 2. Client Role Dashboard */
                <>
                    <div className="stats-bento-grid">
                        <div className="bento-metric-card">
                            <div className="metric-header">
                                <span className="metric-label">Pending Estimations</span>
                                {clientStats.pendingReview > 0 && <span className="status-indicator active" />}
                            </div>
                            <strong className="metric-num font-mono">{clientStats.pendingReview}</strong>
                            <div className="metric-footer">
                                <span>Action required by you</span>
                                <Link to="/quotations">Review →</Link>
                            </div>
                        </div>

                        <div className="bento-metric-card">
                            <div className="metric-header">
                                <span className="metric-label">My Proposals & Quotes</span>
                            </div>
                            <strong className="metric-num font-mono">{clientStats.myProposals}</strong>
                            <div className="metric-footer">
                                <span>Total submitted requests</span>
                                <Link to="/quotations">Proposals →</Link>
                            </div>
                        </div>

                        <div className="bento-metric-card">
                            <div className="metric-header">
                                <span className="metric-label">My Projects</span>
                            </div>
                            <strong className="metric-num font-mono">{clientStats.myProjects}</strong>
                            <div className="metric-footer">
                                <span>Assigned construction sites</span>
                                <Link to="/projects">Projects →</Link>
                            </div>
                        </div>
                    </div>

                    <div className="modules-quick-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                        <Link to="/quotations" className="module-shortcut-card">
                            <div className="shortcut-icon purple">📑</div>
                            <div className="shortcut-text">
                                <h4>My Proposals & Estimations</h4>
                                <p>Submit new requests, review line items, and accept or reject proposals.</p>
                            </div>
                        </Link>

                        <Link to="/projects" className="module-shortcut-card">
                            <div className="shortcut-icon blue">🗺️</div>
                            <div className="shortcut-text">
                                <h4>My Projects & Site Maps</h4>
                                <p>Track project timelines, deadlines, and view construction locations on Google Maps.</p>
                            </div>
                        </Link>
                    </div>

                    <div className="dashboard-activity-container">
                        <div className="activity-card-header">
                            <h3>My Proposal & Estimation Updates</h3>
                            <span className="activity-count">Personal stream</span>
                        </div>

                        <div className="activity-stream">
                            {clientProposals.length === 0 ? (
                                <div className="activity-empty">No proposals or quotations logged yet. Submit a proposal request to get started!</div>
                            ) : (
                                clientProposals.map((item) => (
                                    <div key={item._id} className="stream-item">
                                        <span className={`stream-dot ${item.status === "Approved" ? "green" : item.status === "Submitted" ? "amber" : "blue"}`} />
                                        <div className="stream-content">
                                            <p>Quotation <strong>{item.quotationNumber}</strong> — {item.title}</p>
                                            <small>
                                                Status: <strong>{item.status}</strong> · Amount: {item.total?.toFixed(2)} {item.currency} · Valid until: {new Date(item.validUntil).toLocaleDateString()}
                                            </small>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            ) : isOperations ? (
                /* 3. Operations Officer Role Dashboard */
                <>
                    <div className="stats-bento-grid">
                        <div className="bento-metric-card">
                            <div className="metric-header">
                                <span className="metric-label">Active Field Sites</span>
                                <span className="status-indicator active" />
                            </div>
                            <strong className="metric-num font-mono">{stats.activeProjects}</strong>
                            <div className="metric-footer">
                                <span>Construction site locations</span>
                                <Link to="/projects">Field Maps →</Link>
                            </div>
                        </div>

                        <div className="bento-metric-card">
                            <div className="metric-header">
                                <span className="metric-label">Total Projects</span>
                            </div>
                            <strong className="metric-num font-mono">{stats.totalProjects}</strong>
                            <div className="metric-footer">
                                <span>Lifetime project directory</span>
                                <Link to="/projects">Projects →</Link>
                            </div>
                        </div>

                        <div className="bento-metric-card">
                            <div className="metric-header">
                                <span className="metric-label">Vetted Suppliers</span>
                            </div>
                            <strong className="metric-num font-mono">{stats.totalSuppliers}</strong>
                            <div className="metric-footer">
                                <span>Material vendor directory</span>
                                <Link to="/suppliers">Suppliers →</Link>
                            </div>
                        </div>
                    </div>

                    <div className="modules-quick-grid">
                        <Link to="/projects" className="module-shortcut-card">
                            <div className="shortcut-icon blue">🗺️</div>
                            <div className="shortcut-text">
                                <h4>Field Site Locations Map</h4>
                                <p>Spatial tracking for assigned construction sites and Google Maps navigation.</p>
                            </div>
                        </Link>

                        <Link to="/shipments" className="module-shortcut-card">
                            <div className="shortcut-icon rose">🚢</div>
                            <div className="shortcut-text">
                                <h4>Shipment Dispatches</h4>
                                <p>Track incoming material dispatches, carrier details, and delay alerts.</p>
                            </div>
                        </Link>

                        <Link to="/suppliers" className="module-shortcut-card">
                            <div className="shortcut-icon amber">🚢</div>
                            <div className="shortcut-text">
                                <h4>Supplier Directory</h4>
                                <p>Browse global material vendors and contact details.</p>
                            </div>
                        </Link>
                    </div>

                    <div className="dashboard-activity-container">
                        <div className="activity-card-header">
                            <h3>Operations Event Stream</h3>
                            <span className="activity-count">Field stream</span>
                        </div>

                        <div className="activity-stream">
                            {activities.projects?.map((project) => (
                                <div key={project._id} className="stream-item">
                                    <span className="stream-dot blue" />
                                    <div className="stream-content">
                                        <p>Project Site Active: <strong>{project.projectName}</strong></p>
                                        <small>Location: {project.projectLocation || "Dhaka Site"}</small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : isAccounts ? (
                /* 4. Accounts Officer Role Dashboard */
                <>
                    <div className="stats-bento-grid">
                        <div className="bento-metric-card">
                            <div className="metric-header">
                                <span className="metric-label">Active Projects</span>
                                <span className="status-indicator active" />
                            </div>
                            <strong className="metric-num font-mono">{stats.activeProjects}</strong>
                            <div className="metric-footer">
                                <span>Projects with active budget</span>
                                <Link to="/projects">View →</Link>
                            </div>
                        </div>

                        <div className="bento-metric-card">
                            <div className="metric-header">
                                <span className="metric-label">Total Projects</span>
                            </div>
                            <strong className="metric-num font-mono">{stats.totalProjects}</strong>
                            <div className="metric-footer">
                                <span>Project budget records</span>
                                <Link to="/projects">Budgets →</Link>
                            </div>
                        </div>

                        <div className="bento-metric-card">
                            <div className="metric-header">
                                <span className="metric-label">Clients Directory</span>
                            </div>
                            <strong className="metric-num font-mono">{stats.totalClients}</strong>
                            <div className="metric-footer">
                                <span>Client billing accounts</span>
                                <Link to="/clients">Clients →</Link>
                            </div>
                        </div>
                    </div>

                    <div className="modules-quick-grid">
                        <Link to="/quotations" className="module-shortcut-card">
                            <div className="shortcut-icon purple">📑</div>
                            <div className="shortcut-text">
                                <h4>Tenders & Financial Estimations</h4>
                                <p>Set line-item pricing, tax rates (%), and currencies for client proposals.</p>
                            </div>
                        </Link>

                        <Link to="/purchase-orders" className="module-shortcut-card">
                            <div className="shortcut-icon amber">📦</div>
                            <div className="shortcut-text">
                                <h4>Purchase Order Costing</h4>
                                <p>Review purchase order totals, supplier terms, and approval status.</p>
                            </div>
                        </Link>

                        <Link to="/shipments" className="module-shortcut-card">
                            <div className="shortcut-icon rose">🚢</div>
                            <div className="shortcut-text">
                                <h4>Shipment Costing & Customs</h4>
                                <p>Monitor LC references, shipping charges, and customs clearance.</p>
                            </div>
                        </Link>
                    </div>

                    <div className="dashboard-activity-container">
                        <div className="activity-card-header">
                            <h3>Financial Events Stream</h3>
                            <span className="activity-count">Finance stream</span>
                        </div>

                        <div className="activity-stream">
                            {activities.clients?.map((client) => (
                                <div key={client._id} className="stream-item">
                                    <span className="stream-dot green" />
                                    <div className="stream-content">
                                        <p>Client Account Verified: <strong>{client.companyName || client.name}</strong></p>
                                        <small>Billing email: {client.email}</small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                /* 5. Manager & Administrator Role Dashboard */
                <>
                    <div className="stats-bento-grid">
                        <div className="bento-metric-card">
                            <div className="metric-header">
                                <span className="metric-label">Active Projects</span>
                                <span className="status-indicator active" />
                            </div>
                            <strong className="metric-num font-mono">{stats.activeProjects}</strong>
                            <div className="metric-footer">
                                <span>Construction & field sites</span>
                                <Link to="/projects">View →</Link>
                            </div>
                        </div>

                        <div className="bento-metric-card">
                            <div className="metric-header">
                                <span className="metric-label">Total Projects</span>
                            </div>
                            <strong className="metric-num font-mono">{stats.totalProjects}</strong>
                            <div className="metric-footer">
                                <span>Lifetime project records</span>
                                <Link to="/projects">Directory →</Link>
                            </div>
                        </div>

                        <div className="bento-metric-card">
                            <div className="metric-header">
                                <span className="metric-label">Registered Clients</span>
                            </div>
                            <strong className="metric-num font-mono">{stats.totalClients}</strong>
                            <div className="metric-footer">
                                <span>Verified client accounts</span>
                                <Link to="/clients">Clients →</Link>
                            </div>
                        </div>

                        <div className="bento-metric-card">
                            <div className="metric-header">
                                <span className="metric-label">Vetted Suppliers</span>
                            </div>
                            <strong className="metric-num font-mono">{stats.totalSuppliers}</strong>
                            <div className="metric-footer">
                                <span>Global vendor network</span>
                                <Link to="/suppliers">Suppliers →</Link>
                            </div>
                        </div>
                    </div>

                    <div className="modules-quick-grid">
                        <Link to="/projects" className="module-shortcut-card">
                            <div className="shortcut-icon blue">🗺️</div>
                            <div className="shortcut-text">
                                <h4>Google Maps Operations</h4>
                                <p>Spatial mapping for project sites, suppliers & clients.</p>
                            </div>
                        </Link>

                        <Link to="/quotations" className="module-shortcut-card">
                            <div className="shortcut-icon purple">📑</div>
                            <div className="shortcut-text">
                                <h4>Tenders & Quotations</h4>
                                <p>Line-item estimation, tax rules & version revisions.</p>
                            </div>
                        </Link>

                        <Link to="/purchase-orders" className="module-shortcut-card">
                            <div className="shortcut-icon amber">📦</div>
                            <div className="shortcut-text">
                                <h4>Purchase Orders</h4>
                                <p>Managerial approvals and receiving controls.</p>
                            </div>
                        </Link>

                        <Link to="/shipments" className="module-shortcut-card">
                            <div className="shortcut-icon rose">🚢</div>
                            <div className="shortcut-text">
                                <h4>Shipment Tracking</h4>
                                <p>Customs clearance, LC logs & delay alerts.</p>
                            </div>
                        </Link>
                    </div>

                    <div className="dashboard-activity-container">
                        <div className="activity-card-header">
                            <h3>Recent System Events</h3>
                            <span className="activity-count">Live stream</span>
                        </div>

                        <div className="activity-stream">
                            {(!activities.projects?.length && !activities.clients?.length && !activities.suppliers?.length) ? (
                                <div className="activity-empty">No recent activity logged.</div>
                            ) : (
                                <>
                                    {(activities.projects || []).map((project) => (
                                        <div key={project._id} className="stream-item">
                                            <span className="stream-dot blue" />
                                            <div className="stream-content">
                                                <p>Project initialized: <strong>{project.projectName || "Project"}</strong></p>
                                                <small>{project.clientName || "Contractor Project"}</small>
                                            </div>
                                        </div>
                                    ))}

                                    {(activities.clients || []).map((client) => (
                                        <div key={client._id} className="stream-item">
                                            <span className="stream-dot green" />
                                            <div className="stream-content">
                                                <p>Client registered: <strong>{client.companyName || client.name || "Client"}</strong></p>
                                                <small>{client.contactPerson || client.email || "Contact"}</small>
                                            </div>
                                        </div>
                                    ))}

                                    {(activities.suppliers || []).map((supplier) => (
                                        <div key={supplier._id} className="stream-item">
                                            <span className="stream-dot amber" />
                                            <div className="stream-content">
                                                <p>Supplier onboarded: <strong>{supplier.supplierName || supplier.name || "Supplier"}</strong></p>
                                                <small>{supplier.country || "Verified Vendor"}</small>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}

        </div>
    );
}