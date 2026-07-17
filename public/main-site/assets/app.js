(() => {
  'use strict';

  const CONFIG = {
    lineUrl: '', // Set when the official LINE OA URL is available.
    phone: '+66804803802',
    formEndpoint: '',
    defaultLang: 'en'
  };

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];
  const toast = qs('#site-toast');

  const storage = {
    get(type, key) {
      try { return window[type].getItem(key); } catch (_) { return null; }
    },
    set(type, key, value) {
      try { window[type].setItem(key, value); } catch (_) {}
    }
  };

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 3200);
  }

  // Language
  let lang = storage.get('localStorage', 'sccc-lang') || CONFIG.defaultLang;
  const body = document.body;

  function applyLang(next) {
    lang = next === 'th' ? 'th' : 'en';
    storage.set('localStorage', 'sccc-lang', lang);
    document.documentElement.lang = lang;
    qsa('[data-en][data-th]').forEach(el => {
      const value = el.dataset[lang];
      if (value !== undefined) el.textContent = value;
    });
    qsa('[data-en-placeholder][data-th-placeholder]').forEach(el => {
      el.placeholder = lang === 'th' ? el.dataset.thPlaceholder : el.dataset.enPlaceholder;
    });
    qsa('[data-en-aria][data-th-aria]').forEach(el => {
      el.setAttribute('aria-label', lang === 'th' ? el.dataset.thAria : el.dataset.enAria);
    });
    qsa('.lang-toggle').forEach(btn => {
      btn.textContent = lang === 'en' ? 'TH' : 'EN';
      btn.setAttribute('aria-label', lang === 'en' ? 'Switch to Thai' : 'เปลี่ยนเป็นภาษาอังกฤษ');
    });
    if (body.dataset.titleEn && body.dataset.titleTh) {
      document.title = lang === 'th' ? body.dataset.titleTh : body.dataset.titleEn;
    }
  }

  qsa('.lang-toggle').forEach(btn => btn.addEventListener('click', () => applyLang(lang === 'en' ? 'th' : 'en')));
  applyLang(lang);

  // Mobile menu
  const menuToggle = qs('.menu-toggle');
  const nav = qs('.main-nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(open));
      body.classList.toggle('no-scroll', open);
    });
    qsa('a', nav).forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      body.classList.remove('no-scroll');
    }));
  }

  // Active navigation
  const current = body.dataset.page || 'home';
  qsa(`[data-nav="${current}"]`).forEach(a => a.classList.add('active'));

  // Header reveal / category slot behaviour
  const header = qs('.site-header');
  const mobileCta = qs('.mobile-cta');
  const mobileCtaPages = new Set(['home', 'memberships', 'inside', 'dinner', 'faq']);
  let lastY = window.scrollY;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (header && body.classList.contains('has-category-nav')) {
        if (y > lastY && y > 130) header.classList.add('header-hidden');
        else header.classList.remove('header-hidden');
      }
      if (mobileCta && mobileCtaPages.has(current)) {
        mobileCta.classList.toggle('show', y > Math.min(520, window.innerHeight * 0.55));
      }
      lastY = y;
      ticking = false;
    });
  }, { passive: true });

  // Temporarily hide the mobile conversion bar over important interactive cards.
  const mobileCtaSuppressionZones = qsa('[data-hide-mobile-cta]');
  if (mobileCtaSuppressionZones.length && 'IntersectionObserver' in window) {
    const visibleSuppressionZones = new Set();
    const suppressionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visibleSuppressionZones.add(entry.target);
        else visibleSuppressionZones.delete(entry.target);
      });
      body.classList.toggle('mobile-cta-suppressed', visibleSuppressionZones.size > 0);
    }, { threshold: 0.28 });
    mobileCtaSuppressionZones.forEach(zone => suppressionObserver.observe(zone));
  }

  // Reveal and timeline motion
  const observed = qsa('.reveal, .paw-timeline, .story-stage');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible', 'revealed');
        if (!entry.target.classList.contains('story-stage')) revealObserver.unobserve(entry.target);
      });
    }, { threshold: .16, rootMargin: '0px 0px -5% 0px' });
    observed.forEach(el => revealObserver.observe(el));
  } else {
    observed.forEach(el => el.classList.add('visible', 'revealed'));
  }

  qsa('.paw-timeline').forEach(timeline => {
    const steps = qsa('.paw-step', timeline);
    const obs = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      steps.forEach((step, idx) => setTimeout(() => step.classList.add('revealed'), 220 * idx));
      obs.disconnect();
    }, { threshold: .2 });
    obs.observe(timeline);
  });

  // Inside story active state
  const storyStages = qsa('.story-stage');
  const sceneLabel = qs('#scene-label');
  if (storyStages.length && 'IntersectionObserver' in window) {
    const storyObs = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      storyStages.forEach(s => s.classList.remove('active'));
      visible.target.classList.add('active');
      if (sceneLabel) {
        sceneLabel.dataset.en = visible.target.dataset.sceneEn || '';
        sceneLabel.dataset.th = visible.target.dataset.sceneTh || '';
        sceneLabel.textContent = lang === 'th' ? sceneLabel.dataset.th : sceneLabel.dataset.en;
      }
      const index = storyStages.indexOf(visible.target);
      qsa('.story-slide-image').forEach((image, imageIndex) => {
        const active = imageIndex === index;
        image.classList.toggle('active', active);
        image.setAttribute('aria-hidden', String(!active));
      });
    }, { threshold: [.35,.55,.75], rootMargin: '-20% 0px -42% 0px' });
    storyStages.forEach(s => storyObs.observe(s));
  }


  // Mobile-only visual story: five full-image panels controlled by page scroll.
  const mobileStory = qs('[data-mobile-story]');
  const mobileStoryTriggers = qsa('[data-mobile-story-trigger]');
  const mobileStoryImages = qsa('.mobile-story-slide-image');
  const mobileStoryDots = qsa('.mobile-story-progress span');
  const mobileStoryAnnouncer = qs('#mobile-story-announcer');

  function activateMobileStory(index) {
    mobileStoryImages.forEach((image, imageIndex) => {
      const active = imageIndex === index;
      image.classList.toggle('active', active);
      image.setAttribute('aria-hidden', String(!active));
    });
    mobileStoryDots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === index));
    if (mobileStoryAnnouncer && mobileStoryTriggers[index]) {
      mobileStoryAnnouncer.textContent = mobileStoryTriggers[index].dataset.mobileStoryLabel || '';
    }
  }

  if (mobileStory && mobileStoryTriggers.length && 'IntersectionObserver' in window) {
    activateMobileStory(0);
    const mobileStoryObserver = new IntersectionObserver(entries => {
      const activeEntry = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!activeEntry) return;
      activateMobileStory(Number(activeEntry.target.dataset.mobileStoryTrigger || 0));
    }, { threshold: [0, .01, .25, .5], rootMargin: '-44% 0px -44% 0px' });
    mobileStoryTriggers.forEach(trigger => mobileStoryObserver.observe(trigger));

    const storySectionObserver = new IntersectionObserver(entries => {
      const inView = entries.some(entry => entry.isIntersecting);
      body.classList.toggle('mobile-story-active', inView && matchMedia('(max-width: 760px)').matches);
    }, { threshold: .01 });
    storySectionObserver.observe(qs('#visit-story'));
  }

  // LINE and phone placeholders
  qsa('[data-line]').forEach(link => {
    link.addEventListener('click', event => {
      const ref = link.dataset.ref || body.dataset.source || 'WEB-GEN';
      const plan = storage.get('sessionStorage', 'sccc-selected-plan') || link.dataset.plan || '';
      const message = lang === 'th'
        ? `สวัสดีค่ะ สนใจ${plan ? 'แพ็กเกจ ' + plan : 'สอบถาม Creative Club'} (อ้างอิง: ${ref})`
        : `Hello, I am interested in ${plan || 'Siamese Cat Creative Club'} (ref: ${ref})`;
      if (CONFIG.lineUrl) {
        link.href = `${CONFIG.lineUrl}?text=${encodeURIComponent(message)}`;
      } else {
        event.preventDefault();
        showToast(lang === 'th' ? `ยังไม่ได้เชื่อมลิงก์ LINE OA กรุณาใช้แบบฟอร์มลงทะเบียนหรือโทรหาเรา (${ref})` : `LINE is not connected yet. Please use signup or call us (${ref})`);
      }
    });
  });

  qsa('[data-phone]').forEach(link => {
    link.addEventListener('click', event => {
      if (!CONFIG.phone) {
        event.preventDefault();
        showToast(lang === 'th' ? 'กรุณาโทรหาเราที่ +66-0804803802' : 'Please call us at +66-0804803802');
      } else link.href = `tel:${CONFIG.phone}`;
    });
  });

  // Membership selection
  const planCards = qsa('[data-plan-card]');

  function planData(card) {
    return {
      id: card.dataset.planId,
      nameEn: card.dataset.nameEn,
      nameTh: card.dataset.nameTh,
      price: card.dataset.price
    };
  }

  function selectPlan(card) {
    planCards.forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    const data = planData(card);
    const selectedName = lang === 'th' ? data.nameTh : data.nameEn;
    storage.set('sessionStorage', 'sccc-selected-plan-id', data.id);
    storage.set('sessionStorage', 'sccc-selected-plan', selectedName);
    storage.set('sessionStorage', 'sccc-selected-price', data.price);
    qsa('[data-selected-plan-label]').forEach(el => {
      el.textContent = selectedName;
    });
    qsa('[data-book-selected]').forEach(link => {
      link.href = `/signup?plan=${encodeURIComponent(data.id)}`;
    });
    showToast(lang === 'th' ? `เลือก ${selectedName} แล้ว` : `${selectedName} selected`);
  }

  planCards.forEach(card => {
    qsa('[data-select-plan]', card).forEach(btn => btn.addEventListener('click', () => selectPlan(card)));
  });

  // Dynamic booking plan
  const params = new URLSearchParams(location.search);
  const planParam = params.get('plan');
  const planSelect = qs('#plan-interest');
  const selectedSummary = qs('#selected-plan-summary');
  if (planParam && planSelect) {
    const matching = qsa('option', planSelect).find(o => o.value === planParam);
    if (matching) {
      planSelect.value = planParam;
      if (selectedSummary) {
        selectedSummary.hidden = false;
        selectedSummary.querySelector('[data-summary-plan]').textContent = matching.textContent;
      }
    }
  }

  // Legacy standalone form behaviour. Public CTAs now route to /signup.
  qsa('[data-booking-form]').forEach(form => {
    const required = qsa('[required]', form);
    const errorText = {
      en: 'Please complete this field.',
      th: 'กรุณากรอกข้อมูลในช่องนี้'
    };

    function validateField(field) {
      const wrapper = field.closest('.field') || field.closest('.consent-row');
      const error = wrapper?.querySelector('.field-error');
      let valid = field.checkValidity();
      if (field.type === 'tel' && field.value.trim()) {
        valid = /^[+\d][\d\s()-]{7,18}$/.test(field.value.trim());
      }
      field.setAttribute('aria-invalid', String(!valid));
      if (error) error.textContent = valid ? '' : errorText[lang];
      return valid;
    }

    required.forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.getAttribute('aria-invalid') === 'true') validateField(field);
      });
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const valid = required.every(validateField);
      const status = qs('.form-status', form);
      if (!valid) {
        if (status) status.textContent = lang === 'th' ? 'กรุณาตรวจสอบช่องที่มีเครื่องหมาย' : 'Please review the marked fields.';
        qs('[aria-invalid="true"]', form)?.focus();
        return;
      }
      const submit = qs('[type="submit"]', form);
      if (submit) {
        submit.disabled = true;
        submit.textContent = lang === 'th' ? 'กำลังส่งคำขอ…' : 'Sending request…';
      }
      const formData = Object.fromEntries(new FormData(form).entries());
      const lead = {
        ...formData,
        page: body.dataset.page,
        lang,
        source: body.dataset.source || 'WEB-GEN',
        utm_source: params.get('utm_source') || '',
        utm_campaign: params.get('utm_campaign') || '',
        createdAt: new Date().toISOString(),
        standaloneForm: true
      };
      storage.set('localStorage', 'sccc-last-lead', JSON.stringify(lead));
      await new Promise(resolve => setTimeout(resolve, 650));
      location.href = `/thank-you?plan=${encodeURIComponent(formData.plan || 'not-sure')}`;
    });
  });

  // Hide mobile CTA while keyboard is likely open
  let initialHeight = window.innerHeight;
  window.addEventListener('resize', () => {
    const keyboard = window.innerWidth < 760 && window.innerHeight < initialHeight * .74;
    mobileCta?.classList.toggle('keyboard-open', keyboard);
    if (!keyboard) initialHeight = Math.max(initialHeight, window.innerHeight);
  });

  // First visit on-page sticky CTA
  qsa('[data-scroll-booking]').forEach(btn => btn.addEventListener('click', event => {
    const target = qs('#booking-block');
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
  }));

  // FAQ search
  const faqSearch = qs('#faq-search');
  if (faqSearch) {
    faqSearch.addEventListener('input', () => {
      const term = faqSearch.value.toLowerCase().trim();
      qsa('.faq-item').forEach(item => {
        const hay = `${item.dataset.search || ''} ${item.textContent}`.toLowerCase();
        item.hidden = term && !hay.includes(term);
      });
    });
  }

  // Footer year
  qsa('[data-year]').forEach(el => el.textContent = String(new Date().getFullYear()));
})();
