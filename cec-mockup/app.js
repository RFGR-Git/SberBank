/* Data model (mockup) */

const presidentialRegions = [
  {
    id: "northern_frontier",
    name: "Northern Frontier",
    color: getComputedStyle(document.documentElement).getPropertyValue('--nf').trim(),
    subjects: [
      "Karelia", "Komi", "Arkhangelsk Oblast", "Murmansk Oblast", "Vologda Oblast",
      "Leningrad Oblast", "Novgorod Oblast", "Pskov Oblast", "Nenets Autonomous Okrug", "Saint Petersburg"
    ],
    candidates: [
      { id: "ivan", name: "Ivan Petrov", party: "UP", partyName: "Unity Party", partyColor: "#7aa6ff", campaignPoints: 520, votes: 410000 },
      { id: "olga", name: "Olga Sokolova", party: "DP", partyName: "Democratic Progress", partyColor: "#ff7ab2", campaignPoints: 480, votes: 455000 },
      { id: "sergei", name: "Sergei Kuznetsov", party: "NRP", partyName: "New Reform Party", partyColor: "#7bde8f", campaignPoints: 300, votes: 210000 },
    ],
  },
  {
    id: "volga_valley",
    name: "Volga Valley",
    color: getComputedStyle(document.documentElement).getPropertyValue('--volga').trim(),
    subjects: [
      "Tatarstan", "Chuvashia", "Mari El", "Mordovia", "Udmurtia", "Bashkortostan",
      "Nizhny Novgorod Oblast", "Samara Oblast", "Saratov Oblast", "Volgograd Oblast",
      "Penza Oblast", "Ulyanovsk Oblast", "Kirov Oblast", "Orenburg Oblast", "Perm Krai"
    ],
    candidates: [
      { id: "ivan", name: "Ivan Petrov", party: "UP", partyName: "Unity Party", partyColor: "#7aa6ff", campaignPoints: 640, votes: 720000 },
      { id: "olga", name: "Olga Sokolova", party: "DP", partyName: "Democratic Progress", partyColor: "#ff7ab2", campaignPoints: 590, votes: 680000 },
      { id: "sergei", name: "Sergei Kuznetsov", party: "NRP", partyName: "New Reform Party", partyColor: "#7bde8f", campaignPoints: 420, votes: 360000 },
    ],
  },
  {
    id: "caucasia",
    name: "Caucasia",
    color: getComputedStyle(document.documentElement).getPropertyValue('--caucasia').trim(),
    subjects: [
      "Dagestan", "Chechnya", "Ingushetia", "North Ossetia–Alania", "Kabardino-Balkaria", "Karachay-Cherkessia", "Adygea",
      "Krasnodar Krai", "Stavropol Krai"
    ],
    candidates: [
      { id: "ivan", name: "Ivan Petrov", party: "UP", partyName: "Unity Party", partyColor: "#7aa6ff", campaignPoints: 300, votes: 380000 },
      { id: "olga", name: "Olga Sokolova", party: "DP", partyName: "Democratic Progress", partyColor: "#ff7ab2", campaignPoints: 520, votes: 440000 },
      { id: "sergei", name: "Sergei Kuznetsov", party: "NRP", partyName: "New Reform Party", partyColor: "#7bde8f", campaignPoints: 200, votes: 160000 },
    ],
  },
  {
    id: "central_steppes",
    name: "Central Steppes",
    color: getComputedStyle(document.documentElement).getPropertyValue('--steppes').trim(),
    subjects: [
      "Chelyabinsk Oblast", "Kurgan Oblast", "Tyumen Oblast", "Omsk Oblast", "Novosibirsk Oblast",
      "Tomsk Oblast", "Kemerovo Oblast", "Altai Krai", "Altai Republic", "Khakassia", "Tuva",
      "Khanty-Mansi Autonomous Okrug", "Yamalo-Nenets Autonomous Okrug"
    ],
    candidates: [
      { id: "ivan", name: "Ivan Petrov", party: "UP", partyName: "Unity Party", partyColor: "#7aa6ff", campaignPoints: 510, votes: 610000 },
      { id: "olga", name: "Olga Sokolova", party: "DP", partyName: "Democratic Progress", partyColor: "#ff7ab2", campaignPoints: 530, votes: 600000 },
      { id: "sergei", name: "Sergei Kuznetsov", party: "NRP", partyName: "New Reform Party", partyColor: "#7bde8f", campaignPoints: 450, votes: 500000 },
    ],
  },
  {
    id: "outer_mongolia",
    name: "Outer Mongolia",
    color: getComputedStyle(document.documentElement).getPropertyValue('--mongolia').trim(),
    subjects: ["Buryatia", "Tuva", "Zabaykalsky Krai", "Irkutsk Oblast (south)",],
    candidates: [
      { id: "ivan", name: "Ivan Petrov", party: "UP", partyName: "Unity Party", partyColor: "#7aa6ff", campaignPoints: 210, votes: 240000 },
      { id: "olga", name: "Olga Sokolova", party: "DP", partyName: "Democratic Progress", partyColor: "#ff7ab2", campaignPoints: 260, votes: 260000 },
      { id: "sergei", name: "Sergei Kuznetsov", party: "NRP", partyName: "New Reform Party", partyColor: "#7bde8f", campaignPoints: 300, votes: 220000 },
    ],
  },
  {
    id: "siberian_frontier",
    name: "Siberian Frontier",
    color: getComputedStyle(document.documentElement).getPropertyValue('--siberia').trim(),
    subjects: [
      "Sakha (Yakutia)", "Krasnoyarsk Krai", "Khabarovsk Krai", "Primorsky Krai", "Kamchatka Krai",
      "Irkutsk Oblast (north)", "Amur Oblast", "Magadan Oblast", "Sakhalin Oblast", "Chukotka Autonomous Okrug"
    ],
    candidates: [
      { id: "ivan", name: "Ivan Petrov", party: "UP", partyName: "Unity Party", partyColor: "#7aa6ff", campaignPoints: 360, votes: 390000 },
      { id: "olga", name: "Olga Sokolova", party: "DP", partyName: "Democratic Progress", partyColor: "#ff7ab2", campaignPoints: 420, votes: 450000 },
      { id: "sergei", name: "Sergei Kuznetsov", party: "NRP", partyName: "New Reform Party", partyColor: "#7bde8f", campaignPoints: 280, votes: 260000 },
    ],
  },
];

