/**
 * AmalCare – map-associations.js
 * Carte interactive des associations de soutien (Leaflet)
 * Gère les données multilingues { fr, ar } et le badge de vérification
 */

document.addEventListener('DOMContentLoaded', async () => {
  const AC = window.AmalCare;
  const L  = window.L;

  if (!L)  { console.error('[AmalCare] Leaflet non chargé.'); return; }
  if (!AC) { console.error('[AmalCare] main.js non chargé.'); return; }

  AC.showLoading('Chargement de la carte...');

  let assocData = [];
  let markers   = [];

  /* ── Chargement des données ── */
  try {
    const res = await fetch('./data/associations.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    assocData = await res.json();
  } catch (err) {
    console.error('[AmalCare] Erreur chargement associations.json :', err);
    AC.hideLoading();
    return;
  }

  /* ── Initialisation de la carte ── */
  const map = L.map('map-assoc', {
    center: [31.7917, -7.0926],
    zoom: 6,
    zoomControl: false,
  });

  L.control.zoom({ position: 'topright' }).addTo(map);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  /* ── Icône association ── */
  function makeAssocIcon() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <ellipse cx="16" cy="40" rx="6" ry="2" fill="rgba(0,0,0,0.15)"/>
      <path d="M16 0C9.37 0 4 5.37 4 12c0 8.5 12 28 12 28S28 20.5 28 12C28 5.37 22.63 0 16 0z" fill="#059669" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="12" r="6" fill="white" opacity="0.9"/>
      <text x="16" y="16" font-family="Arial" font-size="9" fill="#059669" text-anchor="middle">♥</text>
    </svg>`;
    return L.divIcon({ html: svg, className: '', iconSize: [32, 42], iconAnchor: [16, 42], popupAnchor: [0, -44] });
  }

  /* ── Popup ── */
  function makePopup(a) {
    const nom      = AC.getText(a.nom);
    const ville    = AC.getText(a.ville);
    const verif    = AC.badgeVerification(a);
    const services = (a.services || []).slice(0, 3).join(' · ');
    return `
      <div class="popup-name">${nom}</div>
      <div class="popup-city">📍 ${ville}</div>
      <div style="margin:.35rem 0;">${verif}</div>
      <div class="popup-services">${services}${(a.services||[]).length > 3 ? '…' : ''}</div>
      ${a.telephone ? `<div style="margin-top:.5rem;font-size:.78rem;color:var(--primary)">📞 ${a.telephone}</div>` : ''}
    `;
  }

  /* ── Sidebar ── */
  const listEl = document.getElementById('assocList');

  function buildList(data) {
    if (!listEl) return;
    listEl.innerHTML = '';
    if (data.length === 0) {
      listEl.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);font-size:.875rem;">Aucun résultat</div>';
      return;
    }
    data.forEach(a => {
      const nom   = AC.getText(a.nom);
      const ville = AC.getText(a.ville);
      const item  = document.createElement('div');
      item.className  = 'map-list-item';
      item.dataset.id = a.id;
      item.innerHTML  = `
        <div class="map-list-item-name">${nom}</div>
        <div class="map-list-item-meta">
          <span style="color:var(--accent)">●</span>
          <span>${ville}</span>
        </div>
      `;
      item.addEventListener('click', () => focusAssoc(a.id));
      listEl.appendChild(item);
    });
  }

  /* ── Marqueurs ── */
  function addMarkers(data) {
    markers.forEach(m => { try { m.marker.remove(); } catch(e){} });
    markers = [];

    data.forEach(a => {
      if (!a.lat || !a.lon) return;
      const marker = L.marker([a.lat, a.lon], { icon: makeAssocIcon() })
        .bindPopup(makePopup(a), { maxWidth: 290 })
        .addTo(map);

      marker.on('click', () => {
        setActiveItem(a.id);
        scrollToItem(a.id);
      });

      markers.push({ marker, id: a.id });
    });
  }

  /* ── Focus ── */
  function focusAssoc(id) {
    const a = assocData.find(x => x.id === id);
    if (!a) return;
    map.flyTo([a.lat, a.lon], 13, { duration: 1 });
    const m = markers.find(m => m.id === id);
    if (m) setTimeout(() => m.marker.openPopup(), 600);
    setActiveItem(id);
  }

  function setActiveItem(id) {
    document.querySelectorAll('.map-list-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });
  }

  function scrollToItem(id) {
    const el = listEl && listEl.querySelector(`[data-id="${id}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ── Recherche sidebar ── */
  const sidebarSearch = document.getElementById('assocSidebarSearch');
  if (sidebarSearch) {
    sidebarSearch.addEventListener('input', e => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = assocData.filter(a => {
        const nom   = AC.getText(a.nom).toLowerCase();
        const ville = AC.getText(a.ville).toLowerCase();
        return !q || nom.includes(q) || ville.includes(q) ||
          (a.services || []).some(s => s.toLowerCase().includes(q));
      });
      addMarkers(filtered);
      buildList(filtered);
      const infoEl = document.getElementById('assocMapInfo');
      if (infoEl) infoEl.textContent = `${filtered.length} association(s) affichée(s)`;
    });
  }

  /* ── Géolocalisation ── */
  const locateBtn = document.getElementById('assocLocateBtn');
  if (locateBtn) {
    locateBtn.addEventListener('click', () => {
      if (!navigator.geolocation) { alert('Géolocalisation non supportée.'); return; }
      locateBtn.textContent = '⏳ Localisation...';
      locateBtn.disabled = true;

      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;

        L.marker([latitude, longitude], {
          icon: L.divIcon({
            html: '<div style="width:16px;height:16px;background:#ef4444;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>',
            className: '', iconSize: [16,16], iconAnchor: [8,8],
          })
        }).addTo(map).bindPopup('<strong>📍 Votre position</strong>').openPopup();

        map.flyTo([latitude, longitude], 10, { duration: 1.5 });

        const sorted = [...assocData]
          .filter(a => a.lat && a.lon)
          .map(a => ({ ...a, _dist: Math.hypot(a.lat - latitude, a.lon - longitude) }))
          .sort((a, b) => a._dist - b._dist);

        buildList(sorted.slice(0, 5));
        const infoEl = document.getElementById('assocMapInfo');
        if (infoEl) infoEl.textContent = '5 associations les plus proches';

        locateBtn.textContent = '📍 Ma position';
        locateBtn.disabled = false;
      }, () => {
        alert('Position impossible à obtenir.');
        locateBtn.textContent = '📍 Ma position';
        locateBtn.disabled = false;
      });
    });
  }

  /* ── Réinitialiser ── */
  const resetBtn = document.getElementById('assocResetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      map.flyTo([31.7917, -7.0926], 6, { duration: 1 });
      addMarkers(assocData);
      buildList(assocData);
      const infoEl = document.getElementById('assocMapInfo');
      if (infoEl) infoEl.textContent = `${assocData.length} associations affichées`;
    });
  }

  /* ── Rendu initial ── */
  addMarkers(assocData);
  buildList(assocData);
  const infoEl = document.getElementById('assocMapInfo');
  if (infoEl) infoEl.textContent = `${assocData.length} associations affichées`;

  AC.hideLoading();
});
