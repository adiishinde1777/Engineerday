const RAW_API_URL = import.meta.env.VITE_API_URL || '';
export const API_BASE = RAW_API_URL ? `${RAW_API_URL.replace(/\/$/, '')}/api` : '/api';

export function getAuthToken() {
  return localStorage.getItem('engineers_day_admin_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('engineers_day_admin_token', token);
  } else {
    localStorage.removeItem('engineers_day_admin_token');
  }
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new Error(
      `Cannot connect to backend: ${err.message || 'Network error'}. Make sure the backend server is running.`
    );
  }

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          'Backend API is not available on this domain. Netlify only hosts static frontend files. Please deploy the full-stack server on Render or set VITE_API_URL.'
        );
      }
      throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
    }
    throw new Error('Server returned an unexpected response format.');
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  return data;
}


export const api = {
  // Auth
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getMe: () => request('/auth/me'),
  changePassword: (currentPassword, newPassword) => request('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),

  // Settings
  getSettings: () => request('/settings'),
  updateEventSettings: (settings) => request('/settings/event', { method: 'PUT', body: JSON.stringify(settings) }),
  getScoringSettings: () => request('/settings/scoring'),
  updateScoringSettings: (game, settings) => request(`/settings/scoring/${game}`, { method: 'PUT', body: JSON.stringify(settings) }),

  // Teams
  getTeams: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/teams${query ? `?${query}` : ''}`);
  },
  getTeam: (id) => request(`/teams/${id}`),
  createTeam: (teamData) => request('/teams', { method: 'POST', body: JSON.stringify(teamData) }),
  verifySquad: (identifier, password) => request('/teams/verify', { method: 'POST', body: JSON.stringify({ identifier, password }) }),
  updateTeam: (id, teamData) => request(`/teams/${id}`, { method: 'PUT', body: JSON.stringify(teamData) }),
  deleteTeam: (id) => request(`/teams/${id}`, { method: 'DELETE' }),
  clearSeedTeams: () => request('/teams/seed/clear', { method: 'DELETE' }),
  importTeams: (teams) => request('/teams/import', { method: 'POST', body: JSON.stringify({ teams }) }),
  syncGoogleSheet: (data) => request('/teams/sync-google-sheet', { method: 'POST', body: JSON.stringify(data) }),
  getGoogleApiConfig: () => request('/teams/google-api-config'),
  updateGoogleApiConfig: (data) => request('/teams/google-api-config', { method: 'PUT', body: JSON.stringify(data) }),

  // Questions
  getQuestions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/questions${query ? `?${query}` : ''}`);
  },
  getQuestion: (id) => request(`/questions/${id}`),
  createQuestion: (data) => request('/questions', { method: 'POST', body: JSON.stringify(data) }),
  updateQuestion: (id, data) => request(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuestion: (id) => request(`/questions/${id}`, { method: 'DELETE' }),
  duplicateQuestion: (id) => request(`/questions/${id}/duplicate`, { method: 'POST' }),

  // Faculty
  getFaculty: () => request('/faculty'),
  createFaculty: (data) => request('/faculty', { method: 'POST', body: JSON.stringify(data) }),
  updateFaculty: (id, data) => request(`/faculty/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFaculty: (id) => request(`/faculty/${id}`, { method: 'DELETE' }),
  setFacultyHOD: (id) => request(`/faculty/${id}/set-hod`, { method: 'POST' }),

  // Games
  getGameSession: (game) => request(`/games/session/${game}`),
  controlGame: (game, actionData) => request(`/games/control/${game}`, { method: 'POST', body: JSON.stringify(actionData) }),
  submitAnswer: (submission) => request('/games/submit-answer', { method: 'POST', body: JSON.stringify(submission) }),
  finishSquadRound: (data) => request('/games/finish-squad-round', { method: 'POST', body: JSON.stringify(data) }),
  judgePictionary: (judgeData) => request('/games/judge-pictionary', { method: 'POST', body: JSON.stringify(judgeData) }),
  getGameMonitor: (game) => request(`/games/monitor/${game}`),
};
