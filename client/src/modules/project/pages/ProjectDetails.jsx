import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProjectById, updateProjectProgress, approveProjectByManager, approveProjectByFinance } from "../projectApi";
import { useAuth } from "../../auth/authStore";
import "../project.css";

const STANDARD_STAGES = [
    "Site Mobilization, Survey & Land Clearing",
    "Excavation & Foundation Piling",
    "Ground Floor Footing & Basement Works",
    "Columns, Beams & RCC Slab Casting (25% Milestone)",
    "Superstructure Framing & Shear Walls (50% Milestone)",
    "Brickwork Masonry, Windows & Internal Partitions",
    "Plumbing, Electrical, HVAC & MEP (75% Milestone)",
    "Interior Plastering, Tiling, Flooring & Painting",
    "Facade Installation & External Works",
    "Quality Inspection, Testing & Final Handover (100% Milestone)"
];

const DELAY_REASONS = [
    "Adverse Weather / Heavy Monsoon Flooding",
    "Supplier Material Shipment Delay / Import Clearance",
    "Site Access & Municipal Permit Constraint",
    "Labor Shortage / Subcontractor Non-Availability",
    "Engineering / Architectural Drawing Revision",
    "Utility Connection Grid Hold (Power / Water)",
    "Client Change Order / Scope Alteration"
];

