import { useEffect, useState } from "react";
import { useAuth } from "../../auth/authStore";
import { getProjects, deleteProject, approveProjectByManager, approveProjectByFinance } from "../projectApi";
import ProjectForm from "../components/ProjectForm";
import BusinessLocationsMap from "../components/BusinessLocationsMap";
import "../project.css";

function canEditProject(project, currentUser) {
    if (!currentUser) return false;
    if (currentUser.role === "admin") return true;
    const uid = String(currentUser._id);

    if (currentUser.role === "operations_officer") {
        const opsId = String(project.assignedOperationsOfficer?._id || project.assignedOperationsOfficer || "");
        return opsId === uid;
    }
    if (currentUser.role === "manager") {
        const mgrId = String(project.assignedManager?._id || project.assignedManager || "");
        return mgrId === uid;
    }
    if (currentUser.role === "accounts_officer") {
        const accId = String(project.assignedAccountsOfficer?._id || project.assignedAccountsOfficer || "");
        return accId === uid;
    }
    return false;
}

function ProjectList() {
    const { user } = useAuth();
    const isClientRole = user?.role === "client";

    const [projects, setProjects] = useState([]);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [viewMode, setViewMode] = useState("table");

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const response = await getProjects();
            setProjects(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this project?")) return;
        try {
            await deleteProject(id);
            loadProjects();
        } catch (error) {
            console.error(error);
        }
    };

    const handleManagerApprove = async (id) => {
        if (!window.confirm("Approve project completion as Manager and forward to Finance for dues clearance?")) return;
        try {
            const res = await approveProjectByManager(id);
            alert(res.data.message || "Project approved by Manager!");
            loadProjects();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to approve project as Manager");
        }
    };

    const handleFinanceApprove = async (id) => {
        if (!window.confirm("Clear all financial dues and mark project as DELIVERED?")) return;
        try {
            const res = await approveProjectByFinance(id);
            alert(res.data.message || "Finance dues cleared and project marked DELIVERED!");
            loadProjects();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to approve finance clearance");
        }
    };

    const filteredProjects = projects.filter((project) =>
        project.projectName?.toLowerCase().includes(search.toLowerCase()) ||
        project.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        project.projectLocation?.toLowerCase().includes(search.toLowerCase())
    );

    const canDelete = user?.role === "admin" || user?.role === "manager";

    return (
        <div className="project-page">
            <div className="page-header" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "15px" }}>
                <div>
                    <h1 style={{ margin: 0 }}>{isClientRole ? "My Projects" : "Projects Directory"}</h1>
                    <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "14px" }}>
                        {isClientRole
                            ? "View your assigned contractor projects, deadlines, and project site locations on Google Maps."
                            : "Browse all contractor projects. Edit access is granted for projects assigned to your operational role."}
                    </p>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <div style={{
                        display: "flex",
                        background: "#f1f5f9",
                        padding: "3px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1"
                    }}>
                        <button
                            type="button"
                            onClick={() => setViewMode("table")}
                            style={{
                                padding: "8px 14px",
                                borderRadius: "8px",
                                border: "none",
                                background: viewMode === "table" ? "#2563eb" : "transparent",
                                color: viewMode === "table" ? "white" : "#475569",
                                fontWeight: "700",
                                fontSize: "13px",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            📋 Table View
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("map")}
                            style={{
                                padding: "8px 14px",
                                borderRadius: "8px",
                                border: "none",
                                background: viewMode === "map" ? "#2563eb" : "transparent",
                                color: viewMode === "map" ? "white" : "#475569",
                                fontWeight: "700",
                                fontSize: "13px",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            🗺️ Locations Map View
                        </button>
                    </div>

                    {(user?.role === "admin" || user?.role === "manager") && (
                        <button
                            onClick={() => {
                                setSelectedProject(null);
                                setShowForm(true);
                            }}
                        >
                            + New Project
                        </button>
                    )}
                </div>
            </div>

            {viewMode === "map" && (
                <BusinessLocationsMap
                    onSelectProject={(proj) => {
                        if (canEditProject(proj, user)) {
                            setSelectedProject(proj);
                            setShowForm(true);
                        }
                    }}
                />
            )}

            {viewMode === "table" && (
                <>
                    <input
                        className="search-box"
                        placeholder="Search projects, clients, locations...."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <table>
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Project & Role Badge</th>
                                <th>Client</th>
                                <th>Site Location</th>
                                <th>Progress & Milestones</th>
                                <th>Deadline</th>
                                <th>Budget</th>
                                <th>Status</th>
                                {!isClientRole && <th>Action</th>}
                            </tr>
                        </thead>

                        <tbody>
                            {filteredProjects.map((project, index) => {
                                const isEditable = canEditProject(project, user);
                                const progressPct = project.progressPercentage || 0;
                                const isLogistics = user?.role === "operations_officer" || user?.role === "admin";

                                return (
                                    <tr key={project._id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <a href={`/projects/${project._id}`} style={{ fontWeight: "700", color: "#2563eb" }}>
                                                {project.projectName}
                                            </a>
                                            {isEditable && user?.role !== "admin" && (
                                                <span style={{ display: "block", fontSize: "10px", fontWeight: "700", color: "#059669", marginTop: "2px" }}>
                                                    ★ Assigned to You
                                                </span>
                                            )}
                                        </td>
                                        <td>{project.clientName}</td>
                                        <td>
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                                📍 {project.projectLocation || "Dhaka Site"}
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.projectLocation || project.projectName)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="Open in Google Maps"
                                                    style={{ textDecoration: "none", fontSize: "12px" }}
                                                >
                                                    ↗
                                                </a>
                                            </span>
                                        </td>

                                        {/* Progress & Milestone Tracking Column */}
                                        <td style={{ minWidth: "160px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "700", marginBottom: "4px" }}>
                                                <span style={{ color: progressPct >= 100 ? "#059669" : "#2563eb" }}>
                                                    {progressPct}% Complete
                                                </span>
                                                <span style={{ color: "#64748b", fontSize: "10px" }}>
                                                    {progressPct >= 100 ? "Handover" : progressPct >= 75 ? "75% MEP" : progressPct >= 50 ? "50% Structure" : progressPct >= 25 ? "25% Substructure" : "Planning"}
                                                </span>
                                            </div>
                                            <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                                                <div style={{
                                                    width: `${progressPct}%`,
                                                    height: "100%",
                                                    background: progressPct >= 100
                                                        ? "#10b981"
                                                        : project.hasActiveDelay
                                                            ? "#f59e0b"
                                                            : "#2563eb",
                                                    borderRadius: "999px"
                                                }} />
                                            </div>
                                            {project.hasActiveDelay && (
                                                <span style={{ display: "inline-block", fontSize: "10px", color: "#b45309", fontWeight: "700", marginTop: "4px", background: "#fef3c7", padding: "1px 6px", borderRadius: "4px" }}>
                                                    ⚠️ Delayed
                                                </span>
                                            )}
                                        </td>

                                        <td>{new Date(project.deadline).toLocaleDateString()}</td>
                                        <td>BDT {Number(project.budget || 0).toLocaleString()}</td>
                                        <td>
                                            <span className={`status ${(project.status || "pending").toLowerCase().replace(/\s+/g, '-')}`}>
                                                {project.status === "Delivered" ? "🚀 Delivered" : project.status}
                                            </span>
                                        </td>
                                        {!isClientRole && (
                                            <td>
                                                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
                                                    {isLogistics && project.status !== "Delivered" && (
                                                        <a
                                                            href={`/projects/${project._id}`}
                                                            style={{
                                                                padding: "4px 8px",
                                                                background: "#059669",
                                                                color: "#fff",
                                                                borderRadius: "6px",
                                                                textDecoration: "none",
                                                                fontSize: "11px",
                                                                fontWeight: "700",
                                                                display: "inline-flex",
                                                                alignItems: "center"
                                                            }}
                                                        >
                                                            ⚡ Progress
                                                        </a>
                                                    )}

                                                    {(user?.role === "manager" || user?.role === "admin") && (project.progressPercentage >= 100 || project.status === "Completed") && !project.managerApproved && (
                                                        <button
                                                            onClick={() => handleManagerApprove(project._id)}
                                                            style={{ padding: "4px 8px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}
                                                        >
                                                            👨‍💼 Approve Manager
                                                        </button>
                                                    )}

                                                    {(user?.role === "accounts_officer" || user?.role === "admin") && project.managerApproved && !project.financeApproved && (
                                                        <button
                                                            onClick={() => handleFinanceApprove(project._id)}
                                                            style={{ padding: "4px 8px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}
                                                        >
                                                            💳 Approve Dues
                                                        </button>
                                                    )}

                                                    {isEditable && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedProject(project);
                                                                setShowForm(true);
                                                            }}
                                                            style={{ padding: "4px 8px", fontSize: "11px" }}
                                                        >
                                                            Edit
                                                        </button>
                                                    )}

                                                    <a
                                                        href={`/projects/${project._id}`}
                                                        style={{
                                                            padding: "4px 8px",
                                                            background: "#f1f5f9",
                                                            color: "#2563eb",
                                                            border: "1px solid #cbd5e1",
                                                            borderRadius: "6px",
                                                            textDecoration: "none",
                                                            fontSize: "11px",
                                                            fontWeight: "700"
                                                        }}
                                                    >
                                                        👁️ Details
                                                    </a>

                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDelete(project._id)}
                                                            style={{ padding: "4px 8px", fontSize: "11px" }}
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                            {filteredProjects.length === 0 && (
                                <tr>
                                    <td colSpan={isClientRole ? "7" : "8"} style={{ textAlign: "center", padding: "24px", color: "#94a3b8" }}>
                                        No projects found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </>
            )}

            {showForm && !isClientRole && (
                <ProjectForm
                    closeForm={() => {
                        setShowForm(false);
                        setSelectedProject(null);
                    }}
                    refreshProjects={loadProjects}
                    selectedProject={selectedProject}
                />
            )}
        </div>
    );
}

export default ProjectList;