/* Flashcard · prototipo E1. Funzioni ricavate da src/flashcards.html, src/flashcard-service.js e src/spaced-repetition.js.
   Carte e date SOLO sintetiche, «oggi» fisso. Valutazioni, avanzamento, XP e salvataggi sono SIMULATI in memoria:
   nessuna rete, nessuna persistenza, nessuna chiamata al prodotto. Al ricaricamento tutto torna allo stato iniziale. */
(() => {
  const TODAY = '2026-11-02';
  const pad = n => String(n).padStart(2, '0');
  const parse = s => new Date(s + 'T12:00:00');
  const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return key(d); };
  const fmtShort = s => parse(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  const SUBJ = { Elettronica: '#8fa8d6', Storia: '#d6b97f', Fisica: '#e59aab', Chimica: '#88b8a6', Analisi: '#aaa0d0' };
  const sc = s => SUBJ[s] || '#9aabbd';
  const SUBJECTS = Object.keys(SUBJ);
  const when = n => n === 1 ? 'domani' : `tra ${n} giorni`;

  /* Regola SM-2 del prodotto (src/spaced-repetition.js, reviewCard) e XP (src/flashcard-service.js, reviewXp): copiate, non inventate. */
  function sm2(card, q) {
    let ef = card.easiness_factor ?? 2.5, interval = card.interval ?? 1, rep = card.repetitions ?? 0;
    if (q >= 3) { interval = rep === 0 ? 1 : rep === 1 ? 6 : Math.round(interval * ef); rep++; } else { rep = 0; interval = 1; }
    ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    return { easiness_factor: Math.round(ef * 1000) / 1000, interval, repetitions: rep, next_review_date: addDays(TODAY, interval), last_reviewed: TODAY };
  }
  const xpFor = q => 2 + (q >= 3 ? 7 : 0);
  const isDue = c => !c.next_review_date || c.next_review_date <= TODAY;
  /* Ordine della sessione: scadute (dalla più vecchia), poi di oggi, infine nuove. */
  const dueRank = c => !c.next_review_date ? 2 : c.next_review_date < TODAY ? 0 : 1;
  const byDate = (a, b) => dueRank(a) - dueRank(b) || (a.next_review_date || '').localeCompare(b.next_review_date || '');
  const RATES = [
    [0, 'Blackout', 'Non ricordavo nulla'], [1, 'Sbagliata', 'Risposta sbagliata'], [2, 'Quasi', 'Non corretta'],
    [3, 'Bene', 'Con sforzo'], [4, 'Ottimo', 'Con esitazione'], [5, 'Perfetto', 'Immediato']
  ];

  /* ---------- Fixture sintetiche (stessi campi del sorgente) ---------- */
  const C = (id, subject, question, answer, note, ef, interval, repetitions, next) => ({ id, subject, question, answer, note, ...(next ? { easiness_factor: ef, interval, repetitions, next_review_date: next, last_reviewed: addDays(next, -interval) } : {}) });
  const baseDeck = () => [
    C('n1', 'Elettronica', 'Che cosa afferma il teorema di Thevenin?', 'Una rete lineare vista da due morsetti equivale a un generatore di tensione in serie a una resistenza.', 'Si spengono i generatori indipendenti per trovare la resistenza.'),
    C('n2', 'Fisica', 'Come si scrive la velocità nel moto uniformemente accelerato?', 'v = v₀ + a·t', ''),
    C('n3', 'Chimica', 'Che cos\'è un legame ionico?', 'L\'attrazione elettrostatica tra ioni di carica opposta, nata dal trasferimento di elettroni.', 'Tipico tra metalli e non metalli.'),
    C('o3', 'Elettronica', 'Qual è il guadagno di un amplificatore non invertente?', '1 + R₂/R₁', '', 2.36, 6, 2, '2026-10-28'),
    C('o1', 'Storia', 'In che anno fu proclamato il Regno d\'Italia?', '1861', 'Vittorio Emanuele II, 17 marzo.', 2.5, 6, 2, '2026-10-30'),
    C('o2', 'Analisi', 'Quanto vale la derivata di sin(x)?', 'cos(x)', '', 2.5, 1, 1, '2026-10-31'),
    C('t1', 'Fisica', 'Che cosa dice il primo principio della dinamica?', 'Un corpo resta in quiete o in moto rettilineo uniforme se la forza risultante è nulla.', 'Detto anche principio di inerzia.', 2.5, 1, 1, '2026-11-02'),
    C('t2', 'Storia', 'Chi guidò la spedizione dei Mille?', 'Giuseppe Garibaldi', 'Partenza da Quarto, maggio 1860.', 2.6, 6, 2, '2026-11-02'),
    C('f1', 'Chimica', 'Qual è il numero atomico del carbonio?', '6', '', 2.5, 6, 2, '2026-11-09'),
    C('f2', 'Analisi', 'Quanto vale il limite di sin(x)/x per x → 0?', '1', 'Limite notevole.', 2.4, 18, 3, '2026-11-20'),
    C('f3', 'Elettronica', 'Come si enuncia la legge di Ohm?', 'V = R·I', '', 2.7, 42, 4, '2026-12-14'),
    C('f4', 'Storia', 'In che anno si tenne il Congresso di Vienna?', '1815', '', 2.5, 3, 2, '2026-11-05')
  ];
  function deckFor(s) {
    if (s === 'vuoto') return [];
    if (s === 'finito') return baseDeck().map((c, i) => isDue(c) ? { ...c, easiness_factor: c.easiness_factor ?? 2.5, interval: 1 + (i % 4), repetitions: 1, next_review_date: addDays(TODAY, 1 + (i % 4)), last_reviewed: TODAY } : c);
    return baseDeck();
  }

  /* ---------- Stato in memoria ---------- */
  let scen = 'normale', tab = 'ripasso', phase = 'start', deck = deckFor(scen), due = [], idx = 0, flipped = false, stats = { reviewed: 0, correct: 0, xp: 0 }, skipped = 0, filter = 'all', lastK = null, msgText = '', msgTimer = null, nid = 100;
  const root = document.getElementById('root'), dlg = document.getElementById('dlg');
  const K = k => ({ 'data-k': k });
  const notice = () => scen === 'parziale' ? 'Archivio parziale: 2 anomalie. Originali conservati. Stato SM-2 non riconosciuto: originale conservato.' : '';
  const subjPill = s => h('span', { class: 'fc-pill', style: '--c:' + sc(s) }, h('i', {}), s || '—');

  const note = msg => {
    msgText = msg; const live = document.getElementById('live'); live.textContent = ''; setTimeout(() => { live.textContent = msg; }, 60);
    document.querySelectorAll('.fc-status').forEach(el => { el.textContent = msg; });
    clearTimeout(msgTimer); msgTimer = setTimeout(() => { msgText = ''; live.textContent = ''; document.querySelectorAll('.fc-status').forEach(el => { el.textContent = ''; }); }, 5000);
  };
  const clearNote = () => { msgText = ''; clearTimeout(msgTimer); };
  const nav = to => note('Anteprima di navigazione verso ' + to + ' (nessuna azione).');
  function render(focusK) {
    const fk = focusK === false ? null : focusK || document.activeElement?.dataset?.k, top = window.scrollY;
    root.replaceChildren(...build());
    if (fk) [fk, 'start', 'tab-' + tab].map(k => document.querySelector(`[data-k="${k}"]`)).find(Boolean)?.focus({ preventScroll: true });
    window.scrollTo(0, top);
  }
  const build = () => [scenBar(), notice() ? h('p', { class: 'fc-notice', role: 'status' }, notice()) : null, tabs(), h('p', { class: 'fc-status', 'aria-hidden': 'true' }, msgText), ...(tab === 'ripasso' ? ripasso() : carte())].filter(Boolean);
  const go = t => { tab = t; phase = 'start'; clearNote(); render(); };

  /* ---------- Scenari demo e sezioni ---------- */
  const SCEN = [['normale', 'Carte da ripassare'], ['finito', 'Nessuna carta oggi'], ['vuoto', 'Mazzo vuoto'], ['parziale', 'Archivio parziale']];
  const scenBar = () => h('details', { class: 'fc-scen' }, h('summary', {}, h('span', {}, 'Scenari demo · solo prototipo'), h('b', {}, SCEN.find(x => x[0] === scen)[1])),
    h('div', { class: 'fc-scen-o', role: 'group', 'aria-label': 'Scegli lo scenario dimostrativo' }, SCEN.map(([k, l]) => h('button', { type: 'button', class: 'fc-btn', ...K('sc-' + k), 'aria-pressed': String(scen === k), onclick: () => setScen(k) }, l))));
  function setScen(k) { clearNote(); scen = k; deck = deckFor(k); tab = 'ripasso'; phase = 'start'; filter = 'all'; due = []; idx = 0; stats = { reviewed: 0, correct: 0, xp: 0 }; skipped = 0; render(); }
  const tabs = () => h('nav', { class: 'fc-tabs', 'aria-label': 'Sezioni di Flashcard' }, [['ripasso', 'Ripasso'], ['carte', 'Tutte le carte']].map(([k, l]) => h('button', { type: 'button', ...K('tab-' + k), ...(tab === k ? { 'aria-current': 'page' } : {}), onclick: () => go(k) }, l)));

  /* ---------- Ripasso ---------- */
  function ripasso() { return phase === 'session' ? session() : phase === 'done' ? done() : start(); }
  function start() {
    const dueNow = deck.filter(isDue), n = dueNow.length, fresh = dueNow.filter(c => !c.next_review_date).length, over = dueNow.filter(c => c.next_review_date && c.next_review_date < TODAY).length, today = n - fresh - over;
    const bySub = SUBJECTS.map(s => [s, dueNow.filter(c => c.subject === s).length]).filter(x => x[1]);
    let hero;
    if (!deck.length) hero = h('section', { class: 'card fc-hero', 'aria-labelledby': 'fc-ht' }, h('h2', { class: 'fc-big', id: 'fc-ht' }, 'Nessuna carta ancora'), h('p', { class: 'fc-how' }, 'Crea la prima carta con una domanda e la sua risposta: tornerà nel ripasso quando sarà il momento.'), h('div', { class: 'fc-acts' }, h('button', { class: 'fc-btn pri big', type: 'button', ...K('start'), onclick: () => openCard(null) }, '+ Aggiungi la prima carta')));
    else if (!n) { const next = deck.map(c => c.next_review_date).filter(Boolean).sort()[0], nextN = deck.filter(c => c.next_review_date === next).length;
      hero = h('section', { class: 'card fc-hero ok', 'aria-labelledby': 'fc-ht' }, h('h2', { class: 'fc-big', id: 'fc-ht' }, 'Nessuna carta da ripassare oggi'), h('p', { class: 'fc-how' }, `Non hai carte in scadenza. Il prossimo ripasso è ${fmtShort(next)}: ${nextN} ${nextN === 1 ? 'carta' : 'carte'}.`), h('div', { class: 'fc-acts' }, h('button', { class: 'fc-btn pri big', type: 'button', ...K('start'), onclick: () => go('carte') }, 'Vedi tutte le carte'))); }
    else hero = h('section', { class: 'card fc-hero', 'aria-labelledby': 'fc-ht' }, h('h2', { class: 'fc-big', id: 'fc-ht' }, 'Da ripassare oggi'),
      h('div', { class: 'fc-count' }, h('b', {}, String(n)), h('span', {}, n === 1 ? 'carta' : 'carte')),
      h('div', { class: 'fc-chips', 'aria-label': 'Composizione del ripasso' }, fresh ? h('span', { class: 'fc-chip' }, `${fresh} ${fresh === 1 ? 'nuova' : 'nuove'}`) : null, over ? h('span', { class: 'fc-chip' }, `${over} ${over === 1 ? 'scaduta' : 'scadute'}`) : null, today ? h('span', { class: 'fc-chip' }, `${today} di oggi`) : null, ...bySub.map(([s, c]) => h('span', { class: 'fc-chip', style: '--c:' + sc(s) }, h('i', {}), `${s} ${c}`))),
      h('div', { class: 'fc-acts' }, h('button', { class: 'fc-btn pri big', type: 'button', ...K('start'), onclick: startSession }, `Inizia il ripasso · ${n} ${n === 1 ? 'carta' : 'carte'}`)),
      h('p', { class: 'fc-how' }, 'Leggi la domanda, mostra la risposta e di’ quanto ti ricordavi. Da 3 in su la carta torna più avanti; sotto 3 torna domani.'));
    const total = deck.length, mature = deck.filter(c => (c.interval ?? 0) >= 21).length, ef = total ? (deck.reduce((s, c) => s + (c.easiness_factor ?? 2.5), 0) / total).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
    const side = h('div', { class: 'fc-sec' }, h('section', { class: 'card fc-card', 'aria-labelledby': 'fc-nm' }, h('h2', { id: 'fc-nm' }, 'Il mazzo in numeri'), h('div', { class: 'fc-nums' }, [['Totale', total], ['Nuove', deck.filter(c => !c.next_review_date).length], ['Mature', mature], ['Facilità media', ef]].map(([l, v]) => h('div', { class: 'fc-num' }, h('b', {}, String(v)), h('small', {}, l)))), h('p', { class: 'fc-s', style: 'margin-top:8px' }, 'Mature: intervallo di almeno 21 giorni. La facilità media è il fattore SM-2 medio.')), links());
    return [h('div', { class: 'fc-cols' }, hero, side)];
  }
  const links = () => h('section', { class: 'card fc-card', 'aria-labelledby': 'fc-lk' }, h('h2', { id: 'fc-lk' }, 'Fuori da Flashcard'), h('div', { class: 'fc-list' }, [['studio', 'Studio', 'Le carte nascono anche dalle note con KnowStudy; qui le ripassi e le gestisci', '/studio_polymath_v4.html'], ['engineer', 'Engineer', 'Usa lo stesso mazzo e lo stesso ripasso', '/engineer.html']].map(([id, n, w, to]) => h('button', { type: 'button', class: 'fc-lnk', ...K('lk-' + id), onclick: () => nav(to) }, h('span', {}, h('b', {}, n), h('small', {}, w)), h('span', { class: 'go' }, 'Apri')))));

  function startSession() {
    due = deck.filter(isDue).sort(byDate); idx = 0; flipped = false; stats = { reviewed: 0, correct: 0, xp: 0 }; skipped = 0; clearNote();
    if (!due.length) { phase = 'start'; render(); return; }
    phase = 'session'; render('reveal');
  }
  function session() {
    const c = due[idx], n = due.length, pct = Math.round(idx / n * 100);
    const face = h('section', { class: 'card fc-face' + (flipped ? ' rev' : ''), 'aria-label': flipped ? 'Domanda e risposta' : 'Domanda' },
      h('div', { class: 'fc-ql' }, flipped ? 'Domanda' : 'Che cosa rispondi?'), h('div', { class: 'fc-q', id: 'fc-q' }, c.question),
      flipped ? [h('div', { class: 'fc-ql', style: 'margin-top:6px' }, 'Risposta'), h('div', { class: 'fc-a', id: 'fc-a', tabindex: '-1' }, c.answer), c.note ? h('div', { class: 'fc-nt' }, c.note) : null] : null);
    const rate = flipped ? h('section', { class: 'fc-rate', 'aria-labelledby': 'fc-rt' }, h('h3', { id: 'fc-rt', tabindex: '-1' }, 'Quanto ti ricordavi?'),
      [['no', 'Da rifare: la carta torna domani', RATES.slice(0, 3)], ['yes', 'Corretta: la carta torna più avanti', RATES.slice(3)]].map(([cls, label, opts]) => h('div', { class: 'fc-grp', role: 'group', 'aria-label': label }, h('div', { class: 'fc-gl ' + cls }, label),
        h('div', { class: 'fc-opts' }, opts.map(([q, name, sub]) => h('button', { type: 'button', class: 'fc-opt ' + cls, ...K('rate' + q), 'aria-label': `${q}, ${name}: ${sub}`, onclick: () => rateCard(q) }, h('b', {}, String(q)), h('span', { class: 'fc-nm' }, name), h('small', {}, sub))))))) : null;
    return [h('div', { class: 'fc-sess' },
      h('div', { class: 'fc-top' }, h('div', { class: 'fc-chips' }, subjPill(c.subject), !c.next_review_date ? h('span', { class: 'fc-pill cy' }, 'Nuova') : null), h('button', { type: 'button', class: 'fc-btn ghost', ...K('exit'), onclick: exitSession }, 'Esci dal ripasso')),
      h('div', { class: 'fc-prog' }, h('div', { class: 'fc-pl' }, h('span', {}, h('b', {}, `Posizione ${idx + 1} di ${n}`)), h('span', {}, `${stats.reviewed} ${stats.reviewed === 1 ? 'valutata' : 'valutate'}${skipped ? ' · ' + skipped + ' saltata' + (skipped > 1 ? 'e' : '') : ''}`)), h('div', { class: 'seg', role: 'img', 'aria-label': `Posizione ${idx + 1} di ${n} nella sessione` }, h('i', { style: `width:${pct}%` }))),
      face, rate,
      h('div', { class: 'fc-acts' }, !flipped ? h('button', { type: 'button', class: 'fc-btn pri big', ...K('reveal'), onclick: reveal }, 'Mostra la risposta') : h('button', { type: 'button', class: 'fc-btn ghost', ...K('skip'), onclick: skip }, 'Salta per ora')))];
  }
  function reveal() { flipped = true; render(false); document.getElementById('fc-rt')?.focus({ preventScroll: true }); }
  function rateCard(q) {
    const c = due[idx], res = sm2(c, q); Object.assign(c, res); stats.reviewed++; if (q >= 3) stats.correct++; stats.xp += xpFor(q);
    const name = RATES[q][1], msg = `Valutata «${name}» (simulato, non salvato): la carta torna ${when(res.interval)}.`;
    next(); note(msg);
  }
  function skip() { skipped++; next(); note('Carta saltata: resta da ripassare nella prossima sessione.'); }
  function next() { idx++; flipped = false; if (idx >= due.length) { phase = 'done'; render(false); document.getElementById('fc-dt')?.focus({ preventScroll: true }); } else render('reveal'); }
  function exitSession() { phase = 'start'; clearNote(); render('start'); note(`Ripasso interrotto: ${stats.reviewed} ${stats.reviewed === 1 ? 'carta valutata resta salvata' : 'carte valutate restano salvate'} (simulato). Le altre tornano nel prossimo ripasso.`); }
  function done() {
    const left = skipped;
    return [h('div', { class: 'fc-sess fc-done' }, h('section', { class: 'card fc-hero ok', 'aria-labelledby': 'fc-dt' }, h('h2', { class: 'fc-big', id: 'fc-dt', tabindex: '-1' }, stats.reviewed ? 'Sessione completata' : 'Ripasso concluso senza valutazioni'),
      h('div', { class: 'fc-stats' }, [['Ripassate', stats.reviewed], ['Corrette', stats.correct], ['XP simulati', '+' + stats.xp]].map(([l, v]) => h('div', { class: 'fc-num' }, h('b', {}, String(v)), h('small', {}, l)))),
      h('p', { class: 'fc-how' }, left ? `${left} ${left === 1 ? 'carta saltata resta da ripassare' : 'carte saltate restano da ripassare'}. «Corrette» sono le carte valutate da 3 in su.` : '«Corrette» sono le carte valutate da 3 in su. Gli XP seguono la regola del prodotto: 2 per ogni ripasso, più 7 da 3 in su.'),
      h('div', { class: 'fc-acts' }, h('button', { class: 'fc-btn pri big', type: 'button', ...K('start'), onclick: startSession }, 'Nuova sessione'), h('button', { class: 'fc-btn', type: 'button', ...K('to-list'), onclick: () => go('carte') }, 'Vedi tutte le carte'))))];
  }

  /* ---------- Tutte le carte ---------- */
  const status = c => !c.next_review_date ? ['Nuova', 'cy'] : c.next_review_date < TODAY ? ['Scaduta', 'wn'] : c.next_review_date === TODAY ? ['Da ripassare oggi', 'cy'] : (c.interval ?? 0) >= 21 ? ['Matura', 'ok'] : ['Prossimo: ' + fmtShort(c.next_review_date), ''];
  function carte() {
    const subs = SUBJECTS.filter(s => deck.some(c => c.subject === s)), list = deck.filter(c => filter === 'all' || c.subject === filter);
    return [h('section', { class: 'card fc-card', style: 'display:grid;gap:12px', 'aria-labelledby': 'fc-all' }, h('div', { class: 'fc-hd' }, h('div', {}, h('h2', { id: 'fc-all', style: 'margin:0' }, 'Tutte le carte'), h('p', { class: 'hint' }, `${deck.length} ${deck.length === 1 ? 'carta' : 'carte'} nel mazzo`)), h('button', { class: 'fc-btn pri', type: 'button', ...K('newc'), onclick: () => openCard(null) }, '+ Nuova carta')),
      deck.length ? h('div', { class: 'fc-chips', role: 'group', 'aria-label': 'Filtra per materia' }, [['all', 'Tutte', deck.length], ...subs.map(s => [s, s, deck.filter(c => c.subject === s).length])].map(([k, l, n]) => h('button', { type: 'button', class: 'fc-chip' + (filter === k ? ' sel' : ''), ...K('f-' + k), 'aria-pressed': String(filter === k), onclick: () => { filter = k; render(); } }, `${l} ${n}`))) : null,
      list.length ? h('div', { class: 'fc-grid' }, list.map(c => { const [lb, cl] = status(c); return h('button', { type: 'button', class: 'fc-item', style: '--c:' + sc(c.subject), ...K('card-' + c.id), 'aria-label': `Modifica la carta: ${c.question}`, onclick: () => openCard(c) },
        h('span', { class: 'fc-im' }, subjPill(c.subject)), h('span', { class: 'fc-iq' }, c.question), h('span', { class: 'fc-im' }, h('span', { class: 'fc-pill ' + cl }, lb), c.interval ? h('span', { class: 'fc-s' }, `Intervallo ${c.interval} ${c.interval === 1 ? 'giorno' : 'giorni'} · Facilità ${(c.easiness_factor ?? 2.5).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`) : null)); }))
        : h('div', { class: 'fc-empty' }, h('b', {}, 'Nessuna carta ancora'), h('span', {}, 'Crea una carta per iniziare.'), h('button', { class: 'fc-btn pri', type: 'button', ...K('firstc'), onclick: () => openCard(null) }, '+ Aggiungi la prima carta'))), links()];
  }

  /* ---------- Finestre ---------- */
  function dialog(title, body) { lastK = document.activeElement?.dataset?.k || null; document.getElementById('dlg-t').textContent = title; document.getElementById('dlg-b').replaceChildren(h('p', { class: 'fc-sim' }, 'Simulazione · nessun salvataggio'), body); if (!dlg.open) dlg.showModal(); }
  function closeDlg() { if (dlg.open) dlg.close(); }
  document.getElementById('dlg-x').onclick = closeDlg;
  dlg.addEventListener('close', () => { if (lastK) document.querySelector(`[data-k="${lastK}"]`)?.focus({ preventScroll: true }); });
  dlg.addEventListener('click', e => { if (e.target === dlg) closeDlg(); });
  function openCard(c) {
    const err = h('p', { class: 'fc-err', role: 'alert' }), sel = h('select', { id: 'c-sub' }, h('option', { value: '' }, 'Seleziona una materia…'), SUBJECTS.map(s => h('option', { value: s, ...(c?.subject === s ? { selected: '' } : {}) }, s)), h('option', { value: '__custom__' }, '+ Altra materia'));
    const custom = h('input', { id: 'c-custom', type: 'text', placeholder: 'Nome della materia', hidden: '' }), q = h('textarea', { id: 'c-q', placeholder: 'Es: Quanto vale la derivata di sin(x)?' }, c?.question || ''), a = h('textarea', { id: 'c-a', placeholder: 'Es: cos(x)' }, c?.answer || ''), nt = h('input', { id: 'c-n', type: 'text', placeholder: 'Riferimento, formula, esempio…', value: c?.note || '' });
    sel.onchange = () => { custom.hidden = sel.value !== '__custom__'; if (!custom.hidden) custom.focus(); };
    const f = (id, label, ...els) => h('label', { class: 'fc-f', for: id }, h('span', {}, label), ...els);
    const form = h('form', { class: 'fc-form', novalidate: '' }, f('c-sub', 'Materia', sel, custom), f('c-q', 'Domanda (fronte)', q), f('c-a', 'Risposta (retro)', a), f('c-n', 'Nota (facoltativa)', nt), err,
      c?.interval ? h('p', { class: 'fc-s' }, `Stato del ripasso: intervallo ${c.interval} giorni, prossimo ripasso ${fmtShort(c.next_review_date)}. Modificare il testo non lo azzera.`) : null,
      h('div', { class: 'fc-fa' }, h('button', { class: 'fc-btn pri', type: 'submit', ...K('csave') }, c ? 'Salva modifiche (simulato)' : 'Salva carta (simulato)'), h('button', { class: 'fc-btn', type: 'button', onclick: closeDlg }, 'Annulla')));
    form.onsubmit = e => { e.preventDefault(); const subject = sel.value === '__custom__' ? custom.value.trim() : sel.value, question = q.value.trim(), answer = a.value.trim();
      if (!subject || !question || !answer) { err.textContent = 'Inserisci materia, domanda e risposta.'; (!subject ? (sel.value === '__custom__' ? custom : sel) : !question ? q : a).focus(); return; }
      if (c) Object.assign(c, { subject, question, answer, note: nt.value.trim() }); else deck.push({ id: 'x' + (++nid), subject, question, answer, note: nt.value.trim() });
      closeDlg(); render(); note((c ? 'Carta modificata' : 'Carta aggiunta') + ' (simulato, non salvato).' + (c ? '' : ' È nuova: compare nel prossimo ripasso.')); };
    dialog(c ? 'Modifica la carta' : 'Nuova carta', form); setTimeout(() => q.focus(), 0);
  }
  function moduleDialog(id, title, body) { const d = h('dialog', { id, 'aria-labelledby': id + '-title' }); d.append(h('div', { class: 'dh' }, h('h2', { id: id + '-title' }, title), h('button', { class: 'chip', type: 'button', 'aria-label': 'Chiudi', onclick: () => d.close() }, '✕')), h('div', { class: 'db' }, body)); d.addEventListener('click', e => { if (e.target === d) d.close(); }); document.body.append(d); return d; }
  const APP_GROUPS = [
    ['Quotidiano', [['☰', 'Diario della giornata'], ['⚔', 'Missioni'], ['▦', 'Calendario'], ['✦', 'Planner AI'], ['◷', 'Weekly Review'], ['⚖', 'Decisioni']]],
    ['Apprendimento', [['🎓', 'Studio'], ['📚', 'Library'], ['🃏', 'Flashcard', 'questa pagina'], ['⚙', 'Engineer']]],
    ['Corpo e creatività', [['🏋', 'Leo Protocol'], ['⚡', 'Recovery'], ['🎨', 'Arte & Musica'], ['🏛', 'Agora'], ['🎌', 'Agora Anime']]],
    ['Gioco', [['⚔', 'Life RPG'], ['🌌', 'Dungeon']]],
    ['Intelligenza', [['◎', 'Jarvis'], ['✦', 'Second Brain'], ['✧', 'Idea Hub', 'sezione autonoma · da progettare'], ['🤖', 'AI Coach'], ['⚙', 'Profilo operativo']]],
    ['Sistema', [['⚙', 'Impostazioni'], ['⛁', 'Backup e ripristino'], ['🔑', 'Chiave API'], ['⚡', 'PolyFeed']]]
  ];
  const appSearch = h('input', { class: 'field', type: 'search', placeholder: 'Cerca una sezione…', 'aria-label': 'Cerca una sezione', style: 'width:100%' }), appList = h('div', {});
  const drawApps = () => { const qy = appSearch.value.trim().toLocaleLowerCase('it'); appList.replaceChildren(); let n = 0;
    for (const [g, items] of APP_GROUPS) { const ms = items.filter(([, l]) => l.toLocaleLowerCase('it').includes(qy)); if (!ms.length) continue; n += ms.length;
      appList.append(h('div', { class: 'grp' }, h('h3', {}, g), h('div', { class: 'items' }, ms.map(([ic, l, nt]) => h('button', { class: 'item', type: 'button', onclick: () => { dApps.close(); if (l === 'Flashcard') go('ripasso'); else note('Collegamento simulato: ' + l + '.'); } }, h('span', { class: 'ic', 'aria-hidden': 'true' }, ic), h('span', { class: 'l' }, l, nt ? h('small', {}, nt) : null)))))); }
    if (!n) appList.append(h('p', { class: 'empty' }, 'Nessuna sezione trovata.')); };
  appSearch.addEventListener('input', drawApps); drawApps();
  const dApps = moduleDialog('fc-apps', 'Tutte le app', h('div', {}, h('div', { class: 'sim' }, 'Collegamenti simulati · nessuna funzione esterna viene aperta'), appSearch, appList));
  const dSet = moduleDialog('fc-settings', 'Impostazioni', h('div', {}, h('div', { class: 'sim' }, 'Anteprima della struttura · le voci d\'esempio non modificano l\'app'), h('div', { class: 'legend' }, h('span', {}, h('span', { class: 'badge real' }, 'Esistente'), ' già presente nell\'app'), h('span', {}, h('span', { class: 'badge ex' }, 'Esempio'), ' solo del prototipo')),
    h('div', { class: 'grp' }, h('h3', {}, 'Dati e sicurezza'), h('div', { class: 'set' }, [['Backup e ripristino', 'Esistente in Impostazioni'], ['Chiave API', 'Esistente nell\'Hub']].map(([l, d]) => h('button', { class: 'sw', type: 'button', onclick: () => note(l + ' · anteprima simulata') }, h('span', { class: 'l' }, l, h('small', {}, d)), h('span', { class: 'badge real' }, 'Esistente'))))),
    h('div', { class: 'grp' }, h('h3', {}, 'Flashcard'), h('div', { class: 'set' }, [['Limite di carte per sessione', 'Esempio · oggi non esiste'], ['Scorciatoie da tastiera per i voti', 'Esempio · oggi non esistono']].map(([l, d]) => h('button', { class: 'sw', type: 'button', onclick: () => note(l + ' · voce d\'esempio') }, h('span', { class: 'l' }, l, h('small', {}, d)), h('span', { class: 'badge ex' }, 'Esempio')))))));
  document.getElementById('appsBtn').addEventListener('click', () => dApps.showModal());
  document.getElementById('setBtn').addEventListener('click', () => dSet.showModal());

  window.__fc = { setScen, go, get state() { return { scen, tab, phase, idx, flipped, due: due.length, deck: deck.length, stats: { ...stats }, skipped }; } };
  render();
})();
