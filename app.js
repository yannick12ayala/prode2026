// ── Estado global ──
let cUser = null, isAdm = false;
let lPicks = {}, lRes = {}, allPicks = {};
let chartDist = null;
let semanaVista = null;

// ── Transición FIFA ──
function showFifaTransition() {
  const el = document.getElementById('fifaTransition');
  el.classList.remove('hidden', 'out');
  el.classList.add('active');
}
function hideFifaTransition() {
  const el = document.getElementById('fifaTransition');
  el.classList.add('out');
  setTimeout(() => {
    el.classList.add('hidden');
    el.classList.remove('active', 'out');
  }, 500);
}

function ini(n) { return String(n).slice(0, 2).toUpperCase(); }
function show(id) { ['vLogin','vEmp','vAdm'].forEach(v => document.getElementById(v).classList.toggle('hidden', v !== id)); }

// ── LOGIN ──
// Empleados: número de legajo (sin contraseña)
// RR.HH.: usuario "Prode" + contraseña "RRHHpilar2026"
const ADMIN_USER = 'Prode';
const ADMIN_PASS_FIXED = 'RRHHpilar2026';

async function doLogin() {
  const usuario = document.getElementById('iNom').value.trim();
  const pas = document.getElementById('iPass').value;
  const err = document.getElementById('loginErr');
  err.classList.add('hidden');

  if (!usuario) { err.textContent = 'Ingresá tu número de legajo'; err.classList.remove('hidden'); return; }

  const btn = document.getElementById('btnLogin');
  btn.disabled = true; btn.textContent = 'Ingresando...';
  showFifaTransition();

  try {
    // Verificar si es admin
    if (pas) {
      if (usuario.toLowerCase() === ADMIN_USER.toLowerCase() && pas === ADMIN_PASS_FIXED) {
        isAdm = true; cUser = ADMIN_USER;
        document.getElementById('aAv').textContent = 'RH';
        document.getElementById('aNom').textContent = 'Administrador';
        show('vAdm');
        await renderResumen();
        setTimeout(hideFifaTransition, 1200);
      } else {
        hideFifaTransition();
        err.textContent = 'Usuario o contraseña incorrectos'; err.classList.remove('hidden');
        btn.disabled = false; btn.textContent = 'Entrar al Prode'; return;
      }
    } else {
      // Empleado — validar legajo contra lista
      if (!/^\d+$/.test(usuario)) {
        hideFifaTransition();
        err.textContent = 'El legajo debe ser un número'; err.classList.remove('hidden');
        btn.disabled = false; btn.textContent = 'Entrar al Prode'; return;
      }
      const nombreEmpleado = EMPLEADOS[usuario];
      if (!nombreEmpleado) {
        hideFifaTransition();
        err.textContent = 'Legajo no encontrado. Consultá con RR.HH.'; err.classList.remove('hidden');
        btn.disabled = false; btn.textContent = 'Entrar al Prode'; return;
      }
      isAdm = false; cUser = usuario;
      lPicks = await dbLoadPicks(usuario);
      // Formatear nombre: "FERNANDEZ LUCIO" → "Lucio Fernandez"
      const partes = nombreEmpleado.split(' ');
      const apellido = partes[0];
      const nombre = partes.slice(1).join(' ') || apellido;
      const nombreFormateado = (nombre + ' ' + apellido).split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ').trim();
      document.getElementById('eAv').textContent = nombreFormateado.split(' ').map(w=>w[0]).join('').slice(0,2);
      document.getElementById('eNom').textContent = nombreFormateado;
      show('vEmp');
      semanaVista = semanaActual();
      renderEmpleado();
      updEmpStats();
      setTimeout(hideFifaTransition, 1200);
    }
  } catch(e) {
    hideFifaTransition();
    err.textContent = 'Error de conexión. Intentá de nuevo.';
    err.classList.remove('hidden');
  }
  btn.disabled = false; btn.textContent = 'Entrar al Prode';
}

function doLogout() {
  cUser = null; isAdm = false; lPicks = {}; lRes = {}; allPicks = {};
  document.getElementById('iNom').value = '';
  document.getElementById('iPass').value = '';
  show('vLogin');
}

// ── EMPLEADO ──
function updEmpStats() {
  const n = Object.values(lPicks).filter(p => p && p.l != null && p.v != null).length;
  const pct = Math.round(n / 104 * 100);
  document.getElementById('ePicks').textContent = n;
  document.getElementById('ePct').textContent = pct + '%';
  document.getElementById('ePbar').style.width = pct + '%';
  document.getElementById('empSaveMsg').textContent = n > 0 ? `${n} pronósticos cargados` : 'Cargá tus pronósticos y guardá';
}

