import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Features({ project }) {
  const [features, setFeatures] = useState({});
  const [newKey, setNewKey] = useState('');

  const load = () => api.state(project.id).then(s => setFeatures(s.directive.features || {}));
  useEffect(() => { load(); }, [project.id]);

  async function toggle(key, enabled) { await api.setFeature(project.id, key, { enabled, msg: features[key]?.msg }); load(); }
  async function saveMsg(key) { await api.setFeature(project.id, key, { enabled: features[key]?.enabled, msg: features[key]?.msg }); load(); }
  async function add() {
    const key = newKey.trim(); if (!key) return;
    await api.setFeature(project.id, key, { enabled: true, msg: '' });
    setNewKey(''); load();
  }
  async function remove(key) { await api.deleteFeature(project.id, key); load(); }

  return (
    <>
      <h1>Feature Flags</h1>
      <p className="subtitle">כיבוי פיצ'ר בודד בלי לפגוע בשאר האפליקציה. ההודעה החלופית מוצגת במקום הפיצ'ר.</p>
      <div className="card">
        {Object.entries(features).map(([key, f]) => (
          <div className="feature-row" key={key}>
            <label className="switch">
              <input type="checkbox" checked={!!f.enabled} onChange={e => toggle(key, e.target.checked)} />
              <span className="track" />
            </label>
            <span className="feature-key" style={{ minWidth: 110 }}>{key}</span>
            <input placeholder="הודעה חלופית כשהפיצ'ר כבוי" value={f.msg || ''}
              onChange={e => setFeatures({ ...features, [key]: { ...f, msg: e.target.value } })}
              onBlur={() => saveMsg(key)} />
            <button className="btn btn-ghost" onClick={() => remove(key)}>מחק</button>
          </div>
        ))}
        <div className="spacer-v" />
        <div className="row">
          <input placeholder="feature key חדש (למשל payments)" value={newKey} dir="ltr"
            onChange={e => setNewKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
          <button className="btn btn-primary" onClick={add}>הוסף</button>
        </div>
      </div>
    </>
  );
}
