document.addEventListener('DOMContentLoaded', () => {
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
  }

  // ============== ENVELOPE OPENING ANIMATION ==============
  const envelopeOverlay = document.querySelector('.envelope-overlay');
  const envelopeScene = document.querySelector('.envelope-scene');
  const envelopeContainer = document.querySelector('.envelope-container');
  let envelopeOpened = false;

  const closeEnvelope = () => {
    if (envelopeOverlay && !envelopeOverlay.classList.contains('hidden')) {
      envelopeOverlay.classList.add('hidden');
    }
  };

  const ENVELOPE_OPEN_HOLD_MS = 4000;

  const openEnvelope = () => {
    if (envelopeOpened) return;
    envelopeOpened = true;

    if (envelopeScene) envelopeScene.classList.add('is-opening');
    if (envelopeContainer) envelopeContainer.classList.add('is-opening');

    // Keep the content open long enough to read: exactly 4 seconds.
    setTimeout(closeEnvelope, ENVELOPE_OPEN_HOLD_MS);
  };

  if (envelopeOverlay) {
    if (envelopeContainer) {
      envelopeContainer.addEventListener('click', openEnvelope);
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !envelopeOverlay.classList.contains('hidden')) {
        openEnvelope();
      }
    });
  }

  // ============== MUSIC PLAYER ==============
  const musicButton = document.querySelector('.music-player-btn');
  const bgMusic = document.getElementById('bgMusic');
  let isPlaying = false;

  if (musicButton && bgMusic) {
    musicButton.addEventListener('click', () => {
      if (isPlaying) {
        bgMusic.pause();
        musicButton.classList.remove('playing');
        isPlaying = false;
      } else {
        bgMusic.play().catch(err => console.log('Audio play failed:', err));
        musicButton.classList.add('playing');
        isPlaying = true;
      }
    });

    bgMusic.addEventListener('ended', () => {
      bgMusic.currentTime = 0;
      bgMusic.play().catch(err => console.log('Audio play failed:', err));
    });
  }

  // ============== COVER / INTRO SCREEN ==============
  // This logic no longer depends on GSAP being loaded - it always works.
  const introScreen = document.querySelector('.intro-screen');
  const coverCard = document.querySelector('.cover-card');
  const openBtn = document.querySelector('.open-btn');

  const closeCover = () => {
    if (!introScreen || introScreen.classList.contains('is-closed')) return;
    introScreen.classList.add('is-closed');

    if (hasGsap && coverCard) {
      const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
      tl.to(coverCard, {
        y: -110,
        rotateX: 16,
        scale: 0.96,
        autoAlpha: 0,
        duration: 1.2
      }).to(
        introScreen,
        {
          autoAlpha: 0,
          duration: 0.8,
          onComplete: () => {
            introScreen.style.display = 'none';
          }
        },
        '-=0.6'
      );
    } else {
      // Plain CSS fallback - .is-closed already handles opacity/visibility via CSS
      setTimeout(() => {
        introScreen.style.display = 'none';
      }, 800);
    }
  };

  openBtn?.addEventListener('click', closeCover);
  window.addEventListener(
    'scroll',
    () => {
      if (window.scrollY > 20 && introScreen && !introScreen.classList.contains('is-closed')) {
        closeCover();
      }
    },
    { once: true }
  );

  if (hasGsap) {
    const introItems = gsap.utils.toArray('.cover-monogram, .cover-title, .cover-subtitle, .cover-date, .open-btn');
    const introTimeline = gsap.timeline({ defaults: { ease: 'power4.out' } });
    introTimeline
      .fromTo(
        '.cover-frame',
        { autoAlpha: 0, scale: 0.9, y: 42, rotateX: 18, filter: 'blur(10px)' },
        { autoAlpha: 1, scale: 1, y: 0, rotateX: 0, filter: 'blur(0px)', duration: 1.35, ease: 'elastic.out(1, 0.55)' }
      )
      .fromTo(
        introItems,
        { autoAlpha: 0, y: 26, filter: 'blur(8px)' },
        { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.9, stagger: 0.1, ease: 'power3.out' },
        '-=0.9'
      );

    gsap.to('.page-bg', {
      yPercent: -12,
      ease: 'none',
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: true
      }
    });
  }

  // ============== REVEAL ANIMATIONS FOR SECTIONS ==============
  // Critical fix: if GSAP fails to load, sections must still become visible,
  // otherwise the whole page stays blank (opacity: 0 from the .reveal CSS class).
  if (hasGsap) {
    gsap.utils.toArray('.reveal').forEach((section) => {
      const animatedItems = Array.from(
        section.querySelectorAll(
          '.section-head, .blessing-text, .countdown-grid, .location-name, .map-button, .copy-card, .field-group, .guest-counter, .submit-btn, .thank-you'
        )
      );

      // Always make the section itself visible even if no sub-items matched
      gsap.set(section, { autoAlpha: 1 });

      if (!animatedItems.length) return;

      gsap.fromTo(
        animatedItems,
        { y: 42, autoAlpha: 0, rotateX: 8, filter: 'blur(8px)' },
        {
          y: 0,
          autoAlpha: 1,
          rotateX: 0,
          filter: 'blur(0px)',
          duration: 1.0,
          stagger: 0.16,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 82%'
          }
        }
      );
    });
  } else {
    // Fallback: no GSAP available - just show everything via IntersectionObserver
    // (or immediately, if IntersectionObserver isn't available either).
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'none';
              entry.target.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      revealEls.forEach((el) => observer.observe(el));
    } else {
      revealEls.forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    }
  }

  // ============== COUNTDOWN TIMER ==============
  const targetDate = new Date('2026-09-14T18:30:00+06:00').getTime();
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');

  function updateCountdown() {
    const now = Date.now();
    const distance = targetDate - now;

    if (distance <= 0) {
      if (daysEl) daysEl.textContent = '00';
      if (hoursEl) hoursEl.textContent = '00';
      if (minutesEl) minutesEl.textContent = '00';
      if (secondsEl) secondsEl.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((distance / (1000 * 60)) % 60);
    const seconds = Math.floor((distance / 1000) % 60);

    const values = [
      { el: daysEl, value: days },
      { el: hoursEl, value: hours },
      { el: minutesEl, value: minutes },
      { el: secondsEl, value: seconds }
    ];

    values.forEach(({ el, value }) => {
      if (!el) return;
      const formatted = String(value).padStart(2, '0');
      if (el.dataset.value !== formatted) {
        if (hasGsap) {
          gsap.to(el, {
            autoAlpha: 0.3,
            duration: 0.12,
            y: -4,
            onComplete: () => {
              el.textContent = formatted;
              gsap.fromTo(
                el,
                { autoAlpha: 0.3, y: 6 },
                { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power2.out' }
              );
            }
          });
        } else {
          el.textContent = formatted;
        }
        el.dataset.value = formatted;
      }
    });
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // ============== COPY TO CLIPBOARD ==============
  const copyButton = document.querySelector('.copy-button');
  const phoneNumber = document.querySelector('.phone-number');
  const copyToast = document.getElementById('copyToast');

  function showToast() {
    if (!copyToast) return;
    copyToast.classList.add('show');
    setTimeout(() => {
      copyToast.classList.remove('show');
    }, 2000);
  }

  if (copyButton && phoneNumber) {
    copyButton.addEventListener('click', async () => {
      const text = phoneNumber.textContent.trim();

      if (hasGsap) {
        gsap.fromTo(
          copyButton,
          { scale: 1 },
          { scale: 1.15, duration: 0.15, ease: 'power2.out', yoyo: true, repeat: 1 }
        );
      }

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          const tempInput = document.createElement('input');
          tempInput.value = text;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
        }
        showToast();
      } catch (error) {
        console.error('Номер көчүрүүгө мүмкүн эмес:', error);
        showToast();
      }
    });
  }

  // ============== GUEST COUNTER ==============
  const counterValue = document.querySelector('.counter-value');
  const hiddenGuestCount = document.getElementById('guestCount');
  let guestCount = Number(hiddenGuestCount?.value || 2);

  const updateGuestCounter = (newValue) => {
    guestCount = Math.max(1, newValue);
    if (counterValue) {
      if (hasGsap) {
        gsap.fromTo(
          counterValue,
          { scale: 1.2, autoAlpha: 0.6 },
          { scale: 1, autoAlpha: 1, duration: 0.25, ease: 'power2.out' }
        );
      }
      counterValue.textContent = String(guestCount);
    }
    if (hiddenGuestCount) {
      hiddenGuestCount.value = String(guestCount);
    }
  };

  document.querySelector('.counter-btn.minus')?.addEventListener('click', () => updateGuestCounter(guestCount - 1));
  document.querySelector('.counter-btn.plus')?.addEventListener('click', () => updateGuestCounter(guestCount + 1));

  // ============== TELEGRAM FORM SUBMISSION ==============
  const form = document.getElementById('rsvpForm');
  const thankYouBlock = document.getElementById('thankYou');
  const formStatus = document.getElementById('formStatus');

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const nameInput = document.getElementById('guestName');
      const attendanceValue = document.querySelector('input[name="attendance"]:checked')?.value || 'Белгисиз';
      const messageValue = document.getElementById('message')?.value || '';
      const guestsCount = hiddenGuestCount?.value || '1';

      if (!nameInput || !nameInput.value.trim()) {
        formStatus.textContent = 'Сиздин аты-жөнүңүздү жазыңыз.';
        nameInput.focus();
        return;
      }

      const botToken = '8741636484:AAEwEt0gk3DoOWMd8pm-Rwwf5eoMHCLexCg';
      const chatId = '6956101864';
      const submitButton = form.querySelector('.submit-btn');

      const payload = {
        chat_id: chatId,
        parse_mode: 'Markdown',
        text: `🎉 *Кыз узатууга жаңы жооп!*\n\n👤 *Аты-жөнү:* ${nameInput.value.trim()}\n❓ *Катышуусу:* ${attendanceValue}\n👥 *Адам саны:* ${guestsCount}\n💬 *Каалоо-тилек:* ${messageValue || 'Жок'}`
      };

      try {
        submitButton.disabled = true;
        submitButton.textContent = 'Жөнөтүлүүдө...';
        formStatus.textContent = '';

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.description || 'Жөнөтүү катасы');
        }

        form.classList.add('hidden');
        thankYouBlock.classList.remove('hidden');
        thankYouBlock.innerHTML = '<h4>Рахмат! Сиздин жообуңуз кабыл алынды. 14-сентябрда күтөбүз!</h4>';
      } catch (error) {
        console.error('Telegram error:', error);
        formStatus.textContent = 'Жөнөтүү мүмкүн эмес. Кайра аракет кылып көрүңүз.';
        submitButton.disabled = false;
        submitButton.textContent = 'Жөнөтүү';
      }
    });
  }
});