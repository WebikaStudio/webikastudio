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

if (contactForm) contactForm.addEventListener('submit', async e => {
    e.preventDefault();

    const originalText = submitBtn.getAttribute('data-' + currentLang);
    submitBtn.textContent = currentLang === 'en' ? 'Sending…' : 'Enviando…';
    submitBtn.disabled = true;

    const data = {
        name:    contactForm.querySelector('[name="name"]').value,
        email:   contactForm.querySelector('[name="email"]').value,
        company: contactForm.querySelector('[name="company"]').value,
        service: contactForm.querySelector('[name="service"]').value,
        message: contactForm.querySelector('[name="message"]').value,
    };

    try {
        await fetch(SHEETS_URL, { method: 'POST', body: JSON.stringify(data) });
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

    await fetch(SHEETS_URL, {
        method : 'POST',
        body   : JSON.stringify(payload),
    });
}

modalForm.addEventListener('submit', async e => {
    e.preventDefault();

    const originalText = modalSubmitBtn.getAttribute('data-' + currentLang);
    modalSubmitBtn.textContent = currentLang === 'en' ? 'Sending…' : 'Enviando…';
    modalSubmitBtn.disabled = true;

    const formData = {
        name:    modalForm.querySelector('[name="name"]').value,
        email:   modalForm.querySelector('[name="email"]').value,
        phone:   modalForm.querySelector('[name="phone"]').value,
        details: modalForm.querySelector('[name="details"]').value,
    };

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
        setTimeout(() => {
            closeModal();
            setTimeout(() => {
                modalForm.style.display     = '';
                modalTitle.style.display    = '';
                modalSubtitle.style.display = '';
                modalThanks.style.display   = 'none';
                modalForm.reset();
                modalSubmitBtn.disabled = false;
                modalSubmitBtn.textContent = originalText;
            }, 400);
        }, 5000);
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
