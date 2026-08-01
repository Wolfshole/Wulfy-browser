import type { DownloadRecord } from "../electron.d";
import DownloadsPanel from "./DownloadsPanel";

interface Props {
  downloads: DownloadRecord[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenFolder: () => void;
  onChooseFolder: () => void;
  onClearAll: () => void;
}

export default function DownloadsDropdown({
  downloads,
  onPause,
  onResume,
  onCancel,
  onDelete,
  onOpenFolder,
  onChooseFolder,
  onClearAll,
}: Props) {
  return (
    <div className="downloads-dropdown">
      <div className="downloads-dropdown-header">
        <h4>Downloads</h4>
        <div className="downloads-dropdown-actions">
          <button className="small-btn" onClick={onOpenFolder}>
            Ordner öffnen
          </button>
          <button className="small-btn" onClick={onChooseFolder}>
            Ordner wählen
          </button>
          <button className="small-btn" onClick={onClearAll}>
            Alle löschen
          </button>
        </div>
      </div>
      <div className="downloads-dropdown-body">
        <DownloadsPanel
          downloads={downloads}
          onPause={onPause}
          onResume={onResume}
          onCancel={onCancel}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
