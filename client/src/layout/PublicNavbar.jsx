import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../modules/auth/authStore";

export default function PublicNavbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const scrollToSection = (e, sectionId) => {
        e.preventDefault();
        setMobileMenuOpen(false);
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
        <header className="public-navbar-header">
            <div className="public-navbar-container">
                {/* Brand Logo & Name */}
                <Link to={user ? "/dashboard" : "/"} className="public-navbar-brand">
                    <div className="brand-icon-box">
                        CPS
                    </div>
                    <div className="brand-text-box">
                        <span className="brand-title">CPS Platform</span>
                        <span className="brand-subtitle">Contractor Ops</span>
                    </div>
                </Link>

                {/* Center Smooth-Scroll Navigation Links */}
                <nav className={`public-nav-links ${mobileMenuOpen ? "mobile-open" : ""}`}>
                    <a href="#hero" onClick={(e) => scrollToSection(e, "hero")}>Overview</a>
                    <a href="#features" onClick={(e) => scrollToSection(e, "features")}>Key Features</a>
                    <a href="#modules" onClick={(e) => scrollToSection(e, "modules")}>Core Modules</a>
                </nav>

                {/* Action Buttons */}
                <div className="public-nav-actions">
                    {user ? (
                        <>
                            <span className="nav-user-badge">
                                <span className="avatar-dot">{user.name?.charAt(0).toUpperCase()}</span>
                                <span className="nav-user-name">{user.name}</span>
                            </span>

                            <button
                                onClick={() => navigate("/dashboard")}
                                className="nav-btn-primary"
                            >
                                Launch Console →
                            </button>

                            <button
                                onClick={logout}
                                className="nav-btn-ghost"
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-btn-link">
                                Sign In
                            </Link>

                            <Link to="/register" className="nav-btn-primary">
                                Get Started →
                            </Link>
                        </>
                    )}

                    {/* Mobile Menu Toggle Button */}
                    <button
                        className="mobile-hamburger-btn"
                        onClick={() => setMobileMenuOpen((prev) => !prev)}
                        aria-label="Toggle navigation menu"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            {mobileMenuOpen ? (
                                <path d="M18 6L6 18M6 6l12 12" />
                            ) : (
                                <path d="M3 12h18M3 6h18M3 18h18" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
}
