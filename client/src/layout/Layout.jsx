import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import "./Layout.css";

export default function Layout({ children }) {
    return (
        <div className="app-layout">
            <Sidebar />
            <div className="app-main-viewport">
                <Navbar />
                <main className="app-page-content">
                    {children}
                </main>
            </div>
        </div>
    );
}