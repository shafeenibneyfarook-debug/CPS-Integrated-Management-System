import Sidebar from '../components/Sidebar';

export default function RikumLayout({ activeLabel, children }) {
  return (
    <div className="page-shell">
      <div className="app-frame bg-cps-canvas">
        <Sidebar variant="black" activeLabel={activeLabel} />
        <main className="min-w-0 flex-1 overflow-x-auto bg-cps-canvas">{children}</main>
      </div>
    </div>
  );
}
