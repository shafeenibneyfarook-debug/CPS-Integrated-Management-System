export default function PageHeading({ title, subtitle, accent = false }) {
  return (
    <div className={accent ? 'bg-cps-cyan px-6 py-3 text-center' : 'px-6 py-4'}>
      <h1 className="section-title">{title}</h1>
      {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
    </div>
  );
}
