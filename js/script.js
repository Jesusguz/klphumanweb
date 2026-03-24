/* ============================================================
   KLP HUMAN — script.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. Header scroll behaviour ─────────────────────────── */
  const header = document.querySelector('header');
  const onScroll = () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── 2. Hamburger menu ───────────────────────────────────── */
  const toggle = document.querySelector('.menu-toggle');
  const navUl  = document.querySelector('nav ul');

  if (toggle && navUl) {
    toggle.addEventListener('click', () => {
      const open = navUl.classList.toggle('active');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !navUl.contains(e.target)) {
        navUl.classList.remove('active');
        toggle.classList.remove('open');
      }
    });

    // Close on nav link click (mobile)
    navUl.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navUl.classList.remove('active');
        toggle.classList.remove('open');
      });
    });
  }

  /* ── 3. Active nav link ──────────────────────────────────── */
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav ul li a').forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    if (href === currentPath) a.classList.add('active');
  });

  /* ── 4. Smooth scroll (anchor links only) ────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── 5. Scroll reveal ────────────────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  /* ── 6. Counter animation (stats) ───────────────────────── */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el     = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        const dur    = 1600;
        const step   = dur / 60;
        let current  = 0;
        const inc    = target / (dur / step);
        const timer  = setInterval(() => {
          current += inc;
          if (current >= target) {
            el.textContent = target + suffix;
            clearInterval(timer);
          } else {
            el.textContent = Math.floor(current) + suffix;
          }
        }, step);
        countObserver.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(el => countObserver.observe(el));
  }

  /* ── 7. Hero background parallax ────────────────────────── */
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg) {
    heroBg.classList.add('loaded');
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      heroBg.style.transform = `scale(1) translateY(${y * 0.25}px)`;
    }, { passive: true });
  }

  /* ── 8. Privacy modal ────────────────────────────────────── */
  const privacyLinks = document.querySelectorAll('[data-privacy]');
  const iframeContainer = document.getElementById('iframe-container');
  const googleIframe    = document.getElementById('google-iframe');
  const closeBtn        = document.getElementById('close-button');

  if (privacyLinks.length && iframeContainer) {
    privacyLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        googleIframe.src = 'https://drive.google.com/file/d/1YW6OISoT4BBmjsSR-iKzFz0NIu85ESxv/preview';
        iframeContainer.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });
    closeBtn?.addEventListener('click', () => {
      googleIframe.src = '';
      iframeContainer.classList.remove('open');
      document.body.style.overflow = '';
    });
    iframeContainer.addEventListener('click', (e) => {
      if (e.target === iframeContainer) closeBtn.click();
    });
  }

  /* ── 9. Form reset on unload (contact) ──────────────────── */
  window.addEventListener('beforeunload', () => {
    document.querySelectorAll('form').forEach(f => f.reset());
  });

  /* ── 10. YouTube IFrame API bootstrap ────────────────────── */
  // Called by YouTube when the API script loads
});

/* YouTube helpers (kept global as required by the API) */
let player, videoUrls = [], currentVideoIndex = 0;

function onYouTubeIframeAPIReady() {
  fetchVideosFromSpreadsheet();
}

function fetchVideosFromSpreadsheet() {
  const spreadsheetId = '1aollq50weBDkfcvqoUefI0XOj3HT4YjrtxekfF6QT7c';
  const range = 'Pagina!A2:A16';
  const apiKey = 'AIzaSyCVCG0g7f0SYAm5TdNljWkr19l4G9ZZbAE';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;

  fetch(url)
    .then(r => r.ok ? r.json() : Promise.reject(r))
    .then(data => {
      if (!data.values) return;
      const re = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      videoUrls = data.values
        .map(row => { const m = (row[0] || '').match(re); return m && m[2].length === 11 ? m[2] : null; })
        .filter(Boolean);
      if (videoUrls.length) createPlayer(videoUrls[0]);
    })
    .catch(err => console.warn('YT Sheets fetch error:', err));
}

function createPlayer(videoId) {
  const el = document.getElementById('youtube-player');
  if (!el || typeof YT === 'undefined') return;
  player = new YT.Player('youtube-player', {
    height: '100%', width: '100%',
    videoId,
    playerVars: { playsinline: 1, autoplay: 0, rel: 0, controls: 1, modestbranding: 1 },
    events: { onStateChange: onPlayerStateChange }
  });
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    currentVideoIndex = (currentVideoIndex + 1) % videoUrls.length;
    player.loadVideoById(videoUrls[currentVideoIndex]);
  }
}
