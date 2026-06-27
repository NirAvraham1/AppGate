import React, { useState } from 'react';

// Type-to-confirm: activating maintenance for every user in production
// deserves more friction than a single click.
export default function ConfirmModal({ projectName, title, onConfirm, onCancel }) {
  const [typed, setTyped] = useState('');
  const ok = typed.trim() === projectName;
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <p className="muted">הפעולה תשפיע על כל המכשירים בפרודקשן ברענון הבא.
          כדי לאשר, הקלד את שם האפליקציה: <b className="mono">{projectName}</b></p>
        <input autoFocus value={typed} onChange={e => setTyped(e.target.value)} placeholder={projectName} />
        <div className="spacer-v" />
        <div className="row">
          <button className="btn btn-danger" disabled={!ok} onClick={onConfirm}>אישור והפעלה</button>
          <button className="btn btn-ghost" onClick={onCancel}>ביטול</button>
        </div>
      </div>
    </div>
  );
}
