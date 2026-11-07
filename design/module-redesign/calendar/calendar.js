/* Calendario · prototipo, iterazione 2 (mese essenziale, settimana a griglia oraria, vista Giorno).
   Regole prese da src/hub-calendar.html e src/domain.js; dati: SOLO fixture sintetiche, "oggi" fisso. Nessuno stato salvato.
   Convenzione orari (come nel sorgente, domain.js): asse 00:00–24:00; "24:00" è la fine del giorno e coincide con 00:00 del
   giorno dopo. Un evento a cavallo di mezzanotte è diviso in due parti: fino alle 24:00 sul giorno di inizio, da 00:00 sul giorno dopo. */
(() => {
  const TODAY = '2026-11-02';              // data fissa del prototipo (lunedì)
  const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  const pad = n => String(n).padStart(2, '0');
  const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => new Date(s + 'T12:00:00');
  const offset = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return key(d); };
  const weekStart = s => { const d = parse(s); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return key(d); };
  const fmtDate = s => parse(s).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  const fmtShort = s => parse(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  const dowShort = s => parse(s).toLocaleDateString('it-IT', { weekday: 'short' }).replace('.', '');
  const toMin = c => { const [a, b] = c.split(':').map(Number); return a * 60 + b; };   // "24:00" → 1440
  const hm = n => `${pad(Math.floor(n / 60))}:${pad(n % 60)}`;
  const dur = n => (n >= 60 ? Math.floor(n / 60) + ' h' + (n % 60 ? ' ' + pad(n % 60) : '') : n + ' min');

  /* Fixture sintetiche con gli stessi campi del sorgente (type, priority, start/end, xp, completed, sourceType, scheduleIssues).
     Eventi a cavallo di mezzanotte già divisi come fa domain.js (riga 564–565): parte 1 fino a "24:00", parte 2 da "00:00" con meta «iniziato il …». */
  const EVENTS = [
    // Lunedì 2 novembre (oggi)
    { id: 'r1', date: '2026-11-02', type: 'routine', priority: 3, title: 'Routine mattutina', start: '07:00', end: '07:30', src: 'Orario del profilo' },
    { id: 's1', date: '2026-11-02', type: 'studio', priority: 3, title: 'Sessione Studio · Circuiti RC', start: '10:30', end: '11:15', src: 'Sessioni Studio', sid: 55, completed: true, xp: 40 },
    { id: 'a1', date: '2026-11-02', type: 'allenamento', priority: 2, title: 'Allenamento gambe', start: '12:30', end: '13:30', src: 'Orario del profilo' },
    { id: 'm2', date: '2026-11-02', type: 'mission', priority: 2, title: 'Ripasso flashcard', start: '13:15', end: '13:45', src: 'Missioni', sid: 102, issues: ['si sovrappone a «Allenamento gambe»'] },
    { id: 'p0', date: '2026-11-02', type: 'pasto', priority: 3, title: 'Pasto', start: '13:45', end: '14:15', src: 'Orario del profilo' },
    { id: 'v1', date: '2026-11-02', type: 'verifica', priority: 1, title: 'Verifica di Elettronica', start: '16:00', end: '17:30', src: 'Verifiche', sid: 12, meta: 'Capitoli 3–4' },
    { id: 'm1', date: '2026-11-02', type: 'mission', priority: 2, title: 'Leggere 20 pagine', src: 'Missioni', sid: 101, meta: 'Library · 11/20 pagine' },
    { id: 'm3', date: '2026-11-02', type: 'mission', priority: 3, title: 'Stretching serale', src: 'Missioni', sid: 103, planner: true },
    // Martedì 3: Studio serale a cavallo di mezzanotte (parte 1)
    { id: 'r2', date: '2026-11-03', type: 'routine', priority: 3, title: 'Routine mattutina', start: '07:00', end: '07:30', src: 'Orario del profilo' },
    { id: 'sc3', date: '2026-11-03', type: 'scuola', priority: 3, title: 'Scuola', start: '08:00', end: '13:00', src: 'Orario del profilo' },
    { id: 'rp1', date: '2026-11-03', type: 'ripetizione', priority: 3, title: 'Ripetizione flashcard · 12 carte', start: '18:00', end: '18:20', src: 'Ripetizione spaziata' },
    { id: 'n1', date: '2026-11-03', type: 'appointment', sourceType: 'extra-block', priority: 2, title: 'Studio serale', start: '22:30', end: '24:00', src: 'Eccezioni orario', sid: 7, meta: 'Blocco extra · termina il giorno successivo alle 01:00', contNext: '2026-11-04' },
    { id: 'm4', date: '2026-11-03', type: 'mission', priority: 2, title: 'Esercizi di analisi', src: 'Missioni', sid: 98, completed: true, xp: 30 },
    // Mercoledì 4: parte 2 dello Studio serale
    { id: 'n1b', date: '2026-11-04', type: 'appointment', sourceType: 'extra-block', priority: 2, title: 'Studio serale', start: '00:00', end: '01:00', src: 'Eccezioni orario', sid: 7, meta: 'Blocco extra · iniziato il 2026-11-03', fromPrev: '2026-11-03' },
    { id: 'r3', date: '2026-11-04', type: 'routine', priority: 3, title: 'Routine mattutina', start: '07:30', end: '08:00', src: 'Orario del profilo' },
    { id: 'sc4', date: '2026-11-04', type: 'scuola', priority: 3, title: 'Scuola', start: '08:30', end: '13:00', src: 'Orario del profilo' },
    // Giovedì 5: evento che finisce esattamente alle 24:00
    { id: 'sc5', date: '2026-11-05', type: 'scuola', priority: 3, title: 'Scuola', start: '08:00', end: '13:00', src: 'Orario del profilo' },
    { id: 'p1', date: '2026-11-05', type: 'pasto', priority: 3, title: 'Pasto', start: '13:00', end: '13:30', src: 'Orario del profilo' },
    { id: 'sp1', date: '2026-11-05', type: 'spostamento', priority: 3, title: 'Spostamento verso la palestra', start: '17:00', end: '17:40', src: 'Orario del profilo' },
    { id: 'x5', date: '2026-11-05', type: 'appointment', sourceType: 'appointment', priority: 2, title: 'Chiusura serata', start: '22:00', end: '24:00', src: 'Eccezioni orario', sid: 8, meta: 'Impegno · fino a fine giornata (24:00 = 00:00 del 6 novembre)' },
    // Venerdì 6: evento che inizia esattamente alle 00:00
    { id: 'l6', date: '2026-11-06', type: 'mission', priority: 2, title: 'Lettura notturna', start: '00:00', end: '00:30', src: 'Missioni', sid: 105, meta: 'Inizia alle 00:00 del 6 novembre' },
    { id: 'o1', date: '2026-11-06', type: 'appointment', sourceType: 'school-closed', priority: 2, title: 'Scuola chiusa', src: 'Eccezioni orario' },
    { id: 'f1', date: '2026-11-06', type: 'fitness', priority: 3, title: 'Check-in LEO', src: 'Check-in LEO', completed: true, xp: 20 },
    { id: 'a6', date: '2026-11-06', type: 'allenamento', priority: 2, title: 'Allenamento', start: '18:00', end: '19:00', src: 'Orario del profilo' },
    // Sabato 7 (poco carico) e domenica 8 (vuota)
    { id: 'rc7', date: '2026-11-07', type: 'recovery', priority: 3, title: 'Recupero', start: '10:00', end: '11:00', src: 'Orario del profilo' },
    { id: 'm7', date: '2026-11-07', type: 'mission', priority: 2, title: 'Lettura in Library', start: '10:30', end: '11:30', src: 'Missioni', sid: 106, issues: ['si sovrappone a «Recupero»'] },
    { id: 'x7', date: '2026-11-07', type: 'appointment', sourceType: 'appointment', priority: 2, title: 'Chiamata con il tutor', start: '10:45', end: '11:15', src: 'Eccezioni orario', sid: 9 },
    // Settimana successiva
    { id: 'v2', date: '2026-11-09', type: 'verifica', priority: 1, title: 'Verifica di Storia', start: '09:00', end: '10:00', src: 'Verifiche', sid: 13 },
    { id: 'm5', date: '2026-11-09', type: 'mission', priority: 1, title: 'Preparare il ripasso di Storia', src: 'Missioni', sid: 104 },
    { id: 'sc10', date: '2026-11-10', type: 'scuola', priority: 3, title: 'Scuola', start: '08:00', end: '13:00', src: 'Orario del profilo' },
    { id: 'pa1', date: '2026-11-10', type: 'pausa', priority: 3, title: 'Pausa dopo allenamento', start: '13:30', end: '13:45', src: 'Missioni', sid: 98, meta: 'Pausa riservata dal motore' },
    { id: 'rc1', date: '2026-11-10', type: 'recovery', priority: 3, title: 'Recupero', start: '19:00', end: '19:30', src: 'Orario del profilo' },
    // Passato
    { id: 's0', date: '2026-10-30', type: 'studio', priority: 3, title: 'Sessione Studio · Library', start: '17:00', end: '17:45', src: 'Sessioni Studio', sid: 49, completed: true, xp: 50 },
    { id: 'f0', date: '2026-10-30', type: 'fitness', priority: 3, title: 'Check-in LEO', src: 'Check-in LEO', completed: true, xp: 20 }
  ];
  const ISSUES = [{ date: '2026-11-02', src: 'Missioni', msg: 'Orario attività non interpretabile' }, { date: '2026-11-03', src: 'Profilo operativo', msg: 'Finestra giornaliera da confermare' }];

  const K = ev => ({ verifica: ['▣', 'var(--k-verifica)'], mission: ['◆', 'var(--k-mission)'], studio: ['●', 'var(--k-studio)'], fitness: ['✓', 'var(--k-checkin)'], ripetizione: ['↻', 'var(--k-ripetizione)'] }[ev.type] || (['scuola', 'routine', 'allenamento', 'appointment'].includes(ev.type) ? ['▪', 'var(--k-impegno)'] : ['·', 'var(--k-altro)']));
  const kind = ev => ev.type === 'mission' ? (ev.completed ? 'Attività svolta' : ev.start ? 'Attività pianificata' : 'Attività da pianificare')
    : ({ scuola: 'Scuola', routine: 'Routine', allenamento: 'Allenamento', appointment: ['school-closed', 'cancel-training', 'free-slot'].includes(ev.sourceType) ? 'Eccezione' : 'Impegno', studio: 'Attività svolta · sessione Studio', fitness: 'Registrazione · check-in LEO', ripetizione: 'Ripetizione', spostamento: 'Spostamento', pasto: 'Pasto', recovery: 'Recupero', pausa: 'Pausa', verifica: 'Verifica' })[ev.type] || 'Impegno';
  const source = ev => ev.src + (ev.planner ? ' · percorso Planner' : '') + (ev.sid != null ? ' · ID ' + ev.sid : '');
  const timed = ev => !!(ev.start && ev.end);
  const span = ev => [toMin(ev.start), toMin(ev.end)];
  const timeLabel = ev => timed(ev) ? ev.start + '–' + ev.end : 'Senza orario';
  const describe = ev => [kind(ev), timeLabel(ev), ev.title, 'Fonte: ' + source(ev)].join(' · ');

  /* Regola del mese: «più importanti» = prima priorità 1 (verifiche, esami extra), poi 2, poi 3; a parità prima le voci con orario,
     poi per ora di inizio. Il mese ne mostra al massimo 2 per giorno e riassume le altre con «+N». Nessuna priorità nuova. */
  const MONTH_MAX = 2;
  const cmpRank = (a, b) => (a.priority || 3) - (b.priority || 3) || (timed(b) - timed(a)) || (a.start || '99').localeCompare(b.start || '99') || a.title.localeCompare(b.title);

  let selected = TODAY, y = 2026, m = 10, view = 'month', selEv = null, selGrp = null;
  const narrow = window.matchMedia('(max-width: 899px)');
  const mnarrow = window.matchMedia('(max-width: 899px)');   // sotto i 900 px il mese diventa un elenco raggruppato per data
  const range = () => view === 'month' ? { from: key(new Date(y, m, 1)), until: key(new Date(y, m + 1, 0)) } : view === 'week' ? { from: weekStart(selected), until: offset(weekStart(selected), 6) } : { from: selected, until: selected };
  const inRange = (d, r) => d >= r.from && d <= r.until;
  const dayEvents = d => EVENTS.filter(e => e.date === d);
  const $ = id => document.getElementById(id);

  /* Occupato / libero: unione degli intervalli con orario sull'asse 0–1440 */
  function busyFree(date) {
    const iv = dayEvents(date).filter(timed).map(span).sort((a, b) => a[0] - b[0]), busy = [];
    for (const [s, e] of iv) { if (busy.length && s <= busy[busy.length - 1][1]) busy[busy.length - 1][1] = Math.max(busy[busy.length - 1][1], e); else busy.push([s, e]); }
    const free = []; let t = 0; for (const [s, e] of busy) { if (s > t) free.push([t, s]); t = e; } if (t < 1440) free.push([t, 1440]);
    return { busy, free, busyMin: busy.reduce((s, [a, b]) => s + b - a, 0) };
  }
  /* Corsie per eventi sovrapposti */
  function lanes(date) {
    const items = dayEvents(date).filter(timed).map(e => { const [s, en] = span(e); return { e, s, en }; }).sort((a, b) => a.s - b.s || b.en - a.en);
    let cluster = [], end = -1;
    let cid = 0;
    const flush = () => { const ln = []; cid++; cluster.forEach(it => { it.cid = cid; let i = ln.findIndex(x => x <= it.s); if (i < 0) { i = ln.length; ln.push(0); } ln[i] = it.en; it.lane = i; }); cluster.forEach(it => it.n = ln.length); cluster = []; };
    for (const it of items) { if (cluster.length && it.s >= end) { flush(); end = -1; } cluster.push(it); end = Math.max(end, it.en); }
    if (cluster.length) flush();
    items.forEach(a => a.conf = items.some(b => b !== a && b.s < a.en && a.s < b.en));
    return items;
  }
  /* Su telefono le corsie affiancate sarebbero troppo strette per leggere i titoli: gli impegni che coincidono nell'orario
     diventano un unico gruppo (nomi elencati, orario complessivo); selezionarlo mostra i dettagli di ciascuno nel pannello. */
  function groups(date) {
    const items = lanes(date), out = [], seen = new Set();
    for (const it of items) {
      if (seen.has(it)) continue;
      if (it.n < 2) { out.push(it); continue; }
      const cl = items.filter(o => o.cid === it.cid);
      cl.forEach(x => seen.add(x)); out.push({ grp: true, list: cl, s: Math.min(...cl.map(x => x.s)), en: Math.max(...cl.map(x => x.en)) });
    }
    return out;
  }
  function groupBlock(g) {
    const n = g.list.length, ids = g.list.map(x => x.e.id).join(','), rng = hm(g.s) + '–' + (g.en === 1440 ? '24:00' : hm(g.en));
    const th = (g.en - g.s) / 60 * 40 - 2, H = Math.max(th, 19 + 14 * Math.min(n, 4)), rows = Math.floor((H - 19) / 14), more = n > rows ? n - (rows - 1) : 0, shown = more ? g.list.slice(0, Math.max(rows - 1, 0)) : g.list;
    const label = n + ' impegni nello stesso orario (' + rng + '): ' + g.list.map(x => x.e.title).join(', ') + ' · tocca per i dettagli';
    return h('button', { type: 'button', class: 'blk ovg' + (selGrp === ids ? ' on' : ''), 'data-grp': ids, title: label, 'aria-label': label, style: `--c:var(--gold);top:calc(${g.s / 60} * var(--hh));height:${H}px;left:0;width:calc(100% - 2px)`,
      onclick: e => { e.stopPropagation(); selGrp = ids; selEv = null; renderPanel(); markSel(); } },
      h('span', { class: 'gh' }, '⚠ ', h('b', {}, n + ' coincidono'), ' · ' + rng),
      shown.map(x => h('span', { class: 'gi', style: '--c:' + K(x.e)[1] }, h('i', { 'aria-hidden': 'true' }), h('b', {}, x.e.start), ' ' + x.e.title)),
      more ? h('span', { class: 'gi gm' }, '+' + more + (more === 1 ? ' altro' : ' altri') + ' · tocca per vederli') : null);
  }

  /* ---------- Blocchi ---------- */
  function pill(ev) {
    const [g, c] = K(ev);
    return h('span', { class: 'pill' + (timed(ev) ? '' : ' untimed') + (ev.completed ? ' done' : ''), style: '--c:' + c, title: describe(ev) }, h('span', { class: 'g', 'aria-hidden': 'true' }, g), (timed(ev) ? ev.start + ' ' : '◌ ') + ev.title);
  }
  function block(it, extra = '') {
    const ev = it.e, [g, c] = K(ev), tall = it.en - it.s >= 45;
    const b = h('button', { type: 'button', class: 'blk' + (ev.completed ? ' done' : '') + (it.conf ? ' conf' : '') + (selEv === ev.id ? ' on' : '') + extra, 'data-ev': ev.id, title: describe(ev), 'aria-label': describe(ev) + (it.conf ? ' · si sovrappone ad altri impegni' : ''),
      style: `--c:${c};top:calc(${it.s / 60} * var(--hh));height:max(calc(${(it.en - it.s) / 60} * var(--hh) - 2px), 20px);left:${it.lane / it.n * 100}%;width:calc(${100 / it.n}% - 2px)`, onclick: e => { e.stopPropagation(); selEv = ev.id; selGrp = null; renderPanel(); markSel(); } },
      h('span', { class: 't' }, h('span', { class: 'g', 'aria-hidden': 'true' }, g), tall ? null : h('b', {}, ev.start), tall ? '' : ' ', ev.title, ev.contNext ? ' ↓' : '', ev.fromPrev ? ' ↑' : '', it.conf ? ' ⚠' : ''));
    if (tall) { b.classList.add('tall'); b.append(h('span', { class: 'sub' }, ev.start + '–' + ev.end)); }
    return b;
  }
  const markSel = () => document.querySelectorAll('[data-ev],[data-grp]').forEach(b => b.classList.toggle('on', b.dataset.ev ? b.dataset.ev === selEv : b.dataset.grp === selGrp));
  const hourLabels = () => h('div', { class: 'axis', 'aria-hidden': 'true' }, Array.from({ length: 25 }, (_, i) => h('span', { style: `top:calc(${i} * var(--hh))` }, pad(i) + ':00')));

  /* ---------- Mese ----------
     Composizione: nessun dettaglio del giorno nel Mese (per quello c'è la vista Giorno). A schermo largo la griglia occupa
     tutta la larghezza e tutta l'altezza disponibile; sotto i 900 px il mese è un elenco per settimane. Selezionare un giorno apre Giorno. */
  const mp = ev => {
    const [g, c] = K(ev);
    return h('span', { class: 'mp' + (ev.priority === 1 ? ' p1' : '') + (timed(ev) ? '' : ' untimed') + (ev.completed ? ' done' : ''), style: '--c:' + c, title: describe(ev) },
      h('span', { class: 'g', 'aria-hidden': 'true' }, g), timed(ev) ? h('b', {}, ev.start) : h('span', { class: 'nt', 'aria-label': 'senza orario' }, '◌'), ' ', h('span', { class: 'tt' }, ev.title));
  };
  const rank = d => dayEvents(d).sort(cmpRank);
  function cellMonth(date) {
    const evs = rank(date), shown = evs.slice(0, MONTH_MAX), extra = evs.length - shown.length, d = parse(date);
    const c = h('button', { type: 'button', class: 'cell' + (date === TODAY ? ' today' : '') + (date === selected ? ' selected' : ''), 'data-date': date, 'aria-pressed': String(date === selected),
      'aria-label': d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' · ' + evs.length + ' eventi', tabindex: '-1', onclick: () => openDay(date) },
      h('span', { class: 'num' }, String(d.getDate()), date === TODAY ? h('small', {}, 'oggi') : null),
      shown.map(mp), extra > 0 ? h('span', { class: 'mmore' }, `+${extra} altr${extra === 1 ? 'o' : 'i'}`) : null);
    if (date === TODAY) c.setAttribute('aria-current', 'date');
    return c;
  }
  function monthView() {
    const first = new Date(y, m, 1), lead = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
    const grid = h('div', { class: 'grid7', id: 'grid', role: 'group', 'aria-label': 'Giorni del calendario', 'aria-describedby': 'kbd' });
    for (let i = 0; i < lead; i++) grid.append(h('div', { class: 'cell blank', 'aria-hidden': 'true' }));
    for (let d = 1; d <= days; d++) grid.append(cellMonth(`${y}-${pad(m + 1)}-${pad(d)}`));
    grid.addEventListener('keydown', e => dayKeys(e, '[data-date]'));
    return [h('div', { class: 'dow-row' }, ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'].map(x => h('div', {}, x))), h('p', { class: 'kbd', id: 'kbd' }, 'Frecce: cambia giorno. Home e Fine: inizio e fine settimana. Invio apre la vista Giorno. Ogni giorno mostra i 2 impegni più importanti: il dettaglio completo è nella vista Giorno.'), grid];
  }
  const openDay = date => { view = 'day'; select(date); };
  /* Mese su schermi stretti: elenco per settimane, un giorno per riga; toccare la riga apre la vista Giorno */
  function monthList() {
    const days = new Date(y, m + 1, 0).getDate(), all = Array.from({ length: days }, (_, i) => `${y}-${pad(m + 1)}-${pad(i + 1)}`);
    const withEv = all.filter(d => dayEvents(d).length).length, list = h('div', { class: 'mlist', role: 'group', 'aria-label': 'Giorni del mese' });
    list.append(h('p', { class: 'kbd', id: 'kbd' }, `${withEv} giorni con impegni su ${days}. Ogni giorno mostra i 2 impegni più importanti; tocca un giorno per aprire la vista Giorno. I giorni vuoti consecutivi sono raggruppati. Frecce su/giù: cambia giorno; Invio apre il giorno.`));
    const dayRow = date => {
      const evs = rank(date), shown = evs.slice(0, MONTH_MAX), extra = evs.length - shown.length, d = parse(date), isSel = date === selected;
      const head = h('button', { type: 'button', class: 'mhead', 'data-date': date, 'aria-pressed': String(isSel), tabindex: isSel ? '0' : '-1',
        'aria-label': d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' + evs.length + ' eventi · apri la vista Giorno', onclick: () => openDay(date) },
        h('span', { class: 'mdate' }, h('small', {}, dowShort(date)), h('b', {}, String(d.getDate()))),
        h('span', { class: 'mevs' }, ...(evs.length ? [...shown.map(mp), extra > 0 ? h('span', { class: 'mmore' }, `+${extra} altr${extra === 1 ? 'o' : 'i'}`) : null] : [h('span', { class: 'mnone' }, 'Nessun impegno')])),
        h('span', { class: 'mgo', 'aria-hidden': 'true' }, '›'));
      return h('div', { class: 'mday' + (date === TODAY ? ' today' : '') + (isSel ? ' selected' : '') + (evs.length ? '' : ' empty'), ...(date === TODAY ? { 'aria-current': 'date' } : {}) }, head);
    };
    const weeks = []; for (const date of all) { const ws = weekStart(date); if (!weeks.length || weeks[weeks.length - 1].ws !== ws) weeks.push({ ws, days: [] }); weeks[weeks.length - 1].days.push(date); }
    for (const { days: wd } of weeks) {
      list.append(h('h3', { class: 'mweek' }, fmtShort(wd[0]) + ' — ' + fmtShort(wd[wd.length - 1])));
      const keepRow = d => dayEvents(d).length || d === selected || d === TODAY;
      for (let i = 0; i < wd.length;) {
        if (keepRow(wd[i])) { list.append(dayRow(wd[i])); i++; continue; }
        let j = i; while (j < wd.length && !keepRow(wd[j])) j++;
        if (j - i >= 2) list.append(h('div', { class: 'mgap' }, h('span', { class: 'mdate' }, h('small', {}, dowShort(wd[i]) + '–' + dowShort(wd[j - 1])), h('b', {}, parse(wd[i]).getDate() + '–' + parse(wd[j - 1]).getDate())), h('span', { class: 'mnone' }, 'Nessun impegno')));
        else for (let k = i; k < j; k++) list.append(dayRow(wd[k]));
        i = j;
      }
    }
    list.addEventListener('keydown', e => {
      if (!['ArrowUp', 'ArrowDown'].includes(e.key) || !e.target.matches('.mhead')) return;
      const heads = [...list.querySelectorAll('.mhead')], i = heads.indexOf(e.target), n = heads[i + (e.key === 'ArrowDown' ? 1 : -1)];
      if (n) { e.preventDefault(); select(n.dataset.date); list.querySelector(`.mhead[data-date="${selected}"]`)?.focus(); }
    });
    return [list];
  }

  /* ---------- Striscia dei giorni (Giorno e Settimana stretta) ---------- */
  function strip() {
    const s = weekStart(selected);
    const st = h('div', { class: 'strip', role: 'group', 'aria-label': 'Giorni della settimana', 'aria-describedby': 'kbd2' }, Array.from({ length: 7 }, (_, i) => {
      const date = offset(s, i), n = dayEvents(date).length;
      return h('button', { type: 'button', class: 'sd' + (date === selected ? ' selected' : '') + (date === TODAY ? ' today' : ''), 'data-date': date, 'aria-pressed': String(date === selected), tabindex: date === selected ? '0' : '-1',
        'aria-label': parse(date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' + n + ' eventi', onclick: () => select(date) },
        h('small', {}, dowShort(date)), h('b', {}, String(parse(date).getDate())), h('i', {}, n ? String(n) : '·'));
    }));
    st.addEventListener('keydown', e => dayKeys(e, '.sd'));
    return st;
  }

  /* ---------- Giorno (anche Settimana su schermi stretti) ---------- */
  function dayView() {
    const bf = busyFree(selected), items = narrow.matches ? groups(selected) : lanes(selected);
    const rail = h('div', { class: 'rail', 'aria-hidden': 'true' }, bf.busy.map(([a, b]) => h('i', { style: `top:calc(${a / 60} * var(--hh));height:calc(${(b - a) / 60} * var(--hh))` })));
    const lane = h('div', { class: 'lanes' },
      bf.busy.map(([a, b]) => h('div', { class: 'band', 'aria-hidden': 'true', style: `top:calc(${a / 60} * var(--hh));height:calc(${(b - a) / 60} * var(--hh))` })),
      bf.free.filter(([a, b]) => b - a >= 60).map(([a, b]) => h('div', { class: 'free', 'aria-hidden': 'true', style: `top:calc(${a / 60} * var(--hh));height:calc(${(b - a) / 60} * var(--hh))` }, h('span', {}, 'libero · ' + dur(b - a)))),
      items.map(it => it.grp ? groupBlock(it) : block(it)));
    const tl = h('div', { class: 'tl' }, hourLabels(), rail, lane);
    if (!items.length) lane.append(h('div', { class: 'allfree', 'aria-hidden': 'true' }, 'Giornata libera · nessun impegno con orario'));
    return [h('p', { class: 'kbd', id: 'kbd2' }, 'Frecce: cambia giorno della settimana. Tab: scorri gli impegni; Invio ne mostra i dettagli.'), strip(), tl];
  }

  /* ---------- Settimana a sette colonne ---------- */
  function weekView() {
    const s = weekStart(selected), days = Array.from({ length: 7 }, (_, i) => offset(s, i)), wk = h('div', { class: 'wk' });
    wk.append(h('div', { class: 'corner' }));
    for (const date of days) { const n = dayEvents(date).length;
      wk.append(h('button', { type: 'button', class: 'wh' + (date === selected ? ' selected' : '') + (date === TODAY ? ' today' : ''), 'data-date': date, 'aria-pressed': String(date === selected), tabindex: date === selected ? '0' : '-1',
        'aria-label': parse(date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' + n + ' eventi', onclick: () => select(date) }, h('small', {}, dowShort(date)), h('b', {}, String(parse(date).getDate())))); }
    wk.append(h('div', { class: 'ulabel' }, 'Senza orario'));
    for (const date of days) { const un = dayEvents(date).filter(e => !timed(e)).sort(cmpRank);
      wk.append(h('div', { class: 'uz' }, un.slice(0, 3).map(pill), un.length > 3 ? h('span', { class: 'more' }, `+${un.length - 3} altri`) : null, !un.length ? h('span', { class: 'none' }, '—') : null)); }
    wk.append(hourLabels());
    for (const date of days) { const col = h('div', { class: 'col' + (date === selected ? ' selected' : '') + (date === TODAY ? ' today' : ''), 'data-col': date, onclick: () => select(date) }, lanes(date).map(it => block(it))); wk.append(col); }
    wk.addEventListener('keydown', e => dayKeys(e, '.wh'));
    return [h('p', { class: 'kbd', id: 'kbd2' }, 'Frecce sull\'intestazione dei giorni: cambia giorno. Tab: scorri gli impegni; Invio ne mostra i dettagli.'), wk];
  }

  /* ---------- Tastiera ---------- */
  function dayKeys(e, sel) {
    const c = e.target; if (e.defaultPrevented || !c.matches(sel) || e.altKey || e.ctrlKey || e.metaKey) return;
    const wd = (parse(c.dataset.date).getDay() + 6) % 7, onlyRow = sel !== '[data-date]';
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: onlyRow ? 0 : -7, ArrowDown: onlyRow ? 0 : 7, Home: -wd, End: 6 - wd }[e.key];
    if (!delta) return; e.preventDefault(); select(offset(c.dataset.date, delta));
    document.querySelector(`${sel}[data-date="${selected}"]`)?.focus();
  }

  /* ---------- Pannello ---------- */
  function evCard(ev, open) {
    const [, c] = K(ev), tm = timed(ev) ? ev.start + '–' + ev.end : 'Senza orario';
    return h('div', { class: 'ev' + (timed(ev) ? '' : ' untimed') + (ev.completed ? ' done' : '') + (selEv === ev.id ? ' sel' : ''), style: '--c:' + c },
      h('div', { class: 't' }, ev.title),
      h('dl', {}, h('dt', {}, 'Tipo'), h('dd', {}, kind(ev)), h('dt', {}, 'Ora'), h('dd', { class: 'mono' }, tm), h('dt', {}, 'Fonte'), h('dd', {}, source(ev)), ev.meta ? [h('dt', {}, 'Note'), h('dd', {}, ev.meta)] : null),
      ev.issues ? h('div', { class: 'warn', role: 'status' }, '⚠ Orario da rivedere: ' + ev.issues.join(' · ')) : null,
      ev.type === 'verifica' || ev.xp || ev.completed ? h('div', { class: 'badges' }, ev.type === 'verifica' ? h('span', { class: 'bdg urg' }, '⚠ Preparati!') : null, ev.xp ? h('span', { class: 'bdg xp' }, '+' + ev.xp + ' XP') : null, ev.completed ? h('span', { class: 'bdg ok' }, '✓ completata') : null) : null);
  }
  function renderPanel() {
    const evs = dayEvents(selected), panel = $('panel'); panel.replaceChildren();
    if (view === 'month') return;   // il Mese non ha pannello: il dettaglio è nella vista Giorno
    const head = h('div', { class: 'phd' }, h('div', { class: 'pd' }, fmtDate(selected)), h('div', { class: 'ps' }, selected === TODAY ? 'Oggi' : selected < TODAY ? 'Passato' : 'Futuro'));
    const body = h('div', { class: 'pb' });
    const verifiche = evs.filter(e => e.type === 'verifica').length, miss = evs.filter(e => e.type === 'mission').length, done = evs.filter(e => e.type === 'mission' && e.completed).length, xp = evs.filter(e => e.completed).reduce((s, e) => s + (e.xp || 0), 0);
    if (verifiche || miss) body.append(h('div', { class: 'score' }, h('div', { class: 'st' }, 'Sommario giorno'), h('div', { class: 'sg' }, verifiche ? h('div', { class: 'si v' }, h('b', {}, verifiche), h('small', {}, 'Verifiche')) : null, miss ? h('div', { class: 'si m' }, h('b', {}, done + '/' + miss), h('small', {}, 'Missioni')) : null, xp ? h('div', { class: 'si x' }, h('b', {}, '+' + xp), h('small', {}, 'XP')) : null)));
    {
      const bf = busyFree(selected), un = evs.filter(e => !timed(e)).sort(cmpRank);
      body.append(h('div', { class: 'psec' }, h('h3', {}, h('span', { class: 'sq', style: 'background:var(--cyan)' }), 'Occupato e libero'),
        h('div', { class: 'bf' }, h('div', {}, h('b', {}, dur(bf.busyMin) || '0 min'), h('small', {}, 'occupato')), h('div', {}, h('b', {}, dur(1440 - bf.busyMin)), h('small', {}, 'libero su 24 h'))),
        bf.free.filter(([a, b]) => b - a >= 30).length ? h('ul', { class: 'gaps' }, bf.free.filter(([a, b]) => b - a >= 30).map(([a, b]) => h('li', {}, h('span', { class: 'mono' }, hm(a) + '–' + (b === 1440 ? '24:00' : hm(b))), ' · ' + dur(b - a)))) : h('p', { class: 'hint' }, 'Nessuna fascia libera di almeno 30 minuti.')));
      body.append(h('div', { class: 'psec' }, h('h3', {}, h('span', { class: 'sq', style: 'background:var(--text2)' }), 'Senza orario'), un.length ? un.map(e => evCard(e)) : h('p', { class: 'hint' }, 'Nessuna attività senza orario.')));
      const sel = evs.find(e => e.id === selEv), grp = selGrp ? evs.filter(e => selGrp.split(',').includes(e.id)) : [];
      if (grp.length) body.append(h('div', { class: 'psec', id: 'grpdet', role: 'status' }, h('h3', {}, h('span', { class: 'sq', style: 'background:var(--gold)' }), 'Impegni nello stesso orario (' + grp.length + ')'), grp.map(e => evCard(e))));
      else body.append(h('div', { class: 'psec' }, h('h3', {}, h('span', { class: 'sq', style: 'background:var(--cyan)' }), 'Impegno selezionato'), sel ? evCard(sel) : h('p', { class: 'hint' }, evs.some(timed) ? 'Seleziona un impegno nella griglia per vederne i dettagli.' : 'Nessun impegno con orario in questo giorno.')));
      if (!evs.length) body.append(h('div', { class: 'empty-day' }, 'Giorno vuoto: nessuna attività e nessun impegno.'));
    }
    const href = 'daily-missions.html?date=' + encodeURIComponent(selected);
    panel.append(head, body, h('div', { class: 'plan' }, h('a', { class: 'chip', href: '#', id: 'plan', onclick: e => { e.preventDefault(); toast('Anteprima di navigazione verso ' + href); } }, '▦ Organizza questa giornata'),
      h('div', { class: 'prev' }, 'Anteprima di navigazione: nel prodotto apre ' + href + '. Nessuna scrittura.')));
  }

  function renderQuality() {
    const r = range(), list = ISSUES.filter(i => inRange(i.date, r)), box = $('quality');
    box.hidden = !list.length; box.replaceChildren(); if (!list.length) return;
    box.append('Calendario parziale: dati mancanti, non riconosciuti o discordanti in ' + [...new Set(list.map(i => i.src))].join(', ') + '. Gli originali sono conservati. ',
      h('ul', {}, list.map(i => h('li', {}, i.date + ' · ' + i.src + ': ' + i.msg))), h('a', { href: '#', onclick: e => { e.preventDefault(); toast('Controlla gli archivi (anteprima di navigazione)'); } }, 'Controlla gli archivi'));
  }

  function renderAll() {
    const mode = view === 'month' ? (mnarrow.matches ? 'monthlist' : 'month') : (view === 'week' && !narrow.matches) ? 'week' : 'day', main = $('main');
    $('period').replaceChildren(h('small', {}, view === 'month' ? 'Mese' : view === 'week' ? 'Settimana' : 'Giorno'),
      view === 'month' ? `${MONTHS[m]} ${y}` : view === 'week' ? fmtShort(weekStart(selected)) + ' — ' + fmtShort(offset(weekStart(selected), 6)) : fmtDate(selected));
    document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
    $('layout').className = 'layout mode-' + mode; main.className = 'card gridwrap'; main.replaceChildren(...(mode === 'month' ? monthView() : mode === 'monthlist' ? monthList() : mode === 'week' ? weekView() : dayView()));
    $('legend-night').hidden = view === 'month';
    renderQuality(); renderPanel();
    const entry = main.querySelector(`[data-date="${selected}"]`); if (entry) main.querySelectorAll('[data-date]').forEach(c => c.tabIndex = c === entry ? 0 : -1);
    if (focusKey) { main.querySelector(`[data-date="${selected}"]`)?.focus(); focusKey = false; }
  }
  let focusKey = false;
  function select(date) { const keep = document.activeElement?.closest?.('#main'); selected = date; selEv = null; selGrp = null; const d = parse(date); y = d.getFullYear(); m = d.getMonth(); focusKey = !!keep; renderAll(); }
  function step(dir) {
    if (view === 'day') return select(offset(selected, dir));
    if (view === 'week') return select(offset(selected, dir * 7));
    const t = new Date(y, m + dir, 1), day = Math.min(parse(selected).getDate(), new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate());
    select(key(new Date(t.getFullYear(), t.getMonth(), day)));
  }
  document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { view = b.dataset.view; selEv = null; selGrp = null; renderAll(); });
  $('today').onclick = () => select(TODAY); $('prev').onclick = () => step(-1); $('next').onclick = () => step(1);
  narrow.addEventListener('change', renderAll); mnarrow.addEventListener('change', renderAll);

  /* Tutte le app e Impostazioni: stesso schema dell'Hub E1 (voci d'esempio, collegamenti simulati) */
  const APPS = [['Quotidiano', [['☰', 'Diario della giornata'], ['⚔', 'Missioni'], ['▦', 'Calendario', 'pagina corrente'], ['✦', 'Planner AI'], ['◷', 'Weekly Review'], ['⚖', 'Decisioni']]], ['Apprendimento', [['🎓', 'Studio'], ['📚', 'Library'], ['🃏', 'Flashcard'], ['⚙', 'Engineer']]], ['Corpo e creatività', [['🏋', 'Leo Protocol'], ['⚡', 'Recovery'], ['🎨', 'Arte & Musica'], ['🏛', 'Agora'], ['🎌', 'Agora Anime']]], ['Gioco', [['⚔', 'Life RPG'], ['🌌', 'Dungeon']]], ['Intelligenza', [['◎', 'Jarvis'], ['✦', 'Second Brain'], ['✧', 'Idea Hub', 'sezione autonoma · da progettare'], ['🤖', 'AI Coach'], ['⚙', 'Profilo operativo']]], ['Sistema', [['⚙', 'Impostazioni'], ['⛁', 'Backup e ripristino'], ['🔑', 'Chiave API'], ['⚡', 'PolyFeed']]]];
  const dlg = (id, title, body) => { const d = h('dialog', { id, 'aria-labelledby': id + '-t' }); d.append(h('div', { class: 'dh' }, h('h2', { id: id + '-t' }, title), h('button', { class: 'chip', 'aria-label': 'Chiudi', onclick: () => d.close() }, '✕')), h('div', { class: 'db' }, body)); d.addEventListener('click', e => { if (e.target === d) d.close(); }); document.body.append(d); return d; };
  const q = h('input', { class: 'field', type: 'search', placeholder: 'Cerca una sezione…', 'aria-label': 'Cerca una sezione', style: 'width:100%' }), list = h('div', {});
  const draw = () => { const t = q.value.trim().toLowerCase(); list.replaceChildren(); for (const [g, its] of APPS) { const f = its.filter(([, l]) => l.toLowerCase().includes(t)); if (f.length) list.append(h('div', { class: 'grp' }, h('h3', {}, g), h('div', { class: 'items' }, f.map(([ic, l, note]) => h('button', { class: 'item', onclick: () => toast('Apri ' + l) }, h('span', { class: 'ic', 'aria-hidden': 'true' }, ic), h('span', { class: 'l' }, l, note ? h('small', {}, note) : null)))))); } };
  q.oninput = draw; draw();
  const dApps = dlg('apps', 'Tutte le app', h('div', {}, h('div', { class: 'sim' }, 'Collegamenti simulati, nessuna funzione implementata'), q, list));
  const dSet = dlg('settings', 'Impostazioni', h('div', {}, h('div', { class: 'sim' }, 'Struttura d\'esempio'), h('div', { class: 'legend' }, h('span', {}, h('span', { class: 'badge real' }, 'Esistente'), ' già presente nell\'app'), h('span', {}, h('span', { class: 'badge ex' }, 'Esempio'), ' solo del prototipo')),
    h('div', { class: 'grp' }, h('h3', {}, 'Dati e sicurezza'), h('div', { class: 'set' }, [['real', 'Backup e ripristino', 'Esiste in /settings.html'], ['real', 'Chiave API', 'Esiste come pulsante «KEY» nell\'Hub attuale']].map(([k, l, n]) => h('button', { class: 'sw', style: 'text-align:left;width:100%', onclick: () => toast(l) }, h('span', { class: 'l' }, l, h('small', {}, n)), h('span', { class: 'badge ' + k }, 'Esistente'))))),
    h('div', { class: 'grp' }, h('h3', {}, 'Calendario'), h('div', { class: 'set' }, h('button', { class: 'sw', style: 'text-align:left;width:100%', onclick: () => toast('Voce d\'esempio') }, h('span', { class: 'l' }, 'Vista predefinita', h('small', {}, 'Voce d\'esempio, non presente nel Calendario attuale')), h('span', { class: 'badge ex' }, 'Esempio'))))));
  $('appsBtn').onclick = () => dApps.showModal(); $('setBtn').onclick = () => dSet.showModal();
  window.__cal = { select, setView: v => { view = v; selEv = null; renderAll(); } };
  renderAll();
})();
