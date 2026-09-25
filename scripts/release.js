'use strict';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const navigationToggle = document.getElementById('navtoggle');
document.querySelectorAll('nav a').forEach((link) => {
  link.addEventListener('click', () => {
    if (navigationToggle) navigationToggle.checked = false;
  });
});

const dialog = document.querySelector('.artwork-dialog');
if (dialog) {
  const fullImage = dialog.querySelector('img');
  let opener;
  let previousOverflow;

  document.querySelectorAll('.artwork-button, .zoomable').forEach((trigger) => {
    const isImage = trigger.tagName === 'IMG';
    if (isImage) {
      trigger.tabIndex = 0;
      trigger.setAttribute('role', 'button');
      trigger.setAttribute('aria-label', `Enlarge ${trigger.alt}`);
    }
    function openArtwork() {
      const thumbnail = isImage ? trigger : trigger.querySelector('img');
      opener = trigger;
      fullImage.src = trigger.dataset.full || thumbnail.src;
      fullImage.alt = thumbnail.alt;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
    }
    trigger.addEventListener('click', openArtwork);
    if (isImage) {
      trigger.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openArtwork();
        }
      });
    }
  });
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    fullImage.removeAttribute('src');
    opener?.focus();
  });
}

// Closing a panel must not leave audio playing behind it.
function pauseVideosIn(container) {
  container.querySelectorAll('video').forEach((video) => {
    if (!video.paused) video.pause();
  });
}

// Every gallery manages its own scroll position; images remain accessible without JavaScript.
document.querySelectorAll('[data-gallery]').forEach((gallery) => {
  const track = gallery.querySelector('.gallery-track');
  const slides = [...track.querySelectorAll('.gallery-slide')];
  const previous = gallery.querySelector('[data-prev]');
  const next = gallery.querySelector('[data-next]');
  const count = gallery.querySelector('.gallery-count');
  let current = 0;
  let pendingFrame;

  function update() {
    const width = track.clientWidth;
    if (!width) return; // panel still collapsed: measure once it becomes visible
    const previousIndex = current;
    current = Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / width)));
    if (current !== previousIndex) {
      slides.forEach((slide, index) => {
        if (index !== current) pauseVideosIn(slide);
      });
    }
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  }
  function goTo(index) {
    const destination = Math.max(0, Math.min(slides.length - 1, index));
    track.scrollTo({ left: destination * track.clientWidth, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }
  previous.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));
  track.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(pendingFrame);
    pendingFrame = requestAnimationFrame(update);
  }, { passive: true });
  new ResizeObserver(update).observe(track);
  update();
});

if (reducedMotion.matches) {
  document.querySelectorAll('video[autoplay]').forEach((video) => {
    video.pause();
    video.removeAttribute('autoplay');
    video.controls = true;
  });
}


// Chapter panels: each card drives its own panel, so future chapters reuse the pattern.
document.querySelectorAll('[data-chapter-toggle]').forEach((toggle) => {
  const panel = document.getElementById(toggle.dataset.chapterToggle);
  if (!panel) return;
  const label = toggle.querySelector('.go');
  function syncLabel() {
    if (!label) return;
    const open = toggle.getAttribute('aria-expanded') === 'true';
    label.textContent = open ? label.dataset.labelClose : label.dataset.labelOpen;
  }
  syncLabel(); // keeps the markup and the state from drifting apart
  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    panel.hidden = isOpen;
    if (isOpen) pauseVideosIn(panel);
    syncLabel();
    if (!isOpen) {
      panel.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'nearest' });
    }
  });
});

// Behind the scenes: each stage opens on demand, keeping the section compact when closed.
document.querySelectorAll('.bts-toggle').forEach((toggle) => {
  const body = document.getElementById(toggle.getAttribute('aria-controls'));
  if (!body) return;
  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    body.hidden = isOpen;
    if (isOpen) pauseVideosIn(body);
  });
});

// The hero video is desktop-only: phone visitors coming from a link in bio get the poster,
// which saves them a 3 MB download before they even reach the music video.
var heroVideo = document.querySelector('.hero video.bg[data-src]');
if (heroVideo && window.matchMedia('(min-width: 761px)').matches && !reducedMotion.matches) {
  var heroSource = document.createElement('source');
  heroSource.src = heroVideo.dataset.src;
  heroSource.type = 'video/mp4';
  heroVideo.appendChild(heroSource);
  heroVideo.load();
}
