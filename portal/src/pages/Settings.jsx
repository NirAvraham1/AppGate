import React, { useState } from 'react';
import { api } from '../api.js';

export default function Settings({ project, onProjectCreated }) {
  const [name, setName] = useState('');
  const [storeUrl, setStoreUrl] = useState('');
  const [createdKey, setCreatedKey] = useState('');

  async function create() {
    if (!name.trim()) return;
    const res = await api.createProject(name.trim(), storeUrl.trim());
    setCreatedKey(res.apiKey);
    onProjectCreated({ id: res.id, name: res.name });
  }

  return (
    <>
      <h1>הגדרות וניהול פרויקט</h1>
      <p className="subtitle">אפליקציה = פרויקט. API Key לכל אחת, הפרדה מלאה בין לקוחות.</p>
      <div className="grid cols-2">
        <div className="card">
          <div className="label" style={{ marginBottom: 10 }}>הפרויקט הנוכחי</div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span>{project.name}</span>
            <span className="mono muted">API Key: {project.apiKeyPrefix || '—'}</span>
          </div>
          <div className="spacer-v" />
          <div className="muted" style={{ fontSize: 13 }}>המפתח המלא מוצג פעם אחת בלבד ביצירה — בשרת נשמר רק hash.</div>
        </div>
        <div className="card">
          <div className="label" style={{ marginBottom: 10 }}>פרויקט חדש</div>
          <div className="field"><label>שם האפליקציה</label><input value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="field"><label>קישור לחנות</label><input value={storeUrl} onChange={e => setStoreUrl(e.target.value)} dir="ltr" /></div>
          <button className="btn btn-primary" onClick={create}>צור פרויקט</button>
          {createdKey && (
            <div style={{ marginTop: 12 }}>
              <div className="label">ה-API Key (שמור עכשיו — לא יוצג שוב):</div>
              <div className="mono" style={{ wordBreak: 'break-all', color: 'var(--ok)' }}>{createdKey}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