const dumaSeats = [
  { name: "Northern 1", color: "#d73a3a", areas: ["Murmansk Oblast", "Arkhangelsk Oblast (+ Nenets)", "Komi"], candidates: [
    { id: "ivan", name: "Ivan Petrov", party: "UP", partyName: "Unity Party", partyColor: "#7aa6ff", campaignPoints: 240, votes: 120000 },
    { id: "olga", name: "Olga Sokolova", party: "DP", partyName: "Democratic Progress", partyColor: "#ff7ab2", campaignPoints: 280, votes: 140000 },
  ]},
  { name: "Volga 1", color: "#3a86ff", areas: ["Pskov", "Novgorod", "Leningrad", "Vologda", "Kaliningrad"], candidates: [
    { id: "ivan", name: "Ivan Petrov", party: "UP", partyName: "Unity Party", partyColor: "#7aa6ff", campaignPoints: 300, votes: 210000 },
    { id: "olga", name: "Olga Sokolova", party: "DP", partyName: "Democratic Progress", partyColor: "#ff7ab2", campaignPoints: 260, votes: 190000 },
  ]},
  { name: "Volga 2", color: "#2ecc71", areas: ["Tver", "Smolensk", "Bryansk", "Kursk", "Oryol", "Belgorod"], candidates: [
    { id: "ivan", name: "Ivan Petrov", party: "UP", partyName: "Unity Party", partyColor: "#7aa6ff", campaignPoints: 200, votes: 190000 },
    { id: "olga", name: "Olga Sokolova", party: "DP", partyName: "Democratic Progress", partyColor: "#ff7ab2", campaignPoints: 220, votes: 200000 },
  ]},
  { name: "Volga 3", color: "#137a3a", areas: ["Nizhny Novgorod", "Penza", "Mordovia", "Chuvashia", "Mari El", "Ulyanovsk"], candidates: [
    { id: "ivan", name: "Ivan Petrov", party: "UP", partyName: "Unity Party", partyColor: "#7aa6ff", campaignPoints: 260, votes: 260000 },
    { id: "olga", name: "Olga Sokolova", party: "DP", partyName: "Democratic Progress", partyColor: "#ff7ab2", campaignPoints: 240, votes: 230000 },
  ]},
  { name: "Caucasia 1", color: "#ffd43b", areas: ["Krasnodar", "Adygea", "Stavropol"], candidates: [
    { id: "ivan", name: "Ivan Petrov", party: "UP", partyName: "Unity Party", partyColor: "#7aa6ff", campaignPoints: 180, votes: 160000 },
    { id: "olga", name: "Olga Sokolova", party: "DP", partyName: "Democratic Progress", partyColor: "#ff7ab2", campaignPoints: 220, votes: 190000 },
  ]},
  { name: "Caucasia 2", color: "#ff75c0", areas: ["Dagestan", "Chechnya", "Ingushetia", "North Ossetia–Alania", "Kabardino-Balkaria", "Karachay-Cherkessia"], candidates: [
    { id: "ivan", name: "Ivan Petrov", party: "UP", partyName: "Unity Party", partyColor: "#7aa6ff", campaignPoints: 120, votes: 140000 },
    { id: "olga", name: "Olga Sokolova", party: "DP", partyName: "Democratic Progress", partyColor: "#ff7ab2", campaignPoints: 200, votes: 220000 },
  ]},
  { name: "Caucasia 3", color: "#c7a0ff", areas: ["Rostov", "Volgograd", "Astrakhan", "Kalmykia"], candidates: [
    { id: "ivan", name: "Ivan Petrov", party: "UP", partyName: "Unity Party", partyColor: "#7aa6ff", campaignPoints: 240, votes: 210000 },
    { id: "olga", name: "Olga Sokolova", party: "DP", partyName: "Democratic Progress", partyColor: "#ff7ab2", campaignPoints: 240, votes: 220000 },
  ]},
  { name: "Central 1", color: "#8a4fff", areas: ["Moscow City", "Moscow Oblast", "Vladimir", "Ryazan", "Tula"], candidates: [
    { id: "ivan", name: "Ivan Petrov", party: "UP", partyName: "Unity Party", partyColor: "#7aa6ff", campaignPoints: 420, votes: 620000 },
    { id: "olga", name: "Olga Sokolova", party: "DP", partyName: "Democratic Progress", partyColor: "#ff7ab2", campaignPoints: 400, votes: 590000 },
  ]},
  { name: "Central 2", color: "#23c1ae", areas: ["Yaroslavl", "Kostroma", "Ivanovo", "Kaluga"], candidates: [
    { id: "ivan", name: "Ivan Petrov", party: "UP", partyName: "Unity Party", partyColor: "#7aa6ff", campaignPoints: 200, votes: 210000 },
    { id: "olga", name: "Olga Sokolova", party: "DP", partyName: "Democratic Progress", partyColor: "#ff7ab2", campaignPoints: 210, votes: 220000 },
  ]},
  { name: "Mongolia 1", color: "#ff8c42", areas: ["Krasnoyarsk (minus north)", "Irkutsk"], candidates: [
    { id: "ivan", name: "Ivan Petrov", party: "UP", partyName: "Unity Party", partyColor: "#7aa6ff", campaignPoints: 210, votes: 240000 },
    { id: "olga", name: "Olga Sokolova", party: "DP", partyName: "Democratic Progress", partyColor: "#ff7ab2", campaignPoints: 220, votes: 230000 },
  ]},
  { name: "Mongolia 2", color: "#8bdc65", areas: ["Buryatia", "Zabaykalsky"], candidates: [
    { id: "ivan", name: "Ivan Petrov", party: "UP", partyName: "Unity Party", partyColor: "#7aa6ff", campaignPoints: 150, votes: 180000 },
    { id: "olga", name: "Olga Sokolova", party: "DP", partyName: "Democratic Progress", partyColor: "#ff7ab2", campaignPoints: 160, votes: 170000 },
  ]},
  { name: "Siberian 1", color: "#9ad0ff", areas: ["Magadan", "Chukotka"], candidates: [
    { id: "ivan", name: "Ivan Petrov", party: "UP", partyName: "Unity Party", partyColor: "#7aa6ff", campaignPoints: 80, votes: 70000 },
    { id: "olga", name: "Olga Sokolova", party: "DP", partyName: "Democratic Progress", partyColor: "#ff7ab2", campaignPoints: 100, votes: 80000 },
  ]},
  { name: "Siberian 2", color: "#137b7b", areas: ["Yamalo-Nenets", "Khanty-Mansi", "Tyumen"], candidates: [
    { id: "ivan", name: "Ivan Petrov", party: "UP", partyName: "Unity Party", partyColor: "#7aa6ff", campaignPoints: 260, votes: 280000 },
    { id: "olga", name: "Olga Sokolova", party: "DP", partyName: "Democratic Progress", partyColor: "#ff7ab2", campaignPoints: 230, votes: 240000 },
  ]},
  { name: "Siberian 3", color: "#2ecc71", areas: ["Sakha (Yakutia)"], candidates: [
    { id: "ivan", name: "Ivan Petrov", party: "UP", partyName: "Unity Party", partyColor: "#7aa6ff", campaignPoints: 160, votes: 140000 },
    { id: "olga", name: "Olga Sokolova", party: "DP", partyName: "Democratic Progress", partyColor: "#ff7ab2", campaignPoints: 180, votes: 190000 },
  ]},
  { name: "Siberian 4", color: "#d9c6a5", areas: ["Kamchatka", "Sakhalin"], candidates: [
    { id: "ivan", name: "Ivan Petrov", party: "UP", partyName: "Unity Party", partyColor: "#7aa6ff", campaignPoints: 110, votes: 100000 },
    { id: "olga", name: "Olga Sokolova", party: "DP", partyName: "Democratic Progress", partyColor: "#ff7ab2", campaignPoints: 130, votes: 120000 },
  ]},
];

