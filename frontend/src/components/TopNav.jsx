import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/tanmay/clients', label: 'Clients' },
  { to: '/rikum/suppliers', label: 'Suppliers' },
  { to: '/amin/projects', label: 'Projects' },
  { to: '/login', label: 'Login' }
];

export default function TopNav() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between px-4 py-3">
        <div className="text-lg font-extrabold tracking-tight text-cps-navy">CPS Portal</div>
        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `rounded px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-cps-navy text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
