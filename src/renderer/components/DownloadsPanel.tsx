import type { DownloadRecord } from "../electron.d";

interface Props {
  downloads: DownloadRecord[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatSpeed(bytesPerSec?: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return "";
  return `${formatBytes(bytesPerSec)}/s`;
}

export default function DownloadsPanel({
  downloads,
  onPause,
  onResume,
  onCancel,
  onDelete,
}: Props) {
  if (downloads.length === 0) {
    return <p className="downloads-empty">Noch keine Downloads.</p>;
  }

  return (
    <ul className="downloads-list">
      {downloads.map((d) => (
        <li key={d.id} className="download-item">
          <div className="download-info">
            <span className="download-name">{d.fileName}</span>
            <span className="download-meta">
              {formatBytes(d.receivedBytes)} / {formatBytes(d.totalBytes)}
              {d.status === "progressing" && d.speedBytesPerSec
                ? ` · ${formatSpeed(d.speedBytesPerSec)}`
                : ""}
            </span>
          </div>

          <div className="download-progress-bar">
            <div
              className="download-progress-fill"
              style={{ width: `${d.progress}%` }}
            />
          </div>

          <div className="download-actions">
            {d.status === "progressing" && (
              <button onClick={() => onPause(d.id)}>Pause</button>
            )}
            {d.status === "paused" && d.canResume && (
              <button onClick={() => onResume(d.id)}>Fortsetzen</button>
            )}
            {(d.status === "progressing" || d.status === "paused") && (
              <button onClick={() => onCancel(d.id)}>Abbrechen</button>
            )}
            {(d.status === "completed" ||
              d.status === "cancelled" ||
              d.status === "interrupted") && (
              <button onClick={() => onDelete(d.id)}>Entfernen</button>
            )}
          </div>

          <span className={`download-status status-${d.status}`}>
            {d.status}
          </span>
        </li>
      ))}
    </ul>
  );
}
