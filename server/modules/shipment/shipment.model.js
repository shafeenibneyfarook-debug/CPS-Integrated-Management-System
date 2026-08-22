// Import mongoose
const mongoose = require("mongoose");


// ===============================
// Shipment Schema
// ===============================
//
// This defines how shipment data
// will be stored in MongoDB
//

const shipmentSchema = new mongoose.Schema(

    {


        // Import or Export type
        shipmentType: {

            type: String,

            required: true

        },


        // Supplier name
        supplier: {

            type: String,

            required: true

        },


        // Country from where shipment comes
        country: {

            type: String,

            required: true

        },


        // Port information
        port: {

            type: String

        },


        // Invoice number
        invoiceNumber: {

            type: String

        },


        // Letter of Credit number
        lcNumber: {
            type: String
        },

        // Shipping Carrier
        carrier: {
            type: String,
            default: ""
        },

        // Tracking / Bill of Lading Number
        trackingNumber: {
            type: String,
            default: ""
        },

        // Logistics & Dispatch Notes
        notes: {
            type: String,
            default: ""
        },


        // Shipment sending date
        shipmentDate: {

            type: Date

        },


        // Expected arrival date
        expectedArrival: {

            type: Date

        },


        // Customs status
        customsStatus: {

            type: String,

            default: "Pending"

        },


        // Delivery status
        deliveryStatus: {

            type: String,

            default: "Preparing"

        },


        // Total quantity shipped
        totalQuantity: {

            type: Number,

            default: 0

        },


        // Quantity received
        receivedQuantity: {

            type: Number,

            default: 0

        }



    },



    {

        // Automatically creates:
        // createdAt
        // updatedAt

        timestamps: true

    }


);



// ===============================
// Export Model
// ===============================
//
// IMPORTANT:
// This line fixes
// "Shipment is not a constructor"
//
//

module.exports = mongoose.model(

    "Shipment",

    shipmentSchema

);