/* Utilities */
function computeRegionStats(candidates) {
  const totalPoints = candidates.reduce((sum, c) => sum + (c.campaignPoints || 0), 0);
  const totalVotes = candidates.reduce((sum, c) => sum + (c.votes || 0), 0);
  return candidates.map(c => {
    const campaignPct = totalPoints > 0 ? (c.campaignPoints / totalPoints) * 100 : 0;
    const votePct = totalVotes > 0 ? (c.votes / totalVotes) * 100 : 0;
    const finalScore = (campaignPct * 0.40) + (votePct * 0.60);
    return { ...c, campaignPct, votePct, finalScore };
  }).sort((a,b) => b.finalScore - a.finalScore);
}

function formatPct(num) {
  return `${num.toFixed(1)}%`;
}

function makePartyBadge(party, color) {
  const div = document.createElement('div');
  div.className = 'party-badge';
  div.style.background = color || '#ccc';
  div.textContent = party.toUpperCase().slice(0,3);
  return div;
}

function makeBar(finalPct, colorA, colorB) {
  const bar = document.createElement('div');
  bar.className = 'bar';
  const span = document.createElement('span');
  span.style.width = `${Math.max(1, finalPct)}%`;
  span.style.background = `linear-gradient(90deg, ${colorA || '#2d7ef7'}, ${colorB || '#7aa6ff'})`;
  bar.appendChild(span);
  return bar;
}

