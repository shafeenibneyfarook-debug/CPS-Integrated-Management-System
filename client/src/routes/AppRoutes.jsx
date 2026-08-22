// Import React Router components
// These create different pages in our application

import { BrowserRouter, Routes, Route } from "react-router-dom";



// Import Layout
// Common structure for all pages

import Layout from "../layout/Layout";



// Import Dashboard page

import Dashboard from "../pages/Dashboard";



// Import Client page

import ClientList from "../modules/client/pages/ClientList";



// Import Project page

import ProjectList from "../modules/project/pages/ProjectList";

import QuotationList from "../modules/quotation/pages/QuotationList";

import PurchaseOrderList from "../modules/purchaseOrder/pages/PurchaseOrderList";





function AppRoutes() {


    return (


        <BrowserRouter>


            <Layout>


                <Routes>



                    {/* Dashboard */}

                    <Route

                        path="/dashboard"

                        element={<Dashboard />}

                    />




                    {/* Client Management */}

                    <Route

                        path="/clients"

                        element={<ClientList />}

                    />




                    {/* Project Management */}

                    <Route

                        path="/projects"

                        element={<ProjectList />}

                    />

                    <Route path="/quotations" element={<QuotationList />} />

                    <Route path="/purchase-orders" element={<PurchaseOrderList />} />



                </Routes>


            </Layout>


        </BrowserRouter>


    );


}


export default AppRoutes;
