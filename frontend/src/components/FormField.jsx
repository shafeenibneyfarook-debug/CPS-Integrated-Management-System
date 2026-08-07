export default function FormField({ label, name, placeholder, value, onChange, type = 'text', select = false, options = [], gray = false }) {
  const className = gray ? 'field-control-gray' : 'field-control';
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {select ? (
        <select className={className} name={name} value={value} onChange={onChange}>
          <option value="">{placeholder}</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <input className={className} name={name} value={value} onChange={onChange} type={type} placeholder={placeholder} />
      )}
    </label>
  );
}
