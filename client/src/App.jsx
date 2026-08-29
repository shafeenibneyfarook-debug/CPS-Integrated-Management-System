import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./layout/Layout";
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import ErrorBoundary from "./components/ErrorBoundary";

// Project module pages
import ProjectList from "./modules/project/pages/ProjectList";
import ProjectDetails from "./modules/project/pages/ProjectDetails";

// Client module pages
import ClientList from "./modules/client/pages/ClientList";

// Supplier module pages
import SupplierList from "./modules/supplier/pages/SupplierList";

// Shipment module page
import ShipmentList from "./modules/shipment/pages/ShipmentList";

// Business Operations module pages
import QuotationList from "./modules/quotation/pages/QuotationList";
import PurchaseOrderList from "./modules/purchaseOrder/pages/PurchaseOrderList";

// Module 3 Pages
import InvoiceList from "./modules/invoice/pages/InvoiceList";
import InventoryList from "./modules/inventory/pages/InventoryList";
import ImportCostCalculator from "./modules/importCost/pages/ImportCostCalculator";
import PriceScraperManager from "./modules/priceScraper/pages/PriceScraperManager";
import ProjectCostEstimator from "./modules/boqEstimator/pages/ProjectCostEstimator";
import ProductRecommendationList from "./modules/productRecommendation/pages/ProductRecommendationList";

// Authentication
import { AuthProvider } from "./modules/auth/AuthContext";
import ProtectedRoute from "./modules/auth/ProtectedRoute";
import AuthPage from "./modules/auth/pages/AuthPage";
import ProfilePage from "./modules/auth/pages/ProfilePage";

// Admin
import UserManagement from "./modules/admin/pages/UserManagement";

// This wrapper protects normal user workspace pages
const AppLayout = ({ children }) => (
    <ProtectedRoute>
        <Layout>
            {children}
        </Layout>
    </ProtectedRoute>
);

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <AuthProvider>
                    <Routes>
                        {/* Public Landing & Homepage */}
                        <Route path="/" element={<HomePage />} />

                        {/* Authentication Routes */}
                        <Route path="/login" element={<AuthPage mode="login" />} />
                        <Route path="/register" element={<AuthPage mode="register" />} />

                        {/* Dashboard */}
                        <Route
                            path="/dashboard"
                            element={
                                <AppLayout>
                                    <Dashboard />
                                </AppLayout>
                            }
                        />

                        {/* Client Management */}
                        <Route
                            path="/clients"
                            element={
                                <AppLayout>
                                    <ClientList />
                                </AppLayout>
                            }
                        />

                        {/* Supplier Management */}
                        <Route
                            path="/suppliers"
                            element={
                                <AppLayout>
                                    <SupplierList />
                                </AppLayout>
                            }
                        />

                        {/* Project Management & Maps */}
                        <Route
                            path="/projects"
                            element={
                                <AppLayout>
                                    <ProjectList />
                                </AppLayout>
                            }
                        />

                        <Route
                            path="/projects/:id"
                            element={
                                <AppLayout>
                                    <ProjectDetails />
                                </AppLayout>
                            }
                        />

                        {/* Shipment Tracking */}
                        <Route
                            path="/shipments"
                            element={
                                <AppLayout>
                                    <ShipmentList />
                                </AppLayout>
                            }
                        />

                        {/* Tender and Quotation Management */}
                        <Route
                            path="/quotations"
                            element={
                                <AppLayout>
                                    <QuotationList />
                                </AppLayout>
                            }
                        />

                        {/* Purchase Order Management */}
                        <Route
                            path="/purchase-orders"
                            element={
                                <AppLayout>
                                    <PurchaseOrderList />
                                </AppLayout>
                            }
                        />

                        {/* Module 3 Routes */}
                        <Route
                            path="/invoices"
                            element={
                                <AppLayout>
                                    <InvoiceList />
                                </AppLayout>
                            }
                        />

                        <Route
                            path="/inventory"
                            element={
                                <AppLayout>
                                    <InventoryList />
                                </AppLayout>
                            }
                        />

                        <Route
                            path="/import-costs"
                            element={
                                <AppLayout>
                                    <ImportCostCalculator />
                                </AppLayout>
                            }
                        />

                        <Route
                            path="/price-scraper"
                            element={
                                <AppLayout>
                                    <PriceScraperManager />
                                </AppLayout>
                            }
                        />

                        <Route
                            path="/boq-estimator"
                            element={
                                <AppLayout>
                                    <ProjectCostEstimator />
                                </AppLayout>
                            }
                        />

                        <Route
                            path="/product-recommendations"
                            element={
                                <AppLayout>
                                    <ProductRecommendationList />
                                </AppLayout>
                            }
                        />

                        {/* Profile */}
                        <Route
                            path="/profile"
                            element={
                                <AppLayout>
                                    <ProfilePage />
                                </AppLayout>
                            }
                        />

                        {/* Admin User Management */}
                        <Route
                            path="/admin/users"
                            element={
                                <ProtectedRoute roles={["admin"]}>
                                    <Layout>
                                        <UserManagement />
                                    </Layout>
                                </ProtectedRoute>
                            }
                        />

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </AuthProvider>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;
