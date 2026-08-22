import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../modules/auth/authStore";
import PublicNavbar from "../layout/PublicNavbar";
import PublicFooter from "../layout/PublicFooter";
import CanvasParticleBackground from "../components/CanvasParticleBackground";
import "./HomePage.css";

export default function HomePage() {
    const { user } = useAuth();

    const scrollToSection = (e, sectionId) => {
        e.preventDefault();
        const element = document.getElementById(sectionId);
        if (element) {
            const offset = 80;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    return (
        <div className="home-root">
            {/* Interactive Canvas Particle Engine Background */}
            <CanvasParticleBackground />

            {/* Public Header Bar */}
            <PublicNavbar />

            {/* Asymmetric Split Hero Section */}
            <main className="hero-container" id="hero">
                <div className="hero-grid">
                    <div className="hero-text-col">
                        <div className="hero-status-pill">
                            <span className="live-dot" />
                            <span>Enterprise Operations Platform · v2.4</span>
                        </div>

                        <h1 className="hero-headline">
                            Contractor Projects, Procurement & Site Operations.
                        </h1>

                        <p className="hero-lead">
                            A unified execution console for project managers, accounts officers, field contractors, suppliers, and clients. Manage master directories, trace construction site locations on Google Maps, enforce approval-gated purchase orders, and monitor international freight.
                        </p>

                        <div className="hero-btn-group">
                            <Link to={user ? "/dashboard" : "/register"} className="btn-primary-glow">
                                {user ? "Launch Console →" : "Access Workspace →"}
                            </Link>
                            <a href="#modules" onClick={(e) => scrollToSection(e, "modules")} className="btn-secondary-clean">
                                Explore Modules ↓
                            </a>
                        </div>

                        <div className="hero-metrics-strip">
                            <div className="metric-strip-item">
                                <strong className="font-mono">100%</strong>
                                <span>Conflict-Free Directory</span>
                            </div>
                            <div className="metric-strip-item">
                                <strong className="font-mono">Multi-Ver</strong>
                                <span>Quotation Lineages</span>
                            </div>
                            <div className="metric-strip-item">
                                <strong className="font-mono">Automated</strong>
                                <span>Delay Warning Alerts</span>
                            </div>
                        </div>
                    </div>

                    {/* Right-aligned Live Operations Console Preview */}
                    <div className="hero-preview-col">
                        <div className="operations-canvas-box">
                            <div className="canvas-header">
                                <div className="canvas-dots">
                                    <span className="c-dot" />
                                    <span className="c-dot" />
                                    <span className="c-dot" />
                                </div>
                                <span className="canvas-badge font-mono">cps-ops-node-01</span>
                            </div>

                            <div className="canvas-body">
                                <div className="feed-card">
                                    <div className="feed-meta">
                                        <span className="feed-tag po">PURCHASE ORDER</span>
                                        <span className="feed-status font-mono approved">APPROVED</span>
                                    </div>
                                    <h4>PO-2026-0042 · High-Tensile Structural Steel</h4>
                                    <div className="feed-details">
                                        <span>Supplier: Heidelberg Logistics</span>
                                        <strong className="font-mono">$142,500.00</strong>
                                    </div>
                                </div>

                                <div className="feed-card">
                                    <div className="feed-meta">
                                        <span className="feed-tag shipment">FREIGHT TRACKING</span>
                                        <span className="feed-status font-mono delayed">DELAY WARNING (2d)</span>
                                    </div>
                                    <h4>SHP-8820 · Heavy Rotary Excavator Gear</h4>
                                    <div className="feed-details">
                                        <span>Route: Hamburg ➔ Chittagong Port</span>
                                        <span className="font-mono">LC: LC-88390-BD</span>
                                    </div>
                                </div>

                                <div className="feed-card">
                                    <div className="feed-meta">
                                        <span className="feed-tag quote">TENDER ESTIMATE</span>
                                        <span className="feed-status font-mono submitted">SUBMITTED (v3)</span>
                                    </div>
                                    <h4>QT-2026-018 · Metro Substation Construction</h4>
                                    <div className="feed-details">
                                        <span>Client: Dhaka Mass Transit Co.</span>
                                        <strong className="font-mono">4,250,000 BDT</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Key Features Overview */}
            <section className="features-preview-section" id="features">
                <div className="bento-header">
                    <span className="bento-eyebrow font-mono">KEY PLATFORM CAPABILITIES</span>
                    <h2>Engineered for High-Consequence Operations</h2>
                    <p>Designed with zero generic templates. Built specifically to eliminate material delays and streamline client estimations.</p>
                </div>

                <div className="features-grid-3col">
                    <div className="feature-glow-card">
                        <div className="feature-icon-wrapper">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <path d="M9 15l2 2 4-4" />
                            </svg>
                        </div>
                        <h3>Client Building Proposals</h3>
                        <p>Clients submit building specifications, site coordinates, and material needs directly. Management estimates cost with matched vendor options.</p>
                    </div>

                    <div className="feature-glow-card">
                        <div className="feature-icon-wrapper">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="1" y="3" width="15" height="13" />
                                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                                <circle cx="5.5" cy="18.5" r="2.5" />
                                <circle cx="18.5" cy="18.5" r="2.5" />
                            </svg>
                        </div>
                        <h3>Vetted Supplier Portal</h3>
                        <p>Global suppliers register, review purchase orders, log dispatches, and provide real-time shipment bill of lading updates.</p>
                    </div>

                    <div className="feature-glow-card">
                        <div className="feature-icon-wrapper">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                                <path d="M16 3.13a4 4 0 010 7.75" />
                            </svg>
                        </div>
                        <h3>3-Role Project Assignment</h3>
                        <p>Admins assign a dedicated Operations Officer, Project Manager, and Accounts Officer to every active project site.</p>
                    </div>
                </div>
            </section>

            {/* Bento Grid Architecture Showcase */}
            <section className="bento-section" id="modules">
                <div className="bento-header">
                    <span className="bento-eyebrow font-mono">ENTERPRISE SYSTEM CAPABILITIES</span>
                    <h2>Structured Enterprise Governance</h2>
                    <p>Every operational flow is constrained by strict corporate policies, preventing invalid entries and unauthorized receiving.</p>
                </div>

                <div className="bento-container">
                    {/* Master Data */}
                    <div className="bento-tile">
                        <div className="tile-icon-frame">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                <circle cx="8.5" cy="7" r="4" />
                                <path d="M20 8v6M23 11h-6" />
                            </svg>
                        </div>
                        <h3>Master Data CRM</h3>
                        <p>Automated duplicate detection on phone numbers and email domains across all clients and suppliers.</p>
                        <Link to="/clients" className="tile-action">Manage Clients →</Link>
                    </div>

                    {/* Google Maps Spatial Tracking */}
                    <div className="bento-tile" id="map-preview">
                        <div className="tile-icon-frame">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                                <line x1="8" y1="2" x2="8" y2="18" />
                                <line x1="16" y1="6" x2="16" y2="22" />
                            </svg>
                        </div>
                        <h3>Google Maps Spatial Tracking</h3>
                        <p>Plot project work zones, client corporate towers, and supplier ports with real-time navigation directions.</p>
                        <Link to="/projects" className="tile-action">Open Map →</Link>
                    </div>

                    {/* Quotation Version Tracking */}
                    <div className="bento-tile">
                        <div className="tile-icon-frame">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                        </div>
                        <h3>Quotation & Estimation Proposals</h3>
                        <p>Immutable approved quotations with version genealogy (v1, v2, v3) preserving historic tender records.</p>
                        <Link to="/quotations" className="tile-action">View Tenders →</Link>
                    </div>

                    {/* Controlled Procurement */}
                    <div className="bento-tile">
                        <div className="tile-icon-frame">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                <line x1="12" y1="22.08" x2="12" y2="12" />
                            </svg>
                        </div>
                        <h3>Controlled Procurement (PO)</h3>
                        <p>Enforce strict receiving gating: items cannot be logged as received prior to managerial approval.</p>
                        <Link to="/purchase-orders" className="tile-action">Purchase Orders →</Link>
                    </div>

                    {/* Freight Tracking */}
                    <div className="bento-tile">
                        <div className="tile-icon-frame">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="1" y="3" width="15" height="13" />
                                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                                <circle cx="5.5" cy="18.5" r="2.5" />
                                <circle cx="18.5" cy="18.5" r="2.5" />
                            </svg>
                        </div>
                        <h3>Import / Export Freight</h3>
                        <p>Live ETA delay alerts, customs clearance workflows, LC reference tracking, and partial receiving logs.</p>
                        <Link to="/shipments" className="tile-action">Track Freight →</Link>
                    </div>

                    {/* Role Access Governance */}
                    <div className="bento-tile">
                        <div className="tile-icon-frame">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </div>
                        <h3>Role-Based Access Governance</h3>
                        <p>Granular access control tailored for Administrators, Project Managers, Accounts Officers, Operations Officers, Suppliers, and Clients.</p>
                        <Link to="/admin/users" className="tile-action">User Access →</Link>
                    </div>
                </div>
            </section>

            {/* Bottom Callout Section */}
            <section className="cta-clean-wrap">
                <div className="cta-clean-box">
                    <div>
                        <h2>Ready to deploy CPS Management?</h2>
                        <p>Sign in to launch your workspace or create a client/supplier account for your organization.</p>
                    </div>
                    <Link to={user ? "/dashboard" : "/register"} className="btn-primary-glow">
                        {user ? "Open Dashboard Workspace →" : "Get Started Now →"}
                    </Link>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
}
