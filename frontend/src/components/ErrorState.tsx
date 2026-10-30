import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "Could not reach the recommendation backend. Please verify the API is running.",
  onRetry
}) => {
  return (
    <div className="error-state-box">
      <div className="error-state-icon">
        <AlertCircle size={36} />
      </div>
      <h3 className="error-state-title">{title}</h3>
      <p className="error-state-message">{message}</p>
      {onRetry && (
        <button className="btn-secondary" onClick={onRetry} style={{ marginTop: '16px' }}>
          <RotateCcw size={16} />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};
