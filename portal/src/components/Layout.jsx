import React from 'react';
import { NavLink } from 'react-router-dom';
import { getUser, logout } from '../api.js';

const links = [
  { to: '/', label: '🚨 לוח חירום', cls: 'emergency', end: true },
  { to: '/maintenance', label: 'תחזוקה מתוזמנת' },
  { to: '/versions', label: 'מדיניות גרסאות' },
  { to: '/features', label: 'Feature Flags' },
  { to: '/analytics', label: 'אנליטיקה' },
  { to: '/audit', label: 'Audit Log' },
  { to: '/crashes', label: 'קראשים' },
  { to: '/settings', label: 'הגדרות' },
];

export default function Layout({ project, children }) {
  const user = getUser();
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">App<span>Gate</span></div>
        <div className="project-pill">{project.name}</div>
        {links.map(l => (
          <NavLink key={l.to} to={l.to} end={l.end}
            className={({ isActive }) => `nav-link ${l.cls || ''} ${isActive ? 'active' : ''}`}>
            {l.label}
          </NavLink>
        ))}
        <div className="spacer" />
        <div className="user-row">
          <span>{user?.name || user?.email}</span>
          <button onClick={logout}>יציאה</button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
