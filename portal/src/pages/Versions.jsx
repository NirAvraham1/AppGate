import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Versions({ project }) {
  const [vp, setVp] = useState({ min: 0, soft: 0, url: '' });
  const [saved, setSaved] = useState('');

  useEffect(() => {
    api.state(project.id).then(s => setVp({
      min: s.directive.versionPolicy?.min || 0,
      soft: s.directive.versionPolicy?.soft || 0,
      url: s.directive.versionPolicy?.url || '',
    }));
  }, [project.id]);

  async function save() {
    await api.versionPolicy(project.id, { min: +vp.min, soft: +vp.soft, url: vp.url });
    setSaved('נשמר'); setTimeout(() => setSaved(''), 2500);
  }

  return (
    <>
      <h1>מדיניות גרסאות</h1>
      <p className="subtitle">אכיפה מדורגת: רכה (באנר שאפשר לסגור) או חובה (דיאלוג חוסם + כפתור לחנות).</p>
      <div className="card" style={{ maxWidth: 520 }}>
        <div className="field"><label>minVersion — מתחת לזה: עדכון חובה (FORCE_UPDATE)</label>
          <input type="number" value={vp.min} onChange={e => setVp({ ...vp, min: e.target.value })} /></div>
        <div className="field"><label>softMinVersion — מתחת לזה: באנר עדכון רך (SOFT_UPDATE)</label>
          <input type="number" value={vp.soft} onChange={e => setVp({ ...vp, soft: e.target.value })} /></div>
        <div className="field"><label>קישור לדף האפליקציה בחנות</label>
          <input value={vp.url} onChange={e => setVp({ ...vp, url: e.target.value })} dir="ltr" /></div>
        <button className="btn btn-primary" onClick={save}>שמור</button>
        {saved && <span style={{ color: 'var(--ok)', marginRight: 10 }}>{saved}</span>}
      </div>
    </>
  );
}
