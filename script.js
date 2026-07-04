/* ═══════════════════════════════════════════════════════════════
   Scanabowl · script.js
   Client-side app: Google Sheets (CSV) → Papa Parse → UI
   Geen backend, geen kosten. Alles draait in de browser.
   ═══════════════════════════════════════════════════════════════ */
'use strict';

/* ───────────────────────── 1 · CONFIG ───────────────────────── */

const SHEETS = {
  products: 'https://docs.google.com/spreadsheets/d/1PKTzZGP0yxrbXeImuIyoSGCbPY29zlMvS6J__RNZGUg/export?format=csv&gid=0',
  blogs:    'https://docs.google.com/spreadsheets/d/1PKTzZGP0yxrbXeImuIyoSGCbPY29zlMvS6J__RNZGUg/export?format=csv&gid=966661590',
  brands:   'https://docs.google.com/spreadsheets/d/1PKTzZGP0yxrbXeImuIyoSGCbPY29zlMvS6J__RNZGUg/export?format=csv&gid=898173781',
  profiles: 'https://docs.google.com/spreadsheets/d/1PKTzZGP0yxrbXeImuIyoSGCbPY29zlMvS6J__RNZGUg/export?format=csv&gid=1151312816'
};

const PAGE_SIZE = 24;           // producten per "Meer laden"
const LS_PROFILE_KEY = 'scanabowl_pet_profile_v1';

// Kolomnaam-aliassen: Nederlandse óf Engelse headers in de Sheet werken.
const HEADER_ALIASES = {
  id:          ['id', 'productid', 'product_id'],
  name:        ['name', 'naam', 'product', 'productnaam', 'title', 'titel'],
  brand:       ['brand', 'merk'],
  animal:      ['animal', 'dier', 'doeldier', 'target', 'target_animal', 'species', 'soort_dier'],
  type:        ['type', 'food_type', 'voedingstype', 'soort', 'voertype'],
  life_stage:  ['life_stage', 'lifestage', 'levensfase', 'leeftijdsfase', 'stage', 'fase'],
  grain_free:  ['grain_free', 'grainfree', 'graanvrij'],
  protein:     ['protein', 'eiwit', 'ruw_eiwit', 'protein_pct'],
  fat:         ['fat', 'vet', 'ruw_vet', 'fat_pct'],
  ash:         ['ash', 'as', 'ruwe_as', 'ash_pct'],
  fiber:       ['fiber', 'fibre', 'vezel', 'vezels', 'ruwe_celstof', 'fiber_pct'],
  moisture:    ['moisture', 'vocht', 'vochtgehalte', 'moisture_pct'],
  carbs:       ['carbs', 'carbohydrates', 'koolhydraten', 'carbs_pct'],
  kcal:        ['kcal', 'kcal_100g', 'kcal_per_100g', 'energie', 'calorieen', 'energy'],
  weight_kg:   ['weight_kg', 'weight', 'gewicht', 'gewicht_kg', 'verpakking_kg', 'package_kg'],
  price:       ['price', 'prijs', 'price_eur', 'prijs_eur'],
  score:       ['score', 'rating', 'beoordeling', 'cijfer'],
  ingredients: ['ingredients', 'ingredienten', 'samenstelling'],
  image:       ['image', 'img', 'image_url', 'afbeelding', 'foto'],
  url:         ['url', 'link', 'affiliate', 'affiliate_url', 'bol_url'],
  description: ['description', 'beschrijving', 'omschrijving'],
  // blog
  slug:        ['slug'],
  excerpt:     ['excerpt', 'samenvatting', 'intro'],
  content:     ['content', 'inhoud', 'tekst', 'body', 'artikel'],
  author:      ['author', 'auteur'],
  date:        ['date', 'datum'],
  tags:        ['tags', 'tag', 'categorie', 'category'],
  // brands
  logo:        ['logo', 'logo_url'],
  website:     ['website', 'site'],
  country:     ['country', 'land'],
  // wizard-config
  group:       ['group', 'groep', 'key', 'categorie_type'],
  label:       ['label', 'optie', 'option', 'waarde_label'],
  value:       ['value', 'waarde', 'factor', 'multiplier']
};

/* ───────────────────────── 2 · STATE ───────────────────────── */

const state = {
  products: [], blogs: [], brands: [], wizardConfig: [],
  loaded: false,
  loadError: null,
  filters: { search: '', animal: '', brands: new Set(), types: new Set(), stages: new Set(), grainFree: false },
  sort: 'score-desc',
  visibleCount: PAGE_SIZE,
  wizardStep: 0,
  wizardData: {},
  lastFocus: null
};

/* ───────────────────────── 3 · UTILS ───────────────────────── */

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

// Getallen: accepteert "12,5", "12.5", "€ 12,50", "12%"
function toNum(v) {
  if (v === null || v === undefined) return NaN;
  const s = String(v).replace(/[€%\s]/g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}

function toBool(v) {
  return /^(true|ja|yes|1|x|waar)$/i.test(String(v ?? '').trim());
}

function fmtEUR(n, dec = 2) {
  if (!Number.isFinite(n)) return '—';
  return '€\u00A0' + n.toFixed(dec).replace('.', ',');
}

function normHeader(h) {
  return String(h ?? '').trim().toLowerCase()
    .replace(/[éèë]/g, 'e').replace(/\s+|[-.]/g, '_').replace(/[^a-z0-9_]/g, '');
}

// Zet een ruwe CSV-rij om naar canonieke veldnamen via de alias-tabel.
function canonicalize(row) {
  const out = {};
  const normRow = {};
  for (const key of Object.keys(row)) normRow[normHeader(key)] = row[key];
  for (const [canon, aliases] of Object.entries(HEADER_ALIASES)) {
    for (const a of aliases) {
      if (a in normRow && String(normRow[a]).trim() !== '') { out[canon] = String(normRow[a]).trim(); break; }
    }
  }
  return out;
}

function slugify(s) {
  return String(s ?? '').toLowerCase().trim()
    .replace(/[éèë]/g, 'e').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function placeholderImg(label = 'S') {
  const ch = esc(String(label).charAt(0).toUpperCase() || 'S');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f3eee3"/><path d="M130 150h140c0 42-28 66-70 66s-70-24-70-66z" fill="#065f46" opacity=".85"/><circle cx="168" cy="118" r="13" fill="#065f46" opacity=".85"/><circle cx="232" cy="118" r="13" fill="#065f46" opacity=".85"/><text x="200" y="286" font-family="monospace" font-size="16" fill="#94a3b8" text-anchor="middle">${ch} · geen afbeelding</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/* ─────────────── 4 · CSV LADEN (Papa Parse) ─────────────── */

function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: 'greedy',
      complete: res => resolve(res.data.map(canonicalize).filter(r => Object.keys(r).length > 0)),
      error: err => reject(err)
    });
  });
}

