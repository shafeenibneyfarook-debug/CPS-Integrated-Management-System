// Import React hooks
// useState: stores component data
// useEffect: runs code when component loads
import { useEffect, useState } from "react";


// useParams: gets shipment ID from URL
// useNavigate: redirects user after update
import { useNavigate, useParams } from "react-router-dom";


// Import shipment API functions
// getShipmentById: fetch one shipment from backend
// updateShipment: update shipment information
import {
    getShipmentById,
    updateShipment
} from "../shipmentApi";





// ======================================================
// SHIPMENT EDIT COMPONENT
// ======================================================
//
// This page allows users to edit existing shipment data
//
// Features:
// - Load existing shipment information
// - Update customs status
// - Update delivery status
// - Update received quantity
// - Update expected arrival date
//
// ======================================================


function ShipmentEdit(){



    // Get shipment ID from URL
    //
    // Example:
    // /shipments/edit/6a7d6abe3e178e85ba0eaa8c
    //
    const { id } = useParams();




    // Used for navigation after successful update

    const navigate = useNavigate();





    // Store shipment form data

    const [shipment,setShipment] = useState({

        customsStatus:"",

        deliveryStatus:"",

        receivedQuantity:0,

        expectedArrivalDate:""

    });






    // Loading state
    // Used while fetching shipment data

    const [loading,setLoading] = useState(true);









    // ======================================================
    // LOAD EXISTING SHIPMENT DATA
    // ======================================================
    //
    // When page opens:
    // 1. Send request to backend
    // 2. Get shipment details
    // 3. Put data into form fields
    //
    // ======================================================


    useEffect(()=>{


        const loadShipment = async()=>{


            try{


                // Get shipment information using ID

                const response = await getShipmentById(id);




                // Store existing values in form

                setShipment({


                    customsStatus:
                    response.data.customsStatus || "",



                    deliveryStatus:
                    response.data.deliveryStatus || "",



                    receivedQuantity:
                    response.data.receivedQuantity || 0,



                    // Convert date format for HTML date input

                    expectedArrivalDate:

                    response.data.expectedArrivalDate

                    ?

                    response.data.expectedArrivalDate.substring(0,10)

                    :

                    ""



                });



            }


            catch(error){


                // Display error in console

                console.log(error);


            }



            finally{


                // Stop loading screen

                setLoading(false);


            }


        };



        // Call function

        loadShipment();



    },[id]);









    // ======================================================
    // HANDLE INPUT CHANGE
    // ======================================================
    //
    // Updates form values when user changes any field
    //
    // ======================================================


    const handleChange=(e)=>{


        setShipment({


            // Keep previous values

            ...shipment,



            // Update only changed field

            [e.target.name]:e.target.value


        });


    };









    // ======================================================
    // UPDATE SHIPMENT
    // ======================================================
    //
    // Sends edited data to backend
    //
    // ======================================================


    const handleSubmit=async(e)=>{


        // Prevent page refresh

        e.preventDefault();



        try{


            // Send update request

            await updateShipment(

                id,

                shipment

            );



            // Success message

            alert(

                "Shipment updated successfully"

            );



            // Return to shipment list

            navigate("/shipments");



        }



        catch(error){


            console.log(error);



            alert(

                "Update failed"

            );


        }


    };









    // Show loading message while fetching data

    if(loading){


        return (

            <h2>

                Loading...

            </h2>

        );


    }









    return (


        <div>


            <h2>

                Edit Shipment

            </h2>






            <form onSubmit={handleSubmit}>


                {/* Customs Status Field */}

                <label>

                    Customs Status

                </label>



                <select

                    name="customsStatus"

                    value={shipment.customsStatus}

                    onChange={handleChange}

                >


                    <option value="">

                        Select

                    </option>


                    <option value="Pending">

                        Pending

                    </option>



                    <option value="Cleared">

                        Cleared

                    </option>


                </select>






                <br/><br/>







                {/* Delivery Status Field */}

                <label>

                    Delivery Status

                </label>




                <select

                    name="deliveryStatus"

                    value={shipment.deliveryStatus}

                    onChange={handleChange}

                >



                    <option value="Preparing">

                        Preparing

                    </option>



                    <option value="Shipped">

                        Shipped

                    </option>



                    <option value="Delivered">

                        Delivered

                    </option>



                </select>






                <br/><br/>







                {/* Received Quantity Field */}

                <label>

                    Received Quantity

                </label>



                <input


                    type="number"


                    name="receivedQuantity"


                    value={shipment.receivedQuantity}


                    onChange={handleChange}


                />







                <br/><br/>







                {/* Expected Arrival Date Field */}

                <label>

                    Expected Arrival Date

                </label>




                <input


                    type="date"


                    name="expectedArrivalDate"


                    value={shipment.expectedArrivalDate}


                    onChange={handleChange}


                />








                <br/><br/>







                {/* Submit Button */}

                <button type="submit">


                    Update Shipment


                </button>





            </form>




        </div>


    );


}





// Export component
// Allows App.jsx to use this page

export default ShipmentEdit;