function setGol(mid, lado, valor) {
  if (!cUser || isAdm) return;
  if (!lPicks[mid]) lPicks[mid] = { l: null, v: null };
  const num = valor === '' ? null : parseInt(valor, 10);
  if (lado === 'l') lPicks[mid].l = isNaN(num) ? null : num;
  if (lado === 'v') lPicks[mid].v = isNaN(num) ? null : num;
  updEmpStats();
}

async function empGuardar() {
  const btn = document.getElementById('btnEGuardar');
  btn.disabled = true; btn.textContent = 'Guardando...';
  try {
    // Limpiar picks vacíos antes de guardar
    const picksLimpios = {};
    Object.keys(lPicks).forEach(k => {
      const p = lPicks[k];
      if (p && p.l != null && p.v != null) picksLimpios[k] = p;
    });
    lPicks = picksLimpios;
    await dbSavePicks(cUser, lPicks);
    document.getElementById('empSaveMsg').textContent = '✓ Pronósticos guardados correctamente';
  } catch(e) {
    document.getElementById('empSaveMsg').textContent = 'Error al guardar. Intentá de nuevo.';
  }
  btn.disabled = false; btn.textContent = 'Guardar pronósticos';
}

function matchRowEmp(p) {
  const pk = lPicks[p.id] || { l: null, v: null };
  const vL = pk.l != null ? pk.l : '';
  const vV = pk.v != null ? pk.v : '';
  return `<div class="match-row" data-mid="${p.id}">
    <div class="match-date">${p.f}</div>
    <div class="match-team match-team-loc">${p.loc}</div>
    <div class="score-input">
      <input type="number" min="0" max="20" placeholder="–" value="${vL}" onchange="setGol('${p.id}','l',this.value)"/>
      <span class="score-dash">:</span>
      <input type="number" min="0" max="20" placeholder="–" value="${vV}" onchange="setGol('${p.id}','v',this.value)"/>
    </div>
    <div class="match-team match-team-vis">${p.vis}</div>
  </div>`;
}

function renderEmpleado() {
  const actual = semanaActual();
  const habilitadas = SEMANAS.filter(s => s.id <= actual);
  const bloqueadas  = SEMANAS.filter(s => s.id > actual);

  // Nav
  const navHtml = habilitadas.map(s =>
    `<button class="nav-btn ${s.id === semanaVista ? 'active' : ''}" onclick="cambiarSemana(${s.id})">Sem. ${s.id}</button>`
  ).join('') + `<button class="nav-btn" onclick="mostrarRankingEmp(this)" style="margin-left:auto;border-color:var(--gold);color:var(--gold)">🏆 Ranking</button>`;
  document.getElementById('empNav').innerHTML = navHtml;

  // Contenido
  const sem = SEMANAS.find(s => s.id === semanaVista);
  if (!sem) return;
  const partidos = TODOS.filter(p => p.semana === semanaVista);

  let html = `<div class="semana-header">
    <span class="semana-badge">Semana ${semanaVista}</span> ${sem.label}
  </div>
  <div class="semana-meta">Disponible desde el ${fmtFecha(sem.desde)}</div>`;

  if (semanaVista <= 3) {
    // Por grupos
    const ids = [...new Set(partidos.filter(p => p.g).map(p => p.g))];
    html += `<div class="groups-grid">`;
    ids.forEach(gId => {
      const g = GRUPOS.find(x => x.id === gId);
      const ps = partidos.filter(p => p.g === gId);
      html += `<div class="group-card">
        <div class="group-card-title">Grupo ${gId}</div>
        <div class="group-card-meta">${g.sel.join(' · ')}</div>`;
      ps.forEach(p => { html += matchRowEmp(p); });
      html += `</div>`;
    });
    html += `</div>`;
  } else {
    // Por ronda
    const rondas = [...new Set(partidos.map(p => p.r))];
    html += `<div class="elim-wrap">`;
    rondas.forEach(r => {
      const ps = partidos.filter(p => p.r === r);
      html += `<div class="elim-card"><div class="elim-title">${r}${r==='Final'?'':' de final'}</div>`;
      ps.forEach(p => { html += matchRowEmp(p); });
      html += `</div>`;
    });
    html += `</div>`;
  }

  // Bloqueadas
  if (bloqueadas.length) {
    html += bloqueadas.map(s =>
      `<div class="semana-bloqueada">
        <span class="lock-icon">🔒</span>
        Semana ${s.id} · ${s.label} — se habilita el ${fmtFecha(s.desde)}
      </div>`
    ).join('');
  }

  document.getElementById('empContenido').innerHTML = html;
}