async function loadAllData() {
  try {
    const [products, blogs, brands, profiles] = await Promise.all([
      fetchCSV(SHEETS.products),
      fetchCSV(SHEETS.blogs).catch(() => []),
      fetchCSV(SHEETS.brands).catch(() => []),
      fetchCSV(SHEETS.profiles).catch(() => [])
    ]);

    state.products = products
      .filter(p => p.name)
      .map((p, i) => ({
        ...p,
        _id: p.id || 'p' + i,
        _price: toNum(p.price),
        _weight: toNum(p.weight_kg),
        _score: toNum(p.score),
        _protein: toNum(p.protein),
        _fat: toNum(p.fat),
        _ash: toNum(p.ash),
        _fiber: toNum(p.fiber),
        _moisture: toNum(p.moisture),
        _grainFree: toBool(p.grain_free)
      }));

    state.blogs = blogs
      .filter(b => b.title || b.name)
      .map((b, i) => ({ ...b, title: b.title || b.name, _slug: b.slug ? slugify(b.slug) : slugify(b.title || b.name) || 'artikel-' + i }));

    state.brands = brands.filter(b => b.name || b.brand).map(b => ({ ...b, name: b.name || b.brand }));
    state.wizardConfig = profiles;
    state.loaded = true;
  } catch (err) {
    console.error('Scanabowl: data laden mislukt', err);
    state.loadError = err;
    showStatusBanner();
  }
  renderAll();
}

function showStatusBanner() {
  const el = $('#data-status');
  el.className = '';
  el.innerHTML = `
    <div class="status-banner status-error" role="alert">
      <span>De voerdatabase kon niet worden geladen. Controleer je internetverbinding — of de Google Sheet is niet openbaar gedeeld ("Iedereen met de link → Lezer").</span>
      <button class="btn-secondary !px-4 !py-1.5 !text-xs" onclick="location.reload()">Opnieuw proberen</button>
    </div>`;
}

/* ─────────── 5 · VOEDINGSKUNDIGE BEREKENINGEN ─────────── */

// Vochtaanname: droogvoer 10%, natvoer 78% (tenzij vermeld in de sheet)
function getMoisture(p) {
  if (Number.isFinite(p._moisture)) return p._moisture;
  return isWetFood(p) ? 78 : 10;
}
function isWetFood(p) {
  return /nat|wet|blik|kuipje|pouch|paté/i.test(p.type || '');
}

// Koolhydraten (NFE): 100 − (eiwit + vet + as + vezels + vocht)
function estimateCarbs(p) {
  const direct = toNum(p.carbs);
  if (Number.isFinite(direct)) return direct;
  const { _protein: pr, _fat: f, _ash: a, _fiber: fi } = p;
  if (![pr, f].every(Number.isFinite)) return NaN;
  const carbs = 100 - (pr + f + (Number.isFinite(a) ? a : 7) + (Number.isFinite(fi) ? fi : 2.5) + getMoisture(p));
  return Math.max(0, Math.round(carbs * 10) / 10);
}

// kcal per 100 g: uit sheet, anders gewijzigde Atwater-factoren (3,5 / 8,5 / 3,5)
function kcalPer100g(p) {
  const direct = toNum(p.kcal);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const carbs = estimateCarbs(p);
  if (![p._protein, p._fat, carbs].every(Number.isFinite)) return NaN;
  return Math.round(p._protein * 3.5 + p._fat * 8.5 + carbs * 3.5);
}

// Energiebehoefte (MER) = 70 × kg^0.75 × activiteitsfactor
function dailyKcalNeed(species, weightKg, activity) {
  const rer = 70 * Math.pow(weightKg, 0.75);
  const dogF = { laag: 1.3, normaal: 1.6, hoog: 2.0 };
  const catF = { laag: 1.0, normaal: 1.2, hoog: 1.4 };
  const f = (species === 'kat' ? catF : dogF)[activity || 'normaal'] || (species === 'kat' ? 1.2 : 1.6);
  return rer * f;
}

// Referentiedier voor dagkosten: opgeslagen profiel of standaard (hond 15 kg / kat 4 kg)
function referencePet(product) {
  const saved = getSavedProfile();
  const isCat = /kat|cat/i.test(product.animal || '');
  if (saved && ((isCat && saved.species === 'kat') || (!isCat && saved.species === 'hond'))) {
    return { species: saved.species, weight: saved.weight, activity: saved.activity, name: saved.name, fromProfile: true };
  }
  return isCat
    ? { species: 'kat', weight: 4, activity: 'normaal', fromProfile: false }
    : { species: 'hond', weight: 15, activity: 'normaal', fromProfile: false };
}

function dailyCost(product) {
  const kcal100 = kcalPer100g(product);
  if (!Number.isFinite(kcal100) || kcal100 <= 0) return null;
  if (![product._price, product._weight].every(n => Number.isFinite(n) && n > 0)) return null;
  const pet = referencePet(product);
  const needKcal = dailyKcalNeed(pet.species, pet.weight, pet.activity);
  const gramsPerDay = (needKcal / kcal100) * 100;
  const pricePerGram = product._price / (product._weight * 1000);
  return { cost: gramsPerDay * pricePerGram, grams: Math.round(gramsPerDay), pet, kcal100 };
}

function pricePerKg(p) {
  if (![p._price, p._weight].every(n => Number.isFinite(n) && n > 0)) return NaN;
  return p._price / p._weight;
}

/* ─────────────────── 6 · ROUTER ─────────────────── */

const PAGES = ['home', 'finder', 'wizard', 'blog', 'article', 'about', 'legal'];

