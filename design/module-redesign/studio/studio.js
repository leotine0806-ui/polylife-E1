/* Studio · prototipo E1. Viste ricavate da src/studio_polymath_v4.html (Oggi, Studio/sessione e Focus, Compiti, Verifiche, Voti, Note, Metodo, KnowStudy).
   Dati SOLO sintetici, «oggi» fisso. Timer, completamento, recupero, note, voti e funzioni AI sono SIMULATI in memoria:
   nessuna rete, nessuna persistenza, nessuna chiamata al prodotto. Al ricaricamento tutto torna allo stato iniziale. */
(() => {
  const TODAY = '2026-11-02';
  const pad = n => String(n).padStart(2, '0');
  const parse = s => new Date(s + 'T12:00:00');
  const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return key(d); };
  const daysUntil = s => Math.round((parse(s) - parse(TODAY)) / 864e5);
  const validDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && key(parse(s)) === s;
  const fmtShort = s => parse(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  const fmtFull = s => parse(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
  const mmss = s => pad(Math.floor(s / 60)) + ':' + pad(s % 60);
  const dur = n => (n >= 60 ? Math.floor(n / 60) + ' h' + (n % 60 ? ' ' + pad(n % 60) : '') : n + ' min');
  const SUBJ = { Elettronica: '#8fa8d6', Storia: '#d6b97f', Fisica: '#e59aab', Chimica: '#88b8a6', Analisi: '#aaa0d0', Matematica: '#7fb0d6' };
  const SUBJECTS = Object.keys(SUBJ), sc = s => SUBJ[s] || '#9aabbd';
  const PRI = { high: 'Alta', mid: 'Media', lo: 'Bassa', obbl: 'Obbligatoria' };
  const TIPO = { c: 'Compito', v: 'Verifica', i: 'Interrogazione', p: 'Progetto' }, KIND = { s: 'Scritto', o: 'Orale', p: 'Pratico' };
  const VIEWS = [['oggi', 'Oggi'], ['compiti', 'Compiti'], ['verifiche', 'Verifiche'], ['voti', 'Voti'], ['note', 'Note'], ['metodo', 'Metodo'], ['know', 'KnowStudy']];
  const LINKS = [
    { id: 'missioni', name: 'Missioni', what: 'Organizza la giornata di studio e gli orari', to: '/daily-missions.html?date=' + TODAY + '&category=studio' },
    { id: 'planner', name: 'Planner', what: 'Prepara una verifica e il suo piano di studio', to: '/studio-planner.html' },
    { id: 'calendario', name: 'Calendario', what: 'Impegni e scadenze nel tempo', to: '/hub-calendar.html' },
    { id: 'flashcard', name: 'Flashcard', what: 'Ripasso a ripetizione spaziata e gestione delle carte', to: '/flashcards.html' },
    { id: 'recovery', name: 'Recovery', what: 'Analizza le attività spostate e i motivi', to: '/recovery-center.html' }
  ];

  /* ---------- Fixture sintetiche ---------- */
  const t = (id, subj, title, m, priority, type) => ({ id, subj, title, m, priority, t: type, done: false });
  const dayFixture = scen => ({
    tasks: scen === 'vuoto' ? [] : [t('k1', 'Elettronica', 'Ripasso capitoli 3–4', 25, 'high', 'ripasso'), t('k2', 'Storia', 'Schema cronologico delle date', 20, 'mid', 'schema'), t('k3', 'Fisica', 'Esercizi di cinematica, pag. 80–82', 30, 'lo', 'esercizi')],
    recovery: scen === 'vuoto' ? [] : scen === 'recupero'
      ? [{ id: 'r1', subj: 'Chimica', title: 'Legami ionici: esercizi', movedDate: '2026-10-30', days: 3 }, { id: 'r2', subj: 'Analisi', title: 'Rivedere le derivate', movedDate: '2026-11-01', days: 1 }]
      : [{ id: 'r2', subj: 'Analisi', title: 'Rivedere le derivate', movedDate: '2026-11-01', days: 1 }]
  });
  let compiti = [
    { id: 'c1', subj: 'Storia', titolo: 'Leggere il cap. 8', tipo: 'c', date: '2026-11-02', note: 'Prima parte', done: false },
    { id: 'c2', subj: 'Fisica', titolo: 'Esercizi di cinematica', tipo: 'c', date: '2026-11-03', note: '', done: false },
    { id: 'c3', subj: 'Elettronica', titolo: 'Relazione di laboratorio', tipo: 'p', date: '2026-11-06', note: 'Circuito RC, grafici inclusi', done: false },
    { id: 'c4', subj: 'Analisi', titolo: 'Esercizi sulle derivate', tipo: 'c', date: '2026-10-30', note: '', done: false },
    { id: 'c5', subj: 'Chimica', titolo: 'Riassunto del cap. 7', tipo: 'c', date: '2026-10-29', note: '', done: true }
  ];
  let ver = [
    { id: 'v1', subj: 'Elettronica', tipo: 'v', date: '2026-11-02', note: 'Capitoli 3–4: amplificatori operazionali' },
    { id: 'v2', subj: 'Storia', tipo: 'i', date: '2026-11-09', note: 'Il Risorgimento e l\'unità d\'Italia' },
    { id: 'v3', subj: 'Fisica', tipo: 'v', date: '2026-11-16', note: 'Cinematica e dinamica' },
    { id: 'v4', subj: 'Chimica', tipo: 'v', date: '2026-11-20', note: 'Legami chimici' },
    { id: 'v0', subj: 'Analisi', tipo: 'v', date: '2026-10-28', note: 'Limiti e derivate' }
  ];
  let voti = [
    { id: 'g1', subj: 'Chimica', voto: 8.5, tipo: 's', date: '2026-10-08', arg: 'Tavola periodica' },
    { id: 'g2', subj: 'Storia', voto: 6.5, tipo: 's', date: '2026-10-15', arg: 'Il Risorgimento' },
    { id: 'g3', subj: 'Elettronica', voto: 7.5, tipo: 's', date: '2026-10-20', arg: 'Amplificatori' },
    { id: 'g4', subj: 'Fisica', voto: 5.5, tipo: 's', date: '2026-10-22', arg: 'Cinematica' },
    { id: 'g5', subj: 'Elettronica', voto: 8, tipo: 'o', date: '2026-10-27', arg: 'Retroazione' },
    { id: 'g6', subj: 'Analisi', voto: 7, tipo: 's', date: '2026-10-28', arg: 'Limiti' },
    { id: 'g7', subj: 'Storia', voto: 7, tipo: 'o', date: '2026-10-29', arg: 'Guerre d\'indipendenza' },
    { id: 'g8', subj: 'Fisica', voto: 6, tipo: 'p', date: '2026-10-30', arg: 'Laboratorio di moto' }
  ];
  let notes = [
    { id: 'n1', subj: 'Elettronica', date: '2026-11-01', text: 'Thevenin: ogni rete lineare si riduce a un generatore e una resistenza in serie. Per la resistenza si spengono i generatori indipendenti. Da rivedere gli esempi con generatori dipendenti.' },
    { id: 'n2', subj: 'Storia', date: '2026-10-31', text: 'Il Risorgimento parte dai moti del 1820. Le guerre d\'indipendenza sono tre. L\'unità si proclama nel 1861.' },
    { id: 'n3', subj: 'Fisica', date: '2026-10-29', text: 'Moto uniformemente accelerato: v = v0 + at. Lo spazio cresce con il quadrato del tempo.' }
  ];

  /* ---------- Stato in memoria ---------- */
  let scen = 'normale', view = 'oggi', day = dayFixture(scen), curId = null, sess = { state: 'idle', total: 0, left: 0, elapsed: 0 }, last = null, studied = 0;
  let streak = [true, true, false, true, true, true], checkedIn = false;   // 27 ott – 1 nov; oggi non ancora registrato
  let askDel = null, votiTab = 'lista', votiFilter = 'all', grafSubj = null, notesFilter = 'all', noteUi = {}, recOpen = null, openCompleted = false;
  let met = { loading: false, html: null, error: '' }, metTimer = null, know = { phase: 'menu', mode: null, subj: 'Elettronica', topic: '', items: [], idx: 0, flip: false, fb: null, ok: 0, loading: false }, knowTimer = null;
  let msgText = '', msgTimer = null, lastK = null, tickId = null, nid = 100;
  const root = document.getElementById('root'), dlg = document.getElementById('dlg');
  const K = k => ({ 'data-k': k });
  const undone = () => day.tasks.filter(x => !x.done);
  const cur = () => day.tasks.find(x => x.id === curId && !x.done) || undone()[0] || null;
  const nextTask = () => undone().find(x => x !== cur()) || null;
  const active = () => ['running', 'paused', 'ended'].includes(sess.state);
  const pillS = s => h('span', { class: 'st-pill', style: '--c:' + sc(s) }, h('i', {}), s);

  /* Messaggio di stato nel flusso (nessun elemento sovrapposto) + annuncio per screen reader */
  const note = msg => {
    msgText = msg; const live = document.getElementById('live'); live.textContent = ''; setTimeout(() => { live.textContent = msg; }, 60);
    document.querySelectorAll('.st-status').forEach(el => { el.textContent = msg; });
    clearTimeout(msgTimer); msgTimer = setTimeout(() => { msgText = ''; live.textContent = ''; document.querySelectorAll('.st-status').forEach(el => { el.textContent = ''; }); }, 4000);
  };
  function render() {
    const fk = document.activeElement?.dataset?.k, top = window.scrollY;
    root.replaceChildren(...build());
    /* Se il comando premuto non esiste più (es. Avvia diventa Pausa), il focus passa al comando che lo sostituisce */
    const heir = { start: ['pause'], pause: ['start'], complete: ['startnext', 'checkin2', 'start', 'checkin'], startnext: ['pause'], defer: ['start', 'checkin'] };
    if (fk) [fk, ...(heir[fk] || [])].map(k => document.querySelector(`[data-k="${k}"]`)).find(Boolean)?.focus({ preventScroll: true });
    window.scrollTo(0, top);
  }
  function build() { return [scenBar(), tabs(), h('p', { class: 'st-status', 'aria-hidden': 'true' }, msgText), ...({ oggi, compiti: viewCompiti, verifiche: viewVerifiche, voti: viewVoti, note: viewNote, metodo: viewMetodo, know: viewKnow }[view])()]; }
  const go = v => { view = v; askDel = null; msgText = ''; clearTimeout(msgTimer); render(); };
  const nav = (id, to) => note('Anteprima di navigazione verso ' + to + ' (nessuna azione).');

  /* Menu globali del prototipo, coerenti con Planner, Calendario e Missioni. */
  function moduleDialog(id, title, body) {
    const d = h('dialog', { id, 'aria-labelledby': id + '-title' });
    d.append(h('div', { class: 'dh' }, h('h2', { id: id + '-title' }, title), h('button', { class: 'chip', type: 'button', 'aria-label': 'Chiudi', onclick: () => d.close() }, '✕')),
      h('div', { class: 'db' }, body));
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
    document.body.append(d);
    return d;
  }
  const APP_GROUPS = [
    ['Quotidiano', [['☰', 'Diario della giornata'], ['⚔', 'Missioni'], ['▦', 'Calendario'], ['✦', 'Planner AI'], ['◷', 'Weekly Review'], ['⚖', 'Decisioni']]],
    ['Apprendimento', [['🎓', 'Studio', 'questa pagina'], ['◎', 'KnowStudy', 'percorso interno a Studio'], ['📚', 'Library'], ['🃏', 'Flashcard'], ['⚙', 'Engineer']]],
    ['Corpo e creatività', [['🏋', 'Leo Protocol'], ['⚡', 'Recovery'], ['🎨', 'Arte & Musica'], ['🏛', 'Agora'], ['🎌', 'Agora Anime']]],
    ['Gioco', [['⚔', 'Life RPG'], ['🌌', 'Dungeon']]],
    ['Intelligenza', [['◎', 'Jarvis'], ['✦', 'Second Brain'], ['✧', 'Idea Hub', 'sezione autonoma · da progettare'], ['🤖', 'AI Coach'], ['⚙', 'Profilo operativo']]],
    ['Sistema', [['⚙', 'Impostazioni'], ['⛁', 'Backup e ripristino'], ['🔑', 'Chiave API'], ['⚡', 'PolyFeed']]]
  ];
  const appSearch = h('input', { class: 'field', type: 'search', placeholder: 'Cerca una sezione…', 'aria-label': 'Cerca una sezione', style: 'width:100%' });
  const appList = h('div', {});
  const drawApps = () => {
    const query = appSearch.value.trim().toLocaleLowerCase('it');
    appList.replaceChildren();
    let count = 0;
    for (const [group, items] of APP_GROUPS) {
      const matches = items.filter(([, label]) => label.toLocaleLowerCase('it').includes(query));
      if (!matches.length) continue;
      count += matches.length;
      appList.append(h('div', { class: 'grp2' }, h('h3', {}, group), h('div', { class: 'items' }, matches.map(([icon, label, noteText]) => h('button', {
        class: 'item', type: 'button', onclick: () => {
          dApps.close();
          if (label === 'Studio') go('oggi');
          else if (label === 'KnowStudy') go('know');
          else note('Collegamento simulato: ' + label + '.');
        }
      }, h('span', { class: 'ic', 'aria-hidden': 'true' }, icon), h('span', { class: 'l' }, label, noteText ? h('small', {}, noteText) : null))))));
    }
    if (!count) appList.append(h('p', { class: 'empty' }, 'Nessuna sezione trovata.'));
  };
  appSearch.addEventListener('input', drawApps);
  drawApps();
  const dApps = moduleDialog('studio-apps', 'Tutte le app', h('div', {}, h('div', { class: 'sim' }, 'Collegamenti simulati · nessuna funzione esterna viene aperta'), appSearch, appList));
  const dSettings = moduleDialog('studio-settings', 'Impostazioni', h('div', {},
    h('div', { class: 'sim' }, 'Anteprima della struttura · le voci d’esempio non modificano l’app'),
    h('div', { class: 'legend' }, h('span', {}, h('span', { class: 'badge real' }, 'Esistente'), ' già presente nell’app'), h('span', {}, h('span', { class: 'badge ex' }, 'Esempio'), ' solo del prototipo')),
    h('div', { class: 'grp2' }, h('h3', {}, 'Dati e sicurezza'), h('div', { class: 'set' }, [
      ['real', 'Backup e ripristino', 'Esistente in Impostazioni'], ['real', 'Chiave API', 'Esistente nell’Hub']
    ].map(([kind, label, detail]) => h('button', { class: 'sw', type: 'button', onclick: () => note(label + ' · anteprima simulata') }, h('span', { class: 'l' }, label, h('small', {}, detail)), h('span', { class: 'badge ' + kind }, 'Esistente'))))),
    h('div', { class: 'grp2' }, h('h3', {}, 'Studio'), h('div', { class: 'set' }, [
      ['Durata sessione predefinita', 'Esempio · non presente nel prototipo'], ['Promemoria di studio', 'Esempio · non presente nel prototipo']
    ].map(([label, detail]) => h('button', { class: 'sw', type: 'button', onclick: () => note(label + ' · voce d’esempio') }, h('span', { class: 'l' }, label, h('small', {}, detail)), h('span', { class: 'badge ex' }, 'Esempio')))))));
  document.getElementById('appsBtn').addEventListener('click', () => dApps.showModal());
  document.getElementById('setBtn').addEventListener('click', () => dSettings.showModal());

  const scenBar = () => h('details', { class: 'st-scen' }, h('summary', {}, h('span', {}, 'Scenari demo · solo prototipo'), h('b', {}, { normale: 'Con attività', vuoto: 'Senza attività', recupero: 'Con attività spostate' }[scen])),
    h('div', { class: 'st-scen-options', role: 'group', 'aria-label': 'Scegli lo scenario dimostrativo' },
      [['normale', 'Con attività'], ['vuoto', 'Senza attività'], ['recupero', 'Con attività spostate']].map(([k, l]) => h('button', { type: 'button', class: 'st-btn', ...K('sc-' + k), 'aria-pressed': String(scen === k), onclick: () => setScen(k) }, l))));
  function setScen(k) { msgText = ''; clearTimeout(msgTimer); scen = k; day = dayFixture(k); curId = null; resetSess(); last = null; studied = 0; checkedIn = false; view = 'oggi'; render(); }
  const tabs = () => h('nav', { class: 'st-tabs', 'aria-label': 'Sezioni di Studio' }, VIEWS.map(([k, l]) => h('button', { type: 'button', ...K('tab-' + k), ...(view === k ? { 'aria-current': 'page' } : {}), onclick: () => go(k) }, l)));

  /* ---------- Timer simulato ---------- */
  function resetSess() { clearInterval(tickId); tickId = null; sess = { state: 'idle', total: 0, left: 0, elapsed: 0 }; }
  function tick(n = 1) {
    for (let i = 0; i < n; i++) { if (sess.state !== 'running') break; sess.left--; sess.elapsed++; if (sess.left <= 0) { sess.left = 0; sess.state = 'ended'; clearInterval(tickId); tickId = null; render(); note('Tempo scaduto: completa l\'attività o aggiungi 5 minuti.'); return; } }
    paintTimer();
  }
  function paintTimer() { const tm = document.getElementById('tm'), bar = document.getElementById('tbar'); if (tm) tm.textContent = mmss(sess.left); if (bar) bar.style.width = (sess.total ? Math.round((1 - sess.left / sess.total) * 100) : 0) + '%'; }
  function start() {
    const c = cur(); if (!c) return;
    if (sess.state === 'idle') { sess.total = sess.total || c.m * 60; sess.left = sess.left || sess.total; sess.elapsed = 0; }
    sess.state = 'running'; clearInterval(tickId); tickId = setInterval(() => tick(1), 1000); render(); note('Sessione avviata (simulata, non salvata).');
  }
  function pause() { sess.state = 'paused'; clearInterval(tickId); tickId = null; render(); note('Sessione in pausa. Puoi riprendere, regolare il tempo o completare.'); }
  function adj(d) { if (sess.state === 'running') return; const c = cur(); if (!sess.total) { sess.total = c.m * 60; sess.left = sess.total; } sess.left = Math.max(60, sess.left + d * 60); if (d > 0) sess.total = Math.max(sess.total, sess.left); if (sess.state === 'ended') sess.state = 'paused'; render(); note('Tempo regolato a ' + mmss(sess.left) + '.'); }
  function complete() {
    const c = cur(); if (!c) return; const min = Math.round(sess.elapsed / 60); clearInterval(tickId); tickId = null;
    c.done = true; studied += min; last = { title: c.title, subj: c.subj, min }; sess = { state: 'done', total: 0, left: 0, elapsed: 0 }; curId = null; render();
    note(`Attività completata (simulato, non salvata): ${min ? min + ' min registrati' : 'nessun minuto registrato, timer non avviato'}.`);
  }
  function defer(c) {
    if (!c) return; if (c.id === (cur() || {}).id) resetSess();
    day.tasks = day.tasks.filter(x => x !== c); day.recovery.push({ id: 'd' + (++nid), subj: c.subj, title: c.title, movedDate: TODAY, days: 1 }); curId = null; if (sess.state === 'done') sess.state = 'idle'; render(); note('Attività spostata fuori dal piano di oggi (simulato, non salvato).');
  }
  function quickDone(c) { c.done = true; if (sess.state === 'done') sess.state = 'idle'; render(); note('Attività completata (simulato, non salvata).'); }
  function startOther(c) { if (active()) return; curId = c.id; resetSess(); last = null; render(); }
  function startNext() { last = null; resetSess(); render(); start(); }

  /* ---------- Oggi ---------- */
  function hero() {
    const c = cur(), n = day.tasks.length, nx = nextTask();
    const head = (label, cls) => h('div', { class: 'st-hh' }, h('span', { class: 'eyebrow' }, 'Adesso'), h('span', { class: 'st-state ' + (cls || '') }, label));
    const prog = () => { const dn = day.tasks.filter(x => x.done).length, rest = undone().reduce((s, x) => s + x.m, 0), pct = n ? Math.round(dn / n * 100) : 0;
      return h('div', { class: 'st-day' }, h('div', { class: 'st-dl' }, h('b', {}, `${dn} di ${n}`), ' attività fatte · ', h('b', {}, dur(studied)), ' studiati', rest ? ` · restano ${dur(rest)}` : ''), h('div', { class: 'seg', role: 'img', 'aria-label': `${pct} percento delle attività di oggi completato` }, h('i', { style: `width:${pct}%` }))); };
    if (!n) return h('section', { class: 'card st-hero', 'aria-labelledby': 'st-ht' }, head('Nessuna attività'),
      h('div', { class: 'st-empty' }, h('h2', { class: 'st-big', id: 'st-ht' }, 'Nessuna attività di studio per oggi'), h('p', {}, 'Aggiungi le attività della giornata in Missioni o prepara una verifica nel Planner. Le attività spostate dal piano sono elencate sotto.'),
        h('div', { class: 'st-acts' }, h('button', { class: 'st-btn pri', type: 'button', ...K('l-missioni'), onclick: () => nav('missioni', LINKS[0].to) }, 'Organizza la giornata in Missioni →'), h('button', { class: 'st-btn', type: 'button', ...K('l-planner'), onclick: () => nav('planner', LINKS[1].to) }, 'Prepara una verifica nel Planner →'))));
    if (sess.state === 'done' && last) return h('section', { class: 'card st-hero', 'aria-labelledby': 'st-ht' }, head('Completata', 'ok'),
      h('h2', { class: 'st-big', id: 'st-ht' }, '✓ ' + last.title), h('div', { class: 'st-meta' }, pillS(last.subj), h('span', {}, last.min ? `${last.min} min registrati (simulato)` : 'Nessun minuto registrato (timer non avviato)')), prog(),
      c ? h('div', { class: 'st-acts' }, h('button', { class: 'st-btn pri', type: 'button', ...K('startnext'), onclick: startNext }, '▶ Avvia la prossima'), h('button', { class: 'st-btn', type: 'button', ...K('later'), onclick: () => { last = null; sess = { state: 'idle', total: 0, left: 0, elapsed: 0 }; render(); } }, 'Non ora'))
        : h('div', { class: 'st-acts' }, h('button', { class: 'st-btn pri', type: 'button', ...K('checkin2'), disabled: checkedIn, onclick: openCheckin }, checkedIn ? '✓ Check-in fatto' : 'Fai il check-in serale')),
      h('div', { class: 'st-next' }, h('b', {}, 'Prossimo passo'), h('span', {}, c ? `${c.title} · ${c.m} min` : 'Tutte le attività di oggi sono fatte: resta il check-in serale.')));
    if (!c) return h('section', { class: 'card st-hero', 'aria-labelledby': 'st-ht' }, head('Giornata completata', 'ok'), h('h2', { class: 'st-big', id: 'st-ht' }, 'Hai completato tutte le attività di oggi'), prog(),
      h('div', { class: 'st-acts' }, h('button', { class: 'st-btn pri', type: 'button', ...K('checkin2'), disabled: checkedIn, onclick: openCheckin }, checkedIn ? '✓ Check-in fatto' : 'Fai il check-in serale')), h('div', { class: 'st-next' }, h('b', {}, 'Prossimo passo'), h('span', {}, 'Controlla le scadenze qui sotto o le attività spostate.')));
    const st = sess.state, label = { idle: 'Pronta', running: 'In corso', paused: 'In pausa', ended: 'Tempo scaduto' }[st], left = st === 'idle' ? (sess.left || c.m * 60) : sess.left, total = sess.total || c.m * 60, pct = Math.round((1 - left / total) * 100);
    const adjRow = st !== 'running' ? [h('div', { class: 'st-adj', role: 'group', 'aria-label': 'Regola il tempo' }, h('button', { class: 'st-btn', type: 'button', ...K('m5'), 'aria-label': 'Togli 5 minuti', onclick: () => adj(-5), disabled: st === 'ended' }, '−5 min'), h('button', { class: 'st-btn', type: 'button', ...K('p5'), 'aria-label': 'Aggiungi 5 minuti', onclick: () => adj(5) }, '+5 min'))] : [];
    const primary = st === 'running' ? h('button', { class: 'st-btn pri', type: 'button', ...K('pause'), onclick: pause }, '❚❚ Pausa') : st === 'ended' ? h('button', { class: 'st-btn pri', type: 'button', ...K('complete'), onclick: complete }, '✓ Concludi sessione') : h('button', { class: 'st-btn pri', type: 'button', ...K('start'), onclick: start }, st === 'paused' ? '▶ Riprendi' : '▶ Avvia sessione');
    return h('section', { class: 'card st-hero', 'aria-labelledby': 'st-ht' }, head(label, st === 'running' ? 'run' : st === 'idle' ? '' : 'pau'),
      h('h2', { class: 'st-big', id: 'st-ht' }, c.title),
      h('div', { class: 'st-meta' }, pillS(c.subj), h('span', { class: 'st-pill' + (c.priority === 'high' ? ' hi' : c.priority === 'obbl' ? ' ob' : '') }, PRI[c.priority]), h('span', {}, `${c.m} min previsti`)),
      h('div', { class: 'st-timer', role: 'timer', 'aria-label': `Tempo rimasto: ${Math.floor(left / 60)} minuti e ${left % 60} secondi` }, h('span', { id: 'tm' }, mmss(left)), h('small', {}, 'restanti')),
      h('div', { class: 'bar', role: 'img', 'aria-label': 'Avanzamento della sessione' }, h('i', { id: 'tbar', style: `width:${pct}%;background:var(--cyan)` })),
      h('div', { class: 'st-acts' }, primary, st === 'ended' ? null : h('button', { class: 'st-btn', type: 'button', ...K('complete'), onclick: complete }, st === 'idle' ? '✓ Segna completata' : '✓ Concludi e registra'), ...adjRow, h('button', { class: 'st-btn dng', type: 'button', ...K('defer'), onclick: () => defer(c) }, '↻ Sposta da oggi')),
      h('p', { class: 'st-how' }, 'Il timer è facoltativo: puoi segnare l’attività completata anche senza avviare una sessione. Se la sessione è partita, il completamento registra i minuti. “Sposta da oggi” la rimuove dal piano odierno e la aggiunge alle attività spostate.'),
      prog(), h('div', { class: 'st-next' }, h('b', {}, 'Dopo'), h('span', {}, nx ? `${nx.title} · ${nx.m} min` : 'Nessun\'altra attività oggi: resta il check-in serale.')));
  }
  function planCard() {
    const c = cur(), nx = nextTask();
    if (!day.tasks.length) return null;
    return h('section', { class: 'card st-card', 'aria-labelledby': 'st-pl' }, h('div', { class: 'st-hd' }, h('h2', { id: 'st-pl' }, 'Piano di oggi'), h('button', { class: 'st-btn ghost', type: 'button', ...K('l-missioni2'), onclick: () => nav('missioni', LINKS[0].to) }, 'Organizza in Missioni →')),
      h('div', { class: 'st-list' }, day.tasks.map(x => {
        const isCur = c && x.id === c.id, tag = x.done ? h('span', { class: 'st-pill ok' }, '✓ Fatta') : isCur ? h('span', { class: 'st-pill cy' }, active() ? 'In corso' : 'Adesso') : nx && x.id === nx.id ? h('span', { class: 'st-pill' }, 'Prossima') : null;
        return h('div', { class: 'st-row' + (isCur ? ' cur' : '') + (x.done ? ' dn' : ''), style: '--sc:' + sc(x.subj) },
          h('div', { class: 'st-t' }, h('span', { class: 'sr' }, (x.done ? 'Completata. ' : isCur ? 'Adesso. ' : '') ), x.title),
          h('div', { class: 'st-rl' }, pillS(x.subj), h('span', { class: 'st-pill' + (x.priority === 'high' ? ' hi' : '') }, PRI[x.priority]), h('span', { class: 'st-pill' }, x.m + ' min'), tag),
          x.done || isCur ? null : h('div', { class: 'st-ra' }, h('button', { class: 'st-btn', type: 'button', ...K('go' + x.id), disabled: active(), title: active() ? 'Metti in pausa o completa la sessione in corso' : '', onclick: () => startOther(x) }, '▶ Avvia questa'), h('button', { class: 'st-btn', type: 'button', ...K('ok' + x.id), onclick: () => quickDone(x) }, '✓ Fatta'), h('button', { class: 'st-btn ghost', type: 'button', ...K('df' + x.id), onclick: () => defer(x) }, '↻ Rimanda')));
      })));
  }
  function recoveryCard() {
    const rec = day.recovery, ob = rec.filter(r => r.days >= 2); if (!rec.length) return null; const isOpen = recOpen ?? ob.length > 0;
    return h('details', { class: 'card st-card st-details', ...(isOpen ? { open: '' } : {}), ontoggle: e => { recOpen = e.target.open; } }, h('summary', {}, `Attività spostate (${rec.length})`, ob.length ? h('span', { class: 'st-pill ob' }, `⚠ ${ob.length} urgenti`) : null),
      ob.length ? h('p', { class: 'st-warn', role: 'status', style: 'margin-bottom:10px' }, `⚠ ${ob.length} ${ob.length === 1 ? 'attività ancora in attesa' : 'attività ancora in attesa'}: spostate da almeno 2 giorni.`) : null,
      h('div', { class: 'st-list' }, rec.map(r => h('div', { class: 'st-row', style: '--sc:' + sc(r.subj) }, h('div', { class: 'st-t' }, r.title), h('div', { class: 'st-rl' }, pillS(r.subj), h('span', { class: 'st-pill' + (r.days >= 2 ? ' ob' : '') }, r.days >= 2 ? 'In attesa' : 'Spostata'), h('span', { class: 'st-s' }, 'dal ' + fmtShort(r.movedDate) + (r.moved ? ' · +' + r.moved + ' gg' : ''))),
        h('div', { class: 'st-ra' }, h('button', { class: 'st-btn', type: 'button', ...K('rd' + r.id), onclick: () => { day.recovery = day.recovery.filter(x => x !== r); render(); note('Attività completata (simulato, non salvato).'); } }, '✓ Fatta'), h('button', { class: 'st-btn ghost', type: 'button', ...K('rp' + r.id), onclick: () => { r.moved = (r.moved || 0) + 1; render(); note('Attività ripianificata di un giorno (simulato, non salvato).'); } }, 'Rimanda di un giorno'))))),
      h('p', { class: 'hint' }, 'Sono attività di studio spostate dal piano di oggi. In Recovery puoi analizzare il motivo e il suggerimento.'));
  }
  const dueLabel = (d, past = 'scaduto') => d < 0 ? past : d === 0 ? 'oggi' : d === 1 ? 'domani' : 'tra ' + d + ' gg';
  function deadlinesCard() {
    const items = [...compiti.filter(c => !c.done && daysUntil(c.date) >= 0 && daysUntil(c.date) <= 2).map(c => ({ date: c.date, title: c.titolo, subj: c.subj, kind: TIPO[c.tipo], to: 'compiti', k: c.id })), ...ver.filter(v => daysUntil(v.date) >= 0 && daysUntil(v.date) <= 4).map(v => ({ date: v.date, title: (v.tipo === 'v' ? 'Verifica' : 'Interrogazione') + ' di ' + v.subj, subj: v.subj, kind: 'Verifica', to: 'verifiche', k: v.id }))].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
    if (!items.length) return null;
    return h('section', { class: 'card st-card', 'aria-labelledby': 'st-dd' }, h('h2', { id: 'st-dd' }, 'In scadenza'), h('div', { class: 'st-list' }, items.map(i => h('button', { type: 'button', class: 'st-lnk', ...K('due' + i.k), 'aria-label': `${i.title}, ${i.kind}, ${dueLabel(daysUntil(i.date))}. Apri ${i.to}`, onclick: () => go(i.to) },
      h('span', {}, h('b', {}, i.title), h('small', {}, `${i.kind} · ${i.subj}`)), h('span', { class: 'st-pill' + (daysUntil(i.date) <= 1 ? ' hi' : '') }, dueLabel(daysUntil(i.date)))))));
  }
  function streakCard() {
    const dn = ['mar', 'mer', 'gio', 'ven', 'sab', 'dom', 'lun'], nums = [27, 28, 29, 30, 31, 1, 2], ok = [...streak, checkedIn];
    return h('section', { class: 'card st-card st-streak', 'aria-label': 'Serie di studio' }, h('div', {}, h('h2', {}, 'Serie degli ultimi 7 giorni'), h('div', { class: 'st-sd' }, dn.map((d, i) => h('i', { class: (ok[i] ? 'ok' : '') + (i === 6 ? ' td' : ''), 'aria-label': `${d} ${nums[i]}: ${ok[i] ? 'studio registrato' : 'nessun check-in'}` }, d, h('br'), nums[i])))),
      h('button', { class: 'st-btn', type: 'button', ...K('checkin'), disabled: checkedIn, onclick: openCheckin }, checkedIn ? '✓ Check-in fatto' : 'Check-in serale'));
  }
  function linksCard() {
    return h('section', { class: 'card st-card', 'aria-labelledby': 'st-lk' }, h('h2', { id: 'st-lk' }, 'Fuori da Studio'), h('p', { class: 'hint', style: 'margin:-4px 0 10px' }, 'Questi strumenti hanno una pagina propria: qui c\'è solo il collegamento.'),
      h('div', { class: 'st-list st-quick-links' }, LINKS.map(l => h('button', { type: 'button', class: 'st-lnk', ...K('lk-' + l.id), onclick: () => l.internal ? go('know') : nav(l.id, l.to) }, h('span', {}, h('b', {}, l.name), h('small', {}, l.what)), h('span', { class: 'go' }, l.internal ? 'Apri qui →' : 'Apri →')))));
  }
  function oggi() {
    const left = [planCard(), streakCard()].filter(Boolean), right = [deadlinesCard(), recoveryCard()].filter(Boolean);
    return [hero(), h('div', { class: 'st-cols' }, h('div', { class: 'st-sec' }, left), h('div', { class: 'st-sec' }, right)), linksCard()].filter(Boolean);
  }
  function openCheckin() { dialog('Check-in serale', h('div', { class: 'st-form' }, h('p', {}, 'Hai completato il minimo di studio oggi?'), h('div', { class: 'st-fa' }, h('button', { class: 'st-btn pri', type: 'button', onclick: () => { checkedIn = true; closeDlg(); render(); note('Check-in registrato (simulato, non salvato).'); } }, '✓ Sì, fatto'), h('button', { class: 'st-btn', type: 'button', onclick: closeDlg }, 'Non ora')))); }

  /* ---------- Finestre ---------- */
  function dialog(title, body, k) { lastK = k || document.activeElement?.dataset?.k || null; document.getElementById('dlg-t').textContent = title; document.getElementById('dlg-b').replaceChildren(h('p', { class: 'st-sim' }, 'Simulazione · nessun salvataggio'), body); if (!dlg.open) dlg.showModal(); }
  function closeDlg() { if (dlg.open) dlg.close(); }
  document.getElementById('dlg-x').onclick = closeDlg;
  dlg.addEventListener('close', () => { if (lastK) document.querySelector(`[data-k="${lastK}"]`)?.focus({ preventScroll: true }); });
  dlg.addEventListener('click', e => { if (e.target === dlg) closeDlg(); });
  function openForm(title, fields, label, onSubmit) {
    const err = h('p', { class: 'st-err', role: 'alert' });
    const field = f => { const base = { id: f.id, name: f.id, ...(f.value != null ? { value: f.value } : {}) };
      const el = f.type === 'select' ? h('select', base, f.options.map(([v, l]) => h('option', { value: v, ...(String(f.value) === String(v) ? { selected: '' } : {}) }, l))) : f.type === 'textarea' ? h('textarea', { ...base, rows: 4, placeholder: f.placeholder || '' }, f.value || '') : h('input', { ...base, type: f.type || 'text', ...(f.step ? { step: f.step, inputmode: 'decimal' } : {}), placeholder: f.placeholder || '' });
      return h('label', { class: 'st-f', for: f.id }, h('span', {}, f.label + (f.required ? ' *' : '')), el); };
    const form = h('form', { class: 'st-form', novalidate: '' }, fields.map(field), err, h('div', { class: 'st-fa' }, h('button', { class: 'st-btn pri', type: 'submit' }, label), h('button', { class: 'st-btn', type: 'button', onclick: closeDlg }, 'Annulla')));
    form.onsubmit = e => { e.preventDefault(); const v = {}; for (const f of fields) { v[f.id] = form.elements[f.id].value.trim(); if (f.required && !v[f.id]) { err.textContent = f.label + ': campo obbligatorio.'; form.elements[f.id].focus(); return; }
        if (f.type === 'date' && v[f.id] && !validDate(v[f.id])) { err.textContent = f.label + ': data non valida.'; form.elements[f.id].focus(); return; }
        if (f.type === 'number') { const n = Number(v[f.id].replace(',', '.')); if (!Number.isFinite(n) || n < f.min || n > f.max) { err.textContent = `${f.label}: inserisci un numero da ${f.min} a ${f.max}.`; form.elements[f.id].focus(); return; } v[f.id] = n; } }
      onSubmit(v); closeDlg(); };
    dialog(title, form); setTimeout(() => form.elements[fields[0].id]?.focus(), 0);
  }
  const subjOpts = SUBJECTS.map(s => [s, s]);
  const delAsk = (id, what, onYes) => h('div', { class: 'st-ask', role: 'alertdialog', 'aria-label': 'Conferma eliminazione' }, h('span', {}, `Eliminare ${what}?`), h('button', { class: 'st-btn dng', type: 'button', ...K('dy' + id), onclick: () => { onYes(); askDel = null; render(); note('Eliminazione confermata (simulata, non salvata).'); } }, 'Elimina'), h('button', { class: 'st-btn', type: 'button', ...K('dn' + id), onclick: () => { askDel = null; render(); } }, 'Annulla'));

  /* ---------- Compiti ---------- */
  function taskRow(c, muted) {
    const d = daysUntil(c.date), urg = !c.done && d >= 0 && d <= 1, late = !c.done && d < 0;
    return h('div', { class: 'st-row' + (muted ? ' dn' : ''), style: '--sc:var(--border2)' }, h('div', { class: 'st-chk' },
      h('button', { type: 'button', ...K('ck' + c.id), 'aria-pressed': String(c.done), 'aria-label': (c.done ? 'Riapri compito: ' : 'Completa compito: ') + c.titolo, onclick: () => { c.done = !c.done; render(); note(c.done ? 'Compito completato (simulato, non salvato).' : 'Compito riaperto (simulato).'); } }, c.done ? '✓' : ''),
      h('div', { style: 'min-width:0' }, h('div', { class: 'st-t' }, c.titolo), h('div', { class: 'st-rl', style: 'margin-top:4px' }, h('span', { class: 'st-pill' }, TIPO[c.tipo]), pillS(c.subj), h('span', { class: 'st-pill' + (urg ? ' hi' : late ? ' ob' : '') }, c.done ? fmtShort(c.date) : late ? 'scaduto' : d === 0 ? 'oggi' : d === 1 ? 'domani' : fmtShort(c.date))), c.note ? h('div', { class: 'st-s', style: 'margin-top:4px' }, c.note) : null),
      h('button', { type: 'button', class: 'st-x', ...K('del' + c.id), 'aria-label': 'Elimina compito: ' + c.titolo, onclick: () => { askDel = c.id; render(); } }, '✕')),
      askDel === c.id ? delAsk(c.id, 'il compito', () => { compiti = compiti.filter(x => x !== c); }) : null);
  }
  function viewCompiti() {
    const pend = compiti.filter(c => !c.done).sort((a, b) => a.date.localeCompare(b.date)), dn = compiti.filter(c => c.done);
    return [h('section', { class: 'card st-card', 'aria-labelledby': 'st-ct' }, h('div', { class: 'st-hd', style: 'margin-bottom:10px' }, h('div', {}, h('h2', { id: 'st-ct', style: 'margin:0' }, 'Compiti e scadenze'), h('p', { class: 'hint' }, `${pend.length} in sospeso`)), h('button', { class: 'st-btn pri', type: 'button', ...K('newc'), onclick: newCompito }, '+ Nuovo compito')),
      pend.length ? h('div', { class: 'st-list' }, pend.map(c => taskRow(c))) : h('p', { class: 'hint' }, 'Nessun compito in sospeso.')),
      dn.length ? h('details', { class: 'card st-card st-details', ...(openCompleted ? { open: '' } : {}), ontoggle: e => { openCompleted = e.target.open; } }, h('summary', {}, `Completati (${dn.length})`), h('div', { class: 'st-list' }, dn.map(c => taskRow(c, true)))) : null].filter(Boolean);
  }
  function newCompito() { openForm('Nuovo compito', [{ id: 'titolo', label: 'Titolo', required: true, placeholder: 'Descrizione del compito' }, { id: 'subj', label: 'Materia', type: 'select', options: subjOpts }, { id: 'tipo', label: 'Tipo', type: 'select', options: Object.entries(TIPO) }, { id: 'date', label: 'Scadenza', type: 'date', value: TODAY, required: true }, { id: 'note', label: 'Note', type: 'textarea' }], 'Aggiungi compito',
    v => { compiti.push({ id: 'c' + (++nid), subj: v.subj, titolo: v.titolo, tipo: v.tipo, date: v.date, note: v.note, done: false }); render(); note('Compito aggiunto (simulato, non salvato).'); }); }

  /* ---------- Verifiche ---------- */
  function viewVerifiche() {
    const list = [...ver].sort((a, b) => a.date.localeCompare(b.date));
    return [h('section', { class: 'card st-card', 'aria-labelledby': 'st-vt' },
      h('div', { class: 'st-hd', style: 'margin-bottom:10px' },
        h('div', {},
          h('h2', { id: 'st-vt', style: 'margin:0' }, 'Verifiche e interrogazioni'),
          h('p', { class: 'hint' }, 'Elenco consultivo. Per aggiungere, modificare o preparare una verifica, usa il Planner.')),
        h('button', { class: 'st-btn pri', type: 'button', ...K('open-planner'), onclick: () => nav('planner', '/studio-planner.html') }, 'Gestisci nel Planner →')),
      list.length ? h('div', { class: 'st-list' }, list.map(v => {
        const d = daysUntil(v.date), dc = d < 0 ? '' : d === 0 ? ' urg' : d <= 2 ? ' soon' : '';
        return h('div', { class: 'st-row', style: '--sc:' + sc(v.subj) },
          h('div', { class: 'st-ver' },
            h('div', { class: 'st-dbox' + dc, 'aria-hidden': 'true' }, parse(v.date).getDate(), h('small', {}, parse(v.date).toLocaleDateString('it-IT', { month: 'short' }))),
            h('div', {},
              h('div', { class: 'st-t' }, v.subj),
              h('div', { class: 'st-rl', style: 'margin:4px 0' },
                h('span', { class: 'st-pill' }, v.tipo === 'v' ? 'Verifica' : 'Interrogazione'),
                h('span', { class: 'st-pill' + (d >= 0 && d <= 2 ? ' hi' : '') }, d < 0 ? 'passata' : d === 0 ? 'oggi' : d === 1 ? 'domani' : 'tra ' + d + ' gg'),
                h('span', { class: 'sr' }, fmtFull(v.date))),
              v.note ? h('div', { class: 'st-s' }, v.note) : null)),
          h('div', { class: 'st-ra' },
            h('button', { class: 'st-btn', type: 'button', ...K('pl' + v.id), 'aria-label': 'Apri verifica e piano nel Planner: ' + v.subj, onclick: () => nav('planner', '/studio-planner.html?exam=' + v.id) }, 'Apri nel Planner →')));
      })) : h('p', { class: 'hint' }, 'Nessuna verifica programmata.'))];
  }

  /* ---------- Voti ---------- */
  const vcls = v => v >= 7 ? 'top' : v >= 5.5 ? 'mid' : 'low';
  const groupsOf = () => SUBJECTS.map(s => ({ subj: s, list: voti.filter(g => g.subj === s).sort((a, b) => a.date.localeCompare(b.date)) })).filter(g => g.list.length);
  const mean = a => a.reduce((s, x) => s + x.voto, 0) / a.length;
  function viewVoti() {
    const gr = groupsOf(); if (votiFilter !== 'all' && !gr.some(g => g.subj === votiFilter)) votiFilter = 'all';
    let body;
    if (votiTab === 'lista') {
      const list = voti.filter(g => votiFilter === 'all' || g.subj === votiFilter).sort((a, b) => b.date.localeCompare(a.date));
      body = [h('div', { class: 'st-chips', role: 'group', 'aria-label': 'Filtra per materia' }, [['all', 'Tutti'], ...gr.map(g => [g.subj, g.subj])].map(([k, l]) => h('button', { type: 'button', ...K('vf' + k), 'aria-pressed': String(votiFilter === k), onclick: () => { votiFilter = k; render(); } }, l))),
        list.length ? h('div', { class: 'st-list' }, list.map(g => h('div', { style: 'display:grid;gap:6px' }, h('div', { class: 'st-g' }, h('div', { class: 'st-gn ' + vcls(g.voto), 'aria-label': 'Voto ' + g.voto }, String(g.voto)), h('div', { style: 'min-width:0' }, h('div', { class: 'st-t' }, g.subj), h('div', { class: 'st-s' }, `${KIND[g.tipo]} · ${fmtFull(g.date)}${g.arg ? ' · ' + g.arg : ''}`)),
          h('button', { type: 'button', class: 'st-x', ...K('delg' + g.id), 'aria-label': `Elimina voto ${g.voto} di ${g.subj}`, onclick: () => { askDel = g.id; render(); } }, '✕')), askDel === g.id ? delAsk(g.id, 'il voto', () => { voti = voti.filter(x => x !== g); }) : null))) : h('p', { class: 'hint' }, 'Nessun voto in questa lista.')];
    } else if (votiTab === 'medie') {
      body = voti.length ? [h('div', { class: 'st-mean' }, h('small', {}, 'Media dei voti registrati'), h('b', {}, mean(voti).toFixed(2)), h('small', { style: 'letter-spacing:0;text-transform:none;font-family:var(--sans)' }, `Media aritmetica dei ${voti.length} voti, stesso peso per ciascuno.`)),
        h('div', { class: 'st-list' }, [...gr].sort((a, b) => mean(b.list) - mean(a.list)).map(g => h('div', { class: 'st-mr' }, h('span', {}, g.subj), h('div', { class: 'bar' }, h('i', { style: `width:${mean(g.list) * 10}%;background:${sc(g.subj)}` })), h('span', {}, mean(g.list).toFixed(2) + ' ', h('small', { class: 'st-s' }, '(' + g.list.length + ')')))))] : [h('p', { class: 'hint' }, 'Nessun voto registrato.')];
    } else {
      if (!gr.some(g => g.subj === grafSubj)) grafSubj = gr[0]?.subj;
      const g = gr.find(x => x.subj === grafSubj);
      body = g ? [h('div', { class: 'st-chips', role: 'group', 'aria-label': 'Materia del grafico' }, gr.map(x => h('button', { type: 'button', ...K('gs' + x.subj), 'aria-pressed': String(x.subj === grafSubj), onclick: () => { grafSubj = x.subj; render(); } }, x.subj))), chart(g)] : [h('p', { class: 'hint' }, 'Nessun voto utilizzabile per il grafico.')];
    }
    return [h('section', { class: 'card st-card', 'aria-labelledby': 'st-gt' }, h('div', { class: 'st-hd', style: 'margin-bottom:10px' }, h('div', {}, h('h2', { id: 'st-gt', style: 'margin:0' }, 'Voti'), h('p', { class: 'hint' }, 'Andamento e medie dei voti registrati.')), h('button', { class: 'st-btn pri', type: 'button', ...K('newg'), onclick: newVoto }, '+ Registra voto')),
      h('div', { class: 'st-seg', role: 'group', 'aria-label': 'Vista dei voti', style: 'margin-bottom:10px' }, [['lista', 'Lista'], ['medie', 'Medie'], ['grafico', 'Grafico']].map(([k, l]) => h('button', { type: 'button', ...K('vt' + k), 'aria-pressed': String(votiTab === k), onclick: () => { votiTab = k; askDel = null; render(); } }, l))),
      h('div', { class: 'st-sec' }, body))];
  }
  function chart(g) {
    const W = 340, H = 180, L = 26, R = 10, T = 10, B = 28, w = W - L - R, hh = H - T - B, pts = g.list, ms = pts.map(p => parse(p.date).getTime()), a = ms[0], z = ms[ms.length - 1];
    const x = i => a === z ? L + w / 2 : L + (ms[i] - a) / (z - a) * w, y = v => T + hh - v / 10 * hh, avg = mean(pts);
    const s = el => document.createElementNS('http://www.w3.org/2000/svg', el), svg = s('svg'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('class', 'st-chart'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', `${g.subj}: ${pts.length} voti con data, scala da 0 a 10, media ${avg.toFixed(2)}`);
    const add = (tag, at, txt) => { const e = s(tag); for (const [k, v] of Object.entries(at)) e.setAttribute(k, v); if (txt != null) e.textContent = txt; svg.append(e); return e; };
    for (let v = 0; v <= 10; v += 2) { add('line', { x1: L, y1: y(v), x2: W - R, y2: y(v), stroke: '#1a2a38' }); add('text', { x: L - 4, y: y(v) + 4, 'text-anchor': 'end', 'font-size': 9, fill: '#94a3b8' }, v); }
    add('line', { x1: L, y1: y(avg), x2: W - R, y2: y(avg), stroke: '#fbbf24', 'stroke-dasharray': '4 3' });
    if (pts.length > 1) add('polyline', { points: pts.map((p, i) => x(i).toFixed(1) + ',' + y(p.voto).toFixed(1)).join(' '), fill: 'none', stroke: '#00e5ff', 'stroke-width': 2 });
    pts.forEach((p, i) => { add('circle', { cx: x(i).toFixed(1), cy: y(p.voto).toFixed(1), r: 5, fill: '#4f8cff' }); add('text', { x: x(i).toFixed(1), y: H - 10, 'text-anchor': i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'middle', 'font-size': 9, fill: '#94a3b8' }, fmtShort(p.date)); });
    const trend = pts.length > 1 ? (pts[pts.length - 1].voto > pts[0].voto ? 'In crescita rispetto al primo voto.' : pts[pts.length - 1].voto < pts[0].voto ? 'In calo rispetto al primo voto.' : 'Stabile rispetto al primo voto.') : 'Un solo voto: nessun andamento.';
    return h('div', { class: 'st-sec' }, h('p', { class: 'st-s' }, `${trend} Media dei ${pts.length} voti: ${avg.toFixed(2)}. Distanza orizzontale proporzionale alle date.`), svg,
      h('ol', { class: 'st-s', style: 'margin:0;padding-left:18px' }, pts.map(p => h('li', {}, `${fmtFull(p.date)} · ${p.voto} · ${KIND[p.tipo]}${p.arg ? ' · ' + p.arg : ''}`))));
  }
  function newVoto() { openForm('Registra voto', [{ id: 'subj', label: 'Materia', type: 'select', options: subjOpts }, { id: 'voto', label: 'Voto (0–10)', type: 'number', min: 0, max: 10, step: '0.5', required: true, placeholder: 'es. 7.5' }, { id: 'tipo', label: 'Tipo', type: 'select', options: Object.entries(KIND) }, { id: 'date', label: 'Data', type: 'date', value: TODAY, required: true }, { id: 'arg', label: 'Argomento', placeholder: 'es. Integrali' }], 'Registra voto',
    v => { voti.push({ id: 'g' + (++nid), subj: v.subj, voto: v.voto, tipo: v.tipo, date: v.date, arg: v.arg }); render(); note('Voto registrato (simulato, non salvato).'); }); }

  /* ---------- Note ---------- */
  function analysisOf(n) {
    const sentences = n.text.split(/(?<=[.!?])\s+/).filter(Boolean);
    return { riscrivi: 'Versione riordinata (simulata): ' + sentences.join(' ') , consigli: ['Riscrivi il concetto principale con parole tue.', 'Aggiungi un esempio svolto.', 'Segna i punti da chiedere in classe.'], flash: [{ q: `Qual è l'idea centrale degli appunti di ${n.subj}?`, a: sentences[0] }, { q: 'Quale punto resta da ripassare?', a: sentences[sentences.length - 1] }], mappa: { root: n.subj, kids: sentences.slice(0, 3) } };
  }
  function aiPanel(n) {
    const u = noteUi[n.id]; if (!u) return null;
    if (u.step === 'consent') return h('div', { class: 'st-ai', role: 'group', 'aria-label': 'Consenso per l\'analisi AI' }, h('p', {}, 'Nel prodotto questa nota verrebbe inviata al provider solo dopo il tuo consenso esplicito, mostrando prima cosa parte. In questo prototipo non viene inviato nulla.'), h('div', { class: 'st-ra' }, h('button', { class: 'st-btn pri', type: 'button', ...K('aiok' + n.id), onclick: () => { u.step = 'loading'; render(); setTimeout(() => { if (noteUi[n.id]) { u.step = 'result'; u.tab = 'riscrivi'; u.fc = 0; u.flip = false; render(); note('Analisi simulata pronta: nessun invio a provider.'); } }, 900); } }, 'Consenti e simula l\'analisi'), h('button', { class: 'st-btn', type: 'button', ...K('aino' + n.id), onclick: () => { delete noteUi[n.id]; render(); } }, 'Annulla')));
    if (u.step === 'loading') return h('div', { class: 'st-ai', role: 'status' }, 'Analisi degli appunti in corso (simulata)…');
    const r = analysisOf(n);
    const content = u.tab === 'riscrivi' ? h('p', {}, r.riscrivi) : u.tab === 'consigli' ? h('ul', {}, r.consigli.map(c => h('li', {}, c))) : u.tab === 'flash' ? h('div', { style: 'display:grid;gap:8px' }, h('div', { class: 'st-fb' }, h('b', {}, `Carta ${u.fc + 1} di ${r.flash.length}`), h('p', {}, u.flip ? r.flash[u.fc].a : r.flash[u.fc].q)), h('div', { class: 'st-ra' }, h('button', { class: 'st-btn', type: 'button', ...K('fl' + n.id), onclick: () => { u.flip = !u.flip; render(); } }, u.flip ? 'Mostra domanda' : 'Mostra risposta'), h('button', { class: 'st-btn', type: 'button', ...K('fn' + n.id), onclick: () => { u.fc = (u.fc + 1) % r.flash.length; u.flip = false; render(); } }, 'Carta successiva')))
      : h('ul', {}, h('li', {}, h('b', {}, r.mappa.root), h('ul', {}, r.mappa.kids.map(k => h('li', {}, k)))));
    return h('div', { class: 'st-ai' }, h('div', { class: 'st-hh' }, h('span', { class: 'eyebrow' }, 'Analisi AI · simulata'), h('button', { class: 'st-btn ghost', type: 'button', ...K('aix' + n.id), onclick: () => { delete noteUi[n.id]; render(); } }, 'Chiudi')),
      h('div', { class: 'st-tabs2', role: 'group', 'aria-label': 'Parti dell\'analisi' }, [['riscrivi', 'Riscritta'], ['consigli', 'Consigli'], ['flash', 'Flashcard'], ['mappa', 'Mappa']].map(([k, l]) => h('button', { type: 'button', ...K('at' + k + n.id), 'aria-pressed': String(u.tab === k), onclick: () => { u.tab = k; render(); } }, l))), content);
  }
  function viewNote() {
    const subs = [...new Set(notes.map(n => n.subj))], list = notes.filter(n => notesFilter === 'all' || n.subj === notesFilter).sort((a, b) => b.date.localeCompare(a.date));
    return [h('section', { class: 'card st-card', 'aria-labelledby': 'st-nt' }, h('div', { class: 'st-hd', style: 'margin-bottom:10px' }, h('div', {}, h('h2', { id: 'st-nt', style: 'margin:0' }, 'Note di studio'), h('p', { class: 'hint' }, 'Scrivi in modo grezzo, poi chiedi un\'analisi simulata.')), h('button', { class: 'st-btn pri', type: 'button', ...K('newn'), onclick: () => editNote(null) }, '+ Nuova nota')),
      h('div', { class: 'st-chips', role: 'group', 'aria-label': 'Filtra per materia', style: 'margin-bottom:10px' }, [['all', 'Tutte'], ...subs.map(s => [s, s])].map(([k, l]) => h('button', { type: 'button', ...K('nf' + k), 'aria-pressed': String(notesFilter === k), onclick: () => { notesFilter = k; render(); } }, l))),
      list.length ? h('div', { class: 'st-list' }, list.map(n => h('div', { class: 'st-note' }, h('div', { class: 'st-rl' }, pillS(n.subj), h('span', { class: 'st-s' }, fmtShort(n.date))), h('p', {}, n.text),
        h('div', { class: 'st-ra' }, h('button', { class: 'st-btn', type: 'button', ...K('ai' + n.id), 'aria-expanded': String(!!noteUi[n.id]), onclick: () => { if (noteUi[n.id]) delete noteUi[n.id]; else noteUi[n.id] = { step: 'consent' }; render(); } }, '✦ Analizza con AI'), h('button', { class: 'st-btn ghost', type: 'button', ...K('en' + n.id), 'aria-label': 'Modifica nota di ' + n.subj, onclick: () => editNote(n) }, '✎ Modifica'), h('button', { class: 'st-btn ghost', type: 'button', ...K('dn2' + n.id), 'aria-label': 'Elimina nota di ' + n.subj, onclick: () => { askDel = n.id; render(); } }, '✕ Elimina')),
        askDel === n.id ? delAsk(n.id, 'la nota', () => { notes = notes.filter(x => x !== n); delete noteUi[n.id]; }) : null, aiPanel(n)))) : h('p', { class: 'hint' }, 'Nessuna nota.'))];
  }
  function editNote(n) { openForm(n ? 'Modifica nota' : 'Nuova nota', [{ id: 'subj', label: 'Materia', type: 'select', options: subjOpts, value: n ? n.subj : SUBJECTS[0] }, { id: 'text', label: 'Appunti', type: 'textarea', required: true, value: n ? n.text : '', placeholder: 'Scrivi qui, anche in modo grezzo' }], n ? 'Salva modifiche' : 'Salva nota',
    v => { if (n) { n.subj = v.subj; n.text = v.text; } else notes.push({ id: 'n' + (++nid), subj: v.subj, date: TODAY, text: v.text }); render(); note((n ? 'Nota modificata' : 'Nota salvata') + ' (simulato, non salvato).'); }); }

  /* ---------- Metodo ---------- */
  const COACH = { default: 'Parti dall\'argomento più debole, studia 25 minuti e poi spiegalo a voce alta senza appunti. Se un punto non torna, segnalo e ripartiamo da lì.' };
  function openCoach(subj) {
    const msgs = [{ me: false, t: `Sono il coach di ${subj} (simulato). Come posso aiutarti?` }], log = h('div', { class: 'st-log', role: 'log', 'aria-live': 'polite', 'aria-label': 'Conversazione' }), input = h('input', { type: 'text', class: 'st-in', 'aria-label': 'Scrivi al coach', placeholder: 'Scrivi una domanda…', style: 'width:100%;min-height:44px;background:var(--bg);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:0 12px;font:15px var(--sans)' });
    const paint = () => log.replaceChildren(...msgs.map(m => h('div', { class: 'st-msg' + (m.me ? ' me' : '') }, (m.me ? 'Tu: ' : 'Coach: ') + m.t)));
    const send = q => { q = (q || input.value).trim(); if (!q) return; msgs.push({ me: true, t: q }); input.value = ''; paint(); setTimeout(() => { msgs.push({ me: false, t: COACH.default + ' (risposta simulata)' }); paint(); log.scrollTop = log.scrollHeight; }, 500); };
    paint(); dialog('Coach · ' + subj, h('div', { class: 'st-form' }, log, h('div', { class: 'st-chips' }, ['Come mi preparo alla verifica?', 'Spiegami l\'argomento in breve'].map(q => h('button', { type: 'button', onclick: () => send(q) }, q))),
      h('form', { class: 'st-fa', onsubmit: e => { e.preventDefault(); send(); } }, h('div', { style: 'flex:1 1 200px;min-width:0' }, input), h('button', { class: 'st-btn pri', type: 'submit' }, 'Invia'))));
    setTimeout(() => input.focus(), 0);
  }
  function runMetodo() {
    met = { loading: true, html: met.html, error: 'Analisi in corso (simulata). La proposta precedente resta consultabile.' }; render();
    metTimer = setTimeout(() => { met = { loading: false, error: 'Proposta consultiva basata sulle registrazioni disponibili; non modifica le attività.', html: true }; render(); note('Analisi del metodo simulata pronta.'); }, 1400);
  }
  function viewMetodo() {
    return [h('section', { class: 'card st-card', 'aria-labelledby': 'st-mt' }, h('h2', { id: 'st-mt' }, 'Coach materie'), h('div', { class: 'st-chips' }, SUBJECTS.map(s => h('button', { type: 'button', ...K('co' + s), onclick: () => openCoach(s) }, '✦ ' + s)))),
      h('section', { class: 'card st-card st-sec', 'aria-labelledby': 'st-an' }, h('h2', { id: 'st-an', style: 'margin:0' }, 'Analisi del metodo'), h('p', { class: 'hint' }, 'Una proposta consultiva dalle registrazioni di studio. Nel prodotto richiede un provider; qui è simulata.'),
        h('div', { class: 'st-acts' }, h('button', { class: 'st-btn pri', type: 'button', ...K('runm'), disabled: met.loading, onclick: runMetodo }, met.loading ? 'Analisi in corso…' : '🧠 Analizza il mio metodo di studio'), met.loading ? h('button', { class: 'st-btn', type: 'button', ...K('stopm'), onclick: () => { clearTimeout(metTimer); met = { loading: false, html: met.html, error: 'Analisi annullata. La proposta precedente è conservata.' }; render(); } }, 'Interrompi analisi') : null),
        h('p', { role: 'status', class: 'st-s' }, met.error),
        met.html ? h('div', { class: 'st-ai' }, h('b', {}, '✦ Proposta di metodo (simulata)'), h('ul', {}, ['Studi più a lungo nei giorni con una verifica vicina: aggiungi una sessione breve il giorno prima.', 'Fisica ha il voto medio più basso (5,75): prova esercizi guidati prima di quelli liberi.', 'Le sessioni di 25 minuti con pausa funzionano: ne hai completate più nei giorni con il check-in.'].map(x => h('li', {}, x))), h('p', { class: 'st-s' }, 'Esempio sintetico: non diagnostica le capacità e non cambia le attività.')) : null),
      h('section', { class: 'card st-card', 'aria-labelledby': 'st-kn' }, h('h2', { id: 'st-kn' }, 'KnowStudy'), h('p', { class: 'hint', style: 'margin:-4px 0 10px' }, 'Flashcard AI, quiz, domande aperte e schemi dai tuoi appunti.'), h('button', { class: 'st-btn', type: 'button', ...K('toknow'), onclick: () => go('know') }, '⊞ Apri KnowStudy →'))];
  }

  /* ---------- KnowStudy ---------- */
  const MODES = [['flash', 'Crea flashcard', 'Genera carte da note o testo; il ripasso è nel modulo Flashcard'], ['quiz', 'Quiz', 'Risposta libera con valutazione AI'], ['open', 'Domande aperte', 'Simula un\'interrogazione'], ['schema', 'Schema', 'Mappa e riassunto']];
  const bank = (mode, topic) => mode === 'flash' ? [{ q: `Definisci: ${topic}`, a: `Definizione di esempio per «${topic}» (sintetica).` }, { q: `Un esempio di ${topic}?`, a: 'Esempio svolto sintetico.' }, { q: `Errore frequente su ${topic}?`, a: 'Confondere la regola con il suo caso particolare.' }]
    : mode === 'schema' ? [{ outline: [`${topic}`, 'Definizione', 'Regole principali', 'Esempio svolto', 'Errori frequenti'] }] : [{ q: `Spiega ${topic} con parole tue.` }, { q: `Quando si applica ${topic}, e quando no?` }];
  function viewKnow() {
    const body = know.phase === 'menu' ? knowMenu() : know.phase === 'setup' ? knowSetup() : know.phase === 'preview' ? knowPreview() : know.phase === 'added' ? knowAdded() : know.phase === 'play' ? knowPlay() : knowResult();
    return [h('section', { class: 'card st-card st-sec', 'aria-labelledby': 'st-kt' }, h('div', { class: 'st-hd' }, h('h2', { id: 'st-kt' }, 'KnowStudy'), know.phase !== 'menu' ? h('button', { class: 'st-btn ghost', type: 'button', ...K('kback'), onclick: () => { clearTimeout(knowTimer); know = { ...know, phase: 'menu', loading: false, fb: null }; render(); } }, '← Menu') : null), body)];
  }
  function knowMenu() {
    return h('div', { class: 'st-sec' }, h('p', { class: 'hint' }, 'Crea materiali dai tuoi appunti o studia con quiz e domande. Il ripasso a intervalli e la gestione del mazzo stanno in Flashcard. Tutto è simulato: nessun testo parte verso un provider.'), h('div', { class: 'st-modes' }, MODES.map(([k, n, d]) => h('button', { type: 'button', class: 'st-mode', ...K('mode' + k), onclick: () => { know = { ...know, phase: 'setup', mode: k, topic: '' }; render(); } }, h('b', {}, n), h('small', {}, d)))),
      h('h3', { class: 'sub' }, 'Crea flashcard dalle tue note'), h('div', { class: 'st-list' }, notes.slice(0, 3).map(n => h('button', { type: 'button', class: 'st-lnk', ...K('kn' + n.id), onclick: () => { know = { ...know, phase: 'setup', mode: 'flash', subj: n.subj, topic: n.text.slice(0, 60) }; render(); } }, h('span', {}, h('b', {}, n.subj + ' · ' + fmtShort(n.date)), h('small', {}, n.text.slice(0, 70) + '…')), h('span', { class: 'go' }, 'Crea →')))),
      h('h3', { class: 'sub' }, 'Ripasso e mazzo'), h('button', { type: 'button', class: 'st-lnk', ...K('lk-flashcard2'), onclick: () => nav('flashcard', LINKS[3].to) }, h('span', {}, h('b', {}, 'Apri Flashcard'), h('small', {}, 'Qui ripassi e gestisci il mazzo; KnowStudy prepara solo nuove carte dai tuoi appunti.')), h('span', { class: 'go' }, 'Apri →')));
  }
  function knowSetup() {
    const m = MODES.find(x => x[0] === know.mode), subjSel = h('select', { id: 'k-subj' }, SUBJECTS.map(s => h('option', { value: s, ...(s === know.subj ? { selected: '' } : {}) }, s))), topic = h('textarea', { id: 'k-topic', rows: 3, placeholder: 'Incolla o scrivi l\'argomento…' }, know.topic), err = h('p', { class: 'st-err', role: 'alert' });
    return h('form', { class: 'st-form', novalidate: '', onsubmit: e => { e.preventDefault(); if (!topic.value.trim()) { err.textContent = 'Argomento: campo obbligatorio.'; topic.focus(); return; } know = { ...know, subj: subjSel.value, topic: topic.value.trim(), loading: true }; render(); knowTimer = setTimeout(() => { know = { ...know, loading: false, phase: know.mode === 'flash' ? 'preview' : 'play', items: bank(know.mode, know.topic.slice(0, 40)), idx: 0, flip: false, fb: null, ok: 0 }; render(); }, 800); } },
      h('p', { class: 'st-q' }, m[1]), h('p', { class: 'hint' }, 'Nel prodotto il testo verrebbe inviato al provider con il tuo consenso; qui la generazione è simulata.'),
      h('label', { class: 'st-f', for: 'k-subj' }, h('span', {}, 'Materia'), subjSel), h('label', { class: 'st-f', for: 'k-topic' }, h('span', {}, 'Argomento *'), topic), err,
      h('div', { class: 'st-fa' }, h('button', { class: 'st-btn pri', type: 'submit', disabled: know.loading, ...K('kgen') }, know.loading ? 'Generazione in corso (simulata)…' : 'Genera (simulato)'), know.loading ? h('button', { class: 'st-btn', type: 'button', onclick: () => { clearTimeout(knowTimer); know = { ...know, loading: false }; render(); } }, 'Annulla') : null));
  }
  function knowPreview() {
    return h('div', { class: 'st-sec' }, h('p', { class: 'st-s' }, `Anteprima · ${know.items.length} carte proposte per ${know.subj}. Non sono ancora nel mazzo.`),
      know.items.map((it, i) => h('article', { class: 'st-fb' }, h('p', { class: 'st-s' }, `Carta ${i + 1} · Domanda`), h('p', { class: 'st-q' }, it.q), h('p', { class: 'st-s' }, 'Risposta proposta'), h('p', {}, it.a))),
      h('div', { class: 'st-ra' }, h('button', { class: 'st-btn pri', type: 'button', ...K('kaddfc'), onclick: () => { know = { ...know, phase: 'added' }; render(); } }, 'Aggiungi al mazzo Flashcard (simulato)'), h('button', { class: 'st-btn', type: 'button', ...K('kdiscardfc'), onclick: () => { know = { ...know, phase: 'menu', items: [] }; render(); } }, 'Scarta proposta')));
  }
  function knowAdded() {
    return h('div', { class: 'st-sec' }, h('p', { class: 'st-q' }, `${know.items.length} ${know.items.length === 1 ? 'carta pronta' : 'carte pronte'} nel mazzo Flashcard (simulato, non salvato).`), h('p', { class: 'hint' }, 'Il ripasso e la gestione avvengono in Flashcard, che resta il riferimento unico per il mazzo.'),
      h('div', { class: 'st-ra' }, h('button', { class: 'st-btn pri', type: 'button', ...K('kopenfc'), onclick: () => nav('flashcard', LINKS[3].to) }, 'Apri Flashcard →'), h('button', { class: 'st-btn', type: 'button', ...K('kbackmenu'), onclick: () => { know = { ...know, phase: 'menu', items: [] }; render(); } }, 'Torna a KnowStudy')));
  }
  function knowPlay() {
    const it = know.items[know.idx], n = know.items.length, finish = () => { know = { ...know, phase: 'result' }; render(); }, adv = () => { if (know.idx + 1 >= n) return finish(); know = { ...know, idx: know.idx + 1, flip: false, fb: null }; render(); };
    if (know.mode === 'schema') return h('div', { class: 'st-sec' }, h('p', { class: 'st-s' }, 'Schema generato (simulato)'), h('ul', { class: 'st-ai' }, it.outline.map((o, i) => h('li', { style: i ? '' : 'font-weight:700' }, o))), h('button', { class: 'st-btn pri', type: 'button', ...K('kdone'), onclick: finish }, 'Fine'));
    const head = h('p', { class: 'st-s' }, `Domanda ${know.idx + 1} di ${n}`);
    const ans = h('textarea', { id: 'k-ans', rows: 4, 'aria-label': 'La tua risposta', placeholder: 'Scrivi la risposta…', style: 'width:100%;background:var(--bg);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:10px 12px;font:15px var(--sans)' });
    return h('div', { class: 'st-sec' }, head, h('p', { class: 'st-q' }, it.q), ans, know.fb ? h('p', { class: 'st-fb', role: 'status' }, know.fb) : null,
      h('div', { class: 'st-ra' }, know.fb ? h('button', { class: 'st-btn pri', type: 'button', ...K('knext'), onclick: adv }, know.idx + 1 >= n ? 'Vedi risultato' : 'Avanti') : h('button', { class: 'st-btn pri', type: 'button', ...K('keval'), onclick: () => { const t = ans.value.trim(); know.fb = t.length < 12 ? 'Valutazione simulata: risposta troppo breve, aggiungi un esempio.' : 'Valutazione simulata: risposta chiara; aggiungi un caso in cui la regola non vale.'; if (t.length >= 12) know.ok++; render(); } }, 'Valuta (simulata)')));
  }
  function knowResult() { return h('div', { class: 'st-sec' }, h('p', { class: 'st-q' }, know.mode === 'schema' ? 'Schema completato' : `Risultato: ${know.ok} su ${know.items.length}`), h('p', { class: 'st-s' }, 'Risultato di esempio (simulato, non salvato).'), h('div', { class: 'st-ra' }, h('button', { class: 'st-btn pri', type: 'button', ...K('kagain'), onclick: () => { know = { ...know, phase: 'menu', fb: null }; render(); } }, 'Nuova sessione'))); }

  /* Hook per i controlli automatici (non fanno parte del prototipo per l'utente) */
  window.__st = { setScen, go, tick, start, pause, complete, get sess() { return sess; }, setLeft(n) { sess.left = n; if (!sess.total) sess.total = n; paintTimer(); }, get view() { return view; } };
  render();
})();
