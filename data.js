// ── Semanas del torneo ──
const SEMANAS = [
  { id:1, label:'Grupos · Fecha 1',  desde:'2026-06-11' },
  { id:2, label:'Grupos · Fecha 2',  desde:'2026-06-17' },
  { id:3, label:'Grupos · Fecha 3',  desde:'2026-06-23' },
  { id:4, label:'16avos y Octavos',  desde:'2026-06-28' },
  { id:5, label:'Cuartos y Semis',   desde:'2026-06-28' },
  { id:6, label:'Final',              desde:'2026-06-28' },
];

function semanaActual() {
  const hoy = new Date().toISOString().slice(0, 10);
  let ultima = 1;
  SEMANAS.forEach(s => { if (hoy >= s.desde) ultima = s.id; });
  return ultima;
}

function fmtFecha(iso) {
  const [, m, d] = iso.split('-');
  const meses = ['','ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${parseInt(d)} ${meses[parseInt(m)]}`;
}

// ── Grupos y selecciones ──
const GRUPOS = [
  { id:'A', sel:['México','Sudáfrica','Corea del Sur','Chequia'] },
  { id:'B', sel:['Canadá','Bosnia y Herz.','Qatar','Suiza'] },
  { id:'C', sel:['Brasil','Marruecos','Haití','Escocia'] },
  { id:'D', sel:['Estados Unidos','Paraguay','Australia','Turquía'] },
  { id:'E', sel:['Alemania','Curazao','Costa de Marfil','Ecuador'] },
  { id:'F', sel:['Países Bajos','Japón','Suecia','Túnez'] },
  { id:'G', sel:['Bélgica','Egipto','Irán','Nueva Zelanda'] },
  { id:'H', sel:['España','Cabo Verde','Arabia Saudita','Uruguay'] },
  { id:'I', sel:['Francia','Senegal','Irak','Noruega'] },
  { id:'J', sel:['Argentina','Argelia','Austria','Jordania'] },
  { id:'K', sel:['Portugal','R.D. Congo','Uzbekistán','Colombia'] },
  { id:'L', sel:['Inglaterra','Croacia','Ghana','Panamá'] },
];

const FG1 = ['11 jun','12 jun','13 jun','14 jun','14 jun','15 jun','15 jun','15 jun','16 jun','16 jun','17 jun','17 jun'];
const FG2 = ['18 jun','18 jun','19 jun','19 jun','20 jun','20 jun','21 jun','21 jun','22 jun','22 jun','23 jun','23 jun'];
const FG3 = ['24 jun','24 jun','24 jun','25 jun','25 jun','25 jun','26 jun','26 jun','26 jun','27 jun','27 jun','27 jun'];

const PG = [];
GRUPOS.forEach((g, gi) => {
  const s = g.sel;
  PG.push({ id:`G${g.id}0`, g:g.id, loc:s[0], vis:s[1], f:FG1[gi], fase:1, semana:1 });
  PG.push({ id:`G${g.id}1`, g:g.id, loc:s[2], vis:s[3], f:FG1[gi], fase:1, semana:1 });
  PG.push({ id:`G${g.id}2`, g:g.id, loc:s[0], vis:s[2], f:FG2[gi], fase:2, semana:2 });
  PG.push({ id:`G${g.id}3`, g:g.id, loc:s[1], vis:s[3], f:FG2[gi], fase:2, semana:2 });
  PG.push({ id:`G${g.id}4`, g:g.id, loc:s[0], vis:s[3], f:FG3[gi], fase:3, semana:3 });
  PG.push({ id:`G${g.id}5`, g:g.id, loc:s[1], vis:s[2], f:FG3[gi], fase:3, semana:3 });
});

const PE = [
  { id:'R01', r:'16avos', loc:'1° Grupo A', vis:'2° Grupo B', f:'29 jun', semana:4 },
  { id:'R02', r:'16avos', loc:'1° Grupo C', vis:'2° Grupo D', f:'29 jun', semana:4 },
  { id:'R03', r:'16avos', loc:'1° Grupo E', vis:'2° Grupo F', f:'30 jun', semana:4 },
  { id:'R04', r:'16avos', loc:'1° Grupo G', vis:'2° Grupo H', f:'30 jun', semana:4 },
  { id:'R05', r:'16avos', loc:'1° Grupo I', vis:'2° Grupo J', f:'1 jul',  semana:4 },
  { id:'R06', r:'16avos', loc:'1° Grupo K', vis:'2° Grupo L', f:'1 jul',  semana:4 },
  { id:'R07', r:'16avos', loc:'2° Grupo A', vis:'1° Grupo B', f:'2 jul',  semana:4 },
  { id:'R08', r:'16avos', loc:'2° Grupo C', vis:'1° Grupo D', f:'2 jul',  semana:4 },
  { id:'R09', r:'16avos', loc:'2° Grupo E', vis:'1° Grupo F', f:'3 jul',  semana:4 },
  { id:'R10', r:'16avos', loc:'2° Grupo G', vis:'1° Grupo H', f:'3 jul',  semana:4 },
  { id:'R11', r:'16avos', loc:'2° Grupo I', vis:'1° Grupo J', f:'4 jul',  semana:4 },
  { id:'R12', r:'16avos', loc:'2° Grupo K', vis:'1° Grupo L', f:'4 jul',  semana:4 },
  { id:'R13', r:'16avos', loc:'3° (mejor 1)', vis:'3° (mejor 2)', f:'5 jul', semana:4 },
  { id:'R14', r:'16avos', loc:'3° (mejor 3)', vis:'3° (mejor 4)', f:'5 jul', semana:4 },
  { id:'R15', r:'16avos', loc:'3° (mejor 5)', vis:'3° (mejor 6)', f:'6 jul', semana:4 },
  { id:'R16', r:'16avos', loc:'3° (mejor 7)', vis:'3° (mejor 8)', f:'6 jul', semana:4 },
  { id:'O1', r:'Octavos', loc:'G. R01', vis:'G. R02', f:'7 jul',  semana:4 },
  { id:'O2', r:'Octavos', loc:'G. R03', vis:'G. R04', f:'7 jul',  semana:4 },
  { id:'O3', r:'Octavos', loc:'G. R05', vis:'G. R06', f:'8 jul',  semana:4 },
  { id:'O4', r:'Octavos', loc:'G. R07', vis:'G. R08', f:'8 jul',  semana:4 },
  { id:'O5', r:'Octavos', loc:'G. R09', vis:'G. R10', f:'9 jul',  semana:4 },
  { id:'O6', r:'Octavos', loc:'G. R11', vis:'G. R12', f:'9 jul',  semana:4 },
  { id:'O7', r:'Octavos', loc:'G. R13', vis:'G. R14', f:'10 jul', semana:4 },
  { id:'O8', r:'Octavos', loc:'G. R15', vis:'G. R16', f:'10 jul', semana:4 },
  { id:'Q1', r:'Cuartos', loc:'G. O1', vis:'G. O2', f:'11 jul', semana:5 },
  { id:'Q2', r:'Cuartos', loc:'G. O3', vis:'G. O4', f:'11 jul', semana:5 },
  { id:'Q3', r:'Cuartos', loc:'G. O5', vis:'G. O6', f:'12 jul', semana:5 },
  { id:'Q4', r:'Cuartos', loc:'G. O7', vis:'G. O8', f:'12 jul', semana:5 },
  { id:'S1', r:'Semifinal', loc:'G. Q1', vis:'G. Q2', f:'15 jul', semana:5 },
  { id:'S2', r:'Semifinal', loc:'G. Q3', vis:'G. Q4', f:'16 jul', semana:5 },
  { id:'F1', r:'Final', loc:'G. S1', vis:'G. S2', f:'19 jul', semana:6 },
];

const TODOS = [...PG, ...PE];

// ── Sistema de puntos por marcador ──
// Pick = { l: goles local, v: goles visitante }
// +3 puntos si acierta marcador exacto
// +1 punto si solo acierta resultado (1/X/2)
function resultadoDe(p) {
  if (!p || p.l == null || p.v == null) return null;
  if (p.l > p.v) return '1';
  if (p.l < p.v) return '2';
  return 'X';
}

function calcularPuntos(pick, real) {
  if (!pick || !real || pick.l == null || pick.v == null || real.l == null || real.v == null) return 0;
  if (pick.l === real.l && pick.v === real.v) return 3;
  if (resultadoDe(pick) === resultadoDe(real)) return 1;
  return 0;
}
