/* Marci Metzger — homepage interactions.
   Small, dependency-free, and safe to fail: every section is readable
   and every link works with JavaScript switched off. */
(function () {
  'use strict';

  /* ---------------------------------------------- Header scroll transition */
  var header = document.querySelector('[data-header]');

  if (header) {
    var ticking = false;
    var setStuck = function () {
      header.classList.toggle('is-stuck', window.scrollY > 24);
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(setStuck); }
    }, { passive: true });
    setStuck();
  }

  /* ------------------------------------------------------ Mobile menu */
  var toggle = document.querySelector('[data-nav-toggle]');
  var nav = document.getElementById('site-nav');

  if (toggle && nav) {
    var setMenu = function (open) {
      nav.classList.toggle('is-open', open);
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

  /* ------------------------------------------------- Scroll reveal */
  var revealables = document.querySelectorAll('.reveal');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!('IntersectionObserver' in window) || reduced) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

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

    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();

      var name = contactForm.elements.name.value.trim();
      var email = contactForm.elements.email.value.trim();

      if (!name || !email) {
        status.textContent = 'Please add your name and email so Marci can reply.';
        (name ? contactForm.elements.email : contactForm.elements.name).focus();
        return;
      }

      status.textContent =
        'Thanks, ' + name + '. This demo form is not wired to a mail service yet — ' +
        'call (206) 919-6886 and Marci will get right back to you.';
    });
  }
})();
