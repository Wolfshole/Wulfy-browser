import { useState } from 'react';

interface Props {
  title: string;
  hint: string;
  placeholder: string;
  entries: string[];
  onAdd: (domain: string) => void;
  onRemove: (domain: string) => void;
}

export default function DomainListEditor({ title, hint, placeholder, entries, onAdd, onRemove }: Props) {
  const [draft, setDraft] = useState('');

  const handleAdd = () => {
    if (!draft.trim()) return;
    onAdd(draft.trim());
    setDraft('');
  };

  return (
    <div className="domain-list-editor">
      <p className="settings-page-hint" style={{ fontWeight: 600, marginBottom: 4 }}>
        {title}
      </p>
      <p className="settings-page-hint">{hint}</p>

      <div className="domain-list-input-row">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          placeholder={placeholder}
        />
        <button className="small-btn" onClick={handleAdd}>
          Hinzufügen
        </button>
      </div>

      {entries.length > 0 && (
        <ul className="domain-list">
          {entries.map((domain) => (
            <li key={domain}>
              <span>{domain}</span>
              <button className="delete-btn" onClick={() => onRemove(domain)}>
                🗑️
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