function route() {
  const hash = location.hash.replace(/^#\/?/, '') || 'home';
  const [page, param] = hash.split('/');
  const target = PAGES.includes(page) ? page : 'home';

  PAGES.forEach(p => $('#page-' + p)?.classList.toggle('hidden', p !== target));
  $$('.nav-link').forEach(a => a.classList.toggle('active', a.dataset.nav === target));
  $('#mobile-menu')?.classList.add('hidden');
  $('#mobile-menu-btn')?.setAttribute('aria-expanded', 'false');
  window.scrollTo({ top: 0, behavior: 'auto' });

  if (target === 'article') renderArticle(param);
  if (target === 'legal') renderLegal(param);
  if (target === 'finder') { renderFinder(); }
  if (target === 'wizard') { renderWizardStep(); renderWizardSaved(); }
  if (target === 'blog') renderBlogGrid();
  closeModal(false);
}

/* ─────────────── 7 · PRODUCTKAART (gedeeld) ─────────────── */

function scoreOf(p) { return Number.isFinite(p._score) ? p._score : NaN; }

function productCard(p) {
  const dc = dailyCost(p);
  const img = p.image ? esc(p.image) : placeholderImg(p.brand || p.name);
  const badges = [
    p.type ? `<span class="badge">${esc(p.type)}</span>` : '',
    p.life_stage ? `<span class="badge">${esc(p.life_stage)}</span>` : '',
    p._grainFree ? `<span class="badge badge-green">Graanvrij</span>` : ''
  ].join(' ');
  return `
    <button class="product-card" data-product="${esc(p._id)}" aria-haspopup="dialog" aria-label="Bekijk analyse van ${esc(p.name)}">
      ${Number.isFinite(scoreOf(p)) ? `<span class="score-badge">${String(scoreOf(p)).replace('.', ',')}<small>/10</small></span>` : ''}
      <div class="card-img-wrap"><img class="card-img" src="${img}" alt="${esc(p.name)}" loading="lazy" onerror="this.src='${placeholderImg(p.brand || p.name)}'"></div>
      <div class="flex flex-1 flex-col p-4">
        <p class="font-mono text-[.68rem] font-semibold uppercase tracking-wider text-ink-faint">${esc(p.brand || '')}</p>
        <h3 class="mt-1 font-display text-[1.05rem] font-semibold leading-snug">${esc(p.name)}</h3>
        <div class="mt-2 flex flex-wrap gap-1.5">${badges}</div>
        <div class="mt-auto flex items-end justify-between pt-4">
          <div>
            <p class="font-mono text-lg font-semibold text-ink">${fmtEUR(p._price)}</p>
            ${Number.isFinite(pricePerKg(p)) ? `<p class="text-xs text-ink-faint">${fmtEUR(pricePerKg(p))}/kg</p>` : ''}
          </div>
          ${dc ? `<p class="rounded-lg bg-brand-soft px-2 py-1 font-mono text-xs font-semibold text-brand">${fmtEUR(dc.cost)}/dag</p>` : ''}
        </div>
      </div>
    </button>`;
}

/* ─────────────── 8 · HOME ─────────────── */

function renderHome() {
  // Statistieken
  const stats = $('#home-stats');
  if (stats && state.loaded) {
    const nBrands = new Set(state.products.map(p => (p.brand || '').toLowerCase()).filter(Boolean)).size;
    stats.innerHTML = `
      <span><strong class="text-2xl font-semibold text-brand">${state.products.length}</strong><br>voeders geanalyseerd</span>
      <span><strong class="text-2xl font-semibold text-brand">${nBrands}</strong><br>merken vergeleken</span>
      <span><strong class="text-2xl font-semibold text-brand">${state.blogs.length}</strong><br>kennisartikelen</span>`;
  }
  // Top 4 producten
  const top = $('#home-top-products');
  if (top) {
    if (!state.loaded) top.innerHTML = '<div class="skeleton"></div>'.repeat(4);
    else top.innerHTML = [...state.products]
      .filter(p => Number.isFinite(scoreOf(p)))
      .sort((a, b) => scoreOf(b) - scoreOf(a))
      .slice(0, 4).map(productCard).join('') || '<p class="col-span-full text-sm text-ink-soft">Nog geen producten in de database.</p>';
  }
  // Laatste 3 blogs
  const hb = $('#home-blogs');
  if (hb) {
    if (!state.loaded) hb.innerHTML = '<div class="skeleton !min-h-[260px]"></div>'.repeat(3);
    else hb.innerHTML = state.blogs.slice(0, 3).map(blogCard).join('') || '<p class="col-span-full text-sm text-ink-soft">Nog geen artikelen gepubliceerd.</p>';
  }
}

/* ─────────────── 9 · FOOD FINDER ─────────────── */

function uniqueValues(field) {
  const set = new Map();
  state.products.forEach(p => {
    const v = (p[field] || '').trim();
    if (v) set.set(v.toLowerCase(), v);
  });
  return [...set.values()].sort((a, b) => a.localeCompare(b, 'nl'));
}

function buildFilterControls() {
  // Dier (pill toggles)
  const animals = uniqueValues('animal');
  $('#f-animal').innerHTML = ['', ...animals].map(a => `
    <button type="button" class="pill-toggle" data-animal="${esc(a)}" aria-pressed="${a === state.filters.animal}">
      ${a ? esc(a) : 'Alle'}
    </button>`).join('');

  // Merken: dynamisch uit Brands-sheet, aangevuld met merken uit Products
  const brandNames = new Map();
  state.brands.forEach(b => brandNames.set(b.name.toLowerCase(), b.name));
  state.products.forEach(p => { if (p.brand) brandNames.set(p.brand.toLowerCase(), p.brand); });
  $('#f-brand').innerHTML = [...brandNames.values()].sort((a, b) => a.localeCompare(b, 'nl')).map(b => `
    <label class="check-row"><input type="checkbox" class="check-input" data-brand="${esc(b)}" ${state.filters.brands.has(b) ? 'checked' : ''}> <span>${esc(b)}</span></label>
  `).join('') || '<p class="text-xs text-ink-faint">Geen merken gevonden.</p>';

  // Voedingstype & levensfase
  $('#f-type').innerHTML = uniqueValues('type').map(t => `
    <label class="check-row"><input type="checkbox" class="check-input" data-type="${esc(t)}" ${state.filters.types.has(t) ? 'checked' : ''}> <span>${esc(t)}</span></label>`).join('');
  $('#f-stage').innerHTML = uniqueValues('life_stage').map(s => `
    <label class="check-row"><input type="checkbox" class="check-input" data-stage="${esc(s)}" ${state.filters.stages.has(s) ? 'checked' : ''}> <span>${esc(s)}</span></label>`).join('');
}

function applyFilters() {
  const f = state.filters;
  const q = f.search.toLowerCase();
  let list = state.products.filter(p => {
    if (f.animal && (p.animal || '').toLowerCase() !== f.animal.toLowerCase()) return false;
    if (f.brands.size && !f.brands.has(p.brand)) return false;
    if (f.types.size && !f.types.has(p.type)) return false;
    if (f.stages.size && !f.stages.has(p.life_stage)) return false;
    if (f.grainFree && !p._grainFree) return false;
    if (q) {
      const hay = [p.name, p.brand, p.ingredients, p.description].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const cmp = {
    'score-desc': (a, b) => (scoreOf(b) || -1) - (scoreOf(a) || -1),
    'price-asc':  (a, b) => (a._price || 1e9) - (b._price || 1e9),
    'price-desc': (a, b) => (b._price || -1) - (a._price || -1),
    'ppkg-asc':   (a, b) => (pricePerKg(a) || 1e9) - (pricePerKg(b) || 1e9),
    'name-asc':   (a, b) => (a.name || '').localeCompare(b.name || '', 'nl')
  }[state.sort];
  return list.sort(cmp);
}

function renderFinder() {
  if (!$('#products-grid')) return;
  if (!state.loaded && !state.loadError) {
    $('#products-grid').innerHTML = '<div class="skeleton"></div>'.repeat(6);
    $('#results-count').textContent = 'Database laden…';
    return;
  }
  buildFilterControls();
  renderProductGrid();
  renderActiveProfileBanner();
}

function renderProductGrid() {
  const list = applyFilters();
  const visible = list.slice(0, state.visibleCount);
  $('#products-grid').innerHTML = visible.map(productCard).join('');
  $('#products-empty').classList.toggle('hidden', list.length > 0);
  $('#results-count').textContent = `${list.length} ${list.length === 1 ? 'voer' : 'voeders'} gevonden`;
  $('#load-more').classList.toggle('hidden', list.length <= state.visibleCount);

  const active = (state.filters.animal ? 1 : 0) + state.filters.brands.size + state.filters.types.size +
                 state.filters.stages.size + (state.filters.grainFree ? 1 : 0) + (state.filters.search ? 1 : 0);
  $('#filters-count').textContent = active;
}

function renderActiveProfileBanner() {
  const el = $('#wizard-active-banner');
  const p = getSavedProfile();
  if (!p) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  el.className = 'mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/20 bg-brand-soft px-4 py-3 text-sm';
  el.innerHTML = `
    <p>🐾 Dagkosten worden berekend voor <strong>${esc(p.name)}</strong> (${esc(p.species)}, ${p.weight} kg, activiteit: ${esc(p.activity)}).</p>
    <a href="#wizard" class="font-semibold text-brand hover:underline">Profiel aanpassen →</a>`;
}

function bindFinderEvents() {
  let debounce;
  $('#f-search').addEventListener('input', e => {
    clearTimeout(debounce);
    debounce = setTimeout(() => { state.filters.search = e.target.value.trim(); state.visibleCount = PAGE_SIZE; renderProductGrid(); }, 180);
  });

  $('#f-animal').addEventListener('click', e => {
    const btn = e.target.closest('[data-animal]');
    if (!btn) return;
    state.filters.animal = btn.dataset.animal;
    $$('#f-animal .pill-toggle').forEach(b => b.setAttribute('aria-pressed', b === btn));
    state.visibleCount = PAGE_SIZE; renderProductGrid();
  });

  const checkboxHandler = (attr, set) => e => {
    const cb = e.target.closest(`[data-${attr}]`);
    if (!cb) return;
    cb.checked ? set.add(cb.dataset[attr]) : set.delete(cb.dataset[attr]);
    state.visibleCount = PAGE_SIZE; renderProductGrid();
  };
  $('#f-brand').addEventListener('change', checkboxHandler('brand', state.filters.brands));
  $('#f-type').addEventListener('change', checkboxHandler('type', state.filters.types));
  $('#f-stage').addEventListener('change', checkboxHandler('stage', state.filters.stages));

  $('#f-grainfree').addEventListener('change', e => { state.filters.grainFree = e.target.checked; state.visibleCount = PAGE_SIZE; renderProductGrid(); });
  $('#f-sort').addEventListener('change', e => { state.sort = e.target.value; renderProductGrid(); });

  $('#f-reset').addEventListener('click', () => {
    state.filters = { search: '', animal: '', brands: new Set(), types: new Set(), stages: new Set(), grainFree: false };
    state.visibleCount = PAGE_SIZE;
    $('#f-search').value = ''; $('#f-grainfree').checked = false; $('#f-sort').value = state.sort;
    buildFilterControls(); renderProductGrid();
  });

  $('#load-more').addEventListener('click', () => { state.visibleCount += PAGE_SIZE; renderProductGrid(); });

  $('#filters-toggle').addEventListener('click', () => {
    const panel = $('#filters-panel');
    const open = panel.classList.toggle('hidden');
    $('#filters-toggle').setAttribute('aria-expanded', String(!open));
  });
}

/* ─────────────── 10 · PRODUCT MODAL ─────────────── */

const MACROS = [
  { key: 'protein',  label: 'Eiwit',        color: '#065f46' },
  { key: 'fat',      label: 'Vet',          color: '#0b7a57' },
  { key: 'carbs',    label: 'Koolhydraten', color: '#f59e0b' },
  { key: 'fiber',    label: 'Ruwe celstof', color: '#b45309' },
  { key: 'ash',      label: 'Ruwe as',      color: '#64748b' },
  { key: 'moisture', label: 'Vocht',        color: '#cbd5e1' }
];

function macroValues(p) {
  return {
    protein: p._protein, fat: p._fat, ash: p._ash, fiber: p._fiber,
    carbs: estimateCarbs(p), moisture: getMoisture(p)
  };
}

// Interactieve SVG-donut van de macroverdeling
function macroChartSVG(p) {
  const vals = macroValues(p);
  const segs = MACROS.map(m => ({ ...m, v: vals[m.key] })).filter(s => Number.isFinite(s.v) && s.v > 0);
  const total = segs.reduce((s, x) => s + x.v, 0);
  if (!segs.length || total <= 0) return '<p class="text-sm text-ink-faint">Geen analytische bestanddelen beschikbaar voor dit product.</p>';

  const R = 70, C = 2 * Math.PI * R;
  let offset = 0;
  const circles = segs.map(s => {
    const frac = s.v / total;
    const el = `<circle class="macro-seg" data-macro="${s.key}" cx="90" cy="90" r="${R}" fill="none"
      stroke="${s.color}" stroke-width="26" opacity=".92"
      stroke-dasharray="${(frac * C).toFixed(2)} ${C.toFixed(2)}"
      stroke-dashoffset="${(-offset * C).toFixed(2)}"
      transform="rotate(-90 90 90)">
      <title>${s.label}: ${String(s.v).replace('.', ',')}%</title></circle>`;
    offset += frac;
    return el;
  }).join('');

  const kcal = kcalPer100g(p);
  const legend = segs.map(s => `
    <div class="macro-legend-row" data-macro="${s.key}" tabindex="0">
      <span class="macro-dot" style="background:${s.color}"></span>
      <span class="flex-1 text-sm">${s.label}${s.key === 'carbs' && !Number.isFinite(toNum(p.carbs)) ? ' <span class="text-xs text-ink-faint">(berekend)</span>' : ''}</span>
      <span class="font-mono text-sm font-semibold">${String(s.v).replace('.', ',')}%</span>
    </div>`).join('');

  return `
    <div class="grid items-center gap-6 sm:grid-cols-[180px_1fr]">
      <svg viewBox="0 0 180 180" class="mx-auto w-44" role="img" aria-label="Macronutriëntenverdeling">
        ${circles}
        <text id="macro-center-val" x="90" y="86" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="19" font-weight="600" fill="#1e293b">${Number.isFinite(kcal) ? kcal : '—'}</text>
        <text id="macro-center-lbl" x="90" y="104" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="9.5" fill="#94a3b8">KCAL / 100 G</text>
      </svg>
      <div id="macro-legend">${legend}</div>
    </div>`;
}

function bindMacroInteractivity(root, p) {
  const vals = macroValues(p);
  const kcal = kcalPer100g(p);
  const setCenter = (val, lbl) => {
    const v = root.querySelector('#macro-center-val'), l = root.querySelector('#macro-center-lbl');
    if (v) v.textContent = val;
    if (l) l.textContent = lbl;
  };
  const highlight = key => {
    root.querySelectorAll('.macro-seg').forEach(s => { s.classList.toggle('hl', s.dataset.macro === key); s.style.opacity = key && s.dataset.macro !== key ? .3 : .92; });
    root.querySelectorAll('.macro-legend-row').forEach(r => r.classList.toggle('hl', r.dataset.macro === key));
    if (key) {
      const m = MACROS.find(x => x.key === key);
      setCenter(String(vals[key]).replace('.', ',') + '%', m.label.toUpperCase());
    } else {
      setCenter(Number.isFinite(kcal) ? kcal : '—', 'KCAL / 100 G');
    }
  };
  root.querySelectorAll('[data-macro]').forEach(el => {
    el.addEventListener('mouseenter', () => highlight(el.dataset.macro));
    el.addEventListener('mouseleave', () => highlight(null));
    el.addEventListener('focus', () => highlight(el.dataset.macro));
    el.addEventListener('blur', () => highlight(null));
  });
}

function ingredientsHTML(p) {
  if (!p.ingredients) return '<p class="text-sm text-ink-faint">Geen ingrediëntendeclaratie beschikbaar.</p>';
  const parts = p.ingredients.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
  return '<p class="text-sm leading-relaxed text-ink-soft">' + parts.map((ing, i) =>
    i < 5 ? `<span class="ingredient-top5">${esc(ing)}</span>` : esc(ing)
  ).join(', ') + '.</p>' +
  '<p class="mt-2 text-xs text-ink-faint">De <strong class="text-brand">eerste vijf ingrediënten</strong> (vetgedrukt) vormen het grootste deel van de receptuur en zijn de belangrijkste kwaliteitsindicator.</p>';
}

function openModal(productId) {
  const p = state.products.find(x => x._id === productId);
  if (!p) return;
  state.lastFocus = document.activeElement;

  const dc = dailyCost(p);
  const img = p.image ? esc(p.image) : placeholderImg(p.brand || p.name);
  const hasUrl = /^https?:\/\//i.test(p.url || '');

  $('#modal-body').innerHTML = `
    <div class="grid gap-6 sm:grid-cols-[200px_1fr]">
      <div class="rounded-2xl bg-cream-deep p-4"><img src="${img}" alt="${esc(p.name)}" class="mx-auto max-h-48 object-contain" onerror="this.src='${placeholderImg(p.brand || p.name)}'"></div>
      <div>
        <p class="font-mono text-xs font-semibold uppercase tracking-wider text-ink-faint">${esc(p.brand || '')}</p>
        <h2 id="modal-title" class="mt-1 font-display text-2xl font-semibold leading-tight">${esc(p.name)}</h2>
        <div class="mt-3 flex flex-wrap gap-1.5">
          ${p.animal ? `<span class="badge">${esc(p.animal)}</span>` : ''}
          ${p.type ? `<span class="badge">${esc(p.type)}</span>` : ''}
          ${p.life_stage ? `<span class="badge">${esc(p.life_stage)}</span>` : ''}
          ${p._grainFree ? `<span class="badge badge-green">Graanvrij</span>` : ''}
          ${Number.isFinite(scoreOf(p)) ? `<span class="badge badge-green">Score ${String(scoreOf(p)).replace('.', ',')}/10</span>` : ''}
        </div>
        ${p.description ? `<p class="mt-3 text-sm leading-relaxed text-ink-soft">${esc(p.description)}</p>` : ''}
        <div class="mt-4 flex items-baseline gap-4">
          <span class="font-mono text-2xl font-semibold">${fmtEUR(p._price)}</span>
          ${Number.isFinite(p._weight) ? `<span class="text-sm text-ink-faint">per ${String(p._weight).replace('.', ',')} kg</span>` : ''}
          ${Number.isFinite(pricePerKg(p)) ? `<span class="text-sm text-ink-faint">· ${fmtEUR(pricePerKg(p))}/kg</span>` : ''}
        </div>
      </div>
    </div>

    <div class="mt-8">
      <h3 class="font-mono text-xs font-semibold uppercase tracking-widest text-brand">Macronutriënten</h3>
      <div class="mt-4 rounded-2xl border border-cream-line bg-cream/60 p-5" id="macro-chart-wrap">${macroChartSVG(p)}</div>
    </div>

    ${dc ? `
    <div class="mt-6 rounded-2xl border border-brand/20 bg-brand-soft p-5">
      <h3 class="font-mono text-xs font-semibold uppercase tracking-widest text-brand">Geschatte dagkosten</h3>
      <div class="mt-3 flex flex-wrap items-center gap-x-8 gap-y-2">
        <p class="font-mono text-3xl font-semibold text-brand">${fmtEUR(dc.cost)}<span class="text-base font-normal text-ink-soft">/dag</span></p>
        <p class="text-sm text-ink-soft">≈ ${dc.grams} g per dag · ${dc.kcal100} kcal/100 g</p>
      </div>
      <p class="mt-2 text-xs text-ink-faint">
        ${dc.pet.fromProfile
          ? `Berekend voor jouw profiel: <strong>${esc(dc.pet.name)}</strong> (${esc(dc.pet.species)}, ${dc.pet.weight} kg, activiteit ${esc(dc.pet.activity)}).`
          : `Berekend voor een gemiddelde ${dc.pet.species} van ${dc.pet.weight} kg. <a href="#wizard" class="font-semibold text-brand underline" data-close-modal>Maak een profiel</a> voor een berekening op maat.`}
        Formule: 70 × kg<sup>0,75</sup> × activiteitsfactor.
      </p>
    </div>` : ''}

    <div class="mt-6">
      <h3 class="font-mono text-xs font-semibold uppercase tracking-widest text-brand">Samenstelling</h3>
      <div class="mt-3">${ingredientsHTML(p)}</div>
    </div>

    ${hasUrl ? `
    <div class="mt-8 rounded-2xl bg-brand-dark p-6 text-center">
      <p class="font-display text-lg font-semibold text-white">Klaar om over te stappen?</p>
      <p class="mt-1 text-sm text-white/70">Bekijk de actuele prijs en voorraad bij bol.com.</p>
      <a href="${esc(p.url)}" target="_blank" rel="noopener sponsored" class="btn-primary mt-4 !bg-white !text-brand hover:!bg-cream">
        Bekijk bij bol.com
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h7v7M13 3L7 9"/><path d="M11 9v4H3V5h4"/></svg>
      </a>
      <p class="mt-3 text-[.68rem] text-white/50">Affiliate-link · als je via deze link koopt, ontvangen wij mogelijk een commissie. Dit kost jou niets extra.</p>
    </div>` : ''}
  `;

  const modal = $('#product-modal');
  modal.classList.remove('hidden');
  modal.classList.add('open');
  document.body.classList.add('modal-open');
  bindMacroInteractivity($('#macro-chart-wrap'), p);
  $('#modal-close').focus();
}

function closeModal(restoreFocus = true) {
  const modal = $('#product-modal');
  if (modal.classList.contains('hidden')) return;
  modal.classList.add('hidden');
  modal.classList.remove('open');
  document.body.classList.remove('modal-open');
  if (restoreFocus && state.lastFocus) state.lastFocus.focus();
}

function bindModalEvents() {
  document.addEventListener('click', e => {
    const card = e.target.closest('[data-product]');
    if (card) { openModal(card.dataset.product); return; }
    if (e.target.closest('[data-close-modal]')) { closeModal(false); return; }
    if (e.target.id === 'modal-backdrop' || e.target.closest('#modal-close')) closeModal();
  });
  document.addEventListener('keydown', e => {
    const modal = $('#product-modal');
    if (modal.classList.contains('hidden')) return;
    if (e.key === 'Escape') { closeModal(); return; }
    // eenvoudige focus-trap
    if (e.key === 'Tab') {
      const focusables = $$('#modal-panel a[href], #modal-panel button, #modal-panel [tabindex="0"]').filter(el => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}

/* ─────────────── 11 · PET PROFILE WIZARD ─────────────── */

function getSavedProfile() {
  try {
    const raw = localStorage.getItem(LS_PROFILE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return (p && p.name && p.species && Number.isFinite(p.weight)) ? p : null;
  } catch { return null; }
}

// Opties uit de Pet Profiles-sheet (group/label/value) met ingebouwde fallback.
function wizardOptions(group, fallback) {
  const rows = state.wizardConfig.filter(r => (r.group || '').toLowerCase() === group);
  if (!rows.length) return fallback;
  return rows.map(r => ({ label: r.label || r.value, value: (r.label || r.value || '').toLowerCase(), factor: toNum(r.value) }));
}

const WIZARD_STEPS = [
  {
    key: 'name', title: 'Hoe heet je huisdier?',
    render: d => `<label for="w-name" class="filter-label">Naam</label>
      <input id="w-name" class="input-base" type="text" placeholder="Bijv. Max of Luna" value="${esc(d.name || '')}" autocomplete="off" />`,
    collect: d => { d.name = $('#w-name').value.trim(); return d.name ? null : 'Vul een naam in.'; }
  },
  {
    key: 'species', title: 'Is het een hond of een kat?',
    render: d => optionButtons('species', [
      { label: '🐶 Hond', value: 'hond' }, { label: '🐱 Kat', value: 'kat' }
    ], d.species),
    collect: d => { d.species = pressedValue('species'); return d.species ? null : 'Kies hond of kat.'; }
  },
  {
    key: 'age', title: 'Hoe oud is je dier?',
    render: d => `<label for="w-age" class="filter-label">Leeftijd in jaren (pup/kitten: 0)</label>
      <input id="w-age" class="input-base" type="number" min="0" max="30" step="0.5" value="${d.age ?? ''}" placeholder="Bijv. 4" />`,
    collect: d => { d.age = toNum($('#w-age').value); return Number.isFinite(d.age) && d.age >= 0 ? null : 'Vul een geldige leeftijd in.'; }
  },
  {
    key: 'weight', title: 'Wat weegt je dier?',
    render: d => `<label for="w-weight" class="filter-label">Gewicht in kilogram</label>
      <input id="w-weight" class="input-base" type="number" min="0.5" max="100" step="0.1" value="${d.weight ?? ''}" placeholder="Bijv. 12,5" />`,
    collect: d => { d.weight = toNum($('#w-weight').value); return Number.isFinite(d.weight) && d.weight > 0 ? null : 'Vul een geldig gewicht in.'; }
  },
  {
    key: 'activity', title: 'Hoe actief is je dier?',
    render: d => optionButtons('activity', wizardOptions('activity', [
      { label: 'Rustig (korte wandelingen, veel slapen)', value: 'laag' },
      { label: 'Normaal (dagelijkse beweging)', value: 'normaal' },
      { label: 'Zeer actief (sport, werk, lange wandelingen)', value: 'hoog' }
    ]), d.activity),
    collect: d => { d.activity = pressedValue('activity'); return d.activity ? null : 'Kies een activiteitsniveau.'; }
  },
  {
    key: 'allergies', title: 'Bekende allergieën of gevoeligheden?',
    render: d => {
      const opts = wizardOptions('allergy', [
        { label: 'Kip', value: 'kip' }, { label: 'Rund', value: 'rund' }, { label: 'Graan / gluten', value: 'graan' },
        { label: 'Zuivel', value: 'zuivel' }, { label: 'Vis', value: 'vis' }, { label: 'Ei', value: 'ei' }
      ]);
      const sel = new Set(d.allergies || []);
      return `<p class="mb-3 text-sm text-ink-soft">Selecteer alles wat van toepassing is (of niets).</p>
        <div class="grid gap-2 sm:grid-cols-2">` +
        opts.map(o => `<button type="button" class="option-card" data-multi="allergies" data-value="${esc(o.value)}" aria-pressed="${sel.has(o.value)}">${esc(o.label)}</button>`).join('') +
        `</div>`;
    },
    collect: d => {
      d.allergies = $$('[data-multi="allergies"][aria-pressed="true"]').map(b => b.dataset.value);
      return null;
    }
  }
];

function optionButtons(group, options, selected) {
  return `<div class="grid gap-2">` + options.map(o =>
    `<button type="button" class="option-card" data-single="${group}" data-value="${esc(o.value)}" aria-pressed="${o.value === selected}">${esc(o.label)}</button>`
  ).join('') + `</div>`;
}
function pressedValue(group) {
  return $(`[data-single="${group}"][aria-pressed="true"]`)?.dataset.value || '';
}

function renderWizardStep() {
  const wrap = $('#wizard-steps');
  if (!wrap) return;
  const step = WIZARD_STEPS[state.wizardStep];
  wrap.innerHTML = `<div class="wizard-step">
    <p class="font-mono text-xs text-ink-faint">STAP ${state.wizardStep + 1} / ${WIZARD_STEPS.length}</p>
    <h2 class="mb-5 mt-1 font-display text-xl font-semibold">${step.title}</h2>
    ${step.render(state.wizardData)}
    <p id="wizard-error" class="mt-3 hidden text-sm font-medium text-red-600" role="alert"></p>
  </div>`;

  $('#wizard-progress').innerHTML = WIZARD_STEPS.map((_, i) =>
    `<span class="wizard-dot ${i <= state.wizardStep ? 'done' : ''}"></span>`).join('');
  $('#wizard-back').classList.toggle('invisible', state.wizardStep === 0);
  $('#wizard-next').textContent = state.wizardStep === WIZARD_STEPS.length - 1 ? 'Toon aanbevelingen ✓' : 'Volgende →';

  const firstInput = wrap.querySelector('input');
  if (firstInput) firstInput.focus();
}

function bindWizardEvents() {
  $('#wizard-steps').addEventListener('click', e => {
    const single = e.target.closest('[data-single]');
    if (single) {
      $$(`[data-single="${single.dataset.single}"]`).forEach(b => b.setAttribute('aria-pressed', b === single));
      return;
    }
    const multi = e.target.closest('[data-multi]');
    if (multi) multi.setAttribute('aria-pressed', String(multi.getAttribute('aria-pressed') !== 'true'));
  });

  $('#wizard-form').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); $('#wizard-next').click(); }
  });

  $('#wizard-next').addEventListener('click', () => {
    const err = WIZARD_STEPS[state.wizardStep].collect(state.wizardData);
    const errEl = $('#wizard-error');
    if (err) { errEl.textContent = err; errEl.classList.remove('hidden'); return; }
    if (state.wizardStep < WIZARD_STEPS.length - 1) {
      state.wizardStep++;
      renderWizardStep();
    } else {
      finishWizard();
    }
  });

  $('#wizard-back').addEventListener('click', () => {
    if (state.wizardStep > 0) { state.wizardStep--; renderWizardStep(); }
  });
}

function lifeStageFor(profile) {
  const age = profile.age;
  if (profile.species === 'hond') {
    if (age < 1) return 'puppy';
    if (age >= 8) return 'senior';
    return 'adult';
  }
  if (age < 1) return 'kitten';
  if (age >= 10) return 'senior';
  return 'adult';
}

function finishWizard() {
  const p = { ...state.wizardData, savedAt: Date.now() };
  try { localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(p)); } catch { /* private mode */ }
  renderWizardSaved();
  renderRecommendations(p);
  $('#wizard-results').scrollIntoView({ behavior: 'smooth' });
}

function renderWizardSaved() {
  const el = $('#wizard-saved');
  const p = getSavedProfile();
  if (!el) return;
  if (!p) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  el.className = 'mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/20 bg-brand-soft px-4 py-3 text-sm';
  el.innerHTML = `
    <p>✓ Profiel opgeslagen (alleen in deze browser): <strong>${esc(p.name)}</strong> · ${esc(p.species)} · ${p.age} jr · ${p.weight} kg · ${esc(p.activity)}${p.allergies?.length ? ' · allergie: ' + p.allergies.map(esc).join(', ') : ''}</p>
    <span class="flex gap-3">
      <button id="wizard-show-results" class="font-semibold text-brand hover:underline">Toon aanbevelingen</button>
      <button id="wizard-delete" class="font-semibold text-red-600 hover:underline">Verwijderen</button>
    </span>`;
  $('#wizard-show-results').addEventListener('click', () => { renderRecommendations(p); $('#wizard-results').scrollIntoView({ behavior: 'smooth' }); });
  $('#wizard-delete').addEventListener('click', () => {
    localStorage.removeItem(LS_PROFILE_KEY);
    state.wizardData = {}; state.wizardStep = 0;
    renderWizardSaved(); renderWizardStep();
    $('#wizard-results').classList.add('hidden');
  });
}

// Match-score: soortmatch verplicht · levensfase +2 · geen allergenen (uitsluiten) ·
// graanvrij bij graanallergie · sheet-score telt zwaarst mee.
function recommendProducts(profile) {
  const stage = lifeStageFor(profile);
  const allergens = (profile.allergies || []).map(a => a.toLowerCase());
  const speciesRe = profile.species === 'kat' ? /kat|cat/i : /hond|dog/i;

  return state.products
    .filter(p => speciesRe.test(p.animal || ''))
    .filter(p => {
      const hay = ((p.ingredients || '') + ' ' + (p.name || '')).toLowerCase();
      return !allergens.some(a => a !== 'graan' && hay.includes(a));
    })
    .filter(p => !allergens.includes('graan') || p._grainFree)
    .map(p => {
      let match = Number.isFinite(scoreOf(p)) ? scoreOf(p) : 5;
      const ps = (p.life_stage || '').toLowerCase();
      if (ps.includes(stage)) match += 2;
      else if (!ps || /alle|all/i.test(ps)) match += 0.5;
      else match -= 1.5;
      if (profile.activity === 'hoog' && p._protein >= 28) match += 0.5;
      return { p, match };
    })
    .sort((a, b) => b.match - a.match)
    .slice(0, 8)
    .map(x => x.p);
}

function renderRecommendations(profile) {
  const recs = recommendProducts(profile);
  $('#wizard-results').classList.remove('hidden');
  $('#wizard-pet-name').textContent = profile.name;
  $('#wizard-results-sub').textContent = recs.length
    ? `Levensfase: ${lifeStageFor(profile)} · gesorteerd op matchscore. Dagkosten zijn berekend op ${profile.weight} kg en activiteit "${profile.activity}".`
    : '';
  $('#wizard-results-grid').innerHTML = recs.length
    ? recs.map(productCard).join('')
    : `<div class="col-span-full rounded-2xl border border-dashed border-cream-line bg-white p-10 text-center">
         <p class="font-display text-lg font-semibold">Geen passend voer gevonden</p>
         <p class="mt-1 text-sm text-ink-soft">Waarschijnlijk sluiten de allergie-filters alles uit. Probeer het profiel aan te passen of bekijk de volledige <a href="#finder" class="font-semibold text-brand underline">Food Finder</a>.</p>
       </div>`;
}

/* ─────────────── 12 · BLOG ─────────────── */

function blogCard(b) {
  const img = b.image ? esc(b.image) : placeholderImg(b.title);
  return `
    <a href="#article/${esc(b._slug)}" class="blog-card">
      <div class="card-img-wrap !aspect-[16/9]"><img class="card-img !p-0 !object-cover" src="${img}" alt="" loading="lazy" onerror="this.src='${placeholderImg(b.title)}'"></div>
      <div class="flex flex-1 flex-col p-5">
        ${b.tags ? `<p class="font-mono text-[.65rem] font-semibold uppercase tracking-widest text-brand">${esc(b.tags)}</p>` : ''}
        <h3 class="mt-1.5 font-display text-lg font-semibold leading-snug">${esc(b.title)}</h3>
        ${b.excerpt ? `<p class="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">${esc(b.excerpt)}</p>` : ''}
        <p class="mt-auto pt-4 text-xs text-ink-faint">${esc(b.author || 'Scanabowl')}${b.date ? ' · ' + esc(b.date) : ''}</p>
      </div>
    </a>`;
}

function renderBlogGrid() {
  const grid = $('#blog-grid');
  if (!grid) return;
  if (!state.loaded && !state.loadError) { grid.innerHTML = '<div class="skeleton !min-h-[280px]"></div>'.repeat(6); return; }
  grid.innerHTML = state.blogs.map(blogCard).join('') ||
    '<p class="col-span-full text-sm text-ink-soft">Nog geen artikelen gepubliceerd. Voeg rijen toe aan de Blogs-sheet.</p>';
}

// Mini-markdown: eerst escapen, dan ## koppen, **vet**, *cursief*, - lijsten, alinea's.
function renderMarkdownish(src) {
  const lines = esc(src).split(/\r?\n/);
  const out = [];
  let list = false, para = [];
  const flushPara = () => { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } };
  const closeList = () => { if (list) { out.push('</ul>'); list = false; } };
  const inline = s => s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushPara(); closeList(); continue; }
    if (line.startsWith('### ')) { flushPara(); closeList(); out.push('<h3>' + inline(line.slice(4)) + '</h3>'); }
    else if (line.startsWith('## ')) { flushPara(); closeList(); out.push('<h2>' + inline(line.slice(3)) + '</h2>'); }
    else if (/^[-•]\s+/.test(line)) { flushPara(); if (!list) { out.push('<ul>'); list = true; } out.push('<li>' + inline(line.replace(/^[-•]\s+/, '')) + '</li>'); }
    else para.push(line);
  }
  flushPara(); closeList();
  return out.join('\n');
}

function renderArticle(slug) {
  const el = $('#article-content');
  if (!el) return;
  if (!state.loaded) { el.innerHTML = '<div class="skeleton !min-h-[400px]"></div>'; return; }
  const b = state.blogs.find(x => x._slug === slug);
  if (!b) {
    el.innerHTML = '<p class="text-ink-soft">Dit artikel bestaat niet (meer). <a href="#blog" class="font-semibold text-brand underline">Terug naar het overzicht</a>.</p>';
    return;
  }
  document.title = `${b.title} — Scanabowl`;
  el.innerHTML = `
    ${b.tags ? `<p class="font-mono text-xs font-semibold uppercase tracking-widest text-brand">${esc(b.tags)}</p>` : ''}
    <h1 class="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">${esc(b.title)}</h1>
    <p class="mt-3 text-sm text-ink-faint">${esc(b.author || 'Scanabowl')}${b.date ? ' · ' + esc(b.date) : ''}</p>
    ${b.image ? `<img src="${esc(b.image)}" alt="" class="mt-6 w-full rounded-2xl object-cover" onerror="this.remove()">` : ''}
    <div class="article-body mt-8">${renderMarkdownish(b.content || b.excerpt || '')}</div>
    <div class="mt-10 rounded-2xl border border-brand/20 bg-brand-soft p-5 text-sm">
      🐾 <strong>Verder lezen?</strong> Vergelijk alle voeders in de <a href="#finder" class="font-semibold text-brand underline">Food Finder</a> of maak een <a href="#wizard" class="font-semibold text-brand underline">profiel voor je huisdier</a>.
    </div>`;
}

/* ─────────────── 13 · JURIDISCHE PAGINA'S ─────────────── */

const LEGAL = {
  privacy: {
    title: 'Privacybeleid',
    body: `
## Welke gegevens verwerken wij?
Scanabowl is een statische website zonder accounts, cookies voor tracking of eigen serveropslag.

- **Huisdierprofiel:** de gegevens die je invult in de Profiel-wizard (naam, soort, leeftijd, gewicht, activiteit, allergieën) worden uitsluitend opgeslagen in de localStorage van jouw eigen browser. Ze verlaten je apparaat niet en zijn voor ons niet zichtbaar. Je kunt ze op elk moment verwijderen via de wizard-pagina.
- **Hosting:** deze site wordt gehost via GitHub Pages. GitHub kan technische loggegevens (zoals IP-adressen) verwerken voor beveiliging en beschikbaarheid. Zie het privacybeleid van GitHub voor details.
- **Externe bronnen:** productdata wordt geladen vanaf Google Sheets; lettertypen vanaf Google Fonts. Hierbij wordt jouw IP-adres technisch gezien door die diensten verwerkt.
- **Affiliate-links:** klik je door naar bol.com, dan plaatst bol.com mogelijk cookies om de verkoop aan ons partnerprogramma toe te schrijven. Dit gebeurt op de site van bol.com, onder hun voorwaarden.

## Jouw rechten
Omdat wij zelf geen persoonsgegevens van je opslaan, is er bij ons niets in te zien of te verwijderen. Vragen? Mail naar info@scanabowl.com.

## Verantwoordelijke
Scanabowl · KvK: [KvK-nummer invullen] · BTW: [BTW-id invullen] · info@scanabowl.com

*Laatst bijgewerkt: [datum invullen]*`
  },
  voorwaarden: {
    title: 'Algemene voorwaarden',
    body: `
## 1. Toepasselijkheid
Deze voorwaarden gelden voor elk gebruik van scanabowl.com.

## 2. Aard van de informatie
Scanabowl biedt algemene, informatieve vergelijkingen van diervoeding op basis van openbare etiketgegevens. De inhoud is **geen veterinair advies**. Raadpleeg bij gezondheidsvragen altijd een dierenarts.

## 3. Juistheid van gegevens
Wij streven naar actuele en correcte gegevens, maar samenstellingen, prijzen en beschikbaarheid kunnen door fabrikanten en winkels worden gewijzigd. De informatie op de verpakking en bij de verkoper (bol.com) is altijd leidend. Aan berekende waarden zoals koolhydraatpercentages en dagkosten kunnen geen rechten worden ontleend.

## 4. Affiliate-relatie
Scanabowl neemt deel aan het Bol.com Partnerprogramma en kan commissie ontvangen over aankopen via links op deze site. Wij zijn geen partij bij de koopovereenkomst tussen jou en bol.com.

## 5. Aansprakelijkheid
Scanabowl is niet aansprakelijk voor schade die voortvloeit uit het gebruik van de informatie op deze site, behoudens opzet of grove nalatigheid.

## 6. Intellectueel eigendom
De teksten, scores en vormgeving van Scanabowl mogen niet zonder toestemming worden overgenomen.

## 7. Contact
Scanabowl · KvK: [KvK-nummer invullen] · info@scanabowl.com

*Laatst bijgewerkt: [datum invullen]*`
  },
  disclaimer: {
    title: 'Affiliate-disclaimer',
    body: `
## Transparantie over ons verdienmodel
Scanabowl is gratis te gebruiken. Om de site te kunnen onderhouden nemen wij deel aan het **Bol.com Partnerprogramma**.

- Links naar bol.com op deze website zijn affiliate-links.
- Koop je een product via zo'n link, dan ontvangen wij mogelijk een kleine commissie van bol.com.
- **Jij betaalt hierdoor nooit meer** — de prijs is identiek aan de prijs zonder onze link.

## Onafhankelijkheid
Onze scores en rangschikkingen worden uitsluitend bepaald door de samenstelling op het etiket (ingrediënten en analytische bestanddelen) en de prijs per dag. Merken kunnen geen positie of score kopen. Commissiepercentages spelen geen enkele rol in onze beoordeling.

## Prijzen
Prijzen op Scanabowl worden periodiek bijgewerkt maar kunnen afwijken. De actuele prijs op bol.com is altijd leidend.

Vragen over deze disclaimer? Mail naar info@scanabowl.com.`
  }
};

function renderLegal(key) {
  const page = LEGAL[key] || LEGAL.privacy;
  document.title = `${page.title} — Scanabowl`;
  $('#legal-content').innerHTML = `
    <p class="font-mono text-xs font-medium tracking-widest text-brand">JURIDISCH</p>
    <h1 class="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">${esc(page.title)}</h1>
    <div class="article-body mt-6">${renderMarkdownish(page.body)}</div>`;
}

/* ─────────────── 14 · INIT ─────────────── */

function renderAll() {
  renderHome();
  route();
}

document.addEventListener('DOMContentLoaded', () => {
  $('#footer-year').textContent = new Date().getFullYear();

  $('#mobile-menu-btn').addEventListener('click', () => {
    const menu = $('#mobile-menu');
    const open = menu.classList.toggle('hidden');
    $('#mobile-menu-btn').setAttribute('aria-expanded', String(!open));
  });

  bindFinderEvents();
  bindModalEvents();
  bindWizardEvents();
  window.addEventListener('hashchange', route);

  renderHome();          // skeletons tonen
  route();               // juiste pagina activeren
  loadAllData();         // CSV's parallel laden → renderAll()
});
