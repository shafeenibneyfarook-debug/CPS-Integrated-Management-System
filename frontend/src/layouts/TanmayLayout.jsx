import Sidebar from '../components/Sidebar';

export default function TanmayLayout({ activeLabel, children }) {
  return (
    <div className="page-shell">
      <div className="app-frame bg-cps-canvas">
        <Sidebar activeLabel={activeLabel} />
        <main className="min-w-0 flex-1 overflow-x-auto bg-cps-canvas">{children}</main>
      </div>
    </div>
  );
}
