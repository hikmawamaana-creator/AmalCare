/**
 * AmalCare – main.js
 * Fonctions partagées : langue, menu mobile, badge, helpers
 */

/* ── Langue ── */
const LANG_KEY = 'amalcare-lang';

const translations = {
  fr: {
    'nav.home':         'Accueil',
    'nav.centres':      'Centres',
    'nav.associations': 'Associations',
    'nav.assurance':    'Assurance',
    'nav.guide':        'Guide',
    'nav.map-centres':  'Carte Centres',
    'nav.map-assoc':    'Carte Associations',
    'search.placeholder': 'Rechercher...',
    'filter.all-cities':  'Toutes les villes',
    'filter.all-types':   'Tous les types',
    'filter.public':      'Public',
    'filter.prive':       'Privé',
    'locate.btn':         '📍 Ma position',
    'badge.public':       'Public',
    'badge.prive':        'Privé',
  },
  ar: {
    'nav.home':         'الرئيسية',
    'nav.centres':      'المراكز',
    'nav.associations': 'الجمعيات',
    'nav.assurance':    'التأمين',
    'nav.guide':        'الدليل',
    'nav.map-centres':  'خريطة المراكز',
    'nav.map-assoc':    'خريطة الجمعيات',
    'search.placeholder': 'بحث...',
    'filter.all-cities':  'كل المدن',
    'filter.all-types':   'كل الأنواع',
    'filter.public':      'عمومي',
    'filter.prive':       'خاص',
    'locate.btn':         '📍 موقعي',
    'badge.public':       'عمومي',
    'badge.prive':        'خاص',
  }
};

function getCurrentLang() {
  return localStorage.getItem(LANG_KEY) || 'fr';
}

function applyLang(lang) {
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  localStorage.setItem(LANG_KEY, lang);

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const t = translations[lang];
    if (t && t[key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = t[key];
      } else {
        el.textContent = t[key];
      }
    }
  });
}

function initLangToggle() {
  applyLang(getCurrentLang());
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => applyLang(btn.dataset.lang));
  });
}

/* ── Menu mobile ── */
function initMobileNav() {
  const hamburger = document.querySelector('.hamburger');
  const navMenu   = document.querySelector('.navbar-nav');
  if (!hamburger || !navMenu) return;

  hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', navMenu.classList.contains('open'));
  });

  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
      navMenu.classList.remove('open');
    }
  });
}

/* ── Lien actif ── */
function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.navbar-nav a').forEach(link => {
    const href = link.getAttribute('href') || '';
    link.classList.toggle('active',
      href === path ||
      (path.endsWith('/') && href === 'index.html') ||
      (href !== 'index.html' && path.includes(href.replace('.html', '')))
    );
  });
}

/* ── Loading ── */
function showLoading(msg) {
  const overlay = document.querySelector('.loading-overlay');
  if (!overlay) return;
  const txt = overlay.querySelector('.loading-text');
  if (txt) txt.textContent = msg || 'Chargement...';
  overlay.classList.remove('hidden');
}

function hideLoading() {
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) overlay.classList.add('hidden');
}

/* ── Helpers données multilingues ── */

/**
 * Lit un champ qui peut être une chaîne simple OU un objet { fr, ar }
 * Exemples : getText(c.nom) → "Institut National..."
 */
function getText(field) {
  if (!field) return '';
  if (typeof field === 'string') return field;
  const lang = getCurrentLang();
  return field[lang] || field['fr'] || field['ar'] || '';
}

/**
 * Badge de fiabilité basé sur le champ "verification"
 * "verifie"    → 🟢 Vérifié
 * "a_confirmer"→ 🟡 À confirmer
 * (fallback via fiabilite si pas de verification)
 */
function badgeVerification(item) {
  const v = item.verification || (item.fiabilite === 'élevée' ? 'verifie' : 'a_confirmer');
  if (v === 'verifie') {
    return '<span class="badge-verif verifie">🟢 Vérifié</span>';
  }
  return '<span class="badge-verif a_confirmer">🟡 À confirmer</span>';
}

/**
 * Étoiles basées sur fiabilite (string ou nombre)
 */
function renderStars(item) {
  let n;
  if (typeof item === 'number') {
    n = item;
  } else if (typeof item === 'object' && item !== null) {
    n = item.fiabilite === 'élevée' ? 5 : item.fiabilite === 'moyenne' ? 3 : 3;
  } else {
    n = 3;
  }
  n = Math.max(0, Math.min(5, n));
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

/* ── Exposer sur window ── */
window.AmalCare = {
  getCurrentLang,
  applyLang,
  getText,
  badgeVerification,
  renderStars,
  showLoading,
  hideLoading,
  translations,
};

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  initLangToggle();
  initMobileNav();
  setActiveNav();
});
