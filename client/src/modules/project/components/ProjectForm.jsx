import { useState, useEffect } from "react";
import API from "../../../api/axiosConfig";
import { createProject, updateProject } from "../projectApi";
import "../project.css";

function ProjectForm({ closeForm, refreshProjects, selectedProject }) {
    const [formData, setFormData] = useState({
        projectName: "",
        clientName: "",
        startDate: "",
        deadline: "",
        budget: "",
        assignedEmployee: "Unassigned",
        assignedOperationsOfficer: "",
        assignedManager: "",
        assignedAccountsOfficer: "",
        status: "Pending",
        description: "",
        projectLocation: ""
    });

    const [users, setUsers] = useState([]);

    useEffect(() => {
        let active = true;
        API.get("/admin/users")
            .then(({ data }) => {
                if (active && Array.isArray(data)) setUsers(data);
            })
            .catch(() => {});

        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (selectedProject) {
            setFormData({
                projectName: selectedProject.projectName || "",
                clientName: selectedProject.clientName || "",
                startDate: selectedProject.startDate ? selectedProject.startDate.slice(0, 10) : "",
                deadline: selectedProject.deadline ? selectedProject.deadline.slice(0, 10) : "",
                budget: selectedProject.budget || "",
                assignedEmployee: selectedProject.assignedEmployee || "Unassigned",
                assignedOperationsOfficer: selectedProject.assignedOperationsOfficer?._id || selectedProject.assignedOperationsOfficer || "",
                assignedManager: selectedProject.assignedManager?._id || selectedProject.assignedManager || "",
                assignedAccountsOfficer: selectedProject.assignedAccountsOfficer?._id || selectedProject.assignedAccountsOfficer || "",
                status: selectedProject.status || "Pending",
                description: selectedProject.description || "",
                projectLocation: selectedProject.projectLocation || ""
            });
        }
    }, [selectedProject]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const start = new Date(formData.startDate);
        const end = new Date(formData.deadline);

        if (end < start) {
            alert("Deadline cannot be before Start Date!");
            return;
        }

        try {
            if (selectedProject) {
                await updateProject(selectedProject._id, formData);
            } else {
                await createProject(formData);
            }
            refreshProjects();
            closeForm();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Unable to save project.");
        }
    };

    const opsUsers = users.filter((u) => u.role === "operations_officer" || u.role === "staff" || u.role === "admin");
    const managerUsers = users.filter((u) => u.role === "manager" || u.role === "admin");
    const accountsUsers = users.filter((u) => u.role === "accounts_officer" || u.role === "admin");

    return (
        <div className="modal-overlay">
            <div className="project-modal" style={{ maxWidth: "620px" }}>
                <h2>{selectedProject ? "Edit Project & Team Assignment" : "Add Accepted Project & Role Team"}</h2>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <label>
                        Project Title *
                        <input
                            name="projectName"
                            placeholder="e.g. Dhaka Substation Construction Phase 2"
                            value={formData.projectName}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label>
                        Client / Owner Name *
                        <input
                            name="clientName"
                            placeholder="e.g. Dhaka Mass Transit Company Ltd"
                            value={formData.clientName}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        <label>
                            Start Date *
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                            />
                        </label>
                        <label>
                            Target Deadline *
                            <input
                                type="date"
                                name="deadline"
                                value={formData.deadline}
                                onChange={handleChange}
                                required
                            />
                        </label>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        <label>
                            Total Budget ($) *
                            <input
                                type="number"
                                name="budget"
                                placeholder="e.g. 250000"
                                value={formData.budget}
                                onChange={handleChange}
                                required
                            />
                        </label>
                        <label>
                            Project Status *
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Running">Running</option>
                                <option value="Completed">Completed</option>
                                <option value="On Hold">On Hold</option>
                            </select>
                        </label>
                    </div>

                    {/* 3 OPERATIONAL ROLE ASSIGNMENT CARD */}
                    <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "14px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <strong style={{ fontSize: "13px", color: "#0f172a" }}>Assign Operational Team (3 Mandatory Roles)</strong>
                            <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: "700" }}>3 Roles</span>
                        </div>

                        <label>
                            👷 Operations Officer (Field & Tracking):
                            <select
                                name="assignedOperationsOfficer"
                                value={formData.assignedOperationsOfficer}
                                onChange={handleChange}
                            >
                                <option value="">Select Operations Officer</option>
                                {opsUsers.map((u) => (
                                    <option key={u._id} value={u._id}>
                                        {u.name} ({u.role}) — {u.email}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            👨‍💼 Project Manager (Supervision):
                            <select
                                name="assignedManager"
                                value={formData.assignedManager}
                                onChange={handleChange}
                            >
                                <option value="">Select Project Manager</option>
                                {managerUsers.map((u) => (
                                    <option key={u._id} value={u._id}>
                                        {u.name} ({u.role}) — {u.email}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            💳 Accounts Officer (Billing & PO Costing):
                            <select
                                name="assignedAccountsOfficer"
                                value={formData.assignedAccountsOfficer}
                                onChange={handleChange}
                            >
                                <option value="">Select Accounts Officer</option>
                                {accountsUsers.map((u) => (
                                    <option key={u._id} value={u._id}>
                                        {u.name} ({u.role}) — {u.email}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <label>
                        Project Site Location (Google Maps Coordinates) *
                        <input
                            name="projectLocation"
                            placeholder="Site Address / City (e.g. Gulshan 2, Dhaka)"
                            value={formData.projectLocation}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label>
                        Project Scope & Specifications
                        <textarea
                            name="description"
                            rows="3"
                            placeholder="Enter project details, blueprints, and milestone goals..."
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </label>

                    <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "10px" }}>
                        <button type="button" className="button ghost" onClick={closeForm}>
                            Cancel
                        </button>
                        <button type="submit" className="button primary">
                            Save Project & Team
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ProjectForm;