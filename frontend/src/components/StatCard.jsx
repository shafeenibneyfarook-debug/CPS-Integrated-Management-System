export default function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div>{label}</div>
      <div>{value}</div>
    </div>
  );
}
