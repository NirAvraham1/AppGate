import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

// The crash feed: instead of a giant stack trace, one readable line per crash.
// "NullPointerException · MainActivity.buildProductCards:144 · v230"
export default function Crashes({ project }) {
  const [data, setData] = useState({ items: [], page: 1, totalPages: 1 });
  const load = (page = 1) => api.crashes(project.id, page).then(setData);
  useEffect(() => { load(); }, [project.id]);

  return (
    <>
      <h1>קראשים</h1>
      <p className="subtitle">ה-SDK תופס כל קריסה, מזקק אותה ל-JSON קטן וקריא — במקום stack trace ענק.</p>
      <div className="card">
        <table>
          <thead><tr><th>מתי</th><th>חריגה</th><th>מיקום</th><th>הודעה</th><th>גרסה / מכשיר</th></tr></thead>
          <tbody>
            {data.items.map(c => (
              <tr key={c._id}>
                <td className="mono">{new Date(c.timestamp).toLocaleString('he-IL')}</td>
                <td className="mono" style={{ color: 'var(--danger)' }}>{c.exception}</td>
                <td className="mono">{c.location}</td>
                <td className="muted">{c.message}</td>
                <td className="mono muted">v{c.versionCode} · {c.device} (SDK {c.sdkInt})</td>
              </tr>
            ))}
            {data.items.length === 0 && <tr><td colSpan={5} className="muted">אין קראשים — האפליקציה יציבה 🎉</td></tr>}
          </tbody>
        </table>
        {data.totalPages > 1 && (
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn btn-ghost" disabled={data.page <= 1} onClick={() => load(data.page - 1)}>הקודם</button>
            <span className="muted">עמוד {data.page} מתוך {data.totalPages}</span>
            <button className="btn btn-ghost" disabled={data.page >= data.totalPages} onClick={() => load(data.page + 1)}>הבא</button>
          </div>
        )}
      </div>
    </>
  );
}
