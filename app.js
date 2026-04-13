// ════ STORAGE & STATE ════
const DB = 'haven_v2';

function dbLoad() {
    try {
        const r = localStorage.getItem(DB);
        return r ? JSON.parse(r) : null;
    } catch (e) { return null; }
}

function dbSave() {
    try {
        localStorage.setItem(DB, JSON.stringify({
            user: S.user, options: S.options, current: S.current, 
            property: S.property, budget: S.budget, callTime: S.callTime, 
            consent: S.consent, lastScreen: S.lastScreen
        }));
    } catch (e) {}
}

function dbClear() {
    try { localStorage.removeItem(DB); } catch (e) {}
}

const _d = dbLoad() || {};

const S = {
    user: _d.user || { name: '', phone: '' },
    options: _d.options || [],
    current: _d.current || { pkg: '', price: '', col: '', rooms: [], model: null },
    property: _d.property || {},
    budget: _d.budget || '₹3–5L',
    callTime: _d.callTime || 'Evening',
    consent: _d.consent !== undefined ? _d.consent : true,
    lastScreen: _d.lastScreen || 's-entry',
    editingId: null,
    viewingModel: null
};

function persist() { dbSave(); }

// ════ PROGRESS BAR ════
const PG = [
    { screens: ['s-residence'], label: 'Residence', pct: 10 },
    { screens: ['s-bhk'], label: 'BHK/Area', pct: 10 },
    { screens: ['s-dash'], label: 'Dashboard', pct: 5 },
    { screens: ['s-package'], label: 'Package', pct: 15 },
    { screens: ['s-rooms'], label: 'Rooms', pct: 15 },
    { screens: ['s-models', 's-viewer'], label: 'Designs', pct: 30 },
    { screens: ['s-summary'], label: 'Summary', pct: 10 },
    { screens: ['s-inquiry', 's-compare'], label: 'Consult', pct: 5 }
];

function bhkSlots() {
    const n = parseInt(S.property && S.property.bhk) || 0;
    return n ? { beds: n, hall: 1, kitchen: 1, total: n + 2 } : null;
}

function filledSlots() { return S.current.rooms ? S.current.rooms.length : 0; }

function calcPct(id) {
    if (id === 's-entry') return 0;
    let base = 0, idx = -1;
    PG.forEach((s, i) => { if (s.screens.includes(id)) idx = i; });
    if (idx === -1) return 0;
    for (let i = 0; i < idx; i++) base += PG[i].pct;
    const cur = PG[idx];
    if (id === 's-models' || id === 's-viewer') {
        const sl = bhkSlots();
        base += sl && sl.total > 0 ? Math.round((filledSlots() / sl.total) * cur.pct) : S.current.model ? cur.pct : Math.round(cur.pct * .3);
    } else base += Math.round(cur.pct * .6);
    return Math.min(base, 100);
}

function updatePgBar(id) {
    const bar = document.getElementById('pgBar');
    const hide = id === 's-entry';
    bar.style.display = hide ? 'none' : 'block';
    document.body.classList.toggle('pg-on', !hide);
    if (hide) return;
    const pct = calcPct(id);
    document.getElementById('pgFill').style.width = pct + '%';
    document.getElementById('pgPct').textContent = pct + '%';
    let lbl = 'Design Journey';
    const sl = bhkSlots();
    if ((id === 's-models' || id === 's-viewer') && sl) {
        const f = filledSlots();
        lbl = f + ' / ' + sl.total + ' designs · ' + sl.beds + ' Bed' + (sl.beds > 1 ? 's' : '') + ' + Hall + Kitchen';
    } else if (pct >= 100) lbl = 'Journey Complete ✦';
    else if (pct >= 80) lbl = 'Almost there — finalise your design';
    else if (pct >= 50) lbl = 'Great progress — keep going';
    else if (pct >= 20) lbl = 'Building your dream home…';
    document.getElementById('pgLbl').textContent = lbl;
    let h = ''; let past = false;
    PG.forEach((s, i) => {
        const cur = s.screens.includes(id);
        const done = !past && !cur;
        if (cur) past = true;
        const c = cur ? 'active' : done ? 'done' : '';
        h += '<span class="pg-step ' + c + '"><span class="pg-dot"></span>' + s.label + '</span>';
        if (i < PG.length - 1) h += '<span class="pg-line"></span>';
    });
    document.getElementById('pgSteps').innerHTML = h;
}

// ════ NAVIGATION ════
const FLOW = ['s-package', 's-rooms', 's-models', 's-viewer', 's-summary'];

function goTo(id) {
    S.lastScreen = id; persist();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0, 0);
    updateTopBar(id);
    updatePgBar(id);
    if (id === 's-inquiry') setTimeout(prefillInquiry, 50);
}

