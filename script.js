document.addEventListener('DOMContentLoaded', () => {
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
  }

  // ============== ENVELOPE OPENING ANIMATION ==============
  const envelopeOverlay = document.querySelector('.envelope-overlay');
  const envelopeScene = document.querySelector('.envelope-scene');
  const envelopeContainer = document.querySelector('.envelope-container');
  const musicButton = document.querySelector('.music-player-btn');
  const bgMusic = document.getElementById('bgMusic');
  let envelopeOpened = false;
  let isPlaying = false;

  const updateMusicButton = () => {
    if (!musicButton) return;
    const label = isPlaying ? 'Музыканы өчүрүү' : 'Музыканы ойнотуу';
    musicButton.classList.toggle('playing', isPlaying);
    musicButton.title = label;
    musicButton.setAttribute('aria-label', label);
    musicButton.setAttribute('aria-pressed', String(isPlaying));
  };

  const playMusic = () => {
    if (!bgMusic || isPlaying) return;

    bgMusic.play()
      .then(() => {
        isPlaying = true;
        updateMusicButton();
      })
      .catch((err) => console.log('Audio play failed:', err));
  };

  const stopMusic = () => {
    if (!bgMusic) return;
    bgMusic.pause();
    isPlaying = false;
    updateMusicButton();
  };

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
    playMusic();

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
  if (musicButton && bgMusic) {
    musicButton.addEventListener('click', () => {
      if (isPlaying) {
        stopMusic();
      } else {
        playMusic();
      }
    });

    bgMusic.addEventListener('ended', () => {
      bgMusic.currentTime = 0;
      isPlaying = false;
      playMusic();
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
          '.section-head, .blessing-text, .poem-text, .countdown-grid, .location-name, .map-button, .copy-card, .field-group, .guest-counter, .submit-btn, .thank-you'
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
  const targetDate = new Date('2026-09-12T11:00:00+06:00').getTime();
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
      
      // 🔹 Добавьте сюда новые Chat ID через запятую
      const chatIds = ['6956101864', '1253930507']; 

      const submitButton = form.querySelector('.submit-btn');

      try {
        submitButton.disabled = true;
        submitButton.textContent = 'Жөнөтүлүүдө...';
        formStatus.textContent = '';

        // 🔹 Создаем массив запросов для каждого Chat ID
        const requests = chatIds.map((chatId) => {
          const payload = {
            chat_id: chatId,
            parse_mode: 'Markdown',
            text: `🎉 *Кыз узатууга жаңы жооп!*\n\n👤 *Аты-жөнү:* ${nameInput.value.trim()}\n❓ *Катышуусу:* ${attendanceValue}\n👥 *Адам саны:* ${guestsCount}\n💬 *Каалоо-тилек:* ${messageValue || 'Жок'}`
          };

          return fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          }).then(res => res.json());
        });

        // 🔹 Отправляем во все чаты параллельно
        const results = await Promise.all(requests);

        // Проверяем, прошла ли отправка хотя бы в один чат
        const isSuccess = results.some(result => result.ok);

        if (!isSuccess) {
          throw new Error('Бир дагы чатка жөнөтүлгөн жок');
        }

        form.classList.add('hidden');
        thankYouBlock.classList.remove('hidden');
        thankYouBlock.innerHTML = '<h4>Рахмат! Сиздин жообуңуз кабыл алынды. 12-сентябрда күтөбүз!</h4>';
      } catch (error) {
        console.error('Telegram error:', error);
        formStatus.textContent = 'Жөнөтүү мүмкүн эмес. Кайра аракет кылып көрүңүз.';
        submitButton.disabled = false;
        submitButton.textContent = 'Жөнөтүү';
      }
    });
  }
});

