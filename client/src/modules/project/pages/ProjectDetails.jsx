import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
    getProjectById,
    updateProjectProgress,
    reviewProgressUpdate,
    approveProjectByManager,
    approveProjectByFinance
} from "../projectApi";
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

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
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

// Helper: Downsample & compress image to lightweight Base64 string
const compressImageToBase64 = (file, maxWidth = 1200, maxHeight = 900, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let { width, height } = img;
                if (width > maxWidth || height > maxHeight) {
                    if (width / maxWidth > height / maxHeight) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
                resolve(compressedBase64);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

function ProjectDetails() {
    const { id } = useParams();
    const { user } = useAuth();
    const isLogisticsOfficer = user?.role === "operations_officer" || user?.role === "admin";
    const isManager = user?.role === "manager" || user?.role === "admin";
    const isFinanceOfficer = user?.role === "accounts_officer" || user?.role === "admin";
    const isClient = user?.role === "client";

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");
    const [timelineFilter, setTimelineFilter] = useState("all"); // 'all' | 'approved' | 'pending'

    // Photo light-box state
    const [activeLightbox, setActiveLightbox] = useState(null);

    // Side-by-side comparison modal state
    const [compareModal, setCompareModal] = useState({
        open: false,
        current: null,
        previous: null
    });

    // Manager Review Modal State (Approve / Reject)
    const [reviewModal, setReviewModal] = useState({
        open: false,
        update: null,
        action: "Approve", // 'Approve' | 'Reject'
        managerNote: "",
        rejectionReason: ""
    });

    // Progress update form state with Photo Proof
    const fileInputRef = useRef(null);
    const [photoPreview, setPhotoPreview] = useState("");
    const [photoUploading, setPhotoUploading] = useState(false);

    const [progressForm, setProgressForm] = useState({
        percentage: 0,
        stageName: STANDARD_STAGES[0],
        monthName: MONTH_NAMES[new Date().getMonth()],
        updateNotes: "",
        isDelayed: false,
        delayReason: DELAY_REASONS[0],
        delayImpactDays: 0,
        photos: []
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
                monthName: MONTH_NAMES[new Date().getMonth()],
                isDelayed: data.hasActiveDelay || false,
                delayReason: data.latestDelayReason || DELAY_REASONS[0]
            }));
        } catch (error) {
            console.error("Failed to load project details:", error);
        } finally {
            setLoading(false);
        }
    };

    // Handle File / Photo Selection & Base64 Compression
    const handlePhotoSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image file (JPG, PNG, WebP).");
            return;
        }

        setPhotoUploading(true);
        try {
            const base64Data = await compressImageToBase64(file);
            setPhotoPreview(base64Data);
            setProgressForm(prev => ({
                ...prev,
                photos: [{ url: base64Data, caption: prev.stageName }]
            }));
        } catch (err) {
            console.error("Failed to process photo:", err);
            alert("Failed to process photo file. Please try another image.");
        } finally {
            setPhotoUploading(false);
        }
    };

    const handleRemovePhoto = () => {
        setPhotoPreview("");
        setProgressForm(prev => ({ ...prev, photos: [] }));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Submit Progress with Photo Proof (Logistics Officer)
    const handleProgressSubmit = async (e) => {
        e.preventDefault();
        if (!progressForm.photos || progressForm.photos.length === 0) {
            alert("Site Verification Photo is required! Please attach at least one live progress photo to prevent unverified updates.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await updateProjectProgress(id, progressForm);
            setProject(res.data.project);
            setShowProgressModal(false);
            setPhotoPreview("");
            if (fileInputRef.current) fileInputRef.current.value = "";
            setNotificationMessage(res.data.message || "Progress photo update submitted for Manager approval!");
            setTimeout(() => setNotificationMessage(""), 9000);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update project progress");
        } finally {
            setSubmitting(false);
        }
    };

    // Open Manager Review Modal
    const openReviewModal = (update, actionType) => {
        setReviewModal({
            open: true,
            update,
            action: actionType,
            managerNote: actionType === "Approve" ? "Inspected on-site; matches structural drawings and quality standards." : "",
            rejectionReason: ""
        });
    };

    // Submit Manager Review (Approve or Reject)
    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!reviewModal.update) return;

        if (reviewModal.action === "Reject" && !reviewModal.rejectionReason.trim()) {
            alert("A clear rejection note / reason is required explaining what the Logistics Officer must correct.");
            return;
        }

        setActionLoading(true);
        try {
            const res = await reviewProgressUpdate(id, reviewModal.update._id, {
                action: reviewModal.action,
                managerNote: reviewModal.managerNote,
                rejectionReason: reviewModal.rejectionReason
            });
            setProject(res.data.project);
            setReviewModal({ open: false, update: null, action: "Approve", managerNote: "", rejectionReason: "" });
            setNotificationMessage(res.data.message || "Review submitted successfully!");
            setTimeout(() => setNotificationMessage(""), 9000);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to review progress update");
        } finally {
            setActionLoading(false);
        }
    };

    // Open Side-by-Side Comparison Modal
    const openComparison = (currentEntry, allUpdates) => {
        // Find previous approved update
        const currentIndex = allUpdates.findIndex(u => String(u._id) === String(currentEntry._id));
        let previousApproved = null;
        for (let i = currentIndex + 1; i < allUpdates.length; i++) {
            if (allUpdates[i].status === "Approved" && allUpdates[i].photos?.length > 0) {
                previousApproved = allUpdates[i];
                break;
            }
        }
        // Fallback to any previous update with photo if none approved
        if (!previousApproved && currentIndex + 1 < allUpdates.length) {
            previousApproved = allUpdates[currentIndex + 1];
        }

        setCompareModal({
            open: true,
            current: currentEntry,
            previous: previousApproved
        });
    };

    // Manager Final 100% Signoff
    const handleManagerApprove = async () => {
        if (!window.confirm("Are you sure you want to officially approve this project completion as Manager?")) return;
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

    // Finance Delivery Signoff
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
    const updates = project.progressUpdates || [];
    const pendingUpdates = updates.filter(u => u.status === "Pending Approval");
    const latestRejected = updates.find(u => u.status === "Rejected");

    // Clients ONLY see officially Approved & Verified milestones (Never internal rejected/pending drafts)
    const filteredUpdates = updates.filter(u => {
        if (isClient) return u.status === "Approved";
        if (timelineFilter === "approved") return u.status === "Approved";
        if (timelineFilter === "pending") return u.status === "Pending Approval";
        return true;
    });

    const milestones = [
        { pct: 25, label: "25% Substructure", achieved: currentPercent >= 25 },
        { pct: 50, label: "50% Superstructure", achieved: currentPercent >= 50 },
        { pct: 75, label: "75% Finishing & MEP", achieved: currentPercent >= 75 },
        { pct: 100, label: "100% Handover", achieved: currentPercent >= 100 }
    ];

    const canManagerApprove = isManager && currentPercent >= 100 && !project.managerApproved;
    const canFinanceApprove = isFinanceOfficer && project.managerApproved && !project.financeApproved;

    return (
        <div className="project-details-page" style={{ maxWidth: "1240px", margin: "0 auto", padding: "24px" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Construction Progress & Photo Verification Hub
                    </span>
                    <h1 style={{ margin: "4px 0 0 0", fontSize: "28px", color: "#0f172a", fontWeight: "900" }}>{project.projectName}</h1>
                    <div style={{ fontSize: "13px", color: "#475569", marginTop: "2px" }}>
                        Client: <strong>{project.clientName}</strong> • Location: <strong>{project.projectLocation || "Dhaka Site"}</strong>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    {isLogisticsOfficer && project.status !== "Delivered" && (
                        <button
                            type="button"
                            onClick={() => {
                                setPhotoPreview("");
                                setShowProgressModal(true);
                            }}
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
                                gap: "8px",
                                boxShadow: "0 2px 4px rgba(5, 150, 105, 0.2)"
                            }}
                        >
                            📸 Upload Progress Photo & Update
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

            {/* PENDING MANAGER REVIEW CALLOUT BANNER (VISIBLE TO MANAGERS & ADMINS) */}
            {isManager && pendingUpdates.length > 0 && (
                <div style={{
                    background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                    border: "1px solid #fde68a",
                    padding: "16px 20px",
                    borderRadius: "14px",
                    marginBottom: "24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "14px",
                    boxShadow: "0 4px 6px -1px rgba(217, 119, 6, 0.1)"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <span style={{ fontSize: "28px" }}>⏳</span>
                        <div>
                            <strong style={{ color: "#92400e", fontSize: "15px", display: "block" }}>
                                {pendingUpdates.length} Progress Photo Verification{pendingUpdates.length > 1 ? "s" : ""} Awaiting Manager Sign-off
                            </strong>
                            <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#b45309" }}>
                                Logistics Officer submitted live site photo proof for stage <strong>"{pendingUpdates[0].stageName}" ({pendingUpdates[0].percentage}%)</strong>. Inspect photos below to verify authenticity and notify the client.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => openReviewModal(pendingUpdates[0], "Approve")}
                        style={{
                            padding: "8px 16px",
                            background: "#2563eb",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "800",
                            fontSize: "13px",
                            cursor: "pointer",
                            boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)"
                        }}
                    >
                        🔍 Inspect & Verify Latest ({pendingUpdates[0].percentage}%)
                    </button>
                </div>
            )}

            {/* REJECTION / CORRECTION NOTICE (VISIBLE TO LOGISTICS OFFICER & ADMIN) */}
            {isLogisticsOfficer && latestRejected && (
                <div style={{
                    background: "#fef2f2",
                    border: "1px solid #fca5a5",
                    padding: "16px 20px",
                    borderRadius: "14px",
                    marginBottom: "24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "14px"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <span style={{ fontSize: "28px" }}>❌</span>
                        <div>
                            <strong style={{ color: "#991b1b", fontSize: "15px", display: "block" }}>
                                Progress Update Rejected by Manager ({latestRejected.percentage}% - {latestRejected.stageName})
                            </strong>
                            <div style={{ fontSize: "13px", color: "#b91c1c", marginTop: "2px" }}>
                                <strong>Manager Feedback / Note:</strong> "{latestRejected.rejectionReason || latestRejected.managerNote || 'Correction required by Manager'}"
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setProgressForm(prev => ({
                                ...prev,
                                percentage: latestRejected.percentage,
                                stageName: latestRejected.stageName,
                                updateNotes: latestRejected.updateNotes || ""
                            }));
                            setPhotoPreview("");
                            setShowProgressModal(true);
                        }}
                        style={{
                            padding: "8px 16px",
                            background: "#dc2626",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "800",
                            fontSize: "13px",
                            cursor: "pointer"
                        }}
                    >
                        ⚡ Correct & Resubmit Progress
                    </button>
                </div>
            )}

            {/* DELIVERED BANNER */}
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
                            All site construction stages (100%), verified site photos, manager sign-offs, and financial clearances are complete.
                        </p>
                    </div>
                </div>
            )}

            {/* PIPELINE STEPPER */}
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ marginBottom: "16px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>
                        Synced Client Project Lifecycle & Approval Pipeline
                    </span>
                    <h3 style={{ margin: "4px 0 0 0", fontSize: "18px", color: "#0f172a" }}>
                        Workflow & Signoff Status
                    </h3>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                    {/* Stage 1 */}
                    <div style={{ padding: "16px", borderRadius: "12px", background: "#f8fafc", border: "1px solid #cbd5e1" }}>
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

            {/* MILESTONE & OVERALL PROGRESS CARD */}
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                        <span style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>
                            Construction Stage & Official Completion
                        </span>
                        <h2 style={{ margin: "4px 0 0 0", fontSize: "20px", color: "#0f172a" }}>
                            {project.currentStage || "Site Mobilization & Preparation"}
                        </h2>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "32px", fontWeight: "900", color: currentPercent >= 100 ? "#059669" : "#2563eb" }}>
                            {currentPercent}%
                        </span>
                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>OFFICIALLY VERIFIED PROGRESS</div>
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
                                    {m.achieved ? "Verified by Manager" : "Pending execution"}
                                </small>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ======================================================== */}
            {/* 📸 CONSTRUCTION PROGRESS PHOTO VERIFICATION TIMELINE */}
            {/* ======================================================== */}
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "22px" }}>📸</span>
                            <h3 style={{ margin: 0, fontSize: "19px", color: "#0f172a", fontWeight: "800" }}>
                                Construction Progress & Site Photo Verification Timeline
                            </h3>
                        </div>
                        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                            Live-verified photographic timeline for tamper-proof authenticity and zero cheating. Compare stage photos side-by-side.
                        </p>
                    </div>

                    {/* Filter Tabs (Staff/Manager/Admin only; Client only sees Verified) */}
                    {!isClient ? (
                        <div style={{ display: "flex", background: "#f1f5f9", padding: "3px", borderRadius: "8px", gap: "4px" }}>
                            <button
                                type="button"
                                onClick={() => setTimelineFilter("all")}
                                style={{
                                    padding: "6px 12px",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    background: timelineFilter === "all" ? "#ffffff" : "transparent",
                                    color: timelineFilter === "all" ? "#0f172a" : "#64748b",
                                    boxShadow: timelineFilter === "all" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
                                }}
                            >
                                All ({updates.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setTimelineFilter("approved")}
                                style={{
                                    padding: "6px 12px",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    background: timelineFilter === "approved" ? "#ffffff" : "transparent",
                                    color: timelineFilter === "approved" ? "#059669" : "#64748b",
                                    boxShadow: timelineFilter === "approved" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
                                }}
                            >
                                ✅ Verified ({updates.filter(u => u.status === "Approved").length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setTimelineFilter("pending")}
                                style={{
                                    padding: "6px 12px",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    background: timelineFilter === "pending" ? "#ffffff" : "transparent",
                                    color: timelineFilter === "pending" ? "#d97706" : "#64748b",
                                    boxShadow: timelineFilter === "pending" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
                                }}
                            >
                                ⏳ Pending ({pendingUpdates.length})
                            </button>
                        </div>
                    ) : (
                        <div style={{ background: "#ecfdf5", border: "1px solid #86efac", padding: "6px 14px", borderRadius: "8px", fontSize: "12px", color: "#065f46", fontWeight: "800" }}>
                            ✅ {updates.filter(u => u.status === "Approved").length} Manager-Verified Milestone{updates.filter(u => u.status === "Approved").length === 1 ? "" : "s"}
                        </div>
                    )}
                </div>

                {filteredUpdates.length === 0 ? (
                    <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                        <span style={{ fontSize: "36px", display: "block", marginBottom: "8px" }}>🏗️</span>
                        <strong style={{ fontSize: "15px", color: "#334155" }}>No progress photos logged yet for this filter.</strong>
                        <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>
                            The Logistics Officer can upload live site photos at each milestone stage to build the verified timeline.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
                        {filteredUpdates.map((entry, idx) => {
                            const photoUrl = entry.photos?.[0]?.url || "https://images.unsplash.com/photo-1541888946425-d0fbb180c5f7?w=600&auto=format&fit=crop&q=60";
                            const isApproved = entry.status === "Approved";
                            const isPending = entry.status === "Pending Approval";
                            const isRejected = entry.status === "Rejected";

                            return (
                                <div
                                    key={entry._id || idx}
                                    className="photo-timeline-card"
                                    style={{
                                        border: isApproved ? "1px solid #86efac" : isPending ? "1px solid #fde68a" : "1px solid #fca5a5"
                                    }}
                                >
                                    {/* Photo Container with Lightbox Trigger */}
                                    <div
                                        className="photo-thumb-container"
                                        onClick={() => setActiveLightbox({
                                            url: photoUrl,
                                            title: `${entry.monthName || 'Milestone'}: ${entry.stageName} (${entry.percentage}%)`,
                                            subtitle: `Uploaded by ${entry.updatedBy?.name || 'Logistics Officer'} • ${new Date(entry.timestamp).toLocaleDateString()}`
                                        })}
                                    >
                                        <img src={photoUrl} alt={entry.stageName} />
                                        <div className="photo-thumb-overlay">
                                            <span>🔍 Click to expand full photo</span>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div style={{ padding: "18px" }}>
                                        {/* Top Badges */}
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", gap: "8px" }}>
                                            <span style={{
                                                background: "#f1f5f9",
                                                color: "#0f172a",
                                                padding: "4px 10px",
                                                borderRadius: "6px",
                                                fontSize: "12px",
                                                fontWeight: "800",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "4px"
                                            }}>
                                                🗓️ {entry.monthName || new Date(entry.timestamp).toLocaleString("default", { month: "long" })}
                                            </span>

                                            {isApproved && (
                                                <span className="photo-badge-approved">
                                                    ✅ Manager Verified
                                                </span>
                                            )}
                                            {isPending && (
                                                <span className="photo-badge-pending">
                                                    ⏳ Pending Verification
                                                </span>
                                            )}
                                            {isRejected && (
                                                <span className="photo-badge-rejected">
                                                    ❌ Not Approved
                                                </span>
                                            )}
                                        </div>

                                        {/* Stage Title & Percentage */}
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                                            <h4 style={{ margin: 0, fontSize: "15px", color: "#0f172a", fontWeight: "800", lineHeight: "1.3" }}>
                                                {entry.stageName}
                                            </h4>
                                            <span style={{
                                                fontSize: "14px",
                                                fontWeight: "900",
                                                color: isApproved ? "#059669" : "#2563eb",
                                                background: isApproved ? "#f0fdf4" : "#eff6ff",
                                                padding: "2px 8px",
                                                borderRadius: "6px"
                                            }}>
                                                {entry.percentage}%
                                            </span>
                                        </div>

                                        {/* Delay Badge if applicable */}
                                        {entry.isDelayed && (
                                            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "6px 10px", borderRadius: "6px", fontSize: "12px", color: "#b45309", marginBottom: "8px" }}>
                                                <strong>⚠️ Delay Reported:</strong> {entry.delayReason} {entry.delayImpactDays > 0 && `(+${entry.delayImpactDays}d)`}
                                            </div>
                                        )}

                                        {/* Field Remarks / Notes */}
                                        {entry.updateNotes && (
                                            <p style={{ margin: "6px 0 10px 0", fontSize: "12px", color: "#475569", lineHeight: "1.4", background: "#f8fafc", padding: "8px 10px", borderRadius: "6px" }}>
                                                "{entry.updateNotes}"
                                            </p>
                                        )}

                                        {/* Manager Verification / Rejection Notes */}
                                        {isApproved && entry.managerNote && (
                                            <div style={{ fontSize: "12px", color: "#065f46", background: "#ecfdf5", padding: "6px 10px", borderRadius: "6px", marginBottom: "10px" }}>
                                                <strong>Manager Seal:</strong> {entry.managerNote}
                                            </div>
                                        )}

                                        {isRejected && (entry.rejectionReason || entry.managerNote) && (
                                            <div style={{ fontSize: "12px", color: "#991b1b", background: "#fef2f2", padding: "6px 10px", borderRadius: "6px", marginBottom: "10px" }}>
                                                <strong>Rejection Note:</strong> {entry.rejectionReason || entry.managerNote}
                                            </div>
                                        )}

                                        {/* Audit Footer */}
                                        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "10px", marginTop: "10px", fontSize: "11px", color: "#64748b", display: "flex", flexDirection: "column", gap: "3px" }}>
                                            <div>
                                                Logged by: <strong>{entry.updatedBy?.name || "Logistics Officer"}</strong> • {new Date(entry.timestamp).toLocaleDateString()}
                                            </div>
                                            {isApproved && entry.reviewedBy && (
                                                <div style={{ color: "#059669", fontWeight: "700" }}>
                                                    Verified by Manager: {entry.reviewedBy?.name || "Project Manager"} ({new Date(entry.reviewedAt).toLocaleDateString()})
                                                </div>
                                            )}
                                            {entry.clientNotified && (
                                                <div style={{ color: "#2563eb", fontWeight: "700" }}>
                                                    📨 Client Notified with Live Proof
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Bar */}
                                        <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                                            {/* Compare Button */}
                                            <button
                                                type="button"
                                                onClick={() => openComparison(entry, updates)}
                                                style={{
                                                    flex: 1,
                                                    padding: "6px 10px",
                                                    background: "#f8fafc",
                                                    border: "1px solid #cbd5e1",
                                                    borderRadius: "6px",
                                                    fontSize: "12px",
                                                    fontWeight: "700",
                                                    color: "#334155",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                📐 Compare Stage Photos
                                            </button>

                                            {/* Manager Approval / Rejection buttons for Pending updates */}
                                            {isPending && isManager && (
                                                <div style={{ display: "flex", gap: "6px", width: "100%" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => openReviewModal(entry, "Approve")}
                                                        style={{
                                                            flex: 1,
                                                            padding: "6px 10px",
                                                            background: "#059669",
                                                            color: "#ffffff",
                                                            border: "none",
                                                            borderRadius: "6px",
                                                            fontSize: "12px",
                                                            fontWeight: "800",
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        ✅ Approve & Notify Client
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openReviewModal(entry, "Reject")}
                                                        style={{
                                                            padding: "6px 10px",
                                                            background: "#ef4444",
                                                            color: "#ffffff",
                                                            border: "none",
                                                            borderRadius: "6px",
                                                            fontSize: "12px",
                                                            fontWeight: "800",
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        ❌ Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ======================================================== */}
            {/* 📸 LOGISTICS PHOTO UPLOAD MODAL */}
            {/* ======================================================== */}
            {showProgressModal && isLogisticsOfficer && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(15, 23, 42, 0.65)",
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
                        maxWidth: "600px",
                        padding: "26px",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "19px", color: "#0f172a", fontWeight: "800" }}>
                                    📸 Construction Progress & Photo Verification
                                </h3>
                                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                                    Upload site photo proof and submit milestone for Manager verification.
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
                            {/* MANDATORY PHOTO UPLOAD SECTION */}
                            <div style={{
                                background: "#f8fafc",
                                padding: "16px",
                                borderRadius: "12px",
                                border: photoPreview ? "2px solid #059669" : "2px dashed #94a3b8"
                            }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
                                    📷 Live Site Verification Photo (Required)
                                </label>
                                <span style={{ display: "block", fontSize: "11px", color: "#64748b", marginBottom: "10px" }}>
                                    Capture or select clear daytime photo of concrete, columns, or finishing stage to guarantee authenticity.
                                </span>

                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handlePhotoSelect}
                                    style={{ display: "none" }}
                                />

                                {photoPreview ? (
                                    <div>
                                        <div style={{ position: "relative", width: "100%", height: "200px", borderRadius: "8px", overflow: "hidden", background: "#000", marginBottom: "8px" }}>
                                            <img
                                                src={photoPreview}
                                                alt="Site Preview"
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            />
                                            <span style={{ position: "absolute", top: "10px", right: "10px", background: "#059669", color: "#fff", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "800" }}>
                                                ✅ Photo Loaded (Base64)
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                style={{ flex: 1, padding: "8px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                                            >
                                                🔄 Change Photo
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleRemovePhoto}
                                                style={{ padding: "8px 14px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                                            >
                                                🗑️ Remove
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            padding: "28px 16px",
                                            textAlign: "center",
                                            cursor: "pointer",
                                            borderRadius: "8px",
                                            background: "#ffffff"
                                        }}
                                    >
                                        <span style={{ fontSize: "36px", display: "block", marginBottom: "6px" }}>📸</span>
                                        <strong style={{ fontSize: "14px", color: "#2563eb", display: "block" }}>
                                            {photoUploading ? "Compressing Image..." : "Click to Upload Site Photo"}
                                        </strong>
                                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                                            PNG, JPG, or WebP (Auto-converted to secure Base64 format)
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Month & Stage Selection */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                                        🗓️ Construction Month
                                    </label>
                                    <select
                                        value={progressForm.monthName}
                                        onChange={(e) => setProgressForm({ ...progressForm, monthName: e.target.value })}
                                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#fff" }}
                                        required
                                    >
                                        {MONTH_NAMES.map((m, idx) => (
                                            <option key={idx} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                                        🎯 Target Progress ({progressForm.percentage}%)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={progressForm.percentage}
                                        onChange={(e) => setProgressForm({ ...progressForm, percentage: Number(e.target.value) })}
                                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "800", textAlign: "center" }}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Stage Name */}
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                                    🏗️ Current Construction Stage
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

                            {/* Field Remarks */}
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                                    Site Observations & Field Remarks
                                </label>
                                <textarea
                                    value={progressForm.updateNotes}
                                    onChange={(e) => setProgressForm({ ...progressForm, updateNotes: e.target.value })}
                                    rows="2"
                                    placeholder="Enter concrete batch remarks, rebar inspection observations, curing progress..."
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
                                    disabled={submitting || !photoPreview}
                                    style={{
                                        padding: "10px 20px",
                                        background: !photoPreview ? "#94a3b8" : "#059669",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontWeight: "800",
                                        cursor: !photoPreview ? "not-allowed" : "pointer"
                                    }}
                                >
                                    {submitting ? "Uploading & Notifying..." : "Submit Photo for Manager Signoff"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* 👨‍💼 MANAGER VERIFICATION & REJECTION MODAL */}
            {/* ======================================================== */}
            {reviewModal.open && reviewModal.update && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(15, 23, 42, 0.7)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 99999,
                    padding: "20px"
                }}>
                    <div style={{
                        background: "#ffffff",
                        borderRadius: "16px",
                        width: "100%",
                        maxWidth: "640px",
                        padding: "26px",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.25)"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "19px", color: reviewModal.action === "Approve" ? "#059669" : "#dc2626", fontWeight: "800" }}>
                                    {reviewModal.action === "Approve" ? "✅ Approve & Sign Off Site Progress" : "❌ Reject Progress & Request Correction"}
                                </h3>
                                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                                    Project: <strong>{project.projectName}</strong> • Stage: <strong>{reviewModal.update.stageName} ({reviewModal.update.percentage}%)</strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setReviewModal({ ...reviewModal, open: false })}
                                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Photo Preview inside Review Modal */}
                        {reviewModal.update.photos?.[0]?.url && (
                            <div style={{ width: "100%", height: "220px", borderRadius: "10px", overflow: "hidden", background: "#000", marginBottom: "16px" }}>
                                <img
                                    src={reviewModal.update.photos[0].url}
                                    alt="Submitted Proof"
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            </div>
                        )}

                        <form onSubmit={handleReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {reviewModal.action === "Approve" ? (
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#065f46", marginBottom: "6px" }}>
                                        Manager Verification Remarks (Visible to Client)
                                    </label>
                                    <textarea
                                        value={reviewModal.managerNote}
                                        onChange={(e) => setReviewModal({ ...reviewModal, managerNote: e.target.value })}
                                        rows="3"
                                        placeholder="e.g. Inspected on-site; rebar alignment and concrete curing verified against BNBC specifications."
                                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                                        required
                                    />
                                    <div style={{ marginTop: "6px", fontSize: "12px", color: "#047857", background: "#ecfdf5", padding: "8px 12px", borderRadius: "6px" }}>
                                        📨 <strong>Client Dispatch:</strong> Approving will immediately notify client <strong>"{project.clientName}"</strong> with this verified photo proof.
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#991b1b", marginBottom: "6px" }}>
                                        Mandatory Rejection Note / Correction Reason ("Why Not Approved")
                                    </label>
                                    <textarea
                                        value={reviewModal.rejectionReason}
                                        onChange={(e) => setReviewModal({ ...reviewModal, rejectionReason: e.target.value })}
                                        rows="3"
                                        placeholder="Explain exactly what is wrong (e.g. Photo too dark/unclear, rebar spacing does not match approved structural drawings, floor casting incomplete)..."
                                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #fca5a5", fontSize: "13px", background: "#fff5f5" }}
                                        required
                                    />
                                    <div style={{ marginTop: "6px", fontSize: "12px", color: "#b91c1c" }}>
                                        ⚠️ The Logistics Officer will be notified with this note and instructed to correct the site work and resubmit.
                                    </div>
                                </div>
                            )}

                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                                <button
                                    type="button"
                                    onClick={() => setReviewModal({ ...reviewModal, open: false })}
                                    style={{ padding: "10px 16px", background: "#f1f5f9", color: "#334155", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    style={{
                                        padding: "10px 22px",
                                        background: reviewModal.action === "Approve" ? "#059669" : "#dc2626",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontWeight: "800",
                                        cursor: "pointer"
                                    }}
                                >
                                    {actionLoading
                                        ? "Processing Review..."
                                        : reviewModal.action === "Approve"
                                            ? "Confirm Verification & Notify Client"
                                            : "Confirm Rejection"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* 📐 SIDE-BY-SIDE STAGE PHOTO COMPARISON MODAL */}
            {/* ======================================================== */}
            {compareModal.open && compareModal.current && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(15, 23, 42, 0.8)",
                    backdropFilter: "blur(6px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 99999,
                    padding: "20px"
                }}>
                    <div style={{
                        background: "#ffffff",
                        borderRadius: "18px",
                        width: "100%",
                        maxWidth: "960px",
                        padding: "28px",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "20px", color: "#0f172a", fontWeight: "900" }}>
                                    📐 Construction Evolution & Photo Comparison
                                </h3>
                                <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                                    Compare previous verified stage photo with current stage to verify structural evolution.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCompareModal({ open: false, current: null, previous: null })}
                                style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#64748b" }}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="photo-comparison-grid">
                            {/* Previous Stage */}
                            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>
                                        ◀ Previous Verified Stage
                                    </span>
                                    {compareModal.previous && (
                                        <span style={{ fontSize: "12px", fontWeight: "800", color: "#059669" }}>
                                            {compareModal.previous.percentage}%
                                        </span>
                                    )}
                                </div>

                                {compareModal.previous ? (
                                    <div>
                                        <div style={{ height: "240px", borderRadius: "8px", overflow: "hidden", background: "#000", marginBottom: "10px" }}>
                                            <img
                                                src={compareModal.previous.photos?.[0]?.url || "https://images.unsplash.com/photo-1541888946425-d0fbb180c5f7?w=600&auto=format&fit=crop&q=60"}
                                                alt="Previous Stage"
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            />
                                        </div>
                                        <strong style={{ display: "block", fontSize: "14px", color: "#0f172a" }}>
                                            {compareModal.previous.monthName || 'Month'}: {compareModal.previous.stageName}
                                        </strong>
                                        <small style={{ fontSize: "12px", color: "#64748b" }}>
                                            Date: {new Date(compareModal.previous.timestamp).toLocaleDateString()}
                                        </small>
                                    </div>
                                ) : (
                                    <div style={{ padding: "60px 20px", textAlign: "center", color: "#94a3b8" }}>
                                        No prior milestone photo recorded. This is the initial stage.
                                    </div>
                                )}
                            </div>

                            {/* Current Stage */}
                            <div style={{ background: "#f0fdf4", padding: "16px", borderRadius: "12px", border: "2px solid #86efac" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "12px", fontWeight: "800", color: "#166534", textTransform: "uppercase" }}>
                                        ▶ Current Stage ({compareModal.current.percentage}%)
                                    </span>
                                    <span style={{ fontSize: "12px", fontWeight: "800", color: compareModal.current.status === "Approved" ? "#059669" : "#d97706" }}>
                                        {compareModal.current.status}
                                    </span>
                                </div>

                                <div style={{ height: "240px", borderRadius: "8px", overflow: "hidden", background: "#000", marginBottom: "10px" }}>
                                    <img
                                        src={compareModal.current.photos?.[0]?.url || "https://images.unsplash.com/photo-1541888946425-d0fbb180c5f7?w=600&auto=format&fit=crop&q=60"}
                                        alt="Current Stage"
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                </div>
                                <strong style={{ display: "block", fontSize: "14px", color: "#0f172a" }}>
                                    {compareModal.current.monthName || 'Month'}: {compareModal.current.stageName}
                                </strong>
                                <small style={{ fontSize: "12px", color: "#64748b" }}>
                                    Date: {new Date(compareModal.current.timestamp).toLocaleDateString()}
                                </small>
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                            <button
                                type="button"
                                onClick={() => setCompareModal({ open: false, current: null, previous: null })}
                                style={{ padding: "10px 20px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                            >
                                Close Comparison
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* 🔍 FULL PHOTO LIGHTBOX */}
            {/* ======================================================== */}
            {activeLightbox && (
                <div
                    onClick={() => setActiveLightbox(null)}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0, 0, 0, 0.9)",
                        zIndex: 999999,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                        cursor: "zoom-out"
                    }}
                >
                    <div style={{ maxWidth: "90vw", maxHeight: "80vh", position: "relative" }} onClick={(e) => e.stopPropagation()}>
                        <img
                            src={activeLightbox.url}
                            alt="Full site photo"
                            style={{ maxWidth: "100%", maxHeight: "75vh", borderRadius: "10px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}
                        />
                        <div style={{ color: "#ffffff", marginTop: "12px", textAlign: "center" }}>
                            <h4 style={{ margin: 0, fontSize: "16px" }}>{activeLightbox.title}</h4>
                            <p style={{ margin: "4px 0 0 0", fontSize: "12px", opacity: 0.8 }}>{activeLightbox.subtitle}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* PROJECT GENERAL DETAILS */}
            <div className="details-card" style={{ marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#0f172a" }}>Project Metadata & Operational Roles</h3>

                <div className="details-grid">
                    <div>
                        <span className="label">Project Title:</span>
                        <span className="value">{project.projectName}</span>
                    </div>

                    <div>
                        <span className="label">Client Name:</span>
                        <span className="value">{project.clientName}</span>
                    </div>

                    <div>
                        <span className="label">Start Date:</span>
                        <span className="value">{new Date(project.startDate).toLocaleDateString()}</span>
                    </div>

                    <div>
                        <span className="label">Target Deadline:</span>
                        <span className="value">{new Date(project.deadline).toLocaleDateString()}</span>
                    </div>

                    <div>
                        <span className="label">Contract Budget:</span>
                        <span className="value">BDT {Number(project.budget || 0).toLocaleString()}</span>
                    </div>

                    <div>
                        <span className="label">Site Location:</span>
                        <span className="value">{project.projectLocation || "Dhaka Site"}</span>
                    </div>

                    <div>
                        <span className="label">Assigned Project Manager:</span>
                        <span className="value">{project.assignedManager?.name || "Unassigned"}</span>
                    </div>

                    <div>
                        <span className="label">Logistics & Operations Officer:</span>
                        <span className="value">{project.assignedOperationsOfficer?.name || "Unassigned"}</span>
                    </div>

                    <div>
                        <span className="label">Assigned Accounts Officer:</span>
                        <span className="value">{project.assignedAccountsOfficer?.name || "Unassigned"}</span>
                    </div>

                    <div>
                        <span className="label">Current Delivery Status:</span>
                        <span className={`status ${project.status ? project.status.toLowerCase().replace(/\s+/g, '-') : 'pending'}`}>
                            {project.status}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProjectDetails;