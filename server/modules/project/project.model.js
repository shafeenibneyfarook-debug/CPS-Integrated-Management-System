const mongoose = require("mongoose");

const progressPhotoSchema = new mongoose.Schema({
    url: {
        type: String, // Base64 data URL or external URL
        required: [true, "Progress photo URL or Base64 is required"]
    },
    caption: {
        type: String,
        trim: true,
        default: ""
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const progressUpdateSchema = new mongoose.Schema({
    percentage: {
        type: Number,
        required: [true, "Progress percentage is required"],
        min: 0,
        max: 100
    },
    stageName: {
        type: String,
        required: [true, "Stage name is required"],
        trim: true
    },
    monthName: {
        type: String,
        trim: true,
        default: () => new Date().toLocaleString("default", { month: "long" })
    },
    updateNotes: {
        type: String,
        trim: true,
        default: ""
    },
    photos: [progressPhotoSchema],
    isDelayed: {
        type: Boolean,
        default: false
    },
    delayReason: {
        type: String,
        trim: true,
        default: ""
    },
    delayImpactDays: {
        type: Number,
        default: 0,
        min: 0
    },
    milestonesTriggered: {
        type: [Number], // e.g. [25], [50], [75], [100]
        default: []
    },

    // Verification & Approval Workflow
    status: {
        type: String,
        enum: ["Pending Approval", "Approved", "Rejected"],
        default: "Pending Approval"
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    },
    managerNote: {
        type: String,
        trim: true,
        default: ""
    },
    rejectionReason: {
        type: String,
        trim: true,
        default: ""
    },

    managerNotified: {
        type: Boolean,
        default: false
    },
    managerNotifiedAt: {
        type: Date,
        default: null
    },
    clientNotified: {
        type: Boolean,
        default: false
    },
    clientNotifiedAt: {
        type: Date,
        default: null
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const projectSchema = new mongoose.Schema({
    projectName: {
        type: String,
        required: true
    },
    clientName: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    deadline: {
        type: Date,
        required: true
    },
    budget: {
        type: Number,
        required: true
    },
    assignedEmployee: {
        type: String,
        default: "Unassigned"
    },

    // 3 Assigned Operational Team Roles
    assignedOperationsOfficer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    assignedManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    assignedAccountsOfficer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    status: {
        type: String,
        enum: ["Pending", "Running", "Completed", "On Hold", "Manager Approved", "Awaiting Finance Clearance", "Delivered"],
        default: "Pending"
    },

    // Multi-stage Approval & Delivery Workflow (Logistics 100% -> Manager Approved -> Finance Dues Cleared -> Delivered)
    managerApproved: {
        type: Boolean,
        default: false
    },
    managerApprovedAt: {
        type: Date,
        default: null
    },
    managerApprovedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    financeApproved: {
        type: Boolean,
        default: false
    },
    financeApprovedAt: {
        type: Date,
        default: null
    },
    financeApprovedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    duesCleared: {
        type: Boolean,
        default: false
    },

    // Logistics Progress & Milestone Tracking (Updated by Logistic / Operations Officer)
    progressPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    currentStage: {
        type: String,
        default: "Site Mobilization & Preparation"
    },
    milestonesPassed: {
        type: [Number], // [25, 50, 75, 100]
        default: []
    },
    hasActiveDelay: {
        type: Boolean,
        default: false
    },
    latestDelayReason: {
        type: String,
        default: ""
    },
    totalDelayDays: {
        type: Number,
        default: 0
    },
    latestVerifiedPhoto: {
        type: String,
        default: ""
    },
    pendingProgressCount: {
        type: Number,
        default: 0
    },
    progressUpdates: [progressUpdateSchema],

    description: {
        type: String,
        default: ""
    },
    projectLocation: {
        type: String,
        required: [true, "Project location is required"],
        trim: true
    },
    quotation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quotation",
        default: null
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Project", projectSchema);