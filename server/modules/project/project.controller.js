const mongoose = require("mongoose");
const Project = require("./project.model");
const Client = require("../client/client.model");
const Quotation = require("../quotation/quotation.model");
const User = require("../auth/user.model");
const { sendNotificationEmail } = require("../invoice/emailService");

const populateProject = (query) => query
    .populate("assignedOperationsOfficer", "name email phone role")
    .populate("assignedManager", "name email phone role")
    .populate("assignedAccountsOfficer", "name email phone role")
    .populate("managerApprovedBy", "name email role")
    .populate("financeApprovedBy", "name email role")
    .populate("progressUpdates.updatedBy", "name email role")
    .populate("progressUpdates.reviewedBy", "name email role");

exports.createProject = async (req, res) => {
    try {
        const {
            projectName,
            clientName,
            startDate,
            deadline,
            budget,
            assignedEmployee,
            assignedOperationsOfficer,
            assignedManager,
            assignedAccountsOfficer,
            status,
            description,
            projectLocation
        } = req.body;

        if (deadline && startDate && new Date(deadline) < new Date(startDate)) {
            return res.status(400).json({ message: "Deadline cannot be before Start Date" });
        }

        const project = await Project.create({
            projectName,
            clientName,
            startDate,
            deadline,
            budget,
            assignedEmployee: assignedEmployee || "Unassigned",
            ...(assignedOperationsOfficer ? { assignedOperationsOfficer } : {}),
            ...(assignedManager ? { assignedManager } : {}),
            ...(assignedAccountsOfficer ? { assignedAccountsOfficer } : {}),
            status: status || "Pending",
            description: description || "",
            projectLocation: (projectLocation || "").trim() || "Dhaka Site",
            createdBy: req.user?._id
        });

        return res.status(201).json(await populateProject(Project.findById(project._id)));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.getProjects = async (req, res) => {
    try {
        // 1. Clean up duplicate project records in MongoDB
        const allProjs = await Project.find({}).sort({ createdAt: -1 });
        const dbKeys = new Set();
        for (const p of allProjs) {
            const key = `${(p.projectName || "").trim().toLowerCase()}_${(p.clientName || "").trim().toLowerCase()}`;
            if (dbKeys.has(key)) {
                await Project.findByIdAndDelete(p._id);
            } else {
                dbKeys.add(key);
            }
        }

        // 2. Auto-sync: Link or backfill approved quotations cleanly without creating duplicates
        const approvedQuotations = await Quotation.find({ status: "Approved" }).lean();
        for (const q of approvedQuotations) {
            let clientName = "Client";
            if (q.client) {
                const cDoc = await Client.findById(q.client).lean();
                if (cDoc) clientName = cDoc.companyName || cDoc.contactPerson || cDoc.name || clientName;
            }

            const titleToMatch = (q.title || "").trim();
            let existingProject = await Project.findOne({
                $or: [
                    { quotation: q._id },
                    { projectName: new RegExp(`^${titleToMatch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }
                ]
            });

            if (!existingProject) {
                const startDate = new Date();
                const deadline = new Date();
                deadline.setMonth(deadline.getMonth() + 6);

                await Project.create({
                    projectName: q.title || `Construction Project (${q.quotationNumber})`,
                    clientName: clientName,
                    startDate: startDate,
                    deadline: deadline,
                    budget: q.total || 0,
                    projectLocation: q.constructionSiteLocation || "Dhaka Site",
                    status: "Running",
                    description: `Approved building proposal (${q.selectedTier ? q.selectedTier.toUpperCase() + ' Tier' : 'Standard Tier'}). Location: ${q.constructionSiteLocation || 'Site Unspecified'}.`,
                    quotation: q._id,
                    client: q.client,
                    createdBy: q.createdBy
                });
            } else {
                let updated = false;
                if (!existingProject.quotation) { existingProject.quotation = q._id; updated = true; }
                if (!existingProject.client && q.client) { existingProject.client = q.client; updated = true; }
                if (q.constructionSiteLocation && existingProject.projectLocation !== q.constructionSiteLocation) {
                    existingProject.projectLocation = q.constructionSiteLocation;
                    updated = true;
                }
                if (q.total && existingProject.budget !== q.total) {
                    existingProject.budget = q.total;
                    updated = true;
                }
                if (updated) await existingProject.save();
            }
        }

        const filter = {};
        if (req.user?.role === "client") {
            const clientDoc = await Client.findOne({ email: req.user.email });
            const searchNames = [req.user.name];
            if (clientDoc?.companyName) searchNames.push(clientDoc.companyName);
            if (clientDoc?.contactPerson) searchNames.push(clientDoc.contactPerson);

            const regexes = searchNames.map((n) => new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
            const conditions = [
                { clientName: { $in: regexes } },
                { createdBy: req.user._id }
            ];
            if (clientDoc) {
                conditions.push({ client: clientDoc._id });
            }
            filter.$or = conditions;
        }

        const rawProjects = await populateProject(Project.find(filter).sort({ createdAt: -1 }));

        // 3. Deduplicate in-memory before returning response
        const uniqueProjects = [];
        const returnedIds = new Set();
        const returnedNames = new Set();

        for (const proj of rawProjects) {
            const pId = String(proj._id);
            const nameKey = `${(proj.projectName || "").trim().toLowerCase()}_${(proj.clientName || "").trim().toLowerCase()}`;
            if (!returnedIds.has(pId) && !returnedNames.has(nameKey)) {
                returnedIds.add(pId);
                returnedNames.add(nameKey);
                uniqueProjects.push(proj);
            }
        }

        return res.status(200).json(uniqueProjects);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.getProjectById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid project ID" });
        }
        const project = await populateProject(Project.findById(req.params.id));
        if (!project) return res.status(404).json({ message: "Project not found" });
        return res.status(200).json(project);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.updateProject = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid project ID" });
        }

        const existing = await Project.findById(req.params.id);
        if (!existing) return res.status(404).json({ message: "Project not found" });

        const userRole = req.user?.role;
        const userId = String(req.user?._id);

        if (userRole !== "admin") {
            let isAssigned = false;
            if (userRole === "operations_officer" && String(existing.assignedOperationsOfficer) === userId) isAssigned = true;
            if (userRole === "manager" && String(existing.assignedManager) === userId) isAssigned = true;
            if (userRole === "accounts_officer" && String(existing.assignedAccountsOfficer) === userId) isAssigned = true;

            if (!isAssigned) {
                return res.status(403).json({
                    message: "Forbidden: You are only authorized to update projects directly assigned to your role team."
                });
            }
        }

        let allowed = [
            "projectName", "clientName", "startDate", "deadline", "budget",
            "assignedEmployee", "assignedOperationsOfficer", "assignedManager",
            "assignedAccountsOfficer", "status", "description", "projectLocation"
        ];

        if (userRole === "operations_officer") {
            allowed = ["status", "description", "projectLocation"];
        } else if (userRole === "accounts_officer") {
            allowed = ["budget", "status", "description"];
        }

        const updateData = {};
        allowed.forEach((field) => {
            if (req.body[field] !== undefined) updateData[field] = req.body[field];
        });

        if (updateData.deadline && updateData.startDate && new Date(updateData.deadline) < new Date(updateData.startDate)) {
            return res.status(400).json({ message: "Deadline cannot be before Start Date" });
        }

        const project = await Project.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after', runValidators: true });
        return res.status(200).json(await populateProject(Project.findById(project._id)));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid project ID" });
        }
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found" });
        return res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// 5. Update Project Progress & Delays with Photo Verification (Logistics & Operations Officer ONLY)
// Requires live site photo proof (Base64) and submits for Manager Approval
exports.updateProjectProgress = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid project ID" });
        }

        const project = await Project.findById(req.params.id)
            .populate("assignedManager")
            .populate("assignedOperationsOfficer")
            .populate("client");

        if (!project) return res.status(404).json({ message: "Project not found" });

        const userRole = req.user?.role;

        if (userRole !== "admin" && userRole !== "operations_officer") {
            return res.status(403).json({
                message: "Access Denied: Only Logistics & Operations Officers can submit and record project progress updates."
            });
        }

        const {
            percentage,
            stageName,
            monthName,
            updateNotes = "",
            isDelayed = false,
            delayReason = "",
            delayImpactDays = 0,
            photos = []
        } = req.body;

        const newPercent = Number(percentage);
        if (isNaN(newPercent) || newPercent < 0 || newPercent > 100) {
            return res.status(400).json({ message: "Progress percentage must be a number between 0 and 100." });
        }

        if (!stageName || !stageName.trim()) {
            return res.status(400).json({ message: "Current stage name is required." });
        }

        if (isDelayed && (!delayReason || !delayReason.trim())) {
            return res.status(400).json({ message: "A reason must be recorded whenever a delay is reported." });
        }

        // Validate that photo proof is attached (Base64 or URL)
        let formattedPhotos = [];
        if (Array.isArray(photos) && photos.length > 0) {
            formattedPhotos = photos.map(p => typeof p === "string" ? { url: p, caption: stageName.trim() } : { url: p.url, caption: p.caption || stageName.trim() });
        } else if (typeof photos === "string" && photos.trim()) {
            formattedPhotos = [{ url: photos.trim(), caption: stageName.trim() }];
        }

        if (formattedPhotos.length === 0) {
            return res.status(400).json({
                message: "Site verification photo is required. Please upload at least one progress photo to prevent unverified updates."
            });
        }

        // Determine derived or provided month
        const targetMonth = monthName && monthName.trim()
            ? monthName.trim()
            : new Date().toLocaleString("default", { month: "long" });

        // Calculate milestone flags for this target percentage
        const milestoneCheckpoints = [25, 50, 75, 100];
        const newlyCrossedMilestones = [];
        const existingMilestones = project.milestonesPassed || [];
        for (const ms of milestoneCheckpoints) {
            if (newPercent >= ms && !existingMilestones.includes(ms)) {
                newlyCrossedMilestones.push(ms);
            }
        }

        let managerNotified = false;
        let managerNotifiedAt = null;

        // Notify Assigned Manager for Photo Review
        let managerUser = project.assignedManager;
        if (!managerUser) {
            managerUser = await User.findOne({ role: "manager", isActive: true });
        }

        if (managerUser?.email) {
            await sendNotificationEmail({
                recipient: managerUser.email,
                subject: `📸 [Photo Verification Needed] Project "${project.projectName}" - ${newPercent}% (${stageName.trim()})`,
                emailType: "Progress Photo Verification Alert",
                referenceId: project._id.toString(),
                referenceModel: "Project",
                bodyText: `Dear Project Manager (${managerUser.name || 'Manager'}),

A new construction progress update with live site photo proof has been submitted by Logistics Officer (${req.user.name}) and requires your verification and sign-off.

• Project: ${project.projectName}
• Target Progress: ${newPercent}%
• Month: ${targetMonth}
• Stage: ${stageName.trim()}
• Status: ${isDelayed ? '⚠️ DELAYED: ' + delayReason.trim() + ' (Impact: +' + delayImpactDays + ' days)' : '✅ ON SCHEDULE'}
• Photos Attached: ${formattedPhotos.length} site proof photo(s)
• Field Remarks: ${updateNotes.trim() || 'No additional notes provided.'}
• Submitted At: ${new Date().toLocaleString()}

Please open the Project Details page to inspect the photos, compare with previous milestone stages, and approve or request correction.`,
                userId: req.user._id
            });

            managerNotified = true;
            managerNotifiedAt = new Date();
        }

        const updateEntry = {
            percentage: newPercent,
            stageName: stageName.trim(),
            monthName: targetMonth,
            updateNotes: updateNotes.trim(),
            photos: formattedPhotos,
            isDelayed: Boolean(isDelayed),
            delayReason: isDelayed ? delayReason.trim() : "",
            delayImpactDays: isDelayed ? Number(delayImpactDays || 0) : 0,
            milestonesTriggered: newlyCrossedMilestones,
            status: "Pending Approval",
            managerNote: "",
            rejectionReason: "",
            managerNotified,
            managerNotifiedAt,
            clientNotified: false,
            updatedBy: req.user._id,
            timestamp: new Date()
        };

        if (!project.progressUpdates) project.progressUpdates = [];
        project.progressUpdates.unshift(updateEntry);

        // Recalculate pending progress count
        project.pendingProgressCount = project.progressUpdates.filter(u => u.status === "Pending Approval").length;
        await project.save();

        return res.status(200).json({
            message: `Progress photo update (${newPercent}% - ${stageName}) submitted successfully! Forwarded to Manager for verification and approval.`,
            project: await populateProject(Project.findById(project._id))
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// 5b. Manager Review (Approve / Reject) Construction Progress Photo Update
// When approved: officially updates project progress, adds milestone, and notifies Client with live proof.
// When rejected: requires explanatory reason note, notifies Logistics Officer to correct and resubmit.
exports.reviewProgressUpdate = async (req, res) => {
    try {
        const { id, updateId } = req.params;
        const { action, managerNote = "", rejectionReason = "" } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(updateId)) {
            return res.status(400).json({ message: "Invalid project ID or update ID" });
        }

        const userRole = req.user?.role;
        if (userRole !== "admin" && userRole !== "manager") {
            return res.status(403).json({
                message: "Access Denied: Only Project Managers and Admins can verify and approve construction progress photos."
            });
        }

        const project = await Project.findById(id)
            .populate("assignedManager")
            .populate("assignedOperationsOfficer")
            .populate("client");

        if (!project) return res.status(404).json({ message: "Project not found" });

        const updateItem = project.progressUpdates.id(updateId);
        if (!updateItem) return res.status(404).json({ message: "Progress update record not found" });

        if (action === "Reject") {
            const reason = (rejectionReason || managerNote || "").trim();
            if (!reason) {
                return res.status(400).json({
                    message: "A clear rejection reason / note is required explaining what must be corrected by the Logistics Officer."
                });
            }

            updateItem.status = "Rejected";
            updateItem.reviewedBy = req.user._id;
            updateItem.reviewedAt = new Date();
            updateItem.rejectionReason = reason;
            updateItem.managerNote = reason;

            // Recalculate pending count
            project.pendingProgressCount = project.progressUpdates.filter(u => u.status === "Pending Approval").length;
            await project.save();

            // Find logistics officer to notify
            let opsUser = null;
            if (updateItem.updatedBy) {
                opsUser = await User.findById(updateItem.updatedBy);
            }
            if (!opsUser) opsUser = project.assignedOperationsOfficer;

            if (opsUser?.email) {
                await sendNotificationEmail({
                    recipient: opsUser.email,
                    subject: `❌ [Correction Required] Progress Update Rejected: "${project.projectName}"`,
                    emailType: "Progress Verification Rejection Alert",
                    referenceId: project._id.toString(),
                    referenceModel: "Project",
                    bodyText: `Dear Logistics Officer (${opsUser.name || 'Logistics Officer'}),

Your submitted progress update for project "${project.projectName}" (${updateItem.percentage}% - ${updateItem.stageName}) was NOT approved by Manager (${req.user.name}).

• Reason / Correction Note: "${reason}"
• Stage: ${updateItem.stageName}
• Review Date: ${new Date().toLocaleString()}

Please correct the site progress documentation, capture an updated/clearer photo proof if required, and resubmit the update.`,
                    userId: req.user._id
                });
            }

            return res.status(200).json({
                message: "Progress update rejected. Rejection note recorded and Logistics Officer has been notified to correct and resubmit.",
                project: await populateProject(Project.findById(project._id))
            });
        }

        if (action === "Approve") {
            updateItem.status = "Approved";
            updateItem.reviewedBy = req.user._id;
            updateItem.reviewedAt = new Date();
            updateItem.managerNote = (managerNote || "Approved with verified site photo proof").trim();
            updateItem.rejectionReason = "";

            // Officially apply approved progress to project
            const newPercent = updateItem.percentage;
            project.progressPercentage = newPercent;
            project.currentStage = updateItem.stageName;

            if (updateItem.photos && updateItem.photos.length > 0) {
                project.latestVerifiedPhoto = updateItem.photos[0].url;
            }

            // Milestone checkpoints
            const milestoneCheckpoints = [25, 50, 75, 100];
            const newlyCrossed = [];
            const existingMilestones = project.milestonesPassed || [];
            for (const ms of milestoneCheckpoints) {
                if (newPercent >= ms && !existingMilestones.includes(ms)) {
                    newlyCrossed.push(ms);
                    existingMilestones.push(ms);
                }
            }
            project.milestonesPassed = existingMilestones;

            if (newPercent >= 100) {
                project.status = "Completed";
            } else if (updateItem.isDelayed) {
                project.hasActiveDelay = true;
                project.latestDelayReason = updateItem.delayReason;
                project.totalDelayDays = (project.totalDelayDays || 0) + Number(updateItem.delayImpactDays || 0);
            } else {
                project.hasActiveDelay = false;
                project.latestDelayReason = "";
            }

            // Client Notification with Live Proof
            let clientEmail = project.client?.email;
            if (!clientEmail) {
                const clientDoc = await Client.findOne({ companyName: project.clientName });
                clientEmail = clientDoc?.email;
            }

            if (clientEmail) {
                await sendNotificationEmail({
                    recipient: clientEmail,
                    subject: `🏗️ [Verified Site Update] "${project.projectName}" reached ${newPercent}% (${updateItem.stageName})!`,
                    emailType: "Client Progress Verification Notice",
                    referenceId: project._id.toString(),
                    referenceModel: "Project",
                    bodyText: `Dear Valued Client (${project.clientName}),

We are pleased to share the latest verified construction milestone for your project "${project.projectName}".

• Verified Overall Progress: ${newPercent}%
• Month: ${updateItem.monthName || new Date().toLocaleString("default", { month: "long" })}
• Current Construction Stage: ${updateItem.stageName}
• Manager Verification: ✅ Verified & Signed Off by Project Manager (${req.user.name})
• Live Site Photo Proof: Attached & Verified in your Client Dashboard
• Verification Remarks: ${updateItem.managerNote || 'Inspected on-site; matches architectural drawings and quality standards.'}
• Timestamp: ${new Date().toLocaleString()}

You can log in to your CPS Client Dashboard anytime to view the full chronological photo timeline, compare site photos side-by-side, and track real-time project progress.`,
                    userId: req.user._id
                });

                updateItem.clientNotified = true;
                updateItem.clientNotifiedAt = new Date();
            }

            // Recalculate pending count
            project.pendingProgressCount = project.progressUpdates.filter(u => u.status === "Pending Approval").length;
            await project.save();

            return res.status(200).json({
                message: `Progress update (${newPercent}% - ${updateItem.stageName}) verified & approved! Client has been notified with live photo proof.`,
                project: await populateProject(Project.findById(project._id))
            });
        }

        return res.status(400).json({ message: "Invalid action. Must be 'Approve' or 'Reject'." });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// 6. Manager Approval for 100% Completed Project
exports.approveManager = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid project ID" });
        }

        const project = await Project.findById(req.params.id)
            .populate("assignedAccountsOfficer")
            .populate("client");

        if (!project) return res.status(404).json({ message: "Project not found" });

        const userRole = req.user?.role;
        if (userRole !== "admin" && userRole !== "manager") {
            return res.status(403).json({ message: "Access Denied: Only Managers and Admins can approve project completion." });
        }

        if (project.progressPercentage < 100 && project.status !== "Completed") {
            return res.status(400).json({ message: "Cannot approve: Project progress must be 100% complete by Logistics first." });
        }

        project.managerApproved = true;
        project.managerApprovedAt = new Date();
        project.managerApprovedBy = req.user._id;
        project.status = "Manager Approved";

        await project.save();

        // Send email alert to Accounts/Finance Officer for dues clearance
        let accountsUser = project.assignedAccountsOfficer;
        if (!accountsUser) {
            accountsUser = await User.findOne({ role: "accounts_officer", isActive: true });
        }

        if (accountsUser?.email) {
            await sendNotificationEmail({
                recipient: accountsUser.email,
                subject: `💳 [Finance Action Needed] Manager Approved Project "${project.projectName}"`,
                emailType: "Finance Dues Clearance Alert",
                referenceId: project._id.toString(),
                referenceModel: "Project",
                bodyText: `Dear Finance / Accounts Officer (${accountsUser.name || 'Finance Officer'}),

Project "${project.projectName}" has been officially APPROVED by Project Manager (${req.user.name}) following 100% completion by Logistics.

• Client: ${project.clientName}
• Current Status: Manager Approved / Awaiting Finance Dues Clearance
• Budget: BDT ${Number(project.budget || 0).toLocaleString()}
• Manager Approval Date: ${new Date().toLocaleString()}

Please inspect billing dues and issue final approval to mark this project as DELIVERED.`,
                userId: req.user._id
            });
        }

        return res.status(200).json({
            message: "Project successfully approved by Manager! Sent notification to Finance Officer for dues clearance.",
            project: await populateProject(Project.findById(project._id))
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// 7. Finance Dues Clearance & Final Delivery Approval
exports.approveFinance = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid project ID" });
        }

        const project = await Project.findById(req.params.id)
            .populate("client");

        if (!project) return res.status(404).json({ message: "Project not found" });

        const userRole = req.user?.role;
        if (userRole !== "admin" && userRole !== "accounts_officer") {
            return res.status(403).json({ message: "Access Denied: Only Accounts/Finance Officers and Admins can clear dues and approve delivery." });
        }

        if (!project.managerApproved) {
            return res.status(400).json({ message: "Cannot approve: Manager approval is required prior to Finance dues clearance." });
        }

        project.financeApproved = true;
        project.financeApprovedAt = new Date();
        project.financeApprovedBy = req.user._id;
        project.duesCleared = true;
        project.status = "Delivered";

        await project.save();

        // Notify Client if email available
        if (project.client?.email) {
            await sendNotificationEmail({
                recipient: project.client.email,
                subject: `🎉 Project Delivered: "${project.projectName}" has been successfully delivered!`,
                emailType: "Project Delivery Confirmation",
                referenceId: project._id.toString(),
                referenceModel: "Project",
                bodyText: `Dear ${project.clientName},

We are thrilled to inform you that your construction project "${project.projectName}" has completed all site work, manager quality checks, and financial clearances.

Status: SUCCESSFULLY DELIVERED 🚀

Thank you for partnering with us. You can access your project records on your client dashboard anytime.`,
                userId: req.user._id
            });
        }

        return res.status(200).json({
            message: "Finance dues cleared & project successfully marked as DELIVERED!",
            project: await populateProject(Project.findById(project._id))
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};