import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

// Who changed what, and when - mandatory in a tool that can switch an app off.
export default function Audit({ project }) {
  const [data, setData] = useState({ items: [], page: 1, totalPages: 1 });
  const load = (page = 1) => api.auditLog(project.id, page).then(setData);
  useEffect(() => { load(); }, [project.id]);

  return (
    <>
      <h1>Audit Log</h1>
      <p className="subtitle">היסטוריית שינויים מלאה — נכתב פעם אחת ולא משתנה.</p>
      <div className="card">
        <table>
          <thead><tr><th>מתי</th><th>מי</th><th>פעולה</th><th>פרטים</th></tr></thead>
          <tbody>
            {data.items.map(item => (
              <tr key={item._id}>
                <td className="mono">{new Date(item.timestamp).toLocaleString('he-IL')}</td>
                <td>{item.userEmail}</td>
                <td className="mono">{item.action}</td>
                <td className="mono muted">{JSON.stringify(item.details)}</td>
              </tr>
            ))}
            {data.items.length === 0 && <tr><td colSpan={4} className="muted">אין רשומות עדיין</td></tr>}
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
