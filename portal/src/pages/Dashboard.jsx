import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import ConfirmModal from '../components/ConfirmModal.jsx';

// The emergency board: live status, the red button, devices counter,
// version distribution and kill switches at a glance.
export default function Dashboard({ project }) {
  const [state, setState] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [updatedAgo, setUpdatedAgo] = useState(0);

  async function load() {
    const [s, a] = await Promise.all([api.state(project.id), api.analytics(project.id)]);
    setState(s); setAnalytics(a); setUpdatedAgo(0);
  }
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [project.id]);
  useEffect(() => { const t = setInterval(() => setUpdatedAgo(s => s + 1), 1000); return () => clearInterval(t); }, []);

  if (!state) return <div className="muted">טוען…</div>;
  const live = state.maintenanceLive;
  const features = state.directive.features || {};
  const dist = analytics?.versionDist || {};
  const maxCount = Math.max(1, ...Object.values(dist));

  async function toggleMaintenance(on) {
    await api.maintenance(project.id, { active: on });
    setConfirming(false); load();
  }
  async function toggleFeature(key, enabled) {
    await api.setFeature(project.id, key, { enabled, msg: features[key]?.msg });
    load();
  }

  return (
    <>
      <h1>לוח חירום</h1>
      <p className="subtitle">כל פעולה כאן משנה התנהגות של כל המכשירים בפרודקשן ברענון הבא.</p>

      <div className={`status-strip ${live ? 'MAINTENANCE' : 'NORMAL'}`}>
        <span className="dot" />
        {live ? 'האפליקציה במצב תחזוקה (MAINTENANCE)' : 'האפליקציה פעילה (NORMAL)'}
        <span className="muted" style={{ fontWeight: 400, marginRight: 'auto' }}>עודכן לפני {updatedAgo} שניות</span>
      </div>

      <div className="grid cols-3">
        <div className="card" style={{ borderColor: live ? 'var(--ok)' : 'rgba(228,88,79,.5)' }}>
          {live ? (
            <>
              <div className="label">המערכת במצב תחזוקה</div>
              <div className="spacer-v" />
              <button className="btn btn-ok" style={{ width: '100%' }} onClick={() => toggleMaintenance(false)}>סיים תחזוקה — החזר לפעילות</button>
            </>
          ) : (
            <>
              <div className="label">עצירת חירום</div>
              <div className="spacer-v" />
              <button className="btn btn-danger" style={{ width: '100%' }} onClick={() => setConfirming(true)}>הפעל מצב תחזוקה עכשיו</button>
              <div className="spacer-v" />
              <div className="label" style={{ color: 'var(--danger)' }}>דורש הקלדת שם האפליקציה לאישור</div>
            </>
          )}
        </div>
        <div className="card">
          <div className="label">מכשירים ב-24 שעות</div>
          <div className="big-number">{(analytics?.devices24h ?? 0).toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="label">התפלגות גרסאות (24ש׳)</div>
          {Object.keys(dist).length === 0 ? <div className="muted" style={{ marginTop: 16 }}>אין עדיין נתונים — חכה לבדיקות מצב מה-SDK</div> : (
            <div className="bars">
              {Object.entries(dist).sort((a, b) => a[0] - b[0]).map(([v, c]) => (
                <div className="bar-col" key={v}>
                  <div className="bar" style={{ height: `${(c / maxCount) * 100}%` }} title={`${c} בדיקות`} />
                  <div className="label mono">{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="spacer-v" />
      <div className="card">
        <div className="label" style={{ marginBottom: 6 }}>Feature Kill Switches</div>
        {Object.keys(features).length === 0 && <div className="muted">אין פיצ'רים מוגדרים — הוסף במסך Feature Flags</div>}
        {Object.entries(features).map(([key, f]) => (
          <div className="feature-row" key={key}>
            <label className="switch">
              <input type="checkbox" checked={!!f.enabled} onChange={e => toggleFeature(key, e.target.checked)} />
              <span className="track" />
            </label>
            <span className="feature-key">{key}</span>
            <span className="muted">{f.enabled ? 'פעיל' : 'כבוי — המכשירים מציגים את ההודעה החלופית'}</span>
          </div>
        ))}
      </div>

      {confirming && (
        <ConfirmModal projectName={project.name} title="הפעלת מצב תחזוקה"
          onConfirm={() => toggleMaintenance(true)} onCancel={() => setConfirming(false)} />
      )}
    </>
  );
}
