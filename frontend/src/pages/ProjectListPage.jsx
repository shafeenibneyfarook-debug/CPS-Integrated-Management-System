import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AminLayout from '../layouts/AminLayout';
import { projectService } from '../services/projectService';
import { clientService } from '../services/clientService';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function ProjectListPage() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [clientId, setClientId] = useState('');
  const navigate = useNavigate();

  const loadProjects = async () => {
    setLoading(true);
    try {
      const [projectsRes, clientsRes] = await Promise.all([
        projectService.list({ search, status, clientId }),
        clientService.list()
      ]);
      setProjects(projectsRes.data?.data || []);
      setClients(clientsRes.data?.data || []);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [search, status, clientId]);

  const handleDelete = async (project) => {
    if (!window.confirm(`Delete ${project.project_name}?`)) return;
    try {
      await projectService.delete(project.project_id);
      loadProjects();
    } catch (err) {
      alert(err?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <AminLayout activeLabel="Projects">
      <div className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Project / Contract Management</h1>
            <p className="text-sm text-slate-600">Manage projects, client linkage, deadlines, and location details</p>
          </div>
          <Link to="/amin/projects/new" className="primary-btn">+ New Project</Link>
        </div>

        <div className="mt-6 grid gap-3 rounded bg-white p-4 shadow-sm md:grid-cols-[2fr_1fr_1fr]">
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="h-12 border border-slate-200 px-3" placeholder="Search project or client" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-12 border border-slate-200 px-3">
            <option value="">Status ▼</option><option value="Planned">Planned</option><option value="Ongoing">Ongoing</option><option value="Delayed">Delayed</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option>
          </select>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="h-12 border border-slate-200 px-3">
            <option value="">Client ▼</option>
            {clients.map((client) => <option key={client.client_id} value={client.client_id}>{client.company_name}</option>)}
          </select>
        </div>

        {error ? <div className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        <div className="mt-6 overflow-x-auto bg-slate-50">
          <table className="w-full min-w-[940px]">
            <thead>
              <tr className="text-left text-sm font-black">
                {['Project','Client','Start Date','Deadline','Budget','Assigned','Status','Actions'].map((h)=><th key={h} className="px-4 py-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center">Loading projects…</td></tr>
              ) : projects.length === 0 ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center">No projects found.</td></tr>
              ) : projects.map((p)=><tr key={p.project_id} className="border-t border-white text-sm font-bold">
                <td className="px-4 py-3">{p.project_name}<div className="text-xs font-medium text-slate-500">{p.location_name || 'No location'}</div></td>
                <td className="px-4 py-3">{p.client_name || p.client_id}</td>
                <td className="px-4 py-3">{formatDate(p.start_date)}</td>
                <td className="px-4 py-3">{formatDate(p.deadline)}</td>
                <td className="px-4 py-3">{formatCurrency(p.budget)}</td>
                <td className="px-4 py-3">{p.assigned_user_id || '—'}</td>
                <td className="px-4 py-3">{p.status}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 text-cps-deepBlue">
                    <button onClick={() => navigate(`/amin/projects/${p.project_id}`)} className="hover:underline">View</button>
                    <button onClick={() => navigate(`/amin/projects/${p.project_id}/edit`)} className="hover:underline">Edit</button>
                    <button onClick={() => handleDelete(p)} className="hover:underline text-red-600">Delete</button>
                  </div>
                </td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </AminLayout>
  );
}
