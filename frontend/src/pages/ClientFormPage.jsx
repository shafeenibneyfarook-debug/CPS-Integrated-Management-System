import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TanmayLayout from '../layouts/TanmayLayout';
import PageHeading from '../components/PageHeading';
import FormField from '../components/FormField';
import { clientService } from '../services/clientService';
import { validateEmail } from '../utils/validators';

const initial = {
  companyName: '',
  contactPerson: '',
  phone: '',
  email: '',
  clientType: '',
  address: '',
  status: '',
  notes: ''
};

export default function ClientFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const editing = Boolean(id);

  useEffect(() => {
    if (!editing) return;
    const loadClient = async () => {
      try {
        const response = await clientService.get(id);
        const data = response.data?.data || {};
        setForm({
          companyName: data.company_name || '',
          contactPerson: data.contact_person || '',
          phone: data.phone || '',
          email: data.email || '',
          clientType: data.client_type || '',
          address: data.address || '',
          status: data.status || '',
          notes: data.note || ''
        });
      } catch (err) {
        setError(err?.response?.data?.message || 'Unable to load client.');
      }
    };
    loadClient();
  }, [editing, id]);

  const handleChange = (e) => setForm((old) => ({ ...old, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.companyName.trim()) return setError('Company name is required.');
    if (!form.contactPerson.trim()) return setError('Contact person is required.');
    if (!form.phone.trim()) return setError('Phone is required.');
    if (!validateEmail(form.email)) return setError('Please enter a valid email address.');
    if (!form.clientType) return setError('Client type is required.');
    if (!form.status) return setError('Status is required.');

    setLoading(true);
    try {
      const payload = {
        companyName: form.companyName,
        contactPerson: form.contactPerson,
        phone: form.phone,
        email: form.email,
        clientType: form.clientType,
        address: form.address,
        status: form.status,
        notes: form.notes
      };
      if (editing) {
        await clientService.update(id, payload);
        setSuccess('Client updated successfully.');
      } else {
        await clientService.create(payload);
        setSuccess('Client created successfully.');
      }
      setTimeout(() => navigate('/tanmay/clients'), 300);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save client.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TanmayLayout activeLabel="Clients">
      <PageHeading title={editing ? 'Edit Client' : 'Add New Client'} subtitle="Create or update a client record with contact and business details" />
      <form onSubmit={handleSubmit} className="mx-6 mb-10 max-w-[980px] bg-neutral-200 p-5 md:p-7">
        <h2 className="mb-6 text-2xl font-extrabold">Client Information</h2>
        {error ? <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        {success ? <div className="mb-4 rounded bg-green-50 p-3 text-sm text-green-700">{success}</div> : null}
        <div className="grid gap-x-16 gap-y-5 md:grid-cols-2">
          <FormField label="Company name" name="companyName" placeholder="Enter company name" value={form.companyName} onChange={handleChange} />
          <FormField label="Email Address" name="email" type="email" placeholder="Client@example.com" value={form.email} onChange={handleChange} />
          <FormField label="Contact Person" name="contactPerson" placeholder="Enter contact person" value={form.contactPerson} onChange={handleChange} />
          <FormField label="Client Address" name="address" placeholder="Enter client address" value={form.address} onChange={handleChange} />
          <FormField label="Phone number" name="phone" placeholder="01xxxxxxxxx" value={form.phone} onChange={handleChange} />
          <FormField label="Status" name="status" placeholder="Select status" select options={['Active','Inactive']} value={form.status} onChange={handleChange} />
          <FormField label="Client Type" name="clientType" placeholder="Select client type" select options={['Corporate','Contractor','Individual','Government','Other']} value={form.clientType} onChange={handleChange} />
          <FormField label="Client Note" name="notes" placeholder="Optional note" value={form.notes} onChange={handleChange} />
        </div>
        <p className="mt-5 text-right text-xs font-medium text-slate-600">The system will check duplicate clients using phone number and email before saving.</p>
        <div className="mt-6 flex justify-end gap-8">
          <button type="button" onClick={() => navigate('/tanmay/clients')} className="purple-btn min-w-36">Cancel</button>
          <button disabled={loading} className="purple-btn min-w-36">{loading ? 'Saving...' : editing ? 'Update Client' : 'Save Client'}</button>
        </div>
      </form>
    </TanmayLayout>
  );
}
