import { NavLink } from 'react-router-dom';

const tanmayItems = [
  ['Dashboard', '/'],
  ['Clients', '/tanmay/clients'],
  ['Suppliers', '/rikum/suppliers'],
  ['Projects', '/amin/projects']
];

const aminItems = [
  ['Dashboard', '/'],
  ['Clients', '/tanmay/clients'],
  ['Suppliers', '/rikum/suppliers'],
  ['Projects', '/amin/projects']
];

export default function Sidebar({ variant = 'navy', activeLabel }) {
  const items = variant === 'black' ? aminItems : tanmayItems;
  const activeClass = variant === 'black' ? 'bg-cps-maroon text-white' : 'bg-cps-blue text-white';
  const baseClass = variant === 'black' ? 'bg-cps-charcoal' : 'bg-cps-navy';

  return (
    <aside className={`${baseClass} w-[220px] shrink-0 px-5 py-7 text-white md:w-[255px] md:px-7`}>
      <div className="mb-8 text-xl font-extrabold tracking-tight">CPS System</div>
      <nav className="space-y-1.5">
        {items.map(([label, to]) => {
          const isHash = to.startsWith('#');
          const classes = `block rounded-sm px-3 py-2 text-[15px] font-bold transition ${activeLabel === label ? activeClass : 'text-slate-200 hover:bg-white/10 hover:text-white'}`;
          if (isHash) {
            return <div key={label} className={classes}>{label}</div>;
          }
          return (
            <NavLink key={label} to={to} className={classes}>
              {label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
