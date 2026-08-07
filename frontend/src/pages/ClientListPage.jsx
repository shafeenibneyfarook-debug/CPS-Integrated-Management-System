import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TanmayLayout from '../layouts/TanmayLayout';
import PageHeading from '../components/PageHeading';
import { clientService } from '../services/clientService';
import { formatDate } from '../utils/formatters';

export default function ClientListPage() {
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({ totalClients: 0, activeClients: 0, inactiveClients: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const loadClients = async () => {
    setLoading(true);
    try {
      const [clientsRes, statsRes] = await Promise.all([
        clientService.list({ search: query, clientType: type, status }),
        clientService.getStats()
      ]);
      setClients(clientsRes.data?.data || []);
      setStats(statsRes.data?.data || { totalClients: 0, activeClients: 0, inactiveClients: 0 });
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load clients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [query, type, status]);

  const filtered = useMemo(() => clients, [clients]);

  const handleDelete = async (client) => {
    if (!window.confirm(`Delete ${client.company_name}?`)) return;
    try {
      await clientService.delete(client.client_id);
      loadClients();
    } catch (err) {
      alert(err?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <TanmayLayout activeLabel="Clients">
      <PageHeading title="Client Management" subtitle="Manage client records, contact details and status" />
      <div className="grid grid-cols-1 gap-6 px-2 pb-8 md:px-4 xl:grid-cols-[minmax(0,1fr)_220px]">
        <section className="min-w-0">
          <div className="grid grid-cols-1 border border-slate-200 bg-white md:grid-cols-[2fr_1.3fr_1.1fr]">
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="h-16 px-3 text-sm font-bold outline-none" placeholder="Search by company, phone, or email" />
            <select value={type} onChange={(e) => setType(e.target.value)} className="h-16 px-3 text-sm font-bold outline-none">
              <option value="">Client Type ▼</option><option value="Corporate">Corporate</option><option value="Contractor">Contractor</option><option value="Individual">Individual</option><option value="Government">Government</option><option value="Other">Other</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-16 px-3 text-sm font-bold outline-none">
              <option value="">Status ▼</option><option value="Active">Active</option><option value="Inactive">Inactive</option>
            </select>
          </div>

          {error ? <div className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

          <div className="mt-3 overflow-x-auto bg-white">
            <table className="w-full min-w-[920px] border-collapse">
              <thead className="table-head">
                <tr>{['Company Name','Contact Person','Phone','Email','Type','Status','Updated','Action'].map((h) => <th key={h} className="px-3 py-4">{h}</th>)}</tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="px-3 py-8 text-center text-sm">Loading clients…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="8" className="px-3 py-8 text-center text-sm">No clients found.</td></tr>
                ) : filtered.map((client) => (
                  <tr key={client.client_id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="table-cell font-semibold">{client.company_name}</td>
                    <td className="table-cell">{client.contact_person}</td>
                    <td className="table-cell">{client.phone}</td>
                    <td className="table-cell">{client.email}</td>
                    <td className="table-cell">{client.client_type}</td>
                    <td className="table-cell">{client.status}</td>
                    <td className="table-cell">{formatDate(client.updated_at)}</td>
                    <td className="table-cell text-sm font-bold text-cps-deepBlue">
                      <div className="flex gap-3">
                        <button onClick={() => navigate(`/tanmay/clients/${client.client_id}`)} className="hover:underline">View</button>
                        <button onClick={() => navigate(`/tanmay/clients/${client.client_id}/edit`)} className="hover:underline">Edit</button>
                        <button onClick={() => handleDelete(client)} className="hover:underline text-red-600">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-4 pt-2">
          <Link className="primary-btn w-full" to="/tanmay/clients/new">+ Add Client</Link>
          <div className="space-y-3 pt-6">
            <div className="stat-card">Total Clients<br />{stats.totalClients}</div>
            <div className="stat-card">Active Clients<br />{stats.activeClients}</div>
            <div className="stat-card">Inactive Clients<br />{stats.inactiveClients}</div>
          </div>
        </aside>
      </div>
    </TanmayLayout>
  );
}