/* Navigation */
const navButtons = Array.from(document.querySelectorAll('.nav-item'));
const views = Array.from(document.querySelectorAll('.view'));
const viewTitle = document.getElementById('view-title');

navButtons.forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
Array.from(document.querySelectorAll('[data-view-jump]')).forEach(btn =>
  btn.addEventListener('click', () => switchView(btn.dataset.viewJump))
);

function switchView(viewId) {
  navButtons.forEach(b => b.classList.toggle('active', b.dataset.view === viewId));
  views.forEach(v => v.classList.toggle('visible', v.id === `view-${viewId}`));
  viewTitle.textContent = navButtons.find(b => b.dataset.view === viewId)?.textContent || 'CEC';
}

/* Tabs */
const tabs = Array.from(document.querySelectorAll('.tab'));
const tabPanels = Array.from(document.querySelectorAll('[data-tab-panel]'));

tabs.forEach(tab => tab.addEventListener('click', () => {
  const target = tab.dataset.tab;
  tabs.forEach(t => t.classList.toggle('active', t === tab));
  tabPanels.forEach(p => p.classList.toggle('visible', p.dataset.tabPanel === target));
}));

/* Presidential Map Rendering */
const mapLegend = document.getElementById('map-legend');
const tooltip = document.getElementById('tooltip');
const svg = document.getElementById('pres-map');