function updateTopBar(id) {
    const tb = document.getElementById('topBar');
    const sb = document.getElementById('stepBar');
    tb.style.display = id === 's-entry' ? 'none' : 'flex';
    const inf = FLOW.includes(id);
    sb.style.display = inf ? 'flex' : 'none';
    if (inf) {
        const ix = FLOW.indexOf(id);
        const ef = id === 's-viewer' ? 2 : ix;
        for (let i = 1; i <= 4; i++) {
            const el = document.getElementById('si' + i);
            el.className = 'si';
            if (i - 1 < ef) el.classList.add('done');
            else if (i - 1 === ef) el.classList.add('active');
        }
    }
    const b = document.getElementById('pkgBadge');
    if (S.current.pkg) {
        b.textContent = S.current.pkg + ' · ' + PKG_PRICE[S.current.pkg];
        b.classList.add('show');
    } else b.classList.remove('show');
}

// ════ UI HELPERS ════
function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2700);
}

// ════ ENTRY ════
function startDesigning() {
    const n = document.getElementById('inp-name').value.trim();
    const p = document.getElementById('inp-phone').value.trim();
    let ok = true;
    document.getElementById('err-name').classList.remove('show');
    document.getElementById('err-phone').classList.remove('show');
    if (!n) { document.getElementById('err-name').classList.add('show'); ok = false; }
    if (!p) { document.getElementById('err-phone').classList.add('show'); ok = false; }
    if (!ok) return;
    S.user = { name: n, phone: p }; persist();
    renderDash(); goTo('s-residence');
}

// ════ RESIDENCE ════
function selRes(el) {
    document.querySelectorAll('.rb').forEach(b => b.classList.remove('sel'));
    el.classList.add('sel');
    S.property = S.property || {}; S.property.residence = el.dataset.val; persist();
    const bar = document.getElementById('resSel');
    bar.style.display = 'flex';
    document.getElementById('resSelName').textContent = el.dataset.val;
    const btn = document.getElementById('resContinue');
    btn.style.opacity = '1'; btn.style.pointerEvents = 'all';
    document.getElementById('resHint').textContent = el.dataset.val + ' selected';
    updatePgBar('s-residence');
}

// ════ BHK & AREA ════
let curUnit = 'sqft', curArea = 500;

function selBHK(el) {
    document.querySelectorAll('.bhkb').forEach(b => b.classList.remove('sel'));
    el.classList.add('sel');
    S.property = S.property || {}; S.property.bhk = el.dataset.val; persist();
    updateCfgChips();
    const btn = document.getElementById('bhkContinue');
    btn.style.opacity = '1'; btn.style.pointerEvents = 'all';
    document.getElementById('bhkHint').textContent = el.dataset.val + ' selected';
    updatePgBar('s-bhk');
}

function switchUnit(u, el) {
    curUnit = u;
    document.querySelectorAll('.ub').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    const r = document.getElementById('aRange');
    if (u === 'sqm') {
        r.max = 929; r.step = 5;
        const v = Math.round(curArea * .0929);
        r.value = v; curArea = v;
    } else {
        r.max = 10000; r.step = 50;
        const v = Math.min(Math.round(curArea / .0929), 10000);
        r.value = v; curArea = v;
    }
    updateAreaDisplay();
}

function updateArea(v) {
    curArea = parseInt(v);
    updateAreaDisplay();
    S.property = S.property || {};
    S.property.area = curArea;
    S.property.areaUnit = curUnit;
    S.property.areaType = document.getElementById('areaType').value;
    persist();
    updateCfgChips();
}

function updateAreaDisplay() {
    const u = curUnit === 'sqft' ? 'sq ft' : 'sq m';
    const mx = curUnit === 'sqft' ? 10000 : 929;
    document.getElementById('aVal').textContent = curArea.toLocaleString('en-IN');
    document.getElementById('aUnit').textContent = u;
    document.getElementById('rMin').textContent = '0 ' + u;
    document.getElementById('rMax').textContent = mx.toLocaleString('en-IN') + ' ' + u;
    document.getElementById('aInfo').textContent = curArea.toLocaleString('en-IN') + ' ' + u;
    const sf = curUnit === 'sqft' ? curArea : Math.round(curArea / .0929);
    let cat = 'Cozy Studio';
    if (sf > 500) cat = 'Cozy Apartment';
    if (sf > 900) cat = 'Comfortable Home';
    if (sf > 1400) cat = 'Spacious Residence';
    if (sf > 2200) cat = 'Luxury Home';
    if (sf > 4000) cat = 'Premium Estate';
    if (sf > 7000) cat = 'Grand Mansion';
    document.getElementById('aCat').textContent = cat;
}

