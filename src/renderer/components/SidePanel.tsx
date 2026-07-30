import type { ReactNode } from "react";

interface Props {
  id: string;
  title: string;
  isActive: boolean;
  onClose: () => void;
  headerExtra?: ReactNode;
  children: ReactNode;
}

export default function SidePanel({
  id,
  title,
  isActive,
  onClose,
  headerExtra,
  children,
}: Props) {
  return (
    <div id={id} className={`side-panel${isActive ? " active" : ""}`}>
      <div className="panel-header">
        <h3>{title}</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>
      {headerExtra}
      <div className="panel-content">{children}</div>
    </div>
  );
}
