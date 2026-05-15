
fetch('data/centres.json')
.then(res => res.json())
.then(data => {
  const container = document.getElementById('centres-container');

  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <h3>${item.nom || ''}</h3>
      <p>${item.ville || ''}</p>

      <a class="call-btn" href="tel:${item.telephone || ''}">
        📞 Appeler
      </a>

      <a class="map-btn"
      target="_blank"
      href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.adresse || item.ville || '')}">
      🗺️ Itinéraire
      </a>
    `;

    container.appendChild(card);
  });
});
