'use strict';

function setupArtworkViewer() {
  const dialog = document.getElementById('lightbox');
  const image = document.getElementById('lightbox-img');
  let previousOverflow = '';

  document.querySelectorAll('.cover-zoom, .zoomable').forEach((trigger) => {
    const isImage = trigger.tagName === 'IMG';

    if (isImage) {
      trigger.tabIndex = 0;
      trigger.setAttribute('role', 'button');
      trigger.setAttribute('aria-label', `Enlarge ${trigger.alt}`);
    }

    function openArtwork() {
      const thumbnail = isImage ? trigger : trigger.querySelector('img');
      image.src = trigger.dataset.full || thumbnail.src;
      image.alt = thumbnail.alt;
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

  dialog.addEventListener('click', (event) => {
    if (event.target !== image) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    image.removeAttribute('src');
  });
}

function setupCountdown() {
  const countdown = document.getElementById('cd');
  const releaseTime = new Date(countdown.dataset.release).getTime();
  const fields = ['cd-d', 'cd-h', 'cd-m', 'cd-s'].map((id) => document.getElementById(id));

  function tick() {
    const remaining = Math.max(0, releaseTime - Date.now());
    const values = [
      Math.floor(remaining / 86400000),
      Math.floor(remaining / 3600000) % 24,
      Math.floor(remaining / 60000) % 60,
      Math.floor(remaining / 1000) % 60,
    ];

    fields.forEach((field, index) => {
      field.textContent = index === 0 && remaining > 0
        ? String(values[index])
        : String(values[index]).padStart(2, '0');
    });

    if (remaining === 0) {
      document.getElementById('dateline').textContent = 'Out now';
    } else {
      window.setTimeout(tick, 1000);
    }
  }

  tick();
}

function setupPresave() {
  const link = document.getElementById('presave');
  // Add the release URL to data-presave in the HTML when it is available.
  if (!link.dataset.presave) return;

  link.href = link.dataset.presave;
  link.target = '_blank';
  link.rel = 'noopener';
  link.hidden = false;
  document.getElementById('presavePending').hidden = true;
}

setupArtworkViewer();
setupCountdown();
setupPresave();