function cambiarSemana(id) {
  semanaVista = id;
  renderEmpleado();
}

// ── RANKING EMPLEADO (Top 50) ──
async function mostrarRankingEmp(btnEl) {
  // Desactivar todos los nav-btn y activar este
  document.querySelectorAll('#empNav .nav-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  semanaVista = null;

  const container = document.getElementById('empContenido');
  container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text3)">Cargando ranking...</div>';

  const allP = await dbLoadAllPicks();
  const res = await dbLoadResults();
  const users = Object.keys(allP);
  const hayRes = Object.keys(res).length > 0;

  const sc = users.map(u => ({
    n: u,
    picks: Object.keys(allP[u]).length,
    pts: hayRes ? calcPtsUsuario(allP[u], res) : null
  })).sort((a, b) => hayRes ? b.pts - a.pts : b.picks - a.picks);

  const mx = sc.length ? Math.max(...sc.map(s => hayRes ? s.pts : s.picks), 1) : 1;
  const medals = ['🥇','🥈','🥉'];

  // Encontrar posición del usuario actual
  const miPos = sc.findIndex(u => u.n === cUser);

  let html = `<div class="semana-header"><span class="semana-badge">🏆</span> Ranking General — Top 50</div>
    <div class="semana-meta">${users.length} participantes${hayRes ? ' · Puntos actualizados' : ' · Ordenado por pronósticos cargados'}</div>`;

  if (miPos >= 0) {
    const yo = sc[miPos];
    html += `<div style="background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.25);border-radius:var(--r-lg);padding:14px 18px;margin-bottom:1.25rem;display:flex;align-items:center;gap:12px">
      <div style="font-size:24px;font-weight:700;color:var(--gold)">${miPos + 1}°</div>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:600;color:var(--text)">${nombreDisplay(cUser, false)}</div>
        <div style="font-size:12px;color:var(--text2)">${yo.picks} pronósticos cargados${hayRes ? ' · ' + yo.pts + ' pts' : ''}</div>
      </div>
      <div style="font-size:11px;color:var(--text3)">Tu posición</div>
    </div>`;
  }

  html += `<div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:var(--r-lg);padding:1.25rem">`;
  
  if (!sc.length) {
    html += '<p style="text-align:center;color:var(--text3);padding:1rem">Aún no hay participantes</p>';
  } else {
    sc.slice(0, 50).forEach((u, i) => {
      const esYo = u.n === cUser;
      html += `<div class="rk-row" style="${esYo ? 'background:rgba(201,168,76,.08);border-radius:6px;padding:10px 8px;margin:0 -8px' : ''}">
        <div class="rk-pos">${medals[i] || i+1}</div>
        <div class="rk-av">${inicialesDisplay(u.n)}</div>
        <div class="rk-name">${nombreDisplay(u.n, false)}${esYo ? ' <span style="font-size:10px;color:var(--gold)">(vos)</span>' : ''}</div>
        <div class="rk-picks">${u.picks} pron.</div>
        <div class="rk-bar"><div class="rk-bar-fill" style="width:${Math.round((hayRes?u.pts:u.picks)/mx*100)}%"></div></div>
        <div class="rk-pts">${hayRes ? u.pts + ' pts' : '—'}</div>
      </div>`;
    });
    if (sc.length > 50) {
      html += `<p style="text-align:center;color:var(--text3);font-size:12px;padding:10px 0">Mostrando los primeros 50 de ${sc.length} participantes</p>`;
    }
  }
  html += '</div>';
  container.innerHTML = html;
}

// ── ADMIN ──
function calcPtsUsuario(picks, res) {
  let total = 0;
  Object.keys(res).forEach(mid => {
    total += calcularPuntos(picks[mid], res[mid]);
  });
  return total;
}

// Helper: muestra nombre del empleado para admin, o nombre formateado
function nombreDisplay(legajo, paraAdmin) {
  const raw = EMPLEADOS[legajo];
  if (!raw) return legajo;
  const partes = raw.split(' ');
  const apellido = partes[0];
  const nombre = partes.slice(1).join(' ') || apellido;
  const fmt = (nombre + ' ' + apellido).split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ').trim();
  if (paraAdmin) return `${legajo} — ${fmt}`;
  return fmt;
}

