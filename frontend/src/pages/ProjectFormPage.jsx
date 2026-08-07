import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AminLayout from '../layouts/AminLayout';
import FormField from '../components/FormField';
import { clientService } from '../services/clientService';
import { projectService } from '../services/projectService';

const initial = {
  projectName: '',
  clientId: '',
  startDate: '',
  deadline: '',
  budget: '',
  assignedEmployee: '',
  status: '',
  description: '',
  projectLocation: '',
  latitude: '',
  longitude: ''
};

export default function ProjectFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(initial);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const editing = Boolean(id);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await clientService.list();
        setClients(response.data?.data || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Unable to load clients.');
      }
    };
    loadClients();

    if (!editing) return;
    const loadProject = async () => {
      try {
        const response = await projectService.get(id);
        const data = response.data?.data || {};
        setForm({
          projectName: data.project_name || '',
          clientId: data.client_id || '',
          startDate: data.start_date || '',
          deadline: data.deadline || '',
          budget: data.budget || '',
          assignedEmployee: data.assigned_user_id || '',
          status: data.status || '',
          description: data.description || '',
          projectLocation: data.location_name || '',
          latitude: data.latitude || '',
          longitude: data.longitude || ''
        });
      } catch (err) {
        setError(err?.response?.data?.message || 'Unable to load project.');
      }
    };
    loadProject();
  }, [editing, id]);

  const handleChange = (e) => setForm((old) => ({ ...old, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.projectName.trim()) return setError('Project name is required.');
    if (!form.clientId) return setError('Client is required.');
    if (!form.startDate || !form.deadline) return setError('Start date and deadline are required.');
    if (!form.budget) return setError('Budget is required.');
    if (!form.status) return setError('Status is required.');

    setLoading(true);
    try {
      const payload = {
        projectName: form.projectName,
        clientId: Number(form.clientId),
        startDate: form.startDate,
        deadline: form.deadline,
        budget: Number(form.budget),
        assignedEmployee: form.assignedEmployee || null,
        status: form.status,
        description: form.description,
        projectLocation: form.projectLocation,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null
      };
      if (editing) {
        await projectService.update(id, payload);
        setSuccess('Project updated successfully.');
      } else {
        await projectService.create(payload);
        setSuccess('Project created successfully.');
      }
      setTimeout(() => navigate('/amin/projects'), 300);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AminLayout activeLabel="Projects">
      <form onSubmit={handleSubmit} className="p-6">
        <h1 className="text-xl font-extrabold">{editing ? 'Edit project' : 'New project'}</h1>
        {error ? <div className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        {success ? <div className="mt-3 rounded bg-green-50 p-3 text-sm text-green-700">{success}</div> : null}
        <div className="mt-6 space-y-5">
          <FormField gray label="Project name" name="projectName" placeholder="e.g. Warehouse fit-out" value={form.projectName} onChange={handleChange} />
          <label className="block">
            <span className="field-label">Client</span>
            <select name="clientId" value={form.clientId} onChange={handleChange} className="field-control-gray">
              <option value="">Select client</option>
              {clients.map((client) => <option key={client.client_id} value={client.client_id}>{client.company_name}</option>)}
            </select>
          </label>
          <div className="grid gap-10 md:grid-cols-2">
            <FormField gray label="Start date" name="startDate" type="date" value={form.startDate} onChange={handleChange} />
            <FormField gray label="Deadline" name="deadline" type="date" value={form.deadline} onChange={handleChange} />
          </div>
          <div className="grid gap-10 md:grid-cols-2">
            <FormField gray label="Budget (BDT)" name="budget" type="number" value={form.budget} onChange={handleChange} />
            <FormField gray label="Assigned employee" name="assignedEmployee" placeholder="Enter employee" value={form.assignedEmployee} onChange={handleChange} />
          </div>
          <FormField gray label="Status" name="status" placeholder="Select status" select options={['Planned','Ongoing','Delayed','Completed','Cancelled']} value={form.status} onChange={handleChange} />
          <FormField gray label="Description" name="description" placeholder="Scope of works..." value={form.description} onChange={handleChange} />
          <FormField gray label="Project Location / Address" name="projectLocation" placeholder="Enter project address" value={form.projectLocation} onChange={handleChange} />
          <div className="grid gap-10 md:grid-cols-2">
            <FormField gray label="Latitude" name="latitude" type="number" step="0.000001" placeholder="Optional" value={form.latitude} onChange={handleChange} />
            <FormField gray label="Longitude" name="longitude" type="number" step="0.000001" placeholder="Optional" value={form.longitude} onChange={handleChange} />
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-5">
          <button type="button" onClick={() => navigate('/amin/projects')} className="secondary-btn min-w-32">cancel</button>
          <button disabled={loading} className="purple-btn min-w-32">{loading ? 'Saving...' : editing ? 'Update' : 'Save'}</button>
        </div>
      </form>
    </AminLayout>
  );
}