function updateCfgChips() {
    const p = S.property || {};
    const c = document.getElementById('cfgChips');
    const w = document.getElementById('cfgSummary');
    const rows = [];
    if (p.residence) rows.push({ i: '🏠', l: 'Residence', v: p.residence });
    if (p.bhk) rows.push({ i: '🛏', l: 'Configuration', v: p.bhk });
    if (p.area) {
        const u = p.areaUnit === 'sqft' ? 'sq ft' : 'sq m';
        rows.push({ i: '📐', l: p.areaType || 'Carpet Area', v: p.area.toLocaleString('en-IN') + ' ' + u });
    }
    if (rows.length) {
        w.style.display = 'block';
        c.innerHTML = rows.map(r => '<div class="chip"><span class="chip-ico">' + r.i + '</span><div><div class="chip-lbl">' + r.l + '</div><div class="chip-val">' + r.v + '</div></div></div>').join('');
    } else w.style.display = 'none';
}

function proceedDash() {
    if (!S.property?.bhk) { toast('Please select BHK configuration'); return; }
    S.property.area = S.property.area || curArea;
    S.property.areaUnit = curUnit;
    S.property.areaType = document.getElementById('areaType').value;
    persist();
    renderDash(); goTo('s-dash');
}

// ════ DASHBOARD ════
function renderDash() {
    const cnt = S.options.length;
    const fin = S.options.some(o => o.isFinal);
    document.getElementById('progLbl').textContent = 'Options: ' + cnt + ' / 5';
    document.getElementById('progFill').style.width = (cnt / 5 * 100) + '%';
    document.getElementById('warnBanner').classList.toggle('show', cnt === 4);
    document.getElementById('newBtn').disabled = cnt >= 5 || fin;
    document.getElementById('limitMsg').classList.toggle('show', cnt >= 5 || fin);
    document.getElementById('dashSub').textContent = 'Welcome back, ' + S.user.name + ' — your design explorations';
    const grid = document.getElementById('optGrid');
    if (!cnt) {
        grid.innerHTML = '<div class="es"><div class="ei">✦</div><div class="et">No design options yet — create your first</div></div>';
        return;
    }
    grid.innerHTML = S.options.map((o, i) => {
        const rec = i === S.options.length - 1;
        const badge = o.isFinal ? '<span class="obadge b-fin">✦ Finalized</span>' : rec ? '<span class="obadge b-rec">Most Recent</span>' : '';
        const rooms = o.rooms.map(r => '<span class="rt">' + r + '</span>').join('');
        const model = o.model ? '<div class="odel">' + o.model.emoji + ' ' + o.model.name + '</div>' : '';
        const dt = new Date(o.ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        return '<div class="oc ' + (o.isFinal ? 'fin' : '') + ' fade-in">' + badge + '<div class="on">' + o.name + '</div><div class="om">' + o.pkg + ' Package · ' + dt + '</div>' + model + '<div class="or">' + rooms + '</div><div class="oa">' + (o.isFinal ? '' : '<button class="bt bt-g" onclick="editOpt(\'' + o.id + '\')">Edit</button>') + '<button class="bt bt-o" onclick="viewOpt(\'' + o.id + '\')">View</button>' + (o.isFinal ? '' : '<button class="bt bt-o" onclick="finOpt(\'' + o.id + '\')">Finalize</button>') + '<button class="bt bt-o" onclick="goTo(\'s-compare\');renderCompare()">Compare</button>' + (o.isFinal ? '' : '<button class="bt bt-d" onclick="delOpt(\'' + o.id + '\')">Remove</button>') + '</div></div>';
    }).join('');
}

function startNewOption() {
    if (S.options.length >= 5 || S.options.some(o => o.isFinal)) return;
    S.current = { pkg: '', price: '', col: '', rooms: [], model: null };
    S.editingId = null; persist();
    document.querySelectorAll('.pkc').forEach(c => c.classList.remove('sel'));
    document.querySelectorAll('.rc').forEach(c => c.classList.remove('sel'));
    S.current.rooms = []; updateRoomsUI(); goTo('s-package');
}

function editOpt(id) {
    const o = S.options.find(x => x.id === id);
    if (!o) return;
    S.editingId = id;
    S.current = { pkg: o.pkg, price: o.price, col: o.col, rooms: [...o.rooms], model: o.model };
    const pc = document.getElementById('pc-' + o.pkg);
    if (pc) pc.classList.add('sel');
    document.querySelectorAll('.rc').forEach(c => c.classList.remove('sel'));
    o.rooms.forEach(r => {
        const rc = document.getElementById('rcard-' + r);
        if (rc) rc.classList.add('sel');
    });
    updateRoomsUI(); goTo('s-package');
}

function viewOpt(id) {
    const o = S.options.find(x => x.id === id);
    if (!o) return;
    S.current = { pkg: o.pkg, price: o.price, col: o.col, rooms: [...o.rooms], model: o.model };
    renderSummary(); goTo('s-summary');
}

function delOpt(id) {
    S.options = S.options.filter(o => o.id !== id);
    persist(); renderDash(); toast('Design option removed');
}

function finOpt(id) {
    S.options.forEach(o => { if (o.id === id) o.isFinal = true; });
    persist(); renderDash(); toast('✦ Design option finalized!');
}

// ════ PACKAGE ════
function selPkg(pkg, price, col) {
    S.current.pkg = pkg; S.current.price = price; S.current.col = col; persist();
    document.querySelectorAll('.pkc').forEach(c => c.classList.remove('sel'));
    document.getElementById('pc-' + pkg).classList.add('sel');
    document.getElementById('upsell').classList.toggle('show', pkg === 'Silver');
    document.getElementById('pkgBadge').textContent = pkg + ' · ₹' + price + ' Lakhs';
    document.getElementById('pkgBadge').classList.add('show');
    updatePgBar('s-package');
    setTimeout(() => goTo('s-rooms'), 320);
}

// ════ ROOMS ════
function toggleRoom(name) {
    const el = document.getElementById('rcard-' + name);
    const idx = S.current.rooms.indexOf(name);
    if (idx >= 0) {
        S.current.rooms.splice(idx, 1); el.classList.remove('sel');
    } else {
        S.current.rooms.push(name); el.classList.add('sel');
    }
    persist(); updateRoomsUI(); updatePgBar('s-rooms');
}

function updateRoomsUI() {
    const arr = S.current.rooms;
    const tags = document.getElementById('selTags');
    const btn = document.getElementById('roomContinue');
    const sb = document.getElementById('selBar');
    if (arr.length) {
        tags.innerHTML = arr.map(r => '<span class="stag">' + r + '</span>').join('');
        btn.style.opacity = '1'; btn.style.pointerEvents = 'all';
        document.getElementById('roomHint').textContent = arr.length + ' room' + (arr.length > 1 ? 's' : '') + ' selected';
        sb.classList.add('has');
    } else {
        tags.innerHTML = '<span class="semp">No rooms chosen yet</span>';
        btn.style.opacity = '.3'; btn.style.pointerEvents = 'none';
        document.getElementById('roomHint').textContent = 'Select at least one room';
        sb.classList.remove('has');
    }
}

function proceedDesigns() {
    if (!S.current.rooms.length) { toast('Please select at least one room'); return; }
    renderModels(); goTo('s-models');
}

// ════ MODELS ════
let activeFilter = 'all';

function renderModels() {
    const el = MODELS.filter(m => m.pkg.includes(S.current.pkg) && m.rooms.some(r => S.current.rooms.includes(r)));
    const rooms = [...new Set(el.flatMap(m => m.rooms.filter(r => S.current.rooms.includes(r))))];
    document.getElementById('filterPills').innerHTML = '<span class="pill active" onclick="applyFilter(\'all\',this)">All</span>' + rooms.map(r => '<span class="pill" onclick="applyFilter(\'' + r + '\',this)">' + r + '</span>').join('');
    renderModelGrid(el, 'all'); updateSelDesignBar();
}

function applyFilter(val, el) {
    activeFilter = val;
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    const list = MODELS.filter(m => m.pkg.includes(S.current.pkg) && m.rooms.some(r => S.current.rooms.includes(r)));
    renderModelGrid(list, val);
}

function renderModelGrid(list, filter) {
    const filtered = filter === 'all' ? list : list.filter(m => m.rooms.includes(filter));
    document.getElementById('resCount').textContent = 'Showing ' + filtered.length + ' design' + (filtered.length !== 1 ? 's' : '') + ' · ' + S.current.rooms.join(' & ') + ' · ' + S.current.pkg;
    const grid = document.getElementById('modelGrid');
    if (!filtered.length) {
        grid.innerHTML = '<div style="padding:36px;text-align:center;color:var(--t3);font-style:italic">No designs match this filter</div>';
        return;
    }
    grid.innerHTML = filtered.map(m => {
        const rdots = m.rooms.filter(r => S.current.rooms.includes(r)).map(r => '<span class="rdot">' + r + '</span>').join('');
        const mats = m.mats.map(t => '<span class="mat">' + t + '</span>').join('');
        const isAdded = S.current.model && S.current.model.id === m.id;
        return '<div class="mc" id="mc-' + m.id + '"><div class="mv" style="background:' + m.bg + '"><div class="me">' + m.emoji + '</div><span class="mtag t' + m.tag.toLowerCase() + '">' + m.tag + '</span><div class="rdots">' + rdots + '</div></div><div class="min"><div class="mn">' + m.name + '</div><div class="mst">' + m.style + '</div><div class="mf">' + m.feats + '</div><div class="mats">' + mats + '</div><div class="mact"><button class="b3d" onclick="open3D(\'' + m.id + '\')">View 3D</button><button class="badd' + (isAdded ? ' added' : '') + '" id="ab-' + m.id + '" onclick="addModel(\'' + m.id + '\')">' + (isAdded ? '✓ Added' : 'Add to Option') + '</button></div></div></div>';
    }).join('');
}

function updateSelDesignBar() {
    const bar = document.getElementById('selDesignBar');
    const txt = document.getElementById('sdbTxt');
    const btn = document.getElementById('modelProceed');
    if (S.current.model) {
        bar.style.borderColor = 'rgba(201,169,110,.28)';
        txt.innerHTML = '<span style="font-size:17px">' + S.current.model.emoji + '</span> <span style="font-family:\'Cormorant Garamond\',serif;font-size:17px;color:var(--text)">' + S.current.model.name + '</span> <span style="font-size:9px;color:rgba(201,169,110,.5)">' + S.current.model.style + '</span>';
        btn.style.opacity = '1'; btn.style.pointerEvents = 'all';
        document.getElementById('modelHint').textContent = S.current.model.name + ' selected';
    } else {
        bar.style.borderColor = '';
        txt.textContent = 'No design selected yet';
        btn.style.opacity = '.3'; btn.style.pointerEvents = 'none';
        document.getElementById('modelHint').textContent = 'Select a design to continue';
    }
}

function addModel(id) {
    S.current.model = MODELS.find(m => m.id === id); persist();
    const el = MODELS.filter(m => m.pkg.includes(S.current.pkg) && m.rooms.some(r => S.current.rooms.includes(r)));
    renderModelGrid(el, activeFilter); updateSelDesignBar(); updatePgBar('s-models');
    toast('Design added — review your summary');
}

function goToSummary() { renderSummary(); goTo('s-summary'); }

// ════ 3D VIEWER ════
let rY = 0, rX = 0, sc = 1, drag = false, lX = 0, lY = 0;

function open3D(id) {
    S.viewingModel = MODELS.find(m => m.id === id);
    const m = S.viewingModel;
    document.getElementById('vName').innerHTML = m.name;
    document.getElementById('vStyle').textContent = m.style;
    document.getElementById('vRooms').innerHTML = m.rooms.filter(r => S.current.rooms.includes(r)).map(r => '<span class="vrm">' + r + '</span>').join('');
    const cols = ['#c9a96e', '#e8e0d0', '#8a8070', '#6a9080'];
    document.getElementById('vDetails').innerHTML = '<div class="dc2"><div class="dl">Materials</div><div class="sw">' + m.mats.map((t, i) => '<div class="swi"><div class="swd" style="background:' + cols[i % cols.length] + ';opacity:.75"></div>' + t + '</div>').join('') + '</div></div><div class="dc2"><div class="dl">Key Features</div>' + m.feats.split(' · ').map(f => '<div class="di"><div class="dd"></div>' + f + '</div>').join('') + '</div><div class="dc2"><div class="dl">Style</div><div class="di"><div class="dd"></div>' + m.style + '</div><div class="di"><div class="dd"></div>' + S.current.pkg + ' Collection</div></div>';
    rY = 0; rX = 0; sc = 1; document.getElementById('roomSvg').style.transform = '';
    goTo('s-viewer'); initViewer();
}

function initViewer() {
    const st = document.getElementById('viewStage');
    const svg = document.getElementById('roomSvg');
    st.onmousedown = e => { drag = true; lX = e.clientX; lY = e.clientY; };
    window.onmousemove = e => {
        if (!drag) return;
        rY += (e.clientX - lX) * .5;
        rX -= (e.clientY - lY) * .15;
        rX = Math.max(-18, Math.min(18, rX));
        lX = e.clientX; lY = e.clientY;
        svg.style.transform = 'rotateX(' + rX + 'deg) rotateY(' + rY + 'deg) scale(' + sc + ')';
    };
    window.onmouseup = () => drag = false;
    st.ontouchstart = e => { drag = true; lX = e.touches[0].clientX; lY = e.touches[0].clientY; };
    st.ontouchmove = e => {
        if (!drag) return;
        e.preventDefault();
        rY += (e.touches[0].clientX - lX) * .5;
        lX = e.touches[0].clientX;
        svg.style.transform = 'rotateX(' + rX + 'deg) rotateY(' + rY + 'deg) scale(' + sc + ')';
    };
    st.ontouchend = () => drag = false;
    st.onwheel = e => {
        e.preventDefault();
        sc = Math.max(.55, Math.min(2.2, sc - e.deltaY * .001));
        svg.style.transform = 'rotateX(' + rX + 'deg) rotateY(' + rY + 'deg) scale(' + sc + ')';
    };
    let ang = 0, floating = true;
    function fl() {
        if (floating && !drag) {
            ang += .008;
            document.getElementById('roomSvg').style.marginTop = Math.sin(ang) * 3 + 'px';
        }
        requestAnimationFrame(fl);
    }
    fl();
    st.addEventListener('mousedown', () => floating = false);
    st.addEventListener('mouseup', () => setTimeout(() => floating = true, 2000));
}

function doZoom(d) {
    sc = Math.max(.55, Math.min(2.2, sc + d));
    document.getElementById('roomSvg').style.transform = 'rotateX(' + rX + 'deg) rotateY(' + rY + 'deg) scale(' + sc + ')';
}

function switchView(v, el) {
    document.querySelectorAll('.vtb').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    const svg = document.getElementById('roomSvg');
    svg.style.filter = v === 'liv' ? 'hue-rotate(12deg) brightness(.94)' : 'none';
    rY = v === 'liv' ? 22 : 0;
    svg.style.transform = 'rotateX(' + rX + 'deg) rotateY(' + rY + 'deg) scale(' + sc + ')';
}

function addViewerModel() {
    S.current.model = S.viewingModel; persist();
    toast('✦ ' + S.viewingModel.name + ' added');
    renderSummary(); goTo('s-summary');
}

// ════ SUMMARY ════
let saveState = false;
const regenPool = NAMES;

function regenName() {
    document.getElementById('sumOptName').textContent = S.current.pkg + ' ' + regenPool[Math.floor(Math.random() * regenPool.length)];
}

function renderSummary() {
    saveState = false;
    const sb = document.getElementById('saveBtn');
    sb.textContent = 'Save as Design Option';
    sb.style.cssText = '';
    document.getElementById('saveSuc').classList.remove('show');
    const c = S.current;
    const adj = regenPool[Math.floor(Math.random() * regenPool.length)];
    document.getElementById('sumOptName').textContent = c.pkg + ' ' + adj;
    document.getElementById('sumPkg').textContent = c.pkg + ' Package';
    document.getElementById('sumCol').textContent = c.col || '';
    document.getElementById('sumPrice').textContent = PKG_PRICE[c.pkg] || '—';
    const icons = { Bedroom: '🛏', Kitchen: '🍳', 'Living Room': '🛋' };
    document.getElementById('sumRooms').innerHTML = c.rooms.map(r => '<div class="rchip"><span class="rci">' + icons[r] + '</span><span class="rcn">' + r + '</span></div>').join('') + '<div class="rchip" style="cursor:pointer;border-style:dashed;opacity:.35" onclick="goTo(\'s-rooms\')"><span class="rci" style="font-size:12px">+</span><span class="rcn">Add Room</span></div>';
    const dc = document.getElementById('sumDesign');
    if (c.model) {
        const m = c.model;
        dc.innerHTML = '<div class="dct"><div class="dcv">' + m.emoji + '</div><div class="dci"><div class="dcn">' + m.name + '</div><div class="dcs">' + m.style + '</div><div class="dcf">' + m.feats + '</div></div></div><div class="dcb">' + m.mats.map(t => '<span class="mat">' + t + '</span>').join('') + '<span class="dcc" onclick="goTo(\'s-models\')">Change ↺</span></div>';
    } else {
        dc.innerHTML = '<div style="padding:20px;text-align:center;color:var(--t3);font-style:italic;font-size:12px">No design selected</div>';
    }
    const cnt = S.options.length;
    let dots = '';
    for (let i = 0; i < 5; i++) dots += '<div class="vbdot' + (i < cnt ? ' on' : '') + '"></div>';
    document.getElementById('vbDots').innerHTML = dots;
    document.getElementById('vbCount').textContent = cnt + ' / 5';
    document.getElementById('mslLbl').textContent = (c.model ? c.model.name : 'Design') + ' · ' + c.pkg;
    const base = PKG_AMT[c.pkg] || 0;
    const ramt = Math.floor(base * .15);
    let rows = '';
    rows += '<div class="crow"><span class="cn">Base Package</span><span class="ca">' + fmtRs(base * .7) + '</span></div>';
    c.rooms.forEach(r => { rows += '<div class="crow"><span class="cn">' + r + '</span><span class="ca">' + fmtRs(ramt) + '</span></div>'; });
    document.getElementById('costRows').innerHTML = rows;
    document.getElementById('costTotal').textContent = PKG_PRICE[c.pkg] || '—';
}

function fmtRs(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }

function saveOption() {
    if (!S.current.pkg) { toast('Please select a package first'); return; }
    if (!S.current.rooms.length) { toast('Please select rooms'); return; }
    const name = document.getElementById('sumOptName').textContent;
    if (S.editingId) {
        const o = S.options.find(x => x.id === S.editingId);
        if (o) Object.assign(o, { name, pkg: S.current.pkg, price: S.current.price, col: S.current.col, rooms: [...S.current.rooms], model: S.current.model });
        S.editingId = null; persist(); toast('Design option updated');
    } else {
        if (S.options.length >= 5) { toast('Maximum 5 options reached'); return; }
        S.options.push({ id: 'o' + Date.now(), name, pkg: S.current.pkg, price: S.current.price, col: S.current.col, rooms: [...S.current.rooms], model: S.current.model, isFinal: false, ts: new Date().toISOString() });
        persist(); toast('✦ Design option saved');
    }
    saveState = true;
    const sb = document.getElementById('saveBtn');
    sb.textContent = '✓ Saved';
    sb.style.background = 'rgba(201,169,110,.12)';
    sb.style.color = 'var(--gold)';
    sb.style.border = '.5px solid rgba(201,169,110,.28)';
    document.getElementById('savedName').textContent = name;
    document.getElementById('saveSuc').classList.add('show');
    const cnt = S.options.length;
    let dots = '';
    for (let i = 0; i < 5; i++) dots += '<div class="vbdot' + (i < cnt ? ' on' : '') + '"></div>';
    document.getElementById('vbDots').innerHTML = dots;
    document.getElementById('vbCount').textContent = cnt + ' / 5';
}

// ════ COMPARE ════
function renderCompare() {
    const opts = S.options;
    if (!opts.length) return;
    const t = document.getElementById('cmpTable');
    const rows = ['Package', 'Price', 'Rooms', 'Design', 'Materials', 'Status'];
    let h = '<thead><tr><th class="rl">Attribute</th>';
    opts.forEach(o => h += '<th>' + o.name + '</th>');
    h += '</tr></thead><tbody>';
    rows.forEach(row => {
        h += '<tr><td class="rl">' + row + '</td>';
        opts.forEach(o => {
            let v = '';
            if (row === 'Package') v = o.pkg;
            else if (row === 'Price') v = '<span style="color:var(--gold)">' + PKG_PRICE[o.pkg] + '</span>';
            else if (row === 'Rooms') v = '<div class="ctc">' + o.rooms.map(r => '<span class="rt">' + r + '</span>').join('') + '</div>';
            else if (row === 'Design') v = o.model ? o.model.emoji + ' ' + o.model.name : '—';
            else if (row === 'Materials') v = o.model ? o.model.mats.join(' · ') : '—';
            else if (row === 'Status') v = o.isFinal ? '<span style="color:var(--gold);font-size:9px">✦ FINAL</span>' : '<span style="color:var(--t3);font-size:9px">In Progress</span>';
            h += '<td>' + v + '</td>';
        });
        h += '</tr>';
    });
    t.innerHTML = h + '</tbody>';
}

// ════ INQUIRY ════
function prefillInquiry() {
    document.getElementById('iq-name').value = S.user.name;
    document.getElementById('iq-phone').value = S.user.phone;
    const c = S.current;
    document.getElementById('iq-dname').textContent = c.model ? c.model.name : '—';
    document.getElementById('iq-dstyle').textContent = c.model ? c.model.style : '—';
    document.getElementById('iq-pkg').textContent = c.pkg ? c.pkg + ' Collection' : '—';
    document.getElementById('iq-rooms').textContent = c.rooms.join(' · ') || '—';
    document.getElementById('iq-mats').textContent = c.model ? c.model.mats.join(' · ') : '—';
    document.getElementById('iq-feats').textContent = c.model ? c.model.feats : '—';
    document.getElementById('iq-total').textContent = PKG_PRICE[c.pkg] || '—';
    document.querySelectorAll('.bo').forEach(b => b.classList.remove('sel'));
    const bb = document.querySelector('.bo[onclick*="' + S.budget + '"]');
    if (bb) bb.classList.add('sel');
    document.querySelectorAll('.to').forEach(t => t.classList.remove('sel'));
    const tb = document.querySelector('.to[onclick*="' + S.callTime + '"]');
}

function selBudget(el, v) {
    document.querySelectorAll('.bo').forEach(b => b.classList.remove('sel'));
    el.classList.add('sel'); S.budget = v; persist();
}

function selTime(el) {
    document.querySelectorAll('.to').forEach(t => t.classList.remove('sel'));
    el.classList.add('sel'); S.callTime = el.textContent; persist();
}

function togConsent() {
    S.consent = !S.consent; persist();
    const b = document.getElementById('conBox');
    b.classList.toggle('chk', S.consent);
    b.textContent = S.consent ? '✓' : '';
}

function submitInquiry() {
    const name = document.getElementById('iq-name').value.trim();
    const phone = document.getElementById('iq-phone').value.trim();
    let ok = true;
    document.querySelectorAll('.fe').forEach(e => e.classList.remove('show'));
    if (!name) { document.getElementById('iq-err-name').classList.add('show'); ok = false; }
    if (!phone) { document.getElementById('iq-err-phone').classList.add('show'); ok = false; }
    if (!ok) return;
    const btn = document.getElementById('subBtn');
    btn.textContent = 'Submitting…';
    btn.disabled = true;
    setTimeout(() => {
        const ref = 'HVN-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        const c = S.current;
        document.getElementById('succSub').textContent = 'Your consultation request has been received. Our team will call ' + name + ' at ' + phone + ' within 24 hours.';
        document.getElementById('succDets').innerHTML = [
            'Package: ' + c.pkg + ' · ' + (PKG_PRICE[c.pkg] || ''),
            c.model ? 'Design: ' + c.model.name + ' — ' + c.model.style : '',
            'Rooms: ' + c.rooms.join(' · '),
            'Budget: ' + S.budget,
            'Ref: <span style="color:var(--gold)">' + ref + '</span>'
        ].filter(Boolean).map(t => '<div class="sod"><div class="sodt"></div><span>' + t + '</span></div>').join('');
        document.getElementById('succOverlay').classList.add('show');
    }, 900);
}

// ════ BOOT RESTORE ════
(function boot() {
    if (S.user.name) {
        document.getElementById('inp-name').value = S.user.name;
        document.getElementById('inp-phone').value = S.user.phone;
    }
    if (S.property?.residence) {
        document.querySelectorAll('.rb').forEach(b => {
            if (b.dataset.val === S.property.residence) {
                b.classList.add('sel');
                const bar = document.getElementById('resSel');
                if (bar) {
                    bar.style.display = 'flex';
                    document.getElementById('resSelName').textContent = S.property.residence;
                }
                const btn = document.getElementById('resContinue');
                if (btn) {
                    btn.style.opacity = '1';
                    btn.style.pointerEvents = 'all';
                }
            }
        });
    }
    if (S.property?.bhk) {
        document.querySelectorAll('.bhkb').forEach(b => {
            if (b.dataset.val === S.property.bhk) b.classList.add('sel');
        });
        const btn = document.getElementById('bhkContinue');
        if (btn) {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'all';
        }
    }
    if (S.property?.area) {
        curArea = S.property.area;
        curUnit = S.property.areaUnit || 'sqft';
        const r = document.getElementById('aRange');
        if (r) {
            r.value = curArea;
            if (curUnit === 'sqm') { r.max = 929; r.step = 5; }
        }
        document.querySelectorAll('.ub').forEach(b => b.classList.remove('active'));
        const ub = document.getElementById('u' + curUnit);
        if (ub) ub.classList.add('active');
        updateAreaDisplay();
    }
    updateCfgChips();
    if (S.current.pkg) {
        const pc = document.getElementById('pc-' + S.current.pkg);
        if (pc) pc.classList.add('sel');
        document.getElementById('upsell').classList.toggle('show', S.current.pkg === 'Silver');
    }
    S.current.rooms.forEach(r => {
        const rc = document.getElementById('rcard-' + r);
        if (rc) rc.classList.add('sel');
    });
    updateRoomsUI();
    if (S.user.name) renderDash();
    if (S.current.pkg && S.current.rooms.length && ['s-models', 's-summary'].includes(S.lastScreen)) renderModels();
    if (S.lastScreen === 's-summary' && S.current.pkg) renderSummary();
    if (S.lastScreen === 's-compare') renderCompare();
    const dest = S.user.name ? S.lastScreen : 's-entry';
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const tgt = document.getElementById(dest) || document.getElementById('s-entry');
    tgt.classList.add('active');
    updateTopBar(dest); updatePgBar(dest);
    if (S.user.name || S.options.length) showStorageBadge();
})();

function showStorageBadge() {
    if (document.getElementById('stgBadge')) return;
    const b = document.createElement('div');
    b.id = 'stgBadge';
    b.style.cssText = 'position:fixed;bottom:18px;left:18px;z-index:500;display:flex;align-items:center;gap:7px;background:rgba(18,16,12,.92);border:.5px solid rgba(201,169,110,.2);padding:7px 12px;backdrop-filter:blur(12px);';
    b.innerHTML = '<span style="font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:rgba(201,169,110,.55)">● Saved locally</span><span style="font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:rgba(220,100,80,.5);cursor:pointer;border-bottom:.5px solid rgba(220,100,80,.22);padding-bottom:1px" onclick="if(confirm(\'Clear all saved data?\')){dbClear();location.reload();}">Clear</span>';
    document.body.appendChild(b);
}

document.getElementById('inp-name').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('inp-phone').focus(); });
document.getElementById('inp-phone').addEventListener('keydown', e => { if (e.key === 'Enter') startDesigning(); });