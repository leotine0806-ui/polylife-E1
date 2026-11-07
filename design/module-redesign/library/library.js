/* Biblioteca · prototipo E1. Funzioni ricavate da src/library_fixed.html e src/library-actions.js.
   Libri, pagine e date SOLO sintetici, «oggi» fisso. Registrazione pagine, XP, aggiunte, modifiche, rimozioni e promemoria sono SIMULATI in memoria:
   nessuna rete, nessuna persistenza, nessuna chiamata al prodotto. Al ricaricamento tutto torna allo stato iniziale. */
(() => {
  const TODAY = '2026-11-02';
  const pad = n => String(n).padStart(2, '0');
  const parse = s => new Date(s + 'T12:00:00');
  const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const ago = n => { const d = parse(TODAY); d.setDate(d.getDate() - n); return key(d); };
  const CATS = { scienza: ['Scienza', '#00d4ff'], matematica: ['Matematica', '#a78bfa'], filosofia: ['Filosofia', '#fbbf24'], letteratura: ['Letteratura', '#f472b6'], tech: ['Tech', '#34d399'], finance: ['Finance', '#4f8cff'], altro: ['Altro', '#9db0c2'] };
  const DIFF = { easy: 'Facile', med: 'Intermedio', hard: 'Avanzato' };
  const CAT_SKILLS = { scienza: ['analysis', 'deep_read'], matematica: ['logic_r', 'synthesis'], filosofia: ['critical', 'synthesis'], letteratura: ['empathy', 'critical'], tech: ['logic_r', 'analysis'], finance: ['synthesis', 'critical'], altro: ['deep_read', 'empathy'] };
  /* Soglie mostrate dal sorgente: dipendono dal totale della Biblioteca; i punti subSkills non sono mostrati dalla pagina. */
  const SKILLS = [['deep_read', 'Lettura profonda', 0, false], ['analysis', 'Analisi critica', 80, false], ['logic_r', 'Logica e ragionamento', 180, false], ['synthesis', 'Sintesi', 350, false], ['critical', 'Pensiero critico', 550, true], ['empathy', 'Empatia', 800, true]];
  const skillName = id => SKILLS.find(s => s[0] === id)[1];
  const MILESTONES = [[100, 'Lettore'], [300, 'Studioso'], [600, 'Polimata'], [1000, 'Maestro']];
  const SUGGESTED = [
    { title: 'Feynman — Il piacere di scoprire', author: 'Richard Feynman', cat: 'scienza', diff: 'med', pages: 320, xp: 40, why: 'Feynman insegna a vedere la fisica con occhi vivi. Fondamentale per il metodo scientifico al di là dei libri di testo.' },
    { title: 'Come si risolve un problema', author: 'George Polya', cat: 'matematica', diff: 'med', pages: 180, xp: 35, why: 'Il libro che ha trasformato generazioni di matematici. Ogni esercizio di liceo diventa più profondo dopo averlo letto.' },
    { title: 'Delitto e castigo', author: 'F. Dostoevskij', cat: 'letteratura', diff: 'hard', pages: 367, xp: 60, why: 'Psicologia, filosofia e narrativa fuse in un capolavoro. Allena empatia e pensiero morale.' },
    { title: 'Gödel, Escher, Bach', author: 'Douglas Hofstadter', cat: 'matematica', diff: 'hard', pages: 777, xp: 120, why: 'Il libro dei libri per il futuro polimata. Logica, musica, arte e AI in un unico labirinto intellettuale.' },
    { title: 'Una breve storia del tempo', author: 'Stephen Hawking', cat: 'scienza', diff: 'med', pages: 212, xp: 35, why: 'Cosmologia e relatività spiegate con eleganza. Il contesto dell\'universo che la scuola non dà.' },
    { title: 'Il Principe', author: 'Niccolò Machiavelli', cat: 'filosofia', diff: 'med', pages: 140, xp: 30, why: 'Filosofia politica pura, 1513. Breve, denso, cambia il modo di leggere la storia.' },
    { title: 'Il mondo di Sofia', author: 'Jostein Gaarder', cat: 'filosofia', diff: 'easy', pages: 540, xp: 50, why: 'Tutta la storia della filosofia in forma di romanzo. Il punto di partenza perfetto prima di Kant.' },
    { title: 'Pensieri lenti e veloci', author: 'Daniel Kahneman', cat: 'scienza', diff: 'med', pages: 499, xp: 55, why: 'Come funziona davvero il cervello. Bias cognitivi, decisioni, irrazionalità — fondamentale per il trading e la vita.' }
  ];

  /* ---------- Fixture sintetiche (stessi campi del sorgente: id, title, author, cat, diff, pages, xp, why, status, progress) ---------- */
  const B = (id, title, author, cat, diff, pages, xp, why, status, progress) => ({ id, title, author, cat, diff, pages, xp, why, status, progress });
  const baseBooks = () => [
    B('b1', 'Le origini del pensiero scientifico', 'M. Conti', 'scienza', 'med', 320, 40, 'Per capire come nasce il metodo scientifico, prima dei capitoli di fisica.', 'reading', 148),
    B('b2', 'Logica per tutti', 'E. Ferrari', 'matematica', 'hard', 240, 45, 'Per rendere più solide le dimostrazioni del corso di analisi.', 'reading', 232),
    B('q1', 'Venti idee che hanno cambiato la filosofia', 'G. Moretti', 'filosofia', 'easy', 410, 50, 'Una mappa generale prima di affrontare i testi originali.', 'queue', 0),
    B('q2', 'Programmare con calma', 'S. Greco', 'tech', 'med', 280, 35, 'Aggiunto manualmente.', 'queue', 0),
    B('q3', 'Mercati e decisioni', 'P. Villa', 'finance', 'med', 350, 40, 'Per capire meglio come si prendono decisioni con informazioni incomplete.', 'queue', 0),
    B('d1', 'Racconti di mare', 'A. Serra', 'letteratura', 'easy', 190, 30, 'Lettura leggera tra due libri impegnativi.', 'done', 190),
    B('d2', 'Numeri e infinito', 'C. Bruno', 'matematica', 'hard', 300, 60, 'Per capire gli insiemi infiniti.', 'done', 300)
  ];
  const baseHistory = () => [[18, 1], [22, 2], [11, 3], [0, 4], [25, 5], [14, 6]].map(([pages, n]) => ({ date: ago(n), pages }));
  function fixture(s) {
    if (s === 'vuoto') return { books: [], intellect: 0, history: [], todayPages: 0 };
    if (s === 'coda') return { books: baseBooks().filter(b => b.status !== 'reading'), intellect: 285, history: baseHistory(), todayPages: 0 };
    if (s === 'parziale') return { books: baseBooks().map(b => b.id === 'b2' ? { ...b, progress: 312 } : b), intellect: 285, history: baseHistory(), todayPages: 12 };
    return { books: baseBooks(), intellect: 285, history: baseHistory(), todayPages: 12 };
  }

  /* ---------- Stato in memoria ---------- */
  let scen = 'normale', tab = 'oggi', st = fixture(scen), currentBookId = null, doneS = {}, errs = {}, editOpen = {}, drafts = {}, addErr = '', addDraft = {}, msgText = '', msgTimer = null, nid = 100, lastK = null;
  const root = document.getElementById('root'), dlg = document.getElementById('dlg');
  const K = k => ({ 'data-k': k });
  const reading = () => st.books.filter(b => b.status === 'reading'), queue = () => st.books.filter(b => b.status === 'queue'), finished = () => st.books.filter(b => b.status === 'done');
  function currentBook() { const list = reading(); if (list.length === 1) currentBookId = list[0].id; return list.find(b => b.id === currentBookId) || null; }
  const remaining = b => b.pages - b.progress, pctOf = b => b.pages ? Math.min(100, Math.round(b.progress / b.pages * 100)) : 0;
  const suggestedPages = b => Math.min(remaining(b), Math.max(10, Math.round(remaining(b) / 10)));
  const flagged = b => b.progress > b.pages;
  const notice = () => scen === 'parziale' ? 'Pagine o progresso del libro da verificare: originali conservati. Per «Logica per tutti» la registrazione delle pagine è bloccata finché i dati non sono controllati.' : '';
  const catPill = c => h('span', { class: 'lb-pill', style: '--c:' + CATS[c][1] }, h('i', {}), CATS[c][0]);

  const note = msg => {
    msgText = msg; const live = document.getElementById('live'); live.textContent = ''; setTimeout(() => { live.textContent = msg; }, 60);
    document.querySelectorAll('.lb-status').forEach(el => { el.textContent = msg; });
    clearTimeout(msgTimer); msgTimer = setTimeout(() => { msgText = ''; live.textContent = ''; document.querySelectorAll('.lb-status').forEach(el => { el.textContent = ''; }); }, 5000);
  };
  const clearNote = () => { msgText = ''; clearTimeout(msgTimer); };
  function render(focusK) {
    const fk = focusK === false ? null : focusK || document.activeElement?.dataset?.k, top = window.scrollY;
    root.replaceChildren(...build());
    if (fk) [fk, 'hero-log', 'tab-' + tab].map(k => document.querySelector(`[data-k="${k}"]`)).find(Boolean)?.focus({ preventScroll: true });
    window.scrollTo(0, top);
  }
  const build = () => [scenBar(), notice() ? h('p', { class: 'lb-notice', role: 'status' }, notice()) : null, tabs(), h('p', { class: 'lb-status', 'aria-hidden': 'true' }, msgText), ...({ oggi, libri, aggiungi, progressi }[tab])()].filter(Boolean);
  const go = t => { tab = t; clearNote(); render(); };

  /* ---------- Calcoli (stesse regole del sorgente) ---------- */
  function week() {
    return Array.from({ length: 7 }, (_, i) => { const iso = ago(6 - i), d = parse(iso), isToday = iso === TODAY, pages = isToday ? st.todayPages : (st.history.find(x => x.date === iso)?.pages || 0); return { iso, isToday, pages, label: ['D', 'L', 'M', 'M', 'G', 'V', 'S'][d.getDay()], filled: pages >= 10 }; });
  }
  function streak() { let n = 0; for (let i = 0; i <= 365; i++) { const iso = ago(i), pages = i === 0 ? st.todayPages : (st.history.find(x => x.date === iso)?.pages || 0), ok = pages >= 10; if (ok) n++; else if (i > 0) break; } return n; }
  const xpFor = pages => Math.ceil(pages * 0.5);

  /* ---------- Scenari demo e sezioni ---------- */
  const SCEN = [['normale', 'Due libri in lettura'], ['coda', 'Nessuna lettura in corso'], ['vuoto', 'Biblioteca vuota'], ['parziale', 'Dati da verificare']];
  const scenBar = () => h('details', { class: 'lb-scen' }, h('summary', {}, h('span', {}, 'Scenari demo · solo prototipo'), h('b', {}, SCEN.find(x => x[0] === scen)[1])),
    h('div', { class: 'lb-scen-o', role: 'group', 'aria-label': 'Scegli lo scenario dimostrativo' }, SCEN.map(([k, l]) => h('button', { type: 'button', class: 'lb-btn', ...K('sc-' + k), 'aria-pressed': String(scen === k), onclick: () => setScen(k) }, l))));
  function setScen(k) { clearNote(); scen = k; st = fixture(k); currentBookId = null; doneS = {}; errs = {}; editOpen = {}; drafts = {}; addErr = ''; addDraft = {}; tab = 'oggi'; render(); }
  const tabs = () => h('nav', { class: 'lb-tabs', 'aria-label': 'Sezioni della Biblioteca' }, [['oggi', 'Oggi'], ['libri', 'Libri'], ['aggiungi', 'Aggiungi'], ['progressi', 'Progressi']].map(([k, l]) => h('button', { type: 'button', ...K('tab-' + k), ...(tab === k ? { 'aria-current': 'page' } : {}), onclick: () => go(k) }, l)));

  /* ---------- Registrazione pagine (simulata) ---------- */
  function logForm(b, hero) {
    const id = 'lg-' + b.id, blocked = flagged(b);
    return h('div', { class: 'lb-log' }, h('label', { for: id }, 'Quante pagine hai letto?'),
      h('div', { class: 'lb-lr' }, h('input', { id, type: 'number', inputmode: 'numeric', min: '1', max: String(Math.max(1, remaining(b))), placeholder: 'es. ' + Math.min(20, Math.max(1, remaining(b))), value: drafts[b.id] ?? '', 'aria-describedby': 'er-' + b.id, oninput: e => { drafts[b.id] = e.target.value; }, onkeydown: e => { if (e.key === 'Enter') { e.preventDefault(); logPages(b); } } }),
        h('button', { type: 'button', class: 'lb-btn pri', ...K(hero ? 'hero-log' : 'log-' + b.id), onclick: () => logPages(b) }, 'Registra pagine')),
      h('p', { class: 'lb-err', id: 'er-' + b.id, role: 'alert' }, errs[b.id] || (blocked ? 'Da verificare: le pagine lette superano il totale del libro.' : '')));
  }
  function logPages(b) {
    const raw = (drafts[b.id] ?? '').toString().trim(), n = Number(raw);
    if (!raw || !Number.isSafeInteger(n) || n < 1 || n > 1000000) { errs[b.id] = 'Inserisci un numero di pagine valido.'; render(); document.getElementById('lg-' + b.id)?.focus(); return; }
    if (flagged(b)) { errs[b.id] = 'Lettura non confermata: pagine o progresso del libro da verificare.'; render(); document.getElementById('lg-' + b.id)?.focus(); return; }
    if (!remaining(b)) { errs[b.id] = 'Nessuna pagina residua da registrare.'; render(); return; }
    const pages = Math.min(n, remaining(b)), clamped = pages < n, completed = b.progress + pages === b.pages, bonus = completed ? b.xp : 0, gain = xpFor(pages);
    b.progress += pages; if (completed) b.status = 'done'; st.todayPages += pages; st.intellect += gain + bonus; delete drafts[b.id]; delete errs[b.id];
    render(); note(`+${gain + bonus} XP Biblioteca (simulati, non salvati): ${pages} ${pages === 1 ? 'pagina registrata' : 'pagine registrate'}${clamped ? ` (ne restavano ${pages})` : ''}. Se serve annullare, usa Modifiche recenti.`);
    if (completed) dialog('Libro completato', h('div', { class: 'lb-form' }, h('p', { class: 'lb-big2', style: 'font:700 40px/1 var(--mono);color:var(--cyan)' }, '+' + bonus + ' XP'), h('p', {}, h('b', {}, b.title), ' è tra i libri completati.'), h('p', { class: 'lb-fine' }, 'Premio del libro (simulato): è il valore indicato quando il libro è stato aggiunto, non una misura della sua difficoltà.'), h('div', { class: 'lb-fa' }, h('button', { class: 'lb-btn pri', type: 'button', ...K('okdone'), onclick: closeDlg }, 'Continua'))));
  }
  const reminder = b => { const id = 'sess_' + b.id, on = !!doneS[id]; return h('div', { class: 'lb-rem' }, h('div', { class: 'lb-ra' }, h('button', { type: 'button', class: 'lb-btn', ...K('rem-' + b.id), 'aria-pressed': String(on), onclick: () => { doneS[id] = !on; render(); note(!on ? 'Promemoria segnato come visto. Per registrare la lettura, inserisci le pagine.' : 'Promemoria tolto.'); } }, on ? '✓ Promemoria visto' : 'Segna promemoria come visto')), h('p', { class: 'lb-fine lb-rem-note' }, 'È solo un promemoria: non registra pagine né XP.')); };

  /* ---------- Oggi ---------- */
  function hero() {
    const rd = reading();
    if (!st.books.length) return h('section', { class: 'card lb-hero', 'aria-labelledby': 'lb-ht' }, h('h2', { class: 'lb-big', id: 'lb-ht' }, 'La tua biblioteca è vuota'), h('p', { class: 'lb-by' }, 'Aggiungi il primo libro: puoi metterlo in coda o iniziare subito a leggerlo.'), h('div', { class: 'lb-fa' }, h('button', { class: 'lb-btn pri big', type: 'button', ...K('hero-log'), onclick: () => go('aggiungi') }, '+ Aggiungi il primo libro')));
    if (!rd.length) { const q = queue()[0]; return h('section', { class: 'card lb-hero', 'aria-labelledby': 'lb-ht' }, h('div', { class: 'lb-hh' }, h('span', { class: 'eyebrow' }, 'Adesso'), h('span', { class: 'lb-state' }, 'Nessuna lettura in corso')),
      h('h2', { class: 'lb-big', id: 'lb-ht' }, 'Scegli il prossimo libro'), q ? h('p', { class: 'lb-by' }, `Il primo in coda è «${q.title}» di ${q.author}, ${q.pages} pagine.`) : h('p', { class: 'lb-by' }, 'La coda è vuota: aggiungi un libro per riprendere a leggere.'),
      h('div', { class: 'lb-fa' }, q ? h('button', { class: 'lb-btn pri big', type: 'button', ...K('hero-log'), onclick: () => startReading(q) }, 'Inizia a leggere') : h('button', { class: 'lb-btn pri big', type: 'button', ...K('hero-log'), onclick: () => go('aggiungi') }, '+ Aggiungi un libro'), q ? h('button', { class: 'lb-btn', type: 'button', onclick: () => go('libri') }, 'Vedi la coda') : null), errs.start ? h('p', { class: 'lb-err', role: 'alert' }, errs.start) : null); }
    const b = currentBook();
    if (!b) return h('section', { class: 'card lb-hero lb-picker', 'aria-labelledby': 'lb-ht' }, h('div', { class: 'lb-hh' }, h('span', { class: 'eyebrow' }, 'In lettura'), h('span', { class: 'lb-state' }, `${rd.length} libri attivi`)),
      h('h2', { class: 'lb-big', id: 'lb-ht' }, 'Quale libro vuoi riprendere?'), h('p', { class: 'lb-by' }, 'Ne hai più di uno in corso: scegli tu quale mettere in primo piano.'),
      h('div', { class: 'lb-picklist', role: 'group', 'aria-label': 'Scegli il libro da riprendere' }, rd.map(book => h('button', { type: 'button', class: 'lb-pick', ...K('pick-' + book.id), onclick: () => { currentBookId = book.id; render('pick-' + book.id); } }, h('span', {}, h('b', {}, book.title), h('small', {}, `${book.author} · ${CATS[book.cat][0]} · ${book.progress}/${book.pages} pagine`)), h('span', { class: 'lb-pick-go' }, 'Riprendi →')))));
    const warn = flagged(b);
    return h('section', { class: 'card lb-hero' + (warn ? ' warn' : ''), 'aria-labelledby': 'lb-ht' }, h('div', { class: 'lb-hh' }, h('span', { class: 'eyebrow' }, rd.length > 1 ? 'Libro scelto · In lettura' : 'In lettura adesso'), h('div', { class: 'lb-hact' }, h('span', { class: 'lb-state ' + (warn ? 'wn' : 'cy') }, warn ? 'Da verificare' : 'In lettura'), rd.length > 1 ? h('button', { type: 'button', class: 'lb-btn ghost lb-switch', ...K('switch-book'), onclick: () => { currentBookId = null; render('switch-book'); } }, 'Cambia') : null)),
      h('div', {}, h('h2', { class: 'lb-big', id: 'lb-ht' }, b.title), h('p', { class: 'lb-by' }, b.author + ' · ' + CATS[b.cat][0])),
      h('div', { class: 'lb-prog' }, h('div', { class: 'lb-pl' }, h('span', {}, h('b', {}, `${b.progress} / ${b.pages}`), ' pagine'), h('span', {}, pctOf(b) + '%')), h('div', { class: 'seg', role: 'img', 'aria-label': `${pctOf(b)} percento del libro letto` }, h('i', { style: `width:${pctOf(b)}%` }))),
      warn ? null : h('p', { class: 'lb-next' }, 'Prossimo passo: leggi circa ', h('b', {}, suggestedPages(b) + ' pagine'), ' oggi.', h('span', { class: 'lb-fine', style: 'display:block;margin-top:2px' }, `Ne restano ${remaining(b)}. Il numero è un suggerimento: puoi registrare quante ne hai lette.`)),
      logForm(b, true), reminder(b));
  }
  function startReading(b) {
    if (reading().length >= 3) { errs.start = 'Modifica non confermata: massimo 3 libri in lettura contemporaneamente.'; render(); return; }
    delete errs.start; const wasEmpty = reading().length === 0; b.status = 'reading'; if (wasEmpty) currentBookId = b.id; render(false); render('hero-log'); note('Lettura iniziata (simulato, non salvato).');
  }
  function oggi() {
    const active = currentBook(), others = active ? reading().filter(b => b.id !== active.id) : [], s = streak();
    const side = h('div', { class: 'lb-sec' }, h('section', { class: 'card lb-card', 'aria-labelledby': 'lb-nm' }, h('h2', { id: 'lb-nm' }, 'Oggi in numeri'),
      h('div', { class: 'lb-nums' }, [['Pagine oggi', st.todayPages, 'registrate oggi'], ['Serie', s, s === 1 ? 'giorno di fila' : 'giorni di fila'], ['XP Biblioteca', st.intellect, 'pagine + bonus libri'], ['Completati', finished().length, finished().length === 1 ? 'libro' : 'libri']].map(([l, v, t]) => h('div', { class: 'lb-num' }, h('b', {}, String(v)), h('small', {}, l), h('span', {}, t)))),
      h('p', { class: 'lb-fine' }, 'La serie conta i giorni con almeno 10 pagine registrate. Il dettaglio degli ultimi 7 giorni è in Progressi.')));
    if (others.length) side.append(h('section', { class: 'card lb-card', 'aria-labelledby': 'lb-ot' }, h('h2', { id: 'lb-ot' }, `Altri libri in lettura (${others.length})`), h('div', { class: 'lb-list' }, others.map(book => h('article', { class: 'lb-book rd', style: '--bc:' + CATS[book.cat][1] }, h('div', {}, h('div', { class: 'lb-t' }, book.title), h('div', { class: 'lb-s' }, `${book.author} · ${CATS[book.cat][0]} · ${book.progress} / ${book.pages} pagine · ${pctOf(book)}%`)), h('div', { class: 'seg', role: 'img', 'aria-label': `${pctOf(book)} percento letto` }, h('i', { style: `width:${pctOf(book)}%` })), h('button', { type: 'button', class: 'lb-btn ghost', ...K('pick-' + book.id), onclick: () => { currentBookId = book.id; render('pick-' + book.id); } }, 'Riprendi questo libro'), logForm(book, false), reminder(book))))));
    return [h('div', { class: 'lb-cols' }, h('div', { class: 'lb-sec' }, hero()), side)];
  }

  /* ---------- Libri ---------- */
  function bookCard(b) {
    const col = CATS[b.cat][1], sk2 = CAT_SKILLS[b.cat].map(id => SKILLS.find(x => x[0] === id)), hidN = sk2.filter(s => s[3] && st.intellect < s[2]).length;
    const skills = [...sk2.filter(s => !(s[3] && st.intellect < s[2])).map(s => s[1]), ...(hidN ? [hidN === 1 ? '1 abilità nascosta' : `${hidN} abilità nascoste`] : [])];
    const rd = b.status === 'reading', ask = errs['rm' + b.id];
    return h('article', { class: 'lb-book' + (rd ? ' rd' : ''), style: '--bc:' + col, 'aria-label': b.title },
      h('div', { class: 'lb-rl' }, catPill(b.cat), h('span', { class: 'lb-pill' }, DIFF[b.diff]), h('span', { class: 'lb-pill' }, `Premio ${b.xp} XP`), b.status === 'done' ? h('span', { class: 'lb-pill ok' }, '✓ Completato') : flagged(b) ? h('span', { class: 'lb-pill wn' }, 'Da verificare') : null),
      h('div', {}, h('div', { class: 'lb-t' }, b.title), h('div', { class: 'lb-s' }, `${b.author} · ${b.pages} pagine`)), b.why ? h('p', { class: 'lb-why' }, b.why) : null,
      h('p', { class: 'lb-s' }, 'Allena: ' + skills.join(', ')),
      rd ? [h('div', { class: 'lb-prog' }, h('div', { class: 'lb-pl' }, h('span', {}, h('b', {}, `${b.progress} / ${b.pages}`), ' pagine'), h('span', {}, pctOf(b) + '%')), h('div', { class: 'seg', role: 'img', 'aria-label': `${pctOf(b)} percento letto` }, h('i', { style: `width:${pctOf(b)}%` }))), logForm(b, false)] : null,
      h('div', { class: 'lb-ra' }, b.status === 'queue' ? h('button', { type: 'button', class: 'lb-btn pri', ...K('st-' + b.id), onclick: () => { if (reading().length >= 3) { errs['rm' + b.id] = 'Modifica non confermata: massimo 3 libri in lettura contemporaneamente.'; render(); return; } delete errs['rm' + b.id]; b.status = 'reading'; render(); note('Lettura iniziata (simulato, non salvato).'); } }, 'Inizia a leggere') : null,
        b.status !== 'done' ? h('button', { type: 'button', class: 'lb-btn', ...K('ep-' + b.id), 'aria-expanded': String(!!editOpen[b.id]), onclick: () => { editOpen[b.id] = !editOpen[b.id]; render(); } }, 'Modifica pagine totali') : null,
        h('button', { type: 'button', class: 'lb-btn ghost', ...K('rm-' + b.id), 'aria-label': 'Rimuovi il libro: ' + b.title, onclick: () => confirmRemove(b) }, '✕ Rimuovi')),
      ask ? h('p', { class: 'lb-err', role: 'alert' }, ask) : null,
      editOpen[b.id] ? editRow(b) : null);
  }
  function editRow(b) {
    const inp = h('input', { id: 'ed-' + b.id, type: 'number', min: '1', max: '1000000', value: String(drafts['ed' + b.id] ?? b.pages) }), er = h('p', { class: 'lb-err', role: 'alert' });
    inp.oninput = () => { drafts['ed' + b.id] = inp.value; };
    const save = () => { const v = Number(inp.value); if (!Number.isSafeInteger(v) || v < 1 || v > 1000000) { er.textContent = 'Numero totale di pagine non valido.'; inp.focus(); return; }
      b.pages = v; b.progress = Math.min(b.progress, v); delete drafts['ed' + b.id]; editOpen[b.id] = false; render(); note('Pagine totali aggiornate (simulato, non salvato).' + (b.progress === v && b.status === 'reading' ? ' Il progresso è stato limitato al nuovo totale.' : '')); };
    return h('div', { class: 'lb-sec' }, h('div', { class: 'lb-edit' }, h('label', { for: 'ed-' + b.id }, 'Pagine totali', inp), h('button', { type: 'button', class: 'lb-btn pri', ...K('sv-' + b.id), onclick: save }, 'Salva pagine'), h('button', { type: 'button', class: 'lb-btn', onclick: () => { editOpen[b.id] = false; delete drafts['ed' + b.id]; render(); } }, 'Annulla')), er,
      h('p', { class: 'lb-fine' }, 'Titolo, autore, categoria e premio non si possono modificare: nel prodotto cambiano solo le pagine totali.'));
  }
  function confirmRemove(b) {
    dialog('Rimuovere il libro?', h('div', { class: 'lb-form' }, h('p', {}, h('b', {}, b.title)), h('p', { class: 'lb-fine' }, `${b.author}. ${b.status === 'done' ? 'È un libro completato: gli XP già guadagnati restano.' : 'Il progresso registrato su questo libro non viene più mostrato.'} Nel prodotto la rimozione si può annullare da «Modifiche recenti».`),
      h('div', { class: 'lb-fa' }, h('button', { class: 'lb-btn dng', type: 'button', ...K('rmy'), onclick: () => { st.books = st.books.filter(x => x !== b); delete drafts[b.id]; closeDlg(); render(); note('Libro rimosso (simulato, non salvato).'); } }, 'Rimuovi'), h('button', { class: 'lb-btn', type: 'button', ...K('rmn'), onclick: closeDlg }, 'Annulla'))));
  }
  function libri() {
    const sec = (id, title, list, empty, cta) => h('section', { class: 'card lb-card lb-sec', 'aria-labelledby': id }, h('div', { class: 'lb-hd' }, h('h2', { id }, title), cta || null), list.length ? h('div', { class: 'lb-list' }, list.map(bookCard)) : h('div', { class: 'lb-empty' }, h('span', {}, empty)));
    if (!st.books.length) return [h('section', { class: 'card lb-card', 'aria-labelledby': 'lb-e' }, h('h2', { id: 'lb-e' }, 'Libri'), h('div', { class: 'lb-empty' }, h('b', {}, 'Nessun libro ancora'), h('span', {}, 'Aggiungi un libro per iniziare a leggere o mettilo in coda.'), h('button', { class: 'lb-btn pri', type: 'button', ...K('firstb'), onclick: () => go('aggiungi') }, '+ Aggiungi il primo libro')))];
    return [sec('lb-r', `In lettura (${reading().length} su 3)`, reading(), 'Nessun libro in lettura. Inizia uno dei libri in coda.', h('button', { class: 'lb-btn', type: 'button', ...K('addb'), onclick: () => go('aggiungi') }, '+ Aggiungi un libro')), sec('lb-q', `Coda (${queue().length})`, queue(), 'Coda vuota.'), sec('lb-d', `Completati (${finished().length})`, finished(), 'Nessun libro completato.')];
  }

  /* ---------- Aggiungi ---------- */
  function aggiungi() {
    const f = (id, label, el) => h('label', { class: 'lb-f', for: id }, h('span', {}, label), el), v = id => addDraft[id] ?? '', onI = id => e => { addDraft[id] = e.target.value; };
    const opt = (map, cur) => Object.entries(map).map(([k, x]) => h('option', { value: k, ...(cur === k ? { selected: '' } : {}) }, Array.isArray(x) ? x[0] : x));
    const form = h('form', { class: 'lb-form', novalidate: '', onsubmit: e => { e.preventDefault(); addBook(); } },
      f('a-title', 'Titolo *', h('input', { id: 'a-title', type: 'text', maxlength: '120', value: v('a-title'), oninput: onI('a-title') })), f('a-author', 'Autore *', h('input', { id: 'a-author', type: 'text', maxlength: '80', value: v('a-author'), oninput: onI('a-author') })),
      h('div', { class: 'lb-fr' }, f('a-cat', 'Categoria', h('select', { id: 'a-cat', onchange: onI('a-cat') }, opt(CATS, addDraft['a-cat'] || 'scienza'))), f('a-diff', 'Difficoltà', h('select', { id: 'a-diff', onchange: onI('a-diff') }, opt(DIFF, addDraft['a-diff'] || 'med')))),
      h('div', { class: 'lb-fr' }, f('a-pages', 'Pagine totali (se vuoto: 200)', h('input', { id: 'a-pages', type: 'number', min: '1', inputmode: 'numeric', value: v('a-pages'), oninput: onI('a-pages') })), f('a-xp', 'Premio al completamento, in XP (se vuoto: 50)', h('input', { id: 'a-xp', type: 'number', min: '0', inputmode: 'numeric', value: addDraft['a-xp'] ?? '50', oninput: onI('a-xp') }))),
      f('a-why', 'Perché leggerlo?', h('textarea', { id: 'a-why', oninput: onI('a-why') }, v('a-why'))), f('a-status', 'Dove metterlo', h('select', { id: 'a-status', onchange: onI('a-status') }, h('option', { value: 'queue', ...((addDraft['a-status'] || 'queue') === 'queue' ? { selected: '' } : {}) }, 'In coda'), h('option', { value: 'reading', ...(addDraft['a-status'] === 'reading' ? { selected: '' } : {}) }, 'Inizia subito'))),
      h('p', { class: 'lb-err', role: 'alert' }, addErr), h('div', { class: 'lb-fa' }, h('button', { class: 'lb-btn pri', type: 'submit', ...K('a-save') }, 'Aggiungi il libro')));
    return [h('div', { class: 'lb-cols' }, h('section', { class: 'card lb-card', 'aria-labelledby': 'lb-af' }, h('h2', { id: 'lb-af' }, 'Aggiungi un libro'), form),
      h('section', { class: 'card lb-card lb-sec', 'aria-labelledby': 'lb-sg' }, h('h2', { id: 'lb-sg', style: 'margin:0' }, 'Libri suggeriti'), h('p', { class: 'lb-fine' }, 'È un elenco fisso di 8 titoli, uguale per tutti: non tiene conto di ciò che hai letto.'),
        h('div', { class: 'lb-list' }, SUGGESTED.map((s, i) => { const added = st.books.some(b => b.title === s.title); return h('article', { class: 'lb-book', style: '--bc:' + CATS[s.cat][1], 'aria-label': s.title }, h('div', { class: 'lb-rl' }, catPill(s.cat), h('span', { class: 'lb-pill' }, DIFF[s.diff]), h('span', { class: 'lb-pill' }, `Premio ${s.xp} XP`)), h('div', {}, h('div', { class: 'lb-t' }, s.title), h('div', { class: 'lb-s' }, `${s.author} · ${s.pages} pagine`)), h('p', { class: 'lb-why' }, s.why),
          added ? h('span', { class: 'lb-pill ok', style: 'justify-self:start' }, '✓ Già nella biblioteca') : h('button', { type: 'button', class: 'lb-btn', ...K('sg-' + i), onclick: () => { st.books.push({ id: 'x' + (++nid), ...s, status: 'queue', progress: 0 }); render(); note(`«${s.title}» aggiunto alla coda (simulato, non salvato).`); } }, '+ Aggiungi alla coda')); }))))];
  }
  function addBook() {
    const d = addDraft, title = (d['a-title'] || '').trim(), author = (d['a-author'] || '').trim(), pagesRaw = (d['a-pages'] ?? '').toString().trim(), xpRaw = (d['a-xp'] ?? '50').toString().trim(), status = d['a-status'] || 'queue';
    const pages = pagesRaw === '' ? 200 : Number(pagesRaw), xp = xpRaw === '' ? 50 : Number(xpRaw);
    const fail = (msg, id) => { addErr = msg; render(false); document.getElementById(id)?.focus(); };
    if (!title || !author) return fail('Titolo e autore sono obbligatori.', !title ? 'a-title' : 'a-author');
    if (!Number.isSafeInteger(pages) || pages < 1 || pages > 1000000 || !Number.isSafeInteger(xp) || xp < 0 || xp > 1000000) return fail('Pagine o XP non validi.', 'a-pages');
    if (status === 'reading' && reading().length >= 3) return fail('Modifica non confermata: massimo 3 libri in lettura contemporaneamente.', 'a-status');
    st.books.push({ id: 'x' + (++nid), title, author, pages, xp, cat: d['a-cat'] || 'scienza', diff: d['a-diff'] || 'med', why: (d['a-why'] || '').trim() || 'Aggiunto manualmente.', status, progress: 0 });
    addErr = ''; addDraft = {}; render(false); note(`«${title}» aggiunto ${status === 'reading' ? 'e in lettura' : 'alla coda'} (simulato, non salvato).`);
  }

  /* ---------- Progressi ---------- */
  function progressi() {
    const xp = st.intellect, w = week(), s = streak(), nextReq = SKILLS.filter(x => xp < x[2]).map(x => x[2])[0], hidden = SKILLS.filter(x => x[3] && xp < x[2]);
    return [h('div', { class: 'lb-cols' }, h('div', { class: 'lb-sec' },
      h('section', { class: 'card lb-card lb-sec', 'aria-labelledby': 'lb-xp' }, h('h2', { id: 'lb-xp', style: 'margin:0' }, 'XP Biblioteca'),
        h('div', { class: 'lb-prog' }, h('div', { class: 'lb-pl' }, h('span', {}, h('b', {}, String(xp)), ' XP'), h('span', {}, 'obiettivo massimo: 1000 XP')), h('div', { class: 'seg', role: 'img', 'aria-label': `${Math.min(100, Math.round(xp / 10))} percento verso 1000 XP` }, h('i', { style: `width:${Math.min(100, Math.round(xp / 10))}%` }))),
        h('div', { class: 'lb-ms2', 'aria-label': 'Tappe' }, MILESTONES.map(([n, l]) => h('span', { class: 'lb-pill' + (xp >= n ? ' dn' : '') }, (xp >= n ? '✓ ' : '') + `${l} · ${n} XP`))),
        h('p', { class: 'lb-fine' }, 'Questo totale Biblioteca somma XP per pagine e bonus di completamento scelti sui libri. Il livello globale resta non disponibile: dipende dal profilo di gioco e può usare un contatore diverso.')),
      h('section', { class: 'card lb-card lb-sec', 'aria-labelledby': 'lb-sk' }, h('h2', { id: 'lb-sk', style: 'margin:0' }, 'Sblocchi delle abilità'), h('p', { class: 'lb-fine' }, 'Le soglie mostrate dipendono dal totale XP Biblioteca. I punti per singola abilità sono registrati, ma non sono mostrati da questa pagina.'),
        h('div', { class: 'lb-ms' }, SKILLS.filter(x => !x[3] || xp >= x[2]).map(([id, name, req]) => { const on = xp >= req, isNext = !on && req === nextReq; return h('div', { class: 'lb-m' + (on ? ' on' : isNext ? ' next' : '') }, h('b', {}, name), h('span', { class: 'lb-pill ' + (on ? 'ok' : '') }, on ? '✓ Acquisita' : `${req} XP`), h('small', {}, on ? 'Sbloccata.' : isNext ? `Prossima: ne mancano ${req - xp} XP.` : `Serve il totale di ${req} XP.`)); }), hidden.length ? h('div', { class: 'lb-m hid' }, h('b', {}, `${hidden.length} abilità ancora da sbloccare`), h('span', { class: 'lb-pill' }, hidden.map(x => x[2]).join(' / ') + ' XP'), h('small', {}, 'I nomi si rivelano al raggiungimento delle rispettive soglie.')) : null))),
      h('div', { class: 'lb-sec' }, h('section', { class: 'card lb-card lb-sec', 'aria-labelledby': 'lb-sr' }, h('h2', { id: 'lb-sr', style: 'margin:0' }, 'Serie e ultimi 7 giorni'),
        h('div', { class: 'lb-num' }, h('b', {}, String(s)), h('small', {}, s === 1 ? 'giorno di fila' : 'giorni di fila'), h('span', {}, 'Conta i giorni consecutivi con almeno 10 pagine. Oggi non spezza la serie finché non finisce la giornata.')),
        h('div', { class: 'lb-week', role: 'group', 'aria-label': 'Ultimi 7 giorni: pagine lette' }, w.map(d => h('div', { class: 'lb-wd' + (d.filled ? ' ok' : '') + (d.isToday ? ' td' : ''), 'aria-label': `${d.label}: ${d.pages} pagine` }, h('span', {}, d.label), h('b', {}, String(d.pages))))),
        h('p', { class: 'lb-fine' }, 'I numeri sotto le lettere sono le pagine di ogni giorno. Il prodotto mostra solo se la soglia è stata raggiunta.')),
      h('section', { class: 'card lb-card lb-sec', 'aria-labelledby': 'lb-hw' }, h('h2', { id: 'lb-hw', style: 'margin:0' }, 'Come si guadagnano gli XP'), h('ul', { class: 'lb-how' },
        h('li', {}, h('b', {}, 'Ogni pagina registrata'), ' vale 0,5 XP, arrotondato per eccesso: 11 pagine, 6 XP.'), h('li', {}, h('b', {}, 'Finire un libro'), ' dà il premio indicato quando lo hai aggiunto (se vuoto: 50). Lo scegli tu: non misura la difficoltà.'), h('li', {}, h('b', {}, 'Il promemoria'), ' non dà XP: serve solo a ricordare la lettura.'), h('li', {}, h('b', {}, 'Ogni libro'), ' rafforza due abilità, in base alla categoria.')))))];
  }

  /* ---------- Finestre ---------- */
  function dialog(title, body) { lastK = document.activeElement?.dataset?.k || null; document.getElementById('dlg-t').textContent = title; document.getElementById('dlg-b').replaceChildren(h('p', { class: 'lb-sim' }, 'Simulazione · nessun salvataggio'), body); if (!dlg.open) dlg.showModal(); }
  function closeDlg() { if (dlg.open) dlg.close(); }
  document.getElementById('dlg-x').onclick = closeDlg;
  dlg.addEventListener('close', () => { const t = (lastK && document.querySelector(`[data-k="${lastK}"]`)) || document.querySelector('[data-k="hero-log"]') || document.querySelector(`[data-k="tab-${tab}"]`); t?.focus({ preventScroll: true }); });
  dlg.addEventListener('click', e => { if (e.target === dlg) closeDlg(); });
  function moduleDialog(id, title, body) { const d = h('dialog', { id, 'aria-labelledby': id + '-title' }); d.append(h('div', { class: 'dh' }, h('h2', { id: id + '-title' }, title), h('button', { class: 'chip', type: 'button', 'aria-label': 'Chiudi', onclick: () => d.close() }, '✕')), h('div', { class: 'db' }, body)); d.addEventListener('click', e => { if (e.target === d) d.close(); }); document.body.append(d); return d; }
  const APP_GROUPS = [
    ['Quotidiano', [['☰', 'Diario della giornata'], ['⚔', 'Missioni'], ['▦', 'Calendario'], ['✦', 'Planner AI'], ['◷', 'Weekly Review'], ['⚖', 'Decisioni']]],
    ['Apprendimento', [['🎓', 'Studio'], ['📚', 'Library', 'questa pagina'], ['🃏', 'Flashcard'], ['⚙', 'Engineer']]],
    ['Corpo e creatività', [['🏋', 'Leo Protocol'], ['⚡', 'Recovery'], ['🎨', 'Arte & Musica'], ['🏛', 'Agora'], ['🎌', 'Agora Anime']]],
    ['Gioco', [['⚔', 'Life RPG'], ['🌌', 'Dungeon']]],
    ['Intelligenza', [['◎', 'Jarvis'], ['✦', 'Second Brain'], ['✧', 'Idea Hub', 'sezione autonoma · da progettare'], ['🤖', 'AI Coach'], ['⚙', 'Profilo operativo']]],
    ['Sistema', [['⚙', 'Impostazioni'], ['⛁', 'Backup e ripristino'], ['🔑', 'Chiave API'], ['⚡', 'PolyFeed']]]
  ];
  const appSearch = h('input', { class: 'field', type: 'search', placeholder: 'Cerca una sezione…', 'aria-label': 'Cerca una sezione', style: 'width:100%' }), appList = h('div', {});
  const drawApps = () => { const qy = appSearch.value.trim().toLocaleLowerCase('it'); appList.replaceChildren(); let n = 0;
    for (const [g, items] of APP_GROUPS) { const ms = items.filter(([, l]) => l.toLocaleLowerCase('it').includes(qy)); if (!ms.length) continue; n += ms.length;
      appList.append(h('div', { class: 'grp' }, h('h3', {}, g), h('div', { class: 'items' }, ms.map(([ic, l, nt]) => h('button', { class: 'item', type: 'button', onclick: () => { dApps.close(); if (l === 'Library') go('oggi'); else note('Collegamento simulato: ' + l + '.'); } }, h('span', { class: 'ic', 'aria-hidden': 'true' }, ic), h('span', { class: 'l' }, l, nt ? h('small', {}, nt) : null)))))); }
    if (!n) appList.append(h('p', { class: 'empty' }, 'Nessuna sezione trovata.')); };
  appSearch.addEventListener('input', drawApps); drawApps();
  const dApps = moduleDialog('lb-apps', 'Tutte le app', h('div', {}, h('div', { class: 'sim' }, 'Collegamenti simulati · nessuna funzione esterna viene aperta'), appSearch, appList));
  const dSet = moduleDialog('lb-settings', 'Impostazioni', h('div', {}, h('div', { class: 'sim' }, 'Anteprima della struttura · le voci d\'esempio non modificano l\'app'), h('div', { class: 'legend' }, h('span', {}, h('span', { class: 'badge real' }, 'Esistente'), ' già presente nell\'app'), h('span', {}, h('span', { class: 'badge ex' }, 'Esempio'), ' solo del prototipo')),
    h('div', { class: 'grp' }, h('h3', {}, 'Dati e sicurezza'), h('div', { class: 'set' }, [['Backup e ripristino', 'Esistente in Impostazioni'], ['Chiave API', 'Esistente nell\'Hub']].map(([l, d]) => h('button', { class: 'sw', type: 'button', onclick: () => note(l + ' · anteprima simulata') }, h('span', { class: 'l' }, l, h('small', {}, d)), h('span', { class: 'badge real' }, 'Esistente'))))),
    h('div', { class: 'grp' }, h('h3', {}, 'Biblioteca'), h('div', { class: 'set' }, [['Pagine al giorno per la serie', 'Esempio · oggi fisso a 10'], ['Libri in lettura insieme', 'Esempio · oggi fisso a 3']].map(([l, d]) => h('button', { class: 'sw', type: 'button', onclick: () => note(l + ' · voce d\'esempio') }, h('span', { class: 'l' }, l, h('small', {}, d)), h('span', { class: 'badge ex' }, 'Esempio')))))));
  document.getElementById('appsBtn').addEventListener('click', () => dApps.showModal());
  document.getElementById('setBtn').addEventListener('click', () => dSet.showModal());

  window.__lb = { setScen, go, get state() { return { scen, tab, books: st.books.length, reading: reading().length, queue: queue().length, done: finished().length, todayPages: st.todayPages, intellect: st.intellect, streak: streak() }; } };
  render();
})();
