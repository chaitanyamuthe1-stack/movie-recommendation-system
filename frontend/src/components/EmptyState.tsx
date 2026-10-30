import React from 'react';
import { Film } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No films found",
  message = "Try exploring different genres, searching another title, or asking our AI assistant.",
  icon,
  action
}) => {
  return (
    <div className="empty-state-box">
      <div className="empty-state-icon">
        {icon || <Film size={36} />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
};
