/* Iterazione 4 (E): Hub interattivo. Solo dati sintetici di content.js più esempi dichiarati. Nessuno stato persistente, nessuna rete. */
(() => {
  const D = HUB, A = id => D.area(id), root = document.getElementById('root');
  const tone = document.body.classList.contains('tone-2') ? 2 : 1;

  // Dati aggiuntivi (SINTETICI, dichiarati)
  const EX_TASK = { at: '21:30', title: 'Chiusura della giornata', area: 'studio', dur: '10 min', example: true };
  const APPS = [
    ['Quotidiano', [['☰', 'Diario della giornata', 'daily-command-center'], ['⚔', 'Missioni', 'daily-missions'], ['▦', 'Calendario', 'hub-calendar'], ['✦', 'Planner AI', 'studio-planner'], ['◷', 'Weekly Review', 'finestra dell\'Hub'], ['⚖', 'Decisioni', 'finestra dell\'Hub · tolta dagli accessi in D']]],
    ['Apprendimento', [['🎓', 'Studio', 'studio_polymath_v4'], ['📚', 'Library', 'library_fixed'], ['🃏', 'Flashcard', 'flashcards'], ['⚙', 'Engineer', 'engineer']]],
    ['Corpo e creatività', [['🏋', 'Leo Protocol', 'leo_protocol_v8'], ['⚡', 'Recovery', 'recovery-center'], ['🎨', 'Arte & Musica', 'arte-musica'], ['🏛', 'Agora', 'agora'], ['🎌', 'Agora Anime', 'agora_anime']]],
    ['Gioco', [['⚔', 'Life RPG', 'life_rpg_v2'], ['🌌', 'Dungeon', 'dungeon']]],
    ['Intelligenza', [['◎', 'Jarvis', 'jarvis'], ['✦', 'Second Brain', 'second-brain'], ['✧', 'Idea Hub', 'sezione autonoma · da progettare'], ['🤖', 'AI Coach', 'finestra dell\'Hub'], ['⚙', 'Profilo operativo', 'operating-profile'], ['▣', 'Agent Center', 'agent-center · pagina presente ma non collegata all\'Hub attuale']]],
    ['Sistema', [['⚙', 'Impostazioni', 'settings'], ['⛁', 'Backup e ripristino', 'settings'], ['🔑', 'Chiave API', 'pulsante dell\'Hub'], ['⚡', 'PolyFeed', 'finestra dell\'Hub'], ['▷', 'Onboarding', 'onboarding · pagina presente ma non collegata all\'Hub attuale']]]
  ];
  const SETTINGS = [
    ['Dati e sicurezza', [['real', 'Backup e ripristino', 'Esiste in /settings.html'], ['real', 'Chiave API', 'Esiste come pulsante «KEY» nell\'Hub attuale'], ['ex', 'Consensi e proiezioni AI', 'Voce d\'esempio']]],
    ['Aspetto', [['sw', 'Riduci le animazioni', 'Esempio, funziona solo qui'], ['ex', 'Tono visivo dell\'Hub', 'Esempio: sobrio o centro di controllo']]],
    ['Promemoria', [['ex', 'Avvisi per i prossimi impegni', 'Voce d\'esempio']]],
    ['Assistenti', [['ex', 'Idea Hub: proposte di Jarvis', 'Voce d\'esempio · ogni salvataggio richiede la tua conferma']]]
  ];

  // Dialog helper
  const dlg = (id, title, body) => {
    const d = h('dialog', { id, 'aria-labelledby': id + '-t' });
    d.append(h('div', { class: 'dh' }, h('h2', { id: id + '-t' }, title), h('button', { class: 'chip', 'aria-label': 'Chiudi', onclick: () => d.close() }, '✕')), h('div', { class: 'db' }, body));
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
    document.body.append(d); return d;
  };

  // Intestazione
  const apps = h('div', {}), sets = h('div', {});
  const dApps = dlg('apps', 'Tutte le app', apps), dSet = dlg('settings', 'Impostazioni', sets);
  const top = h('header', { class: 'top' },
    h('div', { class: 'brand' }, h('div', { class: 'eyebrow' }, `${D.today.weekday} ${D.today.date} · ${D.today.time}`), h('b', {}, 'POLY', h('span', {}, 'LIFE'), ' · HUB'), h('div', { class: 'status' }, h('i'), 'Prototipo · simulazione')),
    h('div', { class: 'hdr-act' },
      h('button', { class: 'chip', id: 'appsBtn', onclick: () => dApps.showModal() }, h('span', { class: 'ic', 'aria-hidden': 'true' }, '⊞'), 'Tutte le app'),
      h('button', { class: 'chip', id: 'setBtn', onclick: () => dSet.showModal() }, h('span', { class: 'ic', 'aria-hidden': 'true' }, '⚙'), 'Impostazioni')));
  document.querySelector('.wrap').prepend(top);

  // Pannello Tutte le app (filtro locale)
  const search = h('input', { class: 'field', type: 'search', placeholder: 'Cerca una sezione…', 'aria-label': 'Cerca una sezione', style: 'width:100%' });
  const list = h('div', {});
  const total = APPS.reduce((s, g) => s + g[1].length, 0);
  const drawApps = () => {
    const q = search.value.trim().toLowerCase(); list.replaceChildren(); let n = 0;
    for (const [g, its] of APPS) {
      const f = its.filter(([, l]) => l.toLowerCase().includes(q)); if (!f.length) continue; n += f.length;
      list.append(h('div', { class: 'grp' }, h('h3', {}, g), h('div', { class: 'items' }, f.map(([ic, l, src]) => h('button', { class: 'item', onclick: () => toast('Apri ' + l) }, h('span', { class: 'ic', 'aria-hidden': 'true' }, ic), h('span', { class: 'l' }, l, h('small', {}, src)))))));
    }
    if (!n) list.append(h('div', { class: 'empty' }, 'Nessuna sezione trovata.'));
  };
  search.oninput = drawApps; drawApps();
  apps.append(h('div', { class: 'sim' }, `${total} sezioni · i collegamenti sono simulati, nessuna funzione implementata`), search, list);

  // Pannello Impostazioni
  sets.append(h('div', { class: 'sim' }, 'Struttura d\'esempio · distingue le impostazioni esistenti da quelle d\'esempio'),
    h('div', { class: 'legend' }, h('span', {}, h('span', { class: 'badge real' }, 'Esistente'), ' già presente nell\'app'), h('span', {}, h('span', { class: 'badge ex' }, 'Esempio'), ' solo del prototipo')));
  for (const [g, its] of SETTINGS) sets.append(h('div', { class: 'grp' }, h('h3', {}, g), h('div', { class: 'set' }, its.map(([k, l, note]) => {
    if (k === 'sw') return h('label', { class: 'sw' }, h('span', { class: 'l' }, l, h('small', {}, note)), h('span', { class: 'badge ex' }, 'Esempio'), h('input', { type: 'checkbox', onchange: e => document.body.classList.toggle('reduce-motion', e.target.checked) }));
    return h('button', { class: 'sw', style: 'text-align:left;width:100%', onclick: () => toast(l) }, h('span', { class: 'l' }, l, h('small', {}, note)), h('span', { class: 'badge ' + k }, k === 'real' ? 'Esistente' : 'Esempio'));
  }))));

  // Strumenti: livello, XP, streak
  const L = D.level, pct = Math.round(L.xp / L.next * 100);
  root.append(h('section', { class: 'card gauge', 'aria-label': 'Livello, esperienza e serie' },
    h('div', { class: 'g-lv' }, h('div', { class: 'n' }, String(L.n).padStart(2, '0')), h('div', {}, h('small', {}, 'Livello'), h('b', {}, L.name))),
    h('div', { class: 'g-xp' }, h('div', { class: 'row' }, h('div', {}, h('small', {}, 'Esperienza'), h('span', { class: 'val' }, fmt(L.xp), h('span', {}, ' / ' + fmt(L.next) + ' XP'))), h('span', { class: 'next' }, `${fmt(L.next - L.xp)} XP al livello ${L.n + 1}`)),
      h('div', { class: 'seg', role: 'img', 'aria-label': `Esperienza ${pct} percento` }, h('i', { style: `width:${pct}%` }))),
    h('div', { class: 'g-st' }, h('small', {}, 'Serie'), h('b', {}, D.streak.days, h('span', {}, ' giorni')), h('div', { class: 'ticks', 'aria-hidden': 'true' }, Array.from({ length: D.streak.days }, () => h('i'))))));

  // Attività corrente (primo piano) e prossimo impegno (secondario)
  const ne = D.nextEvent, fa = A(D.focus.area), fp = Math.round(D.focus.done / D.focus.total * 100);
  const el = h('span', { class: 'count' }, '00:00'), contBtn = h('button', { class: 'chip primary' }, '▶ Continua a leggere');
  let timer = null, sec = 0; const fmtT = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  const elWrap = h('div', { class: 'elapsed', hidden: '' }, h('small', {}, 'Sessione simulata'), el);
  contBtn.onclick = () => {
    if (timer) { clearInterval(timer); timer = null; contBtn.textContent = '▶ Continua a leggere'; return; }
    elWrap.hidden = false; timer = setInterval(() => { sec++; el.textContent = fmtT(sec); }, 1000); contBtn.textContent = '❚❚ Pausa (simulata)';
  };
  const doing = h('section', { class: 'card hero doing', 'aria-labelledby': 'now-t' },
    h('div', {}, h('div', { class: 'eyebrow', id: 'now-t' }, 'Stai facendo adesso ', h('span', { class: 'live' }, h('i'), 'In corso')),
      h('h1', {}, D.focus.title), h('div', { class: 'muted' }, fa.name + ' · ' + D.focus.why),
      h('div', { class: 'acts' }, contBtn), elWrap),
    h('div', { class: 'prog' }, h('div', { class: 'row' }, h('span', { class: 'val' }, D.focus.done, h('span', {}, ' / ' + D.focus.total + ' pagine')), h('span', { class: 'pc' }, fp + '%')),
      h('div', { class: 'seg', role: 'img', 'aria-label': `Avanzamento ${fp} percento, ${D.focus.done} di ${D.focus.total}` }, h('i', { style: `width:${fp}%;--c:${fa.color}` }))));
  const nextC = h('section', { class: 'card nextc', 'aria-labelledby': 'next-t' },
    h('div', { class: 'eyebrow', id: 'next-t' }, 'Prossimo impegno'),
    h('div', { class: 'nx' }, h('div', { class: 'at' }, ne.at), h('div', { class: 't' }, h('b', {}, ne.title), h('small', {}, `tra ${ne.inMin} min · ${ne.where}`))),
    h('div', { class: 'acts' }, h('button', { class: 'chip', onclick: () => toast('Inizia ora') }, '▶ Inizia ora'), h('button', { class: 'chip', onclick: () => toast('Rimanda') }, 'Rimanda')));
  root.append(h('div', { class: 'top2' }, doing, nextC));

  // Accessi
  const main = [['☰', 'Diario della giornata'], ['✦', 'Second Brain'], ['◎', 'Jarvis'], ['▦', 'Calendario']], sec2 = [['◷', 'Weekly Review'], ['↺', 'Aggiorna'], ['■', 'Stop Impulso']];
  const b = (ic, t, fn) => h('button', { class: 'chip', onclick: fn || (() => toast(t)) }, h('span', { class: 'ic', 'aria-hidden': 'true' }, ic), t);
  root.append(h('nav', { 'aria-label': 'Accessi rapidi' }, h('div', { class: 'nav' }, main.map(([i, t]) => b(i, t))), h('div', { class: 'nav2' }, sec2.map(([i, t]) => b(i, t)))));

  // Oggi espandibile
  const A1 = e => h('li', { class: e.now ? 'now' : '' }, h('time', {}, e.at), h('span', { class: 'dot', style: 'background:' + A(e.area).color }), h('div', { class: 't' }, e.title, h('small', {}, A(e.area).name + ' · ' + e.dur + (e.example ? ' · esempio sintetico' : ''))));
  const events = D.agenda.map((e, i) => ({ ...e, now: i === 0 })), open = h('button', { class: 'exp', 'aria-expanded': 'false', 'aria-controls': 'full' }, h('span', { class: 'lbl' }, 'Agenda completa'), h('span', { class: 'ar', 'aria-hidden': 'true' }, '▾'));
  const compact = h('div', {}, h('ul', { class: 'agenda' }, events.slice(1).map(A1)), h('div', { class: 'hint' }, `${D.missions.length - 1} missioni da fare · apri l'agenda completa`));
  const done = new Set(); const mis = h('div', {});
  const drawMis = () => { mis.replaceChildren(...D.missions.map((m, i) => h('div', { class: 'mission' }, h('input', { type: 'checkbox', id: 'mm' + i, checked: done.has(i) ? '' : false, onchange: e => { e.target.checked ? done.add(i) : done.delete(i); } }), h('label', { for: 'mm' + i }, m.title), h('span', { class: 'dot', style: 'background:' + A(m.area).color, title: A(m.area).name })))); };
  drawMis();
  const full = h('div', { id: 'full', class: 'full', hidden: '' }, h('div', { class: 'sub' }, 'Tutta la giornata'), h('ul', { class: 'agenda' }, [...events, { ...EX_TASK }].map(A1)), h('div', { class: 'sub' }, 'Attività senza orario'), mis, h('div', { class: 'hint' }, 'Le spunte valgono solo in questa pagina e non vengono salvate.'));
  open.onclick = () => { const on = open.getAttribute('aria-expanded') !== 'true'; open.setAttribute('aria-expanded', on); full.hidden = !on; compact.hidden = on; open.firstChild.textContent = on ? 'Riduci' : 'Agenda completa'; };
  const today = h('section', { class: 'card' }, h('div', { class: 'today-h' }, h('h2', {}, 'Poi, oggi'), open), compact, full);

  // Grafici: 3 viste dagli stessi 7 valori sintetici
  const v = D.activity7, n = v.length, vals = v.map(x => x.v), sum = vals.reduce((s, x) => s + x, 0), avg = Math.round(sum / n);
  const best = vals.indexOf(Math.max(...vals)), X = i => (i + .5) / n * 100, NS = 'http://www.w3.org/2000/svg';
  const smooth = pts => { let d = `M${pts[0][0]},${pts[0][1]}`; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2; d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`; } return d; };
  const svgOf = inner => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 100 100'); s.setAttribute('preserveAspectRatio', 'none'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = inner; return s; };
  const grid = lbls => lbls.map(([pos, t]) => h('div', { class: 'g', style: `top:${pos}%` }, h('span', {}, t)));
  const line = (data, max) => { const pts = data.map((x, i) => [X(i), 100 - x / max * 100]); return { pts, d: smooth(pts) }; };
  const VIEWS = [
    { id: 'day', name: 'Giorno per giorno', tab: 'Giorni', what: 'Indice di attività di ciascun giorno, da 0 a 100 (valori d\'esempio).',
      sum: () => [['Più attivo ', v[best].d + ' · ' + vals[best]], ['Oggi ', vals[n - 1]], ['Media ', avg]],
      draw: () => { const { pts, d } = line(vals, 100); return [...grid([[0, 100], [50, 50], [100, 0]]), svgOf(`<defs><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f8cff" stop-opacity=".45"/><stop offset="1" stop-color="#4f8cff" stop-opacity="0"/></linearGradient></defs><path d="${d} L${pts[n - 1][0]},100 L${pts[0][0]},100 Z" fill="url(#fg)"/><line x1="0" x2="100" y1="${100 - avg}" y2="${100 - avg}" stroke="#9db0c2" stroke-width="1" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/><path d="${d}" fill="none" stroke="#4f8cff" stroke-width="2.5" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`), ...vals.map((x, i) => h('div', { class: 'pt' + (i === best ? ' best' : '') + (i === n - 1 ? ' today' : ''), style: `left:${X(i)}%;top:${100 - x}%` }))]; } },
    { id: 'avg', name: 'Rispetto alla media', tab: 'Vs media', what: `Di quanto ogni giorno sta sopra o sotto la media di ${avg}. Calcolato dagli stessi 7 valori.`,
      sum: () => [['Sopra la media ', vals.filter(x => x > avg).length + ' giorni'], ['Sotto ', vals.filter(x => x < avg).length + ' giorni']],
      draw: () => { const m = Math.max(...vals.map(x => Math.abs(x - avg))); return [...grid([[0, '+' + Math.round(m)], [50, 'media'], [100, '−' + Math.round(m)]]), ...vals.map((x, i) => { const dv = (x - avg) / m * 50; return h('div', { class: 'bar', style: `left:${X(i)}%;${dv >= 0 ? `bottom:50%;height:${dv}%` : `top:50%;height:${-dv}%`};background:${dv >= 0 ? 'var(--cyan)' : 'var(--orange)'}` }); })]; } },
    { id: 'cum', name: 'Progressivo', tab: 'Somma', what: 'Somma dell\'indice giorno dopo giorno dall\'inizio della settimana. Calcolata dagli stessi 7 valori.',
      sum: () => [['Totale ', sum], ['Giorno migliore ', v[best].d]],
      draw: () => { let c = 0; const cum = vals.map(x => c += x), { pts, d } = line(cum, sum); return [...grid([[0, sum], [50, Math.round(sum / 2)], [100, 0]]), svgOf(`<path d="M${pts.map(p => p.join(',')).join(' L')}" fill="none"stroke="#a78bfa" stroke-width="2.5" vector-effect="non-scaling-stroke"/>`), ...cum.map((x, i) => h('div', { class: 'pt' + (i === n - 1 ? ' today' : ''), style: `left:${X(i)}%;top:${100 - x / sum * 100}%` }))]; } }
  ];
  let vi = 0; const tabs = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Vista del grafico' }), sumEl = h('div', { class: 'wk-sum' }), plot = h('div', { class: 'plot', 'aria-hidden': 'true' }), what = h('div', { class: 'what' });
  const pbtn = h('button', { class: 'plotbtn', onclick: () => setView((vi + 1) % VIEWS.length) }, plot);
  const days = h('div', { class: 'days', 'aria-hidden': 'true' }, v.map((x, i) => h('span', { class: i === n - 1 ? 'today' : '' }, x.d)));
  const setView = i => {
    vi = i; const V = VIEWS[i];
    tabs.replaceChildren(...VIEWS.map((w, k) => h('button', { role: 'tab', 'aria-selected': String(k === i), 'aria-label': w.name, onclick: () => setView(k) }, w.tab)));
    sumEl.replaceChildren(...V.sum().map(([a, b2]) => h('span', {}, a, h('b', {}, b2))));
    plot.replaceChildren(...V.draw()); pbtn.setAttribute('aria-label', `Grafico: ${V.name}. ${V.what} Tocca per passare alla vista successiva.`);
    what.replaceChildren(h('b', {}, 'Cosa misura: '), V.what, h('small', {}, 'Tocca il grafico per cambiare vista'));
  };
  const week = h('section', { class: 'card' }, h('h2', {}, 'La tua settimana'), tabs, sumEl, pbtn, days, what);
  setView(0);

  // Aree
  const dup = { studio: '4 h in settimana', library: '1 libro in corso', rpg: '', leo: '', agora: 'Ultimo: ieri', engineer: '', dungeon: 'Esercito (esempio)', recovery: 'Coda attività da analizzare', arte: '', orch: 'Profilo operativo' };
  const metric = a => a.id === 'library' ? '1 libro' : a.id === 'rpg' ? 'Livello ' + L.n : a.metric;
  const areas = h('section', { class: 'card' }, h('h2', {}, 'Le tue aree'), h('div', { class: 'eq', role: 'img', 'aria-label': 'Peso relativo delle aree' }, D.areas.map(a => h('i', { style: `flex:${a.pct};background:${a.color}`, title: a.name }))),
    h('div', { class: 'areas' }, D.areas.map(a => h('a', { href: '#', onclick: e => { e.preventDefault(); toast('Apri ' + a.name); } }, h('span', { class: 'dot', style: 'background:' + a.color }), h('span', { class: 'n' }, a.name, a.placeholder ? h('span', { class: 'tag', style: 'margin-left:6px' }, 'segnaposto') : '', dup[a.id] ? h('small', {}, dup[a.id]) : ''), h('span', { class: 'm' }, metric(a), h('i', { style: `--p:${a.pct}%;--c:${a.color}` }))))));
  root.append(h('div', { class: 'body' }, h('div', { class: 'col' }, today, week), areas));

  // Idea Hub: anteprima provvisoria e molto discreta (la posizione definitiva è da decidere)
  root.append(h('section', { class: 'idea-mini', 'aria-label': 'Idea Hub, anteprima provvisoria' },
    h('div', { class: 'im' }, h('b', {}, 'Idea Hub'), h('span', { class: 'tag' }, 'anteprima provvisoria'), h('span', { class: 'ex' }, D.notes[1].text.replace(/^Idea: /, '') + ' · esempio sintetico')),
    h('button', { class: 'lnk', onclick: () => toast('Apri Idea Hub (sezione autonoma, da progettare)') }, 'Apri Idea Hub →'),
    h('p', { class: 'note' }, 'La scheda nell\'Hub è provvisoria: se Idea Hub diventa una sezione autonoma, la sua posizione definitiva resta da decidere. Simulazione, nessun salvataggio. Nome alternativo: «Idea Lab».')));
})();
