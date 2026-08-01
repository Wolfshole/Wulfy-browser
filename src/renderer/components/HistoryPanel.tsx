import type { HistoryEntry } from "../hooks/useHistory";

interface Props {
  entries: HistoryEntry[];
  onNavigate: (url: string) => void;
  onDelete: (id: string) => void;
}

export default function HistoryPanel({ entries, onNavigate, onDelete }: Props) {
  if (entries.length === 0) {
    return <p className="empty-message">Kein Verlauf vorhanden</p>;
  }

  return (
    <>
      {entries.map((entry) => (
        <div className="history-item" key={entry.id}>
          <a
            href={entry.url}
            className="history-link"
            onClick={(e) => {
              e.preventDefault();
              onNavigate(entry.url);
            }}
          >
            {entry.title}
          </a>
          <button className="delete-btn" onClick={() => onDelete(entry.id)}>
            🗑️
          </button>
        </div>
      ))}
    </>
  );
}
