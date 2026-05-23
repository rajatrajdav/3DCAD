// Simple localStorage-based auth — no backend required

const USERS_KEY = '3dcad_users';
const SESSION_KEY = '3dcad_session';

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
  catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function registerUser({ firstName, lastName, email, phone, password, preference }) {
  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: 'An account with this email already exists.' };
  }
  const user = { id: Date.now(), firstName, lastName, email, phone, preference, password };
  saveUsers([...users, user]);
  setSession(user);
  return { ok: true, user };
}

export function loginUser({ email, password }) {
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return { ok: false, error: 'No account found with this email.' };
  if (user.password !== password) return { ok: false, error: 'Incorrect password.' };
  setSession(user);
  return { ok: true, user };
}

export function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, preference: user.preference }));
}

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}
