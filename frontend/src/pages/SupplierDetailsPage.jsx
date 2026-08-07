import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RikumLayout from '../layouts/RikumLayout';
import { supplierService } from '../services/supplierService';

export default function SupplierDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);

  useEffect(() => {
    const loadSupplier = async () => {
      try {
        const response = await supplierService.get(id);
        setSupplier(response.data?.data || null);
      } catch (error) {
        console.error(error);
      }
    };
    loadSupplier();
  }, [id]);

  if (!supplier) return null;
  return (
    <RikumLayout activeLabel="Suppliers">
      <div className="p-8">
        <h1 className="text-2xl font-extrabold">Supplier Details</h1>
        <div className="mt-6 rounded bg-neutral-200 p-6">
          <p><strong>Name:</strong> {supplier.supplier_name}</p>
          <p><strong>Country:</strong> {supplier.country}</p>
          <p><strong>Contact Person:</strong> {supplier.contact_person}</p>
          <p><strong>Category:</strong> {supplier.product_category}</p>
          <p><strong>Phone:</strong> {supplier.phone}</p>
          <p><strong>Email:</strong> {supplier.email}</p>
          <p><strong>Address:</strong> {supplier.address}</p>
          <p><strong>Status:</strong> {supplier.status}</p>
        </div>
        <button onClick={() => navigate('/rikum/suppliers')} className="primary-btn mt-6">Back to list</button>
      </div>
    </RikumLayout>
  );
}
