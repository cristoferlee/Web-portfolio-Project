// ── Debug helpers — set DEBUG = false before deploying ─────────────────────
const DEBUG = true;
const _log  = (...a) => DEBUG && console.log('%c[script.js]', 'color:#1a3a8f;font-weight:bold', ...a);
const _warn = (...a) => DEBUG && console.warn('%c[script.js]', 'color:#c0392b;font-weight:bold', ...a);

const menuToggle = document.getElementById('menu-toggle');
const navMenu = document.getElementById('nav-menu');

function toggleMenu() {
    const isOpen = navMenu.classList.toggle('nav-open');
    _log('toggleMenu →', isOpen ? 'OPEN' : 'CLOSED');
    menuToggle.setAttribute('aria-expanded', String(isOpen)); // explicit string coercion
    menuToggle.setAttribute(
        'aria-label',
        isOpen ? 'Close navigation menu' : 'Open navigation menu'
    );
}

menuToggle.addEventListener('click', toggleMenu);

// Close menu when a nav link is clicked
navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('nav-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open navigation menu');
    });
});

// ============================================================
// PROJECT FILTER
// ============================================================
function filterProjects(category) {
    _log('filterProjects →', category);
    const articles = document.querySelectorAll('#projects .cards article');
    const buttons = document.querySelectorAll('.filter-btn');

    articles.forEach(article => {
        const match = category === 'all' || article.dataset.category === category;
        article.style.display = match ? '' : 'none';
    });

    buttons.forEach(btn => {
        const isActive = btn.getAttribute('onclick').includes(`'${category}'`);
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

// ============================================================
// LIGHTBOX
// ============================================================
const lightbox      = document.getElementById('lightbox');
const lightboxImg   = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxClose = document.getElementById('lightbox-close');

function openLightbox(img) {
    _log('openLightbox', { src: img.src, alt: img.alt, caption: img.dataset.caption });
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = img.dataset.caption || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
}

function closeLightbox() {
    _log('closeLightbox');
    lightbox.hidden = true;
    lightboxImg.removeAttribute('src');
    lightboxImg.removeAttribute('alt');
    document.body.style.overflow = '';
}

// Open on image click
document.querySelectorAll('.lightbox-trigger').forEach(img => {
    img.addEventListener('click', () => openLightbox(img));
});

// Close on button or backdrop click
lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
});

// Close on Escape key
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
});

// ============================================================
// CONTACT FORM VALIDATION
// ============================================================
const contactForm  = document.getElementById('contact-form');
const formSuccess  = document.getElementById('form-success');

const fields = {
    name: {
        el:    document.getElementById('full-name'),
        error: document.getElementById('error-name'),
        validate(val) {
            if (!val.trim())            return 'Please enter your name.';
            if (val.trim().length < 2)  return 'Name must be at least 2 characters.';
            if (/\d/.test(val))         return 'Name cannot contain numbers.';
            return '';
        }
    },
    email: {
        el:    document.getElementById('email'),
        error: document.getElementById('error-email'),
        validate(val) {
            const trimmed = val.trim();
            if (!trimmed) return 'Please enter your email address.';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Please enter a valid email address.';
            return '';
        }
    },
    message: {
        el:    document.getElementById('message'),
        error: document.getElementById('error-message'),
        validate(val) {
            if (!val.trim())            return 'Please write a message.';
            if (val.trim().length < 10) return 'Message must be at least 10 characters.';
            return '';
        }
    }
};

// Block numbers in the name field
const nameEl = fields.name.el;
nameEl.addEventListener('keydown', e => {
    if (e.key >= '0' && e.key <= '9') e.preventDefault();
});
nameEl.addEventListener('input', () => {
    // Strip any digits that arrive via paste or autofill
    const cleaned = nameEl.value.replace(/\d/g, '');
    if (cleaned !== nameEl.value) {
        const cursor = nameEl.selectionStart - (nameEl.value.length - cleaned.length);
        nameEl.value = cleaned;
        nameEl.setSelectionRange(cursor, cursor);
    }
});

