import Sidebar from '../components/Sidebar';

export default function AminLayout({ activeLabel, children }) {
  return (
    <div className="page-shell">
      <div className="app-frame bg-cps-canvas p-2">
        <Sidebar variant="black" activeLabel={activeLabel} />
        <main className="min-w-0 flex-1 bg-cps-canvas">
          {children}
        </main>
      </div>
    </div>
  );
}
