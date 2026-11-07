/* Nexus · prototipo E1. Funzioni ricavate da src/agora_anime.html (pagina autonoma «Nexus», voce «Agora Anime» dell'Hub), src/dialogue-store.js e src/dialogue-memory.js.
   Tutti i valori sono FITTIZI («dati di prova»), «oggi» fisso. Ogni risposta è un TESTO SEGNAPOSTO etichettato «Simulato · non confermato»; nessuna citazione di personaggi.
   Nessuna rete, nessun provider, nessuna persistenza, nessuna chiamata al prodotto. Al ricaricamento tutto torna allo stato iniziale. */
(() => {
  const TODAY = 'lun 2 nov';
  /* Categorie («universi») del sorgente: filtri della pagina e menu del generatore (nel generatore le etichette sono più lunghe). */
  const UNI = [['all', 'Tutti'], ['shonen', 'Shōnen'], ['seinen', 'Seinen'], ['jrpg', 'JRPG'], ['action', 'Action'], ['fantasy', 'Fantasy'], ['scifi', 'Sci-Fi']];
  const UNI_L = Object.fromEntries(UNI), GEN_L = { shonen: 'Shōnen Anime', seinen: 'Seinen / Josei', jrpg: 'JRPG', action: 'Action / Adventure', fantasy: 'Fantasy', scifi: 'Sci-Fi' };
  /* Presentazione proposta: ritmo del dialogo. Il calcolo sorgente resta un contatore dei messaggi, non una sincronizzazione. */
  const RHYTHM = [{ s: 1, t: 'Avvio' }, { s: 2, t: 'Scambio' }, { s: 4, t: 'Continuità' }, { s: 6, t: 'Risonanza' }, { s: 8, t: 'Dialogo avviato' }];
  /* Tredici personaggi predefiniti con opera e categoria come nel sorgente. Niente frasi, saluti o biografie del prodotto. */
  const CH = [['naruto', 'Naruto Uzumaki', 'shonen', 'Naruto', ['determinazione', 'amicizia']], ['zoro', 'Roronoa Zoro', 'shonen', 'One Piece', ['disciplina', 'ambizione']],
    ['guts', 'Guts', 'seinen', 'Berserk', ['sopravvivenza', 'volontà']], ['light', 'Light Yagami', 'seinen', 'Death Note', ['ambizione', 'giustizia']], ['levi', 'Levi Ackerman', 'seinen', 'Attack on Titan', ['scelta', 'leadership']], ['spike', 'Spike Spiegel', 'seinen', 'Cowboy Bebop', ['libertà', 'passato']],
    ['cloud', 'Cloud Strife', 'jrpg', 'Final Fantasy VII', ['identità', 'memoria']], ['joker', 'Joker (Akira Kurusu)', 'jrpg', 'Persona 5', ['ribellione', 'coraggio']],
    ['kratos', 'Kratos', 'action', 'God of War', ['redenzione', 'paternità']], ['ellie', 'Ellie', 'action', 'The Last of Us', ['sopravvivenza', 'speranza']], ['arthur', 'Arthur Morgan', 'action', 'Red Dead Redemption 2', ['onore', 'lealtà']],
    ['geralt', 'Geralt di Rivia', 'fantasy', 'The Witcher', ['moralità', 'scelta']], ['2b', '2B (YoRHa No.2 Type B)', 'scifi', 'NieR: Automata', ['esistenza', 'coscienza']]]
    .map(([id, name, era, opera, tags]) => ({ id, name, era, opera, tags, custom: false }));
  const SUGG = ['Come affronti una scelta difficile?', 'Che cosa ti ha cambiato di più?', 'Come si va avanti dopo una perdita?', 'Qual è il tuo metodo?'];
  const init = n => n.replace(/[()]/g, '').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const REPLY = n => `Risposta demo di ${n}: testo sintetico, non una citazione del personaggio.`;
  const GREET = n => `Saluto demo di ${n}: testo fittizio, non una citazione del personaggio.`;

  function fixture(s) {
    const cv = (id, charId, charName, preview, date, msgs, extra) => ({ id, charId, charName, preview, date, msgs, ...extra });
    const base = {
      ai: true, partial: false, empty: false, pend: false,
      custom: [{ id: 'cu1', name: 'Sephiroth', era: 'jrpg', opera: 'Final Fantasy VII', tags: ['demo'], custom: true }],
      convs: [
        cv('cv3', 'geralt', 'Geralt di Rivia', 'Come scelgo quando ogni strada ha un costo', 'lun 2 nov', [{ role: 'u', text: 'Come scelgo quando ogni strada ha un costo?' }], { pending: true }),
        cv('cv1', 'zoro', 'Roronoa Zoro', 'Come mi alleno quando sono stanco', 'dom 1 nov', [{ role: 'u', text: 'Come mi alleno quando sono stanco?' }, { role: 'c', text: 'Riparti dal minimo che riesci a mantenere, poi aumenta con costanza. (Risposta demo, non citazione.)' }, { role: 'u', text: 'E se non vedo progressi?' }, { role: 'c', text: 'Confronta ciò che fai oggi con il tuo punto di partenza, non con la giornata migliore. (Risposta demo.)' }]),
        cv('cv2', 'cloud', 'Cloud Strife', 'Come si ritrova un\'identità', 'ven 30 ott', [{ role: 'u', text: 'Come si ritrova un\'identità?' }, { role: 'c', text: 'Parti dalle scelte che riconosci come tue; non serve risolvere tutto in una volta. (Risposta demo.)' }])],
      mems: { zoro: [{ t: 'Si allena la mattina', src: '1 nov' }, { t: 'Vuole costruire più disciplina', src: '1 nov' }], cloud: [{ t: 'Ama i racconti di avventura', src: '30 ott' }] },
      insights: [{ id: 'in1', who: 'Roronoa Zoro', text: 'Risposta segnaposto salvata come insight (dato di prova).', conv: '1 nov' }]
    };
    if (s === 'vuoto') return { ...base, empty: true, custom: [], convs: [], mems: {}, insights: [] };
    if (s === 'offline') return { ...base, ai: false };
    if (s === 'parziale') return { ...base, partial: true, pend: true, convs: [...base.convs, { id: 'cv9', bad: true }], mems: { ...base.mems, cloud: [...base.mems.cloud, 'voce storica'] } };
    return base;
  }

  /* ---------- Stato in memoria ---------- */
  let scen = 'normale', tab = 'riprendi', S = fixture(scen), uni = 'all', query = '', chat = null, askDel = null, msgText = '', msgTimer = null, nid = 100, lastK = null, gen = null;
  const root = document.getElementById('root'), dlg = document.getElementById('dlg');
  const K = k => ({ 'data-k': k });
  const T = (cls, t, title) => h('span', { class: 'nx-tag ' + cls, ...(title ? { title } : {}) }, t);
  const REC = () => T('rec', 'Dai tuoi record'), RUL = () => T('rul', 'Regola dell\'app'), SIM = () => T('sim', 'Simulato · non confermato'), AI = () => T('sim', 'Interpretazione AI · non verificata'), FIX = () => T('rul', 'Testo fisso dell\'app'), SEP = () => T('prf', 'Pagina autonoma');
  const note = msg => { msgText = msg; const live = document.getElementById('live'); live.textContent = ''; setTimeout(() => { live.textContent = msg; }, 60); document.querySelectorAll('.nx-status').forEach(el => { el.textContent = msg; }); clearTimeout(msgTimer); msgTimer = setTimeout(() => { msgText = ''; live.textContent = ''; document.querySelectorAll('.nx-status').forEach(el => { el.textContent = ''; }); }, 5000); };
  const clearNote = () => { msgText = ''; clearTimeout(msgTimer); };
  const chars = () => [...CH, ...S.custom], charOf = id => chars().find(c => c.id === id);
  const convsOf = id => S.convs.filter(c => c.charId === id && !c.bad), memsOf = id => S.mems[id] || [];
  const memText = m => typeof m === 'string' ? 'Voce storica da verificare' : m.t;
  const exch = c => Math.floor(c.msgs.length / 2);
  const card = (id, title, tag, ...body) => h('section', { class: 'card nx-card nx-sec', 'aria-labelledby': id }, h('div', { class: 'nx-hd' }, h('h2', { id }, title), tag || null), ...body);
  const empty = (msg, btn) => h('div', { class: 'nx-empty' }, h('b', {}, msg), btn || null);
  const ask = (what, yes) => h('div', { class: 'nx-ask', role: 'alertdialog', 'aria-label': 'Conferma rimozione' }, h('span', {}, `Rimuovere ${what}?`), h('button', { class: 'nx-btn dng', type: 'button', ...K('dy'), onclick: () => { yes(); askDel = null; redrawAll(); note('Rimozione confermata (simulata, non salvata).'); } }, 'Rimuovi'), h('button', { class: 'nx-btn', type: 'button', ...K('dn'), onclick: () => { askDel = null; redrawAll(); } }, 'Annulla'));
  const redrawAll = () => { render(); if (dlg.open && gen) drawGen(); };

  function render(focusK) {
    const fk = focusK === false ? null : focusK || document.activeElement?.dataset?.k, top = window.scrollY;
    root.replaceChildren(...build());
    if (fk) [fk, 'tab-' + tab].map(k => document.querySelector(`[data-k="${k}"]`)).find(Boolean)?.focus({ preventScroll: true });
    window.scrollTo(0, top);
  }
  const VIEWS = { riprendi, catalogo, archivio, ricordi, chat: chatView };
  const notice = () => S.partial ? 'Alcuni dati non sono leggibili: gli originali sono conservati e non vengono sostituiti. Le voci interessate lo dicono; il resto resta utilizzabile.' : '';
  const pendingPanel = () => S.pend ? h('div', { class: 'nx-pend', role: 'status' }, h('span', {}, 'Insight in attesa di conferma. Il tentativo conserva ID e testo originali.'), h('div', { class: 'nx-fa' }, h('button', { class: 'nx-btn', type: 'button', ...K('pi-retry'), onclick: () => { S.pend = false; S.insights.unshift({ id: 'in' + (++nid), who: 'Cloud Strife', text: 'Risposta segnaposto salvata dopo un nuovo tentativo.', conv: TODAY }); render(); note('Insight salvato dopo il nuovo tentativo (simulato) · interpretazione non verificata.'); } }, 'Riprova insight'), h('button', { class: 'nx-btn', type: 'button', ...K('pi-drop'), onclick: () => confirmDlg('Scartare la richiesta conservata?', 'Un insight già salvato resta in archivio: per annullarlo si usa «Modifiche recenti» (come indicato dall\'app). Qui la richiesta viene solo scartata (simulato).', 'Scarta la richiesta', () => { S.pend = false; note('Richiesta scartata (simulato, non salvato).'); }, 'pi-drop') }, 'Scarta richiesta insight'))) : null;
  const build = () => [scenBar(), notice() ? h('p', { class: 'nx-notice', role: 'status' }, notice()) : null, pendingPanel(), legend(), tabs(), h('p', { class: 'nx-status', 'aria-hidden': 'true' }, msgText), ...VIEWS[tab]()].filter(Boolean);
  const go = t => { tab = t; askDel = null; clearNote(); render(); };

  const SCEN = [['normale', 'Dati di prova'], ['vuoto', 'Nessun dato'], ['offline', 'Assistente non disponibile'], ['parziale', 'Dati da verificare']];
  const scenBar = () => h('details', { class: 'nx-scen' }, h('summary', {}, h('span', {}, 'Scenari demo · solo prototipo'), h('b', {}, SCEN.find(x => x[0] === scen)[1])), h('div', { class: 'nx-scen-o', role: 'group', 'aria-label': 'Scegli lo scenario dimostrativo' }, SCEN.map(([k, l]) => h('button', { type: 'button', class: 'nx-btn', ...K('sc-' + k), 'aria-pressed': String(scen === k), onclick: () => setScen(k) }, l))));
  function setScen(k) { clearNote(); scen = k; S = fixture(k); tab = 'riprendi'; uni = 'all'; query = ''; chat = null; askDel = null; gen = null; if (dlg.open) dlg.close(); render(); }
  const legend = () => h('details', { class: 'nx-leg' }, h('summary', {}, 'Come leggere le etichette: dialoghi, personaggi, ricordi e insight'), h('div', { class: 'nx-legend' }, h('span', {}, REC(), 'scritto o salvato da te (le tue domande, i dialoghi, i personaggi che aggiungi)'), h('span', {}, AI(), 'ricordo o insight: un\'interpretazione, non un fatto'), h('span', {}, SIM(), 'testo segnaposto al posto di una risposta o di un personaggio generato'), h('span', {}, FIX(), 'testo scritto dall\'app, uguale per tutti'), h('span', {}, RUL(), 'calcolo fisso dell\'app'), h('span', {}, SEP(), 'sezione che vive in un\'altra pagina')));
  const tabs = () => {
    const items = [['riprendi', 'Riprendi'], ['catalogo', 'Catalogo'], ['archivio', 'Archivio'], ['ricordi', 'Ricordi e insight'], ...(tab === 'chat' ? [['chat', 'Dialogo']] : [])];
    return h('nav', { class: 'nx-tabs ' + (tab === 'chat' ? 'five' : 'four'), 'aria-label': 'Sezioni di Nexus' }, items.map(([k, l]) => h('button', { type: 'button', ...K('tab-' + k), ...(tab === k ? { 'aria-current': 'page' } : {}), onclick: () => go(k) }, l)));
  };

  /* ---------- Riprendi ---------- */
  function convRow(c, k) {
    if (c.bad) return h('div', { class: 'nx-row' }, h('div', { class: 'nx-t' }, 'Dialogo non leggibile'), h('p', { class: 'nx-err', role: 'alert', style: 'display:block' }, 'Formato non riconosciuto. Originale conservato: non si può aprire né modificare da qui.'));
    const ch = charOf(c.charId);
    return h('div', { class: 'nx-row' }, h('div', { class: 'nx-who' }, h('span', { class: 'nx-av' + (ch?.custom ? ' cu' : ''), 'aria-hidden': 'true' }, init(c.charName)), h('div', {}, h('div', { class: 'nx-t' }, c.charName), h('div', { class: 'nx-s' }, (ch ? ch.opera + ' · ' : '') + c.date + ' · ' + exch(c) + (exch(c) === 1 ? ' scambio' : ' scambi')))),
      h('p', { class: 'nx-by' }, '«' + c.preview + '…»'), h('div', { class: 'nx-rl' }, REC(), c.pending ? h('span', { class: 'nx-pill wn' }, 'Domanda senza risposta') : null),
      h('div', { class: 'nx-ra' }, h('button', { class: 'nx-btn' + (c.pending ? ' pri' : ''), type: 'button', ...K(k + c.id), onclick: () => openChar(c.charId, c.id) }, c.pending ? 'Riprendi la risposta' : 'Riprendi il dialogo')));
  }
  function riprendi() {
    const last = S.convs.find(c => !c.bad);
    const hero = h('section', { class: 'card nx-card nx-hero', 'aria-labelledby': 'nx-h' },
      h('div', { class: 'nx-hh' }, h('span', { class: 'eyebrow' }, 'Oggi · ' + TODAY), h('span', { class: 'nx-pill ' + (S.ai ? 'ok' : 'wn') }, S.ai ? 'Assistente: disponibile (simulato)' : 'Assistente: non disponibile (simulato)')),
      h('h2', { class: 'nx-big', id: 'nx-h' }, last ? 'Riprendi il dialogo' : 'Con quale leggenda vuoi parlare?'),
      last ? convRow(last, 'hero-') : h('p', { class: 'nx-by' }, 'Non hai ancora dialoghi. Scegli un personaggio dal catalogo: le domande sono tue, le risposte sono scritte da un assistente nel suo ruolo e non sono verificate.'),
      h('div', { class: 'nx-acts' }, h('button', { class: 'nx-btn' + (last ? '' : ' pri big'), type: 'button', ...K('hero-main'), onclick: () => go('catalogo') }, 'Apri il catalogo'), last ? h('button', { class: 'nx-btn', type: 'button', ...K('hero-arch'), onclick: () => go('archivio') }, 'Apri l\'archivio') : null),
      h('p', { class: 'nx-fine' }, 'Le risposte non sono parole del personaggio: le scrive un assistente nel suo ruolo e restano non verificate.'));
    const lastCount = last?.msgs.length || 0, homeLevel = RHYTHM[syncLv(lastCount)];
    const rhythmSummary = h('div', { class: 'nx-rhythm-summary' }, h('div', { class: 'nx-rl' }, h('b', {}, 'Ritmo del dialogo'), h('span', { class: 'nx-pill cy' }, `${homeLevel.t} · ${lastCount} messaggi`)), h('div', { class: 'nx-sync', role: 'img', 'aria-label': `Ritmo del dialogo: ${homeLevel.t}, ${homeLevel.s} segmenti su 8` }, Array.from({ length: 8 }, (_, i) => h('i', { class: i < homeLevel.s ? 'on' : '' }))));
    const sync = h('details', { class: 'card nx-card nx-disclosure' }, h('summary', { class: 'nx-sum' }, h('span', {}, 'Come viene calcolato il ritmo'), RUL()), h('div', { class: 'nx-disclosure-body' }, h('p', { class: 'nx-by' }, 'È una progressione visiva basata sul numero di messaggi nel dialogo. Non è una sincronizzazione e non misura te o il personaggio.'), h('div', { class: 'nx-list' }, RHYTHM.map((x, i) => h('div', { class: 'nx-own' }, h('b', {}, x.t), h('span', {}, i === 4 ? 'da 12 messaggi in poi · 8 segmenti su 8' : `da ${i * 3} messaggi · ${x.s} ${x.s === 1 ? 'segmento' : 'segmenti'} su 8`))))));
    const total = Object.values(S.mems).reduce((a, b) => a + b.length, 0);
    const ownRows = [
      ['I tuoi dialoghi', 'Archivio di Nexus su questo dispositivo: si riapre un dialogo o si cancella tutto (con conferma)'],
      ['I ricordi dei personaggi', 'Restano su questo dispositivo, non vengono inviati all\'assistente e non vengono aggiornati. Un ricordo si può solo dimenticare'],
      ['Gli insight', 'Risposte che salvi con «Salva»: interpretate e non verificate; un insight già salvato si annulla da «Modifiche recenti»'],
      ['I personaggi che aggiungi', 'Catalogo di Nexus: si generano da nome, universo e opera; si rimuovono (annullabile da «Modifiche recenti»)'],
      ['Agora', 'Pagina autonoma con catalogo, archivio, ricordi e insight propri: nulla si condivide con Nexus tranne il modo di dialogare']];
    const own = h('details', { class: 'card nx-card nx-disclosure' }, h('summary', { class: 'nx-sum' }, h('span', {}, 'Dati e privacy'), h('span', { class: 'nx-summary-meta' }, `${total} ricordi · ${S.insights.length} insight`)),
      h('div', { class: 'nx-disclosure-body' }, h('p', { class: 'nx-data-disclosure' }, h('b', {}, 'In breve: '), 'dialoghi, ricordi e insight restano separati per Nexus. I ricordi non vengono inviati all’assistente.'), h('div', {}, ownRows.map(([a, b]) => h('div', { class: 'nx-own' }, h('b', {}, a), h('span', {}, b)))),
        h('div', { class: 'nx-acts' }, h('button', { class: 'nx-btn', type: 'button', ...K('go-mem'), onclick: () => go('ricordi') }, `Vedi ricordi e insight (${total + S.insights.length})`), h('button', { class: 'nx-btn', type: 'button', ...K('go-agora'), onclick: () => note('Anteprima di navigazione verso Agora (pagina autonoma): nessuna azione.') }, 'Apri Agora'))));
    return [h('div', { class: 'nx-cols' }, h('div', { class: 'nx-sec' }, hero, rhythmSummary, sync), h('div', { class: 'nx-sec' }, own))];
  }

  /* ---------- Catalogo ---------- */
  function catalogo() {
    const q = query.trim().toLocaleLowerCase('it'), list = chars().filter(c => (uni === 'all' || c.era === uni) && (!q || [c.name, c.opera, ...c.tags].some(t => t.toLocaleLowerCase('it').includes(q))));
    const filters = h('div', { class: 'nx-era', role: 'group', 'aria-label': 'Filtra per categoria' }, UNI.map(([k, l]) => h('button', { type: 'button', ...K('uni-' + k), 'aria-pressed': String(uni === k), onclick: () => { uni = k; query = ''; render(); } }, l + (k === 'all' ? '' : ' ' + chars().filter(c => c.era === k).length))));
    const find = h('div', { class: 'nx-f' }, h('label', { for: 'nx-q' }, 'Cerca per nome, opera o tema'), h('input', { id: 'nx-q', type: 'search', placeholder: 'Per esempio: One Piece, scelta', value: query, oninput: e => { query = e.target.value; const pos = e.target.selectionStart; render(false); const i = document.getElementById('nx-q'); i.focus({ preventScroll: true }); i.setSelectionRange(pos, pos); } }));
    const cardOf = c => { const nc = convsOf(c.id).length, nmem = memsOf(c.id).length; return h('div', { class: 'nx-row' }, h('div', { class: 'nx-who' }, h('span', { class: 'nx-av' + (c.custom ? ' cu' : ''), 'aria-hidden': 'true' }, init(c.name)), h('div', {}, h('div', { class: 'nx-t' }, c.name), h('div', { class: 'nx-s' }, c.opera + ' · ' + GEN_L[c.era]))),
      h('div', { class: 'nx-rl' }, c.custom ? SIM() : T('rul', 'Catalogo di Nexus'), c.custom ? T('rec', 'Aggiunto da te') : null), h('div', { class: 'nx-chips' }, c.tags.map(t => h('span', { class: 'nx-chip' }, t))),
      h('div', { class: 'nx-chips' }, h('span', { class: 'nx-chip' }, nc + (nc === 1 ? ' dialogo' : ' dialoghi')), h('span', { class: 'nx-chip' }, nmem + (nmem === 1 ? ' ricordo' : ' ricordi'))),
      h('div', { class: 'nx-ra' }, h('button', { class: 'nx-btn pri', type: 'button', ...K('op-' + c.id), 'aria-label': (nc ? 'Nuovo dialogo con ' : 'Apri ') + c.name, onclick: () => openChar(c.id) }, nc ? 'Nuovo dialogo' : 'Apri'), nc ? h('button', { class: 'nx-btn', type: 'button', ...K('rp-' + c.id), 'aria-label': 'Riprendi con ' + c.name, onclick: () => openChar(c.id, convsOf(c.id)[0].id) }, 'Riprendi') : null)); };
    const results = list.length ? h('div', { class: 'nx-grid' }, list.map(cardOf)) : h('div', { class: 'nx-empty' }, h('b', {}, 'Nessun risultato.'), h('p', { class: 'nx-by' }, q ? 'Prova un altro nome, un\'altra opera o un tema diverso.' : 'Nessun personaggio in questa categoria.'), h('button', { class: 'nx-btn', type: 'button', ...K('add-empty'), onclick: openGen }, 'Genera un personaggio'));
    const agora = card('nx-ag', 'Figure storiche', SEP(), h('p', { class: 'nx-by' }, 'I Grandi della Storia stanno in Agora, una pagina separata con un catalogo e un archivio propri. Nexus non li mostra.'), h('button', { class: 'nx-btn', type: 'button', ...K('agora'), onclick: () => note('Anteprima di navigazione verso Agora (pagina autonoma): nessuna azione.') }, 'Apri Agora'));
    return [h('div', { class: 'nx-cols' }, h('div', { class: 'nx-sec' }, card('nx-pc', 'Scegli un personaggio', T('rul', chars().length + ' personaggi'), filters, find, h('p', { class: 'nx-fine', role: 'status' }, list.length + (list.length === 1 ? ' personaggio disponibile' : ' personaggi disponibili')), results), h('div', { class: 'nx-acts' }, h('button', { class: 'nx-btn', type: 'button', ...K('add'), onclick: openGen }, 'Genera un personaggio (demo)'))), h('div', { class: 'nx-sec' }, agora))];
  }

  /* ---------- Dialogo ---------- */
  function openChar(id, convId) {
    const c = charOf(id), conv = convId ? S.convs.find(x => x.id === convId) : null; if (!c) return;
    chat = { charId: id, convId: conv ? conv.id : null, msgs: conv ? conv.msgs.map(m => ({ ...m })) : [], old: !!conv, err: '', draft: '' };
    tab = 'chat'; askDel = null; clearNote(); render(false); document.querySelector('[data-k="ch-in"]')?.focus({ preventScroll: true }); window.scrollTo(0, 0);
  }
  const syncLv = n => Math.min(4, Math.floor(n / 3));
  function chatView() {
    const c = charOf(chat.charId), mem = memsOf(c.id), last = chat.msgs.at(-1), pend = last && last.role === 'u', n = chat.msgs.length, lv = RHYTHM[syncLv(n)];
    const head = card('ch-h', c.name, c.custom ? SIM() : T('rul', 'Catalogo di Nexus'), h('div', { class: 'nx-who' }, h('span', { class: 'nx-av' + (c.custom ? ' cu' : ''), 'aria-hidden': 'true' }, init(c.name)), h('div', {}, h('div', { class: 'nx-s' }, c.opera + ' · ' + GEN_L[c.era]))),
      c.custom ? h('p', { class: 'nx-fine' }, 'Personaggio generato: opera e frase da verificare.') : null,
      h('div', { class: 'nx-rl' }, h('b', {}, 'Ritmo del dialogo'), h('span', { class: 'nx-pill cy' }, lv.t), h('span', { class: 'nx-pill' }, Math.floor(n / 2) + (Math.floor(n / 2) === 1 ? ' scambio' : ' scambi'))),
      h('div', { class: 'nx-sync', role: 'img', 'aria-label': `Ritmo del dialogo: ${lv.t}, ${lv.s} segmenti su 8` }, Array.from({ length: 8 }, (_, i) => h('i', { class: i < lv.s ? 'on' : '' }))),
      h('p', { class: 'nx-fine' }, 'Contatore visivo dei messaggi del dialogo; nessuna sincronizzazione o stato del personaggio.'),
      h('button', { class: 'nx-btn nx-back', type: 'button', ...K('back'), onclick: () => go('catalogo') }, '← Catalogo'));
    const shown = mem.slice(-4), off = mem.length - shown.length;
    const memBox = card('ch-m', 'Ricordi di ' + c.name, REC(), h('p', { class: 'nx-fine' }, 'Ricordi locali: non inviati all\'assistente e non aggiornati.'),
      shown.length ? h('div', { class: 'nx-list' }, shown.map((m, i) => h('div', { class: 'nx-mem' }, h('span', {}, '↩ ' + memText(m)), AI(), h('button', { class: 'nx-btn ghost', type: 'button', ...K('fg-' + (off + i)), 'aria-label': 'Dimentica il ricordo: ' + memText(m), onclick: () => confirmForget(c.id, off + i) }, 'Dimentica')))) : h('p', { class: 'nx-by' }, 'Nessun ricordo per questo personaggio.'), mem.length > 4 ? h('p', { class: 'nx-fine' }, 'Qui compaiono gli ultimi 4 ricordi; l\'elenco completo è in «Ricordi e insight».') : null);
    const rows = [];
    if (chat.old) rows.push(h('div', { class: 'nx-mk' }, 'Dialogo precedente'));
    else { if (mem.length) rows.push(h('div', { class: 'nx-mk' }, `${c.name}: ${mem.length} ${mem.length === 1 ? 'ricordo' : 'ricordi'} da verificare`)); rows.push(h('div', { class: 'nx-msg c' }, h('div', { class: 'nx-rl' }, h('span', { class: 'nx-s' }, c.name), FIX()), h('p', {}, GREET(c.name)), h('div', { class: 'nx-ra' }, h('button', { class: 'nx-btn', type: 'button', ...K('cp-g'), onclick: () => note('Copia simulata: nessun testo è stato copiato.') }, 'Copia'), h('button', { class: 'nx-btn', type: 'button', ...K('sv-g'), disabled: true, title: 'Fonte non disponibile: questo testo non è un messaggio salvato' }, '★ Salva')), h('p', { class: 'nx-fine' }, 'Il saluto non si può salvare come insight: non è un messaggio dell\'archivio.'))); }
    chat.msgs.forEach((m, i) => { rows.push(m.role === 'u' ? h('div', { class: 'nx-msg u' }, h('div', { class: 'nx-rl' }, h('span', { class: 'nx-s' }, 'Tu'), REC()), h('p', {}, m.text)) :
      h('div', { class: 'nx-msg c' }, h('div', { class: 'nx-rl' }, h('span', { class: 'nx-s' }, c.name), SIM()), h('p', {}, m.text), h('div', { class: 'nx-ra' }, h('button', { class: 'nx-btn', type: 'button', ...K('cp-' + i), onclick: () => note('Copia simulata: nessun testo è stato copiato.') }, 'Copia'), h('button', { class: 'nx-btn', type: 'button', ...K('sv-' + i), 'aria-pressed': String(!!m.saved), onclick: () => saveInsight(i) }, m.saved ? '★ Salvato' : '★ Salva come insight')))); });
    if (chat.old) rows.push(h('div', { class: 'nx-mk' }, '// continua qui sotto'));
    const sugg = h('div', { class: 'nx-suggestions' }, h('p', { class: 'nx-suggest-warning', role: 'note' }, h('b', {}, 'Invio immediato: '), 'selezionando un suggerimento, il testo viene inviato subito senza passare dalla bozza.'), h('div', { class: 'nx-chips', role: 'group', 'aria-label': 'Invia subito uno dei suggerimenti' }, SUGG.map((s, i) => h('button', { class: 'nx-btn ghost', type: 'button', ...K('sg-' + i), onclick: () => { chat.draft = s; send(); } }, s))));
    const input = h('form', { class: 'nx-input', novalidate: '', onsubmit: e => { e.preventDefault(); send(); } },
      h('label', { class: 'nx-s', for: 'nx-in' }, 'Il tuo messaggio'), h('textarea', { id: 'nx-in', ...K('ch-in'), placeholder: 'Scrivi il tuo messaggio…', oninput: e => { chat.draft = e.target.value; }, onkeydown: e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } } }, chat.draft),
      h('p', { class: 'nx-err', role: 'alert' }, chat.err), pend ? h('button', { class: 'nx-btn pri', type: 'button', ...K('resume'), onclick: resume }, '↻ Riprendi la risposta') : null,
      h('div', { class: 'nx-fa' }, h('button', { class: 'nx-btn pri', type: 'submit', ...K('send') }, 'Invia')), h('p', { class: 'nx-fine' }, 'Invio per inviare, Maiusc+Invio per andare a capo.'));
    return [h('div', { class: 'nx-cols' }, h('div', { class: 'nx-sec' }, card('ch-c', 'Dialogo', SIM(), h('div', { class: 'nx-msgs', role: 'log', 'aria-label': 'Dialogo' }, rows), sugg, input)), h('div', { class: 'nx-sec nx-first' }, head, memBox))];
  }
  function ensureConv() {
    const c = charOf(chat.charId); let conv = chat.convId ? S.convs.find(x => x.id === chat.convId) : null;
    if (!conv) { conv = { id: 'cv' + (++nid), charId: c.id, charName: c.name, preview: '', date: TODAY, msgs: [], pending: false }; S.convs.unshift(conv); chat.convId = conv.id; }
    return conv;
  }
  const sync = () => { const conv = ensureConv(); conv.msgs = chat.msgs.map(m => ({ role: m.role, text: m.text })); conv.pending = chat.msgs.at(-1)?.role === 'u'; conv.preview = (chat.msgs.find(m => m.role === 'u')?.text || '').slice(0, 60).replace(/[?.!]+$/, ''); };
  function reply() { chat.msgs.push({ role: 'c', text: REPLY(charOf(chat.charId).name) }); sync(); }
  function send() {
    const text = chat.draft.trim(); chat.err = '';
    if (chat.msgs.at(-1)?.role === 'u') { chat.err = 'Riprendi la risposta precedente oppure apri un nuovo dialogo.'; render('ch-in'); return; }
    if (!text) { chat.err = 'Scrivi un messaggio.'; render('ch-in'); return; }
    if (text.length > 12000) { chat.err = 'Messaggio oltre i 12000 caratteri.'; render('ch-in'); return; }
    chat.msgs.push({ role: 'u', text }); chat.draft = ''; sync();
    if (!S.ai) { chat.err = 'Dialogo non completato: assistente non disponibile (simulato). La tua domanda è salvata: puoi riprendere la risposta.'; render('resume'); return; }
    reply(); render('ch-in'); note('Risposta simulata: nessuna richiesta all\'assistente.');
  }
  function resume() {
    chat.err = ''; if (!S.ai) { chat.err = 'Dialogo non completato: assistente non disponibile (simulato). La domanda resta salvata.'; render('resume'); return; }
    reply(); render('ch-in'); note('Risposta ripresa (simulata): nessuna richiesta all\'assistente.');
  }
  function saveInsight(i) {
    const m = chat.msgs[i]; if (m.saved) { note('Insight già presente · interpretazione non verificata.'); return; }
    m.saved = true; S.insights.unshift({ id: 'in' + (++nid), who: charOf(chat.charId).name, text: m.text, conv: TODAY }); render(); note('Insight salvato (simulato) · interpretazione non verificata, non un fatto su di te.');
  }

  /* ---------- Archivio ---------- */
  function archivio() {
    const list = card('ar-l', 'Dialoghi (' + S.convs.filter(c => !c.bad).length + ')', REC(), S.convs.length ? h('div', { class: 'nx-list' }, S.convs.map(c => convRow(c, 'ar-'))) : empty('Nessun dialogo ancora.', h('button', { class: 'nx-btn pri', type: 'button', ...K('ar-go'), onclick: () => go('catalogo') }, 'Apri il catalogo')));
    const act = card('ar-a', 'Cancella l\'archivio', RUL(), h('p', { class: 'nx-by' }, 'L\'archivio si cancella tutto insieme, dopo conferma; non esiste l\'eliminazione di un singolo dialogo né un\'esportazione da qui.'), h('button', { class: 'nx-btn dng', type: 'button', ...K('clear'), disabled: !S.convs.length, onclick: () => confirmDlg('Cancellare tutto?', 'Verranno rimossi tutti i dialoghi di Nexus (simulato). Ricordi e insight non vengono toccati. Nel prodotto la richiesta non parte mentre si attende una risposta.', 'Cancella tutto', () => { S.convs = []; chat = null; if (tab === 'chat') tab = 'archivio'; note('Archivio cancellato (simulato, non salvato).'); }, 'clear') }, 'Cancella tutto'));
    return [h('div', { class: 'nx-cols' }, h('div', { class: 'nx-sec' }, list), h('div', { class: 'nx-sec' }, act))];
  }

  /* ---------- Ricordi e insight ---------- */
  function ricordi() {
    const ids = Object.keys(S.mems).filter(id => S.mems[id].length);
    const rules = card('rc-r', 'Chi controlla i ricordi', RUL(), h('div', {}, [['Dove stanno', 'Su questo dispositivo, nell\'archivio di Nexus (separato da quello di Agora).'], ['Cosa sono', 'Interpretazioni di un tuo messaggio fatte da un assistente: non verificate.'], ['Cosa succede ora', 'Non vengono inviati all\'assistente e non vengono aggiornati da nuovi dialoghi.'], ['Come si correggono', 'Non si modificano né si aggiungono a mano: si possono solo dimenticare, dopo conferma.'], ['Se ti pentisci', 'Il prodotto indica che l\'operazione si annulla dalla cronologia delle operazioni.']].map(([a, b]) => h('div', { class: 'nx-own' }, h('b', {}, a), h('span', {}, b)))));
    const groups = ids.length ? ids.map(id => { const c = charOf(id); return card('rc-' + id, c.name + ' (' + S.mems[id].length + ')', REC(), h('div', { class: 'nx-list' }, S.mems[id].map((m, i) => h('div', { class: 'nx-row' }, h('div', { class: 'nx-t' }, memText(m)), h('div', { class: 'nx-rl' }, AI(), typeof m === 'string' ? null : h('span', { class: 'nx-s' }, 'dal tuo messaggio del ' + m.src)), h('div', { class: 'nx-ra' }, h('button', { class: 'nx-btn ghost', type: 'button', ...K('fg-' + id + '-' + i), 'aria-label': 'Dimentica il ricordo: ' + memText(m), onclick: () => confirmForget(id, i) }, 'Dimentica')))))); }) : [card('rc-e', 'Ricordi registrati (0)', REC(), empty('Nessun ricordo registrato.', h('p', { class: 'nx-by' }, 'Nuovi ricordi non si creano da questa pagina.')))];
    const ins = card('rc-i', 'Insight salvati (' + S.insights.length + ')', REC(), S.insights.length ? h('div', { class: 'nx-list' }, S.insights.map(x => h('div', { class: 'nx-row' }, h('div', { class: 'nx-s' }, x.who + ' · ' + x.conv), h('p', { class: 'nx-by' }, x.text), h('div', { class: 'nx-rl' }, AI(), T('prop', 'Non è un fatto su di te'))))) : empty('Nessun insight salvato. Si salvano dal dialogo con «Salva».'), h('p', { class: 'nx-fine' }, 'Un insight salvato non si elimina da questa pagina: il prodotto rimanda a «Modifiche recenti». Nell\'archivio i dati si chiamano «istruzioni» (nexus_instructions_v1), ma la pagina li chiama «insight».'));
    return [h('div', { class: 'nx-cols' }, h('div', { class: 'nx-sec' }, ...groups), h('div', { class: 'nx-sec' }, rules, ins))];
  }

  /* ---------- Dialoghi ---------- */
  function openDlg(title, nodes) { lastK = document.activeElement?.dataset?.k || document.activeElement?.id || null; document.getElementById('dlg-t').textContent = title; document.getElementById('dlg-b').replaceChildren(h('p', { class: 'nx-sim' }, 'Simulazione · nessun salvataggio'), ...nodes); if (!dlg.open) dlg.showModal(); }
  function closeDlg() { if (dlg.open) dlg.close(); }
  document.getElementById('dlg-x').onclick = closeDlg;
  dlg.addEventListener('close', () => { gen = null; document.getElementById('dlg-b').replaceChildren(); const t = (lastK && (document.querySelector(`[data-k="${lastK}"]`) || document.getElementById(lastK))) || document.querySelector(`[data-k="tab-${tab}"]`); t?.focus({ preventScroll: true }); });
  dlg.addEventListener('click', e => { if (e.target === dlg) closeDlg(); });
  function confirmDlg(title, text, yes, fn, opener) { openDlg(title, [h('p', { class: 'nx-by' }, text), h('div', { class: 'nx-fa' }, h('button', { class: 'nx-btn dng', type: 'button', ...K('cf-yes'), onclick: () => { fn(); closeDlg(); render(); } }, yes), h('button', { class: 'nx-btn', type: 'button', ...K('cf-no'), onclick: closeDlg }, 'Annulla'))]); lastK = opener; document.querySelector('[data-k="cf-no"]')?.focus(); }
  function confirmForget(id, idx) { const m = memsOf(id)[idx]; if (m === undefined) return; confirmDlg('Dimenticare questo ricordo del personaggio?', `«${memText(m)}» verrà dimenticato (simulato). Potrai annullare dalla cronologia delle operazioni, come indicato dall'app.`, 'Dimentica', () => { S.mems[id].splice(idx, 1); if (!S.mems[id].length) delete S.mems[id]; note('Ricordo dimenticato (simulato, non salvato).'); }, document.activeElement?.dataset?.k || null); }

  function openGen() { gen = { name: '', era: 'action', opera: '', prev: null, err: '' }; lastK = document.activeElement?.dataset?.k || null; drawGen(); document.querySelector('#dlg-b input')?.focus(); }
  function drawGen() {
    const g = gen, f = (id, label, key, ph) => h('div', { class: 'nx-f' }, h('label', { for: id }, label), h('input', { id, type: 'text', placeholder: ph, value: g[key], oninput: e => { g[key] = e.target.value; } }));
    const form = h('form', { class: 'nx-form', novalidate: '', onsubmit: e => { e.preventDefault(); generate(); } }, f('gn-n', 'Nome del personaggio', 'name', 'Per esempio: Sasuke'),
      h('div', { class: 'nx-f' }, h('label', { for: 'gn-e' }, 'Universo'), h('select', { id: 'gn-e', onchange: e => { g.era = e.target.value; } }, Object.entries(GEN_L).map(([k, l]) => h('option', { value: k, ...(g.era === k ? { selected: '' } : {}) }, l)))), f('gn-o', 'Opera (consigliato)', 'opera', 'Per esempio: Naruto'),
      h('p', { class: 'nx-err', role: 'alert' }, g.err), h('button', { class: 'nx-btn pri', type: 'submit', ...K('gn-go') }, 'Genera il personaggio (demo)'));
    const prev = g.prev ? h('div', { class: 'nx-ai', role: 'region', 'aria-labelledby': 'gn-p' }, h('div', { class: 'nx-hd' }, h('h3', { id: 'gn-p' }, 'Bozza: ' + g.prev.name), SIM()), h('p', { class: 'nx-by' }, (g.prev.opera || 'Opera non indicata') + ' · ' + GEN_L[g.prev.era]), h('p', { class: 'nx-by' }, 'Frase generata, non verificata: testo segnaposto.'), h('p', { class: 'nx-fine' }, 'Istruzioni del personaggio (anteprima segnaposto): nel prodotto compaiono i primi 250 caratteri, come bozza da verificare.'),
      h('div', { class: 'nx-fa' }, h('button', { class: 'nx-btn pri', type: 'button', ...K('gn-save'), onclick: saveGen }, 'Aggiungi al Nexus'), h('button', { class: 'nx-btn', type: 'button', ...K('gn-drop'), onclick: () => { g.prev = null; drawGen(); } }, 'Scarta'))) : null;
    const added = h('div', { class: 'nx-sec' }, h('div', { class: 'nx-hd' }, h('h3', {}, 'Aggiunti da te'), h('span', { class: 'nx-pill' }, String(S.custom.length))), S.custom.length ? h('div', { class: 'nx-list' }, S.custom.map(c => h('div', { class: 'nx-row' }, h('div', { class: 'nx-t' }, c.name), h('div', { class: 'nx-s' }, (c.opera || 'Opera non indicata') + ' · ' + GEN_L[c.era]), h('div', { class: 'nx-ra' }, h('button', { class: 'nx-btn ghost', type: 'button', ...K('rm-' + c.id), 'aria-label': 'Rimuovi ' + c.name, onclick: () => { askDel = c.id; drawGen(); } }, '✕ Rimuovi')), askDel === c.id ? ask(c.name, () => { S.custom = S.custom.filter(x => x !== c); }) : null))) : h('p', { class: 'nx-by' }, 'Nessun personaggio aggiunto ancora.'), h('p', { class: 'nx-fine' }, 'I dialoghi con un personaggio rimosso restano nell\'archivio; nel prodotto la rimozione è annullabile da «Modifiche recenti».'));
    document.getElementById('dlg-t').textContent = 'Genera un personaggio'; document.getElementById('dlg-b').replaceChildren(h('p', { class: 'nx-sim' }, 'Simulazione · nessun salvataggio'), form, prev, added); if (!dlg.open) dlg.showModal();
  }
  function generate() {
    gen.err = ''; const n = gen.name.trim();
    if (!n) { gen.err = 'Inserisci il nome del personaggio.'; drawGen(); document.getElementById('gn-n')?.focus(); return; }
    if (!S.ai) { gen.err = 'Assistente non disponibile (simulato): nessuna bozza generata. Il testo resta nel campo.'; drawGen(); return; }
    gen.prev = { name: n, opera: gen.opera.trim(), era: gen.era }; drawGen(); document.querySelector('[data-k="gn-save"]')?.focus(); note('Bozza simulata: nessuna richiesta all\'assistente.');
  }
  function saveGen() {
    const p = gen.prev; if (!p) return; if (chars().some(c => c.name.toLowerCase() === p.name.toLowerCase())) { gen.err = 'Esiste già un personaggio con questo nome.'; drawGen(); return; }
    S.custom.push({ id: 'cu' + (++nid), name: p.name, era: p.era, opera: p.opera, tags: ['demo'], custom: true }); gen.prev = null; gen.name = ''; gen.opera = ''; drawGen(); render(false); note(p.name + ' aggiunto al Nexus (simulato, non salvato).'); document.getElementById('gn-n')?.focus();
  }

  /* ---------- Finestre globali ---------- */
  function moduleDialog(id, title, body, openerId) { const d = h('dialog', { id, 'aria-labelledby': id + '-title' }); d.append(h('div', { class: 'dh' }, h('h2', { id: id + '-title' }, title), h('button', { class: 'chip', type: 'button', 'aria-label': 'Chiudi', onclick: () => d.close() }, '✕')), h('div', { class: 'db' }, body)); d.addEventListener('click', e => { if (e.target === d) d.close(); }); d.addEventListener('close', () => { setTimeout(() => document.getElementById(openerId)?.focus({ preventScroll: true }), 0); }); document.body.append(d); return d; }
  const APP_GROUPS = [
    ['Quotidiano', [['☰', 'Diario della giornata'], ['⚔', 'Missioni'], ['▦', 'Calendario'], ['✦', 'Planner AI'], ['◷', 'Weekly Review'], ['⚖', 'Decisioni']]],
    ['Apprendimento', [['🎓', 'Studio'], ['📚', 'Library'], ['🃏', 'Flashcard'], ['⚙', 'Engineer']]],
    ['Corpo e creatività', [['🏋', 'Leo Protocol'], ['⚡', 'Recovery'], ['🎨', 'Arte & Musica'], ['🏛', 'Agora', 'pagina autonoma · figure storiche'], ['🎌', 'Nexus', 'nome nel prodotto: «Agora Anime»']]],
    ['Gioco', [['⚔', 'Life RPG'], ['🌌', 'Dungeon']]],
    ['Intelligenza', [['◎', 'Jarvis'], ['✦', 'Second Brain'], ['✧', 'Idea Hub', 'sezione autonoma · da progettare'], ['🤖', 'AI Coach'], ['⚙', 'Profilo operativo']]],
    ['Sistema', [['⚙', 'Impostazioni'], ['⛁', 'Backup e ripristino'], ['🔑', 'Chiave API'], ['⚡', 'PolyFeed']]]
  ];
  const appSearch = h('input', { class: 'field', type: 'search', placeholder: 'Cerca una sezione…', 'aria-label': 'Cerca una sezione', style: 'width:100%' }), appList = h('div', {});
  const drawApps = () => { const qy = appSearch.value.trim().toLocaleLowerCase('it'); appList.replaceChildren(); let n = 0;
    for (const [g, items] of APP_GROUPS) { const ms = items.filter(([, l]) => l.toLocaleLowerCase('it').includes(qy)); if (!ms.length) continue; n += ms.length;
      appList.append(h('div', { class: 'grp' }, h('h3', {}, g), h('div', { class: 'items' }, ms.map(([ic, l, nt]) => h('button', { class: 'item', type: 'button', onclick: () => { dApps.close(); if (l === 'Nexus') go('riprendi'); else note('Collegamento simulato: ' + l + '.'); } }, h('span', { class: 'ic', 'aria-hidden': 'true' }, ic), h('span', { class: 'l' }, l, nt ? h('small', {}, nt) : null)))))); }
    if (!n) appList.append(h('p', { class: 'empty' }, 'Nessuna sezione trovata.')); };
  appSearch.addEventListener('input', drawApps); drawApps();
  const dApps = moduleDialog('nx-apps', 'Tutte le app', h('div', {}, h('div', { class: 'sim' }, 'Collegamenti simulati · nessuna funzione esterna viene aperta'), appSearch, appList), 'appsBtn');
  const dSet = moduleDialog('nx-settings', 'Impostazioni', h('div', {}, h('div', { class: 'sim' }, 'Anteprima della struttura · le voci d\'esempio non modificano l\'app'), h('div', { class: 'legend' }, h('span', {}, h('span', { class: 'badge real' }, 'Esistente'), ' già presente nell\'app'), h('span', {}, h('span', { class: 'badge ex' }, 'Esempio'), ' solo del prototipo')),
    h('div', { class: 'grp' }, h('h3', {}, 'Dati e sicurezza'), h('div', { class: 'set' }, [['Backup e ripristino', 'Esistente in Impostazioni'], ['Chiave API', 'Esistente nell\'Hub']].map(([l, d]) => h('button', { class: 'sw', type: 'button', onclick: () => note(l + ' · anteprima simulata') }, h('span', { class: 'l' }, l, h('small', {}, d)), h('span', { class: 'badge real' }, 'Esistente'))))),
    h('div', { class: 'grp' }, h('h3', {}, 'Nexus'), h('div', { class: 'set' }, [['Invio dei ricordi all\'assistente', 'Esempio · oggi i ricordi non vengono inviati'], ['Registrazione di nuovi ricordi', 'Esempio · oggi non è attiva in questa pagina']].map(([l, d]) => h('button', { class: 'sw', type: 'button', onclick: () => note(l + ' · voce d\'esempio') }, h('span', { class: 'l' }, l, h('small', {}, d)), h('span', { class: 'badge ex' }, 'Esempio')))))), 'setBtn');
  document.getElementById('appsBtn').addEventListener('click', () => dApps.showModal());
  document.getElementById('setBtn').addEventListener('click', () => dSet.showModal());

  window.__nx = { setScen, go, get state() { return { scen, tab, convs: S.convs.filter(c => !c.bad).length, bad: S.convs.filter(c => c.bad).length, mems: Object.values(S.mems).reduce((a, b) => a + b.length, 0), insights: S.insights.length, custom: S.custom.length, chars: chars().length, uni, pend: S.pend, chat: chat ? { msgs: chat.msgs.length, char: chat.charId } : null }; } };
  render();
})();
