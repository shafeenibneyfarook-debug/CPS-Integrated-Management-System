// Import Shipment model
// This allows us to communicate with MongoDB shipment collection

const Shipment = require("./shipment.model");






// ======================================================
// CREATE NEW SHIPMENT
// ======================================================
//
// This function receives shipment data from frontend
// and saves it into database
//
// ======================================================


exports.createShipment = async (req, res) => {


    try {


        // Create new shipment object using request body data

        const shipment = new Shipment(req.body);



        // Save shipment data into MongoDB

        const savedShipment = await shipment.save();



        // Send created shipment back

        res.status(201).json(savedShipment);



    } catch(error) {


        // Send error message

        res.status(400).json({

            message:error.message

        });


    }


};









// ======================================================
// GET ALL SHIPMENTS WITH DELAY WARNING
// ======================================================
//
// Returns all shipments
//
// Also checks:
// - Expected arrival date
// - Delivery status
//
// If shipment is late:
// isDelayed = true
//
// ======================================================


exports.getShipments = async (req, res) => {
    try {
        const { search, shipmentType, customsStatus, deliveryStatus, delayed } = req.query;
        const filter = {};

        if (shipmentType) filter.shipmentType = shipmentType;
        if (customsStatus) filter.customsStatus = customsStatus;
        if (deliveryStatus) filter.deliveryStatus = deliveryStatus;

        if (search?.trim()) {
            const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const pattern = new RegExp(escaped, "i");
            filter.$or = [
                { supplier: pattern },
                { country: pattern },
                { port: pattern },
                { invoiceNumber: pattern },
                { lcNumber: pattern }
            ];
        }

        const shipments = await Shipment.find(filter).sort({ createdAt: -1 });

        const updatedShipments = shipments.map((shipment) => {
            const arrivalDate = shipment.expectedArrival ? new Date(shipment.expectedArrival) : null;
            const isDelayed = arrivalDate ? (new Date() > arrivalDate && shipment.deliveryStatus !== "Delivered") : false;
            
            const total = Number(shipment.totalQuantity) || 0;
            const received = Number(shipment.receivedQuantity) || 0;
            const receivingStatus = total === 0 ? "Not Received" : received === 0 ? "Not Received" : received >= total ? "Received" : "Partially Received";

            return {
                ...shipment.toObject(),
                isDelayed,
                receivingStatus
            };
        });

        if (delayed === "true") {
            return res.status(200).json(updatedShipments.filter((s) => s.isDelayed));
        }

        return res.status(200).json(updatedShipments);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};









// ======================================================
// GET SINGLE SHIPMENT BY ID WITH DELAY WARNING
// ======================================================
//
// Used when viewing one shipment
//
// Example:
// /api/shipments/65abc123
//
// ======================================================


exports.getShipmentById = async (req,res)=>{


    try{


        // Find shipment by MongoDB ID

        const shipment = await Shipment.findById(

            req.params.id

        );



        // Check shipment exists

        if(!shipment){


            return res.status(404).json({

                message:"Shipment not found"

            });


        }



        // Convert expected arrival date

        // Database field name is expectedArrival

        const arrivalDate = new Date(

            shipment.expectedArrival

        );



        // Check if shipment is delayed

        const isDelayed =

            new Date() > arrivalDate &&

            shipment.deliveryStatus !== "Delivered";



        // Return shipment data
        // with delay warning

        res.status(200).json({


            ...shipment.toObject(),


            isDelayed:isDelayed


        });



    }catch(error){


        res.status(500).json({

            message:error.message

        });


    }


};









// ======================================================
// UPDATE SHIPMENT
// ======================================================
//
// Used for:
// - Editing shipment information
// - Updating customs status
// - Updating delivery status
// - Updating received quantity
//
// ======================================================


exports.updateShipment = async(req,res)=>{


    try{


        // Find shipment by ID and update

        const updatedShipment = await Shipment.findByIdAndUpdate(


            req.params.id,


            req.body,


            {
                returnDocument: 'after',
                runValidators: true
            }


        );



        // Shipment not found

        if(!updatedShipment){


            return res.status(404).json({

                message:"Shipment not found"

            });


        }



        // Send updated shipment

        res.status(200).json(updatedShipment);



    }catch(error){


        res.status(400).json({

            message:error.message

        });


    }


};









// ======================================================
// DELETE SHIPMENT
// ======================================================
//
// Removes shipment from database
//
// ======================================================


exports.deleteShipment = async(req,res)=>{


    try{


        // Delete shipment using ID

        const deletedShipment = await Shipment.findByIdAndDelete(

            req.params.id

        );



        // Check shipment exists

        if(!deletedShipment){


            return res.status(404).json({

                message:"Shipment not found"

            });


        }



        // Success message

        res.status(200).json({

            message:"Shipment deleted successfully"

        });



    }catch(error){


        res.status(500).json({

            message:error.message

        });


    }


};