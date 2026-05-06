/**
 * AmalCare – map-centres.js
 * Carte interactive des centres d'oncologie (Leaflet)
 * Gère les données multilingues { fr, ar } et le badge de vérification
 */

document.addEventListener('DOMContentLoaded', async () => {
  const AC = window.AmalCare;
  const L  = window.L;

  if (!L)  { console.error('[AmalCare] Leaflet non chargé.'); return; }
  if (!AC) { console.error('[AmalCare] main.js non chargé.'); return; }

  AC.showLoading('Chargement de la carte...');

  let centresData = [];
  let markers     = [];

  /* ── Chargement des données ── */
  try {
    const res = await fetch('./data/centres.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    centresData = await res.json();
  } catch (err) {
    console.error('[AmalCare] Erreur chargement centres.json :', err);
    AC.hideLoading();
    return;
  }

  /* ── Initialisation de la carte ── */
  const map = L.map('map', {
    center: [31.7917, -7.0926],
    zoom: 6,
    zoomControl: false,
  });

  L.control.zoom({ position: 'topright' }).addTo(map);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  /* ── Icône personnalisée ── */
  function makeIcon(type) {
    const color = type === 'public' ? '#1d4ed8' : '#059669';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <ellipse cx="16" cy="40" rx="6" ry="2" fill="rgba(0,0,0,0.15)"/>
      <path d="M16 0C9.37 0 4 5.37 4 12c0 8.5 12 28 12 28S28 20.5 28 12C28 5.37 22.63 0 16 0z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="12" r="6" fill="white" opacity="0.9"/>
      <text x="16" y="16" font-family="Arial" font-size="9" font-weight="bold" fill="${color}" text-anchor="middle">+</text>
    </svg>`;
    return L.divIcon({ html: svg, className: '', iconSize: [32, 42], iconAnchor: [16, 42], popupAnchor: [0, -44] });
  }

  /* ── Contenu popup ── */
  function makePopup(c) {
    const nom   = AC.getText(c.nom);
    const ville = AC.getText(c.ville);
    const badge = c.type === 'public'
      ? '<span class="badge badge-public">Public</span>'
      : '<span class="badge badge-prive">Privé</span>';
    const verif   = AC.badgeVerification(c);
    const services = (c.services || []).slice(0, 3).join(' · ');
    return `
      <div class="popup-name">${nom}</div>
      <div class="popup-city">📍 ${ville} &nbsp;${badge}</div>
      <div style="margin:.35rem 0;">${verif}</div>
      <div class="popup-services">${services}${(c.services||[]).length > 3 ? '…' : ''}</div>
      ${c.telephone ? `<div style="margin-top:.5rem;font-size:.78rem;color:var(--primary)">📞 ${c.telephone}</div>` : ''}
    `;
  }

  /* ── Sidebar ── */
  const listEl = document.getElementById('centresList');

  function buildList(data) {
    if (!listEl) return;
    listEl.innerHTML = '';
    if (data.length === 0) {
      listEl.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);font-size:.875rem;">Aucun résultat</div>';
      return;
    }
    data.forEach(c => {
      const nom   = AC.getText(c.nom);
      const ville = AC.getText(c.ville);
      const item  = document.createElement('div');
      item.className  = 'map-list-item';
      item.dataset.id = c.id;
      item.innerHTML  = `
        <div class="map-list-item-name">${nom}</div>
        <div class="map-list-item-meta">
          <span style="color:${c.type==='public'?'var(--blue)':'var(--accent)'}">●</span>
          <span>${ville}</span>
          <span>·</span>
          <span>${c.type === 'public' ? 'Public' : 'Privé'}</span>
        </div>
      `;
      item.addEventListener('click', () => focusCentre(c.id));
      listEl.appendChild(item);
    });
  }

  /* ── Marqueurs ── */
  function addMarkers(data) {
    markers.forEach(m => { try { m.marker.remove(); } catch(e){} });
    markers = [];

    data.forEach(c => {
      if (!c.lat || !c.lon) return;
      const marker = L.marker([c.lat, c.lon], { icon: makeIcon(c.type) })
        .bindPopup(makePopup(c), { maxWidth: 290 })
        .addTo(map);

      marker.on('click', () => {
        setActiveItem(c.id);
        scrollToItem(c.id);
      });

      markers.push({ marker, id: c.id });
    });
  }

  /* ── Focus ── */
  function focusCentre(id) {
    const c = centresData.find(x => x.id === id);
    if (!c) return;
    map.flyTo([c.lat, c.lon], 13, { duration: 1 });
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
  const sidebarSearch = document.getElementById('sidebarSearch');
  if (sidebarSearch) {
    sidebarSearch.addEventListener('input', e => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = centresData.filter(c => {
        const nom   = AC.getText(c.nom).toLowerCase();
        const ville = AC.getText(c.ville).toLowerCase();
        return !q || nom.includes(q) || ville.includes(q) ||
          (c.services || []).some(s => s.toLowerCase().includes(q));
      });
      buildList(filtered);
    });
  }

  /* ── Géolocalisation ── */
  const locateBtn = document.getElementById('locateBtn');
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

        const sorted = [...centresData]
          .filter(c => c.lat && c.lon)
          .map(c => ({ ...c, _dist: Math.hypot(c.lat - latitude, c.lon - longitude) }))
          .sort((a, b) => a._dist - b._dist);

        buildList(sorted.slice(0, 5));
        const infoEl = document.getElementById('mapInfo');
        if (infoEl) infoEl.textContent = '5 centres les plus proches';

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
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      map.flyTo([31.7917, -7.0926], 6, { duration: 1 });
      addMarkers(centresData);
      buildList(centresData);
      const infoEl = document.getElementById('mapInfo');
      if (infoEl) infoEl.textContent = `${centresData.length} centres affichés`;
    });
  }

  /* ── Rendu initial ── */
  addMarkers(centresData);
  buildList(centresData);
  const infoEl = document.getElementById('mapInfo');
  if (infoEl) infoEl.textContent = `${centresData.length} centres affichés`;

  AC.hideLoading();
});
