/* Atlas (oggi «Jarvis» nel prodotto) · prototipo E1. Solo dati sintetici e stato volatile della pagina.
   Ogni indicatore del Centro deriva dallo stato della demo: nessuna fonte di sistema, voce, rete, meteo, agente o provider reale. */
(() => {
  const h = window.h;
  const root = document.getElementById('root');
  const dialog = document.getElementById('dlg');
  const $ = id => document.getElementById(id);

  /* Nome del capo: proposta, cambiabile dalla vista Squadra. Il prodotto oggi si chiama Jarvis. */
  const NAMES = [['ATLAS', 'Regge e coordina: il titano che tiene insieme il mondo. Breve, internazionale, non usato altrove in PolyLife.'], ['VEGA', 'Una stella guida: orientamento più che comando. Suono morbido.'], ['REGIA', 'Italiano: chi dirige la scena senza recitare al posto degli attori.']];
  let NAME = 'ATLAS';
  const nm = () => NAME[0] + NAME.slice(1).toLowerCase();
  const aNm = () => (/^[AEIOU]/.test(NAME) ? 'ad ' : 'a ') + nm();

  const threads = [
    { id: 'day', title: 'Organizzare la giornata', updated: 'Oggi · 09:42', messages: [
      { role: 'assistant', tag: 'Risposta dimostrativa', text: 'Posso aiutarti a leggere ciò che hai registrato e preparare una proposta. Le modifiche operative restano separate e richiedono una conferma esplicita.' },
      { role: 'user', text: 'Qual è il prossimo passo utile oggi?' },
      { role: 'assistant', tag: 'Fixture sintetiche', text: 'Nelle fixture demo risultano 2 missioni aperte. La prima per priorità è «Ripassare il capitolo 4». Non posso dedurre quanto tempo hai: vuoi aprirla o preparare una proposta di Focus?' }
    ]},
    { id: 'study', title: 'Piano di studio', updated: 'Ieri · 16:10', messages: [
      { role: 'user', text: 'Aiutami a preparare il ripasso.' },
      { role: 'assistant', tag: 'Risposta dimostrativa', text: 'Posso riassumere il piano registrato oppure preparare una bozza. La bozza non modifica Planner finché non la rivedi e confermi.' }
    ]},
    { id: 'idea', title: 'Idea per Second Brain', updated: '30 ott · 12:05', messages: [
      { role: 'user', text: 'Vorrei collegare le fonti alle idee.' },
      { role: 'assistant', tag: 'Non collegato', text: 'Second Brain non è collegato a questo prototipo; il testo resta solo nella conversazione demo.' }
    ]}
  ];
  let active = 'day';
  let tab = 'centro';
  let mode = 'Commander';
  let proposal = false;
  let proposalState = 'In attesa';
  let localBrief = false;
  const decisions = [{ title: 'Dare priorità al redesign dell’Hub', type: 'Apprendimento', status: 'Da rivedere', reason: 'Rivedere le sezioni una alla volta.' }];
  const goals = [{ title: 'Costruire una base di studio costante', horizon: '90 giorni', progress: '12 / 30 sessioni' }, { title: 'Sviluppare Engineer come laboratorio pratico', horizon: '1 anno', progress: 'Milestone da definire' }];

  /* Squadra proposta: responsabili di area collegati alle sezioni PolyLife esistenti. Nessuno è attivo. */
  const SQUAD = [
    { k: 'agenda', icon: '▦', name: 'Agenda', areas: 'Calendario · Missioni · Planner · Focus', reads: 'impegni, missioni, piani', proposes: 'ordine della giornata, Focus, spostamenti', never: 'non sposta impegni da solo' },
    { k: 'studio', icon: '◈', name: 'Studio', areas: 'Studio · Flashcard · Biblioteca', reads: 'materie, verifiche, carte, letture', proposes: 'ripassi, carte da preparare, prossima lettura', never: 'non crea voti né carte senza revisione' },
    { k: 'corpo', icon: '◍', name: 'Corpo', areas: 'LEO Protocol · Recovery', reads: 'sessioni, check-in, attività saltate', proposes: 'piano della settimana, recupero', never: 'non dà diagnosi né valutazioni cliniche' },
    { k: 'lab', icon: '⌬', name: 'Laboratorio', areas: 'Engineer', reads: 'progetti, esercizi, diario', proposes: 'prossima milestone, esercizio', never: 'non valuta la competenza' },
    { k: 'dialoghi', icon: '❖', name: 'Dialoghi', areas: 'Agora · Nexus · Arte & Musica', reads: 'conversazioni con i personaggi', proposes: 'personaggio o tema da riprendere', never: 'non trasforma interpretazioni in fatti' },
    { k: 'memoria', icon: '✦', name: 'Memoria', areas: 'Second Brain · fonti · archivio', reads: 'solo fonti autorizzate una a una', proposes: 'collegamenti tra note e idee', never: 'non legge Obsidian senza consenso' }
  ];

  const currentThread = () => threads.find(t => t.id === active) || threads[0];
  const button = (label, key, action, cls = '') => h('button', { class: 'j-btn ' + cls, type: 'button', 'data-j': key, onclick: action }, label);
  const card = (title, ...children) => h('section', { class: 'card j-card' }, h('h2', {}, title), ...children);
  const pill = (text, cls = '') => h('span', { class: 'j-pill ' + cls }, text);
  const led = state => h('i', { class: 'j-led-dot ' + state, 'aria-hidden': 'true' });
  const go = key => { tab = key; render(); };

  /* ---------- Guscio: barra laterale (desktop) o navigazione in alto ---------- */
  const NAV = [['centro', 'Centro di comando', '◉'], ['squadra', 'Squadra', '⟁'], ['chat', 'Chat', '▭'], ['briefing', 'Briefing', '≡'], ['decisioni', 'Decisioni', '⇄'], ['obiettivi', 'Obiettivi', '✦'], ['focus', 'Focus', '◎'], ['memoria', 'Memoria', '⌘']];
  function nav() {
    const badge = { chat: threads.length, decisioni: decisions.length, obiettivi: goals.length, squadra: SQUAD.length + 1 };
    return h('nav', { class: 'j-nav', 'aria-label': 'Viste di ' + nm() }, NAV.map(([key, label, icon]) =>
      h('button', { type: 'button', 'aria-current': tab === key ? 'page' : 'false', 'data-j': 'tab-' + key, onclick: () => go(key) }, h('span', { class: 'j-nav-ic', 'aria-hidden': 'true' }, icon), h('span', { class: 'j-nav-l' }, label), badge[key] ? h('small', { class: 'j-nav-b' }, String(badge[key])) : null)));
  }
  function sidebar() {
    return h('aside', { class: 'j-side', 'aria-label': 'Navigazione di ' + nm() },
      h('div', { class: 'j-brand' }, h('span', { class: 'j-emblem', 'aria-hidden': 'true' }, h('i', {})), h('span', {}, h('b', {}, NAME), h('small', {}, 'Centro di comando'))),
      nav(),
      h('div', { class: 'j-voice' }, h('div', { class: 'j-hudhead' }, h('span', { class: 'j-code' }, 'VOCE'), h('h2', {}, 'Non disponibile')), h('div', { class: 'j-wave off', 'aria-hidden': 'true' }, Array.from({ length: 24 }, () => h('i', {}))), h('p', { class: 'j-muted' }, 'Il prototipo non ascolta: si scrive soltanto.')));
  }

  function openDialog(title, content) {
    $('dlg-title').textContent = title;
    $('dlg-body').replaceChildren(content);
    dialog.showModal();
  }

  function sendMessage(text) {
    const thread = currentThread();
    thread.messages.push({ role: 'user', text }, { role: 'assistant', tag: 'Simulazione locale', text: 'Risposta dimostrativa: qui posso usare soltanto le fixture e il contesto dichiarato. Nessuna richiesta è stata inviata a un modello.' });
    render();
  }

  function messageList() {
    const list = h('div', { class: 'j-messages', 'aria-label': 'Messaggi della conversazione' });
    currentThread().messages.forEach(message => {
      const user = message.role === 'user';
      const bubble = h('div', { class: 'j-bubble' }, message.tag ? pill(message.tag, 'cyan') : null, h('div', {}, message.text));
      list.append(h('article', { class: 'j-message' + (user ? ' user' : '') },
        !user ? h('span', { class: 'j-avatar', 'aria-hidden': 'true' }, NAME[0]) : null,
        bubble,
        user ? h('span', { class: 'j-avatar', 'aria-hidden': 'true' }, 'Tu') : null
      ));
    });
    return list;
  }

  function contextCard() {
    const rows = [
      ['Missioni di oggi', '2 aperte · fixture', true],
      ['Focus operativo', 'Ripasso capitolo 4 · demo', true],
      ['Planner', 'Piano di studio · demo', true],
      ['Second Brain / Obsidian', 'Non collegato', false]
    ];
    return card('Contesto della conversazione',
      h('p', { class: 'j-muted' }, 'La risposta demo usa solo questi elementi dichiarati.'),
      h('div', { class: 'j-context-list' }, rows.map(([name, value, included]) =>
        h('div', { class: 'j-context' + (included ? '' : ' off') }, h('i', { 'aria-hidden': 'true' }), h('span', {}, h('b', {}, name), value))
      )),
      h('div', { class: 'j-warning' }, `Prima di usare dati reali, ${nm()} deve mostrare quali fonti invia e chiedere il consenso previsto.`)
    );
  }

  function proposalCard() {
    if (!proposal) return h('div', { class: 'j-empty' }, `Nessuna proposta attiva. Chiedi ${aNm()} di prepararne una, poi rivedila.`);
    const details = h('div', { class: 'j-stack' },
      h('p', { class: 'j-copy' }, 'Impostare «Ripassare il capitolo 4» come Focus operativo.'),
      h('div', { class: 'j-context-list' }, [
        ['Preparata da', 'Responsabile Agenda (proposto) · per conto di ' + nm()],
        ['Dato usato', 'Missione demo con priorità alta'],
        ['Dato escluso', 'Orari, note e contenuti Second Brain'],
        ['Effetto previsto', 'Aggiorna soltanto il Focus']
      ].map(([a, b]) => h('div', { class: 'j-context' }, h('i', { 'aria-hidden': 'true' }), h('span', {}, h('b', {}, a), b)))),
      h('p', { class: 'j-warning' }, 'Nel prototipo l’approvazione cambia solo lo stato visibile; non scrive dati.')
    );
    return h('div', { class: 'j-proposal' },
      h('div', { class: 'j-topline' }, h('h3', {}, 'Proposta · Focus operativo'), pill(proposalState, proposalState === 'Approvata nella demo' ? 'green' : 'cyan')),
      h('p', { class: 'j-copy' }, 'Nessuna modifica viene applicata automaticamente.'),
      h('p', { class: 'j-muted' }, 'Fonte: Missioni demo · 1 attività'),
      h('div', { class: 'j-actions' },
        button('Rivedi dettagli', 'proposal-review', () => openDialog('Rivedi la proposta', details), 'ghost'),
        button(proposalState === 'Approvata nella demo' ? 'Approvata nella demo' : 'Approva nella demo', 'proposal-approve', () => { proposalState = 'Approvata nella demo'; render(); }, 'primary'),
        button('Rifiuta', 'proposal-reject', () => { proposalState = 'Rifiutata nella demo'; render(); }, 'ghost')
      )
    );
  }

  function chatPage() {
    const sidebarCol = h('aside', { class: 'j-stack' },
      card('Conversazioni',
        button('+ Nuova conversazione', 'new-thread', () => {
          const id = 'demo-' + Date.now();
          threads.unshift({ id, title: 'Nuova conversazione', updated: 'Adesso', messages: [{ role: 'assistant', tag: 'Solo prototipo', text: 'Conversazione demo. Ogni risposta è simulata localmente.' }] });
          active = id; render();
        }, 'primary'),
        h('div', { class: 'j-convos' }, threads.map(thread => h('button', { class: 'j-convo', type: 'button', 'aria-current': String(thread.id === active), onclick: () => { active = thread.id; render(); } }, h('strong', {}, thread.title), h('small', {}, thread.updated))))
      ),
      card('Modalità',
        h('label', { class: 'j-field' }, h('span', { class: 'j-muted' }, 'Stile di risposta · solo presentazione'),
          h('select', { class: 'j-select', 'aria-label': 'Modalità di ' + nm(), onchange: e => { mode = e.target.value; $('live').textContent = 'Modalità demo: ' + mode; } },
            ['Commander', 'Scientist', 'Engineer', 'CEO', 'Guardian'].map(value => h('option', { value, selected: value === mode }, value))
          )
        ),
        h('p', { class: 'j-muted' }, 'La modalità non concede permessi né cambia le fonti accessibili. Nel prodotto le cinque modalità sono toni dello stesso assistente, non agenti diversi.')
      )
    );

    const composer = h('form', { class: 'j-compose', onsubmit: e => { e.preventDefault(); const field = e.currentTarget.elements.message; const text = field.value.trim(); if (text) { field.value = ''; sendMessage(text); } } },
      h('textarea', { name: 'message', placeholder: `Scrivi ${aNm()}…`, 'aria-label': 'Messaggio per ' + nm() }),
      h('button', { class: 'j-btn primary', type: 'submit' }, 'Invia')
    );
    const center = h('section', { class: 'card j-card j-chat' },
      h('div', { class: 'j-topline' }, h('div', {}, h('h2', {}, currentThread().title), h('p', { class: 'j-muted' }, 'Modalità ' + mode + ' · conversazione sintetica')),
        button('Azzera demo', 'clear-thread', () => { currentThread().messages = []; render(); }, 'ghost')),
      messageList(),
      h('div', { class: 'j-stack' },
        h('div', { class: 'j-prompts' },
          button('Riassumi oggi', 'prompt-today', () => sendMessage('Fammi il punto sulla giornata.'), 'ghost'),
          button('Aiutami a decidere', 'prompt-decision', () => sendMessage('Aiutami a confrontare le opzioni.'), 'ghost'),
          button('Prepara proposta Focus', 'prompt-focus', () => { proposal = true; proposalState = 'In attesa'; currentThread().messages.push({ role: 'user', text: 'Prepara una proposta per il Focus.' }, { role: 'assistant', tag: 'Proposta demo · nessuna modifica', text: 'Ho preparato una proposta separata. Controlla fonte ed effetto prima di decidere.' }); render(); }, 'ghost')
        ),
        composer,
        h('div', { class: 'j-chat-foot' }, h('span', { class: 'j-muted' }, 'Risposta simulata · non inviata a un modello'), button('Prepara un’azione', 'prepare-action', () => { proposal = true; proposalState = 'In attesa'; render(); }, 'ghost'))
      )
    );
    const right = h('aside', { class: 'j-stack j-context-col' },
      contextCard(),
      card('Azione in revisione', proposalCard()),
      card('Accesso operativo', h('p', { class: 'j-copy' }, 'Incarichi e connettori sono un flusso separato dalla chat consultiva.'),
        button('Esplora il flusso demo', 'agent-demo', () => openDialog('Incarichi e connettori', h('div', { class: 'j-context-list' }, [['Stato', 'Nessun incarico avviato'], ['Permessi', 'Nessuna autorizzazione richiesta'], ['Connettori', 'Non collegati']].map(([a, b]) => h('div', { class: 'j-context' }, h('i', { 'aria-hidden': 'true' }), h('span', {}, h('b', {}, a), b))))), 'ghost'))
    );
    return [h('div', { class: 'j-status' }, h('span', { class: 'j-led', 'aria-hidden': 'true' }), h('span', {}, 'Sessione locale · demo statica'), pill('nessuna AI attiva', 'gold')), h('div', { class: 'j-grid' }, sidebarCol, center, right)];
  }

  /* ---------- Centro di comando ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const sv = (tag, attrs, ...kids) => { const n = document.createElementNS(NS, tag); Object.entries(attrs || {}).forEach(([k, v]) => n.setAttribute(k, v)); kids.forEach(k => n.append(k)); return n; };
  const pt = (c, r, deg) => { const a = (deg - 90) * Math.PI / 180; return [c + r * Math.cos(a), c + r * Math.sin(a)]; };

  function coreSvg(stages) {
    const C = 250, svg = sv('svg', { viewBox: '0 0 500 500', class: 'j-core-svg', role: 'img', 'aria-label': `Nucleo grafico di ${nm()}: decorativo. I quattro archi esterni riflettono solo lo stato della demo (contesto, proposta, consenso, scritture).` });
    const ticks = sv('g', { class: 'j-spin-a' });
    for (let i = 0; i < 144; i++) { const deg = i * 2.5, major = i % 12 === 0, mid = i % 6 === 0, [x1, y1] = pt(C, 244, deg), [x2, y2] = pt(C, major ? 226 : mid ? 233 : 238, deg); ticks.append(sv('line', { x1, y1, x2, y2, class: major ? 'j-tick major' : 'j-tick' })); }
    const arcs = sv('g', {});
    stages.forEach((state, i) => { const a0 = i * 90 + 6, a1 = i * 90 + 84, [x0, y0] = pt(C, 212, a0), [x1, y1] = pt(C, 212, a1); arcs.append(sv('path', { d: `M${x0} ${y0} A212 212 0 0 1 ${x1} ${y1}`, class: 'j-arc ' + state })); const [u0, v0] = pt(C, 200, a0 + 5), [u1, v1] = pt(C, 200, a1 - 5); arcs.append(sv('path', { d: `M${u0} ${v0} A200 200 0 0 1 ${u1} ${v1}`, class: 'j-arc thin ' + state })); });
    const dash = sv('g', { class: 'j-spin-b' }, sv('circle', { cx: C, cy: C, r: 186, class: 'j-ring-dash' }));
    const globe = sv('g', { class: 'j-globe' });
    globe.append(sv('circle', { cx: C, cy: C, r: 118, class: 'j-globe-edge' }));
    [0.25, 0.5, 0.75, 0.93].forEach(f => globe.append(sv('ellipse', { cx: C, cy: C, rx: 118 * f, ry: 118, class: 'j-globe-line' })));
    [-80, -45, 0, 45, 80].forEach(y => { const rx = Math.sqrt(118 * 118 - y * y); globe.append(sv('ellipse', { cx: C, cy: C + y, rx, ry: rx * 0.16, class: 'j-globe-line' })); });
    const orbit = sv('g', { class: 'j-spin-c' }, sv('ellipse', { cx: C, cy: C, rx: 172, ry: 52, class: 'j-orbit', transform: `rotate(-18 ${C} ${C})` }), sv('circle', { cx: C + 160, cy: C - 70, r: 3.5, class: 'j-orbit-dot' }), sv('circle', { cx: C - 150, cy: C + 60, r: 2.5, class: 'j-orbit-dot' }));
    const base = sv('g', {}, sv('ellipse', { cx: C, cy: C + 150, rx: 120, ry: 16, class: 'j-base' }), sv('ellipse', { cx: C, cy: C + 150, rx: 80, ry: 10, class: 'j-base' }));
    svg.append(ticks, sv('circle', { cx: C, cy: C, r: 222, class: 'j-ring-line soft' }), arcs, dash, base, globe, orbit);
    return svg;
  }
  function gauge(pct, label, value, state) {
    const r = 34, c = 2 * Math.PI * r, svg = sv('svg', { viewBox: '0 0 90 90', class: 'j-gauge-svg', 'aria-hidden': 'true' }, sv('circle', { cx: 45, cy: 45, r, class: 'j-gauge-bg' }), sv('circle', { cx: 45, cy: 45, r, class: 'j-gauge-fg ' + state, 'stroke-dasharray': `${(c * pct / 100).toFixed(1)} ${c.toFixed(1)}`, transform: 'rotate(-90 45 45)' }));
    return h('div', { class: 'j-gauge', role: 'img', 'aria-label': `${label}: ${value}` }, h('div', { class: 'j-gauge-ring' }, svg, h('b', {}, value)), h('span', {}, label));
  }
  const hud = (code, title, extra, ...children) => h('section', { class: 'card j-card j-hudcard' }, h('div', { class: 'j-hudhead' }, h('span', { class: 'j-code' }, code), h('h2', {}, title), extra || null), ...children);

  function centerPage() {
    const approved = proposal && proposalState === 'Approvata nella demo', rejected = proposal && proposalState === 'Rifiutata nella demo';
    const pst = !proposal ? 'off' : approved ? 'on' : 'warn';
    const stages = ['on', pst, approved ? 'on' : 'off', 'off'];
    const legend = h('div', { class: 'j-legend', role: 'list', 'aria-label': 'Stato demo dei quattro archi' },
      [['CONTESTO', 'on', '3 fonti su 4 dichiarate'], ['PROPOSTA', pst, !proposal ? 'Nessuna proposta' : proposalState], ['CONSENSO', approved ? 'on' : 'off', approved ? 'Dato nella demo' : 'Non ancora dato'], ['SCRITTURE', 'off', '0 · nessuna scrittura']].map(([n, st, t]) =>
        h('div', { class: 'j-legend-item', role: 'listitem' }, led(st), h('span', {}, h('b', {}, n), h('small', {}, t)))));

    const top = h('div', { class: 'j-top' },
      h('div', { class: 'j-top-status' }, h('span', { class: 'j-code' }, 'STATO'), led('warn'), h('b', {}, 'DEMO'), h('span', { class: 'j-muted' }, 'nessuna AI collegata')),
      h('div', { class: 'j-top-clock' }, h('small', {}, 'Lunedì 2 novembre 2026'), h('b', {}, '09:42'), h('span', { class: 'j-muted' }, 'orario delle fixture, non l’ora reale')),
      h('div', { class: 'j-top-op' }, h('span', { class: 'j-op-av', 'aria-hidden': 'true' }, 'TU'), h('span', {}, h('b', {}, 'Operatore'), h('small', {}, 'decidi e approvi tu'))));

    const overview = hud('01', 'Nucleo', null, h('div', { class: 'j-sys' }, [
      ['▭', 'Conversazione', 'Demo locale', 'on'], ['✦', 'Memoria', 'Non collegata', 'off'], ['◉', 'Voce', 'Non disponibile', 'off'],
      ['⟁', 'Agenti specialisti', '0 attivi · 6 previsti', 'off'], ['◇', 'Modelli AI', 'Non collegati', 'off'], ['⛨', 'Guardiano', 'Regole dimostrative', 'warn']].map(([ic, n, s, st]) =>
      h('div', { class: 'j-sys-row' }, h('span', { class: 'j-sys-ic', 'aria-hidden': 'true' }, ic), h('span', {}, h('b', {}, n), h('small', { class: st }, s)), led(st)))));

    const hero = h('section', { class: 'card j-card j-core-panel', 'aria-labelledby': 'core-title' },
      h('div', { class: 'j-core-top' }, h('span', { class: 'j-overline' }, 'NUCLEO DI COORDINAMENTO'), pill('SESSIONE DEMO', 'gold')),
      h('div', { class: 'j-core' }, coreSvg(stages), h('div', { class: 'j-core-name' }, h('b', { id: 'core-title' }, NAME), h('span', {}, 'capo della squadra'), h('small', {}, 'demo · v0'))),
      legend,
      h('p', { class: 'j-muted j-center-disclaimer' }, 'Grafica ornamentale: gli archi mostrano solo lo stato di questa demo, non un monitoraggio di sistema.'));

    const feed = hud('02', 'Flusso della sessione', pill('DEMO', 'gold'), h('div', { class: 'j-feed' }, [
      ['INFO', 'Conversazione disponibile', threads.length + ' conversazioni demo', 'on'],
      ['INFO', '3 fonti sintetiche dichiarate', 'Missioni · Planner · Focus', 'on'],
      ...(proposal ? [[approved ? 'OK' : rejected ? 'NO' : 'ATTESA', 'Proposta Focus: ' + proposalState.toLowerCase(), 'Preparata per conto di ' + nm(), approved ? 'on' : 'warn']] : [['—', 'Nessuna proposta in revisione', 'Preparane una da qui o dalla Chat', 'off']]),
      ['N/D', 'Second Brain non collegato', 'Nessuna nota letta', 'off']].map(([tag, title, sub, st]) =>
      h('div', { class: 'j-feed-row' }, led(st), h('span', {}, h('b', {}, title), h('small', {}, sub)), h('em', { class: 'j-tagx ' + st }, tag)))),
      button('Vedi le conversazioni', 'feed-chat', () => go('chat'), 'ghost'));

    const squad = hud('03', 'Squadra', button('Gerarchia', 'squad-open', () => go('squadra'), 'ghost'),
      h('div', { class: 'j-agents' }, SQUAD.map(a => h('button', { class: 'j-agent', type: 'button', 'data-j': 'agent-' + a.k, onclick: () => go('squadra') }, h('span', { class: 'j-agent-ic', 'aria-hidden': 'true' }, a.icon), h('span', { class: 'j-agent-t' }, h('b', {}, a.name), h('small', {}, led('off'), ' previsto · non attivo')), h('i', { class: 'j-flat', 'aria-hidden': 'true' })))),
      h('p', { class: 'j-muted' }, `Proposta: responsabili di area sotto ${nm()}. Nessun agente esiste o è in esecuzione.`),
      h('a', { class: 'j-agent-center-link', href: '../agent-center/index.html' }, 'Apri Agent Center'));

    const timeline = hud('04', 'Linea della giornata', pill('FIXTURE', 'cyan'), h('div', { class: 'j-time' }, [
      ['09:30', 'Ripassare il capitolo 4', 'Missione demo · priorità alta', 'on', 'Da fare'], ['11:00', 'Esercizio di Engineer', 'Missione demo', 'off', 'Da fare'], ['16:00', 'Allenamento', 'Profilo operativo demo', 'off', 'Previsto'], ['21:00', 'Diario della giornata', 'Abitudine demo', 'off', 'Previsto']].map(([t, n, s, st, r]) =>
      h('div', { class: 'j-time-row' }, h('time', {}, t), led(st), h('span', {}, h('b', {}, n), h('small', {}, s)), h('em', {}, r)))),
      button('Apri Focus', 'time-focus', () => go('focus'), 'ghost'));

    const quick = hud('05', 'Comandi rapidi', null, h('div', { class: 'j-quick' }, [['≡', 'Briefing demo', 'center-brief', () => { localBrief = true; go('briefing'); }], ['⇄', 'Rivedi Decisioni', 'center-decisions', () => go('decisioni')], ['◎', 'Focus operativo', 'center-focus', () => go('focus')], ['✦', 'Obiettivi', 'center-goals', () => go('obiettivi')], ['◇', 'Prepara proposta Focus', 'center-proposal', () => { proposal = true; proposalState = 'In attesa'; render(); }]].map(([ic, label, key, fn]) =>
      h('button', { class: 'j-quick-b', type: 'button', 'data-j': key, onclick: fn }, h('span', { 'aria-hidden': 'true' }, ic), label))));

    const review = hud('06', 'Azione in revisione', null, proposalCard());

    const monitor = hud('07', 'Indicatori della demo', null, h('div', { class: 'j-gauges' },
      gauge(75, 'Fonti dichiarate', '3/4', 'on'), gauge(approved ? 100 : 0, 'Proposte approvate', approved ? '1/1' : proposal ? '0/1' : '0/0', approved ? 'on' : 'warn'), gauge(0, 'Scritture automatiche', '0', 'off')),
      h('p', { class: 'j-muted' }, 'Non sono CPU, RAM o disco: il prototipo non legge risorse di sistema.'));

    const stars = [[18, 70], [34, 44], [52, 58], [66, 30], [80, 52], [94, 36], [110, 62], [126, 48], [142, 72], [158, 40]];
    const constel = sv('svg', { viewBox: '0 0 176 100', class: 'j-constel', 'aria-hidden': 'true' }, sv('polyline', { points: stars.map(p => p.join(',')).join(' '), class: 'j-constel-l' }), ...stars.map(([x, y], i) => sv('circle', { cx: x, cy: y, r: i % 3 ? 2 : 3, class: 'j-constel-d' })));
    const memory = hud('08', 'Memoria', null, h('div', { class: 'j-mem' }, h('div', { class: 'j-mem-map' }, constel, h('span', { class: 'j-mem-off' }, 'Mappa di esempio · non collegata')), h('div', { class: 'j-mem-n' }, [['N/D', 'ricordi'], ['3', 'fonti dichiarate'], ['0', 'note lette']].map(([v, l]) => h('div', {}, h('b', {}, v), h('small', {}, l))))),
      button('Apri mappa Second Brain demo', 'center-brain', () => { location.href = '../second-brain/index.html'; }, 'ghost'));

    const models = hud('09', 'Modelli AI', pill('0 collegati', 'gold'), h('div', { class: 'j-models' }, [['Conversazione', 'Non collegato'], ['Sintesi e briefing', 'Non collegato'], ['Modello locale', 'Non collegato'], ['Strumenti esterni', 'Non collegati']].map(([n, s]) =>
      h('div', { class: 'j-model' }, led('off'), h('span', {}, h('b', {}, n), h('small', {}, s))))), h('p', { class: 'j-muted' }, 'Quale provider usare e con quali dati è una decisione aperta.'));

    const dock = h('form', { class: 'j-dock', 'aria-label': 'Barra di comando', onsubmit: e => { e.preventDefault(); const text = e.currentTarget.elements.message.value.trim(); if (!text) { $('live').textContent = `Scrivi un messaggio per ${nm()}.`; return; } currentThread().messages.push({ role: 'user', text }, { role: 'assistant', tag: 'Simulazione locale', text: 'Risposta dimostrativa: nessuna AI è stata chiamata e nessun dato è stato modificato.' }); go('chat'); } },
      h('div', { class: 'j-dock-chips' }, [['Luogo', 'N/D'], ['Meteo', 'N/D'], ['Rete', 'N/D']].map(([a, b]) => h('span', { class: 'j-dock-chip' }, led('off'), h('span', {}, h('small', {}, a), h('b', {}, b))))),
      h('div', { class: 'j-dock-main' }, h('div', { class: 'j-wave', 'aria-hidden': 'true' }, Array.from({ length: 14 }, () => h('i', {}))),
        h('label', { class: 'sr', for: 'cmd-input' }, 'Messaggio per ' + nm()),
        h('input', { id: 'cmd-input', name: 'message', type: 'text', placeholder: `Parla con ${nm()}… (premi /)`, autocomplete: 'off' }),
        h('button', { class: 'j-btn primary', type: 'submit', 'data-j': 'cmd-send' }, 'Invia')),
      h('div', { class: 'j-dock-side' }, button('Briefing', 'dock-brief', () => { localBrief = true; go('briefing'); }, 'ghost')),
      h('p', { class: 'j-dock-note j-muted' }, 'Solo testo · risposta simulata · modalità ' + mode + ' (solo stile) · Luogo, meteo e rete: fonti assenti'));

    return [top, h('div', { class: 'j-cmd' }, hero, dock, overview, feed, squad, timeline, quick, review, monitor, memory, models)];
  }

  /* ---------- Squadra: gerarchia proposta ---------- */
  function squadPage() {
    const names = h('div', { class: 'j-chosen' }, h('div', { class: 'j-name on' }, h('span', {}, h('b', {}, NAME), h('small', {}, NAMES[0][1]))), h('p', { class: 'j-muted' }, 'Scelto dall’utente il 3 novembre 2026. Alternative considerate e scartate: ' + NAMES.slice(1).map(([n]) => n).join(', ') + '. Nel prodotto il nome resta «Jarvis» finché non si decide di cambiarlo.'));
    const chart = h('div', { class: 'j-org', role: 'group', 'aria-label': 'Organigramma proposto' },
      h('div', { class: 'j-org-row' }, h('div', { class: 'j-node you' }, h('span', { class: 'j-node-tag' }, 'DECIDE'), h('b', {}, 'Tu'), h('small', {}, 'scegli, approvi, puoi fermare tutto'))),
      h('div', { class: 'j-org-link', 'aria-hidden': 'true' }),
      h('div', { class: 'j-org-row two' }, h('div', { class: 'j-node chief' }, h('span', { class: 'j-node-tag' }, 'CAPO'), h('b', {}, NAME), h('small', {}, 'unica voce con cui parli: capisce la richiesta, la affida, ricompone le risposte')), h('div', { class: 'j-node guard' }, h('span', { class: 'j-node-tag' }, 'CONTROLLO'), h('b', {}, 'Guardiano'), h('small', {}, 'trasversale: fonti, consensi, permessi; può bloccare una proposta'))),
      h('div', { class: 'j-org-link', 'aria-hidden': 'true' }),
      h('div', { class: 'j-org-grid' }, SQUAD.map(a => h('div', { class: 'j-node area' }, h('div', { class: 'j-node-head' }, h('span', { class: 'j-agent-ic', 'aria-hidden': 'true' }, a.icon), h('span', {}, h('b', {}, 'Responsabile ' + a.name), h('small', {}, 'nome da scegliere · non attivo'))),
        h('p', { class: 'j-node-areas' }, a.areas), h('dl', {}, h('dt', {}, 'Legge'), h('dd', {}, a.reads), h('dt', {}, 'Propone'), h('dd', {}, a.proposes), h('dt', {}, 'Mai'), h('dd', {}, a.never))))));
    const flow = h('ol', { class: 'j-flow' }, [['Richiesta', 'Parli solo con ' + nm() + '.'], ['Smistamento', nm() + ' sceglie il responsabile di area.'], ['Bozza', 'Lo specialista prepara una proposta con le fonti.'], ['Controllo', 'Il Guardiano verifica fonti e permessi.'], ['Decisione', 'Tu approvi o rifiuti; poi la ricevuta.']].map(([t, d], i) => h('li', {}, h('b', {}, (i + 1) + '. ' + t), h('span', {}, d))));
    const today = card('Che cosa esiste oggi nel prodotto', h('div', { class: 'j-context-list' }, [
      ['Un solo assistente', '«Jarvis», con cinque modalità (Commander, Scientist, Engineer, CEO, Guardian): sono toni della stessa identità, non agenti separati.'],
      ['Centro agente e connettori', 'Un solo agente con limiti v1; incarichi e permessi separati dalla chat.'],
      ['Flotta e memoria autonoma', 'Non implementate né attivate (documentazione Jarvis Focus v1).']].map(([a, b]) => h('div', { class: 'j-context' }, h('i', { 'aria-hidden': 'true' }), h('span', {}, h('b', {}, a), b)))));
    const why = card('Perché un capo e un Guardiano separati', h('ul', { class: 'j-steps' }, [
      'Un solo interlocutore: non devi sapere quale agente chiamare.',
      'Gli specialisti vedono solo le sezioni della loro area: meno dati in giro.',
      'Chi propone non è chi controlla: il Guardiano non scrive proposte.',
      'Nessuno scrive senza la tua approvazione, nemmeno il capo.'].map(t => h('li', {}, t))));
    const open = card('Da decidere insieme', h('ol', { class: 'j-steps' }, ['I nomi dei responsabili di area, oppure nomi funzionali.', 'Se il Guardiano è un agente o un insieme di regole fisse.', 'Se Arte & Musica e Life RPG hanno un proprio responsabile.', 'Quali aree attivare per prime.'].map(t => h('li', {}, t))));
    return [h('div', { class: 'j-status' }, h('span', { class: 'j-led', 'aria-hidden': 'true' }), h('span', {}, 'Gerarchia proposta · nessun agente è attivo'), pill('proposta di design', 'gold')),
      h('div', { class: 'j-grid j-grid-two' }, h('div', { class: 'j-stack' }, card('Squadra di ' + nm(), h('p', { class: 'j-copy' }, 'Un capo coordina, un Guardiano controlla, sei responsabili di area preparano proposte nelle loro sezioni. Tutto qui è una proposta: nessun agente esiste nel prototipo né nel prodotto.'), chart), card('Come passa una richiesta', flow)),
        h('div', { class: 'j-stack' }, card('Nome del capo · scelto', names), why, today, open))];
  }

  function listPage(title, intro, main, side) {
    return [h('div', { class: 'j-grid j-grid-two' }, card(title, h('p', { class: 'j-copy' }, intro), ...main), card('Fonti e limiti', ...side))];
  }

  function briefingPage() {
    const main = [
      h('div', { class: 'j-topline' }, h('p', { class: 'j-copy' }, 'Il contenuto generato va distinto dai dati registrati.'), pill(localBrief ? 'Esempio locale' : 'Nessun riepilogo attivo', localBrief ? 'green' : '')),
      h('div', { class: 'j-kpis' }, [['2', 'missioni aperte · demo'], ['1', 'focus · demo'], ['N/D', 'dati non presenti'], ['0', 'provider chiamati']].map(([n, label]) => h('div', { class: 'j-kpi' }, h('b', {}, n), h('span', {}, label)))),
      h('div', { class: 'j-warning' }, 'La sintesi AI richiede consenso esplicito. Questa pagina non chiama provider.'),
      h('div', { class: 'j-actions' }, button('Mostra esempio locale', 'brief-local', () => { localBrief = true; render(); }, 'primary'), button('Giornaliero', 'brief-day', () => { localBrief = true; render(); }, 'ghost'), button('Settimanale', 'brief-week', () => { localBrief = true; render(); }, 'ghost'))
    ];
    if (localBrief) main.push(h('div', { class: 'j-row' }, h('b', {}, 'Esempio · non è una sintesi dei tuoi dati'), h('p', {}, 'Oggi risultano due missioni aperte nelle fixture. Controlla gli impegni registrati prima di scegliere.')));
    const side = [h('div', { class: 'j-context-list' }, [['Missioni', 'Fixture sintetica'], ['Focus', 'Fixture sintetica'], ['Studio', 'N/D · non incluso'], ['Second Brain', 'Non collegato']].map(([a, b]) => h('div', { class: 'j-context' }, h('i', { 'aria-hidden': 'true' }), h('span', {}, h('b', {}, a), b)))), h('p', { class: 'j-muted' }, 'Riepilogo illustrativo, non salvato.')];
    return listPage('Briefing', 'Riepiloghi consultivi e periodici.', main, side);
  }

  function decisionPage() {
    const main = [button('+ Nuova decisione', 'new-decision', () => decisionDialog(), 'primary'), h('div', { class: 'j-list' }, decisions.map((d, i) => h('article', { class: 'j-row' },
      h('div', { class: 'j-topline' }, h('b', {}, d.title), pill(d.status, d.status === 'Registrata' ? 'green' : 'gold')),
      h('p', {}, d.type + ' · ' + d.reason),
      button('Rivedi esito', 'decision-review-' + i, () => openDialog('Esito della decisione', h('div', { class: 'j-stack' }, h('p', { class: 'j-copy' }, 'La demo modifica soltanto lo stato in pagina.'), button('Segna come rivalutata', 'decision-done-' + i, () => { d.status = 'Rivalutata nella demo'; dialog.close(); render(); }, 'primary'))), 'ghost')
    )) )];
    const side = [h('div', { class: 'j-context-list' }, [['Impatto', 'Valutazione dichiarata'], ['Probabilità', 'Stima personale, non previsione certa'], ['Esito', 'Si registra senza riscrivere la decisione']].map(([a, b]) => h('div', { class: 'j-context' }, h('i', { 'aria-hidden': 'true' }), h('span', {}, h('b', {}, a), b)))), h('div', { class: 'j-warning' }, 'Un punteggio sintetico non è una raccomandazione automatica.')];
    return listPage('Decisioni', 'Ogni voce resta una registrazione distinta; impatto e probabilità sono input personali.', main, side);
  }

  function decisionDialog() {
    const form = h('form', { class: 'j-form', onsubmit: e => { e.preventDefault(); const f = e.currentTarget; decisions.unshift({ title: f.elements.title.value.trim(), type: f.elements.type.value, status: 'Da rivedere', reason: f.elements.reason.value.trim() || 'Ragionamento non indicato' }); dialog.close(); render(); } },
      h('label', {}, 'Decisione', h('input', { name: 'title', required: true, placeholder: 'Che cosa stai decidendo?' })),
      h('label', {}, 'Categoria', h('select', { name: 'type' }, ['Strategica', 'Apprendimento', 'Personale', 'Progetto'].map(value => h('option', {}, value)))),
      h('label', {}, 'Ragionamento', h('textarea', { name: 'reason', placeholder: 'Motivi e alternative considerate' })),
      h('p', { class: 'j-muted' }, 'La voce resta solo nella memoria temporanea della pagina.'),
      h('button', { class: 'j-btn primary', type: 'submit' }, 'Registra nella demo')
    );
    openDialog('Nuova decisione', form);
  }

  function goalsPage() {
    const main = [button('+ Aggiungi obiettivo', 'new-goal', () => goalDialog(), 'primary'), h('div', { class: 'j-list' }, goals.map((goal, i) => h('article', { class: 'j-row' },
      h('div', { class: 'j-topline' }, h('b', {}, goal.title), pill(goal.horizon, 'cyan')),
      h('p', {}, goal.progress),
      button('Aggiorna nella demo', 'goal-update-' + i, () => openDialog('Aggiorna obiettivo', h('div', { class: 'j-stack' }, h('p', { class: 'j-copy' }, 'Aggiornamento simulato; nessun archivio scritto.'), button('Aggiungi milestone demo', 'goal-add-' + i, () => { goal.progress += ' · milestone demo'; dialog.close(); render(); }, 'primary'))), 'ghost')
    )) )];
    const side = [h('p', { class: 'j-copy' }, 'La chat può aiutarti a ragionare sull’obiettivo. La modifica resta un’azione distinta.'), h('div', { class: 'j-warning' }, 'Numeri sintetici. Nessuna esecuzione automatica.')];
    return listPage('Obiettivi', 'Obiettivi di lungo periodo e milestone dichiarate.', main, side);
  }

  function goalDialog() {
    const form = h('form', { class: 'j-form', onsubmit: e => { e.preventDefault(); const f = e.currentTarget; goals.unshift({ title: f.elements.title.value.trim(), horizon: f.elements.horizon.value, progress: 'Non misurato' }); dialog.close(); render(); } },
      h('label', {}, 'Obiettivo', h('input', { name: 'title', required: true, placeholder: 'Descrivi il risultato' })),
      h('label', {}, 'Orizzonte', h('select', { name: 'horizon' }, ['30 giorni', '90 giorni', '1 anno', '5 anni'].map(value => h('option', {}, value)))),
      h('button', { class: 'j-btn primary', type: 'submit' }, 'Aggiungi nella demo')
    );
    openDialog('Nuovo obiettivo', form);
  }

  function focusPage() {
    const main = [h('div', { class: 'j-row' }, h('div', { class: 'j-topline' }, h('b', {}, 'Ripassare il capitolo 4'), pill('Focus demo', 'cyan')), h('p', {}, 'Origine: Missioni sintetiche · priorità alta · orario non disponibile')), button('Prepara proposta Focus', 'focus-proposal', () => { proposal = true; proposalState = 'In attesa'; tab = 'chat'; render(); }, 'primary'), proposalCard()];
    const side = [h('p', { class: 'j-copy' }, 'Il Focus cambia solo dopo revisione e approvazione specifica.'), h('div', { class: 'j-warning' }, 'Questa demo non comunica con il kernel di Jarvis (nome attuale nel prodotto) né con il Focus operativo.')];
    return listPage('Focus operativo', 'Rivedi la selezione corrente e prepara una proposta separata.', main, side);
  }

  function memoryPage() {
    const main = [h('div', { class: 'j-context-list' }, [['Second Brain', 'Non collegato in questo prototipo'], ['Memoria di ' + nm(), 'Fixture sintetiche'], ['Dati operativi', 'Riepilogo demo'], ['Testo esterno', 'Input non fidato']].map(([a, b]) => h('div', { class: 'j-context' }, h('i', { 'aria-hidden': 'true' }), h('span', {}, h('b', {}, a), b)))), h('div', { class: 'j-warning' }, 'Nessun contenuto Obsidian viene letto o inviato.'), button('Apri mappa Second Brain demo', 'open-brain', () => { location.href = '../second-brain/index.html'; }, 'ghost')];
    const side = [h('ol', { class: 'j-steps' }, ['Scegliere le fonti una per una.', 'Mostrare i campi che verranno usati.', 'Chiedere consenso esplicito e revocabile.', 'Separare lettura, proposta e scrittura.'].map(value => h('li', {}, value))), h('p', { class: 'j-muted' }, 'Questi principi non attivano autorizzazioni.')];
    return listPage('Memoria e fonti', `${nm()} distingue dati registrati, interpretazioni e testo non fidato.`, main, side);
  }

  function applyName() {
    document.title = nm() + ' · prototipo E1';
    const t = $('brand-name'); if (t) t.textContent = NAME;
  }

  function render() {
    const pages = { centro: centerPage, squadra: squadPage, chat: chatPage, briefing: briefingPage, decisioni: decisionPage, obiettivi: goalsPage, focus: focusPage, memoria: memoryPage };
    const keep = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.j : null, top = window.scrollY;
    root.replaceChildren(h('div', { class: 'j-shell' + (tab === 'centro' ? ' is-centro' : '') }, sidebar(), h('div', { class: 'j-main' }, ...pages[tab]())));
    if (keep) { const target = document.querySelector('[data-j="' + keep + '"]') || document.querySelector('[data-j="tab-' + tab + '"]'); if (target) target.focus({ preventScroll: true }); window.scrollTo(0, top); }
  }
  document.addEventListener('keydown', e => { if (e.key === '/' && tab === 'centro' && !e.ctrlKey && !e.metaKey && !e.altKey && !/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '') && !dialog.open) { e.preventDefault(); const f = document.getElementById('cmd-input'); if (f) f.focus(); } });

  $('dlg-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  $('appsBtn').addEventListener('click', () => openDialog('Tutte le app', h('p', { class: 'j-copy' }, 'Menu sintetico: Hub, Studio, Missioni, Planner, Calendario, Recovery e Second Brain.')));
  $('setBtn').addEventListener('click', () => openDialog('Impostazioni', h('p', { class: 'j-copy' }, 'Le impostazioni reali non sono riprodotte. Modalità, fonti e nome del capo qui sono dimostrativi.')));
  window.__jarvisDemo = { get state() { return { tab, active, mode, threads: threads.length, messages: currentThread().messages.length, proposal, proposalState, decisions: decisions.length, goals: goals.length, name: NAME }; }, go: key => { tab = key; render(); } };
  applyName();
  render();
})();
