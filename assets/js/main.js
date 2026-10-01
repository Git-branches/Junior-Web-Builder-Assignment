/* Marci Metzger — homepage interactions.
   Small, dependency-free, and safe to fail: every section is readable
   and every link works with JavaScript switched off. */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Footer year stays current without yearly edits. Hardcoded year in markup
     remains as the no-JS fallback. */
  var yearEl = document.querySelector('[data-year]');
  if (yearEl) { yearEl.textContent = String(new Date().getFullYear()); }

  /* --------------------------- Scroll state: header treatment + back to top */
  var header = document.querySelector('[data-header]');
  var toTop = document.querySelector('[data-to-top]');

  if (header || toTop) {
    var ticking = false;
    var onScroll = function () {
      var y = window.scrollY;
      if (header) { header.classList.toggle('is-stuck', y > 24); }
      /* Show the shortcut only once returning to the top is actually a chore. */
      if (toTop) { toTop.classList.toggle('is-visible', y > window.innerHeight); }
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();
  }

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      /* Put keyboard users back at the start of the page, not adrift at the
         bottom. preventScroll stops focus from racing the smooth scroll. */
      var brand = document.querySelector('.brand');
      if (brand) { brand.focus({ preventScroll: true }); }
    });
  }

  /* ------------------------------------------------------ Mobile menu */
  var toggle = document.querySelector('[data-nav-toggle]');
  var nav = document.getElementById('site-nav');

  if (toggle && nav) {
    var setMenu = function (open) {
      nav.classList.toggle('is-open', open);
      /* Solidify the bar too, so the ivory panel is not hanging off a
         transparent strip with the hero photograph showing through it. */
      if (header) { header.classList.toggle('is-menu-open', open); }
      toggle.setAttribute('aria-expanded', String(open));
      toggle.querySelector('.burger__label').textContent = open ? 'Close' : 'Menu';
      /* Lock background scroll while the menu covers the screen. */
      document.body.style.overflow = open ? 'hidden' : '';
    };

    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });

    /* Close after choosing a destination, so the anchor is actually visible. */
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) { setMenu(false); }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setMenu(false);
        toggle.focus();
      }
    });

    /* Reset state when the desktop layout takes over. */
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 960) { setMenu(false); }
    });
  }

  /* ------------------------------------------------------- Hero entrance */
  /* Held until the curtain lifts, so the staggered sequence is not played out
     of sight behind it. */
  var hero = document.querySelector('[data-hero]');

  var startHero = function () {
    if (!hero) { return; }
    if (reducedMotion.matches) {
      hero.classList.add('is-ready');
    } else {
      /* One painted frame first, so there is a "before" state to animate from. */
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { hero.classList.add('is-ready'); });
      });
    }
  };

  /* ------------------------------------------------------ Entrance loader */
  var loader = document.querySelector('[data-loader]');

  if (!loader || reducedMotion.matches) {
    startHero();
  } else {
    /* Short enough not to be a toll gate, long enough not to flash and vanish.
       MAX is the promise that nobody is ever held here. */
    var MIN_MS = 600;
    var MAX_MS = 2000;
    var startedAt = Date.now();
    var lifted = false;

    var lift = function () {
      if (lifted) { return; }
      lifted = true;
      loader.classList.add('is-done');
      document.body.style.overflow = '';
      startHero();
    };

    document.body.style.overflow = 'hidden';

    var whenReady = function () {
      window.setTimeout(lift, Math.max(0, MIN_MS - (Date.now() - startedAt)));
    };

    if (document.readyState === 'complete') { whenReady(); }
    else { window.addEventListener('load', whenReady); }

    /* Slow image? Dead connection? The page still opens. */
    window.setTimeout(lift, MAX_MS);
  }

  /* ------------------------------------------------- Statistics count-up */
  /* The authored value is restored verbatim at the end, so the figure on screen
     is always exactly the one in the markup — the animation never rounds it. */
  var countUp = function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var authored = el.textContent;
    var duration = 900;
    var startedAt;

    if (isNaN(target)) { return; }

    var tick = function (now) {
      if (!startedAt) { startedAt = now; }
      var progress = Math.min((now - startedAt) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);

      if (progress < 1) {
        el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
        window.requestAnimationFrame(tick);
      } else {
        el.textContent = authored;
      }
    };

    window.requestAnimationFrame(tick);
  };

  /* ------------------------------------------------------- Scroll reveal */
  var revealables = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window) || reducedMotion.matches) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }

        entry.target.classList.add('is-visible');
        Array.prototype.forEach.call(
          entry.target.querySelectorAll('[data-count]'), countUp
        );
        /* Once each — revealing on every pass would turn the page into a toy. */
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });

    Array.prototype.forEach.call(revealables, function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------------ Gallery lightbox */
  /* Upgraded: full-resolution image (not the grid thumbnail), swipe/drag,
     neighbour preloading, thumbnail strip, Home/End keys, click-to-zoom. */
  var gallery = document.querySelector('[data-gallery]');
  var lb = document.querySelector('[data-lb]');

  if (gallery && lb) {
    var shots = Array.prototype.slice.call(gallery.querySelectorAll('.gallery__btn'));
    var lbImg = lb.querySelector('[data-lb-img]');
    var lbCap = lb.querySelector('[data-lb-cap]');
    var lbCount = lb.querySelector('[data-lb-count]');
    var lbClose = lb.querySelector('[data-lb-close]');
    var lbPrev = lb.querySelector('[data-lb-prev]');
    var lbNext = lb.querySelector('[data-lb-next]');
    var lbStage = lb.querySelector('[data-lb-stage]');
    var lbSpinner = lb.querySelector('[data-lb-spinner]');
    var lbThumbs = lb.querySelector('[data-lb-thumbs]');
    var current = 0;
    var lastFocus = null;

    /* Largest URL in a srcset list ("… 480w, … 1024w" -> last entry). Falls
       back to img.src when no srcset is present. */
    var largestFromSrcset = function (img) {
      var set = img.getAttribute('srcset') || '';
      var parts = set.split(',');
      if (!parts.length || !parts[0].trim()) { return img.src; }
      var last = parts[parts.length - 1].trim().split(/\s+/)[0];
      return last || img.src;
    };

    /* Accessible names derived from captions, so markup stays lean. */
    shots.forEach(function (btn, i) {
      var cap = btn.getAttribute('data-caption') || btn.querySelector('img').alt;
      btn.setAttribute('aria-label', 'View photo ' + (i + 1) + ' of ' + shots.length + ': ' + cap);
    });

    /* Thumbnail strip, built once from the same images (small src is fine). */
    var thumbBtns = shots.map(function (btn, i) {
      var img = btn.querySelector('img');
      var t = document.createElement('button');
      t.type = 'button';
      t.className = 'lightbox__thumb';
      t.setAttribute('aria-label', 'Show photo ' + (i + 1) + ' of ' + shots.length);
      var thumb = document.createElement('img');
      thumb.src = img.currentSrc || img.src;
      thumb.alt = '';
      thumb.loading = 'lazy';
      thumb.decoding = 'async';
      t.appendChild(thumb);
      t.addEventListener('click', function () { show(i); });
      if (lbThumbs) { lbThumbs.appendChild(t); }
      return t;
    });

    var preload = function (index) {
      var j = (index + shots.length) % shots.length;
      var img = shots[j].querySelector('img');
      var pre = new Image();
      pre.decoding = 'async';
      pre.src = largestFromSrcset(img);
    };

    var show = function (index) {
      current = (index + shots.length) % shots.length;
      var img = shots[current].querySelector('img');
      var full = largestFromSrcset(img);
      lbStage.classList.remove('is-zoomed');
      lbImg.classList.remove('is-ready');
      if (lbSpinner) { lbSpinner.hidden = false; }
      lbImg.alt = img.alt;
      lbImg.src = full;
      lbCap.textContent = shots[current].getAttribute('data-caption') || '';
      lbCount.textContent = (current + 1) + ' / ' + shots.length;
      thumbBtns.forEach(function (t, i) {
        var on = i === current;
        t.classList.toggle('is-active', on);
        if (on) { t.setAttribute('aria-current', 'true'); }
        else { t.removeAttribute('aria-current'); }
      });
      preload(current + 1);
      preload(current - 1);
    };

    lbImg.addEventListener('load', function () {
      lbImg.classList.add('is-ready');
      if (lbSpinner) { lbSpinner.hidden = true; }
    });

    var openLb = function (index) {
      lastFocus = document.activeElement;
      show(index);
      lb.hidden = false;
      document.body.style.overflow = 'hidden';
      lbClose.focus();
    };

    /* Return focus to the photo actually being viewed, so arrowing through the
       gallery and closing leaves you where you expect, not where you started. */
    var closeLb = function () {
      lb.hidden = true;
      document.body.style.overflow = '';
      lbImg.removeAttribute('src');
      lbImg.classList.remove('is-ready');
      if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
      else { shots[current].focus(); }
    };

    shots.forEach(function (btn, i) {
      btn.addEventListener('click', function () { openLb(i); });
    });

    lbPrev.addEventListener('click', function () { show(current - 1); });
    lbNext.addEventListener('click', function () { show(current + 1); });
    lbClose.addEventListener('click', closeLb);

    /* Click-to-zoom for detail (tile grout, mountain ridges). Toggles a
       scaled state; scrolls within the stage when zoomed. */
    lbImg.addEventListener('click', function () {
      lbStage.classList.toggle('is-zoomed');
    });

    /* Swipe: touch + mouse drag on the stage. 40px threshold, horizontal only
       so vertical page gestures are left alone. */
    var startX = null;
    var dragging = false;
    var onStart = function (x) { startX = x; dragging = true; };
    var onEnd = function (x) {
      if (!dragging || startX === null) { return; }
      var dx = x - startX;
      if (Math.abs(dx) > 40) { show(dx < 0 ? current + 1 : current - 1); }
      startX = null;
      dragging = false;
    };

    lbStage.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) { onStart(e.touches[0].clientX); }
    }, { passive: true });
    lbStage.addEventListener('touchend', function (e) {
      if (e.changedTouches.length === 1) { onEnd(e.changedTouches[0].clientX); }
    }, { passive: true });
    lbStage.addEventListener('mousedown', function (e) { onStart(e.clientX); });
    lbStage.addEventListener('mouseup', function (e) { onEnd(e.clientX); });

    /* Clicking the backdrop — but not the photo or the controls — closes it. */
    lb.addEventListener('click', function (event) {
      if (event.target === lb) { closeLb(); }
    });

    document.addEventListener('keydown', function (event) {
      if (lb.hidden) { return; }
      if (event.key === 'Escape') { closeLb(); }
      else if (event.key === 'ArrowLeft') { show(current - 1); }
      else if (event.key === 'ArrowRight') { show(current + 1); }
      else if (event.key === 'Home') { event.preventDefault(); show(0); }
      else if (event.key === 'End') { event.preventDefault(); show(shots.length - 1); }
      /* Keep tabbing inside the dialog while it is open. */
      else if (event.key === 'Tab') {
        var focusable = lb.querySelectorAll('button');
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
  }

  /* ------------------------------------------------------ FAQ accordion */
  /* Single-open: opening one answer closes the rest. CSS keeps answers
     visible without JS; with JS they collapse until opened. */
  var faq = document.querySelector('[data-faq]');

  if (faq) {
    var items = Array.prototype.slice.call(faq.querySelectorAll('.faq__item'));

    var setItem = function (item, open) {
      item.classList.toggle('is-open', open);
      item.querySelector('.faq__btn').setAttribute('aria-expanded', String(open));
    };

    items.forEach(function (item) {
      var btn = item.querySelector('.faq__btn');
      btn.addEventListener('click', function () {
        var willOpen = !item.classList.contains('is-open');
        items.forEach(function (other) { setItem(other, false); });
        setItem(item, willOpen);
      });
    });

    /* Open the first question by default so the section never reads as empty. */
    if (items.length) { setItem(items[0], true); }
  }

  /* --------------------------------------------------- Property search */
  var searchForm = document.querySelector('[data-search-form]');

  if (searchForm) {
    searchForm.addEventListener('submit', function (event) {
      event.preventDefault();
      /* No MLS back end lives in this redesign, so hand the visitor over to
         the live listings page rather than pretending to return results.
         Carry the chosen filters in the URL so nothing the visitor picked
         is silently dropped — harmless if the destination ignores them,
         and ready if an MLS search is ever wired up. */
      var get = function (name) {
        var field = searchForm.elements[name];
        return field ? String(field.value || '').trim() : '';
      };
      /* Prices are free text: strip currency formatting, keep only a number. */
      var num = function (raw) {
        var cleaned = raw.replace(/[$,\s]/g, '');
        return cleaned !== '' && isFinite(cleaned) ? cleaned : '';
      };

      var params = new URLSearchParams();
      var location = get('location');
      var type = get('type');
      var beds = get('beds');
      var baths = get('baths');
      var min = num(get('min'));
      var max = num(get('max'));
      var sort = get('sort');

      /* Friendly fix: a reversed range is almost always a typo, not intent. */
      if (min !== '' && max !== '' && parseFloat(min) > parseFloat(max)) {
        var swap = min; min = max; max = swap;
      }

      if (location) { params.append('location', location); }
      if (type) { params.append('type', type); }
      if (beds) { params.append('beds', beds); }
      if (baths) { params.append('baths', baths); }
      if (min !== '') { params.append('min', min); }
      if (max !== '') { params.append('max', max); }
      if (sort) { params.append('sort', sort); }

      var base = 'https://marcimetzger.com/listings';
      var query = params.toString();
      var url = query ? base + '?' + query : base;
      var note = document.getElementById('search-note');
      var win = window.open(url, '_blank', 'noopener');
      if (win) { win.opener = null; }
      if (note) {
        note.textContent = win
          ? 'Opening Marci\u2019s live listings in a new tab\u2026'
          : 'Your browser blocked the new tab \u2014 see Marci\u2019s live listings at ' + url;
      }
    });
  }

  /* ------------------------------------------------------ Contact form */
  var contactForm = document.querySelector('[data-contact-form]');

  if (contactForm) {
    var status = contactForm.querySelector('[data-form-status]');
    var submitBtn = contactForm.querySelector('button[type="submit"]');
    var endpoint = (contactForm.getAttribute('action') || '').trim();

    var setStatus = function (message, state) {
      status.textContent = message;
      status.setAttribute('data-state', state || '');
    };

    var flag = function (field, invalid) {
      if (invalid) { field.setAttribute('aria-invalid', 'true'); }
      else { field.removeAttribute('aria-invalid'); }
    };

    /* Clear the error flag as soon as the visitor fixes the field. */
    Array.prototype.forEach.call(
      contactForm.querySelectorAll('input, textarea'),
      function (field) {
        field.addEventListener('input', function () { flag(field, false); });
      }
    );

    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();

      var nameField = contactForm.elements.name;
      var emailField = contactForm.elements.email;
      var messageField = contactForm.elements.message;
      var name = nameField.value.trim();
      var email = emailField.value.trim();
      var message = messageField.value.trim();

      flag(nameField, !name);
      flag(emailField, !email);
      flag(messageField, !message);

      if (!name || !email || !message) {
        setStatus('Please fill in your name, email and message so Marci can reply.', 'error');
        (!name ? nameField : !email ? emailField : messageField).focus();
        return;
      }

      /* Deliberately loose: just enough to catch a typo, not to police what a
         valid address may look like. */
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        flag(emailField, true);
        setStatus('That email address looks incomplete — could you check it?', 'error');
        emailField.focus();
        return;
      }

      if (!endpoint) {
        setStatus('Thanks, ' + name + '. This form is not connected to a mail service yet — ' +
                  'call (206) 919-6886 and Marci will get right back to you.', '');
        return;
      }

      submitBtn.disabled = true;
      setStatus('Sending…', '');

      fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(contactForm),
      }).then(function (response) {
        if (!response.ok) { throw new Error('Bad response'); }
        contactForm.reset();
        setStatus('Thanks, ' + name + '. Your message is on its way — Marci will be in touch soon.', 'ok');
      }).catch(function () {
        setStatus('Sorry, that did not send. Please call (206) 919-6886 and Marci will help you directly.', 'error');
      }).then(function () {
        submitBtn.disabled = false;
      });
    });
  }
})();
