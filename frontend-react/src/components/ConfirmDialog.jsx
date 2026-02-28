import { useEffect } from 'react';

export default function ConfirmDialog({ isOpen, title, message, confirmLabel = 'Delete', danger = true, onConfirm, onCancel }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="text-base font-semibold text-gray-900">{title || 'Confirm'}</h3>
        </div>
        <div className="modal-body">
          <p className="text-sm text-gray-600">{message || 'Are you sure?'}</p>
        </div>
        <div className="modal-footer">
          <button onClick={onCancel} className="btn btn-outline">Cancel</button>
          <button onClick={onConfirm} className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
