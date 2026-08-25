import React, { useState, useEffect } from "react";
import API from "../../../api/axiosConfig";
import { useAuth } from "../../auth/authStore";

export default function ProjectCostEstimator() {
    const { user } = useAuth();
    const canEstimate = user?.role === "manager" || user?.role === "admin";

    const [form, setForm] = useState({
        estimateName: "Residence Building Construction Estimate",
        projectType: "Residential Building",
        region: "Dhaka",
        approximateAreaSqFt: 1500,
        numberOfFloors: 3,
        materialQuality: "Standard",
        labourCategory: "Standard",
        selectedProposalId: "",
        selectedClientId: ""
    });

    const [clientProposals, setClientProposals] = useState([]);
    const [clients, setClients] = useState([]);
    const [estimation, setEstimation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submittingOffer, setSubmittingOffer] = useState(false);

    useEffect(() => {
        if (canEstimate) {
            fetchClientProposals();
            fetchClients();
        }
    }, [canEstimate]);

    const fetchClientProposals = async () => {
        try {
            const res = await API.get("/quotations");
            const proposals = (res.data || []).filter(q => q.adminVerificationStatus === "Pending Admin Approval" || q.status === "Submitted" || q.status === "Draft");
            setClientProposals(proposals);
        } catch (err) {
            console.error("Failed to fetch client proposals", err);
        }
    };

    const fetchClients = async () => {
        try {
            const res = await API.get("/clients");
            const list = Array.isArray(res.data) ? res.data : res.data.clients || [];
            setClients(list);
            if (list.length > 0) {
                setForm(prev => ({ ...prev, selectedClientId: prev.selectedClientId || list[0]._id }));
            }
        } catch (err) {
            console.error("Failed to fetch clients", err);
        }
    };

    const handleSelectProposal = (proposalId) => {
        if (!proposalId) return;
        const prop = clientProposals.find(p => p._id === proposalId);
        if (!prop) return;

        const clientId = prop.client?._id || prop.client || "";

        // Auto-fill all estimation form fields from notified Client Proposal!
        setForm(prev => ({
            ...prev,
            estimateName: prop.title || "Client Building Proposal",
            projectType: prop.projectType || prev.projectType,
            region: prop.constructionSiteLocation?.includes("Chittagong") ? "Chittagong" : prop.constructionSiteLocation?.includes("Sylhet") ? "Sylhet" : prop.constructionSiteLocation?.includes("Khulna") ? "Khulna" : prop.constructionSiteLocation?.includes("Rajshahi") ? "Rajshahi" : "Dhaka",
            approximateAreaSqFt: prop.approximateAreaSqFt || prop.items?.[0]?.quantity || 1500,
            numberOfFloors: prop.numberOfFloors || prop.version || 1,
            materialQuality: prop.materialQuality || "Standard",
            labourCategory: prop.labourCategory || "Standard",
            selectedProposalId: prop._id,
            selectedClientId: clientId || prev.selectedClientId
        }));
    };

    const handleCalculate = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const res = await API.post("/boq-estimator/calculate", form);
            setEstimation(res.data);
        } catch (err) {
            alert(err.response?.data?.message || "Estimation failed");
        } finally {
            setLoading(false);
        }
    };

    const handlePlace3TierOfferBid = async () => {
        if (!estimation) return;

        if (!form.selectedClientId) {
            alert("Please select a target Client for this offer bid.");
            return;
        }

        setSubmittingOffer(true);
        try {
            const formatItems = (opt) => [
                { description: "Cement (Bag)", quantity: opt.materialBreakdown.cement.quantity, unitPrice: opt.materialBreakdown.cement.unitPriceBDT },
                { description: "Steel Rod 72.5G/60G (Ton)", quantity: opt.materialBreakdown.rod.quantity, unitPrice: opt.materialBreakdown.rod.unitPriceBDT },
                { description: "Mirpur Bricks (1k pcs)", quantity: Math.round(opt.materialBreakdown.bricks.quantity / 1000), unitPrice: opt.materialBreakdown.bricks.unitPriceBDT },
                { description: "Sylhet Coarse Sand (CFT)", quantity: opt.materialBreakdown.sand.quantity, unitPrice: opt.materialBreakdown.sand.unitPriceBDT },
                { description: "Site Labour & Equipment (Man-Days)", quantity: opt.labourBreakdown.manDays, unitPrice: opt.labourBreakdown.ratePerDayBDT }
            ];

            const tierOptionsPayload = {
                low: {
                    tierName: "Low Budget Tier",
                    totalCostBDT: estimation.options.low.totalCostBDT,
                    estimatedCostPerSqFt: estimation.options.low.estimatedCostPerSqFt,
                    qualityGrade: estimation.options.low.qualityGrade,
                    items: formatItems(estimation.options.low)
                },
                standard: {
                    tierName: "Standard Budget Tier (Recommended)",
                    totalCostBDT: estimation.options.standard.totalCostBDT,
                    estimatedCostPerSqFt: estimation.options.standard.estimatedCostPerSqFt,
                    qualityGrade: estimation.options.standard.qualityGrade,
                    items: formatItems(estimation.options.standard)
                },
                premium: {
                    tierName: "Premium Budget Tier",
                    totalCostBDT: estimation.options.premium.totalCostBDT,
                    estimatedCostPerSqFt: estimation.options.premium.estimatedCostPerSqFt,
                    qualityGrade: estimation.options.premium.qualityGrade,
                    items: formatItems(estimation.options.premium)
                }
            };

            const payload = {
                title: form.estimateName,
                client: form.selectedClientId,
                constructionSiteLocation: `${form.region}, Bangladesh`,
                approximateAreaSqFt: form.approximateAreaSqFt,
                numberOfFloors: form.numberOfFloors,
                projectType: form.projectType,
                tierOptions: tierOptionsPayload,
                total: estimation.options.standard.totalCostBDT,
                items: tierOptionsPayload.standard.items,
                notes: `Manager AI 3-Tier Proposal Offer generated (${estimation.aiContext.bnbcCodeCompliance}, Region: ${form.region}).`
            };

            if (form.selectedProposalId) {
                await API.put(`/quotations/${form.selectedProposalId}`, payload);
            } else {
                await API.post("/quotations", payload);
            }

            alert(`Official 3-Price Tier Proposal Offer generated successfully! Sent to Administrator for verification before client presentation.`);
            fetchClientProposals();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to place offer bid");
        } finally {
            setSubmittingOffer(false);
        }
    };

    if (!canEstimate) {
        return (
            <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
                <h2>Client Project Proposals & Estimates</h2>
                <p style={{ color: "#64748b" }}>
                    Clients submit project proposal requests under <strong>My Proposals & Requests</strong>. Managers evaluate resource insights and generate custom AI BOQ estimates for client proposals.
                </p>
            </div>
        );
    }

    return (
        <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                    AI-Powered BOQ & Project Cost Estimator (Manager Panel)
                </h1>
                <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>
                    Select client proposal requests to auto-fill project parameters, execute AI Bangladesh cost estimates, and place official offer bids.
                </p>
            </div>

            {/* NOTIFIED CLIENT PROPOSALS AUTO-FILL BAR */}
            {clientProposals.length > 0 && (
                <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", padding: "16px 20px", borderRadius: "12px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "22px" }}>🔔</span>
                        <div>
                            <strong style={{ color: "#0369a1", fontSize: "15px" }}>
                                {clientProposals.length} Incoming Client Proposal Request(s) Notified
                            </strong>
                            <div style={{ fontSize: "12px", color: "#0c4a6e" }}>
                                Select a proposal from the dropdown below to auto-fill all estimation fields:
                            </div>
                        </div>
                    </div>

                    <select
                        value={form.selectedProposalId}
                        onChange={(e) => handleSelectProposal(e.target.value)}
                        style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #0284c7", fontWeight: "700", color: "#0369a1", minWidth: "300px" }}
                    >
                        <option value="">-- Select Client Proposal to Auto-Fill --</option>
                        {clientProposals.map(p => (
                            <option key={p._id} value={p._id}>
                                {p.quotationNumber} - {p.title} ({p.client?.companyName || p.client?.name || "Client"})
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Input Form Card */}
            <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #cbd5e1", marginBottom: "28px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                <form onSubmit={handleCalculate} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", alignItems: "end" }}>
                    {/* CLIENT SELECTION DROPDOWN */}
                    <div>
                        <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Target Client Account *</label>
                        <select
                            required
                            value={form.selectedClientId}
                            onChange={(e) => setForm({ ...form, selectedClientId: e.target.value })}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "700" }}
                        >
                            <option value="">-- Select Target Client --</option>
                            {clients.map(c => (
                                <option key={c._id} value={c._id}>
                                    {c.companyName || c.company || c.contactPerson || c.name || c.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Project Title:</label>
                        <input
                            type="text"
                            required
                            value={form.estimateName}
                            onChange={(e) => setForm({ ...form, estimateName: e.target.value })}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "700" }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Project Type:</label>
                        <select
                            value={form.projectType}
                            onChange={(e) => setForm({ ...form, projectType: e.target.value })}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "700" }}
                        >
                            <option value="Residential Building">Residential Building</option>
                            <option value="Commercial Complex">Commercial Complex</option>
                            <option value="Industrial Warehouse">Industrial Warehouse</option>
                            <option value="Renovation & Extension">Renovation & Extension</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Bangladesh Region / Division:</label>
                        <select
                            value={form.region}
                            onChange={(e) => setForm({ ...form, region: e.target.value })}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "700" }}
                        >
                            <option value="Dhaka">Dhaka (Central / Capital Zone)</option>
                            <option value="Chittagong">Chittagong (Coastal / Salinity Zone)</option>
                            <option value="Sylhet">Sylhet (Seismic Zone 3 / Sand Hub)</option>
                            <option value="Khulna">Khulna (Southwestern / Coastal)</option>
                            <option value="Rajshahi">Rajshahi (Northern Zone)</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Area per Floor (Sq Ft):</label>
                        <input
                            type="number"
                            required
                            min="100"
                            value={form.approximateAreaSqFt}
                            onChange={(e) => setForm({ ...form, approximateAreaSqFt: Number(e.target.value) })}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "700" }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Number of Floors:</label>
                        <input
                            type="number"
                            required
                            min="1"
                            max="30"
                            value={form.numberOfFloors}
                            onChange={(e) => setForm({ ...form, numberOfFloors: Number(e.target.value) })}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "700" }}
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            style={{ width: "100%", padding: "10px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer", fontSize: "14px" }}
                        >
                            {loading ? "AI Computing..." : "🤖 Run AI BOQ Estimator"}
                        </button>
                    </div>
                </form>
            </div>

            {/* AI BANGLADESH CONTEXT & 3 BUDGET OPTIONS */}
            {estimation && (
                <div>
                    {/* AI BANGLADESH STRUCTURAL CONTEXT CARD */}
                    <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", padding: "20px", borderRadius: "12px", marginBottom: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "22px" }}>🤖</span>
                                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#0369a1" }}>
                                    AI Bangladesh Structural & Market Context Analysis
                                </h3>
                            </div>
                            <span style={{ padding: "4px 10px", background: "#0284c7", color: "#fff", borderRadius: "999px", fontSize: "11px", fontWeight: "800" }}>
                                {estimation.aiContext.bnbcCodeCompliance}
                            </span>
                        </div>

                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#0c4a6e" }}>
                            {estimation.aiContext.aiNotes.map((note, idx) => (
                                <li key={idx} style={{ lineHeight: "1.5" }}>{note}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Summary Header & Primary Action Button */}
                    <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", padding: "18px 24px", borderRadius: "12px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
                        <div>
                            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                                3-Tier Price Options Generated for Client Proposal
                            </h2>
                            <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                                Total Built-up Area: <strong>{estimation.totalBuiltupAreaSqFt.toLocaleString()} Sq Ft</strong> ({form.approximateAreaSqFt} sqft x {form.numberOfFloors} floors in {form.region})
                            </p>
                        </div>

                        <button
                            onClick={handlePlace3TierOfferBid}
                            disabled={submittingOffer}
                            style={{
                                padding: "12px 24px",
                                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "10px",
                                fontWeight: "800",
                                fontSize: "14px",
                                cursor: "pointer",
                                boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}
                        >
                            🚀 {submittingOffer ? "Submitting Offer..." : "Submit Proposal Offer (3 Price Options) to Admin"}
                        </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
                        {/* 1. LOW BUDGET TIER */}
                        <div style={{ background: "#fff", borderRadius: "12px", border: "2px solid #cbd5e1", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div>
                                <span style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>PLAN 1</span>
                                <h3 style={{ margin: "4px 0 0 0", fontSize: "22px", color: "#1e293b" }}>Low Budget Plan</h3>
                                <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>{estimation.options.low.qualityGrade}</div>

                                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", marginBottom: "16px", textAlign: "center" }}>
                                    <div style={{ fontSize: "12px", color: "#64748b" }}>ESTIMATED TOTAL COST</div>
                                    <div style={{ fontSize: "26px", fontWeight: "800", color: "#1e293b" }}>BDT {estimation.options.low.totalCostBDT.toLocaleString()}</div>
                                    <div style={{ fontSize: "12px", color: "#2563eb", fontWeight: "700" }}>~ BDT {estimation.options.low.estimatedCostPerSqFt} / Sq Ft</div>
                                </div>

                                {estimation.options.low.specs && (
                                    <div style={{ background: "#f1f5f9", padding: "12px", borderRadius: "8px", marginBottom: "14px", fontSize: "12px", color: "#334155" }}>
                                        <div><strong>Concrete:</strong> {estimation.options.low.specs.concreteMix}</div>
                                        <div><strong>Steel:</strong> {estimation.options.low.specs.rebarGrade}</div>
                                        <div><strong>Finishing:</strong> {estimation.options.low.specs.finishingAllowance}</div>
                                    </div>
                                )}

                                <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#334155" }}>Material & Labour Breakdown</h4>
                                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px 0", fontSize: "13px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <li>• Cement: <strong>{estimation.options.low.materialBreakdown.cement.quantity} Bags</strong> @ BDT {estimation.options.low.materialBreakdown.cement.unitPriceBDT} (BDT {estimation.options.low.materialBreakdown.cement.totalBDT.toLocaleString()})</li>
                                    <li>• Steel Rod: <strong>{estimation.options.low.materialBreakdown.rod.quantity} Tons</strong> @ BDT {estimation.options.low.materialBreakdown.rod.unitPriceBDT?.toLocaleString()} (BDT {estimation.options.low.materialBreakdown.rod.totalBDT.toLocaleString()})</li>
                                    <li>• Bricks: <strong>{estimation.options.low.materialBreakdown.bricks.quantity.toLocaleString()} Pcs</strong> (BDT {estimation.options.low.materialBreakdown.bricks.totalBDT.toLocaleString()})</li>
                                    <li>• Sand/Agg: <strong>{estimation.options.low.materialBreakdown.sand.quantity.toLocaleString()} CFT</strong> (BDT {estimation.options.low.materialBreakdown.sand.totalBDT.toLocaleString()})</li>
                                    <li>• Labour: <strong>{estimation.options.low.labourBreakdown.manDays} Man-Days</strong> (BDT {estimation.options.low.labourBreakdown.subtotalLabourBDT.toLocaleString()})</li>
                                    <li>• Finishing & Overheads: <strong>BDT {estimation.options.low.finishingAndOverheadsBDT?.toLocaleString()}</strong></li>
                                </ul>
                            </div>
                        </div>

                        {/* 2. STANDARD BUDGET TIER (RECOMMENDED) */}
                        <div style={{ background: "#fff", borderRadius: "12px", border: "2px solid #2563eb", padding: "20px", boxShadow: "0 4px 12px rgba(37,99,235,0.12)", position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div style={{ position: "absolute", top: "-12px", right: "20px", background: "#2563eb", color: "#fff", fontSize: "11px", fontWeight: "800", padding: "2px 10px", borderRadius: "999px" }}>RECOMMENDED</div>
                            <div>
                                <span style={{ fontSize: "12px", fontWeight: "800", color: "#2563eb", textTransform: "uppercase" }}>PLAN 2</span>
                                <h3 style={{ margin: "4px 0 0 0", fontSize: "22px", color: "#1e293b" }}>Standard Budget Plan</h3>
                                <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>{estimation.options.standard.qualityGrade}</div>

                                <div style={{ background: "#eff6ff", padding: "16px", borderRadius: "8px", marginBottom: "16px", textAlign: "center" }}>
                                    <div style={{ fontSize: "12px", color: "#1e40af" }}>ESTIMATED TOTAL COST</div>
                                    <div style={{ fontSize: "26px", fontWeight: "800", color: "#1d4ed8" }}>BDT {estimation.options.standard.totalCostBDT.toLocaleString()}</div>
                                    <div style={{ fontSize: "12px", color: "#1e40af", fontWeight: "700" }}>~ BDT {estimation.options.standard.estimatedCostPerSqFt} / Sq Ft</div>
                                </div>

                                {estimation.options.standard.specs && (
                                    <div style={{ background: "#dbeafe", padding: "12px", borderRadius: "8px", marginBottom: "14px", fontSize: "12px", color: "#1e3a8a" }}>
                                        <div><strong>Concrete:</strong> {estimation.options.standard.specs.concreteMix}</div>
                                        <div><strong>Steel:</strong> {estimation.options.standard.specs.rebarGrade}</div>
                                        <div><strong>Finishing:</strong> {estimation.options.standard.specs.finishingAllowance}</div>
                                    </div>
                                )}

                                <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#334155" }}>Material & Labour Breakdown</h4>
                                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px 0", fontSize: "13px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <li>• Cement: <strong>{estimation.options.standard.materialBreakdown.cement.quantity} Bags</strong> @ BDT {estimation.options.standard.materialBreakdown.cement.unitPriceBDT} (BDT {estimation.options.standard.materialBreakdown.cement.totalBDT.toLocaleString()})</li>
                                    <li>• Steel Rod: <strong>{estimation.options.standard.materialBreakdown.rod.quantity} Tons</strong> @ BDT {estimation.options.standard.materialBreakdown.rod.unitPriceBDT?.toLocaleString()} (BDT {estimation.options.standard.materialBreakdown.rod.totalBDT.toLocaleString()})</li>
                                    <li>• Bricks: <strong>{estimation.options.standard.materialBreakdown.bricks.quantity.toLocaleString()} Pcs</strong> (BDT {estimation.options.standard.materialBreakdown.bricks.totalBDT.toLocaleString()})</li>
                                    <li>• Sand/Agg: <strong>{estimation.options.standard.materialBreakdown.sand.quantity.toLocaleString()} CFT</strong> (BDT {estimation.options.standard.materialBreakdown.sand.totalBDT.toLocaleString()})</li>
                                    <li>• Labour: <strong>{estimation.options.standard.labourBreakdown.manDays} Man-Days</strong> (BDT {estimation.options.standard.labourBreakdown.subtotalLabourBDT.toLocaleString()})</li>
                                    <li>• Finishing & Overheads: <strong>BDT {estimation.options.standard.finishingAndOverheadsBDT?.toLocaleString()}</strong></li>
                                </ul>
                            </div>
                        </div>

                        {/* 3. PREMIUM BUDGET TIER */}
                        <div style={{ background: "#fff", borderRadius: "12px", border: "2px solid #a855f7", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div>
                                <span style={{ fontSize: "12px", fontWeight: "800", color: "#a855f7", textTransform: "uppercase" }}>PLAN 3</span>
                                <h3 style={{ margin: "4px 0 0 0", fontSize: "22px", color: "#1e293b" }}>Premium Budget Plan</h3>
                                <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>{estimation.options.premium.qualityGrade}</div>

                                <div style={{ background: "#faf5ff", padding: "16px", borderRadius: "8px", marginBottom: "16px", textAlign: "center" }}>
                                    <div style={{ fontSize: "12px", color: "#7e22ce" }}>ESTIMATED TOTAL COST</div>
                                    <div style={{ fontSize: "26px", fontWeight: "800", color: "#7e22ce" }}>BDT {estimation.options.premium.totalCostBDT.toLocaleString()}</div>
                                    <div style={{ fontSize: "12px", color: "#7e22ce", fontWeight: "700" }}>~ BDT {estimation.options.premium.estimatedCostPerSqFt} / Sq Ft</div>
                                </div>

                                {estimation.options.premium.specs && (
                                    <div style={{ background: "#f3e8ff", padding: "12px", borderRadius: "8px", marginBottom: "14px", fontSize: "12px", color: "#581c87" }}>
                                        <div><strong>Concrete:</strong> {estimation.options.premium.specs.concreteMix}</div>
                                        <div><strong>Steel:</strong> {estimation.options.premium.specs.rebarGrade}</div>
                                        <div><strong>Finishing:</strong> {estimation.options.premium.specs.finishingAllowance}</div>
                                    </div>
                                )}

                                <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#334155" }}>Material & Labour Breakdown</h4>
                                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px 0", fontSize: "13px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <li>• Cement: <strong>{estimation.options.premium.materialBreakdown.cement.quantity} Bags</strong> @ BDT {estimation.options.premium.materialBreakdown.cement.unitPriceBDT} (BDT {estimation.options.premium.materialBreakdown.cement.totalBDT.toLocaleString()})</li>
                                    <li>• Steel Rod: <strong>{estimation.options.premium.materialBreakdown.rod.quantity} Tons</strong> @ BDT {estimation.options.premium.materialBreakdown.rod.unitPriceBDT?.toLocaleString()} (BDT {estimation.options.premium.materialBreakdown.rod.totalBDT.toLocaleString()})</li>
                                    <li>• Bricks: <strong>{estimation.options.premium.materialBreakdown.bricks.quantity.toLocaleString()} Pcs</strong> (BDT {estimation.options.premium.materialBreakdown.bricks.totalBDT.toLocaleString()})</li>
                                    <li>• Sand/Agg: <strong>{estimation.options.premium.materialBreakdown.sand.quantity.toLocaleString()} CFT</strong> (BDT {estimation.options.premium.materialBreakdown.sand.totalBDT.toLocaleString()})</li>
                                    <li>• Labour: <strong>{estimation.options.premium.labourBreakdown.manDays} Man-Days</strong> (BDT {estimation.options.premium.labourBreakdown.subtotalLabourBDT.toLocaleString()})</li>
                                    <li>• Finishing & Overheads: <strong>BDT {estimation.options.premium.finishingAndOverheadsBDT?.toLocaleString()}</strong></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
