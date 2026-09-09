/* Marci Metzger — homepage interactions.
   Small, dependency-free, and safe to fail: every section is readable
   and every link works with JavaScript switched off. */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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
  var gallery = document.querySelector('[data-gallery]');
  var lb = document.querySelector('[data-lb]');

  if (gallery && lb) {
    var shots = Array.prototype.slice.call(gallery.querySelectorAll('.gallery__btn'));
    var lbImg = lb.querySelector('[data-lb-img]');
    var lbCap = lb.querySelector('[data-lb-cap]');
    var lbCount = lb.querySelector('[data-lb-count]');
    var lbClose = lb.querySelector('[data-lb-close]');
    var current = 0;

    var show = function (index) {
      current = (index + shots.length) % shots.length;
      var img = shots[current].querySelector('img');
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = shots[current].getAttribute('data-caption') || '';
      lbCount.textContent = (current + 1) + ' / ' + shots.length;
    };

    var openLb = function (index) {
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
      lbImg.src = '';
      shots[current].focus();
    };

    shots.forEach(function (btn, i) {
      btn.addEventListener('click', function () { openLb(i); });
    });

    lb.querySelector('[data-lb-prev]').addEventListener('click', function () { show(current - 1); });
    lb.querySelector('[data-lb-next]').addEventListener('click', function () { show(current + 1); });
    lbClose.addEventListener('click', closeLb);

    /* Clicking the backdrop — but not the photo or the controls — closes it. */
    lb.addEventListener('click', function (event) {
      if (event.target === lb || event.target.classList.contains('lightbox__figure')) { closeLb(); }
    });

    document.addEventListener('keydown', function (event) {
      if (lb.hidden) { return; }
      if (event.key === 'Escape') { closeLb(); }
      if (event.key === 'ArrowLeft') { show(current - 1); }
      if (event.key === 'ArrowRight') { show(current + 1); }
      /* Keep tabbing inside the dialog while it is open. */
      if (event.key === 'Tab') {
        var focusable = lb.querySelectorAll('button');
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
  }

  /* --------------------------------------------------- Property search */
  var searchForm = document.querySelector('[data-search-form]');

  if (searchForm) {
    searchForm.addEventListener('submit', function (event) {
      event.preventDefault();
      /* No MLS back end lives in this redesign, so hand the visitor over to
         the live listings page rather than pretending to return results. */
      window.open('https://marcimetzger.com/listings', '_blank', 'noopener');
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
