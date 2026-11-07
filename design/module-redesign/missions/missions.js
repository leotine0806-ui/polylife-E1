/* Missioni · prototipo E1. Funzioni e stati ricavati da src/daily-missions.html (+ operational-focus-view.js).
   Dati: SOLO fixture sintetiche, "oggi" fisso. Ogni azione che nel prodotto salva, chiama AI o scrive è SIMULATA in memoria.
   Nessun localStorage/sessionStorage, nessuna rete: tutto sparisce al ricaricamento. */
(() => {
  const TODAY = '2026-11-02', NOW_MIN = 600;            // "ora" simulata: disponibilità futura dalle 10:00
  const WIN = [420, 1320];                              // finestra giornaliera simulata 07:00–22:00
  const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  const pad = n => String(n).padStart(2, '0');
  const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => new Date(s + 'T12:00:00');
  const offset = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return key(d); };
  const validDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && key(parse(s)) === s;
  const fmtDate = s => parse(s).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  const fmtShort = s => parse(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  const toMin = c => { const [a, b] = c.split(':').map(Number); return a * 60 + b; };
  const hm = n => `${pad(Math.floor(n / 60))}:${pad(n % 60)}`;
  const dur = n => (n >= 60 ? Math.floor(n / 60) + ' h' + (n % 60 ? ' ' + pad(n % 60) : '') : n + ' min');
  // Barretta laterale = CATEGORIA (colore + simbolo + nome). Priorità = intestazione del gruppo (misuratore a tre livelli + nome).
  const CAT = { studio: ['Studio', 'var(--k-studio)', '▤'], fitness: ['Fitness', 'var(--k-checkin)', '◭'], personale: ['Personale', 'var(--k-ripetizione)', '◍'], generale: ['Generale', 'var(--k-altro)', '◇'] };
  const PRI = { 1: ['Alta priorità', 'var(--p1)', 'alta', 3], 2: ['Normale', 'var(--p2)', 'normale', 2], 3: ['Secondarie', 'var(--p3)', 'secondaria', 1] };
  const OV = { 'cancel-training': 'Allenamento cancellato', 'extra-exam': 'Verifica improvvisa', appointment: 'Appuntamento', outing: 'Uscita / Evento', 'low-energy': 'Energia ridotta', 'school-closed': 'Scuola chiusa', 'extra-block': 'Blocco aggiuntivo', 'free-slot': 'Slot extra liberato' };

  /* ---------- Fixture sintetiche (stessi campi del sorgente) ---------- */
  const mk = (id, date, title, category, priority, duration, xp, o = {}) => ({ id, date, title, description: '', category, priority, duration, xp, energy: 'media', concentration: 'media', completed: false, assignedStart: null, assignedEnd: null, minNonNeg: null, recoveryNote: null, posticipata: false, deadline: null, ...o });
  let M = [
    mk('a1', TODAY, 'Ripasso capitoli 3–4 per la verifica', 'studio', 1, 60, 50, { concentration: 'alta', energy: 'alta', assignedStart: '14:30', assignedEnd: '15:30', deadline: TODAY, description: 'Elettronica · verifica alle 16:00' }),
    mk('a2', TODAY, 'Esercizi di analisi', 'studio', 1, 45, 30, { completed: true, concentration: 'alta' }),
    mk('a3', TODAY, 'Ripasso flashcard', 'studio', 2, 30, 20, { assignedStart: '13:15', assignedEnd: '13:45' }),
    mk('a4', TODAY, 'Leggere 20 pagine', 'personale', 2, 40, 20, { description: 'Library · 11/20 pagine' }),
    mk('a5', TODAY, 'Allenamento gambe', 'fitness', 2, 60, 40, { energy: 'alta', assignedStart: '12:30', assignedEnd: '13:30' }),
    mk('a6', TODAY, 'Stretching serale', 'fitness', 3, 15, 10, { concentration: 'bassa', energy: 'bassa' }),
    mk('a7', TODAY, 'Scrivere il diario della giornata', 'personale', 2, 15, 20, { completed: true, concentration: 'bassa' }),
    mk('a8', TODAY, 'Camminata all\'aperto', 'fitness', 2, 10, 10, { minNonNeg: 'Anche solo 10 minuti, se la giornata si complica', concentration: 'bassa' }),
    mk('a9', TODAY, 'Serie di addominali saltata', 'fitness', 2, 15, 15, { recoveryNote: 'Da recuperare dopo il riposo di ieri', energy: 'bassa' }),
    mk('a10', TODAY, 'Riordinare gli appunti di Storia', 'studio', 3, 30, 15, { posticipata: true }),
    mk('a11', TODAY, 'Riordinare la scrivania', 'generale', 3, 15, 10, { concentration: 'bassa', energy: 'bassa' }),
    mk('y1', '2026-11-01', 'Lettura serale', 'personale', 3, 30, 15, { completed: true }),
    mk('y2', '2026-11-01', 'Serie di addominali', 'fitness', 2, 15, 15),
    mk('t1', '2026-11-03', 'Capitolo 5 di Fisica', 'studio', 1, 60, 50, { concentration: 'alta', assignedStart: '18:00', assignedEnd: '19:00' }),
    mk('t2', '2026-11-03', 'Ripetizione flashcard · 12 carte', 'studio', 2, 20, 15, { assignedStart: '17:30', assignedEnd: '17:50' }),
    mk('t3', '2026-11-03', 'Allenamento schiena', 'fitness', 2, 60, 40, { energy: 'alta' }),
    mk('t4', '2026-11-03', 'Esercizi di analisi · serie 2', 'studio', 2, 150, 40, { posticipata: true, description: 'Spostata: la giornata è sovraccarica' }),
    mk('t5', '2026-11-03', 'Leggere 20 pagine', 'personale', 3, 40, 20),
    mk('f1', '2026-11-05', 'Pianificare la settimana', 'generale', 2, 20, 15),
    mk('f2', '2026-11-05', 'Allenamento spalle', 'fitness', 2, 60, 40),
    mk('f3', '2026-11-06', 'Ripetizione flashcard', 'studio', 2, 20, 15),
    mk('f4', '2026-11-09', 'Preparare il ripasso di Storia', 'studio', 1, 60, 50, { deadline: '2026-11-09' }),
    mk('f5', '2026-10-30', 'Sessione di lettura', 'personale', 3, 40, 20, { completed: true })
  ];
  const PLANS = {
    [TODAY]: { missioneDelGiorno: 'Prepararsi alla verifica di Elettronica', top3: ['a1', 'a3', 'a4'], motivazione: 'Metti il ripasso prima della verifica: il resto può slittare.', constraint: 'Verifica alle 16:00', energy: 6, overload: false },
    '2026-11-03': { missioneDelGiorno: 'Capitolo 5 di Fisica', top3: ['t1', 't2', 't3'], motivazione: 'Un blocco solo di studio, poi allenamento.', constraint: null, energy: 5, overload: true }
  };
  const OVERRIDES = { [TODAY]: [{ type: 'extra-exam', desc: 'Verifica di Elettronica', start: '16:00', end: '17:30' }, { type: 'appointment', desc: 'Visita dal dentista', start: '17:45', end: '18:30' }] };
  // Focus scelto: riferimenti con stato (attuale, spostata, ...). Separato dalla Top 3 del piano.
  const FOCUS = { [TODAY]: [{ id: 'a1', status: 'current' }, { id: 'a5', status: 'current' }, { id: 'x9', title: 'Preparare il ripasso di Storia', status: 'moved', date: '2026-11-09' }] };
  const ENERGY = { [TODAY]: 6, '2026-11-03': 5, '2026-11-01': 7 };
  const BLOCKS = d => { const w = parse(d).getDay(); return w === 0 ? [[480, 510, 'Routine mattutina', 'fixed']] : w === 1 ? [[420, 450, 'Routine mattutina', 'fixed'], [825, 855, 'Pasto', 'fixed']] : w === 6 ? [[480, 510, 'Routine mattutina', 'fixed']] : [[420, 450, 'Routine mattutina', 'fixed'], [480, 780, 'Scuola', 'fixed'], [780, 810, 'Pasto', 'fixed']]; };

  /* ---------- Stato della pagina ---------- */
  let selected = TODAY, calOpen = false, cy = 2026, cm = 10, filter = 'tutti';
  let open = { piano: false, orario: false, top3: false, eccezioni: false, periodo: false };
  let proposal = null, generating = null, confirmDel = null, focusEdit = false, focusDraft = null, focusUndo = null, focusMsg = '';
  let period = { from: '', until: '', overdue: false, preview: null, status: 'Scegli il periodo e prepara l\'anteprima prima di salvare.' };
  const narrow = window.matchMedia('(max-width: 899px)');

  const done = m => m.completed === true;
  const dayM = d => M.filter(m => m.date === d);
  const root = document.getElementById('root');

  /* ---------- Orari: occupato, libero, conflitti ---------- */
  function busyOf(d) {
    const out = BLOCKS(d).map(([s, e, label, cls]) => ({ s, e, label, cls }));
    for (const o of OVERRIDES[d] || []) if (o.start && o.end) out.push({ s: toMin(o.start), e: toMin(o.end), label: o.desc || OV[o.type], cls: 'override' });
    if (d === TODAY) out.push({ s: 1140, e: 1170, label: 'Recupero', cls: 'recovery' });
    for (const m of dayM(d)) if (!done(m) && m.assignedStart) out.push({ s: toMin(m.assignedStart), e: toMin(m.assignedEnd), label: m.title, cls: 'task', id: m.id });
    return out.sort((a, b) => a.s - b.s || a.e - b.e);
  }
  function freeOf(d, extra = []) {
    const lo = d === TODAY ? Math.max(WIN[0], NOW_MIN) : WIN[0], iv = [...busyOf(d).map(b => [b.s, b.e]), ...extra].sort((a, b) => a[0] - b[0]);
    const free = []; let t = lo;
    for (const [s, e] of iv) { if (s > t) free.push([t, Math.min(s, WIN[1])]); t = Math.max(t, e); if (t >= WIN[1]) break; }
    if (t < WIN[1]) free.push([t, WIN[1]]);
    return free.filter(([a, b]) => b > a);
  }
  const conflicts = d => { const t = busyOf(d).filter(b => b.cls === 'task'), out = []; t.forEach((a, i) => t.slice(i + 1).forEach(b => { if (a.s < b.e && b.s < a.e) out.push([a, b]); })); return out; };
  // Pianificatore semplificato (il prodotto usa PolyPlanning): per priorità, poi durata; «serale» va nell'ultimo spazio utile.
  function plan(d, tasks) {
    const taken = [], assigned = [], postponed = [];
    for (const m of [...tasks].sort((a, b) => a.priority - b.priority || b.duration - a.duration)) {
      const slots = freeOf(d, taken).filter(([a, b]) => b - a >= m.duration), slot = /serale/i.test(m.title) ? slots[slots.length - 1] : slots[0];
      if (!slot) { postponed.push(m.id); continue; }
      const s = /serale/i.test(m.title) ? slot[1] - m.duration : slot[0]; taken.push([s, s + m.duration]); assigned.push({ id: m.id, s, e: s + m.duration });
    }
    return { assigned, postponed };
  }

  /* ---------- Notifiche e focus ---------- */
  const note = msg => { let t = document.getElementById('toast'); if (!t) { t = h('div', { id: 'toast', role: 'status', 'aria-live': 'polite' }); document.body.append(t); } t.textContent = msg; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 3200); };
  let focusKey = null;
  const K = k => ({ 'data-k': k });

  /* ---------- Rendering ---------- */
  function render() {
    const act = document.activeElement, fk = act?.dataset?.k, top = window.scrollY;
    root.replaceChildren(...build());
    if (fk) document.querySelector(`[data-k="${fk}"]`)?.focus({ preventScroll: true });
    window.scrollTo(0, top);
    document.title = 'Missioni · prototipo E1';
  }
  function build() {
    const day = dayM(selected), isTom = selected === offset(TODAY, 1), isToday = selected === TODAY, isPast = selected < TODAY;
    const nodes = [];
    // --- Giorno: navigazione, data, mini calendario
    const nav = h('div', { class: 'daybar card' },
      h('div', { class: 'dnav', role: 'group', 'aria-label': 'Navigazione tra i giorni' },
        h('button', { class: 'chip', ...K('prev'), onclick: () => go(offset(selected, -1)) }, '‹ Ieri'),
        h('button', { class: 'chip' + (isToday ? ' on' : ''), ...K('today'), 'aria-pressed': String(isToday), onclick: () => go(TODAY) }, 'Oggi'),
        h('button', { class: 'chip', ...K('next'), onclick: () => go(offset(selected, 1)) }, 'Domani ›')),
      h('div', { class: 'dtitle' }, h('div', { class: 'eyebrow' }, isToday ? 'Le tue missioni per oggi' : isTom ? 'Pianifichi per domani' : isPast ? 'Archivio' : 'Missioni future'),
        h('h1', {}, fmtDate(selected)), isTom ? h('span', { class: 'tag' }, 'Pianificazione domani') : null),
      h('div', { class: 'dact' },
        h('button', { class: 'chip', ...K('cal'), 'aria-expanded': String(calOpen), onclick: () => { calOpen = !calOpen; const d = parse(selected); cy = d.getFullYear(); cm = d.getMonth(); render(); } }, '▦ Scegli la data'),
        h('button', { class: 'chip primary', ...K('add'), onclick: () => openMission(null) }, '⊕ Aggiungi')));
    nodes.push(nav);
    if (calOpen) nodes.push(miniCal());
    // --- Colonne
    const main = h('div', { class: 'mmain' }), side = h('div', { class: 'mside' });
    main.append(progress(day), focusCard(), missionsCard(day, isPast));
    side.append(planAcc(day), orarioAcc(), top3Acc(day), ovAcc(), periodAcc(), links());
    nodes.push(h('div', { class: 'mlayout' }, main, side));
    return nodes;
  }
  function go(d) { selected = d; proposal = null; generating?.stop(); generating = null; confirmDel = null; focusDraft = null; focusEdit = false; const dt = parse(d); cy = dt.getFullYear(); cm = dt.getMonth(); render(); }

  /* Mini calendario (come nel sorgente: giorni con missioni e giorni completati) */
  function miniCal() {
    const first = new Date(cy, cm, 1), lead = (first.getDay() + 6) % 7, days = new Date(cy, cm + 1, 0).getDate(), by = {};
    M.forEach(m => { const b = by[m.date] ||= { n: 0, all: true }; b.n++; if (!done(m)) b.all = false; });
    const grid = h('div', { class: 'mc', role: 'group', 'aria-label': 'Giorni del mese' }, ['L', 'M', 'M', 'G', 'V', 'S', 'D'].map(l => h('span', { class: 'mcl' }, l)));
    for (let i = 0; i < lead; i++) grid.append(h('span'));
    for (let d = 1; d <= days; d++) { const ds = `${cy}-${pad(cm + 1)}-${pad(d)}`, b = by[ds];
      grid.append(h('button', { type: 'button', class: 'mcd' + (ds === TODAY ? ' today' : '') + (ds === selected ? ' sel' : '') + (b ? ' has' : '') + (b?.all ? ' all' : ''), ...K('mc-' + ds), 'aria-pressed': String(ds === selected), 'aria-label': fmtDate(ds) + (b ? ` · ${b.n} missioni${b.all ? ', tutte completate' : ''}` : ''), tabindex: ds === selected || (!grid.querySelector('[tabindex="0"]') && false) ? '0' : '-1',
        onclick: () => { go(ds); calOpen = true; render(); } }, String(d), b ? h('i', { 'aria-hidden': 'true' }) : null)); }
    grid.addEventListener('keydown', e => { const t = e.target.closest('.mcd'); if (!t) return; const d0 = t.dataset.k.slice(3), dl = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]; if (!dl) return; e.preventDefault(); calOpen = true; go(offset(d0, dl)); calOpen = true; render(); document.querySelector(`[data-k="mc-${selected}"]`)?.focus(); });
    return h('section', { class: 'card mcal', 'aria-label': 'Calendario del mese' },
      h('div', { class: 'mch' }, h('button', { class: 'chip', 'aria-label': 'Mese precedente', onclick: () => { cm--; if (cm < 0) { cm = 11; cy--; } render(); } }, '‹'), h('b', {}, `${MONTHS[cm]} ${cy}`), h('button', { class: 'chip', 'aria-label': 'Mese successivo', onclick: () => { cm++; if (cm > 11) { cm = 0; cy++; } render(); } }, '›')),
      grid, h('div', { class: 'hint' }, '▪ giorno con missioni · ✓ tutte completate'));
  }

  /* Progressi del giorno */
  function progress(day) {
    const d = day.filter(done).length, tot = day.length, xp = day.filter(done).reduce((t, m) => t + m.xp, 0), pct = tot ? Math.round(d / tot * 100) : 0;
    return h('section', { class: 'card prog', 'aria-label': 'Progressi del giorno' },
      h('div', { class: 'pstats' }, h('div', { class: 'ps1' }, h('small', {}, 'Fatte'), h('b', {}, `${d}/${tot}`)), h('div', { class: 'ps1' }, h('small', {}, 'XP guadagnati'), h('b', { class: 'xp' }, '+' + xp)),
        h('div', { class: 'pbar' }, h('div', { class: 'seg', role: 'img', 'aria-label': `${pct} percento completato` }, h('i', { style: `width:${pct}%` })), h('small', {}, tot ? pct + '% completato' : 'Nessuna missione'))));
  }

  /* Focus scelto (distinto dalla Top 3 del piano) */
  function focusRefs() { return focusDraft ? focusDraft.ids.map(id => refOf(id)) : (FOCUS[selected] || []).map(r => ({ ...r, ...(r.title ? {} : refOf(r.id)) })); }
  function refOf(id) { const m = M.find(x => x.id === id), old = (FOCUS[selected] || []).find(r => r.id === id); if (old?.status === 'moved') return old; return m ? { id, title: m.title, status: m.date === selected ? 'current' : 'moved', date: m.date, completed: done(m) } : { id, title: id, status: 'deleted' }; }
  const FSTAT = { current: 'attuale', deleted: 'eliminata', moved: 'spostata', modified: 'modificata', ambiguous: 'riferimento ambiguo' };
  function focusCard() {
    const refs = focusRefs(), has = !!(FOCUS[selected] || []).length, past = selected < TODAY, ed = focusEdit;
    const slots = [0, 1, 2].map(i => { const r = refs[i]; return r ? h('li', { class: 'fs' + (r.status !== 'current' ? ' warn' : '') }, h('span', { class: 'n' }, i + 1), h('span', { class: 'ft' }, r.title ?? r.id, r.completed || (M.find(x => x.id === r.id) && done(M.find(x => x.id === r.id))) ? h('span', { class: 'tag' }, 'completata') : null), h('span', { class: 'fst' }, FSTAT[r.status] + (r.status === 'moved' && r.date ? ' al ' + fmtShort(r.date) : ''))) : h('li', { class: 'fs empty' }, h('span', { class: 'n' }, i + 1), h('span', { class: 'ft' }, 'Posto libero')); });
    return h('section', { class: 'card focus', 'aria-labelledby': 'focus-t' },
      h('div', { class: 'fh' }, h('h2', { id: 'focus-t' }, 'Focus scelto'), h('span', { class: 'tag' }, past ? 'storico' : 'scelta tua'), h('button', { class: 'chip sm', ...K('fedit'), 'aria-expanded': String(ed), onclick: () => { focusEdit = !focusEdit; if (focusEdit && !focusDraft) focusMsg = ''; render(); } }, ed ? 'Chiudi editor' : 'Modifica focus')),
      h('p', { class: 'hint' }, 'Massimo tre missioni scelte da te. Separato dalla Top 3 proposta dal piano.'),
      !refs.length && !ed ? h('p', { class: 'muted' }, has === false ? 'Nessun focus scelto.' : 'Focus esplicitamente vuoto.') : h('ol', { class: 'fl' }, ...slots),
      focusDraft ? h('p', { class: 'warn2', role: 'status' }, 'Bozza da salvare esplicitamente · ' + focusDraft.ids.length + '/3') : (focusMsg ? h('p', { class: 'hint', role: 'status' }, focusMsg) : null),
      ed ? focusEditor(refs) : null);
  }
  function focusEditor(refs) {
    const ids = focusDraft?.ids ?? refs.map(r => r.id), edit = f => { focusDraft ??= { ids: [...ids] }; f(focusDraft.ids); focusMsg = ''; render(); };
    const avail = dayM(selected).filter(m => !ids.includes(m.id));
    return h('div', { class: 'fed' }, h('h3', {}, `Editor del focus · ${ids.length}/3`),
      h('ol', { class: 'fel' }, ids.map((id, i) => { const t = refOf(id).title ?? id; return h('li', {}, h('span', { class: 'ft' }, t), h('span', { class: 'fbtn' },
        h('button', { class: 'chip sm', ...K('up' + id), 'aria-label': 'Sposta su: ' + t, disabled: i === 0, onclick: () => edit(r => { [r[i - 1], r[i]] = [r[i], r[i - 1]]; }) }, 'Su'),
        h('button', { class: 'chip sm', ...K('dn' + id), 'aria-label': 'Sposta giù: ' + t, disabled: i === ids.length - 1, onclick: () => edit(r => { [r[i + 1], r[i]] = [r[i], r[i + 1]]; }) }, 'Giù'),
        h('button', { class: 'chip sm', ...K('rm' + id), 'aria-label': 'Rimuovi dal focus: ' + t, onclick: () => edit(r => r.splice(i, 1)) }, 'Rimuovi'))); })),
      avail.length && ids.length < 3 ? h('div', { class: 'favail' }, h('div', { class: 'sub' }, 'Aggiungi al focus'), avail.map(m => h('button', { class: 'chip sm', ...K('ad' + m.id), onclick: () => edit(r => { if (r.length < 3) r.push(m.id); }) }, '+ ' + m.title + (done(m) ? ' · completata' : '')))) : null,
      h('div', { class: 'fact' },
        h('button', { class: 'chip primary sm', ...K('fsave'), disabled: !focusDraft, onclick: () => { focusUndo = { date: selected, prev: FOCUS[selected] ? structuredClone(FOCUS[selected]) : null }; FOCUS[selected] = focusDraft.ids.map(id => ({ id, status: 'current' })); focusDraft = null; focusMsg = 'Operazione confermata (simulata) · nessun dato salvato.'; render(); note('Focus salvato (simulato).'); } }, 'Salva focus scelto'),
        h('button', { class: 'chip sm', ...K('fclear'), onclick: () => edit(r => r.splice(0)) }, 'Svuota focus'),
        h('button', { class: 'chip sm', ...K('fdisc'), disabled: !focusDraft, onclick: () => { focusDraft = null; focusMsg = 'Bozza scartata. Nessun focus salvato modificato.'; render(); } }, 'Scarta bozza'),
        focusUndo && focusUndo.date === selected && !focusDraft ? h('button', { class: 'chip sm', ...K('fundo'), onclick: () => { if (focusUndo.prev) FOCUS[selected] = focusUndo.prev; else delete FOCUS[selected]; focusUndo = null; focusMsg = 'Ultima scelta annullata (simulato): ripristinato il focus precedente.'; render(); } }, 'Annulla ultima scelta') : null,
        h('button', { class: 'chip sm', ...K('fread'), onclick: () => { focusMsg = 'Focus riletto (simulato).'; render(); } }, 'Rileggi focus')));
  }

  /* Elenco missioni */
  function nextOf(day) { return [...day].filter(m => !done(m) && !m.posticipata && !m.recoveryNote && !m.minNonNeg).sort((a, b) => a.priority - b.priority || (a.assignedStart || '99').localeCompare(b.assignedStart || '99'))[0]; }
  function missionsCard(day, isPast) {
    const shown = filter === 'tutti' ? day : day.filter(m => m.category === filter), nx = selected >= TODAY ? nextOf(day)?.id : null;
    const norm = m => !m.posticipata && !m.minNonNeg && !m.recoveryNote, ord = l => [...l].sort((a, b) => done(a) - done(b));
    const groups = [['p1', 'Alta priorità', 3, shown.filter(m => +m.priority === 1 && norm(m))], ['p2', 'Normale', 2, shown.filter(m => +m.priority === 2 && norm(m))], ['p3', 'Secondarie', 1, shown.filter(m => +m.priority === 3 && norm(m))],
      ['mnn', 'Minimo non negoziabile', '◎', shown.filter(m => m.minNonNeg)], ['rec', 'Da recuperare', '↺', shown.filter(m => m.recoveryNote && !m.minNonNeg)], ['post', 'Posticipate', '‖', shown.filter(m => m.posticipata && !m.minNonNeg && !m.recoveryNote)]];
    const inFocus = new Set(focusRefs().map(r => r.id));
    const chips = h('div', { class: 'cats', role: 'group', 'aria-label': 'Filtro per categoria' }, ['tutti', 'studio', 'fitness', 'personale', 'generale'].map(c => h('button', { class: 'chip sm cf' + (filter === c ? ' on' : ''), ...K('f-' + c), 'aria-pressed': String(filter === c), style: c === 'tutti' ? '' : '--cc:' + CAT[c][1], onclick: () => { filter = c; render(); } }, c === 'tutti' ? 'Tutti' : h('span', {}, h('i', { class: 'cg', 'aria-hidden': 'true' }, CAT[c][2]), CAT[c][0]))));
    const body = !day.length ? h('div', { class: 'empty-day' }, h('b', {}, 'Nessuna missione'), h('div', {}, isPast ? 'Nessuna missione pianificata.' : 'Aggiungi missioni e pianifica la giornata.'))
      : !shown.length ? h('div', { class: 'empty-day' }, 'Nessuna missione in questa categoria.') : groups.filter(g => g[3].length).map(([id, label, lv, list]) => h('div', { class: 'grp' }, typeof lv === 'number' ? h('h3', { class: 'gh pri lv' + lv }, h('span', { class: 'meter', 'aria-hidden': 'true' }, [1, 2, 3].map(i => h('i', { class: i <= lv ? 'on' : '' }))), h('span', { class: 'gt' }, label), h('span', { class: 'cnt' }, list.length)) : h('h3', { class: 'gh st' }, h('span', { class: 'gi', 'aria-hidden': 'true' }, lv), h('span', { class: 'gt' }, label), h('span', { class: 'cnt' }, list.length)), ord(list).map(m => row(m, id, inFocus.has(m.id), m.id === nx))));
    return h('section', { class: 'card missions', 'aria-label': 'Missioni del giorno' }, h('div', { class: 'mh' }, h('h2', {}, 'Missioni'), chips), body);
  }
  function row(m, g, foc, isNext) {
    const d = done(m), asking = confirmDel === m.id, cc = m.concentration, stateGroup = ['mnn', 'rec', 'post'].includes(g), pr = PRI[m.priority] || PRI[2];
    return h('div', { class: 'mrow cat-' + m.category + (d ? ' done' : '') + (isNext ? ' nxt' : '') + (g === 'post' ? ' post' : '') + (g === 'rec' ? ' rec' : '') + (g === 'mnn' ? ' mnn' : ''), style: `--cc:${CAT[m.category][1]}` },
      h('button', { type: 'button', class: 'chk', ...K('c' + m.id), 'aria-pressed': String(d), 'aria-label': 'Completa attività: ' + m.title, onclick: () => toggle(m.id) }, d ? '✓' : ''),
      h('div', { class: 'mb' }, h('div', { class: 'mt' }, h('span', { class: 'sr' }, 'Priorità ' + pr[2] + '. '), m.title, isNext ? h('span', { class: 'tag nx' }, 'Prossima') : null, foc ? h('span', { class: 'tag foc' }, 'focus') : null),
        m.description ? h('div', { class: 'md' }, m.description) : null, m.minNonNeg ? h('div', { class: 'md teal' }, '↳ ' + m.minNonNeg) : null, m.recoveryNote ? h('div', { class: 'md rose' }, m.recoveryNote) : null,
        h('div', { class: 'mm' }, h('span', { class: 'cat' }, h('i', { class: 'cg', 'aria-hidden': 'true' }, CAT[m.category][2]), CAT[m.category][0]), stateGroup ? h('span', { class: 'prl' }, 'Priorità ' + pr[2]) : null, m.assignedStart ? h('span', { class: 'slot' }, '⏰ ' + m.assignedStart + '–' + m.assignedEnd) : null, h('span', {}, dur(m.duration)), cc ? h('span', {}, 'Concentrazione ' + cc) : null, h('b', { class: 'xp' }, '+' + m.xp + ' XP'))),
      asking ? h('div', { class: 'ask', role: 'alertdialog', 'aria-label': 'Conferma eliminazione' }, h('span', {}, 'Eliminare questa missione?'), h('button', { class: 'chip sm danger', ...K('dy' + m.id), onclick: () => { M = M.filter(x => x.id !== m.id); confirmDel = null; render(); note('Missione eliminata (simulato).'); } }, 'Elimina'), h('button', { class: 'chip sm', ...K('dn2' + m.id), onclick: () => { confirmDel = null; render(); } }, 'Annulla'))
        : h('div', { class: 'ma' }, h('button', { class: 'chip sm ghost', ...K('e' + m.id), 'aria-label': 'Modifica attività: ' + m.title, onclick: () => openMission(m) }, h('span', { class: 'lb2' }, 'Modifica'), h('span', { class: 'ic2', 'aria-hidden': 'true' }, '✎')), h('button', { class: 'chip sm ghost', ...K('x' + m.id), 'aria-label': 'Elimina attività: ' + m.title, onclick: () => { confirmDel = m.id; render(); } }, h('span', { class: 'lb2' }, 'Elimina'), h('span', { class: 'ic2', 'aria-hidden': 'true' }, '✕'))));
  }
  function toggle(id) { const m = M.find(x => x.id === id); if (!m) return; m.completed = !m.completed; render(); note(m.completed ? `Attività completata: +${m.xp} XP (simulato, non salvato)` : 'Completamento annullato (simulato)'); }

  /* ---------- Colonna secondaria ---------- */
  const acc = (id, title, summary, body) => h('details', { class: 'card acc', ...(open[id] ? { open: '' } : {}), ontoggle: e => { open[id] = e.target.open; } }, h('summary', {}, h('span', { class: 'at' }, title), h('span', { class: 'as' }, summary)), h('div', { class: 'ab' }, body));
  function planAcc(day) {
    const todo = day.filter(m => !done(m) && !m.posticipata && !m.assignedStart && !m.recoveryNote && !m.minNonNeg);
    const run = ai => {
      if (generating) return; const pl = plan(selected, todo);
      const finish = () => { generating = null; open.piano = true; proposal = { kind: ai ? 'ai' : 'local', ...pl, message: ai ? 'Proposta AI simulata (nessun provider chiamato): nessuna modifica salvata. Applica per assegnare gli orari.' : 'Anteprima locale: nessuna modifica salvata. Applica per assegnare gli orari; se dati o ora cambiano serve una nuova anteprima.' }; render(); note(ai ? 'Anteprima AI simulata pronta.' : 'Anteprima locale pronta.'); };
      if (!ai) return finish(); const t = setTimeout(finish, 1200); generating = { stop: () => clearTimeout(t) }; open.piano = true; render();
    };
    const body = h('div', {},
      h('p', { class: 'hint' }, 'Prepara una proposta di orari per le missioni senza orario. Non viene salvato nulla finché non applichi.'),
      h('div', { class: 'btnrow' }, h('button', { class: 'chip', ...K('prevlocal'), disabled: !!generating, onclick: () => run(false) }, 'Anteprima giornata'),
        h('button', { class: 'chip', ...K('prevai'), disabled: !!generating, onclick: () => run(true) }, generating ? 'Analisi in corso…' : 'Suggerimento AI'),
        generating ? h('button', { class: 'chip', ...K('stop'), onclick: () => { generating.stop(); generating = null; render(); note('Generazione interrotta. Gli orari salvati sono conservati.'); } }, 'Interrompi') : null),
      !todo.length && !proposal ? h('p', { class: 'hint' }, 'Nessuna missione da collocare in questo giorno.') : null,
      proposal ? h('div', { class: 'prop', role: 'region', 'aria-label': 'Anteprima non salvata' }, h('span', { class: 'tag' }, 'Proposta · non salvata'), h('p', { role: 'status' }, proposal.message),
        h('ul', {}, proposal.assigned.map(a => h('li', {}, (M.find(m => m.id === a.id)?.title) + ' · ' + hm(a.s) + '–' + hm(a.e))), proposal.postponed.map(id => h('li', { class: 'dim' }, M.find(m => m.id === id).title + ' · da ripianificare'))),
        h('div', { class: 'btnrow' }, h('button', { class: 'chip primary sm', ...K('apply'), onclick: () => { proposal.assigned.forEach(a => { const m = M.find(x => x.id === a.id); m.assignedStart = hm(a.s); m.assignedEnd = hm(a.e); }); proposal.postponed.forEach(id => { M.find(x => x.id === id).posticipata = true; }); proposal = null; render(); note('Piano applicato (simulato): nessun dato salvato.'); } }, 'Applica anteprima'),
          h('button', { class: 'chip sm', ...K('discard'), onclick: () => { proposal = null; render(); note('Anteprima scartata. Gli orari salvati sono conservati.'); } }, 'Scarta anteprima'))) : null);
    return acc('piano', 'Pianifica la giornata', generating ? 'analisi in corso…' : proposal ? 'proposta pronta' : 'anteprima · suggerimento AI', body);
  }
  function orarioAcc() {
    const en = ENERGY[selected] ?? null, free = freeOf(selected), tot = free.reduce((s, [a, b]) => s + b - a, 0), conf = conflicts(selected);
    const lvl = en == null ? null : en >= 7 ? 'alta' : en >= 4 ? 'media' : 'bassa', labels = { alta: 'Energia alta — sessioni intense', media: 'Energia media — bilanciato', bassa: 'Energia bassa — sessioni leggere' };
    const tl = [...busyOf(selected).map(b => ({ ...b })), ...free.map(([s, e]) => ({ s, e, label: '✦ Libero', cls: 'free' }))].sort((a, b) => a.s - b.s);
    const body = h('div', {},
      h('div', { class: 'en' }, h('div', { class: 'enn' }, en == null ? '—' : en + '/10'), h('div', {}, h('div', {}, en == null ? 'Energia non registrata per questo giorno' : labels[lvl]), h('div', { class: 'hint' }, 'Fonte: LEO Protocol'))),
      en != null ? h('div', { class: 'seg thin', role: 'img', 'aria-label': 'Energia ' + en + ' su 10' }, h('i', { style: `width:${en * 10}%` })) : null,
      h('div', { class: 'sub' }, 'Slot disponibili'), selected === TODAY ? h('p', { class: 'hint', role: 'note' }, 'Disponibilità futura dalle ' + hm(NOW_MIN) + ', rispettando gli impegni registrati.') : null,
      free.length ? h('ul', { class: 'slots' }, free.map(([a, b]) => h('li', {}, h('span', { class: 'mono' }, hm(a) + '–' + hm(b)), h('span', {}, dur(b - a)))), h('li', { class: 'tot' }, h('span', {}, 'Totale'), h('span', {}, dur(tot)))) : h('p', { class: 'hint' }, 'Nessuno slot libero.'),
      conf.length ? h('p', { class: 'warn2', role: 'status' }, '⚠ Orari da rivedere: «' + conf[0][0].label + '» si sovrappone a «' + conf[0][1].label + '»') : null,
      h('div', { class: 'sub' }, 'Timeline'), h('ul', { class: 'tl' }, tl.map(b => h('li', { class: b.cls }, h('span', { class: 'mono' }, hm(b.s)), h('span', { class: 'tb' }, (conf.some(c => c.includes(b)) || (b.cls === 'task' && conf.some(c => c[0].id === b.id || c[1].id === b.id)) ? '⚠ ' : '') + b.label), h('span', { class: 'td' }, dur(b.e - b.s))))));
    return acc('orario', 'Piano orario', (en != null ? 'Energia ' + en + '/10 · ' : '') + dur(tot) + ' liberi', body);
  }
  function top3Acc(day) {
    const p = PLANS[selected], body = p ? h('div', {}, h('span', { class: 'tag' }, 'Proposta del piano · non è il focus scelto'), h('p', { class: 'pm' }, p.missioneDelGiorno), h('ol', { class: 't3' }, p.top3.map(id => h('li', {}, M.find(m => m.id === id)?.title ?? id))), h('p', { class: 'hint' }, p.motivazione),
      p.constraint ? h('p', { class: 'warn2' }, '⚠ ' + p.constraint) : null, p.overload ? h('p', { class: 'warn2', role: 'status' }, '⚠ Giornata sovraccarica — alcune attività posticipate. Concentrati sulle priorità.') : null) : h('p', { class: 'hint' }, 'Nessun piano salvato per questo giorno.');
    return acc('top3', 'Top 3 del piano', p ? (p.overload ? 'giornata sovraccarica' : 'proposta') : 'nessun piano', body);
  }
  function ovAcc() {
    const list = OVERRIDES[selected] || [];
    const body = h('div', {}, list.length ? list.map((o, i) => h('div', { class: 'chipov' }, h('span', {}, h('b', {}, o.desc || OV[o.type]), o.start ? h('small', {}, ` ${o.start}–${o.end}${o.next ? ' (+1 giorno)' : ''}`) : null), h('span', { class: 'ot' }, OV[o.type]), h('button', { class: 'chip sm', ...K('dov' + i), 'aria-label': 'Elimina eccezione: ' + (o.desc || OV[o.type]), onclick: () => { list.splice(i, 1); render(); note('Eccezione rimossa (simulato).'); } }, '✕'))) : h('p', { class: 'hint' }, 'Nessuna eccezione per questo giorno. Profilo base attivo.'),
      h('button', { class: 'chip sm', ...K('addov'), onclick: () => openOv() }, '+ Aggiungi eccezione'));
    return acc('eccezioni', 'Eccezioni del giorno', String(list.length), body);
  }
  function periodAcc() {
    const f = period; if (!f.from) { f.from = selected < TODAY ? TODAY : selected; f.until = offset(f.from, 6); }
    const inp = (id, v, fn, label) => h('label', { class: 'fl2' }, label, h('input', { type: 'date', class: 'field', value: v, min: id === 'from' ? TODAY : undefined, ...K('p' + id), oninput: e => { fn(e.target.value); period.preview = null; period.status = 'Parametri modificati: prepara una nuova anteprima.'; render(); } }));
    const body = h('div', {}, h('p', { class: 'hint' }, 'Anteprima locale fino a 14 giorni: mantiene lo svolto, rispetta impegni e scadenze. Le attività non collocabili restano da ripianificare.'),
      h('div', { class: 'two' }, inp('from', f.from, v => f.from = v, 'Dal'), inp('until', f.until, v => f.until = v, 'Al')),
      h('label', { class: 'chk2' }, h('input', { type: 'checkbox', ...(f.overdue ? { checked: '' } : {}), ...K('pover'), onchange: e => { f.overdue = e.target.checked; f.preview = null; f.status = 'Parametri modificati: prepara una nuova anteprima.'; render(); } }), 'Includi anche le attività arretrate non svolte'),
      h('div', { class: 'btnrow' }, h('button', { class: 'chip', ...K('pprev'), onclick: previewPeriod }, 'Prepara anteprima'), h('button', { class: 'chip primary', ...K('papply'), disabled: !f.preview, onclick: () => { f.preview.assign.forEach(a => { const m = M.find(x => x.id === a.id); m.date = a.date; m.assignedStart = hm(a.s); m.assignedEnd = hm(a.e); }); f.status = `Periodo applicato (simulato): ${f.preview.assign.length} collocate, ${f.preview.un.length} da ripianificare. Nessun dato salvato.`; f.preview = null; render(); note('Periodo applicato (simulato).'); } }, 'Applica anteprima')),
      h('p', { class: 'hint', role: 'status' }, f.status),
      f.preview ? h('ul', { class: 'pr' }, f.preview.warn.map(w => h('li', { class: 'dim' }, w)), f.preview.assign.map(a => h('li', {}, M.find(m => m.id === a.id).title + ' — ' + a.date + ' ' + hm(a.s) + '–' + hm(a.e) + (a.from !== a.date ? ' (spostata dal ' + a.from + ')' : ''))), f.preview.un.map(u => h('li', { class: 'dim' }, M.find(m => m.id === u.id).title + ' — da ripianificare: ' + u.why))) : null);
    return acc('periodo', 'Organizza più giorni', f.preview ? `${f.preview.assign.length} collocate` : 'fino a 14 giorni', body);
  }
  function previewPeriod() {
    const f = period; let err = '';
    if (!validDate(f.from) || !validDate(f.until)) err = 'Controlla le date del periodo.'; else if (f.from < TODAY) err = 'Il periodo non può iniziare nel passato.'; else if (f.until < f.from) err = 'La data finale precede quella iniziale.'; else if ((parse(f.until) - parse(f.from)) / 864e5 > 13) err = 'Il periodo può durare al massimo 14 giorni.';
    if (err) { f.preview = null; f.status = err; return render(); }
    const days = []; for (let d = f.from; d <= f.until; d = offset(d, 1)) days.push(d);
    const pool = M.filter(m => !done(m) && (f.overdue ? m.date <= f.until : m.date >= f.from && m.date <= f.until) && !m.assignedStart && !m.minNonNeg && !m.recoveryNote).sort((a, b) => a.priority - b.priority);
    const assign = [], un = [], warn = [], used = {};
    for (const m of pool) { let placed = false; for (const d of days) { if (d < (m.deadline ? '0000' : '0000')) continue; if (m.deadline && d > m.deadline) break; const slots = freeOf(d, used[d] || []).filter(([a, b]) => b - a >= m.duration); if (slots.length) { const s = slots[0][0]; (used[d] ||= []).push([s, s + m.duration]); assign.push({ id: m.id, date: d, s, e: s + m.duration, from: m.date }); placed = true; break; } } if (!placed) un.push({ id: m.id, why: m.deadline ? 'tempo insufficiente prima della scadenza ' + m.deadline : 'nessuno slot abbastanza lungo nel periodo' }); }
    if (!pool.length) warn.push('Nessuna attività da collocare nel periodo.');
    f.preview = { assign, un, warn }; f.status = `${assign.length} attività collocate; ${un.length} da ripianificare. Nessuna modifica salvata. Se dati o orario cambiano serve una nuova anteprima.`; render();
  }
  const links = () => h('div', { class: 'links' }, h('button', { class: 'lk', ...K('profile'), onclick: () => note('Operating Profile (collegamento simulato).') }, '⚙ Profilo operativo · attivo dal 12 ott (esempio)'),
    h('button', { class: 'lk', ...K('ics'), onclick: () => { const any = dayM(selected).some(m => m.assignedStart && !done(m)); note(any ? 'Esporta .ics: file non creato (simulato).' : 'Prima pianifica la giornata.'); } }, '▦ Esporta .ics'));

  /* ---------- Modali (dialog nativo) ---------- */
  const dlg = (id, title, body) => { const d = h('dialog', { id, 'aria-labelledby': id + '-t' }); d.append(h('div', { class: 'dh' }, h('h2', { id: id + '-t' }, title), h('button', { class: 'chip', 'aria-label': 'Chiudi', onclick: () => d.close() }, '✕')), h('div', { class: 'db' }, body)); d.addEventListener('click', e => { if (e.target === d) d.close(); }); document.body.append(d); return d; };
  const fld = (label, el, id) => h('div', { class: 'fr' }, h('label', { class: 'lb', for: id }, label), el);
  const F = {};
  F.title = h('input', { class: 'field', id: 'm-title', placeholder: 'Es: Completare capitolo 5 di Fisica…' }); F.desc = h('textarea', { class: 'field ta', id: 'm-desc', placeholder: 'Dettagli, obiettivo, risorse…' });
  const sel = (id, opts) => h('select', { class: 'field', id }, opts.map(([v, l]) => h('option', { value: v }, l))); F.cat = sel('m-cat', [['generale', 'Generale'], ['studio', 'Studio'], ['fitness', 'Fitness'], ['personale', 'Personale']]);
  F.xp = h('input', { type: 'range', id: 'm-xp', min: '0', max: '100', step: '1', value: '20', 'aria-label': 'XP al completamento', oninput: e => { F.xpv.textContent = e.target.value; } }); F.xpv = h('b', { class: 'xp' }, '20');
  F.dur = h('input', { class: 'field', id: 'm-dur', type: 'number', min: '1', max: '720', value: '45' }); F.en = sel('m-en', [['alta', 'Alta'], ['media', 'Media'], ['bassa', 'Bassa']]); F.conc = sel('m-conc', [['alta', 'Alta'], ['media', 'Media'], ['bassa', 'Bassa']]);
  F.dead = h('input', { class: 'field', id: 'm-dead', type: 'date' }); F.date = h('input', { class: 'field', id: 'm-date', type: 'date', 'aria-label': 'Data della missione' });
  let pri = 2, dtab = 'today', editing = null;
  const pbtns = [1, 2, 3].map(p => h('button', { type: 'button', class: 'chip', 'data-p': p, onclick: () => setPri(p) }, PRI[p][0])), dbtns = [['today', 'Oggi'], ['tomorrow', 'Domani'], ['custom', 'Altra data']].map(([v, l]) => h('button', { type: 'button', class: 'chip', 'data-d': v, onclick: () => setDtab(v) }, l));
  const setPri = p => { pri = p; pbtns.forEach(b => { const on = +b.dataset.p === p; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); };
  const setDtab = d => { dtab = d; dbtns.forEach(b => { const on = b.dataset.d === d; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); F.date.parentElement.hidden = d !== 'custom'; };
  const dateWrap = h('div', { hidden: '' }, F.date);
  F.err = h('p', { class: 'warn2', role: 'alert', hidden: '' });
  const dMis = dlg('overlay-mission', 'Nuova missione', h('div', {}, h('p', { class: 'sim' }, 'Simulazione: la missione resta solo in questa pagina'), fld('Titolo', F.title, 'm-title'), fld('Descrizione', F.desc, 'm-desc'),
    h('div', { class: 'two' }, fld('Categoria', F.cat, 'm-cat'), h('div', { class: 'fr' }, h('span', { class: 'lb' }, 'XP'), h('div', { class: 'xps' }, F.xp, F.xpv))),
    h('div', { class: 'three' }, fld('Durata (min)', F.dur, 'm-dur'), fld('Energia', F.en, 'm-en'), fld('Concentrazione', F.conc, 'm-conc')),
    h('div', { class: 'fr' }, h('span', { class: 'lb' }, 'Priorità'), h('div', { class: 'seg3', role: 'group', 'aria-label': 'Priorità' }, pbtns)),
    fld('Scadenza (opzionale)', F.dead, 'm-dead'), h('div', { class: 'fr' }, h('span', { class: 'lb' }, 'Per quale giorno?'), h('div', { class: 'seg3', role: 'group', 'aria-label': 'Giorno della missione' }, dbtns), dateWrap), F.err,
    h('div', { class: 'mf' }, h('button', { class: 'chip', onclick: () => dMis.close() }, 'Annulla'), h('button', { class: 'chip primary', id: 'save-mission', onclick: saveMission }, '⚔ Aggiungi'))));
  dMis.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target === F.title) saveMission(); });
  function openMission(m) {
    editing = m; document.getElementById('overlay-mission-t').textContent = m ? 'Modifica missione' : 'Nuova missione'; document.getElementById('save-mission').textContent = m ? 'Salva' : '⚔ Aggiungi';
    F.title.value = m?.title ?? ''; F.desc.value = m?.description ?? ''; F.cat.value = m?.category ?? 'generale'; F.xp.value = m?.xp ?? 20; F.xpv.textContent = m?.xp ?? 20; F.dur.value = m?.duration ?? 45; F.en.value = m?.energy ?? 'media'; F.conc.value = m?.concentration ?? 'media'; F.dead.value = m?.deadline ?? '';
    const date = m?.date ?? selected; F.date.value = date; setPri(+(m?.priority ?? 2)); setDtab(date === TODAY ? 'today' : date === offset(TODAY, 1) ? 'tomorrow' : 'custom'); F.err.hidden = true; dMis._opener = document.activeElement; dMis.showModal(); F.title.focus();
  }
  function saveMission() {
    const title = F.title.value.trim(), xp = Number(F.xp.value), du = Number(F.dur.value), dead = F.dead.value, date = dtab === 'tomorrow' ? offset(TODAY, 1) : dtab === 'custom' ? F.date.value : TODAY;
    if (!title || title.length > 500 || !validDate(date) || (dead && !validDate(dead)) || !Number.isSafeInteger(xp) || xp < 0 || !Number.isSafeInteger(du) || du < 1 || du > 720 || ![1, 2, 3].includes(pri)) { F.err.textContent = 'Controlla titolo, data, XP, durata e priorità.'; F.err.hidden = false; return; }
    const rec = { title, description: F.desc.value.trim(), category: F.cat.value, xp, priority: pri, duration: du, energy: F.en.value, concentration: F.conc.value, deadline: dead || null, date };
    if (editing) Object.assign(editing, rec); else M.push(mk('n' + Date.now(), date, title, rec.category, pri, du, xp, rec));
    selected = date; const d = parse(date); cy = d.getFullYear(); cm = d.getMonth(); dMis.close(); render(); note(editing ? 'Missione aggiornata (simulato)' : 'Attività aggiunta; XP al completamento (simulato, non salvata).');
  }
  /* Eccezione giornaliera */
  const OVD = { type: 'cancel-training' }; const ovBtns = Object.entries(OV).map(([v, l]) => h('button', { type: 'button', class: 'chip', 'data-ov': v, onclick: () => setOv(v) }, l));
  const setOv = v => { OVD.type = v; ovBtns.forEach(b => { const on = b.dataset.ov === v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); ovEn.hidden = v !== 'low-energy'; };
  const ovDesc = h('input', { class: 'field', id: 'ov-desc', placeholder: 'Es: Allenamento di calcio annullato per pioggia' }), ovS = h('input', { class: 'field', id: 'ov-s', type: 'time' }), ovE = h('input', { class: 'field', id: 'ov-e', type: 'time' }), ovNext = h('input', { type: 'checkbox', id: 'ov-next' });
  const ovLvl = h('input', { type: 'range', min: '1', max: '10', step: '1', value: '5', 'aria-label': 'Energia percepita da 1 a 10', oninput: e => { ovLvlV.textContent = e.target.value + '/10'; } }), ovLvlV = h('b', { class: 'xp' }, '5/10'), ovEn = h('div', { class: 'fr', hidden: '' }, h('span', { class: 'lb' }, 'Livello energia stimato (1–10)'), h('div', { class: 'xps' }, ovLvl, ovLvlV)), ovErr = h('p', { class: 'warn2', role: 'alert', hidden: '' });
  const dOv = dlg('overlay-override', 'Eccezione giornaliera', h('div', {}, h('p', { class: 'sim' }, 'Simulazione: modifica i vincoli del giorno solo in questa pagina. Gli orari delle attività interessate saranno da rivedere.'), h('div', { class: 'fr' }, h('span', { class: 'lb' }, 'Tipo di eccezione'), h('div', { class: 'ovgrid', role: 'group', 'aria-label': 'Tipo di eccezione' }, ovBtns)),
    fld('Descrizione breve', ovDesc, 'ov-desc'), h('div', { class: 'two' }, fld('Dalle (opzionale)', ovS, 'ov-s'), fld('Alle (opzionale)', ovE, 'ov-e')), h('label', { class: 'chk2' }, ovNext, 'Termina il giorno successivo (massimo 24 ore)'), ovEn, ovErr,
    h('div', { class: 'mf' }, h('button', { class: 'chip', onclick: () => dOv.close() }, 'Annulla'), h('button', { class: 'chip primary', onclick: saveOv }, '⚡ Aggiungi eccezione'))));
  function openOv() { setOv('cancel-training'); ovDesc.value = ''; ovS.value = ''; ovE.value = ''; ovNext.checked = false; ovErr.hidden = true; dOv.showModal(); ovDesc.focus(); }
  function saveOv() {
    if ((ovS.value && !ovE.value) || (!ovS.value && ovE.value) || (ovS.value && ovE.value && !ovNext.checked && ovE.value <= ovS.value)) { ovErr.textContent = 'Controlla l\'intervallo: la fine deve seguire l\'inizio.'; ovErr.hidden = false; return; }
    (OVERRIDES[selected] ||= []).push({ type: OVD.type, desc: ovDesc.value.trim(), start: ovS.value || null, end: ovE.value || null, next: ovNext.checked }); dOv.close(); open.eccezioni = true; render(); note('Eccezione aggiunta (simulato): gli orari interessati sono da rivedere.');
  }

  /* ---------- Tutte le app e Impostazioni (stesso schema dell'Hub E1) ---------- */
  const APPS = [['Quotidiano', [['☰', 'Diario della giornata'], ['⚔', 'Missioni', 'pagina corrente'], ['▦', 'Calendario'], ['✦', 'Planner AI'], ['◷', 'Weekly Review'], ['⚖', 'Decisioni']]], ['Apprendimento', [['🎓', 'Studio'], ['📚', 'Library'], ['🃏', 'Flashcard'], ['⚙', 'Engineer']]], ['Corpo e creatività', [['🏋', 'Leo Protocol'], ['⚡', 'Recovery'], ['🎨', 'Arte & Musica'], ['🏛', 'Agora'], ['🎌', 'Agora Anime']]], ['Gioco', [['⚔', 'Life RPG'], ['🌌', 'Dungeon']]], ['Intelligenza', [['◎', 'Jarvis'], ['✦', 'Second Brain'], ['✧', 'Idea Hub', 'sezione autonoma · da progettare'], ['🤖', 'AI Coach'], ['⚙', 'Profilo operativo']]], ['Sistema', [['⚙', 'Impostazioni'], ['⛁', 'Backup e ripristino'], ['🔑', 'Chiave API'], ['⚡', 'PolyFeed']]]];
  const q = h('input', { class: 'field', type: 'search', placeholder: 'Cerca una sezione…', 'aria-label': 'Cerca una sezione', style: 'width:100%' }), lst = h('div', {});
  const drawApps = () => { const t = q.value.trim().toLowerCase(); lst.replaceChildren(); for (const [g, its] of APPS) { const f = its.filter(([, l]) => l.toLowerCase().includes(t)); if (f.length) lst.append(h('div', { class: 'grp2' }, h('h3', {}, g), h('div', { class: 'items' }, f.map(([ic, l, n]) => h('button', { class: 'item', onclick: () => note('Apri ' + l + ' (collegamento simulato)') }, h('span', { class: 'ic', 'aria-hidden': 'true' }, ic), h('span', { class: 'l' }, l, n ? h('small', {}, n) : null)))))); } };
  q.oninput = drawApps; drawApps();
  const dApps = dlg('apps', 'Tutte le app', h('div', {}, h('div', { class: 'sim' }, 'Collegamenti simulati, nessuna funzione implementata'), q, lst));
  const dSet = dlg('settings', 'Impostazioni', h('div', {}, h('div', { class: 'sim' }, 'Struttura d\'esempio'), h('div', { class: 'legend' }, h('span', {}, h('span', { class: 'badge real' }, 'Esistente'), ' già presente nell\'app'), h('span', {}, h('span', { class: 'badge ex' }, 'Esempio'), ' solo del prototipo')),
    h('div', { class: 'grp2' }, h('h3', {}, 'Dati e sicurezza'), h('div', { class: 'set' }, [['Backup e ripristino', 'Esiste in /settings.html'], ['Chiave API', 'Esiste come pulsante «KEY» nell\'Hub attuale']].map(([l, n]) => h('button', { class: 'sw', style: 'text-align:left;width:100%', onclick: () => note(l + ' (simulato)') }, h('span', { class: 'l' }, l, h('small', {}, n)), h('span', { class: 'badge real' }, 'Esistente'))))),
    h('div', { class: 'grp2' }, h('h3', {}, 'Missioni'), h('div', { class: 'set' }, h('button', { class: 'sw', style: 'text-align:left;width:100%', onclick: () => note('Voce d\'esempio') }, h('span', { class: 'l' }, 'Vista predefinita del giorno', h('small', {}, 'Voce d\'esempio, non presente in Missioni')), h('span', { class: 'badge ex' }, 'Esempio'))))));
  document.getElementById('appsBtn').onclick = () => dApps.showModal(); document.getElementById('setBtn').onclick = () => dSet.showModal();
  window.__mis = { go, openMission: () => openMission(null), openOv: () => openOv(), setOpen: (k, v) => { open[k] = v; render(); }, focusEdit: v => { focusEdit = v; render(); }, run: ai => document.querySelector(`[data-k="${ai ? 'prevai' : 'prevlocal'}"]`)?.click(), period: () => { open.periodo = true; render(); document.querySelector('[data-k="pprev"]')?.click(); }, setCal: v => { calOpen = v; render(); }, M: () => M };
  narrow.addEventListener('change', render);
  render();
})();
