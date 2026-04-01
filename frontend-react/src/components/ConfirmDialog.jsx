import { useEffect, useRef } from 'react';

export default function ConfirmDialog({ isOpen, title, message, confirmLabel = 'Delete', danger = true, onConfirm, onCancel }) {
  const msgId = 'confirm-msg';
  const titleId = 'confirm-title';
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const frame = requestAnimationFrame(() => {
      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable?.length) focusable[0].focus();
    });

    const handleKey = (e) => {
      if (e.key === 'Escape') { onCancel(); return; }
      if (e.key !== 'Tab') return;
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll('button:not([disabled])') ?? []
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      cancelAnimationFrame(frame);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={msgId}
        className="modal-box"
        style={{ maxWidth: 400 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id={titleId} className="text-base font-semibold text-gray-900">{title || 'Confirm'}</h3>
        </div>
        <div className="modal-body">
          <p id={msgId} className="text-sm text-gray-600">{message || 'Are you sure?'}</p>
        </div>
        <div className="modal-footer">
          <button onClick={onCancel} className="btn btn-outline">Cancel</button>
          <button onClick={onConfirm} className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
