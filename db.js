// ── Configuración Supabase ──
const SUPABASE_URL = 'https://bnrabwlwdsqpwefhzpti.supabase.co';
const SUPABASE_KEY = 'sb_publishable_UFngAsUwnhQCugDGzF-VPg_Vzn7fKSv';
const ADMIN_PASS_KEY = 'prode2026_admin_pass';
const DEFAULT_PASS = 'rrhh2026';

async function sbFetch(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    }
  };
  if (method === 'POST') opts.headers['Prefer'] = 'resolution=merge-duplicates';
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, opts);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Supabase ${res.status}: ${t}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function dbSet(key, value) {
  await sbFetch('prode', 'POST', { key, value });
}

async function dbGetPass() {
  try {
    const rows = await sbFetch(`prode?key=eq.${ADMIN_PASS_KEY}&select=value`);
    return rows && rows.length ? rows[0].value : DEFAULT_PASS;
  } catch(e) { return DEFAULT_PASS; }
}

async function dbSetPass(p) {
  await dbSet(ADMIN_PASS_KEY, p);
}

async function dbSavePicks(username, picks) {
  await dbSet(`picks:${username}`, JSON.stringify(picks));
}

async function dbLoadPicks(username) {
  try {
    const rows = await sbFetch(`prode?key=eq.picks:${encodeURIComponent(username)}&select=value`);
    return rows && rows.length ? JSON.parse(rows[0].value) : {};
  } catch(e) { return {}; }
}

async function dbSaveResults(results) {
  await dbSet('resultados', JSON.stringify(results));
}

async function dbLoadResults() {
  try {
    const rows = await sbFetch('prode?key=eq.resultados&select=value');
    return rows && rows.length ? JSON.parse(rows[0].value) : {};
  } catch(e) { return {}; }
}

async function dbLoadAllPicks() {
  try {
    const rows = await sbFetch('prode?key=like.picks:*&select=key,value');
    const result = {};
    (rows || []).forEach(r => {
      const username = r.key.replace('picks:', '');
      try { result[username] = JSON.parse(r.value); }
      catch(e) { result[username] = {}; }
    });
    return result;
  } catch(e) { return {}; }
}

async function dbResetAll() {
  try {
    const allPicks = await dbLoadAllPicks();
    for (const username of Object.keys(allPicks)) {
      await sbFetch(`prode?key=eq.picks:${encodeURIComponent(username)}`, 'DELETE');
    }
    await sbFetch(`prode?key=eq.resultados`, 'DELETE');
  } catch(e) {
    console.error('Error reseteando:', e);
    throw e;
  }
}

async function dbLoadHorarios() {
  try {
    const rows = await sbFetch('prode?key=eq.horarios&select=value');
    return rows && rows.length ? JSON.parse(rows[0].value) : {};
  } catch(e) { return {}; }
}

async function dbSaveHorarios(h) {
  await dbSet('horarios', JSON.stringify(h));
}

async function dbResetPicks() {
  try {
    const allPicks = await dbLoadAllPicks();
    for (const username of Object.keys(allPicks)) {
      await sbFetch(`prode?key=eq.picks:${encodeURIComponent(username)}`, 'DELETE');
    }
  } catch(e) {
    console.error('Error borrando pronósticos:', e);
    throw e;
  }
}