/* Duplicate initialization block removed. The handler above owns the page. */
/*
  // GSAP ScrollTrigger Setup
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('.reveal').forEach((elem) => {
      gsap.fromTo(
        elem,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: elem,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    });
  } else {
    // Fallback IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('.reveal').forEach((elem) => observer.observe(elem));
  }

  // Envelope Opening Sequence & Audio Trigger
  const envelopeOverlay = document.querySelector('.envelope-overlay');
  const envelopeScene = document.querySelector('.envelope-scene');
  const envelopeContainer = document.querySelector('.envelope-container');
  const introScreen = document.querySelector('.intro-screen');
  const bgMusic = document.getElementById('bgMusic');
  const musicBtn = document.querySelector('.music-player-btn');

  let isPlaying = false;

  function toggleMusic(play) {
    if (play) {
      bgMusic
        .play()
        .then(() => {
          isPlaying = true;
          musicBtn.classList.add('playing');
          musicBtn.setAttribute('aria-pressed', 'true');
        })
        .catch(() => {
          isPlaying = false;
          musicBtn.classList.remove('playing');
          musicBtn.setAttribute('aria-pressed', 'false');
        });
    } else {
      bgMusic.pause();
      isPlaying = false;
      musicBtn.classList.remove('playing');
      musicBtn.setAttribute('aria-pressed', 'false');
    }
  }

  musicBtn.addEventListener('click', () => {
    toggleMusic(!isPlaying);
  });

  if (envelopeContainer) {
    envelopeContainer.addEventListener('click', () => {
      envelopeScene.classList.add('is-opening');
      envelopeContainer.classList.add('is-opening');

      // Attempt audio playback on user gesture
      toggleMusic(true);

      setTimeout(() => {
        envelopeOverlay.classList.add('hidden');
      }, 1800);
    });
  }

  // Backup Open Button in Intro Screen
  const openBtn = document.querySelector('.open-btn');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      introScreen.classList.add('hidden');
      toggleMusic(true);
    });
  }

  // Countdown Timer Target: Sept 12, 2026, 11:00:00
  const targetDate = new Date('2026-09-12T11:00:00+06:00').getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference < 0) {
      document.getElementById('days').innerText = '00';
      document.getElementById('hours').innerText = '00';
      document.getElementById('minutes').innerText = '00';
      document.getElementById('seconds').innerText = '00';
      return;
    }

    const d = Math.floor(difference / (1000 * 60 * 60 * 24));
    const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((difference % (1000 * 60)) / 1000);

    document.getElementById('days').innerText = String(d).padStart(2, '0');
    document.getElementById('hours').innerText = String(h).padStart(2, '0');
    document.getElementById('minutes').innerText = String(m).padStart(2, '0');
    document.getElementById('seconds').innerText = String(s).padStart(2, '0');
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();

  // Guest Counter Controls
  const minusBtn = document.querySelector('.counter-btn.minus');
  const plusBtn = document.querySelector('.counter-btn.plus');
  const counterValue = document.querySelector('.counter-value');
  const guestCountInput = document.getElementById('guestCount');

  if (minusBtn && plusBtn) {
    minusBtn.addEventListener('click', () => {
      let val = parseInt(guestCountInput.value, 10) || 1;
      if (val > 1) {
        val--;
        guestCountInput.value = val;
        counterValue.innerText = val;
      }
    });

    plusBtn.addEventListener('click', () => {
      let val = parseInt(guestCountInput.value, 10) || 1;
      if (val < 10) {
        val++;
        guestCountInput.value = val;
        counterValue.innerText = val;
      }
    });
  }

  // Copy Phone Number
  const copyBtn = document.querySelector('.copy-button');
  const phoneSpan = document.querySelector('.phone-number');
  const copyToast = document.getElementById('copyToast');

  if (copyBtn && phoneSpan) {
    copyBtn.addEventListener('click', () => {
      const rawNumber = phoneSpan.innerText.replace(/[^\d+]/g, '');
      navigator.clipboard.writeText(rawNumber).then(() => {
        copyToast.classList.add('show');
        setTimeout(() => copyToast.classList.remove('show'), 2500);
      });
    });
  }

  // RSVP Form Handler via Telegram Bot or Webhook
  const rsvpForm = document.getElementById('rsvpForm');
  const formStatus = document.getElementById('formStatus');
  const thankYou = document.getElementById('thankYou');

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const guestName = document.getElementById('guestName').value.trim();
      const guestCount = document.getElementById('guestCount').value;
      const attendance = document.querySelector('input[name="attendance"]:checked')?.value;
      const message = document.getElementById('message').value.trim();

      if (!guestName) {
        formStatus.style.color = '#d9534f';
        formStatus.innerText = 'Сураныч, аты-жөнүңүздү жазыңыз.';
        return;
      }

      formStatus.style.color = 'var(--gold-deep)';
      formStatus.innerText = 'Жөнөтүлүүдө...';

      // Setup payload matching Telegram Bot API or custom endpoint
      const payload = {
        name: guestName,
        guests: guestCount,
        attendance: attendance,
        message: message,
      };

      try {
        // Placeholder API URL — connect your endpoint/Telegram bot fetch here
        await fetch('YOUR_TELEGRAM_BOT_WEBHOOK_URL', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        // Visual feedback
        rsvpForm.classList.add('hidden');
        thankYou.classList.remove('hidden');
      } catch (err) {
        formStatus.style.color = '#d9534f';
        formStatus.innerText = 'Ката чыкты. Экинчи кайталап көрүңүз.';
      }
    });
  }
});
*/