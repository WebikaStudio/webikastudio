/* ============================================================
   WEBIKA — Main Script
   Language detection, scroll animations, nav behavior, etc.
   ============================================================ */

const pageLoadTime = Date.now();
const visitCount   = parseInt(localStorage.getItem('visitCount') || '0') + 1;
localStorage.setItem('visitCount', visitCount);



   // ---- Language System ----

function detectLanguage() {
    const saved = localStorage.getItem('webika-lang');
    if (saved === 'en' || saved === 'es') return saved;
    const lang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    return lang.startsWith('es') ? 'es' : 'en';
}

let currentLang = detectLanguage();

function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('webika-lang', lang);
    document.documentElement.lang = lang;

    // Update text content for all translatable elements
    document.querySelectorAll('[data-en][data-es]').forEach(el => {
        const text = el.getAttribute('data-' + lang);
        if (text !== null) el.textContent = text;
    });

    // Update input/textarea placeholders
    document.querySelectorAll('[data-placeholder-en][data-placeholder-es]').forEach(el => {
        el.placeholder = el.getAttribute('data-placeholder-' + lang);
    });

    // Update lang toggle UI
    const currentEl = document.getElementById('currentLang');
    const otherEl   = document.getElementById('otherLang');
    if (currentEl) currentEl.textContent = lang.toUpperCase();
    if (otherEl)   otherEl.textContent   = lang === 'en' ? 'ES' : 'EN';
}

document.getElementById('langToggle').addEventListener('click', () => {
    applyLanguage(currentLang === 'en' ? 'es' : 'en');
});

// ---- Scroll Reveal (Intersection Observer) ----

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ---- Navbar: scroll + hide-on-scroll-down ----

const navbar        = document.getElementById('navbar');
const navLinks      = document.querySelectorAll('.nav-link');
const scrollProgress = document.getElementById('scrollProgress');
let   lastScrollY   = 0;
let   scrollTicking  = false;

function updateNav() {
    const y = window.scrollY;

    // Floating pill backdrop
    navbar.classList.toggle('scrolled', y > 60);

    // Keep navbar visible at all times while scrolling
    navbar.classList.remove('hidden');
    lastScrollY = y;

    // Scroll progress bar
    const docH   = document.documentElement.scrollHeight - window.innerHeight;
    const pct    = docH > 0 ? (y / docH) * 100 : 0;
    scrollProgress.style.width = pct.toFixed(1) + '%';

    // Active link highlighting
    const sections = ['home', 'services', 'process', 'work', 'pricing', 'contact'];
    let current = '';
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) current = id;
    });
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });

    scrollTicking = false;
}

window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        requestAnimationFrame(updateNav);
        scrollTicking = true;
    }
}, { passive: true });

// ---- Counter Animation ----

function animateCounter(el) {
    const target   = parseInt(el.getAttribute('data-target'), 10);
    const duration = 1600;
    const start    = performance.now();

    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

const statsEl = document.querySelector('.hero-stats');
if (statsEl) {
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.querySelectorAll('.stat-number').forEach(animateCounter);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    counterObserver.observe(statsEl);
}

// ---- Mobile Menu ----

const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');

if (menuToggle && mobileMenu) {
    function closeMobileMenu() {
        menuToggle.classList.remove('active');
        mobileMenu.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
    }

    menuToggle.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('open');
        menuToggle.classList.toggle('active', isOpen);
        menuToggle.setAttribute('aria-expanded', String(isOpen));
        mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    });

    mobileMenu.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    document.addEventListener('click', e => {
        if (mobileMenu.classList.contains('open') &&
            !mobileMenu.contains(e.target) &&
            !menuToggle.contains(e.target)) {
            closeMobileMenu();
        }
    });
}

// ---- Smooth scroll for anchor links ----