function inicialesDisplay(legajo) {
  const raw = EMPLEADOS[legajo];
  if (!raw) return legajo.slice(0,2);
  const partes = raw.split(' ').filter(Boolean);
  if (partes.length >= 2) return (partes[1][0] + partes[0][0]).toUpperCase();
  return partes[0].slice(0,2).toUpperCase();
}

async function renderResumen() {
  allPicks = await dbLoadAllPicks();
  lRes = await dbLoadResults();
  const users = Object.keys(allPicks);
  const totalPicks = users.reduce((s, u) => s + Object.keys(allPicks[u]).length, 0);
  const totalPts = users.reduce((s, u) => s + (calcPtsUsuario(allPicks[u], lRes) || 0), 0);
  const resCount = Object.keys(lRes).length;
  const hayRes = resCount > 0;

  document.getElementById('aMetrics').innerHTML = `
    <div class="metric-card"><div class="metric-num">${users.length}</div><div class="metric-lbl">participantes</div></div>
    <div class="metric-card"><div class="metric-num">${totalPicks}</div><div class="metric-lbl">pronósticos totales</div></div>
    <div class="metric-card"><div class="metric-num">${totalPts}</div><div class="metric-lbl">puntos totales</div><div class="metric-sub">en competencia</div></div>
    <div class="metric-card"><div class="metric-num">${resCount}</div><div class="metric-lbl">resultados</div><div class="metric-sub">de 104</div></div>`;

  const sc = users.map(u => ({
    n: u,
    picks: Object.keys(allPicks[u]).length,
    pts: hayRes ? calcPtsUsuario(allPicks[u], lRes) : null
  })).sort((a, b) => hayRes ? b.pts - a.pts : b.picks - a.picks);

  const mx = sc.length ? Math.max(...sc.map(s => hayRes ? s.pts : s.picks), 1) : 1;
  const medals = ['🥇','🥈','🥉'];

  let top50Html = `
    <div style="margin-top:2rem">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem">
        <div style="font-size:20px">🏆</div>
        <h3 style="font-size:16px;font-weight:700;color:var(--text);margin:0">Top 50 - ${hayRes ? 'Por puntos' : 'Por pronósticos cargados'}</h3>
      </div>
      <div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:var(--r-lg);padding:1.25rem;max-height:600px;overflow-y:auto">
  `;

  if (!sc.length) {
    top50Html += '<p style="font-size:12px;color:#6b6a65;padding:1rem 0">Sin participantes aún</p>';
  } else {
    sc.slice(0, 50).forEach((u, i) => {
      const barWidth = Math.round((hayRes ? u.pts : u.picks) / mx * 100);
      top50Html += `
        <div class="rk-row" style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,.05)">
          <div class="rk-pos" style="font-weight:900;font-size:15px;min-width:30px">${medals[i] || (i+1)}</div>
          <div class="rk-av">${inicialesDisplay(u.n)}</div>
          <div class="rk-name">${nombreDisplay(u.n, true)}</div>
          <div class="rk-picks" style="font-size:12px;color:var(--text2)">${u.picks} pron.</div>
          <div class="rk-bar"><div class="rk-bar-fill" style="width:${barWidth}%"></div></div>
          <div class="rk-pts" style="font-size:16px;font-weight:900;min-width:70px;text-align:right;color:var(--gold)">${hayRes ? u.pts + ' pts' : '—'}</div>
        </div>`;
    });
    if (sc.length > 50) {
      top50Html += `<p style="font-size:11px;color:var(--text3);padding:10px 0;text-align:center">Mostrando 50 de ${sc.length} participantes</p>`;
    }
  }

  top50Html += `</div></div>`;
  document.getElementById('aTop5').innerHTML = top50Html;

  renderChart();
}

function renderChart() {
  if (!window.Chart) { setTimeout(renderChart, 200); return; }
  const porSem = SEMANAS.map(s => {
    let total = 0;
    Object.keys(allPicks).forEach(u => {
      TODOS.filter(p => p.semana === s.id).forEach(p => {
        if (allPicks[u][p.id]) total++;
      });
    });
    return total;
  });
  if (chartDist) { chartDist.destroy(); chartDist = null; }
  const ctx = document.getElementById('chartDist');
  if (!ctx) return;
  chartDist = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: SEMANAS.map(s => 'Sem. ' + s.id),
      datasets: [{
        data: porSem,
        backgroundColor: '#1a56db',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { font: { size: 10, family: 'DM Mono' } }, grid: { display: false } },
        y: { ticks: { font: { size: 10 }, stepSize: 1 }, grid: { color: 'rgba(0,0,0,.05)' } }
      }
    }
  });
}

