(function (global, document) {
  'use strict';

  const allConfig = global.SCVD_GAMEANALYTICS_CONFIG;
  const capacitor = global.Capacitor;
  const nativePlatform = capacitor && typeof capacitor.isNativePlatform === 'function' && capacitor.isNativePlatform()
    ? capacitor.getPlatform()
    : 'web';
  const platform = nativePlatform === 'android' || nativePlatform === 'ios' ? nativePlatform : 'web';
  const config = allConfig && (allConfig.web || allConfig.android || allConfig.ios)
    ? allConfig[platform]
    : (platform === 'web' ? allConfig : null);
  const consentKey = 'scvd_gameanalytics_consent_v1';
  const locale = document.documentElement.lang === 'th' ? 'th' : 'en';
  let initialized = false;
  let dialog = null;

  const copy = locale === 'th' ? {
    title: 'ช่วยเราพัฒนา Cat vs Dog 1986',
    body: 'หากคุณยินยอม เราจะส่งข้อมูลการเล่น เช่น ภาษา ระดับความยาก ด่าน คะแนน และผลการเล่นไปยัง GameAnalytics โดยไม่ส่งชื่อหรืออีเมลของคุณ คุณเล่นเกมได้ตามปกติไม่ว่าจะเลือกแบบใด',
    decline: 'ไม่อนุญาต',
    allow: 'อนุญาตการวิเคราะห์',
  } : {
    title: 'Help us improve Cat vs Dog 1986',
    body: 'If you agree, we send gameplay events such as language, difficulty, stages, score, and game results to GameAnalytics. We do not send your name or email. You can play either way.',
    decline: 'No thanks',
    allow: 'Allow analytics',
  };

  function getConsent() {
    try { return global.localStorage.getItem(consentKey); } catch (_) { return null; }
  }

  function saveConsent(value) {
    try { global.localStorage.setItem(consentKey, value); } catch (_) {}
  }

  function ga() {
    return global.gameanalytics && global.gameanalytics.GameAnalytics;
  }

  function initialize() {
    if (initialized || !config || !config.gameKey || !config.secretKey || !ga()) return false;
    const sdk = ga();
    sdk.setEnabledInfoLog(false);
    sdk.setEnabledVerboseLog(false);
    sdk.configureBuild(config.build || 'web-1.0.0');
    sdk.setGlobalCustomEventFields({ language: locale, platform: platform });
    sdk.initialize(config.gameKey, config.secretKey);
    initialized = true;
    return true;
  }

  function safeSegment(value, fallback) {
    const result = String(value || fallback || 'unknown')
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return result || fallback || 'unknown';
  }

  function design(eventId, value) {
    if (!initialized || !ga()) return;
    if (Number.isFinite(value)) ga().addDesignEvent(eventId, value);
    else ga().addDesignEvent(eventId);
  }

  function gameStart(mode) {
    design('game:start:' + safeSegment(mode, 'normal'));
  }

  function difficultySelected(mode) {
    design('difficulty:selected:' + safeSegment(mode, 'normal'));
  }

  function gameOver(result) {
    result = result || {};
    const mode = safeSegment(result.mode, 'normal');
    const outcome = result.victory ? 'victory' : 'defeat';
    design('game:over:' + mode + ':' + outcome, Number(result.score) || 0);
    design('game:stage_reached:' + mode, Math.max(1, Number(result.stage) || 1));
  }

  function closeDialog() {
    if (dialog) dialog.remove();
    dialog = null;
  }

  function setConsent(allowed) {
    saveConsent(allowed ? 'granted' : 'denied');
    closeDialog();
    if (allowed) {
      if (initialized && ga()) ga().setEnabledEventSubmission(true);
      else initialize();
    }
    else if (initialized && ga()) ga().setEnabledEventSubmission(false);
  }

  function addStyles() {
    if (document.getElementById('scvd-analytics-style')) return;
    const style = document.createElement('style');
    style.id = 'scvd-analytics-style';
    style.textContent = [
      '.scvd-analytics-backdrop{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:20px;background:rgba(5,5,7,.82);font-family:monospace;color:#fff}',
      '.scvd-analytics-dialog{width:min(430px,calc(100vw - 32px));box-sizing:border-box;padding:24px;border:2px solid #FFD23F;border-radius:14px;background:#1A0B24;box-shadow:0 18px 70px rgba(0,0,0,.65);text-align:left}',
      '.scvd-analytics-dialog h2{margin:0 0 12px;color:#FFD23F;font:700 20px/1.25 monospace}',
      '.scvd-analytics-dialog p{margin:0;color:rgba(255,255,255,.86);font:14px/1.55 monospace}',
      '.scvd-analytics-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:22px;flex-wrap:wrap}',
      '.scvd-analytics-actions button{min-height:44px;padding:10px 14px;border:2px solid #7FD4F2;border-radius:9px;background:transparent;color:#fff;font:700 13px monospace;cursor:pointer}',
      '.scvd-analytics-actions button[data-allow]{border-color:#FFD23F;background:#FFD23F;color:#160D2B}',
      '.scvd-analytics-actions button:focus-visible{outline:3px solid #fff;outline-offset:3px}',
    ].join('');
    document.head.appendChild(style);
  }

  function openConsentDialog() {
    if (!config || dialog) return;
    addStyles();
    dialog = document.createElement('div');
    dialog.className = 'scvd-analytics-backdrop';
    dialog.innerHTML = '<section class="scvd-analytics-dialog" role="dialog" aria-modal="true" aria-labelledby="scvd-analytics-title">' +
      '<h2 id="scvd-analytics-title"></h2><p></p><div class="scvd-analytics-actions">' +
      '<button type="button" data-decline></button><button type="button" data-allow></button></div></section>';
    dialog.querySelector('h2').textContent = copy.title;
    dialog.querySelector('p').textContent = copy.body;
    const decline = dialog.querySelector('[data-decline]');
    const allow = dialog.querySelector('[data-allow]');
    decline.textContent = copy.decline;
    allow.textContent = copy.allow;
    decline.addEventListener('click', function () { setConsent(false); });
    allow.addEventListener('click', function () { setConsent(true); });
    document.body.appendChild(dialog);
    allow.focus();
  }

  function boot() {
    if (!config) return;
    const forceChoices = /(?:\?|&)analytics=choices(?:&|$)/.test(global.location.search || '');
    const consent = getConsent();
    if (forceChoices || !consent) openConsentDialog();
    else if (consent === 'granted') initialize();
  }

  global.SCVDAnalytics = {
    gameStart,
    gameOver,
    difficultySelected,
    openPrivacyChoices: openConsentDialog,
    isEnabled: function () { return initialized; },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})(window, document);
