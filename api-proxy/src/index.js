const ALLOWED_ORIGIN = 'https://lucasmedceuma18-sudo.github.io';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}
function hexToBytes(hex) {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.substr(i * 2, 2), 16);
  return arr;
}
async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
  return { hash: bytesToHex(new Uint8Array(bits)), salt: bytesToHex(salt) };
}
function newToken() {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
}

async function getUserFromToken(env, request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const row = await env.DB.prepare('SELECT user_id, expires_at FROM sessions WHERE token = ?').bind(token).first();
  if (!row) return null;
  if (row.expires_at < Date.now()) return null;
  return row.user_id;
}

async function fullState(env) {
  const patients = await env.DB.prepare('SELECT id, data, updated_at FROM patients').all();
  const history = await env.DB.prepare('SELECT id, data, updated_at FROM history').all();
  return {
    patients: patients.results.map((r) => ({ ...JSON.parse(r.data), id: r.id, updatedAt: r.updated_at })),
    history: history.results.map((r) => ({ ...JSON.parse(r.data), id: r.id, updatedAt: r.updated_at })),
  };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/register') {
      const body = await request.json().catch(() => null);
      if (!body || !body.username || !body.password || !body.inviteCode) {
        return json({ error: 'campos obrigatórios: username, password, inviteCode' }, 400);
      }
      if (body.inviteCode !== env.INVITE_CODE) {
        return json({ error: 'código da equipe inválido' }, 403);
      }
      if (body.password.length < 6) {
        return json({ error: 'senha deve ter ao menos 6 caracteres' }, 400);
      }
      const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(body.username).first();
      if (existing) return json({ error: 'usuário já existe' }, 409);
      const { hash, salt } = await hashPassword(body.password);
      const result = await env.DB.prepare(
        'INSERT INTO users (username, password_hash, salt, created_at) VALUES (?, ?, ?, ?)'
      ).bind(body.username, hash, salt, Date.now()).run();
      const userId = result.meta.last_row_id;
      const token = newToken();
      await env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
        .bind(token, userId, Date.now() + SESSION_TTL_MS).run();
      return json({ token, username: body.username });
    }

    if (request.method === 'POST' && url.pathname === '/login') {
      const body = await request.json().catch(() => null);
      if (!body || !body.username || !body.password) {
        return json({ error: 'campos obrigatórios: username, password' }, 400);
      }
      const user = await env.DB.prepare('SELECT id, password_hash, salt FROM users WHERE username = ?').bind(body.username).first();
      if (!user) return json({ error: 'usuário ou senha inválidos' }, 401);
      const { hash } = await hashPassword(body.password, user.salt);
      if (hash !== user.password_hash) return json({ error: 'usuário ou senha inválidos' }, 401);
      const token = newToken();
      await env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
        .bind(token, user.id, Date.now() + SESSION_TTL_MS).run();
      return json({ token, username: body.username });
    }

    if (request.method === 'POST' && url.pathname === '/reset-password') {
      const body = await request.json().catch(() => null);
      if (!body || !body.username || !body.inviteCode || !body.newPassword) {
        return json({ error: 'campos obrigatórios: username, inviteCode, newPassword' }, 400);
      }
      if (body.inviteCode !== env.INVITE_CODE) {
        return json({ error: 'código da equipe inválido' }, 403);
      }
      if (body.newPassword.length < 6) {
        return json({ error: 'senha deve ter ao menos 6 caracteres' }, 400);
      }
      const user = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(body.username).first();
      if (!user) return json({ error: 'usuário não encontrado' }, 404);
      const { hash, salt } = await hashPassword(body.newPassword);
      await env.DB.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').bind(hash, salt, user.id).run();
      await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run();
      const token = newToken();
      await env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
        .bind(token, user.id, Date.now() + SESSION_TTL_MS).run();
      return json({ token, username: body.username });
    }

    if (request.method === 'POST' && url.pathname === '/sync') {
      const userId = await getUserFromToken(env, request);
      if (!userId) return json({ error: 'não autenticado' }, 401);
      const body = await request.json().catch(() => null);
      if (!body) return json({ error: 'json inválido' }, 400);

      for (const p of body.deletedPatientIds || []) {
        const delId = String(p);
        await env.DB.prepare('DELETE FROM patients WHERE id = ?').bind(delId).run();
        await env.DB.prepare('INSERT INTO tombstones (id, deleted_at) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET deleted_at=excluded.deleted_at')
          .bind(delId, Date.now()).run();
      }
      for (const p of body.patients || []) {
        const idStr = String(p.id);
        const tomb = await env.DB.prepare('SELECT id FROM tombstones WHERE id = ?').bind(idStr).first();
        if (tomb) continue; // id excluído permanentemente — nunca ressuscitar, mesmo com updatedAt mais novo
        const existing = await env.DB.prepare('SELECT updated_at FROM patients WHERE id = ?').bind(idStr).first();
        if (!existing || p.updatedAt > existing.updated_at) {
          const { id, updatedAt, ...rest } = p;
          await env.DB.prepare('INSERT INTO patients (id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at')
            .bind(idStr, JSON.stringify(rest), updatedAt).run();
        }
      }
      for (const h of body.history || []) {
        const hIdStr = String(h.id);
        const hTomb = await env.DB.prepare('SELECT id FROM history_tombstones WHERE id = ?').bind(hIdStr).first();
        if (hTomb) continue; // registro de histórico removido manualmente — nunca ressuscitar
        const existing = await env.DB.prepare('SELECT updated_at FROM history WHERE id = ?').bind(hIdStr).first();
        if (!existing || h.updatedAt > existing.updated_at) {
          const { id, updatedAt, ...rest } = h;
          await env.DB.prepare('INSERT INTO history (id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at')
            .bind(hIdStr, JSON.stringify(rest), updatedAt).run();
        }
      }

      const state = await fullState(env);
      return json(state);
    }

    return json({ error: 'not found' }, 404);
  },
};