async function renderRanking() {
  allPicks = await dbLoadAllPicks();
  lRes = await dbLoadResults();
  const users = Object.keys(allPicks);
  const hayRes = Object.keys(lRes).length > 0;
  if (!users.length) {
    document.getElementById('aRanking').innerHTML = '<p style="padding:1rem;color:#6b6a65;font-size:13px">Sin participantes aún</p>';
    return;
  }
  const sc = users.map(u => ({
    n: u,
    picks: Object.keys(allPicks[u]).length,
    pts: hayRes ? calcPtsUsuario(allPicks[u], lRes) : null
  })).sort((a, b) => hayRes ? b.pts - a.pts : b.picks - a.picks);
  const mx = Math.max(...sc.map(s => hayRes ? s.pts : s.picks), 1);
  const medals = ['🥇','🥈','🥉'];
  document.getElementById('aRanking').innerHTML = sc.map((u, i) => `
    <div class="rk-row rk-clickable" onclick="mostrarDetallesParticipante('${u.n}')">
      <div class="rk-pos">${medals[i] || i+1}</div>
      <div class="rk-av">${inicialesDisplay(u.n)}</div>
      <div class="rk-name">${nombreDisplay(u.n, true)}</div>
      <div class="rk-picks">${u.picks} pron.</div>
      <div class="rk-bar"><div class="rk-bar-fill" style="width:${Math.round((hayRes?u.pts:u.picks)/mx*100)}%"></div></div>
      <div class="rk-pts">${hayRes ? u.pts + ' pts' : '—'}</div>
    </div>`).join('');
}

async function mostrarDetallesParticipante(legajo) {
  if (!Object.keys(allPicks).length) {
    allPicks = await dbLoadAllPicks();
    lRes = await dbLoadResults();
  }
  document.getElementById('aSecRanking').classList.add('hidden');
  document.getElementById('aSecParticipante').classList.remove('hidden');
  renderDetallesParticipante(legajo);
}

function renderDetallesParticipante(legajo) {
  const nombre = nombreDisplay(legajo, false);
  const picks = allPicks[legajo] || {};
  const hayRes = Object.keys(lRes).length > 0;

  document.getElementById('pNombre').textContent = nombre;
  document.getElementById('pLegajo').textContent = legajo;

  if (!hayRes) {
    document.getElementById('participanteAciertos').innerHTML = '<div class="alert-info" style="margin-top:1rem">Aún no hay resultados cargados. Los aciertos se mostrarán cuando RR.HH. cargue los resultados de los partidos.</div>';
    document.getElementById('pPuntos').textContent = '0';
    document.getElementById('pAciertos').textContent = '0';
    return;
  }

  const aciertos = [];
  Object.keys(picks).forEach(matchId => {
    const pick = picks[matchId];
    const res = lRes[matchId];
    const pts = calcularPuntos(pick, res);
    if (pts > 0) {
      const partido = TODOS.find(p => p.id === matchId);
      aciertos.push({ matchId, pick, res, pts, partido });
    }
  });

  aciertos.sort((a, b) => b.pts - a.pts);

  const totalPts = aciertos.reduce((s, a) => s + a.pts, 0);
  document.getElementById('pPuntos').textContent = totalPts;
  document.getElementById('pAciertos').textContent = aciertos.length;

  if (!aciertos.length) {
    document.getElementById('participanteAciertos').innerHTML = '<div class="alert-warn">Este participante no tuvo aciertos en los resultados cargados.</div>';
    return;
  }

  let html = '';
  aciertos.forEach(a => {
    const badgeColor = a.pts === 3 ? '#c9a84c' : '#a09f99';
    const badgeBg = a.pts === 3 ? 'rgba(201,168,76,.15)' : 'rgba(160,159,153,.1)';
    html += `
      <div style="border:1px solid var(--border);border-radius:var(--r-lg);padding:1rem;background:rgba(255,255,255,.02)">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.75rem">
          <div>
            <div style="font-size:13px;color:var(--text2);margin-bottom:0.25rem">${a.partido.f} ${a.partido.semana ? '· Sem. ' + a.partido.semana : ''}</div>
            <div style="font-size:15px;font-weight:600;color:var(--text)">${a.partido.loc} <span style="color:var(--text3)">vs</span> ${a.partido.vis}</div>
          </div>
          <div style="background:${badgeBg};color:${badgeColor};padding:4px 10px;border-radius:4px;font-weight:600;font-size:12px;white-space:nowrap">+${a.pts} ${a.pts === 3 ? 'pts exacto' : 'pt resultado'}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:1rem;align-items:center">
          <div style="text-align:center;padding:0.75rem;background:rgba(255,255,255,.03);border-radius:6px">
            <div style="font-size:11px;color:var(--text3);margin-bottom:0.25rem">Tu pronóstico</div>
            <div style="font-size:20px;font-weight:700;color:var(--text)">${a.pick.l}-${a.pick.v}</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:11px;color:var(--text3)">Resultado</div>
            <div style="font-size:14px;color:var(--text2)">real</div>
          </div>
          <div style="text-align:center;padding:0.75rem;background:rgba(15,123,75,.1);border:1px solid rgba(15,123,75,.25);border-radius:6px">
            <div style="font-size:11px;color:var(--text3);margin-bottom:0.25rem">Resultado real</div>
            <div style="font-size:20px;font-weight:700;color:#0f7b4b">${a.res.l}-${a.res.v}</div>
          </div>
        </div>
      </div>
    `;
  });

  document.getElementById('participanteAciertos').innerHTML = html;
}

