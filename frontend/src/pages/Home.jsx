import { Link, useNavigate } from 'react-router-dom';
import TanmayLayout from '../layouts/TanmayLayout';
import { defaultUser } from '../data/roles';

export default function Home() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('cps-user') || 'null') || defaultUser;

  const handleLogout = () => {
    localStorage.removeItem('cps-user');
    navigate('/login');
  };

  return (
    <TanmayLayout activeLabel="Dashboard">
      <div className="p-8">
        <h1 className="text-3xl font-extrabold">CPS Module 1</h1>
        <p className="mt-3 text-slate-600">Manage clients, suppliers, and projects with the requested role-based access and login flow.</p>

        <div className="mt-6 rounded border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold">Signed-in user</h2>
              <p className="mt-2 text-sm text-slate-600">{user.name} · {user.roleLabel}</p>
            </div>
            <button onClick={handleLogout} className="rounded bg-cps-maroon px-4 py-2 text-sm font-bold text-white">Logout</button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Link to="/tanmay/clients" className="rounded bg-neutral-200 p-6 font-bold">Clients</Link>
          <Link to="/rikum/suppliers" className="rounded bg-neutral-200 p-6 font-bold">Suppliers</Link>
          <Link to="/amin/projects" className="rounded bg-neutral-200 p-6 font-bold">Projects</Link>
        </div>
      </div>
    </TanmayLayout>
  );
}
