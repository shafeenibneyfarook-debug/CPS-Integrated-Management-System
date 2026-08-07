import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RikumLayout from '../layouts/RikumLayout';
import PageHeading from '../components/PageHeading';
import { supplierService } from '../services/supplierService';
import { formatDate } from '../utils/formatters';

export default function SupplierListPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [stats, setStats] = useState({ totalSuppliers: 0, activeSuppliers: 0, inactiveSuppliers: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const [suppliersRes, statsRes] = await Promise.all([
        supplierService.list({ search: query, productCategory: category, status }),
        supplierService.getStats()
      ]);
      setSuppliers(suppliersRes.data?.data || []);
      setStats(statsRes.data?.data || { totalSuppliers: 0, activeSuppliers: 0, inactiveSuppliers: 0 });
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load suppliers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [query, category, status]);

  const handleDelete = async (supplier) => {
    if (!window.confirm(`Delete ${supplier.supplier_name}?`)) return;
    try {
      await supplierService.delete(supplier.supplier_id);
      loadSuppliers();
    } catch (err) {
      alert(err?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <RikumLayout activeLabel="Suppliers">
      <PageHeading accent title="Supplier Management" subtitle="Manage supplier and vendor records" />
      <div className="grid grid-cols-1 gap-6 px-1 pb-6 xl:grid-cols-[minmax(0,1fr)_220px]">
        <section>
          <div className="grid min-h-16 grid-cols-1 border-b border-slate-200 md:grid-cols-[1.8fr_1fr_1fr]">
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="px-2 text-sm font-bold outline-none" placeholder="Search by name, phone, or email" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-2 text-sm font-bold outline-none"><option value="">Product Category ▼</option><option value="TMT Bars">TMT Bars</option><option value="Cement">Cement</option><option value="Steel">Steel</option><option value="Paint">Paint</option><option value="Furniture">Furniture</option></select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-2 text-sm font-bold outline-none"><option value="">Status ▼</option><option value="Active">Active</option><option value="Inactive">Inactive</option></select>
          </div>

          {error ? <div className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

          <div className="grid gap-5 p-5 md:grid-cols-2">
            {loading ? (
              <div className="col-span-2 text-center text-sm">Loading suppliers…</div>
            ) : suppliers.length === 0 ? (
              <div className="col-span-2 text-center text-sm">No suppliers found.</div>
            ) : suppliers.map((supplier) => (
              <article key={supplier.supplier_id} className="bg-neutral-200 p-4 shadow-sm">
                {[
                  ['Supplier Name', supplier.supplier_name],
                  ['Country', supplier.country],
                  ['Contact Person', supplier.contact_person],
                  ['Product Category', supplier.product_category],
                  ['Phone', supplier.phone],
                  ['Email', supplier.email],
                  ['Status', supplier.status],
                  ['Updated', formatDate(supplier.updated_at)]
                ].map(([k, v]) => (
                  <div key={k} className="mb-3 bg-white px-4 py-3 text-base font-extrabold last:mb-0">{k}: {v}</div>
                ))}
                <div className="mt-4 flex gap-3 text-sm font-bold text-cps-deepBlue">
                  <button onClick={() => navigate(`/rikum/suppliers/${supplier.supplier_id}`)} className="hover:underline">View</button>
                  <button onClick={() => navigate(`/rikum/suppliers/${supplier.supplier_id}/edit`)} className="hover:underline">Edit</button>
                  <button onClick={() => handleDelete(supplier)} className="hover:underline text-red-600">Delete</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-5 pt-2">
          <Link className="primary-btn w-full" to="/rikum/suppliers/new">+ Add New Supplier</Link>
          <div className="space-y-4 pt-8"><div className="stat-card">Total Suppliers<br />{stats.totalSuppliers}</div><div className="stat-card">Active Suppliers<br />{stats.activeSuppliers}</div><div className="stat-card">Inactive Suppliers<br />{stats.inactiveSuppliers}</div></div>
        </aside>
      </div>
    </RikumLayout>
  );
}