async function renderPicksAdm() {
  const q = (document.getElementById('srchP') || { value:'' }).value.toLowerCase();
  if (!Object.keys(allPicks).length) {
    allPicks = await dbLoadAllPicks();
    lRes = await dbLoadResults();
  }
  const users = Object.keys(allPicks);
  const ps = TODOS.filter(p => !q || (p.loc + ' ' + p.vis + (p.g || p.r || '')).toLowerCase().includes(q));
  if (!ps.length) {
    document.getElementById('aPicks').innerHTML = '<p style="font-size:12px;color:#6b6a65;padding:1rem">Sin resultados</p>';
    return;
  }
  let h = '';
  ps.slice(0, 25).forEach(p => {
    const r = lRes[p.id];
    h += `<div class="pick-detail-item">
      <div class="pick-detail-match">${p.loc} vs ${p.vis}
        <span class="pick-detail-meta">${p.f} · ${p.g ? 'Grupo ' + p.g : p.r}</span>
        ${r ? `<span class="score-real">${r.l}-${r.v}</span>` : ''}
      </div>
      <div class="pick-detail-chips">`;
    if (!users.length) h += '<span style="font-size:11px;color:#a09f99">Sin pronósticos</span>';
    users.forEach(u => {
      const pk = allPicks[u][p.id];
      const nombre = nombreDisplay(u, false);
      if (!pk) { h += `<span class="user-pick-chip" style="background:rgba(255,255,255,.03);color:var(--text3)">${nombre}: —</span>`; return; }
      const pts = r ? calcularPuntos(pk, r) : null;
      let bg = '#f0efe9', col = '#6b6a65', bc = 'rgba(0,0,0,.1)';
      if (pts === 3) { bg = '#e6f4ec'; col = '#0f7b4b'; bc = '#a7d9bc'; }
      else if (pts === 1) { bg = '#fffbeb'; col = '#92400e'; bc = '#f5d999'; }
      else if (pts === 0 && r) { bg = '#fef2f2'; col = '#b91c1c'; bc = '#f5b8b8'; }
      h += `<span class="user-pick-chip" style="background:${bg};color:${col};border-color:${bc}">
        ${nombre}: <strong>${pk.l}-${pk.v}</strong>${pts !== null ? ' · +' + pts : ''}</span>`;
    });
    h += '</div></div>';
  });
  if (ps.length > 25) h += `<p style="font-size:11px;color:#a09f99">Mostrando 25 de ${ps.length}. Usá el buscador.</p>`;
  document.getElementById('aPicks').innerHTML = h;
}

