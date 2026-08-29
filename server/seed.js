// ======================================================
// CPS MANAGEMENT SYSTEM - DATABASE SEED SCRIPT
// Populates the new MongoDB cluster with admin + sample data
// ======================================================

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const crypto = require("crypto");

// ---- Password hashing (mirrors auth.utils.js) ----
const hashPassword = (password) => new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (error, key) => {
        if (error) return reject(error);
        resolve(`${salt}:${key.toString("hex")}`);
    });
});

// ---- Models ----
const User = require("./modules/auth/user.model");
const Client = require("./modules/client/client.model");
const Supplier = require("./modules/supplier/supplier.model");
const Project = require("./modules/project/project.model");
const Quotation = require("./modules/quotation/quotation.model");

async function seed() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error("❌ MONGO_URI not set in .env");
        process.exit(1);
    }

    console.log("🔗 Connecting to MongoDB...");
    console.log("   URI:", uri.replace(/:([^@]+)@/, ":****@")); // mask password
    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 30000,
        connectTimeoutMS: 10000
    });
    console.log(`✅ Connected to database: "${mongoose.connection.name}"`);

    // ============================
    // 1. ADMIN USER
    // ============================
    const adminEmail = "admin@gmail.com";
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
        admin = await User.create({
            name: "System Administrator",
            email: adminEmail,
            phone: "+880-1700-000000",
            passwordHash: await hashPassword("Admin123!"),
            role: "admin",
            isActive: true
        });
        console.log("✅ Admin user created:", adminEmail, "/ Admin123!");
    } else {
        console.log("ℹ️  Admin user already exists:", adminEmail);
    }

    // ============================
    // 2. MANAGER USER
    // ============================
    const managerEmail = "manager@gmail.com";
    let manager = await User.findOne({ email: managerEmail });
    if (!manager) {
        manager = await User.create({
            name: "Project Manager",
            email: managerEmail,
            phone: "+880-1711-111111",
            passwordHash: await hashPassword("Manager123!"),
            role: "manager",
            isActive: true
        });
        console.log("✅ Manager user created:", managerEmail, "/ Manager123!");
    } else {
        console.log("ℹ️  Manager user already exists:", managerEmail);
    }

    // ============================
    // 3. OPERATIONS OFFICER USER
    // ============================
    const opsEmail = "operations@gmail.com";
    let opsOfficer = await User.findOne({ email: opsEmail });
    if (!opsOfficer) {
        opsOfficer = await User.create({
            name: "Operations Officer",
            email: opsEmail,
            phone: "+880-1722-222222",
            passwordHash: await hashPassword("Operations123!"),
            role: "operations_officer",
            isActive: true
        });
        console.log("✅ Operations Officer created:", opsEmail, "/ Operations123!");
    } else {
        console.log("ℹ️  Operations Officer already exists:", opsEmail);
    }

    // ============================
    // 4. ACCOUNTS OFFICER USER
    // ============================
    const accountsEmail = "accounts@gmail.com";
    let accountsOfficer = await User.findOne({ email: accountsEmail });
    if (!accountsOfficer) {
        accountsOfficer = await User.create({
            name: "Accounts Officer",
            email: accountsEmail,
            phone: "+880-1733-333333",
            passwordHash: await hashPassword("Accounts123!"),
            role: "accounts_officer",
            isActive: true
        });
        console.log("✅ Accounts Officer created:", accountsEmail, "/ Accounts123!");
    } else {
        console.log("ℹ️  Accounts Officer already exists:", accountsEmail);
    }

    // ============================
    // 5. STAFF USER
    // ============================
    const staffEmail = "staff@gmail.com";
    let staffUser = await User.findOne({ email: staffEmail });
    if (!staffUser) {
        staffUser = await User.create({
            name: "Staff Member",
            email: staffEmail,
            phone: "+880-1744-444444",
            passwordHash: await hashPassword("Staff123!"),
            role: "staff",
            isActive: true
        });
        console.log("✅ Staff user created:", staffEmail, "/ Staff123!");
    } else {
        console.log("ℹ️  Staff user already exists:", staffEmail);
    }

    // ============================
    // 6. CLIENT USERS + CLIENT DIRECTORY RECORDS
    // ============================
    const clientsData = [
        { name: "Rahman Construction Ltd", contact: "Md. Abdur Rahman", email: "rahman@construction.com", phone: "+880-1755-100001", type: "Company", address: "12 Gulshan Avenue, Dhaka 1212" },
        { name: "City Development Corp", contact: "Nasir Uddin", email: "nasir@citydev.com", phone: "+880-1755-200002", type: "Corporate", address: "Bashundhara R/A, Block C, Dhaka" },
        { name: "Al-Amin Builders", contact: "Al-Amin Khan", email: "alamin@builders.com", phone: "+880-1755-300003", type: "Company", address: "Uttara Sector 7, Road 12, Dhaka 1230" },
        { name: "Prime Properties Ltd", contact: "Fahim Chowdhury", email: "fahim@primeprops.com", phone: "+880-1766-400004", type: "Corporate", address: "Dhanmondi 27, Dhaka 1209" },
        { name: "Delta Housing", contact: "Sumon Ahmed", email: "sumon@deltahousing.com", phone: "+880-1766-500005", type: "Company", address: "Mirpur DOHS, Dhaka 1216" }
    ];

    for (const c of clientsData) {
        let clientUser = await User.findOne({ email: c.email });
        if (!clientUser) {
            clientUser = await User.create({
                name: c.contact,
                email: c.email,
                phone: c.phone,
                passwordHash: await hashPassword("Client123!"),
                role: "client",
                isActive: true
            });
        }
        if (!await Client.exists({ email: c.email })) {
            await Client.create({
                companyName: c.name,
                contactPerson: c.contact,
                email: c.email,
                phone: c.phone,
                clientType: c.type,
                address: c.address,
                status: "Active"
            });
            console.log("✅ Client created:", c.name);
        } else {
            console.log("ℹ️  Client already exists:", c.name);
        }
    }

    // ============================
    // 7. SUPPLIER USERS + SUPPLIER DIRECTORY RECORDS
    // ============================
    const suppliersData = [
        { name: "Bangladesh Steel Corp", contact: "Karim Steel", email: "karim@steelcorp.com", phone: "+880-1788-100001", category: "Steel & Reinforcement", country: "Bangladesh", address: "Chittagong Export Zone, Chittagong" },
        { name: "Asia Cement Industries", contact: "Rafiq Cement", email: "rafiq@asiacement.com", phone: "+880-1788-200002", category: "Cement & Concrete", country: "Bangladesh", address: "Narayanganj Industrial Area" },
        { name: "China Building Materials Co", contact: "Wei Zhang", email: "wei@chinabm.com", phone: "+86-138-0000-0001", category: "Construction Equipment", country: "China", address: "Guangzhou Building Materials Market" },
        { name: "Indian Pipes & Fittings Ltd", contact: "Rajesh Kumar", email: "rajesh@indianpipes.com", phone: "+91-98765-43210", category: "Plumbing & Pipes", country: "India", address: "Mumbai Industrial Estate, Maharashtra" },
        { name: "Global Electrical Supplies", contact: "Hassan Electric", email: "hassan@globalelectric.com", phone: "+880-1799-300003", category: "Electrical & Wiring", country: "Bangladesh", address: "Tongi Industrial Area, Gazipur" },
        { name: "Turkish Marble Exports", contact: "Mehmet Ozkan", email: "mehmet@turkishmarble.com", phone: "+90-532-111-2233", category: "Tiles & Marble", country: "Turkey", address: "Afyon Marble District, Turkey" }
    ];

    for (const s of suppliersData) {
        let supplierUser = await User.findOne({ email: s.email });
        if (!supplierUser) {
            supplierUser = await User.create({
                name: s.contact,
                email: s.email,
                phone: s.phone,
                passwordHash: await hashPassword("Supplier123!"),
                role: "supplier",
                isActive: true
            });
        }
        if (!await Supplier.exists({ email: s.email })) {
            await Supplier.create({
                supplierName: s.name,
                country: s.country,
                contactPerson: s.contact,
                productCategory: s.category,
                phone: s.phone,
                email: s.email,
                address: s.address,
                status: "Active"
            });
            console.log("✅ Supplier created:", s.name);
        } else {
            console.log("ℹ️  Supplier already exists:", s.name);
        }
    }

    // ============================
    // 8. SAMPLE PROJECTS
    // ============================
    const allClients = await Client.find();
    const projectsData = [
        {
            projectName: "Gulshan Heights Tower",
            clientName: allClients[0]?.companyName || "Rahman Construction Ltd",
            client: allClients[0]?._id || null,
            startDate: new Date("2025-01-15"),
            deadline: new Date("2026-06-30"),
            budget: 85000000,
            assignedEmployee: "Project Team A",
            assignedManager: manager._id,
            assignedOperationsOfficer: opsOfficer._id,
            assignedAccountsOfficer: accountsOfficer._id,
            status: "Running",
            progressPercentage: 45,
            currentStage: "Structural Construction",
            description: "Premium 15-storey residential tower with modern amenities in Gulshan area",
            projectLocation: "Plot 12, Gulshan Avenue, Dhaka 1212",
            createdBy: admin._id
        },
        {
            projectName: "Bashundhara Commercial Complex",
            clientName: allClients[1]?.companyName || "City Development Corp",
            client: allClients[1]?._id || null,
            startDate: new Date("2025-03-01"),
            deadline: new Date("2026-12-31"),
            budget: 120000000,
            assignedEmployee: "Project Team B",
            assignedManager: manager._id,
            assignedOperationsOfficer: opsOfficer._id,
            assignedAccountsOfficer: accountsOfficer._id,
            status: "Running",
            progressPercentage: 25,
            currentStage: "Foundation & Substructure",
            description: "Multi-use commercial complex with office spaces and retail outlets",
            projectLocation: "Block C, Bashundhara R/A, Dhaka",
            createdBy: admin._id
        },
        {
            projectName: "Uttara Residential Villa",
            clientName: allClients[2]?.companyName || "Al-Amin Builders",
            client: allClients[2]?._id || null,
            startDate: new Date("2025-06-01"),
            deadline: new Date("2026-03-15"),
            budget: 35000000,
            assignedEmployee: "Project Team C",
            assignedManager: manager._id,
            assignedOperationsOfficer: opsOfficer._id,
            status: "Running",
            progressPercentage: 60,
            currentStage: "Interior Finishing",
            description: "Luxury 4-bedroom residential villa with rooftop garden",
            projectLocation: "Sector 7, Road 12, Uttara, Dhaka 1230",
            createdBy: admin._id
        },
        {
            projectName: "Dhanmondi Lake View Apartment",
            clientName: allClients[3]?.companyName || "Prime Properties Ltd",
            client: allClients[3]?._id || null,
            startDate: new Date("2024-09-01"),
            deadline: new Date("2025-12-31"),
            budget: 55000000,
            assignedEmployee: "Project Team A",
            assignedManager: manager._id,
            status: "Completed",
            progressPercentage: 100,
            currentStage: "Project Delivered",
            description: "8-storey residential apartment with lake view balconies",
            projectLocation: "Dhanmondi 27, Dhaka 1209",
            createdBy: admin._id
        },
        {
            projectName: "Mirpur DOHS Twin Tower",
            clientName: allClients[4]?.companyName || "Delta Housing",
            client: allClients[4]?._id || null,
            startDate: new Date("2025-08-01"),
            deadline: new Date("2027-08-01"),
            budget: 200000000,
            assignedEmployee: "Project Team D",
            status: "Pending",
            progressPercentage: 0,
            currentStage: "Site Mobilization & Preparation",
            description: "Premium twin-tower development with shopping mall and underground parking",
            projectLocation: "Mirpur DOHS, Dhaka 1216",
            createdBy: admin._id
        }
    ];

    const existingProjects = await Project.countDocuments();
    if (existingProjects === 0) {
        await Project.insertMany(projectsData);
        console.log(`✅ ${projectsData.length} projects seeded`);
    } else {
        console.log(`ℹ️  ${existingProjects} projects already exist, skipping`);
    }

    // ============================
    // DONE
    // ============================
    const counts = {
        users: await User.countDocuments(),
        clients: await Client.countDocuments(),
        suppliers: await Supplier.countDocuments(),
        projects: await Project.countDocuments()
    };

    console.log("\n==============================");
    console.log("📊 DATABASE SUMMARY");
    console.log("==============================");
    console.log(`   Users:     ${counts.users}`);
    console.log(`   Clients:   ${counts.clients}`);
    console.log(`   Suppliers: ${counts.suppliers}`);
    console.log(`   Projects:  ${counts.projects}`);
    console.log("==============================\n");
    console.log("🎉 Seed complete!");

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(err => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
