interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export default function ToggleSwitch({ checked, onChange, label, disabled }: Props) {
  return (
    <label className={`toggle-switch-row${disabled ? ' disabled' : ''}`}>
      <span className="toggle-switch-label">{label}</span>
      <span className="toggle-switch">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="toggle-switch-track">
          <span className="toggle-switch-thumb" />
        </span>
      </span>
    </label>
  );
}