async function renderResAdmin() {
  if (!Object.keys(lRes).length) lRes = await dbLoadResults();

  let h = '<div style="display:grid;gap:2rem">';
  const colors = ['#1a3a8a', '#c4161c', '#00a651', '#f26522', '#4fa3e0', '#6d2077'];

  // Por semana
  for (const sem of SEMANAS) {
    const partidos = TODOS.filter(p => p.semana === sem.id);
    if (!partidos.length) continue;

    const color = colors[(sem.id - 1) % colors.length];
    h += `<div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;border-left:4px solid ${color}">
      <div style="background:${color};color:#fff;padding:14px 18px">
        <div style="font-size:13px;font-weight:700;letter-spacing:.05em;text-transform:uppercase">Semana ${sem.id} · ${sem.label}</div>
      </div>
      <div style="padding:1rem">`;

    partidos.forEach((p, idx) => {
      const r = lRes[p.id] || { l: null, v: null };
      const vL = r.l != null ? r.l : '';
      const vV = r.v != null ? r.v : '';
      const bg = idx % 2 === 0 ? 'rgba(255,255,255,.02)' : 'transparent';

      h += `<div style="background:${bg};border-radius:8px;padding:1.25rem;margin-bottom:${idx < partidos.length - 1 ? '1rem' : '0'};display:grid;grid-template-columns:auto 1fr auto;gap:1.5rem;align-items:center;transition:all .2s;border:1px solid transparent" onmouseover="this.style.background='rgba(255,255,255,.06)';this.style.borderColor='var(--border)'" onmouseout="this.style.background='${bg}';this.style.borderColor='transparent'">
        <div style="display:flex;flex-direction:column;gap:4px;min-width:100px">
          <div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text3);letter-spacing:.05em">${p.f}</div>
          <div style="font-size:11px;color:var(--text2)">${p.g ? 'Grupo ' + p.g : p.r}</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:1rem;align-items:center">
          <div style="text-align:right">
            <div style="font-size:12px;color:var(--text2);margin-bottom:4px">Local</div>
            <div style="font-size:13px;font-weight:600;color:var(--text)">${p.loc}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-direction:column">
            <input type="number" min="0" max="20" placeholder="–" value="${vL}" onchange="setResGol('${p.id}','l',this.value)" style="width:50px;height:50px;font-size:24px;font-weight:700;text-align:center;border:2px solid var(--border2);border-radius:8px;background:rgba(255,255,255,.06);color:var(--text);padding:0;outline:none;transition:all .2s" onfocus="this.style.borderColor='var(--fifa-sky)';this.style.boxShadow='0 0 0 3px rgba(79,163,224,.2)'"/>
            <span style="font-size:14px;color:var(--text3);font-weight:700">:</span>
            <input type="number" min="0" max="20" placeholder="–" value="${vV}" onchange="setResGol('${p.id}','v',this.value)" style="width:50px;height:50px;font-size:24px;font-weight:700;text-align:center;border:2px solid var(--border2);border-radius:8px;background:rgba(255,255,255,.06);color:var(--text);padding:0;outline:none;transition:all .2s" onfocus="this.style.borderColor='var(--fifa-sky)';this.style.boxShadow='0 0 0 3px rgba(79,163,224,.2)'"/>
          </div>
          <div style="text-align:left">
            <div style="font-size:12px;color:var(--text2);margin-bottom:4px">Visitante</div>
            <div style="font-size:13px;font-weight:600;color:var(--text)">${p.vis}</div>
          </div>
        </div>

        <div style="text-align:center;padding:10px 14px;background:${vL !== '' && vV !== '' ? 'rgba(15,123,75,.15)' : 'rgba(255,255,255,.04)'};border-radius:6px;border:1px solid ${vL !== '' && vV !== '' ? 'rgba(15,123,75,.3)' : 'rgba(255,255,255,.08)'}">
          <div style="font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;margin-bottom:4px">Resultado</div>
          <div style="font-size:20px;font-weight:700;color:${vL !== '' && vV !== '' ? '#0f7b4b' : 'var(--text2)'}">${vL !== '' && vV !== '' ? vL + '-' + vV : '–'}</div>
        </div>
      </div>`;
    });

    h += `</div></div>`;
  }

  h += '</div>';
  document.getElementById('aResWrap').innerHTML = h;
}

function setResGol(mid, lado, valor) {
  if (!lRes[mid]) lRes[mid] = { l: null, v: null };
  const num = valor === '' ? null : parseInt(valor, 10);
  if (lado === 'l') lRes[mid].l = isNaN(num) ? null : num;
  if (lado === 'v') lRes[mid].v = isNaN(num) ? null : num;
}

