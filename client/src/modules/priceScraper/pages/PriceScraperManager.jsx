import React, { useState, useEffect } from "react";
import API from "../../../api/axiosConfig";
import { useAuth } from "../../auth/authStore";

export default function PriceScraperManager() {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const isSupplier = user?.role === "supplier";
    const isLogistics = user?.role === "operations_officer" || user?.role === "staff";
    const isFinance = user?.role === "accounts_officer";

    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [editPrice, setEditPrice] = useState("");

    // Supplier Quantity Offer State
    const [quantityModalItem, setQuantityModalItem] = useState(null);
    const [supplierQtyInput, setSupplierQtyInput] = useState("");
    const [supplierNotesInput, setSupplierNotesInput] = useState("");

    // Scraping Live Animation State
    const [isScraping, setIsScraping] = useState(false);
    const [scrapeStep, setScrapeStep] = useState(0);
    const [scrapeProgress, setScrapeProgress] = useState(0);

    const scrapeSteps = [
        { label: "Initiating Firecrawl Engine & Market Feeds", desc: "Establishing secure connections to BDStall, Akij Cement & Material Portals...", icon: "🌐" },
        { label: "Crawling & Parsing Material Feeds", desc: "Extracting pricing for Steel Rebars, Cement, Bricks, Sand & Crushed Stone...", icon: "📡" },
        { label: "Statistical Anomaly & Baseline Variance Audit", desc: "Applying BNBC 2020 standard baseline price checks (detecting ±30% outliers)...", icon: "🔬" },
        { label: "Syncing Verified Feeds into Central Inventory", desc: "Generating SKU registries and updating live supplier capacity listings...", icon: "⚡" }
    ];

    useEffect(() => {
        fetchPrices();
    }, [statusFilter, categoryFilter]);

    const fetchPrices = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/price-scraper?status=${statusFilter}&category=${categoryFilter}`);
            setPrices(res.data.prices || []);
        } catch (err) {
            console.error("Error fetching scraped prices:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRunScraper = async () => {
        if (!isAdmin) return;
        setIsScraping(true);
        setScrapeStep(0);
        setScrapeProgress(10);

        // Progress simulation during live scrape
        const timer1 = setTimeout(() => { setScrapeStep(1); setScrapeProgress(35); }, 1500);
        const timer2 = setTimeout(() => { setScrapeStep(2); setScrapeProgress(65); }, 3200);
        const timer3 = setTimeout(() => { setScrapeStep(3); setScrapeProgress(88); }, 5000);

        try {
            const res = await API.post("/price-scraper/trigger");
            setScrapeProgress(100);
            setTimeout(() => {
                setIsScraping(false);
                fetchPrices();
            }, 1000);
        } catch (err) {
            setIsScraping(false);
            alert(err.response?.data?.message || "Scraper completed or encountered warning.");
            fetchPrices();
        } finally {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        }
    };

    const handleReviewAction = async (status) => {
        if (!selectedRecord) return;
        try {
            await API.put(`/price-scraper/${selectedRecord._id}/review`, {
                verificationStatus: status,
                priceBDT: editPrice ? Number(editPrice) : selectedRecord.priceBDT
            });
            setSelectedRecord(null);
            fetchPrices();
            alert(`Record marked as ${status}`);
        } catch (err) {
            alert(err.response?.data?.message || "Update failed");
        }
    };

    const handleSupplierQuantitySubmit = async (e) => {
        e.preventDefault();
        if (!quantityModalItem) return;
        try {
            const res = await API.put(`/price-scraper/${quantityModalItem._id}/supplier-quantity`, {
                availableQuantity: Number(supplierQtyInput),
                supplierNotes: supplierNotesInput
            });
            alert(res.data.message);
            setQuantityModalItem(null);
            fetchPrices();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to submit supplier quantity offer");
        }
    };

    const handleLogisticsVerifyQuantity = async (id, status) => {
        try {
            const res = await API.put(`/price-scraper/${id}/verify-quantity`, { status });
            alert(res.data.message);
            fetchPrices();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to verify quantity");
        }
    };

    const handleDeleteRecord = async (id, itemName) => {
        if (!isAdmin) return;
        if (!window.confirm(`Are you sure you want to delete the duplicate price entry for "${itemName}"?`)) return;

        try {
            const res = await API.delete(`/price-scraper/${id}`);
            alert(res.data.message || "Entry deleted");
            fetchPrices();
        } catch (err) {
            alert(err.response?.data?.message || "Delete failed");
        }
    };

    const flaggedCount = prices.filter(p => p.verificationStatus === "Flagged").length;
    const verifiedDuplicates = prices.filter(p => p.flagReason?.toLowerCase().includes("duplicate"));

    return (
        <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                        Construction Material & Labour Market Engine
                    </h1>
                    <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>
                        Material price index, vendor capacity tracking, logistics verification, and financial valuations.
                    </p>
                </div>

                {isAdmin && (
                    <button
                        onClick={handleRunScraper}
                        style={{
                            padding: "10px 18px",
                            backgroundColor: "#059669",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "800",
                            fontSize: "14px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                        }}
                    >
                        <span>🔄</span> Run Market Price Scraper
                    </button>
                )}
            </div>

            {/* Admin Notification Banner for Verified Duplicates */}
            {isAdmin && verifiedDuplicates.length > 0 && (
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", padding: "16px 20px", borderRadius: "12px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "24px" }}>🔔</span>
                        <div>
                            <strong style={{ color: "#991b1b", fontSize: "15px" }}>
                                Duplicate Records Alert: {verifiedDuplicates.length} Entry(s) Require Cleanup
                            </strong>
                            <div style={{ fontSize: "13px", color: "#7f1d1d", marginTop: "2px" }}>
                                Duplicate scraped price records require admin deletion.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin/Supplier Review Alert Banner */}
            {flaggedCount > 0 && (
                <div style={{ background: "#fffbebe6", border: "1px solid #fde68a", padding: "16px 20px", borderRadius: "12px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "24px" }}>🚩</span>
                        <div>
                            <strong style={{ color: "#b45309", fontSize: "15px" }}>Price Audit Alert: {flaggedCount} Record(s) Exceed Baseline Variance</strong>
                            <div style={{ fontSize: "13px", color: "#92400e" }}>
                                Price spikes or drops exceeding 30% baseline variance require review.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: "700", color: "#1e293b" }}
                >
                    <option value="">All Verification Statuses</option>
                    <option value="Verified">Verified</option>
                    <option value="Flagged">Flagged (Action Needed)</option>
                    <option value="Pending Review">Pending Review</option>
                </select>

                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: "700", color: "#1e293b" }}
                >
                    <option value="">All Categories</option>
                    <option value="Cement">Cement</option>
                    <option value="Rod/Steel">Rod / Steel</option>
                    <option value="Bricks">Bricks</option>
                    <option value="Sand & Aggregate">Sand & Aggregate</option>
                    <option value="Labour">Labour Rates</option>
                </select>
            </div>

            {/* Price & Quantity Table */}
            <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #cbd5e1", overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
                    <thead style={{ background: "#f1f5f9", borderBottom: "2px solid #cbd5e1", color: "#1e293b" }}>
                        <tr>
                            <th style={{ padding: "14px 16px", fontWeight: "800" }}>Material Item</th>
                            <th style={{ padding: "14px 16px", fontWeight: "800" }}>Category & Brand</th>
                            <th style={{ padding: "14px 16px", fontWeight: "800" }}>Price (BDT)</th>
                            <th style={{ padding: "14px 16px", fontWeight: "800" }}>Supplier Supply Quantity</th>
                            <th style={{ padding: "14px 16px", fontWeight: "800" }}>Logistics Verification</th>
                            {isFinance && <th style={{ padding: "14px 16px", fontWeight: "800" }}>Total Financial Valuation</th>}
                            {(isAdmin || isSupplier || isLogistics) && <th style={{ padding: "14px 16px", fontWeight: "800", textAlign: "center" }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {prices.map((p) => {
                            const isDuplicate = p.flagReason?.toLowerCase().includes("duplicate");
                            const totalValuation = (p.availableQuantity || 0) * p.priceBDT;

                            return (
                                <tr key={p._id} style={{ borderBottom: "1px solid #e2e8f0", background: p.verificationStatus === "Flagged" ? "#fffdf5" : isDuplicate ? "#fef2f2" : "inherit" }}>
                                    <td style={{ padding: "14px 16px", fontWeight: "800", color: "#0f172a" }}>
                                        {p.itemName}
                                        <div style={{ fontSize: "11px", color: "#64748b" }}>Source: {p.source}</div>
                                    </td>
                                    <td style={{ padding: "14px 16px", color: "#334155" }}>
                                        <div><strong>{p.category}</strong></div>
                                        <small style={{ color: "#64748b" }}>{p.brand}</small>
                                    </td>
                                    <td style={{ padding: "14px 16px", fontWeight: "800", color: "#0f172a", fontSize: "15px" }}>
                                        BDT {p.priceBDT.toLocaleString()} <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "normal" }}>/ {p.unit}</span>
                                    </td>

                                    {/* Supplier Quantity Column */}
                                    <td style={{ padding: "14px 16px" }}>
                                        {p.availableQuantity > 0 ? (
                                            <div>
                                                <strong style={{ color: "#059669", fontSize: "14px" }}>
                                                    {p.availableQuantity.toLocaleString()} {p.unit}
                                                </strong>
                                                {p.supplierName && <div style={{ fontSize: "11px", color: "#64748b" }}>by {p.supplierName}</div>}
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>—</span>
                                        )}
                                    </td>

                                    {/* Logistics Verification Column */}
                                    <td style={{ padding: "14px 16px" }}>
                                        <span style={{
                                            padding: "3px 8px",
                                            borderRadius: "999px",
                                            fontSize: "11px",
                                            fontWeight: "800",
                                            background: p.quantityVerificationStatus === "Logistics Verified" ? "#dcfce7" : p.quantityVerificationStatus === "Rejected" ? "#fef2f2" : "#fffbeb",
                                            color: p.quantityVerificationStatus === "Logistics Verified" ? "#15803d" : p.quantityVerificationStatus === "Rejected" ? "#be123c" : "#b45309"
                                        }}>
                                            {p.quantityVerificationStatus || "Pending Offer"}
                                        </span>
                                    </td>

                                    {/* Finance Valuation Column */}
                                    {isFinance && (
                                        <td style={{ padding: "14px 16px", fontWeight: "800", color: "#059669", fontSize: "14px" }}>
                                            BDT {totalValuation.toLocaleString()}
                                        </td>
                                    )}

                                    {/* Role Actions */}
                                    {(isAdmin || isSupplier || isLogistics) && (
                                        <td style={{ padding: "14px 16px", textAlign: "center" }}>
                                            <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                                                {/* Supplier Add Quantity */}
                                                {isSupplier && p.verificationStatus === "Verified" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setQuantityModalItem(p);
                                                            setSupplierQtyInput(p.availableQuantity || "");
                                                            setSupplierNotesInput(p.supplierNotes || "");
                                                        }}
                                                        style={{ padding: "5px 10px", background: "#7e22ce", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}
                                                    >
                                                        + Supply Qty
                                                    </button>
                                                )}

                                                {/* Logistics Officer Verify Quantity */}
                                                {isLogistics && p.availableQuantity > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleLogisticsVerifyQuantity(p._id, "Logistics Verified")}
                                                        style={{ padding: "5px 10px", background: "#059669", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}
                                                    >
                                                        ✓ Verify Qty
                                                    </button>
                                                )}

                                                {/* Admin Review / Delete */}
                                                {isAdmin && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setSelectedRecord(p); setEditPrice(p.priceBDT); }}
                                                            style={{ padding: "5px 10px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}
                                                        >
                                                            Review
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteRecord(p._id, p.itemName)}
                                                            style={{ padding: "5px 10px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* SUPPLIER QUANTITY OFFER MODAL */}
            {quantityModalItem && isSupplier && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
                    <div style={{ background: "#ffffff", width: "450px", borderRadius: "12px", padding: "24px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
                        <h2 style={{ marginTop: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Submit Supply Quantity Offer</h2>
                        <p style={{ fontSize: "13px", color: "#475569" }}>Item: <strong style={{ color: "#0f172a" }}>{quantityModalItem.itemName}</strong> ({quantityModalItem.brand})</p>

                        <form onSubmit={handleSupplierQuantitySubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "16px 0" }}>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Available Quantity ({quantityModalItem.unit}) *</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={supplierQtyInput}
                                    onChange={(e) => setSupplierQtyInput(e.target.value)}
                                    placeholder="Enter total units firm can supply..."
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "800", fontSize: "15px", marginTop: "4px" }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Delivery & Supply Notes:</label>
                                <textarea
                                    value={supplierNotesInput}
                                    onChange={(e) => setSupplierNotesInput(e.target.value)}
                                    placeholder="Delivery lead time, location, warehouse stock terms..."
                                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", minHeight: "70px", marginTop: "4px" }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                                <button
                                    type="submit"
                                    style={{ flex: 1, padding: "10px", background: "#7e22ce", color: "#ffffff", border: "none", borderRadius: "6px", fontWeight: "800", fontSize: "13px", cursor: "pointer" }}
                                >
                                    Submit Offer
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setQuantityModalItem(null)}
                                    style={{ padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: "700", color: "#475569" }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* REVIEW MODAL (Admin Only) */}
            {selectedRecord && isAdmin && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
                    <div style={{ background: "#ffffff", width: "450px", borderRadius: "12px", padding: "24px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
                        <h2 style={{ marginTop: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Status Review: Scraped Price</h2>
                        <p style={{ fontSize: "13px", color: "#475569" }}>Item: <strong style={{ color: "#0f172a" }}>{selectedRecord.itemName}</strong> ({selectedRecord.brand})</p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "16px 0" }}>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Verified Price (BDT / {selectedRecord.unit}):</label>
                                <input
                                    type="number"
                                    value={editPrice}
                                    onChange={(e) => setEditPrice(e.target.value)}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "800", fontSize: "15px", color: "#0f172a", marginTop: "4px" }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                                <button
                                    type="button"
                                    onClick={() => handleReviewAction("Verified")}
                                    style={{ flex: 1, padding: "10px", background: "#059669", color: "#ffffff", border: "none", borderRadius: "6px", fontWeight: "800", fontSize: "13px", cursor: "pointer" }}
                                >
                                    Approve as Verified
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleReviewAction("Flagged")}
                                    style={{ flex: 1, padding: "10px", background: "#d97706", color: "#ffffff", border: "none", borderRadius: "6px", fontWeight: "800", fontSize: "13px", cursor: "pointer" }}
                                >
                                    Keep Flagged
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedRecord(null)}
                                    style={{ padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: "700", color: "#475569" }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* LIVE SCRAPING RADAR & PROCESS ANIMATION OVERLAY */}
            {isScraping && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(15, 23, 42, 0.85)",
                    backdropFilter: "blur(8px)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 2000,
                    color: "#fff"
                }}>
                    <div style={{
                        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                        border: "1px solid #334155",
                        borderRadius: "20px",
                        padding: "36px 40px",
                        width: "560px",
                        maxWidth: "92vw",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(16, 185, 129, 0.2)",
                        textAlign: "center",
                        position: "relative",
                        overflow: "hidden"
                    }}>
                        {/* Glowing background aura */}
                        <div style={{
                            position: "absolute",
                            top: "-50px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: "200px",
                            height: "200px",
                            background: "radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(16, 185, 129, 0) 70%)",
                            pointerEvents: "none"
                        }} />

                        {/* Animated Radar Visualizer */}
                        <div style={{ position: "relative", width: "100px", height: "100px", margin: "0 auto 20px auto" }}>
                            <div style={{
                                width: "100px",
                                height: "100px",
                                borderRadius: "50%",
                                border: "2px solid rgba(16, 185, 129, 0.4)",
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 0 20px rgba(16, 185, 129, 0.2)"
                            }}>
                                <div style={{
                                    width: "60px",
                                    height: "60px",
                                    borderRadius: "50%",
                                    border: "1px dashed rgba(16, 185, 129, 0.6)",
                                    animation: "spinSlow 8s linear infinite"
                                }} />
                                <div style={{
                                    width: "16px",
                                    height: "16px",
                                    borderRadius: "50%",
                                    backgroundColor: "#10b981",
                                    boxShadow: "0 0 15px #10b981",
                                    animation: "pulseDot 1.5s ease-in-out infinite"
                                }} />
                                {/* Sweeping Radar Line */}
                                <div style={{
                                    position: "absolute",
                                    top: 0,
                                    left: "50%",
                                    width: "50px",
                                    height: "50px",
                                    transformOrigin: "bottom left",
                                    background: "linear-gradient(45deg, rgba(16, 185, 129, 0.5), transparent)",
                                    animation: "radarSweep 2s linear infinite"
                                }} />
                            </div>
                        </div>

                        <h3 style={{ fontSize: "20px", fontWeight: "800", margin: "0 0 6px 0", color: "#f8fafc", letterSpacing: "-0.5px" }}>
                            Live Market Price Scraper Active
                        </h3>
                        <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 24px 0" }}>
                            Crawling Bangladesh construction material indexes & supplier portals
                        </p>

                        {/* Animated Progress Bar */}
                        <div style={{ marginBottom: "24px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#cbd5e1", marginBottom: "8px", fontWeight: "700" }}>
                                <span>Scanning Progress</span>
                                <span style={{ color: "#34d399" }}>{scrapeProgress}%</span>
                            </div>
                            <div style={{ height: "8px", backgroundColor: "#334155", borderRadius: "999px", overflow: "hidden" }}>
                                <div style={{
                                    height: "100%",
                                    width: `${scrapeProgress}%`,
                                    background: "linear-gradient(90deg, #059669 0%, #10b981 50%, #34d399 100%)",
                                    borderRadius: "999px",
                                    transition: "width 0.6s ease"
                                }} />
                            </div>
                        </div>

                        {/* Step By Step Live Feed Stepper */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", textAlign: "left" }}>
                            {scrapeSteps.map((step, idx) => {
                                const isDone = scrapeStep > idx || scrapeProgress === 100;
                                const isCurrent = scrapeStep === idx && scrapeProgress < 100;

                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            padding: "10px 14px",
                                            borderRadius: "10px",
                                            background: isCurrent ? "rgba(16, 185, 129, 0.12)" : isDone ? "rgba(15, 23, 42, 0.6)" : "rgba(30, 41, 59, 0.3)",
                                            border: isCurrent ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid transparent",
                                            transition: "all 0.3s ease"
                                        }}
                                    >
                                        <span style={{ fontSize: "18px" }}>
                                            {isDone ? "✅" : isCurrent ? step.icon : "⏳"}
                                        </span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: "13px", fontWeight: "700", color: isDone ? "#a7f3d0" : isCurrent ? "#ffffff" : "#64748b" }}>
                                                {step.label}
                                            </div>
                                            <div style={{ fontSize: "11px", color: isCurrent ? "#94a3b8" : "#475569" }}>
                                                {step.desc}
                                            </div>
                                        </div>
                                        {isCurrent && (
                                            <div style={{
                                                width: "10px",
                                                height: "10px",
                                                borderRadius: "50%",
                                                backgroundColor: "#10b981",
                                                boxShadow: "0 0 10px #10b981",
                                                animation: "pulseDot 1s ease-in-out infinite"
                                            }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ marginTop: "20px", fontSize: "11px", color: "#64748b" }}>
                            Powered by Firecrawl API v2 & BNBC Statistical Engine
                        </div>
                    </div>

                    {/* Inline Keyframes */}
                    <style>{`
                        @keyframes radarSweep {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                        @keyframes spinSlow {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                        @keyframes pulseDot {
                            0%, 100% { transform: scale(1); opacity: 0.9; }
                            50% { transform: scale(1.4); opacity: 1; }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
}