function renderMapLegend() {
  mapLegend.innerHTML = '<h4>Regions</h4>';
  const list = document.createElement('div');
  list.className = 'legend';
  presidentialRegions.forEach(r => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    const sw = document.createElement('span');
    sw.className = 'legend-swatch';
    sw.style.background = r.color;
    const txt = document.createElement('span');
    txt.textContent = r.name;
    item.appendChild(sw); item.appendChild(txt);
    list.appendChild(item);
  });
  mapLegend.appendChild(list);
}

function positionTooltip(evt) {
  const bounds = svg.getBoundingClientRect();
  const x = evt.clientX - bounds.left + 12;
  const y = evt.clientY - bounds.top + 12;
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

function showRegionTooltip(region, evt) {
  const stats = computeRegionStats(region.candidates);
  const leader = stats[0];
  tooltip.innerHTML = `
    <h4>${region.name}</h4>
    ${stats.map(c => `
      <div class="candidate-row">
        <div class="party-badge" style="background:${c.partyColor}">${c.party}</div>
        <div>
          <div class="candidate-name">${c.name} ${c.id===leader.id?'<span class="winner-mark">✓</span>':''}</div>
          <div class="muted">${c.partyName} · Final ${formatPct(c.finalScore)} (CP ${formatPct(c.campaignPct)} · PV ${formatPct(c.votePct)})</div>
          <div class="bar"><span style="width:${c.finalScore.toFixed(1)}%; background:${c.partyColor}"></span></div>
        </div>
        <div>${formatPct(c.finalScore)}</div>
      </div>
    `).join('')}
  `;
  tooltip.classList.add('visible');
  tooltip.setAttribute('aria-hidden', 'false');
  if (evt) positionTooltip(evt);
}

function hideTooltip() {
  tooltip.classList.remove('visible');
  tooltip.setAttribute('aria-hidden', 'true');
}

function wireMapInteractions() {
  const regionGroups = svg.querySelectorAll('g.region');
  regionGroups.forEach(g => {
    const id = g.getAttribute('data-region-id');
    const region = presidentialRegions.find(r => r.id === id);
    g.addEventListener('mousemove', (evt) => { showRegionTooltip(region, evt); });
    g.addEventListener('mouseleave', hideTooltip);
    g.addEventListener('click', () => openRegionInTable(region.id));
  });
}

function openRegionInTable(regionId) {
  switchView('presidential');
  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === 'table'));
  tabPanels.forEach(p => p.classList.toggle('visible', p.dataset.tabPanel === 'table'));
  // Scroll to region rows
  const rows = Array.from(document.querySelectorAll('#pres-table tbody tr'));
  const target = rows.find(r => r.dataset.regionId === regionId);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* Presidential Table */
const presTableBody = document.querySelector('#pres-table tbody');
function renderPresTable() {
  const rows = [];
  presidentialRegions.forEach(region => {
    const stats = computeRegionStats(region.candidates);
    stats.forEach((c, idx) => {
      const tr = document.createElement('tr');
      tr.dataset.regionId = region.id;
      if (idx === 0) tr.style.background = 'rgba(23,201,100,0.06)';
      tr.innerHTML = `
        <td>${idx===0?`<strong>${region.name}</strong>`:''}</td>
        <td>${c.name} ${idx===0?'<span class="winner-mark">✓</span>':''}</td>
        <td><span class="party-badge" style="background:${c.partyColor}">${c.party}</span> ${c.partyName}</td>
        <td>${c.campaignPoints.toLocaleString()} (${formatPct(c.campaignPct)})</td>
        <td>${c.votes.toLocaleString()} (${formatPct(c.votePct)})</td>
        <td>${formatPct(c.finalScore)}</td>
        <td>${idx===0?'<strong>Leader</strong>':'—'}</td>
      `;
      rows.push(tr);
    });
  });
  presTableBody.replaceChildren(...rows);
}

