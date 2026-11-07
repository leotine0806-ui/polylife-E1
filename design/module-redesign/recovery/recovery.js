/* Recovery · prototipo E1. Funzioni ricavate da src/recovery-center.html (coda dei task saltati, analisi del motivo, log, andamento).
   Dati SOLO sintetici, «oggi» fisso. Ogni azione che nel prodotto salva, completa un'attività collegata o modifica archivi è SIMULATA in memoria.
   Nessuna rete, nessuna persistenza, nessuna chiamata al prodotto. Al ricaricamento tutto torna allo stato iniziale. */
(() => {
  const TODAY = '2026-11-02';
  const pad = n => String(n).padStart(2, '0');
  const parse = s => new Date(s + 'T12:00:00');
  const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dayAgo = n => { const d = parse(TODAY); d.setDate(d.getDate() - n); return key(d); };
  const daysAgo = s => Math.round((parse(TODAY) - parse(s)) / 864e5);
  const fmtShort = s => parse(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  const MOD = { studio: ['Studio', '◈', '#4f8cff'], leo: ['Training', '◆', '#fb7185'], rpg: ['Life RPG', '⚔', '#ef4444'], library: ['Lettura', '▤', '#a78bfa'], engineer: ['Coding', '⌘', '#34d399'], habits: ['Abitudini', '↻', '#fbbf24'], business: ['Business', '▣', '#00e5ff'], routine: ['Routine', '▦', '#f472b6'], other: ['Altro', '·', '#8da0b3'] };
  const mod = id => MOD[id] || MOD.other;
  const CAUSE = { dist: ['Distrazioni', '◌', '#fbbf24'], tired: ['Stanchezza', '☾', '#a78bfa'], over: ['Sovraccarico', '▲', '#fb7185'], uncl: ['Mancanza di chiarezza', '?', '#fbbf24'], proc: ['Procrastinazione', '◷', '#4f8cff'], motiv: ['Mancanza di motivazione', '○', '#9db0c2'], ext: ['Cause esterne', '☁', '#8da0b3'], other: ['Altro', '·', '#6f8699'] };
  const cause = id => CAUSE[id] || CAUSE.other;
  const IMPACT = { low: ['Basso', '#10b981'], mid: ['Medio', '#fbbf24'], high: ['Alto', '#fb7185'] };
  const CM = {
    dist: ['Telefono fuori dalla stanza per 90 min', 'Attiva Focus Mode: notifiche off', 'Cambia ambiente di lavoro', 'Usa la regola 5-4-3-2-1 per iniziare'],
    tired: ['Pausa di 20 min prima di ricominciare', 'Dividi il task in blocchi da 15 min', 'Sposta a domani mattina, priorità #1', '5 min di movimento, poi ricomincia'],
    over: ['Taglia il task al 50%: solo il nucleo', 'Scegli 1 solo obiettivo per oggi', 'Rivedi la pianificazione settimanale', 'Lascia il resto: 1 priorità'],
    uncl: ['Rileggi le istruzioni passo per passo', 'Cerca 1 esempio pratico concreto', 'Scomponi il task in micro-passi', 'Chiedi chiarimenti prima di iniziare'],
    proc: ['Regola dei 2 min: inizia solo per 2 min', 'Timer da 25 min', 'Individua perché stai evitando il task', '1 micro-ricompensa dopo il completamento'],
    motiv: ['Collega il task al tuo obiettivo a lungo termine', 'Ripassa perché lo stai facendo', 'Trova qualcosa di interessante nel task', 'Completalo per il te di domani'],
    ext: ['Registra la causa esterna e riprogramma', 'Adatta il piano alle circostanze reali', 'Comunica il ritardo se serve', 'Individua un\'alternativa'],
    other: ['Individua la causa precisa prima di riprogrammare', 'Scrivi un piano d\'azione dettagliato', 'Parlane con qualcuno', 'Torna con la mente fresca']
  };
  const APP_GROUPS = [
    ['Quotidiano', [['☰', 'Diario della giornata'], ['⚔', 'Missioni'], ['▦', 'Calendario'], ['✦', 'Planner AI'], ['◷', 'Weekly Review'], ['⚖', 'Decisioni']]],
    ['Apprendimento', [['🎓', 'Studio'], ['📚', 'Library'], ['🃏', 'Flashcard'], ['⚙', 'Engineer']]],
    ['Corpo e creatività', [['🏋', 'Leo Protocol'], ['⚡', 'Recovery', 'questa pagina'], ['🎨', 'Arte & Musica'], ['🏛', 'Agora'], ['🎌', 'Agora Anime']]],
    ['Gioco', [['⚔', 'Life RPG'], ['🌌', 'Dungeon']]],
    ['Intelligenza', [['◎', 'Jarvis'], ['✦', 'Second Brain'], ['✧', 'Idea Hub', 'sezione autonoma · da progettare'], ['🤖', 'AI Coach'], ['⚙', 'Profilo operativo']]],
    ['Sistema', [['⚙', 'Impostazioni'], ['⛁', 'Backup e ripristino'], ['🔑', 'Chiave API'], ['⚡', 'PolyFeed']]]
  ];

  /* ---------- Fixture sintetiche (stessi campi del sorgente: module, task, subj, sourceId, cause, impact, note, countermeasure, reschedMin, resolved) ---------- */
  const L = (id, ago, module, task, subj, c, impact, min, resolved, note = '', sourceId = null) => ({ id, date: dayAgo(ago), module, task, subj, cause: c, impact, min, resolved, note, sourceId, cm: CM[c][0] });
  const baseLog = () => [
    L('l1', 5, 'studio', 'Esercizi di cinematica, pag. 80', 'Fisica', 'tired', 'mid', 25, true),
    L('l2', 2, 'leo', 'Allenamento gambe', '', 'over', 'high', 45, false, 'Giornata piena di scuola.'),
    L('l3', 3, 'library', 'Leggere 20 pagine', '', 'dist', 'low', 25, true),
    L('l4', 7, 'studio', 'Schema cronologico del Risorgimento', 'Storia', 'proc', 'mid', 45, true),
    L('l5', 8, 'engineer', 'Esercizi sui circuiti RC', '', 'uncl', 'mid', 60, true),
    L('l6', 1, 'habits', 'Stretching serale', '', 'tired', 'low', 15, false),
    L('l7', 11, 'studio', 'Ripasso delle flashcard', 'Chimica', 'dist', 'mid', 25, true),
    L('l8', 4, 'routine', 'Sveglia alle 7:00', '', 'motiv', 'mid', 15, false)
  ];
  const Q = (id, subj, task, days, moved) => ({ id: 'sv4_' + id, sourceId: id, module: 'studio', task, subj, days, movedDate: moved });
  function fixture(s) {
    if (s === 'nodati') return { queue: [], log: [] };
    if (s === 'vuota') return { queue: [], log: baseLog().map(e => ({ ...e, resolved: true })) };
    if (s === 'cautela') { const log = baseLog().map(e => (e.id === 'l1' || e.id === 'l5') ? { ...e, resolved: false } : e); log.push(L('l9', 0, 'studio', 'Esercizi sulle derivate', 'Analisi', 'over', 'high', 45, false, 'Troppi compiti nello stesso giorno.', 'k9'));
      return { queue: [Q('k1', 'Chimica', 'Legami ionici: esercizi', 3, '2026-10-30'), Q('k9', 'Analisi', 'Esercizi sulle derivate', 2, '2026-10-31')], log }; }
    return { queue: [Q('k2', 'Analisi', 'Rivedere le derivate', 1, '2026-11-01')], log: baseLog() };
  }

  /* ---------- Stato in memoria ---------- */
  let scen = 'normale', tab = 'coda', modFilter = 'all', statFilter = 'all', askDel = null, resolvedToday = 0, cmN = 0, nid = 100, lastK = null;
  let { queue, log } = fixture(scen);
  let msgText = '', msgTimer = null;
  const root = document.getElementById('root'), dlg = document.getElementById('dlg');
  const K = k => ({ 'data-k': k });
  const modPill = id => h('span', { class: 'rc-pill', style: '--c:' + mod(id)[2] }, h('i', {}), mod(id)[0]);

  const note = msg => {
    msgText = msg; const live = document.getElementById('live'); live.textContent = ''; setTimeout(() => { live.textContent = msg; }, 60);
    document.querySelectorAll('.rc-status').forEach(el => { el.textContent = msg; });
    clearTimeout(msgTimer); msgTimer = setTimeout(() => { msgText = ''; live.textContent = ''; document.querySelectorAll('.rc-status').forEach(el => { el.textContent = ''; }); }, 4500);
  };
  const clearNote = () => { msgText = ''; clearTimeout(msgTimer); };
  const nav = to => note('Anteprima di navigazione verso ' + to + ' (nessuna azione).');
  function render() {
    const fk = document.activeElement?.dataset?.k, top = window.scrollY;
    root.replaceChildren(...build());
    /* Il focus si sposta solo se l'utente stava usando un comando; al primo caricamento resta all'inizio della pagina.
       Se il comando non esiste più (es. una riga risolta), passa all'azione principale o alla sezione attiva. */
    if (fk) [fk, 'hero-main', 'tab-' + tab].map(k => document.querySelector(`[data-k="${k}"]`)).find(Boolean)?.focus({ preventScroll: true });
    window.scrollTo(0, top);
  }
  const build = () => [scenBar(), legend(), tabs(), h('p', { class: 'rc-status', 'aria-hidden': 'true' }, msgText), ...({ coda, storico, andamento }[tab])()];
  const go = t => { tab = t; askDel = null; clearNote(); render(); };

  /* ---------- Calcoli (stesse regole del sorgente) ---------- */
  function score(entries = log) {
    const last = entries.filter(e => daysAgo(e.date) < 14);
    if (!last.length) return { n: 0, pct: null, color: '#6f8699', r: 0 };
    const r = last.filter(e => e.resolved).length, pct = Math.round(r / last.length * 100);
    return { n: last.length, r, pct, color: '#00e5ff' };
  }
  const urgent = q => q.days >= 2;
  function rows() {
    const out = queue.map(q => ({ q, l: log.find(e => !e.resolved && e.sourceId === q.sourceId) }));
    for (const l of log) if (!l.resolved && !(l.sourceId && queue.some(q => q.sourceId === l.sourceId))) out.push({ l });
    const w = r => (r.q && urgent(r.q) ? 4 : 0) + (r.l && r.l.impact === 'high' ? 2 : 0) + (r.q ? 1 : 0);
    return out.sort((a, b) => w(b) - w(a) || ((b.q ? b.q.days : 0) - (a.q ? a.q.days : 0)) || (b.l?.date || '').localeCompare(a.l?.date || ''));
  }
  const cautela = rs => rs.some(r => r.q && urgent(r.q));

  /* ---------- Scenari demo, legenda, schede ---------- */
  const SCEN = [['normale', 'Con attività da recuperare'], ['cautela', 'Cautela'], ['vuota', 'Coda vuota'], ['nodati', 'Nessun dato']];
  const scenBar = () => h('details', { class: 'rc-scen' }, h('summary', {}, h('span', {}, 'Scenari demo · solo prototipo'), h('b', {}, SCEN.find(x => x[0] === scen)[1])),
    h('div', { class: 'rc-scen-o', role: 'group', 'aria-label': 'Scegli lo scenario dimostrativo' }, SCEN.map(([k, l]) => h('button', { type: 'button', class: 'rc-btn', ...K('sc-' + k), 'aria-pressed': String(scen === k), onclick: () => setScen(k) }, l))));
  function setScen(k) { clearNote(); scen = k; ({ queue, log } = fixture(k)); resolvedToday = 0; askDel = null; tab = 'coda'; modFilter = 'all'; statFilter = 'all'; render(); }
  const legend = () => h('div', { class: 'rc-legend', 'aria-label': 'Come leggere la pagina' }, h('span', {}, h('span', { class: 'rc-tag rg' }, 'Registrato'), 'dato già salvato'), h('span', {}, h('span', { class: 'rc-tag sg' }, 'Suggerimento'), 'non vincolante'), h('span', {}, h('span', { class: 'rc-tag cf' }, 'Conferma tua'), 'modifica i dati'));
  const tabs = () => h('nav', { class: 'rc-tabs', 'aria-label': 'Sezioni di Recovery' }, [['coda', 'Da recuperare'], ['storico', 'Storico'], ['andamento', 'Andamento']].map(([k, l]) => h('button', { type: 'button', ...K('tab-' + k), ...(tab === k ? { 'aria-current': 'page' } : {}), onclick: () => go(k) }, l)));
  const scoreBlock = (compact) => { const s = score(); return h('div', { class: 'rc-score' }, h('div', { class: 'ring', style: `--p:${s.pct || 0};--c:${s.color}`, role: 'img', 'aria-label': s.pct === null ? 'Nessun evento registrato negli ultimi 14 giorni' : `${s.r} eventi risolti su ${s.n} negli ultimi 14 giorni, ${s.pct}%` }, h('span', {}, s.pct === null ? '—' : s.pct + '%')),
    h('div', {}, h('b', { style: 'color:' + s.color }, 'EVENTI RISOLTI ', h('span', { class: 'rc-tag rg' }, 'Registrato')), h('p', {}, s.pct === null ? 'Nessun evento negli ultimi 14 giorni.' : `${s.r} di ${s.n} eventi risolti negli ultimi 14 giorni.` + (s.n < 5 ? ' Con pochi eventi, la percentuale cambia molto anche per una sola voce.' : '')),
      compact ? null : h('button', { class: 'rc-btn ghost', type: 'button', ...K('to-and'), style: 'margin-top:6px', onclick: () => go('andamento') }, 'Vedi andamento →')));
  };

  /* ---------- Da recuperare ---------- */
  function hero() {
    const rs = rows(), next = rs[0], s = score(), warn = cautela(rs);
    const head = (label, cls) => h('div', { class: 'rc-hh' }, h('span', { class: 'eyebrow' }, 'Adesso'), h('span', { class: 'rc-state ' + (cls || '') }, label));
    if (!log.length && !queue.length) return h('section', { class: 'card rc-hero', 'aria-labelledby': 'rc-ht' }, head('Nessun dato'), h('h2', { class: 'rc-big', id: 'rc-ht' }, 'Nessuna attività saltata'), h('p', { class: 'rc-why' }, 'Quando salti un\'attività nello Studio, o ne registri una a mano, compare qui con il suo motivo e un suggerimento.'),
      h('div', { class: 'rc-acts' }, h('button', { class: 'rc-btn pri', type: 'button', ...K('hero-main'), onclick: () => openFailure(null) }, '+ Registra un\'attività saltata')), scoreBlock(true));
    if (!rs.length) return h('section', { class: 'card rc-hero ok', 'aria-labelledby': 'rc-ht' }, head(resolvedToday ? 'Coda chiusa' : 'Tutto in ordine', 'ok'), h('h2', { class: 'rc-big', id: 'rc-ht' }, resolvedToday ? `${resolvedToday} ${resolvedToday === 1 ? 'voce risolta' : 'voci risolte'} oggi` : 'Nessuna attività in attesa'),
      h('p', { class: 'rc-why' }, 'La coda è vuota. Se salti qualcosa, comparirà qui.'), h('div', { class: 'rc-acts' }, h('button', { class: 'rc-btn', type: 'button', ...K('hero-main'), onclick: () => openFailure(null) }, '+ Registra un\'attività saltata')), scoreBlock());
    const t = next.q ? next.q.task : next.l.task, m = next.q ? next.q.module : next.l.module, ur = next.q && urgent(next.q), reasons = [];
    if (ur) reasons.push(`saltata ${next.q.days} volte`); if (next.l && next.l.impact === 'high') reasons.push('impatto alto');
    const why = [mod(m)[0], next.q?.subj || next.l?.subj].filter(Boolean).join(' · ') + (reasons.length ? ' · ' + reasons.join(', ') : next.l ? ` · causa: ${cause(next.l.cause)[0].toLowerCase()}` : ' · non ancora analizzata');
    const label = warn ? 'Cautela' : resolvedToday ? 'Coda aggiornata' : 'Da recuperare';
    return h('section', { class: 'card rc-hero' + (warn ? ' warn' : ''), 'aria-labelledby': 'rc-ht' }, head(label, warn ? 'warn' : 'cy'),
      h('div', {}, h('p', { class: 'eyebrow', style: 'margin-bottom:6px' }, `Azione più utile · ${rs.length} in attesa${rs.filter(r => r.q && urgent(r.q)).length ? ', ' + rs.filter(r => r.q && urgent(r.q)).length + (rs.filter(r => r.q && urgent(r.q)).length > 1 ? ' urgenti' : ' urgente') : ''}${resolvedToday ? ' · voci risolte oggi: ' + resolvedToday : ''}`), h('h2', { class: 'rc-big', id: 'rc-ht' }, t)),
      h('p', { class: 'rc-why' }, why), next.l ? h('p', { class: 'rc-why' }, h('span', { class: 'rc-tag sg' }, 'Suggerimento'), ' ' + next.l.cm, next.l.note ? h('span', { class: 'rc-s', style: 'display:block;font-style:italic;margin-top:4px' }, '«' + next.l.note + '»') : null) : h('p', { class: 'rc-why' }, 'Non ancora analizzata: indica il motivo per ottenere un suggerimento.'),
      h('div', { class: 'rc-acts' }, next.l ? h('button', { class: 'rc-btn pri', type: 'button', ...K('hero-main'), onclick: () => confirmResolution(next) }, next.q?.sourceId ? '✓ Completa in Studio' : '✓ Chiudi analisi') : h('button', { class: 'rc-btn pri', type: 'button', ...K('hero-main'), onclick: () => openFailure(next.q) }, 'Analizza il motivo'), next.q && !next.l ? h('button', { class: 'rc-btn', type: 'button', ...K('hero-done'), onclick: () => confirmDone(next) }, '✓ Completa in Studio') : null, next.q ? h('button', { class: 'rc-btn ghost', type: 'button', ...K('hero-ms'), onclick: () => nav('/daily-missions.html?date=' + next.q.movedDate) }, 'Apri il giorno in Missioni →') : null),
      scoreBlock());
  }
  function rowEl(r) {
    const q = r.q, l = r.l, task = q ? q.task : l.task, m = q ? q.module : l.module, subj = q ? q.subj : l.subj, id = q ? q.id : l.id, ur = q && urgent(q), a = l ? cause(l.cause) : null;
    return h('div', { class: 'rc-row' + (ur ? ' urg' : ''), style: '--mc:' + mod(m)[2] },
      h('div', { class: 'rc-rl' }, modPill(m), ur ? h('span', { class: 'rc-pill wn' }, '⚠ Urgente') : null, h('span', { class: 'rc-pill' + (l ? ' cy' : '') }, l ? 'Analizzata' : 'Da analizzare'), l ? h('span', { class: 'rc-pill hi', style: 'color:' + IMPACT[l.impact][1] }, '● Impatto ' + IMPACT[l.impact][0].toLowerCase()) : null),
      h('div', { class: 'rc-t' }, task),
      h('div', { class: 'rc-s' }, [subj, q ? `Saltata ${q.days} ${q.days === 1 ? 'volta' : 'volte'}` : 'Registrata a mano', q?.movedDate ? fmtShort(q.movedDate) : l ? fmtShort(l.date) : ''].filter(Boolean).join(' · ')),
      l ? h('div', { class: 'rc-rl' }, h('span', { class: 'rc-pill', style: '--c:' + a[2] }, h('i', {}), a[0]), h('span', { class: 'rc-pill' }, `Durata proposta ${l.min} min`)) : null,
      l?.note ? h('div', { class: 'rc-s', style: 'font-style:italic' }, '«' + l.note + '»') : null,
      l ? h('div', { class: 'rc-cm' }, h('small', {}, 'Suggerimento · non vincolante'), l.cm) : null,
      h('div', { class: 'rc-ra' }, l ? h('button', { class: 'rc-btn', type: 'button', ...K('res' + id), onclick: () => confirmResolution(r) }, q?.sourceId ? '✓ Completa in Studio' : '✓ Chiudi analisi') : h('button', { class: 'rc-btn', type: 'button', ...K('an' + id), onclick: () => openFailure(q) }, 'Analizza il motivo'), !l ? h('button', { class: 'rc-btn', type: 'button', ...K('dn' + id), onclick: () => confirmDone(r) }, '✓ Completa in Studio') : null,
        q?.sourceId ? h('button', { class: 'rc-btn ghost', type: 'button', ...K('ms' + id), onclick: () => nav('/daily-missions.html?date=' + q.movedDate) }, 'Apri il giorno in Missioni →') : null,
        l ? h('button', { class: 'rc-btn ghost', type: 'button', ...K('del' + id), 'aria-label': 'Elimina l\'analisi: ' + task, onclick: () => { askDel = l.id; render(); } }, '✕ Elimina analisi') : null),
      l && askDel === l.id ? delAsk(l) : null);
  }
  const delAsk = l => h('div', { class: 'rc-ask', role: 'alertdialog', 'aria-label': 'Conferma eliminazione' }, h('span', {}, 'Eliminare questa analisi dal log? L\'attività collegata resta com\'è.'), h('button', { class: 'rc-btn dng', type: 'button', ...K('dy' + l.id), onclick: () => { log = log.filter(x => x !== l); askDel = null; render(); note('Analisi eliminata (simulato, non salvato).'); } }, 'Elimina'), h('button', { class: 'rc-btn', type: 'button', ...K('dno' + l.id), onclick: () => { askDel = null; render(); } }, 'Annulla'));
  function coda() {
    const rs = rows(), trend = trendCard(), links = h('section', { class: 'card rc-card', 'aria-labelledby': 'rc-lk' }, h('h2', { id: 'rc-lk' }, 'Collegamenti'), h('div', { class: 'rc-list' }, [['studio', 'Studio', 'Qui arrivano le attività saltate; si completano là', '/studio_polymath_v4.html'], ['missioni', 'Missioni', 'Dove si pianifica l\'orario del recupero', '/daily-missions.html']].map(([id, n, w, to]) => h('button', { type: 'button', class: 'rc-lnk', ...K('lk-' + id), onclick: () => nav(to) }, h('span', {}, h('b', {}, n), h('small', {}, w)), h('span', { class: 'go' }, 'Apri →')))));
    const others = rs.slice(1);   // la prima è già nella scheda «Adesso»: nessuna duplicazione
    const list = rs.length ? h('section', { class: 'card rc-card rc-sec', 'aria-labelledby': 'rc-ql' }, h('div', { class: 'rc-hd' }, h('h2', { id: 'rc-ql' }, others.length ? `Altre da recuperare (${others.length})` : 'Altre da recuperare'), h('button', { class: 'rc-btn', type: 'button', ...K('newf'), onclick: () => openFailure(null) }, '+ Registra un\'attività saltata')),
      others.length ? h('div', { class: 'rc-list' }, others.map(rowEl)) : h('div', { class: 'rc-empty' }, h('span', {}, 'Nessun\'altra attività in attesa. Quella in alto è l\'unica.'))) : null;
    return [hero(), h('div', { class: 'rc-cols' + (list ? '' : ' even') }, list, h('div', { class: list ? 'rc-sec' : 'rc-sec', style: list ? '' : 'display:contents' }, trend, links))].filter(Boolean);
  }
  function trendCard() { const s = score(); return h('section', { class: 'card rc-card', 'aria-labelledby': 'rc-tr' }, h('h2', { id: 'rc-tr' }, 'Andamento in breve'), log.length ? daysChart(log) : null, h('p', { class: 'rc-s', style: 'margin-top:8px' }, s.pct === null ? 'Nessun dato negli ultimi 14 giorni.' : `${s.r} di ${s.n} eventi risolti negli ultimi 14 giorni.`), h('button', { class: 'rc-btn ghost', type: 'button', ...K('to-and2'), onclick: () => go('andamento') }, 'Vedi il dettaglio →')); }

  /* ---------- Azioni (simulate) ---------- */
  function resolveRow(r) {
    if (r.l) r.l.resolved = true, r.l.resolvedDate = TODAY;
    if (r.q) { queue = queue.filter(x => x !== r.q); if (!r.l) log.push({ id: 'x' + (++nid), date: TODAY, module: 'studio', task: r.q.task, subj: r.q.subj, cause: 'other', impact: 'mid', min: 0, note: 'Completato direttamente dalla coda.', cm: '—', resolved: true, sourceId: r.q.sourceId }); }
    if (r.l?.sourceId) queue = queue.filter(x => x.sourceId !== r.l.sourceId);
    resolvedToday++; render(); note('Voce chiusa (simulato, non salvato).' + (r.q?.sourceId ? ' Nel prodotto è completata anche l\'attività collegata in Studio.' : ''));
  }
  function confirmResolution(r) {
    const linked = Boolean(r.q?.sourceId), task = r.q?.task || r.l?.task || 'Attività selezionata';
    const title = linked ? 'Completare l’attività in Studio?' : 'Chiudere questa analisi?';
    const description = linked
      ? (r.l ? 'Confermando, l’attività collegata viene completata in Studio e l’analisi viene segnata come risolta.' : 'Confermando, l’attività viene completata in Studio e il prodotto registra un evento risolto con causa «Altro».') + ' Qui non si simulano modifiche a XP o sessioni.'
      : 'Confermando, viene chiusa soltanto questa analisi. Non viene completata un’attività in Studio.';
    dialog(title, h('div', { class: 'rc-form' }, h('p', {}, h('b', {}, task)), h('p', { class: 'rc-s' }, description), h('span', { class: 'rc-tag cf', style: 'justify-self:start' }, 'Conferma tua'),
      h('div', { class: 'rc-fa' }, h('button', { class: 'rc-btn pri', type: 'button', ...K('cres'), onclick: () => { closeDlg(); resolveRow(r); } }, linked ? 'Conferma e completa' : 'Conferma chiusura'), h('button', { class: 'rc-btn', type: 'button', onclick: closeDlg }, 'Annulla'))));
  }
  function confirmDone(r) {
    confirmResolution(r);
  }
  function openFailure(q) {
    let c = null, imp = 'mid', min = 45; const manual = !q, err = h('p', { class: 'rc-err', role: 'alert' });
    const picks = (name, opts, get, set, cls) => { const wrap = h('div', { class: 'rc-grid ' + (cls || ''), role: 'group', 'aria-label': name }); const paint = () => wrap.replaceChildren(...opts.map(([v, t]) => h('button', { type: 'button', class: 'rc-pick', 'aria-pressed': String(get() === v), onclick: () => { set(v); paint(); } }, t))); paint(); return wrap; };
    const f = (id, label, el) => h('label', { class: 'rc-f', for: id }, h('span', {}, label), el);
    const modSel = h('select', { id: 'f-mod' }, Object.entries(MOD).map(([k, v]) => h('option', { value: k }, v[0]))), task = h('input', { id: 'f-task', type: 'text', placeholder: 'Es: 2 ore di fisica' }), subj = h('input', { id: 'f-subj', type: 'text', placeholder: 'Es: capitolo 7' }), noteEl = h('textarea', { id: 'f-note', placeholder: 'Cosa è successo esattamente? (facoltativo)' });
    const form = h('form', { class: 'rc-form', novalidate: '' },
      manual ? [f('f-mod', 'Modulo', modSel), f('f-task', 'Attività o obiettivo *', task), f('f-subj', 'Dettaglio (facoltativo)', subj)] : h('p', {}, h('b', {}, q.task), q.subj ? ' · ' + q.subj : ''),
      h('div', { class: 'rc-ol' }, 'Causa principale *'), picks('Causa principale', Object.entries(CAUSE).map(([k, v]) => [k, v[1] + ' ' + v[0]]), () => c, v => { c = v; }),
      h('div', { class: 'rc-ol' }, 'Impatto'), picks('Impatto', Object.entries(IMPACT).map(([k, v]) => [k, v[0]]), () => imp, v => { imp = v; }, 'three'),
      f('f-note', 'Note', noteEl),
      h('div', { class: 'rc-ol' }, 'Durata proposta (minuti)'), picks('Durata proposta in minuti', [15, 25, 45, 60, 90].map(m => [m, String(m)]), () => min, v => { min = v; }, 'five'),
      err, h('p', { class: 'rc-s' }, 'Il suggerimento sarà scelto tra quelli predefiniti per la causa. Nulla viene inviato a un provider.'),
      h('div', { class: 'rc-fa' }, h('button', { class: 'rc-btn pri', type: 'submit', ...K('fsave') }, 'Salva analisi (simulato)'), h('button', { class: 'rc-btn', type: 'button', onclick: closeDlg }, 'Annulla')));
    form.onsubmit = e => { e.preventDefault();
      if (manual && !task.value.trim()) { err.textContent = 'Attività o obiettivo: campo obbligatorio.'; task.focus(); return; }
      if (!c) { err.textContent = 'Seleziona una causa.'; return; }
      const cm = CM[c][cmN++ % CM[c].length];
      log.push({ id: 'x' + (++nid), date: TODAY, module: manual ? modSel.value : 'studio', task: manual ? task.value.trim() : q.task, subj: manual ? subj.value.trim() : q.subj, sourceId: manual ? null : q.sourceId, cause: c, impact: imp, min, note: noteEl.value.trim(), cm, resolved: false });
      closeDlg(); render(); note(`Analisi salvata (simulato, non salvata). Suggerimento: «${cm}». Durata proposta ${min} min: l'orario si pianifica in Missioni.`); };
    dialog(manual ? 'Registra un\'attività saltata' : 'Analizza il motivo', form); setTimeout(() => (manual ? task : form.querySelector('.rc-pick')).focus(), 0);
  }

  /* ---------- Storico ---------- */
  function storico() {
    const mods = [...new Set(log.map(e => e.module))];
    let list = log.filter(e => (modFilter === 'all' || e.module === modFilter) && (statFilter === 'all' || (statFilter === 'res' ? e.resolved : !e.resolved))).sort((a, b) => b.date.localeCompare(a.date));
    const modSel = h('select', { class: 'rc-sel', id: 'h-mod', ...K('modf'), onchange: e => { modFilter = e.target.value; render(); } }, h('option', { value: 'all' }, 'Tutti i moduli'), mods.map(m => h('option', { value: m, ...(modFilter === m ? { selected: '' } : {}) }, mod(m)[0])));
    return [h('section', { class: 'card rc-card rc-sec', 'aria-labelledby': 'rc-st' }, h('div', { class: 'rc-hd' }, h('div', {}, h('h2', { id: 'rc-st', style: 'margin:0' }, 'Storico'), h('p', { class: 'hint' }, `${log.length} eventi registrati`)), h('button', { class: 'rc-btn', type: 'button', ...K('newf'), onclick: () => openFailure(null) }, '+ Registra')),
      h('label', { class: 'rc-f', for: 'h-mod' }, h('span', {}, 'Modulo'), modSel),
      h('div', { class: 'rc-seg', role: 'group', 'aria-label': 'Stato' }, [['all', 'Tutti'], ['open', 'Aperti'], ['res', 'Risolti']].map(([k, l]) => h('button', { type: 'button', ...K('sf' + k), 'aria-pressed': String(statFilter === k), onclick: () => { statFilter = k; render(); } }, l))),
      list.length ? h('div', { class: 'rc-list' }, list.map(histRow)) : h('div', { class: 'rc-empty' }, h('b', {}, 'Nessun evento'), h('span', {}, log.length ? 'Nessun evento con questi filtri.' : 'Il log è vuoto: registra un\'attività saltata per iniziare.')))];
  }
  function histRow(e) {
    const a = cause(e.cause);
    return h('div', { class: 'rc-row' + (e.resolved ? ' dn' : ''), style: '--mc:' + mod(e.module)[2] },
      h('div', { class: 'rc-rl' }, modPill(e.module), h('span', { class: 'rc-pill' + (e.resolved ? ' ok' : ' cy') }, e.resolved ? '✓ Risolto' : 'Aperto'), h('span', { class: 'rc-pill', style: 'color:' + IMPACT[e.impact][1] }, '● Impatto ' + IMPACT[e.impact][0].toLowerCase())),
      h('div', { class: 'rc-t' }, e.task), h('div', { class: 'rc-s' }, [e.subj, fmtShort(e.date), e.min ? 'durata proposta ' + e.min + ' min' : ''].filter(Boolean).join(' · ')),
      h('div', { class: 'rc-rl' }, h('span', { class: 'rc-pill', style: '--c:' + a[2] }, h('i', {}), a[0])), e.note ? h('div', { class: 'rc-s', style: 'font-style:italic' }, '«' + e.note + '»') : null,
      e.cm && e.cm !== '—' ? h('div', { class: 'rc-cm' }, h('small', {}, 'Suggerimento · non vincolante'), e.cm) : null,
      h('div', { class: 'rc-ra' }, e.resolved ? h('button', { class: 'rc-btn', type: 'button', ...K('re' + e.id), onclick: () => { e.resolved = false; if (resolvedToday) resolvedToday--; render(); note('Analisi riaperta (simulato). Completamento, sessioni e XP dell\'attività restano com\'erano.'); } }, '↺ Riapri l\'analisi') : h('button', { class: 'rc-btn', type: 'button', ...K('hr' + e.id), onclick: () => confirmResolution({ l: e, q: queue.find(q => q.sourceId === e.sourceId) }) }, queue.some(q => q.sourceId === e.sourceId) ? '✓ Completa in Studio' : '✓ Chiudi analisi'),
        h('button', { class: 'rc-btn ghost', type: 'button', ...K('hd' + e.id), 'aria-label': 'Elimina evento: ' + e.task, onclick: () => { askDel = e.id; render(); } }, '✕ Elimina')),
      askDel === e.id ? delAsk(e) : null);
  }

  /* ---------- Andamento ---------- */
  function daysChart(entries) {
    const cols = Array.from({ length: 14 }, (_, i) => { const d = dayAgo(13 - i), ev = entries.filter(e => e.date === d); return { d, r: ev.filter(e => e.resolved).length, o: ev.filter(e => !e.resolved).length }; }), max = Math.max(1, ...cols.map(c => c.r + c.o)), tot = cols.reduce((s, c) => s + c.r + c.o, 0);
    return h('div', {}, h('div', { class: 'rc-days', role: 'img', 'aria-label': `Ultimi 14 giorni: ${tot} eventi registrati, ${cols.reduce((s, c) => s + c.r, 0)} risolti` },
      cols.map(c => h('div', { title: `${fmtShort(c.d)}: ${c.r} risolti, ${c.o} aperti` }, h('i', { class: 'r', style: `height:${c.r / max * 100}%` }), h('i', { class: 'o', style: `height:${c.o / max * 100}%` })))),
      h('div', { class: 'rc-dl' }, h('span', {}, fmtShort(cols[0].d)), h('span', {}, 'oggi')),
      h('p', { class: 'rc-s' }, h('span', { style: 'color:#6ee7b7' }, '■ risolti'), '  ', h('span', { style: 'color:var(--gold)' }, '■ aperti'), ' · per data di registrazione'),
      h('ul', { class: 'sr' }, cols.filter(c => c.r + c.o).map(c => h('li', {}, `${fmtShort(c.d)}: ${c.r} risolti, ${c.o} aperti`))));
  }
  function andamento() {
    const mods = [...new Set(log.map(e => e.module))], f = modFilter === 'all' ? log : log.filter(e => e.module === modFilter), s = score(f);
    const byMod = Object.entries(f.reduce((a, e) => (a[e.module] = (a[e.module] || 0) + 1, a), {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const byCause = Object.entries(f.reduce((a, e) => (a[e.cause] = (a[e.cause] || 0) + 1, a), {})).sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ id, n, pct: Math.round(n / f.length * 100) }));
    const modSel = h('select', { class: 'rc-sel', id: 'a-mod', ...K('modf'), onchange: e => { modFilter = e.target.value; render(); } }, h('option', { value: 'all' }, 'Tutti i moduli'), mods.map(m => h('option', { value: m, ...(modFilter === m ? { selected: '' } : {}) }, mod(m)[0])));
    const out = [h('section', { class: 'card rc-card rc-sec', 'aria-labelledby': 'rc-an' }, h('h2', { id: 'rc-an', style: 'margin:0' }, 'Andamento'), h('label', { class: 'rc-f', for: 'a-mod' }, h('span', {}, 'Modulo'), modSel),
      h('div', { class: 'rc-score', style: 'border:0;padding:0' }, h('div', { class: 'ring', style: `--p:${s.pct || 0};--c:${s.color}`, role: 'img', 'aria-label': s.pct === null ? 'Nessun evento registrato negli ultimi 14 giorni' : `${s.r} eventi risolti su ${s.n} negli ultimi 14 giorni, ${s.pct}%` }, h('span', {}, s.pct === null ? '—' : s.pct + '%')),
        h('div', {}, h('b', { style: 'color:' + s.color }, 'EVENTI RISOLTI ', h('span', { class: 'rc-tag rg' }, 'Registrato')), h('p', {}, s.pct === null ? 'Nessun dato negli ultimi 14 giorni.' : `${s.r} di ${s.n} eventi risolti negli ultimi 14 giorni.`), h('p', { class: 'rc-s' }, `Log totale: ${f.length} eventi. La percentuale è solo il rapporto tra eventi risolti e registrati.`))))];
    if (!f.length) { out.push(h('section', { class: 'card rc-card', 'aria-labelledby': 'rc-np' }, h('h2', { id: 'rc-np' }, 'Nessun andamento'), h('div', { class: 'rc-empty' }, h('b', {}, 'Nessun andamento da mostrare'), h('span', {}, 'Registra almeno un\'attività saltata per vedere i pattern.'), h('button', { class: 'rc-btn', type: 'button', ...K('newf'), onclick: () => openFailure(null) }, '+ Registra un\'attività saltata')))); return out; }
    const left = [h('section', { class: 'card rc-card', 'aria-labelledby': 'rc-d14' }, h('div', { class: 'rc-hd', style: 'margin-bottom:8px' }, h('h2', { id: 'rc-d14', style: 'margin:0' }, 'Ultimi 14 giorni'), h('span', { class: 'rc-tag', title: 'Nuova visualizzazione, derivata dalle date già registrate' }, 'Proposta')), daysChart(f))];
    if (byMod.length > 1) left.push(h('section', { class: 'card rc-card', 'aria-labelledby': 'rc-pm' }, h('h2', { id: 'rc-pm' }, 'Per modulo'), h('div', { class: 'rc-list' }, byMod.map(([m, n]) => h('div', { class: 'rc-br' }, h('span', {}, mod(m)[0]), h('div', { class: 'bar' }, h('i', { style: `width:${Math.round(n / byMod[0][1] * 100)}%;background:${mod(m)[2]}` })), h('span', {}, String(n)))))));
    const top = byCause[0];
    out.push(h('div', { class: 'rc-cols even' }, h('div', { class: 'rc-sec' }, left), h('div', { class: 'rc-sec' }, h('section', { class: 'card rc-card', 'aria-labelledby': 'rc-cp' }, h('h2', { id: 'rc-cp' }, `Cause principali (${f.length} eventi)`), h('div', { class: 'rc-list' }, byCause.map(c => h('div', { class: 'rc-br' }, h('span', {}, cause(c.id)[0]), h('div', { class: 'bar' }, h('i', { style: `width:${c.pct}%;background:${cause(c.id)[2]}` })), h('span', {}, c.pct + '%')))),
      h('div', { class: 'rc-top', style: 'margin-top:10px' }, h('div', { class: 'rc-rl' }, h('b', {}, 'Causa più frequente: ' + cause(top.id)[0]), h('span', { class: 'rc-tag sg' }, 'Suggerimento')), h('p', { class: 'rc-s' }, `Contromisura prioritaria: ${CM[top.id][0]}.`),
        f.length >= 3 ? h('p', { class: 'rc-s' }, `Calcolato dalle registrazioni con una regola fissa: non è un'analisi AI e il prodotto non verifica i 7 giorni di prova.`) : null)))));
    out.push(h('p', { class: 'rc-quote' }, '«La continuità non nasce dall\'assenza di errori, ma dalla capacità di correggersi rapidamente.»'));
    return out;
  }

  /* ---------- Finestre ---------- */
  function dialog(title, body) { lastK = document.activeElement?.dataset?.k || null; document.getElementById('dlg-t').textContent = title; document.getElementById('dlg-b').replaceChildren(h('p', { class: 'rc-sim' }, 'Simulazione · nessun salvataggio'), body); if (!dlg.open) dlg.showModal(); }
  function closeDlg() { if (dlg.open) dlg.close(); }
  document.getElementById('dlg-x').onclick = closeDlg;
  dlg.addEventListener('close', () => { if (lastK) document.querySelector(`[data-k="${lastK}"]`)?.focus({ preventScroll: true }); });
  dlg.addEventListener('click', e => { if (e.target === dlg) closeDlg(); });
  function moduleDialog(id, title, body) { const d = h('dialog', { id, 'aria-labelledby': id + '-title' }); d.append(h('div', { class: 'dh' }, h('h2', { id: id + '-title' }, title), h('button', { class: 'chip', type: 'button', 'aria-label': 'Chiudi', onclick: () => d.close() }, '✕')), h('div', { class: 'db' }, body)); d.addEventListener('click', e => { if (e.target === d) d.close(); }); document.body.append(d); return d; }
  const appSearch = h('input', { class: 'field', type: 'search', placeholder: 'Cerca una sezione…', 'aria-label': 'Cerca una sezione', style: 'width:100%' }), appList = h('div', {});
  const drawApps = () => { const qy = appSearch.value.trim().toLocaleLowerCase('it'); appList.replaceChildren(); let n = 0;
    for (const [g, items] of APP_GROUPS) { const ms = items.filter(([, l]) => l.toLocaleLowerCase('it').includes(qy)); if (!ms.length) continue; n += ms.length;
      appList.append(h('div', { class: 'grp' }, h('h3', {}, g), h('div', { class: 'items' }, ms.map(([ic, l, nt]) => h('button', { class: 'item', type: 'button', onclick: () => { dApps.close(); if (l === 'Recovery') go('coda'); else note('Collegamento simulato: ' + l + '.'); } }, h('span', { class: 'ic', 'aria-hidden': 'true' }, ic), h('span', { class: 'l' }, l, nt ? h('small', {}, nt) : null)))))); }
    if (!n) appList.append(h('p', { class: 'empty' }, 'Nessuna sezione trovata.')); };
  appSearch.addEventListener('input', drawApps); drawApps();
  const dApps = moduleDialog('rc-apps', 'Tutte le app', h('div', {}, h('div', { class: 'sim' }, 'Collegamenti simulati · nessuna funzione esterna viene aperta'), appSearch, appList));
  const dSet = moduleDialog('rc-settings', 'Impostazioni', h('div', {}, h('div', { class: 'sim' }, 'Anteprima della struttura · le voci d\'esempio non modificano l\'app'), h('div', { class: 'legend' }, h('span', {}, h('span', { class: 'badge real' }, 'Esistente'), ' già presente nell\'app'), h('span', {}, h('span', { class: 'badge ex' }, 'Esempio'), ' solo del prototipo')),
    h('div', { class: 'grp' }, h('h3', {}, 'Dati e sicurezza'), h('div', { class: 'set' }, [['Backup e ripristino', 'Esistente in Impostazioni'], ['Chiave API', 'Esistente nell\'Hub']].map(([l, d]) => h('button', { class: 'sw', type: 'button', onclick: () => note(l + ' · anteprima simulata') }, h('span', { class: 'l' }, l, h('small', {}, d)), h('span', { class: 'badge real' }, 'Esistente'))))),
    h('div', { class: 'grp' }, h('h3', {}, 'Recovery'), h('div', { class: 'set' }, [['Soglia di urgenza', 'Esempio · oggi fissa a 2 salti'], ['Finestra del punteggio', 'Esempio · oggi fissa a 14 giorni']].map(([l, d]) => h('button', { class: 'sw', type: 'button', onclick: () => note(l + ' · voce d\'esempio') }, h('span', { class: 'l' }, l, h('small', {}, d)), h('span', { class: 'badge ex' }, 'Esempio')))))));
  document.getElementById('appsBtn').addEventListener('click', () => dApps.showModal());
  document.getElementById('setBtn').addEventListener('click', () => dSet.showModal());

  window.__rc = { setScen, go, get state() { return { scen, tab, queue: queue.length, log: log.length, rows: rows().length, resolvedToday }; } };
  render();
})();
