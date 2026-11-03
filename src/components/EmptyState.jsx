import React from "react";
import { PawPrint, ArrowRight } from "lucide-react";

export function EmptyState({ title, children, action, onAction }) {
  return <div className="empty-state"><span className="empty-icon"><PawPrint size={25} /></span>
    <h3>{title}</h3><p>{children}</p>
    {action && <button className="primary" onClick={onAction}>{action}<ArrowRight size={15} /></button>}
  </div>;
}
