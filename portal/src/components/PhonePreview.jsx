import React from 'react';

// Live preview of the maintenance screen the SDK will render.
export default function PhonePreview({ title, message, returnAt }) {
  return (
    <div className="phone">
      <div style={{ fontSize: 34, marginBottom: 8 }}>🚧</div>
      <div className="ph-title">{title || 'שיפורים בדרך'}</div>
      <div className="ph-msg">{message || 'אנחנו משדרגים את המערכת'}</div>
      {returnAt && <div className="ph-return">⏱ נחזור בשעה {returnAt}</div>}
      <div><button className="ph-btn">נסה שוב</button></div>
    </div>
  );
}