// Character counter for mensaje
const charCounter = document.getElementById('char-counter');
const messageEl = fields.message.el;
messageEl.addEventListener('input', () => {
    const len = messageEl.value.length;
    charCounter.textContent = `${len} / 1000 characters${len < 10 ? ' (min. 10)' : ''}`;
    charCounter.classList.toggle('field-hint--warn', len > 0 && len < 10);
    charCounter.classList.toggle('field-hint--ok',   len >= 10);
});

function setFieldState(field, message, touched) {
    if (message) _warn('Validation error [#%s]:', field.el.id, message);
    else         _log('Field cleared [#%s]', field.el.id);
    const hasError = !!message;
    const hasValue = field.el.value.trim().length > 0;
    field.error.textContent = message;
    field.el.classList.toggle('input-error', touched && hasError);
    field.el.classList.toggle('input-valid', touched && !hasError && hasValue);
    field.el.setAttribute('aria-invalid', String(touched && hasError));
}

// Track touched state per field (after first blur or after typing)
Object.values(fields).forEach(field => {
    field._touched = false;

    field.el.addEventListener('blur', () => {
        field._touched = true;
        setFieldState(field, field.validate(field.el.value), true);
    });

    field.el.addEventListener('input', () => {
        if (field._touched) {
            setFieldState(field, field.validate(field.el.value), true);
        }
    });
});

function setFieldError(field, message) {
    setFieldState(field, message, true);
}

contactForm.addEventListener('submit', e => {
    e.preventDefault();
    _log('Form submit triggered');

    let firstErrorEl = null;
    let hasErrors = false;

    Object.values(fields).forEach(field => {
        const msg = field.validate(field.el.value);
        setFieldError(field, msg);
        if (msg) {
            hasErrors = true;
            if (!firstErrorEl) firstErrorEl = field.el;
        }
    });

    if (hasErrors) {
        firstErrorEl.focus();
        return;
    }

    // Simulate async submission
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    setTimeout(() => {
        contactForm.reset();
        Object.values(fields).forEach(f => {
            f._touched = false;
            f.el.classList.remove('input-error', 'input-valid');
            f.el.setAttribute('aria-invalid', 'false');
            f.error.textContent = '';
        });
        charCounter.textContent = '0 / 1000 characters (min. 10)';
        charCounter.classList.remove('field-hint--warn', 'field-hint--ok');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send message';

        formSuccess.hidden = false;
        formSuccess.focus();

        // Auto-hide after 6 s
        setTimeout(() => { formSuccess.hidden = true; }, 6000);
    }, 800);
});

// ── Startup diagnostic: verify all required DOM elements are present ─────────
(() => {
    const checks = [
        ['menu-toggle',      menuToggle],
        ['nav-menu',         navMenu],
        ['lightbox',         lightbox],
        ['lightbox-img',     lightboxImg],
        ['lightbox-caption', lightboxCaption],
        ['lightbox-close',   lightboxClose],
        ['contact-form',     contactForm],
        ['form-success',     formSuccess],
        ['char-counter',     charCounter],
        ['full-name',        fields.name.el],
        ['email',            fields.email.el],
        ['message',          fields.message.el],
    ];
    const missing = checks.filter(([, el]) => !el).map(([id]) => id);
    if (DEBUG) {
        console.group('%c[script.js] Startup element scan', 'color:#1a3a8f;font-weight:bold');
        checks.forEach(([id, el]) => {
            if (el) console.log(`  ✓  #${id}`);
            else    console.error(`  ✗  #${id}  — NOT FOUND in DOM. Check the id attribute.`);
        });
        console.log(missing.length === 0
            ? '  All elements found — script initialized correctly.'
            : `  ${missing.length} element(s) missing — some features will not work.`);
        console.groupEnd();
    }
    if (missing.length) {
        console.error('[script.js] Missing elements:', missing.join(', '),
            '\nSuggestion: confirm the id attributes in index.html match the getElementById calls in script.js.');
    }
})();
