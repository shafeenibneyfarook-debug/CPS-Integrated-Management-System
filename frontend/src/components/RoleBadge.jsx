export default function RoleBadge({ role }) {
  const labels = {
    admin: 'Admin',
    manager: 'Manager',
    operations: 'Operations Officer',
    accounts: 'Accounts Officer'
  };

  return (
    <span className="inline-flex rounded-full bg-cps-navy px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white">
      {labels[role] || role}
    </span>
  );
}