document.querySelectorAll('a[href^="#"], button[data-target-section]').forEach(el => {
    el.addEventListener('click', e => {
        let targetId;
        if (el.tagName === 'BUTTON') {
            targetId = el.getAttribute('data-target-section');
        } else {
            const href = el.getAttribute('href');
            if (!href || href === '#') return;
            targetId = href.slice(1);
        }
        const target = document.getElementById(targetId);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

document.getElementById('heroWork').addEventListener('click', () => {
    document.getElementById('work').scrollIntoView({ behavior: 'smooth' });
});

// ---- Contact form (only present when template is live) ----

const contactForm = document.getElementById('contactForm');
const submitBtn   = document.getElementById('submitBtn');

const SHEETS_URL = 'https://script.google.com/macros/s/AKfycby_AEnvLNOp8qMpFeS-aGvdEZDpypnNh9mP9ZNdmUu4Mp2UF8y-LjRxuXvug_aMDsdP/exec';

// Rate-limit: track last submission timestamps to block rapid repeat sends
const _submissionLog = [];
function _isRateLimited() {
    const now = Date.now();
    // Remove entries older than 60 s
    while (_submissionLog.length && now - _submissionLog[0] > 60_000) _submissionLog.shift();
    if (_submissionLog.length >= 3) return true; // max 3 submissions per minute
    _submissionLog.push(now);
    return false;
}

const FIELD_LIMITS = { name: 100, email: 254, company: 150, service: 100, message: 2000, phone: 30, details: 2000 };

function _sanitizeField(value, maxLen) {
    return String(value).trim().slice(0, maxLen);
}

function _validateFormData(data) {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRe.test(data.email)) return 'Invalid email address.';
    if (data.name !== undefined && !data.name) return 'Name is required.';
    return null;
}

if (contactForm) contactForm.addEventListener('submit', async e => {
    e.preventDefault();

    // Honeypot: bots fill hidden fields; real users don't
    if (contactForm.querySelector('[name="_hp"]')?.value) return;

    if (_isRateLimited()) {
        submitBtn.textContent = currentLang === 'en' ? 'Too many attempts — wait a moment' : 'Demasiados intentos — espera un momento';
        setTimeout(() => { submitBtn.textContent = submitBtn.getAttribute('data-' + currentLang); }, 3000);
        return;
    }

    const originalText = submitBtn.getAttribute('data-' + currentLang);
    submitBtn.textContent = currentLang === 'en' ? 'Sending…' : 'Enviando…';
    submitBtn.disabled = true;

    const data = {
        name:    _sanitizeField(contactForm.querySelector('[name="name"]').value,    FIELD_LIMITS.name),
        email:   _sanitizeField(contactForm.querySelector('[name="email"]').value,   FIELD_LIMITS.email),
        company: _sanitizeField(contactForm.querySelector('[name="company"]').value, FIELD_LIMITS.company),
        service: _sanitizeField(contactForm.querySelector('[name="service"]').value, FIELD_LIMITS.service),
        message: _sanitizeField(contactForm.querySelector('[name="message"]').value, FIELD_LIMITS.message),
    };

    const validationError = _validateFormData(data);
    if (validationError) {
        submitBtn.textContent = validationError;
        submitBtn.disabled = false;
        setTimeout(() => { submitBtn.textContent = originalText; }, 3000);
        return;
    }

    try {
        const res = await fetch(SHEETS_URL, { method: 'POST', body: JSON.stringify(data) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        submitBtn.textContent = currentLang === 'en' ? '✓ Message Sent!' : '✓ ¡Mensaje Enviado!';
        submitBtn.style.background = 'linear-gradient(135deg, #10b981, #06b6d4)';
        setTimeout(() => {
            submitBtn.textContent = originalText || (currentLang === 'en' ? 'Send Message' : 'Enviar Mensaje');
            submitBtn.style.background = '';
            submitBtn.disabled = false;
            contactForm.reset();
        }, 3000);
    } catch {
        submitBtn.textContent = currentLang === 'en' ? 'Error — Try Again' : 'Error — Intenta de Nuevo';
        submitBtn.style.background = 'linear-gradient(135deg, #ef4444, #f97316)';
        setTimeout(() => {
            submitBtn.textContent = originalText || (currentLang === 'en' ? 'Send Message' : 'Enviar Mensaje');
            submitBtn.style.background = '';
            submitBtn.disabled = false;
        }, 3000);
    }
});

// ---- Project Modal ----

const projectModal    = document.getElementById('projectModal');
const modalCloseBtn   = document.getElementById('modalClose');
const modalForm       = document.getElementById('modalForm');
const modalSubmitBtn  = document.getElementById('modalSubmitBtn');

function openModal() {
    projectModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    applyLanguage(currentLang);
}

function closeModal() {
    projectModal.style.display = 'none';
    document.body.style.overflow = '';
    // Reset modal state for next open
    const mForm     = document.getElementById('modalForm');
    const mThanks   = document.getElementById('modalThanks');
    const mTitle    = document.getElementById('modalTitle');
    const mSubtitle = document.querySelector('.modal-subtitle');
    const mBtn      = document.getElementById('modalSubmitBtn');
    if (mThanks && mThanks.style.display !== 'none') {
        mForm.style.display     = '';
        mTitle.style.display    = '';
        mSubtitle.style.display = '';
        mThanks.style.display   = 'none';
        mForm.reset();
        mBtn.disabled = false;
        mBtn.textContent = mBtn.getAttribute('data-' + currentLang);
    }
}

document.getElementById('navCta').addEventListener('click', openModal);
document.getElementById('heroCta').addEventListener('click', openModal);

modalCloseBtn.addEventListener('click', closeModal);
projectModal.addEventListener('click', e => { if (e.target === projectModal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && projectModal.classList.contains('is-open')) closeModal(); });

async function submitForm(formData) {
    const timeOnPage = Math.round((Date.now() - pageLoadTime) / 1000);

    const metadata = {
        pageUrl       : window.location.href,
        referrer      : document.referrer || 'Direct',
        userAgent     : navigator.userAgent,
        language      : navigator.language,
        screenSize    : `${screen.width}x${screen.height}`,
        timezone      : Intl.DateTimeFormat().resolvedOptions().timeZone,
        timeOnPage    : `${timeOnPage}s`,
        visitCount    : visitCount,
        localDateTime : new Date().toLocaleString(),
    };

    const payload = { ...formData, ...metadata };

    const res = await fetch(SHEETS_URL, {
        method : 'POST',
        body   : JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

modalForm.addEventListener('submit', async e => {
    e.preventDefault();

    // Honeypot check
    if (modalForm.querySelector('[name="_hp"]')?.value) return;

    if (_isRateLimited()) {
        modalSubmitBtn.textContent = currentLang === 'en' ? 'Too many attempts — wait a moment' : 'Demasiados intentos — espera un momento';
        setTimeout(() => { modalSubmitBtn.textContent = modalSubmitBtn.getAttribute('data-' + currentLang); }, 3000);
        return;
    }

    const originalText = modalSubmitBtn.getAttribute('data-' + currentLang);
    modalSubmitBtn.textContent = currentLang === 'en' ? 'Sending…' : 'Enviando…';
    modalSubmitBtn.disabled = true;

    const formData = {
        name:    _sanitizeField(modalForm.querySelector('[name="name"]').value,    FIELD_LIMITS.name),
        email:   _sanitizeField(modalForm.querySelector('[name="email"]').value,   FIELD_LIMITS.email),
        phone:   _sanitizeField(modalForm.querySelector('[name="phone"]').value,   FIELD_LIMITS.phone),
        details: _sanitizeField(modalForm.querySelector('[name="details"]').value, FIELD_LIMITS.details),
    };

    const validationError = _validateFormData(formData);
    if (validationError) {
        modalSubmitBtn.textContent = validationError;
        modalSubmitBtn.disabled = false;
        setTimeout(() => { modalSubmitBtn.textContent = originalText; }, 3000);
        return;
    }

    const modalThanks    = document.getElementById('modalThanks');
    const modalTitle     = document.getElementById('modalTitle');
    const modalSubtitle  = document.querySelector('.modal-subtitle');

    try {
        await submitForm(formData);
        modalForm.style.display     = 'none';
        modalTitle.style.display    = 'none';
        modalSubtitle.style.display = 'none';
        modalThanks.style.display   = 'block';
        applyLanguage(currentLang);
    } catch {
        modalSubmitBtn.textContent = currentLang === 'en' ? 'Error — Try Again' : 'Error — Intenta de Nuevo';
        modalSubmitBtn.style.background = 'linear-gradient(135deg, #ef4444, #f97316)';
        setTimeout(() => {
            modalSubmitBtn.textContent = originalText;
            modalSubmitBtn.style.background = '';
            modalSubmitBtn.disabled = false;
        }, 3000);
    }

});

// ---- Footer year ----

const footerYear = document.getElementById('footerYear');
if (footerYear) {
    const yr = new Date().getFullYear();
    footerYear.setAttribute('data-en', `© ${yr} Webika. All rights reserved.`);
    footerYear.setAttribute('data-es', `© ${yr} Webika. Todos los derechos reservados.`);
}

// ---- Init ----

document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(currentLang);
});
