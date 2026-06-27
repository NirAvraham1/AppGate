import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getToken, api } from './api.js';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Maintenance from './pages/Maintenance.jsx';
import Versions from './pages/Versions.jsx';
import Features from './pages/Features.jsx';
import Analytics from './pages/Analytics.jsx';
import Audit from './pages/Audit.jsx';
import Crashes from './pages/Crashes.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [project, setProject] = useState(null);

  useEffect(() => {
    if (!authed) return;
    api.projects().then(ps => setProject(ps[0] || null)).catch(() => {});
  }, [authed]);

  if (!authed) return <Login onLogin={() => setAuthed(true)} />;
  if (!project) return <div className="login-wrap"><div className="muted">טוען פרויקט…</div></div>;

  return (
    <Layout project={project}>
      <Routes>
        <Route path="/" element={<Dashboard project={project} />} />
        <Route path="/maintenance" element={<Maintenance project={project} />} />
        <Route path="/versions" element={<Versions project={project} />} />
        <Route path="/features" element={<Features project={project} />} />
        <Route path="/analytics" element={<Analytics project={project} />} />
        <Route path="/audit" element={<Audit project={project} />} />
        <Route path="/crashes" element={<Crashes project={project} />} />
        <Route path="/settings" element={<Settings project={project} onProjectCreated={setProject} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}
