/* Planner · prototipo E1. Funzioni ricavate da src/studio-planner.html. Dati SOLO sintetici, «oggi» fisso.
   Ogni azione che nel prodotto salva, modifica dati o chiama l'AI è SIMULATA in memoria. Nessuna persistenza, nessuna rete. */
(() => {
  const TODAY = '2026-11-02';
  const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  const pad = n => String(n).padStart(2, '0');
  const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => new Date(s + 'T12:00:00');
  const offset = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return key(d); };
  const validDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && key(parse(s)) === s;
  const fmtDate = s => parse(s).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
  const daysUntil = s => Math.round((parse(s) - parse(TODAY)) / 86400000);
  const dur = n => (n >= 60 ? Math.floor(n / 60) + ' h' + (n % 60 ? ' ' + pad(n % 60) : '') : n + ' min');
  const TIPI = ['Verifica scritta', 'Interrogazione', 'Compito in classe', 'Test', 'Esame'];
  const SUBJ = { Elettronica: '#8fa8d6', Storia: '#d6b97f', Fisica: '#e59aab', Chimica: '#88b8a6', Analisi: '#aaa0d0', Matematica: '#7fb0d6' };
  const subjColor = s => SUBJ[s] || '#9aabbd';

  /* ---------- Fixture sintetiche (stessi campi del sorgente: subject, tipo, date, ore, argomenti, note; piano = giorni con attività) ---------- */
  let EX = [
    { id: 'e1', subject: 'Elettronica', tipo: 'Verifica scritta', date: TODAY, ore: 2, argomenti: 'Capitoli 3–4: amplificatori operazionali\nEsercizi tipo dispensa 12–20\nFormule del cap. 2', note: '' },
    { id: 's1', subject: 'Storia', tipo: 'Interrogazione', date: '2026-11-09', ore: 1, argomenti: 'Il Risorgimento: dalle guerre d\'indipendenza\nL\'unità d\'Italia\nLe fonti del cap. 8', note: 'Più debole sulle date' },
    { id: 'f1', subject: 'Fisica', tipo: 'Compito in classe', date: '2026-11-16', ore: 1.5, argomenti: 'Cinematica: moto uniformemente accelerato\nDinamica: leggi di Newton\nEsercizi del libro pag. 80–95', note: '' },
    { id: 'c1', subject: 'Chimica', tipo: 'Test', date: '2026-11-20', ore: 1, argomenti: 'Legami chimici\nTavola periodica', note: '' },
    { id: 'a0', subject: 'Analisi', tipo: 'Esame', date: '2026-10-28', ore: 2, argomenti: 'Limiti e derivate', note: '' }
  ];
  const t = (text, min, done = false) => ({ text, minuti: min, done });
  const day = (date, label, tasks) => ({ date, label, tasks });
  let PLANS = {
    e1: [day('2026-10-31', 'Capitolo 3', [t('Leggere il cap. 3 — amplificatori', 60, true), t('Esercizi 12–14', 40, true)]), day('2026-11-01', 'Capitolo 4', [t('Cap. 4 — retroazione', 60, true), t('Esercizi 15–20', 45)]), day(TODAY, 'Ripasso finale', [t('Ripasso capitoli 3–4', 60), t('Formule del cap. 2', 30)])],
    s1: [day(TODAY, 'Il Risorgimento', [t('Leggere il cap. 8 — prima parte', 45, true), t('Schema cronologico delle date', 20)]), day('2026-11-03', 'Guerre d\'indipendenza', [t('Cap. 8 — seconda parte', 45)]), day('2026-11-05', 'L\'unità d\'Italia', [t('Appunti sull\'unità d\'Italia', 40), t('Domande di verifica', 20)]), day('2026-11-06', 'Fonti', [t('Le fonti del cap. 8', 40)]), day('2026-11-08', 'Ripasso', [t('Ripasso orale ad alta voce', 45)]), day('2026-11-09', 'Interrogazione', [t('Ripasso veloce delle date', 20)])],
    c1: [day('2026-11-12', 'Legami', [t('Legami ionici e covalenti', 40)]), day('2026-11-16', 'Tavola periodica', [t('Gruppi e periodi', 40)]), day('2026-11-20', 'Test', [t('Ripasso generale', 30)])],
    a0: [day('2026-10-26', 'Limiti', [t('Limiti notevoli', 90, true)]), day('2026-10-27', 'Derivate', [t('Derivate e regole', 90, true)])]
  };
  const ISSUE = { c1: 'Percorso di studio da rivedere: la verifica è stata modificata dopo la generazione.' };
  const calWarn = 'Calendario parziale: alcuni archivi contengono dati non riconosciuti o discordanti. Controlla gli originali nelle impostazioni.';

  /* ---------- Stato ---------- */
  let sel = 'e1', proposals = {}, gen = null, confirmDel = null, editing = null;
  let open = { calendario: false, flussi: false }, openDays = {}, calY = 2026, calM = 10;
  const root = document.getElementById('root');
  const exam = id => EX.find(e => e.id === id);
  const planOf = id => PLANS[id] || null;
  const progress = id => { const p = planOf(id) || []; const all = p.flatMap(d => d.tasks); return { n: all.filter(x => x.done).length, tot: all.length, min: all.reduce((s, x) => s + x.minuti, 0), doneMin: all.filter(x => x.done).reduce((s, x) => s + x.minuti, 0) }; };
  const todayTasks = id => (planOf(id) || []).filter(d => d.date === TODAY).flatMap(d => d.tasks).filter(x => !x.done);
  /* Messaggio di stato: nessun elemento sovrapposto alla pagina. Una riga nel flusso (assente quando non c'è un messaggio)
     compare vicino ai progressi del piano e sparisce dopo 4 s; l'annuncio per gli screen reader passa da una regione di stato persistente. */
  let msgText = '', msgTimer = null;
  const statusEl = cls => h('p', { class: 'pstatus' + (cls ? ' ' + cls : '') + (msgText ? ' on' : ''), 'aria-hidden': 'true' }, msgText);
  const note = msg => {
    msgText = msg; const live = document.getElementById('live'); live.textContent = ''; setTimeout(() => { live.textContent = msg; }, 60);
    document.querySelectorAll('.pstatus').forEach(el => { el.textContent = msg; el.classList.add('on'); });
    clearTimeout(msgTimer); msgTimer = setTimeout(() => { msgText = ''; live.textContent = ''; document.querySelectorAll('.pstatus').forEach(el => { el.textContent = ''; el.classList.remove('on'); }); }, 4000);
  };
  const K = k => ({ 'data-k': k });
  const acc = (id, title, summary, body) => h('details', { class: 'card acc', ...(open[id] ? { open: '' } : {}), ontoggle: e => { open[id] = e.target.open; } }, h('summary', {}, h('span', { class: 'at' }, title), h('span', { class: 'as' }, summary)), h('div', { class: 'ab' }, body));

  function render() {
    const fk = document.activeElement?.dataset?.k, top = window.scrollY;
    root.replaceChildren(...build());
    if (fk) document.querySelector(`[data-k="${fk}"]`)?.focus({ preventScroll: true });
    window.scrollTo(0, top);
  }
  function build() {
    return [h('div', { class: 'ptop' }, listCard(), planCard()), h('div', { class: 'psec2' }, flussiAcc(), calAcc())];
  }

  /* ---------- Verifiche in programma ---------- */
  function sortExams() { const up = EX.filter(e => daysUntil(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date)), past = EX.filter(e => daysUntil(e.date) < 0).sort((a, b) => b.date.localeCompare(a.date)); return { up, past }; }
  function listCard() {
    const { up, past } = sortExams(), todayN = up.reduce((s, e) => s + todayTasks(e.id).length, 0), todayMin = up.reduce((s, e) => s + todayTasks(e.id).reduce((m, x) => m + x.minuti, 0), 0);
    const row = e => {
      const d = daysUntil(e.date), p = progress(e.id), plan = planOf(e.id), props = proposals[e.id], isSel = sel === e.id, asking = confirmDel === e.id, tt = todayTasks(e.id);
      const cd = d < 0 ? 'passata' : d === 0 ? '⚠ Oggi' : (d <= 3 ? '⚠ ' : '') + 'tra ' + d + ' gg', urgent = d >= 0 && d <= 3;
      return h('div', { class: 'exrow' + (isSel ? ' sel' : '') + (d < 0 ? ' past' : ''), style: '--sc:' + subjColor(e.subject) },
        h('button', { type: 'button', class: 'exmain', ...K('ex' + e.id), 'aria-pressed': String(isSel), 'aria-label': `${e.subject}, ${e.tipo}, ${fmtDate(e.date)}, ${d < 0 ? 'passata' : d === 0 ? 'oggi' : 'tra ' + d + ' giorni'}`, onclick: () => { sel = e.id; confirmDel = null; render(); } },
          h('span', { class: 'exh' }, h('span', { class: 'exh1' }, h('b', { class: 'exs' }, e.subject), h('span', { class: 'pill st' + (urgent ? ' urg' : '') }, cd), !plan && !props ? h('span', { class: 'pill no' }, 'Nessun piano') : null, plan && ISSUE[e.id] ? h('span', { class: 'pill wn' }, '⚠ Da rivedere') : null),
            h('span', { class: 'ext' }, e.tipo + ' · ' + fmtDate(e.date))),
          h('span', { class: 'expl' }, props ? h('span', { class: 'pill pr' }, 'Anteprima non salvata') : plan ? h('span', { class: 'pill' }, `Piano ${p.n}/${p.tot}`) : null, tt.length ? h('span', { class: 'pill td' }, `Oggi ${tt.length} da fare`) : null)),
        asking ? h('div', { class: 'ask', role: 'alertdialog', 'aria-label': 'Conferma eliminazione' }, h('span', {}, 'Eliminare verifica e piano? Le attività già svolte e i relativi XP vengono conservati.'), h('button', { class: 'chip sm danger', ...K('dy' + e.id), onclick: () => { EX = EX.filter(x => x.id !== e.id); delete PLANS[e.id]; delete proposals[e.id]; confirmDel = null; if (sel === e.id) sel = (sortExams().up[0] || sortExams().past[0] || {}).id || null; render(); note('Eliminazione confermata (simulata). Le attività svolte restano nello storico.'); } }, 'Elimina'), h('button', { class: 'chip sm', ...K('dn' + e.id), onclick: () => { confirmDel = null; render(); } }, 'Annulla'))
          : h('div', { class: 'exa' }, h('button', { class: 'chip sm ghost', ...K('ed' + e.id), 'aria-label': 'Modifica verifica: ' + e.subject, onclick: () => openExam(e) }, h('span', { class: 'lb2' }, 'Modifica'), h('span', { class: 'ic2', 'aria-hidden': 'true' }, '✎')), h('button', { class: 'chip sm ghost', ...K('rm' + e.id), 'aria-label': 'Elimina verifica: ' + e.subject, onclick: () => { confirmDel = e.id; render(); } }, h('span', { class: 'lb2' }, 'Elimina'), h('span', { class: 'ic2', 'aria-hidden': 'true' }, '✕'))));
    };
    return h('section', { class: 'card exlist', 'aria-labelledby': 'ex-t' },
      h('div', { class: 'exh2' }, h('div', {}, h('h2', { id: 'ex-t' }, 'Verifiche in programma'), h('p', { class: 'hint' }, up.length ? `${up.length} in arrivo` + (todayN ? ` · oggi ${todayN} attività da fare (${dur(todayMin)})` : '') : 'Nessuna verifica in arrivo.')),
        h('button', { class: 'chip primary', ...K('newex'), onclick: () => openExam(null) }, '+ Nuova verifica')),
      up.length ? h('div', { class: 'exitems' }, up.map(row)) : h('div', { class: 'empty-day' }, 'Nessuna verifica ancora. Aggiungine una per preparare il piano.'),
      past.length ? h('div', { class: 'pastgrp' }, h('h3', { class: 'sub' }, 'Passate'), past.map(row)) : null);
  }

  /* ---------- Piano di studio della verifica selezionata ---------- */
  function planCard() {
    const e = exam(sel);
    if (!e) return h('section', { class: 'card plan' }, statusEl(), h('div', { class: 'empty-day' }, h('b', {}, 'Nessuna verifica selezionata'), h('div', {}, 'Aggiungi una verifica o selezionala dall\'elenco.')));
    const d = daysUntil(e.date), plan = planOf(e.id), p = progress(e.id), pct = p.tot ? Math.round(p.n / p.tot * 100) : 0, props = proposals[e.id];
    const badge = d > 0 ? d + ' giorni rimasti' : d === 0 ? 'Verifica oggi!' : 'Verifica passata';
    const head = h('div', { class: 'phd2' }, h('div', { class: 'eyebrow' }, 'Piano di studio'), h('h2', { class: 'pt' }, e.subject), h('div', { class: 'pm' }, e.tipo + ' · ' + fmtDate(e.date)),
      h('div', { class: 'pbs' }, h('span', { class: 'pill' + (d >= 0 && d <= 3 ? ' urg' : '') }, badge), h('span', { class: 'pill' }, e.ore + ' h/giorno')));
    const prog = plan ? h('div', { class: 'pprog' }, h('div', { class: 'pg' }, h('b', {}, `${p.n}/${p.tot}`), h('small', {}, 'attività fatte')), h('div', { class: 'pg' }, h('b', {}, dur(p.doneMin)), h('small', {}, 'su ' + dur(p.min))), h('div', { class: 'pbar' }, h('div', { class: 'seg', role: 'img', 'aria-label': `${pct} percento completato` }, h('i', { style: `width:${pct}%` })))) : null;
    const issue = ISSUE[e.id] && plan ? h('p', { class: 'warn2', role: 'status' }, '⚠ ' + ISSUE[e.id] + ' Le attività e i completamenti sono conservati; prepara e applica un nuovo percorso prima di assegnare altri orari.') : null;
    let body;
    if (!plan && (proposals[e.id] || (gen && gen.id === e.id))) body = null;
    else if (!plan) body = h('div', { class: 'pempty' }, h('b', {}, 'Piano non ancora generato'), h('p', { class: 'hint' }, 'Prepara un\'anteprima del percorso di studio. Applica il piano per creare le attività condivise; gli orari si organizzano in Missioni.'),
      d <= 0 ? h('p', { class: 'warn2' }, 'Non restano giorni prima della verifica.') : null, h('button', { class: 'chip primary', ...K('gen'), disabled: !!gen || d <= 0, onclick: () => generate(e) }, 'Genera piano'));
    else body = h('div', { class: 'dlist' }, plan.map((dy, di) => dayRow(e, dy, di)));
    const acts = h('div', { class: 'pact' }, plan ? h('button', { class: 'chip sm', ...K('regen'), disabled: !!gen || (d <= 0 && !proposals[e.id]), title: d <= 0 ? 'Non restano giorni prima della verifica' : '', onclick: () => generate(e) }, 'Rigenera piano') : null, h('button', { class: 'chip sm ghost', ...K('pedit'), onclick: () => openExam(e) }, 'Modifica verifica'));
    return h('section', { class: 'card plan', 'aria-labelledby': 'plan-t' }, head, prog, statusEl(), issue, propBlock(e), body, acts, h('p', { class: 'hint', style: 'margin-top:10px' }, 'Le attività del piano diventano attività di Studio condivise; gli orari si assegnano in Missioni.'));
  }
  function dayRow(e, dy, di) {
    const k = e.id + '|' + dy.date, isToday = dy.date === TODAY, past = dy.date < TODAY, isEx = dy.date === e.date, n = dy.tasks.filter(x => x.done).length, tot = dy.tasks.length, all = tot > 0 && n === tot;
    const isOpen = openDays[k] ?? isToday, nextIdx = isToday ? dy.tasks.findIndex(x => !x.done) : -1;
    return h('div', { class: 'day' + (isToday ? ' today' : '') + (all ? ' alldone' : '') },
      h('button', { type: 'button', class: 'dayh', ...K('dh' + k), 'aria-expanded': String(isOpen), onclick: () => { openDays[k] = !isOpen; render(); } },
        h('span', { class: 'dd' }, fmtDate(dy.date), isToday ? h('span', { class: 'tag today' }, 'Oggi') : past ? h('span', { class: 'tag' }, 'passato') : null), h('span', { class: 'dl' }, (isEx ? '📝 Verifica — ' : '') + dy.label),
        h('span', { class: 'dm' }, dur(dy.tasks.reduce((s, x) => s + x.minuti, 0))), isEx ? h('span', { class: 'tag ex' }, '⚠ Verifica') : null, h('span', { class: 'dp' }, all ? '✓' : `${n}/${tot}`), h('span', { class: 'dc', 'aria-hidden': 'true' }, '▾')),
      isOpen ? h('div', { class: 'dbody' }, dy.tasks.map((tk, ti) => h('div', { class: 'task' + (tk.done ? ' done' : '') + (ti === nextIdx ? ' nxt' : '') },
        h('button', { type: 'button', class: 'chk', ...K('t' + k + ti), 'aria-pressed': String(tk.done), 'aria-label': 'Completa attività: ' + tk.text, onclick: () => { tk.done = !tk.done; render(); note(tk.done ? 'Attività completata (simulato, non salvata).' : 'Completamento annullato (simulato).'); } }, tk.done ? '✓' : ''),
        h('span', { class: 'tt' }, h('span', { class: 'sr' }, ti === nextIdx ? 'Prossima attività. ' : ''), tk.text, ti === nextIdx ? h('span', { class: 'tag nx' }, 'Prossima') : null), h('span', { class: 'tm' }, tk.minuti + ' min'))),
        h('a', { class: 'lnk', href: '#', ...K('org' + k), onclick: ev => { ev.preventDefault(); note('Anteprima di navigazione verso daily-missions.html?date=' + dy.date + ' (nessuna azione).'); } }, 'Organizza questa giornata in Missioni →')) : null);
  }

  /* Generazione simulata e anteprima */
  function generate(e) {
    if (gen) return; if (proposals[e.id]) { return render(); }
    if (daysUntil(e.date) <= 0) { note('Non restano giorni prima della verifica.'); return; }
    const topics = e.argomenti.split('\n').map(x => x.trim()).filter(Boolean);
    const finish = () => { gen = null; const days = []; let i = 0; for (let d = TODAY; d <= e.date; d = offset(d, 1)) { const last = d === e.date, per = Math.max(15, Math.min(e.ore * 60 / 2, 60)); days.push(day(d, last ? 'Ripasso finale' : topics[i % Math.max(1, topics.length)] || 'Studio', last ? [t('Ripasso generale', Math.min(30, e.ore * 60))] : [t(topics[i % Math.max(1, topics.length)] || 'Studio', per)])); if (!last) i++; } proposals[e.id] = { days, message: 'Anteprima didattica simulata (nessun provider chiamato): nessuna modifica salvata. La collocazione oraria spetta a Missioni.' }; render(); note('Anteprima del piano pronta (simulata).'); };
    const tm = setTimeout(finish, 1200); gen = { id: e.id, stop: () => clearTimeout(tm) }; render();
  }
  function propBlock(e) {
    if (gen && gen.id === e.id) return h('div', { class: 'prop', role: 'status' }, h('span', { class: 'tag' }, 'Proposta · non salvata'), h('p', {}, 'Generazione in corso (simulata). Il piano attuale resta consultabile.'), h('button', { class: 'chip sm', ...K('stop'), onclick: () => { gen.stop(); gen = null; render(); note('Generazione annullata. Il piano precedente è conservato.'); } }, 'Interrompi'));
    const pr = proposals[e.id]; if (!pr) return null;
    return h('div', { class: 'prop', role: 'region', 'aria-label': 'Anteprima non salvata' }, h('span', { class: 'tag' }, 'Proposta · non salvata'), h('p', { role: 'status' }, pr.message),
      h('ul', {}, pr.days.flatMap(d => d.tasks.map(x => h('li', {}, fmtDate(d.date) + ' · ' + x.text + ' · ' + x.minuti + ' min')))),
      h('div', { class: 'btnrow' }, h('button', { class: 'chip primary sm', ...K('apply'), onclick: () => { const old = (planOf(e.id) || []).flatMap(d => d.tasks.filter(x => x.done).map(x => d.date + '|' + x.text)); pr.days.forEach(d => d.tasks.forEach(x => { if (old.includes(d.date + '|' + x.text)) x.done = true; })); PLANS[e.id] = pr.days; delete proposals[e.id]; delete ISSUE[e.id]; render(); note('Piano applicato (simulato): nessun dato salvato. Le attività svolte sono conservate.'); } }, 'Applica anteprima'),
        h('button', { class: 'chip sm', ...K('discard'), onclick: () => { delete proposals[e.id]; render(); note('Anteprima scartata. Il piano salvato è conservato.'); } }, 'Scarta anteprima')));
  }

  /* ---------- Colonna secondaria ---------- */
  function flussiAcc() {
    const items = [['Verifica', 'La data, il tipo e gli argomenti: si gestiscono qui.', 'Qui'], ['Piano di studio', 'Le attività da fare giorno per giorno, senza orario: si preparano e si applicano qui.', 'Qui'], ['Missione', 'L\'attività con un orario assegnato per la giornata: si organizza in Missioni.', 'Missioni'], ['Sessione di studio', 'Lo studio già svolto: si registra in Studio e compare in Calendario.', 'Studio · Calendario']];
    return acc('flussi', 'Piani, verifiche, sessioni e missioni', '4 cose diverse', h('div', {}, items.map(([a, b, c]) => h('div', { class: 'fl' }, h('div', { class: 'fh' }, h('b', {}, a), h('span', { class: 'tag' }, c)), h('p', { class: 'hint' }, b))),
      h('div', { class: 'btnrow' }, h('button', { class: 'chip sm', ...K('goM'), onclick: () => note('Apri Missioni (collegamento simulato).') }, 'Apri Missioni'), h('button', { class: 'chip sm', ...K('goC'), onclick: () => note('Apri Calendario (collegamento simulato).') }, 'Apri Calendario'))));
  }
  function calAcc() {
    const evs = {}; const add = (d, c, tx) => (evs[d] ||= []).push({ c, tx });
    EX.forEach(e => add(e.date, 'v', 'Verifica ' + e.subject)); EX.forEach(e => (planOf(e.id) || []).forEach(d => { if (d.date !== e.date) add(d.date, 'p', 'Piano ' + e.subject); }));
    const first = new Date(calY, calM, 1), lead = (first.getDay() + 6) % 7, days = new Date(calY, calM + 1, 0).getDate(), grid = h('div', { class: 'mc', role: 'group', 'aria-label': 'Giorni del mese' }, ['L', 'M', 'M', 'G', 'V', 'S', 'D'].map(l => h('span', { class: 'mcl' }, l)));
    for (let i = 0; i < lead; i++) grid.append(h('span'));
    for (let d = 1; d <= days; d++) { const ds = `${calY}-${pad(calM + 1)}-${pad(d)}`, ev = evs[ds] || [], shown = ev.slice(0, 3), extra = ev.length - shown.length;
      grid.append(h('div', { class: 'mcd' + (ds === TODAY ? ' today' : ''), role: 'group', 'aria-label': parse(ds).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }) + (ev.length ? ' · ' + ev.map(x => x.tx).join(', ') : '') }, h('b', {}, String(d)), shown.map(x => h('span', { class: 'cp ' + x.c, title: x.tx }, x.c === 'v' ? '▣' : '◆')), extra > 0 ? h('small', {}, '+' + extra) : null)); }
    return acc('calendario', 'Calendario dello studio', `${MONTHS[calM]} ${calY}`, h('div', {}, h('p', { class: 'warn2', role: 'status' }, '⚠ ' + calWarn + ' (avviso d\'esempio)'),
      h('div', { class: 'mch' }, h('button', { class: 'chip sm', 'aria-label': 'Mese precedente', ...K('cprev'), onclick: () => { calM--; if (calM < 0) { calM = 11; calY--; } render(); } }, '‹'), h('b', {}, `${MONTHS[calM]} ${calY}`), h('button', { class: 'chip sm', ...K('ctoday'), onclick: () => { calY = 2026; calM = 10; render(); } }, 'Oggi'), h('button', { class: 'chip sm', 'aria-label': 'Mese successivo', ...K('cnext'), onclick: () => { calM++; if (calM > 11) { calM = 0; calY++; } render(); } }, '›')),
      grid, h('p', { class: 'hint' }, '▣ verifica · ◆ giorno di studio del piano. Per il calendario completo apri Calendario.')));
  }

  /* ---------- Modale verifica ---------- */
  const dlg = (id, title, body) => { const d = h('dialog', { id, 'aria-labelledby': id + '-t' }); d.append(h('div', { class: 'dh' }, h('h2', { id: id + '-t' }, title), h('button', { class: 'chip', 'aria-label': 'Chiudi', onclick: () => d.close() }, '✕')), h('div', { class: 'db' }, body)); d.addEventListener('click', e => { if (e.target === d) d.close(); }); document.body.append(d); return d; };
  const fld = (label, el, id) => h('div', { class: 'fr' }, h('label', { class: 'lb', for: id }, label), el);
  const F = {};
  F.subj = h('select', { class: 'field', id: 'f-subject' }); F.custom = h('input', { class: 'field', id: 'f-custom', placeholder: 'Nome della materia', 'aria-label': 'Nome della materia' }); F.customW = h('div', { hidden: '' }, F.custom);
  F.subj.onchange = () => { F.customW.hidden = F.subj.value !== '__custom__'; if (!F.customW.hidden) F.custom.focus(); };
  F.tipo = h('select', { class: 'field', id: 'f-tipo' }, TIPI.map(x => h('option', { value: x }, x)));
  F.date = h('input', { class: 'field', id: 'f-date', type: 'date' }); F.ore = h('input', { class: 'field', id: 'f-ore', type: 'number', min: '0.5', max: '12', step: '0.5', value: '2' });
  F.arg = h('textarea', { class: 'field ta', id: 'f-arg', placeholder: 'Es: Capitolo 3 (pag 45-78) — Termodinamica\nEsercizi dispensa n°12-20\nRipasso formule cap 2' }); F.note = h('input', { class: 'field', id: 'f-note', placeholder: 'Es: sono debole in X, ho già studiato Y…' });
  F.err = h('p', { class: 'warn2', role: 'alert', hidden: '' });
  const bPlan = h('button', { class: 'chip primary', id: 'save-plan', onclick: () => saveExam(true) }, '+ Aggiungi e prepara anteprima'), bOnly = h('button', { class: 'chip', id: 'save-only', onclick: () => saveExam(false) }, '+ Solo aggiungi (senza piano)');
  const dEx = dlg('overlay-exam', 'Aggiungi verifica', h('div', {}, h('p', { class: 'sim' }, 'Simulazione: la verifica resta solo in questa pagina. Nessun provider AI viene chiamato.'), fld('Materia', F.subj, 'f-subject'), F.customW, fld('Tipo', F.tipo, 'f-tipo'),
    h('div', { class: 'two' }, fld('Data verifica', F.date, 'f-date'), fld('Ore/giorno disponibili', F.ore, 'f-ore')), fld('Argomenti da studiare', F.arg, 'f-arg'), fld('Note extra per l\'AI (opzionale)', F.note, 'f-note'), F.err,
    h('div', { class: 'mf' }, h('button', { class: 'chip', id: 'cancel-edit', onclick: () => dEx.close() }, 'Annulla'), bOnly, bPlan)));
  function subjects() { return [...new Set([...Object.keys(SUBJ), ...EX.map(e => e.subject)])]; }
  function openExam(e) {
    editing = e; document.getElementById('overlay-exam-t').textContent = e ? 'Modifica verifica' : 'Aggiungi verifica';
    F.subj.replaceChildren(h('option', { value: '' }, 'Seleziona materia…'), ...subjects().map(s => h('option', { value: s }, s)), h('option', { value: '__custom__' }, '+ Altra…'));
    F.subj.value = e?.subject ?? ''; F.customW.hidden = true; F.custom.value = ''; F.tipo.value = e?.tipo ?? TIPI[0]; F.date.value = e?.date ?? offset(TODAY, 7); F.date.min = e && e.date < TODAY ? e.date : TODAY; F.ore.value = e?.ore ?? 2; F.arg.value = e?.argomenti ?? ''; F.note.value = e?.note ?? ''; F.err.hidden = true;
    bPlan.textContent = e ? 'Salva e prepara anteprima' : '+ Aggiungi e prepara anteprima'; bOnly.textContent = e ? 'Salva modifica' : '+ Solo aggiungi (senza piano)';
    dEx.showModal(); F.subj.focus();
  }
  function saveExam(withPlan) {
    const subj = F.subj.value === '__custom__' ? F.custom.value.trim() : F.subj.value, date = F.date.value, ore = F.ore.value === '' ? 2 : Number(F.ore.value), arg = F.arg.value.trim();
    let err = '';
    if (!subj) err = 'Seleziona una materia'; else if (!validDate(date) || (date < TODAY && date !== editing?.date)) err = 'Inserisci una data valida non passata'; else if (!Number.isFinite(ore) || ore < 0.5 || ore > 12 || !Number.isInteger(ore * 2)) err = 'Ore/giorno: usa mezze ore tra 0,5 e 12'; else if (withPlan && !arg) err = 'Inserisci gli argomenti prima di generare il piano';
    if (err) { F.err.textContent = 'Verifica non confermata: ' + err; F.err.hidden = false; return; }
    const rec = { subject: subj, tipo: F.tipo.value, date, ore, argomenti: arg, note: F.note.value.trim() };
    let id; if (editing) { Object.assign(editing, rec); id = editing.id; } else { id = 'n' + Date.now(); EX.push({ id, ...rec }); }
    sel = id; dEx.close(); render(); note((editing ? 'Verifica aggiornata' : 'Verifica salvata') + ' (simulato, non salvata nel prodotto).');
    if (withPlan) generate(exam(id));
  }

  /* ---------- Tutte le app e Impostazioni (stesso schema dell'Hub E1) ---------- */
  const APPS = [['Quotidiano', [['☰', 'Diario della giornata'], ['⚔', 'Missioni'], ['▦', 'Calendario'], ['✦', 'Planner AI', 'pagina corrente'], ['◷', 'Weekly Review'], ['⚖', 'Decisioni']]], ['Apprendimento', [['🎓', 'Studio'], ['📚', 'Library'], ['🃏', 'Flashcard'], ['⚙', 'Engineer']]], ['Corpo e creatività', [['🏋', 'Leo Protocol'], ['⚡', 'Recovery'], ['🎨', 'Arte & Musica'], ['🏛', 'Agora'], ['🎌', 'Agora Anime']]], ['Gioco', [['⚔', 'Life RPG'], ['🌌', 'Dungeon']]], ['Intelligenza', [['◎', 'Jarvis'], ['✦', 'Second Brain'], ['✧', 'Idea Hub', 'sezione autonoma · da progettare'], ['🤖', 'AI Coach'], ['⚙', 'Profilo operativo']]], ['Sistema', [['⚙', 'Impostazioni'], ['⛁', 'Backup e ripristino'], ['🔑', 'Chiave API'], ['⚡', 'PolyFeed']]]];
  const q = h('input', { class: 'field', type: 'search', placeholder: 'Cerca una sezione…', 'aria-label': 'Cerca una sezione', style: 'width:100%' }), lst = h('div', {});
  const drawApps = () => { const tt = q.value.trim().toLowerCase(); lst.replaceChildren(); for (const [g, its] of APPS) { const f = its.filter(([, l]) => l.toLowerCase().includes(tt)); if (f.length) lst.append(h('div', { class: 'grp2' }, h('h3', {}, g), h('div', { class: 'items' }, f.map(([ic, l, n]) => h('button', { class: 'item', onclick: () => note('Apri ' + l + ' (collegamento simulato)') }, h('span', { class: 'ic', 'aria-hidden': 'true' }, ic), h('span', { class: 'l' }, l, n ? h('small', {}, n) : null)))))); } };
  q.oninput = drawApps; drawApps();
  const dApps = dlg('apps', 'Tutte le app', h('div', {}, h('div', { class: 'sim' }, 'Collegamenti simulati, nessuna funzione implementata'), q, lst));
  const dSet = dlg('settings', 'Impostazioni', h('div', {}, h('div', { class: 'sim' }, 'Struttura d\'esempio'), h('div', { class: 'legend' }, h('span', {}, h('span', { class: 'badge real' }, 'Esistente'), ' già presente nell\'app'), h('span', {}, h('span', { class: 'badge ex' }, 'Esempio'), ' solo del prototipo')),
    h('div', { class: 'grp2' }, h('h3', {}, 'Dati e sicurezza'), h('div', { class: 'set' }, [['Backup e ripristino', 'Esiste in /settings.html (il Planner lo propone quando un archivio non è riconosciuto)'], ['Chiave API', 'Esiste come pulsante «KEY» nell\'Hub attuale']].map(([l, n]) => h('button', { class: 'sw', style: 'text-align:left;width:100%', onclick: () => note(l + ' (simulato)') }, h('span', { class: 'l' }, l, h('small', {}, n)), h('span', { class: 'badge real' }, 'Esistente'))))),
    h('div', { class: 'grp2' }, h('h3', {}, 'Planner'), h('div', { class: 'set' }, h('button', { class: 'sw', style: 'text-align:left;width:100%', onclick: () => note('Voce d\'esempio') }, h('span', { class: 'l' }, 'Ore di studio predefinite', h('small', {}, 'Voce d\'esempio, non presente nel Planner')), h('span', { class: 'badge ex' }, 'Esempio'))))));
  dApps.querySelector('.db > div').append(statusEl('dlg')); dSet.querySelector('.db > div').append(statusEl('dlg'));
  document.getElementById('appsBtn').onclick = () => dApps.showModal(); document.getElementById('setBtn').onclick = () => dSet.showModal();
  window.__pl = { select: id => { sel = id; render(); }, setOpen: (k, v) => { open[k] = v; render(); }, openExam: () => openExam(null), editExam: id => openExam(exam(id)), ask: id => { confirmDel = id; render(); }, gen: id => { sel = id; generate(exam(id)); }, EX: () => EX };
  render();
})();
