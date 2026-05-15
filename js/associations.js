
fetch('data/associations.json')
.then(res => res.json())
.then(data => {
  const container = document.getElementById('associations-container');

  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <h3>${item.nom || ''}</h3>
      <p>${item.ville || ''}</p>

      <a class="call-btn" href="tel:${item.telephone || ''}">
        📞 Appeler
      </a>
    `;

    container.appendChild(card);
  });
});
