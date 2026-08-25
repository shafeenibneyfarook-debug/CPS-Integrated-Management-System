// Import database models
// These connect dashboard with MongoDB collections

const Client = require("../client/client.model");

const Project = require("../project/project.model");

const Supplier = require("../supplier/supplier.model");





// ==========================================
// GET DASHBOARD STATISTICS
// ==========================================
//
// Returns summary data for dashboard cards:
//
// Total Clients
// Total Projects
// Total Suppliers
// Active Projects


exports.getDashboardStats = async (req, res) => {


    try {



        // Count all clients

        const totalClients = await Client.countDocuments();





        // Count all projects

        const totalProjects = await Project.countDocuments();





        // Count all suppliers

        const totalSuppliers = await Supplier.countDocuments();





        // Count projects which are currently running

        const activeProjects = await Project.countDocuments({

            status: "Running"

        });






        // Send dashboard statistics

        res.status(200).json({


            totalClients,


            totalProjects,


            totalSuppliers,


            activeProjects


        });



    } catch (error) {


        res.status(500).json({

            message: error.message

        });


    }


};









// ==========================================
// GET RECENT ACTIVITIES
// ==========================================
//
// Purpose:
// Shows latest created records
//
// Sources:
// Client collection
// Project collection
// Supplier collection


exports.getRecentActivities = async (req, res) => {


    try {



        // Get latest clients

        const clients = await Client.find()

            .sort({ createdAt: -1 })

            .limit(5);






        // Get latest projects

        const projects = await Project.find()

            .sort({ createdAt: -1 })

            .limit(5);






        // Get latest suppliers

        const suppliers = await Supplier.find()

            .sort({ createdAt: -1 })

            .limit(5);







        // Return activities

        res.status(200).json({


            clients,


            projects,


            suppliers


        });




    } catch (error) {


        res.status(500).json({

            message: error.message

        });


    }


};