function ProjectDetails() {
    const { id } = useParams();
    const { user } = useAuth();
    const isLogisticsOfficer = user?.role === "operations_officer" || user?.role === "admin";
    const isManager = user?.role === "manager" || user?.role === "admin";
    const isFinanceOfficer = user?.role === "accounts_officer" || user?.role === "admin";

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");

    // Progress update form state
    const [progressForm, setProgressForm] = useState({
        percentage: 0,
        stageName: STANDARD_STAGES[0],
        updateNotes: "",
        isDelayed: false,
        delayReason: DELAY_REASONS[0],
        delayImpactDays: 0
    });

    useEffect(() => {
        loadProject();
    }, [id]);

    const loadProject = async () => {
        setLoading(true);
        try {
            const response = await getProjectById(id);
            const data = response.data;
            setProject(data);
            setProgressForm(prev => ({
                ...prev,
                percentage: data.progressPercentage || 0,
                stageName: data.currentStage || STANDARD_STAGES[0],
                isDelayed: data.hasActiveDelay || false,
                delayReason: data.latestDelayReason || DELAY_REASONS[0]
            }));
        } catch (error) {
            console.error("Failed to load project details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleProgressSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await updateProjectProgress(id, progressForm);
            setProject(res.data.project);
            setShowProgressModal(false);
            setNotificationMessage(res.data.message || "Progress updated successfully!");
            setTimeout(() => setNotificationMessage(""), 8000);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update project progress");
        } finally {
            setSubmitting(false);
        }
    };

    const handleManagerApprove = async () => {
        if (!window.confirm("Are you sure you want to officially approve this project as Manager?")) return;
        setActionLoading(true);
        try {
            const res = await approveProjectByManager(id);
            setProject(res.data.project);
            setNotificationMessage(res.data.message || "Project approved by Manager!");
            setTimeout(() => setNotificationMessage(""), 8000);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to approve project as Manager");
        } finally {
            setActionLoading(false);
        }
    };

    const handleFinanceApprove = async () => {
        if (!window.confirm("Are you sure all dues are cleared and this project is ready for final delivery?")) return;
        setActionLoading(true);
        try {
            const res = await approveProjectByFinance(id);
            setProject(res.data.project);
            setNotificationMessage(res.data.message || "Project dues cleared and marked DELIVERED!");
            setTimeout(() => setNotificationMessage(""), 8000);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to approve finance clearance");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading || !project) {
        return (
            <div style={{ padding: "60px", textAlign: "center" }}>
                <h2>Loading Project Details & Logistics Data...</h2>
            </div>
        );
    }

    const currentPercent = project.progressPercentage || 0;
    const milestones = [
        { pct: 25, label: "25% Substructure", achieved: currentPercent >= 25 },
        { pct: 50, label: "50% Superstructure", achieved: currentPercent >= 50 },
        { pct: 75, label: "75% Finishing & MEP", achieved: currentPercent >= 75 },
        { pct: 100, label: "100% Handover", achieved: currentPercent >= 100 }
    ];

    const canManagerApprove = isManager && currentPercent >= 100 && !project.managerApproved;
    const canFinanceApprove = isFinanceOfficer && project.managerApproved && !project.financeApproved;

    return (
        <div className="project-details-page" style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>
                        Project Tracking & Delivery Workflow
                    </span>
                    <h1 style={{ margin: "4px 0 0 0", fontSize: "28px", color: "#0f172a" }}>{project.projectName}</h1>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    {isLogisticsOfficer && project.status !== "Delivered" && (
                        <button
                            type="button"
                            onClick={() => setShowProgressModal(true)}
                            style={{
                                padding: "10px 18px",
                                background: "#059669",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: "800",
                                fontSize: "14px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                boxShadow: "0 2px 4px rgba(5, 150, 105, 0.2)"
                            }}
                        >
                            ⚡ Update Progress & Log Delay
                        </button>
                    )}

                    {canManagerApprove && (
                        <button
                            type="button"
                            onClick={handleManagerApprove}
                            disabled={actionLoading}
                            style={{
                                padding: "10px 18px",
                                background: "#2563eb",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: "800",
                                fontSize: "14px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)"
                            }}
                        >
                            👨‍💼 Approve Project (Manager Signoff)
                        </button>
                    )}

                    {canFinanceApprove && (
                        <button
                            type="button"
                            onClick={handleFinanceApprove}
                            disabled={actionLoading}
                            style={{
                                padding: "10px 18px",
                                background: "#7c3aed",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: "800",
                                fontSize: "14px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                boxShadow: "0 2px 4px rgba(124, 58, 237, 0.2)"
                            }}
                        >
                            💳 Approve Dues Clearance & Deliver
                        </button>
                    )}

                    <Link to="/projects" style={{ textDecoration: "none", color: "#2563eb", fontWeight: "700", fontSize: "14px" }}>
                        ← Back to Projects
                    </Link>
                </div>
            </div>

            {/* NOTIFICATION ALERT BANNER */}
            {notificationMessage && (
                <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "14px 18px", borderRadius: "10px", marginBottom: "20px", color: "#065f46", fontWeight: "700", fontSize: "14px" }}>
                    🔔 {notificationMessage}
                </div>
            )}

            {/* DELIVERED CELEBRATION BANNER (VISIBLE TO CLIENT & ALL ROLES) */}
            {project.status === "Delivered" && (
                <div style={{
                    background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                    color: "white",
                    padding: "20px 24px",
                    borderRadius: "14px",
                    marginBottom: "24px",
                    boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px"
                }}>
                    <span style={{ fontSize: "36px" }}>🎉</span>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "900" }}>PROJECT DELIVERED SUCCESSFULLY!</h2>
                        <p style={{ margin: "4px 0 0 0", fontSize: "14px", opacity: 0.9 }}>
                            All site logistics works (100%), manager quality inspections, and financial dues clearances are completed and approved.
                        </p>
                    </div>
                </div>
            )}

            {/* MULTI-STAGE APPROVAL & DELIVERY STEPPER */}
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ marginBottom: "16px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>
                        Synced Client Project Lifecycle & Approval Pipeline
                    </span>
                    <h3 style={{ margin: "4px 0 0 0", fontSize: "18px", color: "#0f172a" }}>
                        Workflow & Approval Status
                    </h3>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                    {/* Stage 1 */}
                    <div style={{
                        padding: "16px",
                        borderRadius: "12px",
                        background: "#f8fafc",
                        border: "1px solid #cbd5e1"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <span style={{ fontSize: "20px" }}>📋</span>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Stage 1</span>
                        </div>
                        <strong style={{ display: "block", fontSize: "14px", color: "#0f172a" }}>Client Approved</strong>
                        <span style={{ fontSize: "12px", color: "#059669", fontWeight: "700", display: "inline-block", marginTop: "4px" }}>
                            ✅ Approved & Initiated
                        </span>
                    </div>

                    {/* Stage 2 */}
                    <div style={{
                        padding: "16px",
                        borderRadius: "12px",
                        background: currentPercent >= 100 ? "#f0fdf4" : "#fffdf5",
                        border: currentPercent >= 100 ? "1px solid #86efac" : "1px solid #fde68a"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <span style={{ fontSize: "20px" }}>👷</span>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Stage 2</span>
                        </div>
                        <strong style={{ display: "block", fontSize: "14px", color: "#0f172a" }}>Logistics Progress</strong>
                        <span style={{ fontSize: "12px", color: currentPercent >= 100 ? "#059669" : "#b45309", fontWeight: "700", display: "inline-block", marginTop: "4px" }}>
                            {currentPercent >= 100 ? "✅ 100% Completed" : `🔄 In Progress (${currentPercent}%)`}
                        </span>
                    </div>

                    {/* Stage 3 */}
                    <div style={{
                        padding: "16px",
                        borderRadius: "12px",
                        background: project.managerApproved ? "#f0fdf4" : currentPercent >= 100 ? "#eff6ff" : "#f8fafc",
                        border: project.managerApproved ? "1px solid #86efac" : currentPercent >= 100 ? "1px solid #bfdbfe" : "1px solid #e2e8f0"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <span style={{ fontSize: "20px" }}>👨‍💼</span>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Stage 3</span>
                        </div>
                        <strong style={{ display: "block", fontSize: "14px", color: "#0f172a" }}>Manager Approval</strong>
                        <span style={{ fontSize: "12px", color: project.managerApproved ? "#059669" : currentPercent >= 100 ? "#2563eb" : "#64748b", fontWeight: "700", display: "inline-block", marginTop: "4px" }}>
                            {project.managerApproved
                                ? `✅ Approved (${project.managerApprovedBy?.name || "Manager"})`
                                : currentPercent >= 100
                                    ? "⏳ Awaiting Manager Signoff"
                                    : "🔒 Waiting for 100% Logistics"}
                        </span>
                    </div>

                    {/* Stage 4 */}
                    <div style={{
                        padding: "16px",
                        borderRadius: "12px",
                        background: project.financeApproved ? "#f0fdf4" : project.managerApproved ? "#faf5ff" : "#f8fafc",
                        border: project.financeApproved ? "1px solid #86efac" : project.managerApproved ? "1px solid #e9d5ff" : "1px solid #e2e8f0"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <span style={{ fontSize: "20px" }}>💳</span>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Stage 4</span>
                        </div>
                        <strong style={{ display: "block", fontSize: "14px", color: "#0f172a" }}>Finance Clearance & Delivery</strong>
                        <span style={{ fontSize: "12px", color: project.financeApproved ? "#059669" : project.managerApproved ? "#7c3aed" : "#64748b", fontWeight: "700", display: "inline-block", marginTop: "4px" }}>
                            {project.financeApproved
                                ? "🚀 DELIVERED"
                                : project.managerApproved
                                    ? "⏳ Awaiting Finance Dues Clearance"
                                    : "🔒 Waiting for Manager Approval"}
                        </span>
                    </div>
                </div>
            </div>

            {/* ACTIVE DELAY WARNING BANNER */}
            {project.hasActiveDelay && (
                <div style={{
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    padding: "16px 20px",
                    borderRadius: "12px",
                    marginBottom: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px"
                }}>
                    <span style={{ fontSize: "26px" }}>⚠️</span>
                    <div>
                        <strong style={{ color: "#b45309", fontSize: "15px", display: "block" }}>
                            Active Construction Delay Reported by Logistics
                        </strong>
                        <div style={{ fontSize: "13px", color: "#92400e", marginTop: "2px" }}>
                            <strong>Reason:</strong> {project.latestDelayReason || "Site obstacle recorded"} {project.totalDelayDays > 0 && `(Cumulative impact: +${project.totalDelayDays} days)`}
                        </div>
                    </div>
                </div>
            )}

            {/* MILESTONE & OVERALL PROGRESS CARD */}
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "12px" }}>
                    <div>
                        <span style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>
                            Construction Stage & Velocity
                        </span>
                        <h2 style={{ margin: "4px 0 0 0", fontSize: "20px", color: "#0f172a" }}>
                            {project.currentStage || "Site Mobilization & Preparation"}
                        </h2>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "32px", fontWeight: "900", color: currentPercent >= 100 ? "#059669" : "#2563eb" }}>
                            {currentPercent}%
                        </span>
                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>OVERALL COMPLETION</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div style={{ width: "100%", height: "14px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden", position: "relative", marginBottom: "20px" }}>
                    <div style={{
                        width: `${currentPercent}%`,
                        height: "100%",
                        background: currentPercent >= 100
                            ? "linear-gradient(90deg, #10b981, #059669)"
                            : project.hasActiveDelay
                                ? "linear-gradient(90deg, #f59e0b, #d97706)"
                                : "linear-gradient(90deg, #3b82f6, #2563eb)",
                        borderRadius: "999px",
                        transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
                    }} />
                </div>

                {/* Milestone Checkpoints Row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                    {milestones.map((m) => (
                        <div
                            key={m.pct}
                            style={{
                                padding: "12px 14px",
                                borderRadius: "10px",
                                border: m.achieved ? "1px solid #86efac" : "1px dashed #cbd5e1",
                                background: m.achieved ? "#f0fdf4" : "#f8fafc",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px"
                            }}
                        >
                            <span style={{ fontSize: "18px" }}>{m.achieved ? "✅" : "⏳"}</span>
                            <div>
                                <strong style={{ display: "block", fontSize: "13px", color: m.achieved ? "#166534" : "#64748b" }}>
                                    {m.label}
                                </strong>
                                <small style={{ fontSize: "11px", color: m.achieved ? "#15803d" : "#94a3b8" }}>
                                    {m.achieved ? "Milestone Achieved (Manager Notified)" : "Pending execution"}
                                </small>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Manager Notification Info Note */}
                <div style={{ marginTop: "14px", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", color: "#475569", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>🎯</span>
                    <span>
                        <strong>Manager Milestone Dispatch Policy:</strong> The assigned Project Manager receives automatic real-time milestone email dispatch notifications whenever the Logistics Officer logs 25%, 50%, 75%, and 100% completion.
                    </span>
                </div>
            </div>

            {/* PROJECT GENERAL DETAILS */}
            <div className="details-card" style={{ marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#0f172a" }}>Project Metadata & Scope</h3>

                <div className="details-grid">
                    <p>
                        <b>Client / Owner:</b>
                        <br />
                        {project.clientName}
                    </p>

                    <p>
                        <b>Status:</b>
                        <br />
                        <span className={`status ${(project.status || "pending").toLowerCase()}`}>
                            {project.status}
                        </span>
                    </p>

                    <p>
                        <b>Start Date:</b>
                        <br />
                        {new Date(project.startDate).toLocaleDateString()}
                    </p>

                    <p>
                        <b>Target Deadline:</b>
                        <br />
                        {new Date(project.deadline).toLocaleDateString()}
                    </p>

                    <p>
                        <b>Contract Budget:</b>
                        <br />
                        <strong>BDT {Number(project.budget || 0).toLocaleString()}</strong>
                    </p>

                    <p>
                        <b>Assigned Site Lead:</b>
                        <br />
                        {project.assignedEmployee || "Unassigned"}
                    </p>

                    <p style={{ gridColumn: "1 / -1" }}>
                        <b>Project Site Location:</b>
                        <br />
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                            📍 {project.projectLocation || "Dhaka Site"}
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.projectLocation || project.projectName)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: "inline-block",
                                    padding: "3px 8px",
                                    background: "#2563eb",
                                    color: "white",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    textDecoration: "none"
                                }}
                            >
                                Open in Google Maps ↗
                            </a>
                        </span>
                    </p>
                </div>

                {/* 3 Operational Roles Team Box */}
                <div style={{ marginTop: "20px", background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                    <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#0f172a" }}>
                        👥 Assigned Operational Team (3 Core Roles)
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                        <div style={{ background: "white", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#b45309", textTransform: "uppercase" }}>
                                👷 Operations / Logistics Officer
                            </span>
                            <strong style={{ display: "block", fontSize: "14px", color: "#0f172a", marginTop: "4px" }}>
                                {project.assignedOperationsOfficer?.name || "Unassigned"}
                            </strong>
                            <small style={{ color: "#64748b" }}>
                                {project.assignedOperationsOfficer?.email || "Updates Progress & Logs Delays"}
                            </small>
                        </div>

                        <div style={{ background: "white", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#2563eb", textTransform: "uppercase" }}>
                                👨‍💼 Project Manager
                            </span>
                            <strong style={{ display: "block", fontSize: "14px", color: "#0f172a", marginTop: "4px" }}>
                                {project.assignedManager?.name || "Unassigned"}
                            </strong>
                            <small style={{ color: "#64748b" }}>
                                {project.assignedManager?.email || "Receives Milestone Notifications"}
                            </small>
                        </div>

                        <div style={{ background: "white", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#059669", textTransform: "uppercase" }}>
                                💳 Accounts Officer
                            </span>
                            <strong style={{ display: "block", fontSize: "14px", color: "#0f172a", marginTop: "4px" }}>
                                {project.assignedAccountsOfficer?.name || "Unassigned"}
                            </strong>
                            <small style={{ color: "#64748b" }}>
                                {project.assignedAccountsOfficer?.email || "Billing & Invoices"}
                            </small>
                        </div>
                    </div>
                </div>
            </div>

            {/* PROGRESS & DELAY TIMELINE LOGS */}
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                        📜 Logistics Progress & Delay History Log
                    </h3>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>
                        {(project.progressUpdates || []).length} Update(s) Recorded
                    </span>
                </div>

                {(!project.progressUpdates || project.progressUpdates.length === 0) ? (
                    <div style={{ padding: "30px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "10px", border: "1px dashed #cbd5e1" }}>
                        No progress updates logged yet. The Logistics Officer can click "Update Progress & Log Delay" to record the first milestone.
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {project.progressUpdates.map((entry, idx) => (
                            <div
                                key={entry._id || idx}
                                style={{
                                    padding: "16px",
                                    borderRadius: "10px",
                                    border: entry.isDelayed ? "1px solid #fde68a" : "1px solid #e2e8f0",
                                    background: entry.isDelayed ? "#fffdf5" : "#ffffff",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{
                                            padding: "4px 10px",
                                            background: entry.percentage >= 100 ? "#dcfce7" : "#eff6ff",
                                            color: entry.percentage >= 100 ? "#15803d" : "#1d4ed8",
                                            borderRadius: "999px",
                                            fontWeight: "800",
                                            fontSize: "13px"
                                        }}>
                                            {entry.percentage}% Completed
                                        </span>
                                        <strong style={{ color: "#0f172a", fontSize: "14px" }}>{entry.stageName}</strong>
                                    </div>
                                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                                        {new Date(entry.timestamp).toLocaleString()}
                                    </span>
                                </div>

                                {entry.isDelayed && (
                                    <div style={{ background: "#fef3c7", border: "1px solid #fde68a", padding: "8px 12px", borderRadius: "6px", marginBottom: "8px", fontSize: "12px", color: "#92400e" }}>
                                        <strong>⚠️ Delay Recorded:</strong> {entry.delayReason} {entry.delayImpactDays > 0 && `(+${entry.delayImpactDays} days)`}
                                    </div>
                                )}

                                {entry.updateNotes && (
                                    <p style={{ margin: "4px 0 8px 0", fontSize: "13px", color: "#334155", lineHeight: "1.5" }}>
                                        {entry.updateNotes}
                                    </p>
                                )}

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#64748b", borderTop: "1px solid #f1f5f9", paddingTop: "8px", marginTop: "8px" }}>
                                    <span>
                                        Updated By: <strong>{entry.updatedBy?.name || "Logistics Officer"}</strong>
                                    </span>
                                    {entry.managerNotified && (
                                        <span style={{ color: "#059669", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                            🎯 Manager Milestone Email Dispatched
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* LOGISTICS UPDATE MODAL (ONLY ACCESSIBLE TO LOGISTICS / OPERATIONS OFFICER & ADMIN) */}
            {showProgressModal && isLogisticsOfficer && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(15, 23, 42, 0.6)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                    padding: "20px"
                }}>
                    <div style={{
                        background: "#ffffff",
                        borderRadius: "16px",
                        width: "100%",
                        maxWidth: "560px",
                        padding: "24px",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                                    ⚡ Logistics Progress & Delay Update
                                </h3>
                                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                                    Log progress, record delays with reasons, and trigger manager milestone alerts.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowProgressModal(false)}
                                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleProgressSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {/* Percentage Slider / Input */}
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                                    Progress Percentage ({progressForm.percentage}%)
                                </label>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={progressForm.percentage}
                                        onChange={(e) => setProgressForm({ ...progressForm, percentage: Number(e.target.value) })}
                                        style={{ flex: 1, accentColor: "#059669", height: "6px", cursor: "pointer" }}
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={progressForm.percentage}
                                        onChange={(e) => setProgressForm({ ...progressForm, percentage: Number(e.target.value) })}
                                        style={{ width: "70px", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", textAlign: "center", fontWeight: "800" }}
                                    />
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                                    <span>0% Start</span>
                                    <span>25% Substructure</span>
                                    <span>50% Superstructure</span>
                                    <span>75% Finishing</span>
                                    <span>100% Handover</span>
                                </div>
                            </div>

                            {/* Stage Name */}
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                                    Current Construction Stage
                                </label>
                                <select
                                    value={progressForm.stageName}
                                    onChange={(e) => setProgressForm({ ...progressForm, stageName: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#fff" }}
                                    required
                                >
                                    {STANDARD_STAGES.map((s, idx) => (
                                        <option key={idx} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Delay Checkbox */}
                            <div style={{ background: progressForm.isDelayed ? "#fffbeb" : "#f8fafc", padding: "14px", borderRadius: "10px", border: progressForm.isDelayed ? "1px solid #fde68a" : "1px solid #e2e8f0" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "700", color: progressForm.isDelayed ? "#b45309" : "#334155" }}>
                                    <input
                                        type="checkbox"
                                        checked={progressForm.isDelayed}
                                        onChange={(e) => setProgressForm({ ...progressForm, isDelayed: e.target.checked })}
                                        style={{ width: "18px", height: "18px", accentColor: "#d97706" }}
                                    />
                                    ⚠️ Report Construction Delay / Obstacle
                                </label>

                                {progressForm.isDelayed && (
                                    <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#92400e", marginBottom: "4px" }}>
                                                Delay Reason (Required)
                                            </label>
                                            <select
                                                value={progressForm.delayReason}
                                                onChange={(e) => setProgressForm({ ...progressForm, delayReason: e.target.value })}
                                                style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#fff" }}
                                                required={progressForm.isDelayed}
                                            >
                                                {DELAY_REASONS.map((r, idx) => (
                                                    <option key={idx} value={r}>{r}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#92400e", marginBottom: "4px" }}>
                                                Estimated Delay Impact (Days)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={progressForm.delayImpactDays}
                                                onChange={(e) => setProgressForm({ ...progressForm, delayImpactDays: Number(e.target.value) })}
                                                style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                                                placeholder="e.g. 5"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Update Notes */}
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                                    Site Observations & Logistics Field Notes
                                </label>
                                <textarea
                                    value={progressForm.updateNotes}
                                    onChange={(e) => setProgressForm({ ...progressForm, updateNotes: e.target.value })}
                                    rows="3"
                                    placeholder="Enter structural observations, concrete testing remarks, material supply status..."
                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", resize: "vertical" }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowProgressModal(false)}
                                    style={{ padding: "10px 16px", background: "#f1f5f9", color: "#334155", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{ padding: "10px 20px", background: "#059669", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}
                                >
                                    {submitting ? "Saving & Notifying Manager..." : "Save Progress & Notify"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProjectDetails;