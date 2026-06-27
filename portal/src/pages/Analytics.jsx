import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const EVENT_LABELS = {
  STATUS_CHECK: 'בדיקות מצב',
  MAINTENANCE_SHOWN: 'ראו מסך תחזוקה',
  UPDATE_SHOWN: 'ראו דרישת עדכון',
  FEATURE_BLOCKED: 'נתקלו בפיצ׳ר חסום',
};

// Reads ONLY from hourly_stats (the aggregate) - never from raw events.
export default function Analytics({ project }) {
  const [a, setA] = useState(null);
  useEffect(() => { api.analytics(project.id).then(setA); }, [project.id]);
  if (!a) return <div className="muted">טוען…</div>;

  const dist = a.versionDist || {};
  const maxCount = Math.max(1, ...Object.values(dist));

  return (
    <>
      <h1>אנליטיקה</h1>
      <p className="subtitle">נתונים מצטברים מטבלת הסיכום השעתי בלבד — 24 השעות האחרונות.</p>
      <div className="grid cols-2">
        <div className="card">
          <div className="label">מכשירים ייחודיים (24ש׳)</div>
          <div className="big-number">{a.devices24h.toLocaleString()}</div>
          <div className="spacer-v" />
          {Object.entries(EVENT_LABELS).map(([k, label]) => (
            <div className="row" key={k} style={{ justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
              <span className="muted">{label}</span>
              <span className="mono">{(a.eventCounts[k] || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="label">התפלגות גרסאות פעילות — מי עדיין על גרסה ישנה?</div>
          {Object.keys(dist).length === 0 ? <div className="muted" style={{ marginTop: 16 }}>אין נתונים עדיין</div> : (
            <div className="bars" style={{ height: 200 }}>
              {Object.entries(dist).sort((x, y) => x[0] - y[0]).map(([v, c]) => (
                <div className="bar-col" key={v}>
                  <div className="mono label">{c}</div>
                  <div className="bar" style={{ height: `${(c / maxCount) * 100}%` }} />
                  <div className="label mono">v{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
