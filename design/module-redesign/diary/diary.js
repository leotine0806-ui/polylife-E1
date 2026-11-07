/* Diario · prototipo E1. Fixture sintetiche (27 ottobre – 2 novembre 2026), stato solo in memoria: al ricaricamento tutto torna come prima.
   Nessun modello, rete o persistenza. Missioni e orari sono mostrati in sola lettura: si modificano nelle sezioni proprietarie. */
(() => {
  const TODAY = '2026-11-02';
  const DAYS = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  const parse = s => new Date(s + 'T12:00:00');
  const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fmt = s => parse(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  const blank = () => ({ mission: '', task1: '', task2: '', task3: '', constraint: '', minimum: '', scores: {}, note: '' });
  const fixture = {
    '2026-10-27': { mission: 'Fare una cosa alla volta.', task1: 'Rivedere appunti di fisica', task2: 'Camminata dopo cena', task3: 'Preparare lo zaino', constraint: 'Rientro tardi', minimum: 'Dieci minuti di lettura', scores: { prod: 3, energy: 3, focus: 2 }, note: 'La pausa fuori ha aiutato.' },
    '2026-10-28': { mission: 'Tenere il ritmo senza correre.', task1: 'Completare il ripasso', task2: 'Pausa vera tra le sessioni', task3: '', constraint: 'Poche ore di sonno', minimum: 'Pranzo senza schermo', scores: { prod: 4, energy: 2, focus: 3 }, note: 'Meglio dopo aver fatto una pausa.' },
    '2026-10-29': { mission: 'Cominciare dal passo più piccolo.', task1: 'Leggere il capitolo 4', task2: '', task3: '', constraint: 'Allenamento nel pomeriggio', minimum: 'Preparare la giornata di domani', scores: { prod: 4, energy: 4, focus: 4 }, note: 'La prima attività era quella giusta.' },
    '2026-10-30': { mission: 'Lasciare spazio agli imprevisti.', task1: 'Consegnare esercizio', task2: 'Fare la spesa', task3: '', constraint: 'Impegno familiare', minimum: 'Andare a dormire in orario', scores: { prod: 2, energy: 3, focus: 2 }, note: 'Giornata piena; ho salvato il minimo.' },
    '2026-10-31': blank(),
    '2026-11-01': { mission: 'Recuperare con calma.', task1: 'Riordinare gli appunti', task2: 'Uscire a camminare', task3: '', constraint: '', minimum: '', scores: { prod: 3, energy: 4, focus: 3 }, note: 'Pomeriggio tranquillo.' },
    '2026-11-02': { mission: 'Affrontare una cosa alla volta, senza pretendere che tutto sia perfetto.', task1: 'Ripasso capitolo 4', task2: 'Allenamento gambe', task3: 'Riordinare appunti di storia', links: { 1: { title: 'Ripasso capitolo 4', completed: false } }, constraint: 'Rientro e allenamento occupano il pomeriggio.', minimum: 'Proteggere una pausa senza telefono.', scores: { prod: 4, energy: 3, focus: 4 }, note: 'Ho iniziato dal capitolo e ho trovato un buon ritmo.', agenda: [['15:30', 'Rientro'], ['17:00', 'Allenamento']] }
  };
  const FIELDS = { intention: 'mission', pri1: 'task1', pri2: 'task2', pri3: 'task3', limit: 'constraint', minimum: 'minimum', evening: 'note' };
  const SCALES = [['prod', 'Produttività'], ['energy', 'Energia fisica'], ['focus', 'Focus mentale']];

  let date = TODAY, view = 'day', aiResult = '', saved = '', draft = null;
  const root = document.getElementById('root'), dlg = document.getElementById('dlg'), live = document.getElementById('live');
  const K = k => ({ 'data-k': k });
  const note = msg => { live.textContent = ''; setTimeout(() => { live.textContent = msg; }, 40); };
  const btn = (label, k, fn, cls = '') => h('button', { type: 'button', class: 'di-btn ' + cls, ...K(k), onclick: fn }, label);
  const link = (href, label, sub, k) => h('a', { class: 'di-link', href, ...K(k) }, h('span', {}, label, sub ? h('small', {}, ' · ' + sub) : null));
  const tag = (cls, t) => h('span', { class: 'di-tag ' + cls }, t);
  const card = (id, title, extra, ...body) => h('section', { class: 'card di-card', 'aria-labelledby': id }, h('div', { class: 'di-hd' }, h('h2', { id }, title), extra || null), ...body);
  const hasEntry = d => !!(d.mission || d.task1 || d.task2 || d.task3 || d.constraint || d.minimum || d.note || Object.values(d.scores || {}).some(Boolean));
  const scoreCount = d => Object.values(d.scores || {}).filter(Boolean).length;

  /* La bozza della giornata aperta vive qui finché non si salva nella demo. */
  function day() { if (!draft || draft.date !== date) draft = { date, data: structuredClone(fixture[date] || blank()), dirty: false }; return draft.data; }
  function field(label, id, rows, ph) {
    const d = day();
    return h('label', { class: 'di-field', for: id }, h('span', {}, label), h('textarea', { class: 'di-textarea', id, rows, placeholder: ph, oninput: e => { d[FIELDS[id]] = e.target.value; draft.dirty = true; saved = ''; paintSave(); } }, d[FIELDS[id]] || ''));
  }
  function render(focusK) {
    const fk = focusK === false ? null : focusK || document.activeElement?.dataset?.k, top = window.scrollY;
    root.replaceChildren(datebar(), ...(view === 'week' ? weekView() : view === 'insights' ? insightsView() : dayView()));
    if (fk) [fk, 'view-' + view].map(k => document.querySelector(`[data-k="${k}"]`)).find(Boolean)?.focus({ preventScroll: true });
    window.scrollTo(0, top);
  }
  function goDay(s) { date = s; aiResult = ''; saved = ''; draft = null; render(); }
  const shift = n => { const d = parse(date); d.setDate(d.getDate() + n); return key(d); };

  function datebar() {
    const d = parse(date);
    return h('div', { class: 'di-datebar' },
      h('div', { class: 'di-date-actions' }, btn('‹', 'day-prev', () => goDay(shift(-1)), 'ghost'), btn('Oggi', 'day-today', () => goDay(TODAY), 'ghost'), h('button', { type: 'button', class: 'di-btn ghost', ...K('day-next'), 'aria-label': 'Giorno successivo', ...(date >= TODAY ? { disabled: '' } : {}), onclick: () => goDay(shift(1)) }, '›')),
      h('div', { class: 'di-date-title' }, h('span', { class: 'eyebrow' }, DAYS[d.getDay()].toUpperCase() + (date === TODAY ? ' · OGGI' : ' · GIORNATA PERSONALE')), h('strong', {}, fmt(date))),
      h('nav', { class: 'di-views', 'aria-label': 'Viste del Diario' }, [['day', 'Giornata'], ['week', '7 giorni'], ['insights', 'Spunti']].map(([k, l]) => h('button', { type: 'button', ...K('view-' + k), ...(view === k ? { 'aria-current': 'page' } : {}), onclick: () => { view = k; render(); } }, l))));
  }

  /* ---------- Giornata ---------- */
  function dayView() {
    const d = day(), entry = hasEntry(d);
    const empty = !entry ? h('p', { class: 'di-empty', role: 'status' }, 'Nessuna annotazione registrata per questo giorno. Puoi scriverne una adesso: resterà solo nella demo. Un giorno vuoto non è un giorno «fallito».') : null;
    const intent = card('d-int', '01 · Intenzione della giornata', tag('rec', 'Tua'), h('p', { class: 'di-intro' }, 'Una direzione personale per oggi. Non crea missioni e non prenota orari.'), field('Come vuoi affrontare la giornata?', 'intention', 3, 'Scrivi un’intenzione per te…'));
    intent.classList.add('di-intent');
    const pri = card('d-pri', '02 · Priorità personali annotate', tag('rec', 'Tue'), h('p', { class: 'di-intro' }, 'Note per te, non missioni. Se una nota corrisponde a una missione, qui ne vedi lo stato in sola lettura.'),
      h('div', { class: 'di-priorities' }, [1, 2, 3].map(n => { const ln = d.links?.[n]; return h('article', { class: 'di-priority', style: `--pc:${n === 1 ? 'var(--cyan)' : n === 2 ? 'var(--blue)' : 'var(--purple)'}` }, h('span', { class: 'di-priority-num' }, '0' + n), field('Annotazione', 'pri' + n, 2, 'Una cosa importante da ricordare…'),
        ln ? h('div', { class: 'di-ref' }, h('span', {}, tag('ro', 'Missioni · sola lettura')), h('span', {}, `«${ln.title}» · ${ln.completed ? 'completata' : 'da completare'}`), link('../missions/index.html', 'Apri in Missioni', null, 'pri-ln-' + n)) : h('p', { class: 'di-fine' }, 'Nota personale · nessuna missione collegata')); })));
    const two = h('div', { class: 'di-two' },
      card('d-lim', '03 · Limite dichiarato', null, field('Che cosa rende oggi più difficile?', 'limit', 3, 'Un ostacolo o un vincolo, come lo descrivi tu…')),
      card('d-min', '04 · Minimo personale', null, field('Che cosa vuoi provare a proteggere?', 'minimum', 3, 'Un desiderio personale, non un obbligo…')));
    const evening = card('d-eve', '05 · Chiusura della giornata', tag('rec', 'Tue'), h('p', { class: 'di-intro' }, 'Valutazioni dichiarate da te da 1 a 5, non misure automatiche. Premi di nuovo lo stesso numero per toglierla.'),
      h('div', { class: 'di-review' }, SCALES.map(([k, label]) => h('div', { class: 'di-scale', role: 'group', 'aria-label': label }, h('span', {}, label + (d.scores?.[k] ? ` · ${d.scores[k]}/5` : ' · non indicata')), h('div', { class: 'di-starrow' }, [1, 2, 3, 4, 5].map(n => h('button', { type: 'button', class: 'di-star', ...K(`sc-${k}-${n}`), 'aria-label': `${label}: ${n} su 5`, 'aria-pressed': String(Number(d.scores?.[k]) === n), onclick: () => { d.scores = d.scores || {}; d.scores[k] = d.scores[k] === n ? 0 : n; draft.dirty = true; saved = ''; render(); } }, String(n))))))),
      field('Riflessione serale', 'evening', 3, 'Che cosa ha funzionato? Che cosa cambieresti?'));
    const save = h('div', { class: 'di-savebar' }, btn('Salva nella demo', 'save', saveDemo, 'primary'), h('p', { class: 'di-save-state', id: 'save-state', role: 'status' }), btn('Annulla modifiche', 'revert', () => { draft = null; saved = ''; render(); note('Modifiche annullate: torna la versione di partenza della demo.'); }, 'ghost'));
    const left = h('div', { class: 'di-stack' }, empty, intent, pri, two, evening, save);
    const links = Object.values(d.links || {}), done = links.filter(l => l.completed).length;
    const status = card('d-st', 'Dalle altre sezioni', tag('ro', 'Sola lettura'), h('div', { class: 'di-stats' }, h('div', { class: 'di-stat' }, h('strong', {}, String(links.length)), h('span', {}, 'missioni collegate')), h('div', { class: 'di-stat' }, h('strong', {}, links.length ? `${done}/${links.length}` : '—'), h('span', {}, 'completate in Missioni')), h('div', { class: 'di-stat' }, h('strong', {}, scoreCount(d) ? `${scoreCount(d)}/3` : '—'), h('span', {}, 'valutazioni serali'))),
      d.agenda ? h('div', { class: 'di-list' }, h('p', { class: 'di-fine' }, 'Orari dal Calendario (fixture):'), ...d.agenda.map(([t, n]) => h('div', { class: 'di-own' }, h('b', {}, t), h('span', {}, n)))) : h('p', { class: 'di-fine' }, 'Nessun orario registrato nel Calendario per questo giorno (fixture).'),
      h('p', { class: 'di-fine' }, 'Completamenti e orari si cambiano solo nelle sezioni proprietarie.'));
    const week = card('d-wk', 'Ultimi 7 giorni', null, h('div', { class: 'di-week' }, weekDays().map(s => weekButton(s))), btn('Apri il riepilogo', 'go-week', () => { view = 'week'; render(); }, 'ghost'));
    const spunti = card('d-sp', 'Spunti', tag('sim', 'Esempio statico'), h('p', { class: 'di-intro' }, 'Un testo d’esempio scritto in anticipo, non generato: nessun modello viene chiamato.'), btn('Apri gli spunti', 'go-insights', () => { view = 'insights'; render(); }, 'ghost'));
    const owners = card('d-own', 'Sezioni proprietarie', null, h('div', { class: 'di-links' }, link('../missions/index.html', 'Missioni', 'attività e completamenti', 'ln-missions'), link('../calendar/index.html', 'Calendario', 'orari e impegni', 'ln-calendar'), link('../jarvis/index.html', 'Atlas', 'conversazioni con l’assistente', 'ln-atlas')), h('p', { class: 'di-fine' }, 'Il Diario conserva solo riflessioni e valutazioni personali.'));
    requestAnimationFrame(paintSave);
    return [h('div', { class: 'di-layout' }, left, h('aside', { class: 'di-stack' }, status, week, spunti, owners))];
  }
  function paintSave() { const el = document.getElementById('save-state'); if (!el) return; el.replaceChildren(saved ? h('b', {}, saved + ' ') : (draft?.dirty ? 'Modifiche non salvate · ' : ''), 'Si salva solo in questa pagina: ricaricando, le modifiche spariscono. Nessuna scrittura nel prodotto.'); }
  function saveDemo() { const d = day(); fixture[date] = structuredClone(d); draft.dirty = false; saved = 'Salvato nella demo.'; paintSave(); note('Salvato solo nella demo: sparirà al ricaricamento.'); }

  /* ---------- 7 giorni ---------- */
  function weekDays() { const d = parse(TODAY); return Array.from({ length: 7 }, (_, i) => { const x = new Date(d); x.setDate(x.getDate() - 6 + i); return key(x); }); }
  function weekButton(s) {
    const d = parse(s), v = fixture[s] || blank(), n = scoreCount(v);
    return h('button', { type: 'button', class: 'di-weekday', ...K('wk-' + s), ...(s === date ? { 'aria-current': 'date' } : {}), 'aria-label': `${DAYS[d.getDay()]} ${d.getDate()}: ${hasEntry(v) ? n + ' valutazioni su 3' : 'nessuna annotazione'}`, onclick: () => { goDay(s); view = 'day'; render(); } },
      h('b', {}, DAYS[d.getDay()].slice(0, 3).toUpperCase()), h('strong', {}, String(d.getDate())), h('span', { class: 'di-dots', 'aria-hidden': 'true' }, [0, 1, 2].map(i => h('i', { class: i < n ? 'on' : '' }))), h('small', {}, hasEntry(v) ? `${n}/3 valutazioni` : 'Nessuna nota'));
  }
  function weekView() {
    const days = weekDays(), entries = days.filter(s => hasEntry(fixture[s] || blank())).length, ratings = days.reduce((a, s) => a + scoreCount(fixture[s] || blank()), 0), notes = days.filter(s => (fixture[s] || {}).note).length;
    return [h('div', { class: 'di-layout' }, h('div', { class: 'di-stack' }, card('w-t', 'Ritmo personale · ultimi 7 giorni', tag('rec', 'Tue annotazioni'), h('p', { class: 'di-intro' }, 'Seleziona un giorno per riaprirlo. Il riepilogo conta solo ciò che hai scritto; non misura la produttività.'), h('div', { class: 'di-week wide' }, days.map(weekButton)),
      h('div', { class: 'di-stats' }, h('div', { class: 'di-stat' }, h('strong', {}, `${entries}/7`), h('span', {}, 'giorni con annotazioni')), h('div', { class: 'di-stat' }, h('strong', {}, String(ratings)), h('span', {}, 'valutazioni presenti')), h('div', { class: 'di-stat' }, h('strong', {}, `${notes}/7`), h('span', {}, 'riflessioni scritte'))))),
      h('aside', { class: 'di-stack' }, card('w-r', 'Regola di lettura', null, h('p', { class: 'di-intro' }, 'Un giorno vuoto significa «nessuna annotazione registrata», non inattività né giornata andata male.'), h('p', { class: 'di-fine' }, 'Il prototipo non calcola medie o tendenze: con poche valutazioni sarebbero fuorvianti.'))))];
  }

  /* ---------- Spunti ---------- */
  function insightsView() {
    const d = day(), entry = hasEntry(d);
    const sources = [['Intenzione', d.mission], ['Priorità annotate', d.task1 || d.task2 || d.task3], ['Limite dichiarato', d.constraint], ['Valutazioni serali', scoreCount(d)]];
    return [h('div', { class: 'di-layout' }, h('div', { class: 'di-stack' }, card('i-t', 'Spunti per il Diario', tag('sim', 'Esempio statico'), h('p', { class: 'di-intro' }, 'Gli spunti qui sono testi d’esempio scritti in anticipo. Nessun modello viene chiamato e nulla lascia la pagina.'),
      h('div', { class: 'di-sources' }, sources.map(([n, v]) => h('div', { class: 'di-source' + (v ? '' : ' off') }, h('strong', {}, n), v ? 'Presente nella giornata selezionata' : 'Vuoto: non sarebbe usato'))),
      entry ? btn('Mostra uno spunto d’esempio', 'ins-go', () => { aiResult = 'Hai annotato una priorità che corrisponde a una missione. Vuoi controllare se il tempo che resta oggi le lascia spazio?'; render(); note('Spunto d’esempio mostrato · nessun modello chiamato'); }, 'primary') : h('p', { class: 'di-empty' }, 'Questo giorno non ha annotazioni: non c’è nulla da cui partire.'),
      aiResult ? h('div', { class: 'di-result', role: 'status' }, tag('sim', 'Esempio · non generato'), h('span', {}, aiResult), h('span', { class: 'di-fine' }, 'Non è un consiglio: è un testo fisso del prototipo.')) : null)),
      h('aside', { class: 'di-stack' }, card('i-r', 'Prima di un invio reale', null, h('div', {}, [['Fonti', 'mostrare quali campi verrebbero usati, uno per uno'], ['Consenso', 'chiedere il permesso prima di ogni invio'], ['Risultato', 'separare lo spunto dalle tue annotazioni']].map(([a, b]) => h('div', { class: 'di-own' }, h('b', {}, a), h('span', {}, b)))), h('p', { class: 'di-fine' }, 'Questo flusso non esiste ancora: è una proposta.'))))];
  }

  /* ---------- Finestre ---------- */
  document.getElementById('dlg-x').onclick = () => dlg.close();
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  let opener = null;
  dlg.addEventListener('close', () => { setTimeout(() => opener?.focus({ preventScroll: true }), 0); });
  function openDialog(title, body, from) { opener = from; document.getElementById('dlg-t').textContent = title; document.getElementById('dlg-b').replaceChildren(h('p', { class: 'di-sim' }, 'Anteprima · nessun collegamento reale'), body); dlg.showModal(); }
  const apps = ['Hub', 'Missioni', 'Calendario', 'Planner', 'Studio', 'Flashcard', 'Biblioteca', 'LEO Protocol', 'Recovery', 'Engineer', 'Agora', 'Nexus', 'Second Brain', 'Atlas', 'Life RPG'];
  document.getElementById('appsBtn').addEventListener('click', e => openDialog('Tutte le app', h('div', { class: 'di-list' }, apps.map(n => btn(n, 'app-' + n, () => { dlg.close(); note('Collegamento demo · ' + n); }, 'ghost'))), e.currentTarget));
  document.getElementById('setBtn').addEventListener('click', e => openDialog('Impostazioni', h('p', { class: 'di-intro' }, 'Le impostazioni reali non sono riprodotte. Qui il Diario non salva nulla fuori dalla pagina.'), e.currentTarget));

  window.__diary = { get state() { return { date, view, dirty: !!draft?.dirty, saved: !!saved, entry: hasEntry(day()), scores: { ...day().scores } }; }, go: v => { view = v; render(); } };
  render(false);
})();