/* Duma Grid */
const dumaGrid = document.getElementById('duma-grid');
function renderDumaGrid(filter = '') {
  const q = filter.trim().toLowerCase();
  const cards = [];
  dumaSeats.filter(s => !q || s.name.toLowerCase().includes(q) || s.areas.some(a => a.toLowerCase().includes(q)))
    .forEach(seat => {
      const stats = computeRegionStats(seat.candidates);
      const leader = stats[0];
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h4>${seat.name} ${leader?'<span class="winner-mark">✓</span>':''}</h4>
        <small>${seat.areas.join(', ')}</small>
        <div class="hover-panel">
          ${stats.map(c => `
            <div class="candidate-row">
              <div class="party-badge" style="background:${c.partyColor}">${c.party}</div>
              <div>
                <div class="candidate-name">${c.name} ${c.id===leader.id?'<span class="winner-mark">✓</span>':''}</div>
                <div class="muted">${c.partyName} · Final ${formatPct(c.finalScore)} (CP ${formatPct(c.campaignPct)} · PV ${formatPct(c.votePct)})</div>
                <div class="bar"><span style="width:${c.finalScore.toFixed(1)}%; background:${c.partyColor}"></span></div>
              </div>
              <div>${formatPct(c.finalScore)}</div>
            </div>
          `).join('')}
        </div>
      `;
      cards.push(card);
    });
  dumaGrid.replaceChildren(...cards);
}

document.getElementById('seat-search').addEventListener('input', (e) => {
  renderDumaGrid(e.target.value);
});

/* Home minis */
function renderHomeMinis() {
  const legend = document.getElementById('legend-pres');
  legend.innerHTML = '';
  presidentialRegions.forEach(r => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    const sw = document.createElement('span'); sw.className = 'legend-swatch'; sw.style.background = r.color; const txt = document.createElement('span'); txt.textContent = r.name;
    item.appendChild(sw); item.appendChild(txt); legend.appendChild(item);
  });

  const presMini = document.getElementById('pres-mini');
  const ul = document.createElement('div'); ul.className = 'mini-grid';
  presidentialRegions.forEach(r => {
    const stats = computeRegionStats(r.candidates);
    const leader = stats[0];
    const div = document.createElement('div'); div.className = 'mini-seat';
    div.innerHTML = `<strong>${r.name}</strong> ${leader?'<span class="winner-mark">✓</span>':''}
      <div class="bar" style="margin-top:6px"><span style="width:${leader.finalScore.toFixed(1)}%; background:${leader.partyColor}"></span></div>
      <div style="margin-top:4px" class="muted">Lead: ${leader.name} · ${formatPct(leader.finalScore)}</div>`;
    ul.appendChild(div);
  });
  presMini.replaceChildren(ul);

  const dumaMini = document.getElementById('duma-mini');
  dumaMini.innerHTML = '';
  dumaSeats.slice(0, 8).forEach(seat => {
    const stats = computeRegionStats(seat.candidates);
    const leader = stats[0];
    const div = document.createElement('div'); div.className = 'mini-seat';
    div.innerHTML = `<strong>${seat.name}</strong> ${leader?'<span class="winner-mark">✓</span>':''}
      <div class="bar" style="margin-top:6px"><span style="width:${leader.finalScore.toFixed(1)}%; background:${leader.partyColor}"></span></div>
      <div style="margin-top:4px" class="muted">${leader.name}</div>`;
    dumaMini.appendChild(div);
  });
}

/* General view */
function renderGeneral() {
  const generalPres = document.getElementById('general-pres');
  const gp = generalPres;
  gp.innerHTML = '';
  presidentialRegions.forEach(r => {
    const stats = computeRegionStats(r.candidates);
    const leader = stats[0];
    const row = document.createElement('div'); row.className = 'mini-seat';
    row.innerHTML = `<strong>${r.name}</strong> ${leader?'<span class=\"winner-mark\">✓</span>:''}
      <div class="bar" style="margin-top:6px"><span style="width:${leader.finalScore.toFixed(1)}%; background:${leader.partyColor}"></span></div>
      <div style="margin-top:4px" class="muted">${leader.name} · ${formatPct(leader.finalScore)}</div>`;
    gp.appendChild(row);
  });
  const generalDuma = document.getElementById('general-duma');
  generalDuma.innerHTML = '';
  dumaSeats.forEach(seat => {
    const stats = computeRegionStats(seat.candidates);
    const leader = stats[0];
    const div = document.createElement('div'); div.className = 'mini-seat';
    div.innerHTML = `<strong>${seat.name}</strong> ${leader?'<span class=\"winner-mark\">✓</span>:''}
      <div class="bar" style="margin-top:6px"><span style="width:${leader.finalScore.toFixed(1)}%; background:${leader.partyColor}"></span></div>
      <div style="margin-top:4px" class="muted">${leader.name}</div>`;
    generalDuma.appendChild(div);
  });
}

/* Admin */
const adminScope = document.getElementById('admin-scope');
const adminTarget = document.getElementById('admin-target');
const adminCandidates = document.getElementById('admin-candidates');
const adminPreview = document.getElementById('admin-preview-panel');

function refreshAdminTargets() {
  adminTarget.innerHTML = '';
  const isPres = adminScope.value === 'presidential';
  const list = isPres ? presidentialRegions : dumaSeats;
  list.forEach((item, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    opt.textContent = isPres ? item.name : item.name;
    adminTarget.appendChild(opt);
  });
  renderAdminCandidates();
}

function renderAdminCandidates() {
  const isPres = adminScope.value === 'presidential';
  const idx = Number(adminTarget.value || 0);
  const item = (isPres ? presidentialRegions : dumaSeats)[idx];
  const stats = computeRegionStats(item.candidates);
  const leader = stats[0];
  adminCandidates.innerHTML = '';

  item.candidates.forEach((c, i) => {
    const row = document.createElement('div');
    row.className = 'form-row';
    row.innerHTML = `
      <label>${c.name} <span class="muted">(${c.partyName})</span> ${c.id===leader.id?'<span class="winner-mark">✓</span>':''}</label>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
        <div>
          <small>Campaign Points</small>
          <input type="number" data-which="cp" data-index="${i}" value="${c.campaignPoints}" />
        </div>
        <div>
          <small>Votes</small>
          <input type="number" data-which="votes" data-index="${i}" value="${c.votes}" />
        </div>
      </div>
    `;
    adminCandidates.appendChild(row);
  });

  // Preview
  adminPreview.innerHTML = `
    <div class="card">
      <h4>${item.name} ${leader?'<span class="winner-mark">✓</span>':''}</h4>
      ${stats.map(c => `
        <div class="candidate-row">
          <div class="party-badge" style="background:${c.partyColor}">${c.party}</div>
          <div>
            <div class="candidate-name">${c.name} ${c.id===leader.id?'<span class=\"winner-mark\">✓</span>:''}</div>
            <div class="muted">${c.partyName} · Final ${formatPct(c.finalScore)} (CP ${formatPct(c.campaignPct)} · PV ${formatPct(c.votePct)})</div>
            <div class="bar"><span style="width:${c.finalScore.toFixed(1)}%; background:${c.partyColor}"></span></div>
          </div>
          <div>${formatPct(c.finalScore)}</div>
        </div>
      `).join('')}
    </div>
  `;
}

adminScope.addEventListener('change', refreshAdminTargets);
adminTarget.addEventListener('change', renderAdminCandidates);

document.getElementById('admin-save').addEventListener('click', () => {
  const isPres = adminScope.value === 'presidential';
  const idx = Number(adminTarget.value || 0);
  const item = (isPres ? presidentialRegions : dumaSeats)[idx];
  const inputs = Array.from(adminCandidates.querySelectorAll('input'));
  inputs.forEach(input => {
    const which = input.dataset.which; const i = Number(input.dataset.index);
    const val = Number(input.value || 0);
    if (which === 'cp') item.candidates[i].campaignPoints = val;
    if (which === 'votes') item.candidates[i].votes = val;
  });
  // Re-render affected views
  renderPresTable();
  renderDumaGrid(document.getElementById('seat-search').value);
  renderHomeMinis();
  renderGeneral();
  renderAdminCandidates();
});

/* Init */
function init() {
  renderMapLegend();
  wireMapInteractions();
  renderPresTable();
  renderDumaGrid();
  renderHomeMinis();
  renderGeneral();
  refreshAdminTargets();
}

window.addEventListener('DOMContentLoaded', init);