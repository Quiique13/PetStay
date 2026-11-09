import type { ReactNode } from "react";
import { PawPrint, ArrowRight } from "lucide-react";

interface EmptyStateProps {
  title: string;
  children: ReactNode;
  action?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  children,
  action,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <PawPrint size={25} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action && (
        <button className="primary" onClick={onAction}>
          {action}
          <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}
