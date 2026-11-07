/* Agora · prototipo E1. Funzioni ricavate da src/agora.html e src/agora_anime.html (pagina autonoma «Nexus»), src/dialogue-store.js e src/dialogue-memory.js.
   Tutti i valori sono FITTIZI («dati di prova»), «oggi» fisso. Ogni risposta del personaggio è un TESTO SEGNAPOSTO etichettato «Simulato · non confermato»:
   nessuna rete, nessun provider, nessuna persistenza, nessuna chiamata al prodotto. Al ricaricamento tutto torna allo stato iniziale. */
(() => {
  const TODAY = 'lun 2 nov';
  const ERAS = [['all', 'Tutti'], ['antica', 'Antichità'], ['rinascimento', 'Rinascimento'], ['illuminismo', 'Illuminismo'], ['moderna', 'Era moderna'], ['scienza', 'Scienza']];
  const ERA_L = Object.fromEntries(ERAS);
  /* Catalogo predefinito della pagina Agora: dodici figure, nessuna nell'era «Illuminismo» (come nel sorgente). Ruoli sintetici, senza citazioni. */
  const CH = [['socrate', 'Socrate', 'antica', 'Filosofo'], ['platone', 'Platone', 'antica', 'Filosofo'], ['marco_aurelio', 'Marco Aurelio', 'antica', 'Imperatore e filosofo'], ['seneca', 'Seneca', 'antica', 'Filosofo e scrittore'],
    ['leonardo', 'Leonardo da Vinci', 'rinascimento', 'Artista e ingegnere'], ['galileo', 'Galileo Galilei', 'rinascimento', 'Astronomo e fisico'],
    ['nietzsche', 'Friedrich Nietzsche', 'moderna', 'Filosofo'], ['dostoevskij', 'Fëdor Dostoevskij', 'moderna', 'Scrittore'],
    ['einstein', 'Albert Einstein', 'scienza', 'Fisico'], ['marie_curie', 'Marie Curie', 'scienza', 'Fisica e chimica'], ['darwin', 'Charles Darwin', 'scienza', 'Naturalista'], ['tesla', 'Nikola Tesla', 'scienza', 'Inventore']]
    .map(([id, name, era, role]) => ({ id, name, era, role, tags: ['dialogo'], custom: false }));
  const SUGG = ['Come si comincia a studiare un argomento difficile?', 'Che domanda dovrei farmi prima di decidere?', 'Puoi riassumere il tuo metodo in tre punti?'];
  const init = n => n.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const REPLY = n => `Risposta segnaposto (demo): nel prodotto qui risponde l'assistente nel ruolo di ${n}. Non è una citazione né una posizione verificata del personaggio.`;

  function fixture(s) {
    const q = (id, name, preview, date, msgs, extra) => ({ id, charId: id === 'cv3' ? 'leonardo' : id === 'cv2' ? 'marie_curie' : 'socrate', charName: name, preview, date, msgs, ...extra });
    const base = {
      ai: true, partial: false, empty: false,
      custom: [{ id: 'cu1', name: 'Ada Lovelace', era: 'scienza', role: 'Figura generata (demo)', tags: ['demo'], custom: true }],
      convs: [
        q('cv3', 'Leonardo da Vinci', 'Da dove comincio per disegnare un ponte', 'lun 2 nov', [{ role: 'u', text: 'Da dove comincio per disegnare un ponte?' }], { pending: true }),
        q('cv1', 'Socrate', 'Come capisco se una convinzione è davvero mia', 'dom 1 nov', [{ role: 'u', text: 'Come capisco se una convinzione è davvero mia?' }, { role: 'c', text: REPLY('Socrate') }, { role: 'u', text: 'E se non riesco a spiegarla?' }, { role: 'c', text: REPLY('Socrate') }]),
        q('cv2', 'Marie Curie', 'Come si organizza un quaderno di laboratorio', 'ven 30 ott', [{ role: 'u', text: 'Come si organizza un quaderno di laboratorio?' }, { role: 'c', text: REPLY('Marie Curie') }])],
      mems: { socrate: [{ t: 'Studia filosofia a scuola', src: '26 ott' }, { t: 'Preferisce domande brevi', src: '1 nov' }], marie_curie: [{ t: 'Tiene un quaderno di appunti', src: '30 ott' }] },
      insights: [{ id: 'in1', who: 'Socrate', text: 'Risposta segnaposto salvata per rileggerla (dato di prova).', conv: '1 nov' }]
    };
    if (s === 'vuoto') return { ...base, empty: true, custom: [], convs: [], mems: {}, insights: [] };
    if (s === 'offline') return { ...base, ai: false };
    if (s === 'parziale') return { ...base, partial: true, convs: [...base.convs, { id: 'cv9', bad: true }], mems: { ...base.mems, platone: ['voce storica'] } };
    return base;
  }

  /* ---------- Stato in memoria ---------- */
  let scen = 'normale', tab = 'riprendi', S = fixture(scen), era = 'all', query = '', chat = null, askDel = null, msgText = '', msgTimer = null, nid = 100, lastK = null, gen = null, cleared = false;
  const root = document.getElementById('root'), dlg = document.getElementById('dlg');
  const K = k => ({ 'data-k': k });
  const T = (cls, t, title) => h('span', { class: 'ag-tag ' + cls, ...(title ? { title } : {}) }, t);
  const REC = () => T('rec', 'Dai tuoi record'), RUL = () => T('rul', 'Regola dell\'app'), SIM = () => T('sim', 'Simulato · non confermato'), PRP = () => T('prop', 'Proposta di design'), AI = () => T('sim', 'Interpretazione AI · non verificata'), OWN = () => T('prf', 'Pagina autonoma');
  const note = msg => { msgText = msg; const live = document.getElementById('live'); live.textContent = ''; setTimeout(() => { live.textContent = msg; }, 60); document.querySelectorAll('.ag-status').forEach(el => { el.textContent = msg; }); clearTimeout(msgTimer); msgTimer = setTimeout(() => { msgText = ''; live.textContent = ''; document.querySelectorAll('.ag-status').forEach(el => { el.textContent = ''; }); }, 5000); };
  const clearNote = () => { msgText = ''; clearTimeout(msgTimer); };
  const chars = () => [...CH, ...S.custom], charOf = id => chars().find(c => c.id === id);
  const convsOf = id => S.convs.filter(c => c.charId === id && !c.bad), memsOf = id => S.mems[id] || [];
  const memText = m => typeof m === 'string' ? 'Voce storica da verificare' : m.t;
  const exch = c => Math.floor(c.msgs.length / 2);
  const card = (id, title, tag, ...body) => h('section', { class: 'card ag-card ag-sec', 'aria-labelledby': id }, h('div', { class: 'ag-hd' }, h('h2', { id }, title), tag || null), ...body);
  const empty = (msg, btn) => h('div', { class: 'ag-empty' }, h('b', {}, msg), btn || null);
  const ask = (what, yes) => h('div', { class: 'ag-ask', role: 'alertdialog', 'aria-label': 'Conferma eliminazione' }, h('span', {}, `Rimuovere ${what}?`), h('button', { class: 'ag-btn dng', type: 'button', ...K('dy'), onclick: () => { yes(); askDel = null; redrawAll(); note('Rimozione confermata (simulata, non salvata).'); } }, 'Rimuovi'), h('button', { class: 'ag-btn', type: 'button', ...K('dn'), onclick: () => { askDel = null; redrawAll(); } }, 'Annulla'));
  const redrawAll = () => { render(); if (dlg.open && gen) drawGen(); };

  function render(focusK) {
    const fk = focusK === false ? null : focusK || document.activeElement?.dataset?.k, top = window.scrollY;
    root.replaceChildren(...build());
    if (fk) [fk, 'tab-' + tab].map(k => document.querySelector(`[data-k="${k}"]`)).find(Boolean)?.focus({ preventScroll: true });
    window.scrollTo(0, top);
  }
  const VIEWS = { riprendi, personaggi, archivio, ricordi, chat: chatView };
  const notice = () => S.partial ? 'Alcuni dati non sono leggibili: gli originali sono conservati e non vengono sostituiti. Le voci interessate lo dicono; il resto resta utilizzabile.' : '';
  const build = () => [demoPanel(), notice() ? h('p', { class: 'ag-notice', role: 'status' }, notice()) : null, tabs(), h('p', { class: 'ag-status', 'aria-hidden': 'true' }, msgText), ...VIEWS[tab]()].filter(Boolean);
  const go = t => { tab = t; askDel = null; clearNote(); render(); };

  const SCEN = [['normale', 'Dati di prova'], ['vuoto', 'Nessun dato'], ['offline', 'Assistente non disponibile'], ['parziale', 'Dati da verificare']];
  const demoPanel = () => h('details', { class: 'ag-scen' },
    h('summary', {}, h('span', {}, 'Demo e guida'), h('b', {}, SCEN.find(x => x[0] === scen)[1])),
    h('p', { class: 'ag-demo-copy' }, 'Cambia scenario per vedere stati diversi. Tutte le azioni restano simulate.'),
    h('div', { class: 'ag-scen-o', role: 'group', 'aria-label': 'Scegli lo scenario dimostrativo' }, SCEN.map(([k, l]) => h('button', { type: 'button', class: 'ag-btn', ...K('sc-' + k), 'aria-pressed': String(scen === k), onclick: () => setScen(k) }, l))),
    legend());
  function setScen(k) { clearNote(); scen = k; S = fixture(k); tab = 'riprendi'; era = 'all'; query = ''; chat = null; askDel = null; gen = null; if (dlg.open) dlg.close(); render(); }
  const legend = () => h('details', { class: 'ag-leg' }, h('summary', {}, 'Come leggere le etichette: conversazioni, personaggi, ricordi e testi generati'), h('div', { class: 'ag-legend' }, h('span', {}, REC(), 'scritto o registrato da te (le tue domande, le conversazioni, i personaggi che aggiungi)'), h('span', {}, AI(), 'ricordo estratto da un tuo messaggio: è un\'interpretazione, non un fatto'), h('span', {}, SIM(), 'testo segnaposto al posto di una risposta o di un personaggio generato'), h('span', {}, RUL(), 'calcolo fisso dell\'app'), h('span', {}, OWN(), 'sezione che vive in un\'altra pagina')));
  const tabs = () => h('nav', { class: 'ag-tabs four', 'aria-label': 'Sezioni di Agora' }, [['riprendi', 'Riprendi'], ['personaggi', 'Personaggi'], ['archivio', 'Archivio'], ['ricordi', 'Ricordi']].map(([k, l]) => h('button', { type: 'button', ...K('tab-' + k), ...(tab === k ? { 'aria-current': 'page' } : {}), onclick: () => go(k) }, l)));

  /* ---------- Riprendi ---------- */
  function convRow(c, k) {
    if (c.bad) return h('div', { class: 'ag-row' }, h('div', { class: 'ag-t' }, 'Conversazione non leggibile'), h('p', { class: 'ag-err', role: 'alert', style: 'display:block' }, 'Formato non riconosciuto. Originale conservato: non si può aprire né modificare da qui.'));
    return h('div', { class: 'ag-row' }, h('div', { class: 'ag-who' }, h('span', { class: 'ag-av' + (charOf(c.charId)?.custom ? ' cu' : ''), 'aria-hidden': 'true' }, init(c.charName)), h('div', {}, h('div', { class: 'ag-t' }, c.charName), h('div', { class: 'ag-s' }, c.date + ' · ' + exch(c) + (exch(c) === 1 ? ' scambio' : ' scambi')))),
      h('p', { class: 'ag-by' }, '«' + c.preview + '…»'), h('div', { class: 'ag-rl' }, REC(), c.pending ? h('span', { class: 'ag-pill wn' }, 'Domanda senza risposta') : null),
      h('div', { class: 'ag-ra' }, h('button', { class: 'ag-btn' + (c.pending ? ' pri' : ''), type: 'button', ...K(k + c.id), onclick: () => openChar(c.charId, c.id) }, c.pending ? 'Riprendi la risposta' : 'Riprendi la conversazione')));
  }
  function riprendi() {
    const last = S.convs.find(c => !c.bad);
    const hero = h('section', { class: 'card ag-card ag-hero', 'aria-labelledby': 'ag-h' },
      h('div', { class: 'ag-hh' }, h('span', { class: 'eyebrow' }, 'Oggi · ' + TODAY), h('span', { class: 'ag-pill ' + (S.ai ? 'ok' : 'wn') }, S.ai ? 'Assistente: disponibile (simulato)' : 'Assistente: non disponibile (simulato)')),
      h('h2', { class: 'ag-big', id: 'ag-h' }, last ? 'Riprendi la conversazione' : 'Con chi vuoi dialogare?'),
      last ? convRow(last, 'hero-') : h('p', { class: 'ag-by' }, 'Non hai ancora conversazioni. Scegli un personaggio per cominciare: le tue domande restano tue, le risposte sono quelle del personaggio.'),
      h('div', { class: 'ag-acts' }, h('button', { class: 'ag-btn' + (last ? '' : ' pri big'), type: 'button', ...K('hero-main'), onclick: () => go('personaggi') }, 'Scegli un personaggio'), last ? h('button', { class: 'ag-btn', type: 'button', ...K('hero-arch'), onclick: () => go('archivio') }, 'Apri l\'archivio') : null),
      h('p', { class: 'ag-fine' }, 'Le risposte non sono parole del personaggio storico: le scrive un assistente nel suo ruolo e restano non verificate.'));
    const nm = S.mems, total = Object.values(nm).reduce((a, b) => a + b.length, 0);
    const privacyRows = [
      ['Le tue conversazioni', 'Archivio di Agora su questo dispositivo: si riapre o si cancella tutto; non si elimina una singola conversazione'],
      ['I ricordi dei personaggi', 'Restano su questo dispositivo, non vengono inviati all\'assistente e non vengono aggiornati. Un ricordo si può solo dimenticare'],
      ['I personaggi che aggiungi', 'Catalogo di Agora: si generano da una descrizione, si rimuovono; il testo generato è «da verificare»'],
      ['Le intuizioni salvate', 'Risposte dei personaggi che salvi con «Salva»: interpretate, non verificate, non sono fatti su di te'],
      ['Personaggi anime', 'Agora Anime è una pagina autonoma («Nexus») con catalogo, archivio, ricordi e intuizioni propri']
    ].map(([a, b]) => h('div', { class: 'ag-own' }, h('b', {}, a), h('span', {}, b)));
    const privacyDetails = h('details', { class: 'ag-own-details' },
      h('summary', { class: 'ag-sum' }, 'Dettagli su dati e controlli'),
      h('div', { class: 'ag-own-content' }, privacyRows));
    const own = card('ag-o', 'Privacy e dati', null,
      h('p', { class: 'ag-by ag-own-lead' }, `Le conversazioni restano su questo dispositivo. I ricordi non vengono inviati all’assistente. ${total} ricordi di prova.`),
      privacyDetails,
      h('div', { class: 'ag-acts' }, h('button', { class: 'ag-btn', type: 'button', ...K('go-mem'), onclick: () => go('ricordi') }, `Vedi i ricordi (${total})`), h('button', { class: 'ag-btn', type: 'button', ...K('go-anime'), onclick: () => note('Anteprima di navigazione verso Agora Anime (pagina autonoma): nessuna azione.') }, 'Apri Agora Anime')));
    return [h('div', { class: 'ag-cols' }, h('div', { class: 'ag-sec' }, hero), h('div', { class: 'ag-sec' }, own))];
  }

  /* ---------- Personaggi ---------- */
  function personaggi() {
    const q = query.trim().toLocaleLowerCase('it'), list = chars().filter(c => (era === 'all' || c.era === era) && (!q || (c.name + ' ' + c.role).toLocaleLowerCase('it').includes(q)));
    const filters = h('div', { class: 'ag-era', role: 'group', 'aria-label': 'Filtra per era' }, ERAS.map(([k, l]) => h('button', { type: 'button', ...K('era-' + k), 'aria-pressed': String(era === k), onclick: () => { era = k; render(); } }, l)));
    const find = h('div', { class: 'ag-f' }, h('label', { for: 'ag-q' }, 'Cerca un personaggio'), h('input', { id: 'ag-q', type: 'search', placeholder: 'Nome o ruolo', value: query, oninput: e => { query = e.target.value; const pos = e.target.selectionStart; render(false); const i = document.getElementById('ag-q'); i.focus({ preventScroll: true }); i.setSelectionRange(pos, pos); } }));
    const cardOf = c => { const nc = convsOf(c.id).length, nmem = memsOf(c.id).length; return h('div', { class: 'ag-row' }, h('div', { class: 'ag-who' }, h('span', { class: 'ag-av' + (c.custom ? ' cu' : ''), 'aria-hidden': 'true' }, init(c.name)), h('div', {}, h('div', { class: 'ag-t' }, c.name), h('div', { class: 'ag-s' }, c.role + ' · ' + ERA_L[c.era]))),
      h('div', { class: 'ag-rl' }, c.custom ? SIM() : T('rul', 'Catalogo di Agora'), c.custom ? T('rec', 'Aggiunto da te') : null), h('div', { class: 'ag-chips' }, h('span', { class: 'ag-chip' }, nc + (nc === 1 ? ' conversazione' : ' conversazioni')), h('span', { class: 'ag-chip' }, nmem + (nmem === 1 ? ' ricordo' : ' ricordi'))),
      h('div', { class: 'ag-ra' }, h('button', { class: 'ag-btn pri', type: 'button', ...K('op-' + c.id), 'aria-label': (nc ? 'Nuovo dialogo con ' : 'Apri ') + c.name, onclick: () => openChar(c.id) }, nc ? 'Nuovo dialogo' : 'Apri'), nc ? h('button', { class: 'ag-btn', type: 'button', ...K('rp-' + c.id), 'aria-label': 'Riprendi con ' + c.name, onclick: () => openChar(c.id, convsOf(c.id)[0].id) }, 'Riprendi') : null)); };
    const results = list.length ? h('div', { class: 'ag-grid' }, list.map(cardOf)) : h('div', { class: 'ag-empty' }, h('b', {}, q ? 'Nessun personaggio trovato.' : 'Nessuna figura in questa era.'), h('p', { class: 'ag-by' }, q ? 'Prova un altro nome.' : 'Il catalogo predefinito non ne ha. Puoi generarne una tu (demo).'), h('button', { class: 'ag-btn', type: 'button', ...K('add-empty'), onclick: openGen }, 'Aggiungi una figura'));
    const anime = h('section', { class: 'card ag-card ag-sec', 'aria-labelledby': 'ag-an' }, h('div', { class: 'ag-hd' }, h('h2', { id: 'ag-an' }, 'Personaggi anime'), OWN()), h('p', { class: 'ag-by' }, 'Agora Anime (nella pagina «Nexus») non è una scheda di Agora: ha un catalogo, un archivio, ricordi e intuizioni separati, con lo stesso modo di dialogare.'), h('button', { class: 'ag-btn', type: 'button', ...K('anime'), onclick: () => note('Anteprima di navigazione verso Agora Anime (pagina autonoma): nessuna azione.') }, 'Apri Agora Anime'));
    return [h('div', { class: 'ag-cols' }, h('div', { class: 'ag-sec' }, card('ag-pc', 'Scegli un personaggio', T('rul', chars().length + ' figure'), filters, find, h('p', { class: 'ag-fine', role: 'status' }, list.length + (list.length === 1 ? ' figura mostrata' : ' figure mostrate')), results), h('div', { class: 'ag-acts' }, h('button', { class: 'ag-btn', type: 'button', ...K('add'), onclick: openGen }, 'Aggiungi una figura (generata)'))), h('div', { class: 'ag-sec' }, anime))];
  }

  /* ---------- Conversazione ---------- */
  function openChar(id, convId) {
    const c = charOf(id), conv = convId ? S.convs.find(x => x.id === convId) : null; if (!c) return;
    chat = { charId: id, convId: conv ? conv.id : null, msgs: conv ? conv.msgs.map(m => ({ ...m })) : [], mentor: false, err: '', draft: '' };
    tab = 'chat'; askDel = null; clearNote(); render(false); document.querySelector('[data-k="ch-in"]')?.focus({ preventScroll: true }); window.scrollTo(0, 0);
  }
  const pace = n => { const lv = Math.min(5, Math.ceil(n / 3) + 1); return ['Appena iniziato', 'In dialogo', 'Coinvolto', 'Profondo', 'In flow'][lv - 1]; };
  function chatView() {
    const c = charOf(chat.charId), mem = memsOf(c.id), last = chat.msgs.at(-1), pend = last && last.role === 'u';
    const head = card('ch-h', c.name, c.custom ? SIM() : T('rul', 'Catalogo di Agora'), h('div', { class: 'ag-who' }, h('span', { class: 'ag-av' + (c.custom ? ' cu' : ''), 'aria-hidden': 'true' }, init(c.name)), h('div', {}, h('div', { class: 'ag-s' }, c.role + ' · ' + ERA_L[c.era]))),
      h('div', { class: 'ag-rl' }, h('span', { class: 'ag-pill cy' }, pace(chat.msgs.length)), h('span', { class: 'ag-pill' }, Math.floor(chat.msgs.length / 2) + (Math.floor(chat.msgs.length / 2) === 1 ? ' scambio' : ' scambi')), RUL()),
      h('p', { class: 'ag-fine' }, 'Il «ritmo» dipende solo dal numero di messaggi: non misura l\'umore del personaggio né il tuo.'), c.custom ? h('p', { class: 'ag-fine' }, 'Personaggio generato: biografia e frase da verificare.') : null,
      h('button', { class: 'ag-btn ag-back', type: 'button', ...K('back'), onclick: () => go('personaggi') }, '← Personaggi'));
    const shown = mem.slice(-4), off = mem.length - shown.length;
    const memBox = card('ch-m', 'Ricordi di ' + c.name, REC(), h('p', { class: 'ag-fine' }, 'Ricordi locali: non inviati all\'assistente e non aggiornati.'),
      shown.length ? h('div', { class: 'ag-list' }, shown.map((m, i) => h('div', { class: 'ag-mem' }, h('span', {}, '↩ ' + memText(m)), AI(), h('button', { class: 'ag-btn ghost', type: 'button', ...K('fg-' + (off + i)), 'aria-label': 'Dimentica il ricordo: ' + memText(m), onclick: () => confirmForget(c.id, off + i) }, 'Dimentica')))) : h('p', { class: 'ag-by' }, 'Nessun ricordo per questo personaggio.'), mem.length > 4 ? h('p', { class: 'ag-fine' }, 'Qui compaiono gli ultimi 4 ricordi; l\'elenco completo è in «Ricordi».') : null);
    const msgs = h('div', { class: 'ag-msgs', role: 'log', 'aria-label': 'Conversazione' }, chat.msgs.length ? chat.msgs.map((m, i) => m.role === 'u' ? h('div', { class: 'ag-msg u' }, h('div', { class: 'ag-rl' }, REC(), m.mentor ? h('span', { class: 'ag-pill cy' }, 'Problema reale') : null), h('p', {}, m.text)) :
      h('div', { class: 'ag-msg c' }, h('div', { class: 'ag-rl' }, SIM()), h('p', {}, m.text), h('div', { class: 'ag-ra' }, h('button', { class: 'ag-btn', type: 'button', ...K('cp-' + i), onclick: () => note('Copia simulata: nessun testo è stato copiato.') }, 'Copia'), h('button', { class: 'ag-btn', type: 'button', ...K('sv-' + i), 'aria-pressed': String(!!m.saved), onclick: () => saveInsight(i) }, m.saved ? '★ Salvata' : '★ Salva come intuizione')))) : h('p', { class: 'ag-by' }, 'Nessun messaggio. Scrivi una domanda o scegli un suggerimento.'));
    const sugg = h('div', { class: 'ag-chips', role: 'group', 'aria-label': 'Suggerimenti' }, SUGG.map((s, i) => h('button', { class: 'ag-btn ghost', type: 'button', ...K('sg-' + i), onclick: () => { chat.draft = s; render('ch-in'); document.querySelector('[data-k="ch-in"]')?.focus(); } }, s)));
    const input = h('form', { class: 'ag-input', novalidate: '', onsubmit: e => { e.preventDefault(); send(); } },
      h('label', { class: 'ag-s', for: 'ag-in' }, 'Il tuo messaggio'), h('textarea', { id: 'ag-in', ...K('ch-in'), placeholder: chat.mentor ? 'Descrivi il tuo problema o la tua situazione reale…' : 'Scrivi la tua domanda…', oninput: e => { chat.draft = e.target.value; }, onkeydown: e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } } }, chat.draft),
      h('p', { class: 'ag-err', role: 'alert' }, chat.err), pend ? h('button', { class: 'ag-btn pri', type: 'button', ...K('resume'), onclick: resume }, '↻ Riprendi la risposta') : null,
      h('div', { class: 'ag-fa' }, h('button', { class: 'ag-btn pri', type: 'submit', ...K('send') }, 'Invia'), h('button', { class: 'ag-btn', type: 'button', ...K('mentor'), 'aria-pressed': String(chat.mentor), onclick: () => { chat.mentor = !chat.mentor; render(); note(chat.mentor ? 'Modalità mentore attiva: il prossimo messaggio è un problema reale.' : 'Modalità mentore disattivata.'); } }, chat.mentor ? 'Consiglio su un problema reale: attivo' : 'Consiglio su un problema reale')),
      h('p', { class: 'ag-fine' }, 'Invio per inviare, Maiusc+Invio per andare a capo. Invio e modalità Mentore sono simulati.'),
      chat.mentor ? h('div', { class: 'ag-mentor-note', role: 'note' }, h('b', {}, 'Contesto aggiunto · comportamento del prodotto'), h('p', {}, 'Con Mentore attivo, il prodotto antepone al tuo messaggio questa istruzione:'), h('code', {}, '[PROBLEMA REALE DA AFFRONTARE COME MENTOR]'), h('p', {}, 'In questo prototipo non viene inviato nulla.')) : null);
    return [h('div', { class: 'ag-cols' }, h('div', { class: 'ag-sec' }, card('ch-c', 'Conversazione', SIM(), msgs, sugg, input)), h('div', { class: 'ag-sec ag-first' }, head, memBox))];
  }
  function ensureConv() {
    const c = charOf(chat.charId); let conv = chat.convId ? S.convs.find(x => x.id === chat.convId) : null;
    if (!conv) { conv = { id: 'cv' + (++nid), charId: c.id, charName: c.name, preview: '', date: TODAY, msgs: [], pending: false }; S.convs.unshift(conv); chat.convId = conv.id; }
    return conv;
  }
  const sync = () => { const conv = ensureConv(); conv.msgs = chat.msgs.map(m => ({ role: m.role, text: m.text })); conv.pending = chat.msgs.at(-1)?.role === 'u'; conv.preview = (chat.msgs.find(m => m.role === 'u')?.text || '').slice(0, 60).replace(/[?.!]+$/, ''); };
  function reply() { const c = charOf(chat.charId); chat.msgs.push({ role: 'c', text: REPLY(c.name) }); sync(); }
  function send() {
    const text = chat.draft.trim(); chat.err = '';
    if (chat.msgs.at(-1)?.role === 'u') { chat.err = 'Riprendi la risposta precedente oppure apri un nuovo dialogo.'; render('ch-in'); return; }
    if (!text) { chat.err = 'Scrivi un messaggio.'; render('ch-in'); return; }
    if (text.length > 12000) { chat.err = 'Messaggio oltre i 12000 caratteri.'; render('ch-in'); return; }
    chat.msgs.push({ role: 'u', text, mentor: chat.mentor }); chat.draft = ''; chat.mentor = false; sync();
    if (!S.ai) { chat.err = 'Dialogo non completato: assistente non disponibile (simulato). La tua domanda è salvata: puoi riprendere la risposta.'; render('resume'); return; }
    reply(); render('ch-in'); note('Risposta simulata: nessuna richiesta all\'assistente.');
  }
  function resume() {
    chat.err = ''; if (!S.ai) { chat.err = 'Dialogo non completato: assistente non disponibile (simulato). La domanda resta salvata.'; render('resume'); return; }
    reply(); render('ch-in'); note('Risposta ripresa (simulata): nessuna richiesta all\'assistente.');
  }
  function saveInsight(i) {
    const m = chat.msgs[i]; if (m.saved) { note('Intuizione già salvata.'); return; }
    m.saved = true; S.insights.unshift({ id: 'in' + (++nid), who: charOf(chat.charId).name, text: m.text, conv: TODAY }); render(); note('Intuizione salvata (simulato): è una risposta del personaggio interpretata e non verificata, non un fatto su di te.');
  }

  /* ---------- Archivio ---------- */
  function archivio() {
    const list = card('ar-l', 'Conversazioni (' + S.convs.filter(c => !c.bad).length + ')', REC(), S.convs.length ? h('div', { class: 'ag-list' }, S.convs.map(c => convRow(c, 'ar-'))) : empty('Nessuna conversazione ancora.', h('button', { class: 'ag-btn pri', type: 'button', ...K('ar-go'), onclick: () => go('personaggi') }, 'Scegli un personaggio')));
    const act = card('ar-a', 'Cancella l\'archivio', RUL(), h('p', { class: 'ag-by' }, 'Nel prodotto l\'archivio si cancella tutto insieme; non esiste l\'eliminazione di una singola conversazione né un\'esportazione da qui.'), h('button', { class: 'ag-btn dng', type: 'button', ...K('clear'), disabled: !S.convs.length, onclick: () => confirmDlg('Cancellare tutte le conversazioni?', 'Verranno rimosse tutte le conversazioni di Agora (simulato). I ricordi e le intuizioni salvate non vengono toccati. Nel prodotto la cancellazione è annullabile dalle modifiche recenti.', 'Cancella tutto', () => { S.convs = []; if (chat) chat = null; if (tab === 'chat') tab = 'archivio'; note('Archivio cancellato (simulato, non salvato).'); }, 'clear') }), h('p', { class: 'ag-fine' }, 'Nel prodotto la cancellazione chiede conferma con la finestra del browser e non parte mentre aspetti una risposta; qui la conferma è una finestra E1.'));
    return [h('div', { class: 'ag-cols' }, h('div', { class: 'ag-sec' }, list), h('div', { class: 'ag-sec' }, act))];
  }

  /* ---------- Ricordi e intuizioni ---------- */
  function ricordi() {
    const ids = Object.keys(S.mems).filter(id => S.mems[id].length), total = ids.reduce((a, id) => a + S.mems[id].length, 0);
    const rules = card('rc-r', 'Chi controlla i ricordi', RUL(), h('div', {}, [['Dove stanno', 'Su questo dispositivo, nell\'archivio di Agora.'], ['Cosa sono', 'Interpretazioni di un tuo messaggio fatte da un assistente: non verificate.'], ['Cosa succede ora', 'Non vengono inviati all\'assistente e non vengono aggiornati da nuove conversazioni.'], ['Come si correggono', 'Non si modificano né si aggiungono a mano: si può solo dimenticarli, dopo conferma.'], ['Se ti pentisci', 'Il prodotto indica che l\'operazione si può annullare dalla cronologia delle operazioni.']].map(([a, b]) => h('div', { class: 'ag-own' }, h('b', {}, a), h('span', {}, b)))));
    const groups = ids.length ? ids.map(id => { const c = charOf(id); return card('rc-' + id, c.name + ' (' + S.mems[id].length + ')', REC(), h('div', { class: 'ag-list' }, S.mems[id].map((m, i) => h('div', { class: 'ag-row' }, h('div', { class: 'ag-t' }, memText(m)), h('div', { class: 'ag-rl' }, AI(), typeof m === 'string' ? null : h('span', { class: 'ag-s' }, 'dal tuo messaggio del ' + m.src)), h('div', { class: 'ag-ra' }, h('button', { class: 'ag-btn ghost', type: 'button', ...K('fg-' + id + '-' + i), 'aria-label': 'Dimentica il ricordo: ' + memText(m), onclick: () => confirmForget(id, i) }, 'Dimentica')))))); }) : [card('rc-e', 'Ricordi registrati (0)', REC(), empty('Nessun ricordo registrato.', h('p', { class: 'ag-by' }, 'Nuovi ricordi non si creano da questa pagina.')))];
    const ins = card('rc-i', 'Intuizioni salvate (' + S.insights.length + ')', REC(), S.insights.length ? h('div', { class: 'ag-list' }, S.insights.map(x => h('div', { class: 'ag-row' }, h('div', { class: 'ag-s' }, x.who + ' · ' + x.conv), h('p', { class: 'ag-by' }, x.text), h('div', { class: 'ag-rl' }, AI(), T('prop', 'Non è un fatto su di te'))))) : empty('Nessuna intuizione salvata. Si salvano dalla conversazione con «Salva».'), h('p', { class: 'ag-fine' }, 'Nel sorgente le intuizioni si salvano ma non si eliminano da questa pagina.'));
    return [h('div', { class: 'ag-cols' }, h('div', { class: 'ag-sec' }, ...groups), h('div', { class: 'ag-sec' }, rules, ins))];
  }

  /* ---------- Dialoghi ---------- */
  function openDlg(title, nodes) { lastK = document.activeElement?.dataset?.k || document.activeElement?.id || null; document.getElementById('dlg-t').textContent = title; document.getElementById('dlg-b').replaceChildren(h('p', { class: 'ag-sim' }, 'Simulazione · nessun salvataggio'), ...nodes); if (!dlg.open) dlg.showModal(); }
  function closeDlg() { if (dlg.open) dlg.close(); }
  document.getElementById('dlg-x').onclick = closeDlg;
  dlg.addEventListener('close', () => { gen = null; document.getElementById('dlg-b').replaceChildren(); const t = (lastK && (document.querySelector(`[data-k="${lastK}"]`) || document.getElementById(lastK))) || document.querySelector(`[data-k="tab-${tab}"]`); t?.focus({ preventScroll: true }); });
  dlg.addEventListener('click', e => { if (e.target === dlg) closeDlg(); });
  function confirmDlg(title, text, yes, fn, opener) { openDlg(title, [h('p', { class: 'ag-by' }, text), h('div', { class: 'ag-fa' }, h('button', { class: 'ag-btn dng', type: 'button', ...K('cf-yes'), onclick: () => { fn(); closeDlg(); render(); } }, yes), h('button', { class: 'ag-btn', type: 'button', ...K('cf-no'), onclick: closeDlg }, 'Annulla'))]); lastK = opener; document.querySelector('[data-k="cf-no"]')?.focus(); }
  function confirmForget(id, idx) { const m = memsOf(id)[idx]; if (m === undefined) return; confirmDlg('Dimenticare questo ricordo?', `«${memText(m)}» verrà dimenticato (simulato). Potrai annullare dalla cronologia delle operazioni, come indicato dall'app.`, 'Dimentica', () => { S.mems[id].splice(idx, 1); if (!S.mems[id].length) delete S.mems[id]; note('Ricordo dimenticato (simulato, non salvato).'); }, document.activeElement?.dataset?.k || null); }

  function openGen() { gen = { name: '', era: 'moderna', notes: '', prev: null, err: '' }; lastK = document.activeElement?.dataset?.k || null; drawGen(); document.querySelector('#dlg-b input')?.focus(); }
  function drawGen() {
    const g = gen, f = (id, label, key, ph) => h('div', { class: 'ag-f' }, h('label', { for: id }, label), h('input', { id, type: 'text', placeholder: ph, value: g[key], oninput: e => { g[key] = e.target.value; } }));
    const form = h('form', { class: 'ag-form', novalidate: '', onsubmit: e => { e.preventDefault(); generate(); } }, f('gn-n', 'Nome del personaggio', 'name', 'Per esempio: Immanuel Kant'),
      h('div', { class: 'ag-f' }, h('label', { for: 'gn-e' }, 'Era o categoria'), h('select', { id: 'gn-e', onchange: e => { g.era = e.target.value; } }, ERAS.slice(1).map(([k, l]) => h('option', { value: k, ...(g.era === k ? { selected: '' } : {}) }, l)))), f('gn-o', 'Note (facoltative)', 'notes', 'Per esempio: focus sulla critica della ragione'),
      h('p', { class: 'ag-err', role: 'alert' }, g.err), h('button', { class: 'ag-btn pri', type: 'submit', ...K('gn-go') }, 'Genera il personaggio (demo)'));
    const prev = g.prev ? h('div', { class: 'ag-ai', role: 'region', 'aria-labelledby': 'gn-p' }, h('div', { class: 'ag-hd' }, h('h3', { id: 'gn-p' }, 'Bozza: ' + g.prev.name), SIM()), h('p', { class: 'ag-by' }, g.prev.role), h('p', { class: 'ag-by' }, 'Frase generata, non verificata: testo segnaposto.'), h('p', { class: 'ag-fine' }, 'Istruzioni del personaggio (segnaposto): nel prodotto vengono mostrate in parte, come bozza da verificare.'),
      h('div', { class: 'ag-fa' }, h('button', { class: 'ag-btn pri', type: 'button', ...K('gn-save'), onclick: saveGen }, 'Aggiungi all\'Agora'), h('button', { class: 'ag-btn', type: 'button', ...K('gn-drop'), onclick: () => { g.prev = null; drawGen(); } }, 'Scarta'))) : null;
    const added = h('div', { class: 'ag-sec' }, h('div', { class: 'ag-hd' }, h('h3', {}, 'Figure aggiunte da te'), h('span', { class: 'ag-pill' }, String(S.custom.length))), S.custom.length ? h('div', { class: 'ag-list' }, S.custom.map(c => h('div', { class: 'ag-row' }, h('div', { class: 'ag-t' }, c.name), h('div', { class: 'ag-s' }, ERA_L[c.era]), h('div', { class: 'ag-ra' }, h('button', { class: 'ag-btn ghost', type: 'button', ...K('rm-' + c.id), 'aria-label': 'Rimuovi ' + c.name, onclick: () => { askDel = c.id; drawGen(); } }, '✕ Rimuovi')), askDel === c.id ? ask(c.name, () => { S.custom = S.custom.filter(x => x !== c); }) : null))) : h('p', { class: 'ag-by' }, 'Nessuna figura aggiunta ancora.'), h('p', { class: 'ag-fine' }, 'Le conversazioni con una figura rimossa restano nell\'archivio; nel prodotto la rimozione è annullabile dalle modifiche recenti.'));
    document.getElementById('dlg-t').textContent = 'Aggiungi una figura'; document.getElementById('dlg-b').replaceChildren(h('p', { class: 'ag-sim' }, 'Simulazione · nessun salvataggio'), form, prev, added); if (!dlg.open) dlg.showModal();
  }
  function generate() {
    gen.err = ''; const n = gen.name.trim();
    if (!n) { gen.err = 'Inserisci il nome del personaggio.'; drawGen(); document.getElementById('gn-n')?.focus(); return; }
    if (!S.ai) { gen.err = 'Assistente non disponibile (simulato): nessuna bozza generata. Il testo resta nel campo.'; drawGen(); return; }
    gen.prev = { name: n, role: 'Figura generata (demo)', era: gen.era }; drawGen(); document.querySelector('[data-k="gn-save"]')?.focus(); note('Bozza simulata: nessuna richiesta all\'assistente.');
  }
  function saveGen() {
    const p = gen.prev; if (!p) return; if (chars().some(c => c.name.toLowerCase() === p.name.toLowerCase())) { gen.err = 'Esiste già una figura con questo nome.'; drawGen(); return; }
    S.custom.push({ id: 'cu' + (++nid), name: p.name, era: p.era, role: p.role, tags: ['demo'], custom: true }); gen.prev = null; gen.name = ''; gen.notes = ''; drawGen(); render(false); note(p.name + ' aggiunto all\'Agora (simulato, non salvato).'); document.getElementById('gn-n')?.focus();
  }

  /* ---------- Finestre globali ---------- */
  function moduleDialog(id, title, body, openerId) { const d = h('dialog', { id, 'aria-labelledby': id + '-title' }); d.append(h('div', { class: 'dh' }, h('h2', { id: id + '-title' }, title), h('button', { class: 'chip', type: 'button', 'aria-label': 'Chiudi', onclick: () => d.close() }, '✕')), h('div', { class: 'db' }, body)); d.addEventListener('click', e => { if (e.target === d) d.close(); }); d.addEventListener('close', () => { setTimeout(() => document.getElementById(openerId)?.focus({ preventScroll: true }), 0); }); document.body.append(d); return d; }
  const APP_GROUPS = [
    ['Quotidiano', [['☰', 'Diario della giornata'], ['⚔', 'Missioni'], ['▦', 'Calendario'], ['✦', 'Planner AI'], ['◷', 'Weekly Review'], ['⚖', 'Decisioni']]],
    ['Apprendimento', [['🎓', 'Studio'], ['📚', 'Library'], ['🃏', 'Flashcard'], ['⚙', 'Engineer']]],
    ['Corpo e creatività', [['🏋', 'Leo Protocol'], ['⚡', 'Recovery'], ['🎨', 'Arte & Musica'], ['🏛', 'Agora', 'questa pagina'], ['🎌', 'Agora Anime', 'pagina autonoma · «Nexus»']]],
    ['Gioco', [['⚔', 'Life RPG'], ['🌌', 'Dungeon']]],
    ['Intelligenza', [['◎', 'Jarvis'], ['✦', 'Second Brain'], ['✧', 'Idea Hub', 'sezione autonoma · da progettare'], ['🤖', 'AI Coach'], ['⚙', 'Profilo operativo']]],
    ['Sistema', [['⚙', 'Impostazioni'], ['⛁', 'Backup e ripristino'], ['🔑', 'Chiave API'], ['⚡', 'PolyFeed']]]
  ];
  const appSearch = h('input', { class: 'field', type: 'search', placeholder: 'Cerca una sezione…', 'aria-label': 'Cerca una sezione', style: 'width:100%' }), appList = h('div', {});
  const drawApps = () => { const qy = appSearch.value.trim().toLocaleLowerCase('it'); appList.replaceChildren(); let n = 0;
    for (const [g, items] of APP_GROUPS) { const ms = items.filter(([, l]) => l.toLocaleLowerCase('it').includes(qy)); if (!ms.length) continue; n += ms.length;
      appList.append(h('div', { class: 'grp' }, h('h3', {}, g), h('div', { class: 'items' }, ms.map(([ic, l, nt]) => h('button', { class: 'item', type: 'button', onclick: () => { dApps.close(); if (l === 'Agora') go('riprendi'); else note('Collegamento simulato: ' + l + '.'); } }, h('span', { class: 'ic', 'aria-hidden': 'true' }, ic), h('span', { class: 'l' }, l, nt ? h('small', {}, nt) : null)))))); }
    if (!n) appList.append(h('p', { class: 'empty' }, 'Nessuna sezione trovata.')); };
  appSearch.addEventListener('input', drawApps); drawApps();
  const dApps = moduleDialog('ag-apps', 'Tutte le app', h('div', {}, h('div', { class: 'sim' }, 'Collegamenti simulati · nessuna funzione esterna viene aperta'), appSearch, appList), 'appsBtn');
  const dSet = moduleDialog('ag-settings', 'Impostazioni', h('div', {}, h('div', { class: 'sim' }, 'Anteprima della struttura · le voci d\'esempio non modificano l\'app'), h('div', { class: 'legend' }, h('span', {}, h('span', { class: 'badge real' }, 'Esistente'), ' già presente nell\'app'), h('span', {}, h('span', { class: 'badge ex' }, 'Esempio'), ' solo del prototipo')),
    h('div', { class: 'grp' }, h('h3', {}, 'Dati e sicurezza'), h('div', { class: 'set' }, [['Backup e ripristino', 'Esistente in Impostazioni'], ['Chiave API', 'Esistente nell\'Hub']].map(([l, d]) => h('button', { class: 'sw', type: 'button', onclick: () => note(l + ' · anteprima simulata') }, h('span', { class: 'l' }, l, h('small', {}, d)), h('span', { class: 'badge real' }, 'Esistente'))))),
    h('div', { class: 'grp' }, h('h3', {}, 'Agora'), h('div', { class: 'set' }, [['Invio dei ricordi all\'assistente', 'Esempio · oggi i ricordi non vengono inviati'], ['Registrazione di nuovi ricordi', 'Esempio · oggi non è attiva in questa pagina']].map(([l, d]) => h('button', { class: 'sw', type: 'button', onclick: () => note(l + ' · voce d\'esempio') }, h('span', { class: 'l' }, l, h('small', {}, d)), h('span', { class: 'badge ex' }, 'Esempio')))))), 'setBtn');
  document.getElementById('appsBtn').addEventListener('click', () => dApps.showModal());
  document.getElementById('setBtn').addEventListener('click', () => dSet.showModal());

  window.__ag = { setScen, go, get state() { return { scen, tab, convs: S.convs.filter(c => !c.bad).length, bad: S.convs.filter(c => c.bad).length, mems: Object.values(S.mems).reduce((a, b) => a + b.length, 0), insights: S.insights.length, custom: S.custom.length, chars: chars().length, era, chat: chat ? { msgs: chat.msgs.length, char: chat.charId } : null }; } };
  render();
})();
