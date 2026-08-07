import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import ClientListPage from './pages/ClientListPage';
import ClientFormPage from './pages/ClientFormPage';
import ClientDetailsPage from './pages/ClientDetailsPage';
import SupplierListPage from './pages/SupplierListPage';
import SupplierFormPage from './pages/SupplierFormPage';
import SupplierDetailsPage from './pages/SupplierDetailsPage';
import ProjectListPage from './pages/ProjectListPage';
import ProjectFormPage from './pages/ProjectFormPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Home />} />

      <Route path="/tanmay/clients" element={<ClientListPage />} />
      <Route path="/tanmay/clients/new" element={<ClientFormPage />} />
      <Route path="/tanmay/clients/:id" element={<ClientDetailsPage />} />
      <Route path="/tanmay/clients/:id/edit" element={<ClientFormPage />} />

      <Route path="/rikum/suppliers" element={<SupplierListPage />} />
      <Route path="/rikum/suppliers/new" element={<SupplierFormPage />} />
      <Route path="/rikum/suppliers/:id" element={<SupplierDetailsPage />} />
      <Route path="/rikum/suppliers/:id/edit" element={<SupplierFormPage />} />

      <Route path="/amin/projects" element={<ProjectListPage />} />
      <Route path="/amin/projects/new" element={<ProjectFormPage />} />
      <Route path="/amin/projects/:id" element={<ProjectDetailsPage />} />
      <Route path="/amin/projects/:id/edit" element={<ProjectFormPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
