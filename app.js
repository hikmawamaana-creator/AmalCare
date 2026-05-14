const button = document.getElementById('lang-toggle');

let currentLang = 'fr';

if(button){
button.addEventListener('click', () => {

  const title = document.getElementById('hero-title');
  const text = document.getElementById('hero-text');

  if(currentLang === 'fr') {

    document.body.dir = 'rtl';

    title.innerText = 'لست وحدك في مواجهة السرطان';

    text.innerText = 'تساعدكم منصة AmalCare في الوصول إلى مراكز العلاج والدعم بالمغرب';

    button.innerText = 'FR';

    currentLang = 'ar';

  } else {

    document.body.dir = 'ltr';

    title.innerText = 'Vous n’êtes pas seul face au cancer';

    text.innerText = 'AmalCare vous aide à trouver les centres, associations et informations utiles au Maroc.';

    button.innerText = 'AR';

    currentLang = 'fr';
  }
});
}
