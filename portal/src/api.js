// Thin API client for the portal. JWT stored in sessionStorage.
const BASE = '/v1/admin';

export function getToken() { return sessionStorage.getItem('ag_token'); }
export function setSession(token, user) {
  sessionStorage.setItem('ag_token', token);
  sessionStorage.setItem('ag_user', JSON.stringify(user));
}
export function getUser() { try { return JSON.parse(sessionStorage.getItem('ag_user')); } catch { return null; } }
export function logout() { sessionStorage.clear(); window.location.href = '/'; }

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: 'Bearer ' + getToken() } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && path !== '/auth/login') { logout(); return; }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'שגיאה בשרת');
  return data;
}

export const api = {
  login: (email, password) => req('POST', '/auth/login', { email, password }),
  projects: () => req('GET', '/projects'),
  createProject: (name, storeUrl) => req('POST', '/projects', { name, storeUrl }),
  state: (pid) => req('GET', `/projects/${pid}/state`),
  maintenance: (pid, body) => req('POST', `/projects/${pid}/maintenance`, body),
  versionPolicy: (pid, body) => req('PUT', `/projects/${pid}/version-policy`, body),
  setFeature: (pid, key, body) => req('PUT', `/projects/${pid}/features/${key}`, body),
  deleteFeature: (pid, key) => req('DELETE', `/projects/${pid}/features/${key}`),
  analytics: (pid) => req('GET', `/projects/${pid}/analytics`),
  auditLog: (pid, page = 1) => req('GET', `/projects/${pid}/audit-log?page=${page}`),
  crashes: (pid, page = 1) => req('GET', `/projects/${pid}/crashes?page=${page}`),
};
