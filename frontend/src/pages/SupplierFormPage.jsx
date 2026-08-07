import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RikumLayout from '../layouts/RikumLayout';
import PageHeading from '../components/PageHeading';
import { supplierService } from '../services/supplierService';
import { validateEmail } from '../utils/validators';

const initial = {
  supplierName: '',
  country: '',
  contactPerson: '',
  productCategory: '',
  phone: '',
  email: '',
  address: '',
  status: ''
};

export default function SupplierFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const editing = Boolean(id);

  useEffect(() => {
    if (!editing) return;
    const loadSupplier = async () => {
      try {
        const response = await supplierService.get(id);
        const data = response.data?.data || {};
        setForm({
          supplierName: data.supplier_name || '',
          country: data.country || '',
          contactPerson: data.contact_person || '',
          productCategory: data.product_category || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          status: data.status || ''
        });
      } catch (err) {
        setError(err?.response?.data?.message || 'Unable to load supplier.');
      }
    };
    loadSupplier();
  }, [editing, id]);

  const handleChange = (e) => setForm((old) => ({ ...old, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.supplierName.trim()) return setError('Supplier name is required.');
    if (!form.country.trim()) return setError('Country is required.');
    if (!form.contactPerson.trim()) return setError('Contact person is required.');
    if (!form.productCategory.trim()) return setError('Product category is required.');
    if (!form.phone.trim()) return setError('Phone is required.');
    if (!validateEmail(form.email)) return setError('Please enter a valid email address.');
    if (!form.status) return setError('Status is required.');

    setLoading(true);
    try {
      const payload = { ...form };
      if (editing) {
        await supplierService.update(id, payload);
        setSuccess('Supplier updated successfully.');
      } else {
        await supplierService.create(payload);
        setSuccess('Supplier created successfully.');
      }
      setTimeout(() => navigate('/rikum/suppliers'), 300);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save supplier.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RikumLayout activeLabel="Suppliers">
      <PageHeading accent title={editing ? 'Edit Supplier' : 'Add New Supplier'} />
      <form onSubmit={handleSubmit} className="mx-auto mt-12 max-w-[1000px] px-8">
        {error ? <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        {success ? <div className="mb-4 rounded bg-green-50 p-3 text-sm text-green-700">{success}</div> : null}
        <div className="bg-neutral-200 p-5">
          <div className="grid gap-4">
            {[
              ['Supplier Name', 'supplierName', 'Enter supplier name'],
              ['Country', 'country', 'Enter country'],
              ['Contact Person', 'contactPerson', 'Enter contact person'],
              ['Product Category', 'productCategory', 'Enter product category'],
              ['Phone', 'phone', 'Enter phone'],
              ['Email', 'email', 'Enter email'],
              ['Address', 'address', 'Enter address'],
              ['Status', 'status', 'Select status']
            ].map(([label, name, placeholder]) => (
              <div key={name} className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                <div className="bg-white px-4 py-3 text-base font-extrabold">{label}</div>
                {name === 'status' ? (
                  <select value={form[name]} onChange={handleChange} name={name} className="bg-white px-4 py-3 text-base font-bold text-slate-700 outline-none">
                    <option value="">{placeholder}</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                ) : (
                  <input value={form[name] || ''} onChange={handleChange} name={name} className="bg-white px-4 py-3 text-base font-bold text-slate-700 outline-none" placeholder={placeholder} />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 grid gap-12 px-14 md:grid-cols-2">
          <button disabled={loading} className="primary-btn">{loading ? 'Saving...' : editing ? 'Update' : 'Save'}</button>
          <button type="button" onClick={() => navigate('/rikum/suppliers')} className="primary-btn">Cancel</button>
        </div>
      </form>
    </RikumLayout>
  );
}
