import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import PhonePreview from '../components/PhonePreview.jsx';

const toLocal = (d) => d ? new Date(d).toISOString().slice(0, 16) : '';

// Scheduling + content: future windows (UTC) and the screen the user sees,
// with a live preview.
export default function Maintenance({ project }) {
  const [m, setM] = useState({ title: '', message: '', returnAt: '', from: '', to: '', maxVersion: '' });
  const [saved, setSaved] = useState('');

  useEffect(() => {
    api.state(project.id).then(s => {
      const mm = s.directive.maintenance || {};
      setM({ title: mm.title || '', message: mm.message || '', returnAt: mm.returnAt || '',
             from: toLocal(mm.from), to: toLocal(mm.to), maxVersion: mm.maxVersion || '' });
    });
  }, [project.id]);

  async function save() {
    await api.maintenance(project.id, {
      title: m.title, message: m.message, returnAt: m.returnAt,
      from: m.from ? new Date(m.from).toISOString() : null,
      to: m.to ? new Date(m.to).toISOString() : null,
      maxVersion: m.maxVersion ? parseInt(m.maxVersion, 10) : null,
    });
    setSaved('נשמר — ההנחיה תגיע למכשירים ברענון הבא');
    setTimeout(() => setSaved(''), 3000);
  }
  const set = (k) => (e) => setM({ ...m, [k]: e.target.value });

  return (
    <>
      <h1>תחזוקה מתוזמנת ותוכן</h1>
      <p className="subtitle">חלון עתידי נכנס ויוצא אוטומטית — בלי לגעת בכפתור החירום.</p>
      <div className="grid cols-2">
        <div className="card">
          <div className="field"><label>כותרת</label><input value={m.title} onChange={set('title')} /></div>
          <div className="field"><label>הודעה</label><textarea rows={3} value={m.message} onChange={set('message')} /></div>
          <div className="field"><label>שעת חזרה (טקסט חופשי, למשל 03:00)</label><input value={m.returnAt} onChange={set('returnAt')} /></div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}><label>תחילת חלון (UTC)</label>
              <input type="datetime-local" value={m.from} onChange={set('from')} /></div>
            <div className="field" style={{ flex: 1 }}><label>סיום חלון (UTC)</label>
              <input type="datetime-local" value={m.to} onChange={set('to')} /></div>
          </div>
          <div className="field"><label>Targeting: רק לגרסאות עד versionCode (רשות)</label>
            <input type="number" placeholder="למשל 200 — תחזוקה רק לגרסאות מתחת 2.0" value={m.maxVersion} onChange={set('maxVersion')} /></div>
          <button className="btn btn-primary" onClick={save}>שמור</button>
          {saved && <div style={{ color: 'var(--ok)', fontSize: 13, marginTop: 8 }}>{saved}</div>}
        </div>
        <div className="card">
          <div className="label" style={{ marginBottom: 12 }}>תצוגה מקדימה — מה המשתמש יראה</div>
          <PhonePreview title={m.title} message={m.message} returnAt={m.returnAt} />
        </div>
      </div>
    </>
  );
}