async function guardarRes() {
  const btn = document.querySelector('#aSecResultados .btn-primary');
  btn.disabled = true; btn.textContent = 'Guardando...';
  // Limpiar resultados vacíos
  const limpios = {};
  Object.keys(lRes).forEach(k => {
    const r = lRes[k];
    if (r && r.l != null && r.v != null) limpios[k] = r;
  });
  lRes = limpios;
  await dbSaveResults(lRes);
  btn.disabled = false; btn.textContent = 'Guardar resultados';
  document.getElementById('resOk').classList.remove('hidden');
  setTimeout(() => document.getElementById('resOk').classList.add('hidden'), 3000);
}

async function renderStats() {
  allPicks = await dbLoadAllPicks();
  lRes = await dbLoadResults();
  const users = Object.keys(allPicks);
  const totalPicks = users.reduce((s, u) => s + Object.keys(allPicks[u]).length, 0);
  document.getElementById('aStats').innerHTML = `
    <h3>Estadísticas del torneo</h3>
    <div class="metrics-grid" style="margin-top:12px">
      <div class="metric-card"><div class="metric-num">${users.length}</div><div class="metric-lbl">participantes</div></div>
      <div class="metric-card"><div class="metric-num">${totalPicks}</div><div class="metric-lbl">pronósticos totales</div></div>
      <div class="metric-card"><div class="metric-num">${Object.keys(lRes).length}</div><div class="metric-lbl">resultados</div></div>
    </div>`;
}

async function cambiarPass() {
  const np = document.getElementById('iNewPass').value;
  if (!np || np.length < 4) { alert('Mínimo 4 caracteres'); return; }
  await dbSetPass(np);
  document.getElementById('iNewPass').value = '';
  document.getElementById('passOk').classList.remove('hidden');
  setTimeout(() => document.getElementById('passOk').classList.add('hidden'), 3000);
}

async function resetAll() {
  if (!confirm('¿Borrar TODOS los pronósticos y resultados? Esta acción es irreversible.')) return;
  if (!confirm('Confirmá una vez más: ¿borrar todos los datos del Prode?')) return;
  try {
    const btn = document.querySelector('#aSecConfig .btn-danger');
    if (btn) { btn.disabled = true; btn.textContent = 'Borrando...'; }
    await dbResetAll();
    allPicks = {}; lRes = {};
    document.getElementById('resetOk').classList.remove('hidden');
    setTimeout(() => document.getElementById('resetOk').classList.add('hidden'), 3000);
    await renderResumen();
    renderStats();
    if (btn) { btn.disabled = false; btn.textContent = 'Borrar todos los datos'; }
  } catch(e) {
    alert('Error al borrar datos: ' + e.message);
    const btn = document.querySelector('#aSecConfig .btn-danger');
    if (btn) { btn.disabled = false; btn.textContent = 'Borrar todos los datos'; }
  }
}

async function resetPicks() {
  if (!confirm('¿Borrar TODOS los pronósticos de los empleados? Los resultados se mantienen.')) return;
  try {
    const btn = document.getElementById('btnResetPicks');
    if (btn) { btn.disabled = true; btn.textContent = 'Borrando...'; }
    await dbResetPicks();
    allPicks = {};
    document.getElementById('resetPicksOk').classList.remove('hidden');
    setTimeout(() => document.getElementById('resetPicksOk').classList.add('hidden'), 3000);
    await renderResumen();
    if (btn) { btn.disabled = false; btn.textContent = 'Borrar solo pronósticos'; }
  } catch(e) {
    alert('Error al borrar pronósticos: ' + e.message);
    const btn = document.getElementById('btnResetPicks');
    if (btn) { btn.disabled = false; btn.textContent = 'Borrar solo pronósticos'; }
  }
}

function aTab(name, el) {
  document.querySelectorAll('.sidebar-item').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  ['aSecResumen','aSecRanking','aSecPicks','aSecResultados','aSecConfig'].forEach(s => document.getElementById(s).classList.add('hidden'));
  const map = { resumen:'aSecResumen', ranking:'aSecRanking', picks:'aSecPicks', resultados:'aSecResultados', config:'aSecConfig' };
  document.getElementById(map[name]).classList.remove('hidden');
  if (name === 'resumen')    renderResumen();
  if (name === 'ranking')    renderRanking();
  if (name === 'picks')      renderPicksAdm();
  if (name === 'resultados') renderResAdmin();
  if (name === 'config')     renderStats();
}

// Cargar Chart.js
const s = document.createElement('script');
s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
document.head.appendChild(s);
