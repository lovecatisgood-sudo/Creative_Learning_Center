(() => {
  "use strict";

  const GUEST_KEY = "car-maze-guest-identity-v1";
  const ACCOUNT_KEY = "car-maze-account-identity-v1";
  const locale = document.documentElement.dataset.defaultLocale === "th" ? "th" : "en";
  const copy = locale === "th"
    ? {
        checking: "กำลังตรวจสอบการเข้าสู่ระบบ…",
        title: "เริ่มเข้าสู่ระบบเมื่อถึงด่าน 20",
        intro: "คุณเล่นด่าน 1–19 ได้โดยไม่ต้องมีบัญชี",
        available: "ดำเนินการต่อด้วยบัญชีสมาชิก Siamese Cat เพื่อเล่นตั้งแต่ด่าน 20",
        unavailable: "ขณะนี้ระบบเข้าสู่ระบบยังไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง ความคืบหน้าในอุปกรณ์นี้ยังอยู่ครบ และด่าน 1–19 ยังคงเล่นได้",
        termsPrefix: "ฉันเป็นผู้ปกครองและยอมรับ ",
        termsLabel: "ข้อกำหนดการใช้งาน",
        privacyJoin: " และ ",
        privacyLabel: "ประกาศความเป็นส่วนตัว",
        termsRequired: "กรุณายอมรับข้อกำหนดการใช้งานและประกาศความเป็นส่วนตัวก่อนดำเนินการต่อ",
        continueSiamese: "ดำเนินการต่อด้วย Siamese Cat",
        opening: "กำลังเปิดหน้าต่างเข้าสู่ระบบ Siamese Cat…",
        popupBlocked: "กรุณาอนุญาตป๊อปอัป แล้วลองอีกครั้ง",
        signInFailed: "เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง",
        retry: "ลองตรวจสอบอีกครั้ง",
        back: "กลับไปเล่นด่านก่อนหน้า",
        adLabel: "โฆษณา",
        adCountdown: "โฆษณา",
        adSkip: "ข้าม",
        adLearnMore: "ดูเพิ่มเติม",
      }
    : {
        checking: "Checking account sign-in availability…",
        title: "Sign-in starts at Stage 20",
        intro: "Stages 1–19 are playable without an account.",
        available: "Continue with your Siamese Cat member account to play from Stage 20.",
        unavailable: "Account sign-in is not available right now. Try again in a moment. Your local progress is safe, and stages 1–19 remain playable.",
        termsPrefix: "I am a parent or guardian and agree to the ",
        termsLabel: "Terms",
        privacyJoin: " and the ",
        privacyLabel: "Privacy Notice",
        termsRequired: "Please accept the Terms and Privacy Notice before continuing.",
        continueSiamese: "Continue with Siamese Cat",
        opening: "Opening Siamese Cat sign-in…",
        popupBlocked: "Allow the sign-in pop-up, then try again.",
        signInFailed: "Sign-in did not work. Please try again.",
        retry: "Check again",
        back: "Keep playing earlier stages",
        adLabel: "Advertisement",
        adCountdown: "Advertisement",
        adSkip: "Skip",
        adLearnMore: "Learn more",
      };

  let gate = null;
  let gateStage = 0;
  let authChecked = false;
  let authChecking = false;
  let authAvailable = false;
  let authOperationalError = false;
  let accountAuthenticated = false;
  let signInPending = false;
  let pendingStageButton = null;
  let stageObserver = null;
  let milestoneAdPending = false;
  const MILESTONE_AD_KEY = "car-maze-house-ad-milestones-v1";
  const MILESTONE_STAGES = new Set([10, 20, 30, 40, 50]);
  const handledMilestones = new Set();

  function readGuest() {
    try {
      const value = JSON.parse(localStorage.getItem(GUEST_KEY) || "null");
      if (!value || value.role !== "guest" || typeof value.id !== "string" || typeof value.nickname !== "string") return null;
      return value;
    } catch {
      return null;
    }
  }

  function readAccount() {
    try {
      const value = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "null");
      if (!value || value.role !== "parent" || typeof value.id !== "string" || typeof value.nickname !== "string") return null;
      return value;
    } catch {
      return null;
    }
  }

  function writeAccount(player) {
    if (!player || typeof player.publicId !== "string" || typeof player.displayName !== "string") return;
    try {
      localStorage.setItem(ACCOUNT_KEY, JSON.stringify({
        id: player.publicId,
        email: "",
        role: "parent",
        locale,
        nickname: player.displayName.trim().slice(0, 24) || (locale === "th" ? "นักขับตัวน้อย" : "Little Driver"),
      }));
    } catch {
      // The server session is still authoritative when local storage is unavailable.
    }
  }

  function clearAccount() {
    try {
      localStorage.removeItem(ACCOUNT_KEY);
    } catch {
      // Ignore storage failures; the server session is cleared separately.
    }
  }

  function ensureGuestIdentity() {
    if (readAccount() || readGuest()) return;
    try {
      const uuid = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(GUEST_KEY, JSON.stringify({
        id: `guest-${uuid}`,
        email: "",
        role: "guest",
        locale,
        nickname: locale === "th" ? "นักขับตัวน้อย" : "Little Driver",
      }));
    } catch {
      // The game bundle will retain its existing fallback if storage is unavailable.
    }
  }

  function hasAccountIdentity() {
    return Boolean(readAccount());
  }

  function isGuest() {
    return !accountAuthenticated && !hasAccountIdentity() && Boolean(readGuest());
  }

  ensureGuestIdentity();

  function currentStage() {
    const label = document.querySelector(".levelTitle > span")?.textContent || "";
    const match = label.match(/(?:Stage|ด่าน)\s*(\d+)/i) || label.match(/\b(\d+)\b/);
    return match ? Number(match[1]) : 0;
  }

  function targetStage(button) {
    const levelNumber = button.querySelector(".levelNumber")?.textContent || "";
    const numberMatch = levelNumber.match(/\b(\d+)\b/);
    if (numberMatch) return Number(numberMatch[1]);
    const current = currentStage();
    if (/next stage|ด่านถัดไป/i.test(button.textContent || "")) return current + 1;
    const firstNumber = (button.textContent || "").match(/^\s*(\d+)\b/);
    return firstNumber ? Number(firstNumber[1]) : 0;
  }

  function addStyles() {
    if (document.querySelector("style[data-car-maze-auth-gate]")) return;
    const style = document.createElement("style");
    style.dataset.carMazeAuthGate = "";
    style.textContent = `
      .car-maze-auth-gate { position: fixed; inset: 0; z-index: 10000; display: grid; place-items: center; padding: 24px; overflow: auto; background: rgba(10, 24, 38, .72); backdrop-filter: blur(5px); }
      .car-maze-auth-gate__card { width: min(100%, 520px); padding: 30px; border: 1px solid rgba(8, 127, 163, .24); border-radius: 24px; background: #fff; box-shadow: 0 24px 80px rgba(0, 0, 0, .28); color: #17202b; font: 500 16px/1.55 system-ui, sans-serif; }
      .car-maze-auth-gate__eyebrow { margin: 0 0 8px; color: #087fa3; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
      .car-maze-auth-gate h2 { margin: 0 0 10px; font-size: clamp(24px, 5vw, 34px); line-height: 1.1; }
      .car-maze-auth-gate p { margin: 0 0 18px; }
      .car-maze-auth-gate__message { color: #526970; }
      .car-maze-auth-gate__auth { margin: 20px 0 18px; }
      .car-maze-auth-gate__terms { display: flex; align-items: flex-start; gap: 10px; margin: 0 0 14px; color: #526970; font-size: 13px; }
      .car-maze-auth-gate__terms input { flex: 0 0 auto; width: 18px; height: 18px; margin: 2px 0 0; accent-color: #087fa3; }
      .car-maze-auth-gate__terms a { color: #087fa3; font-weight: 700; }
      .car-maze-auth-gate__siamese { width: 100%; background: #087fa3; color: #fff; }
      .car-maze-auth-gate__status { min-height: 22px; margin: 12px 0 0; color: #526970; font-size: 13px; text-align: center; }
      .car-maze-auth-gate__status[data-error="true"] { color: #b33a2c; font-weight: 700; }
      .car-maze-auth-gate__actions { display: flex; flex-wrap: wrap; gap: 10px; }
      .car-maze-auth-gate button { min-height: 44px; padding: 10px 16px; border: 0; border-radius: 12px; cursor: pointer; font: inherit; font-weight: 800; }
      .car-maze-auth-gate button:disabled { cursor: wait; opacity: .65; }
      .car-maze-auth-gate__primary { background: #087fa3; color: #fff; }
      .car-maze-auth-gate__secondary { background: #e8f1f3; color: #087fa3; }
      .car-maze-house-ad { position: fixed; inset: 0; z-index: 11000; display: grid; place-items: center; padding: max(14px, env(safe-area-inset-top)) 14px max(14px, env(safe-area-inset-bottom)); box-sizing: border-box; background: #070b10; color: #fff; font: 500 14px/1.4 system-ui, sans-serif; }
      .car-maze-house-ad__card { position: relative; width: min(100%, 430px); height: min(100%, 820px); display: flex; flex-direction: column; gap: 10px; }
      .car-maze-house-ad__media { position: relative; min-height: 0; flex: 1 1 auto; overflow: hidden; border-radius: 16px; background: #000; box-shadow: 0 14px 50px rgba(0,0,0,.6); }
      .car-maze-house-ad video { display: block; width: 100%; height: 100%; object-fit: contain; }
      .car-maze-house-ad__label { position: absolute; z-index: 2; top: 10px; left: 10px; padding: 3px 7px; border: 1px solid rgba(255,255,255,.32); border-radius: 5px; background: rgba(0,0,0,.68); font-size: 10px; font-weight: 800; letter-spacing: .04em; }
      .car-maze-house-ad__skip { position: absolute; z-index: 2; top: 10px; right: 10px; min-height: 36px !important; padding: 7px 11px !important; border: 1px solid rgba(255,255,255,.42) !important; border-radius: 7px !important; background: rgba(0,0,0,.76) !important; color: #fff; }
      .car-maze-house-ad__skip[hidden] { display: none; }
      .car-maze-house-ad__progress { position: absolute; right: 0; bottom: 0; left: 0; height: 3px; overflow: hidden; background: rgba(255,255,255,.24); }
      .car-maze-house-ad__progress span { display: block; width: 100%; height: 100%; transform: scaleX(0); transform-origin: left center; background: #fff; will-change: transform; }
      .car-maze-house-ad__meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .car-maze-house-ad__meta strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .car-maze-house-ad__meta span { flex: 0 0 auto; color: #bbcbd0; font-size: 12px; font-weight: 700; }
      .car-maze-house-ad__cta { display: block; padding: 12px; border-radius: 12px; background: #f0ad22; color: #17202b; text-align: center; text-decoration: none; font-weight: 900; }
    `;
    document.head.appendChild(style);
  }

  function closeGate() {
    gate?.remove();
    gate = null;
    gateStage = 0;
  }

  function returnToEarlierStages() {
    if (currentStage() >= 20) {
      window.location.hash = "";
      window.location.reload();
      return;
    }
    closeGate();
  }

  function setLoginStatus(message, error = false) {
    const status = gate?.querySelector(".car-maze-auth-gate__status");
    if (!status) return;
    status.textContent = message;
    status.dataset.error = error ? "true" : "false";
  }

  function makeLegalLink(label, href) {
    const link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = label;
    return link;
  }

  async function refreshPlayerSession() {
    const response = await fetch("/api/public/game/auth/session", { cache: "no-store", credentials: "same-origin" });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(String(payload?.error || copy.signInFailed));
    return payload;
  }

  async function completeSiameseLogin() {
    const session = await refreshPlayerSession();
    if (!session?.authenticated || !session.player?.publicId) return false;
    writeAccount(session.player);
    accountAuthenticated = true;
    authOperationalError = false;
    try {
      // Keep car-maze-progress-v1 intact; only the temporary guest identity is replaced.
      localStorage.removeItem(GUEST_KEY);
    } catch {
      // The first-party server session remains authoritative.
    }
    closeGate();
    window.dispatchEvent(new CustomEvent("car-maze-authenticated", { detail: session.player }));
    const pendingButton = pendingStageButton;
    pendingStageButton = null;
    if (pendingButton?.isConnected) window.setTimeout(() => pendingButton.click(), 0);
    return true;
  }

  async function beginSiameseLogin() {
    if (signInPending) return;
    const checkbox = gate?.querySelector(".car-maze-auth-gate__terms input");
    if (!checkbox?.checked) {
      setLoginStatus(copy.termsRequired, true);
      checkbox?.focus();
      return;
    }
    signInPending = true;
    checkbox.disabled = true;
    setLoginStatus(copy.opening);
    const popup = window.open(`/api/public/game/auth/siamese/start?game=car-maze&language=${locale}`, "car_maze_siamese_auth", "popup,width=520,height=720");
    if (!popup) {
      signInPending = false;
      checkbox.disabled = false;
      setLoginStatus(copy.popupBlocked, true);
      return;
    }
    let attempts = 0;
    const poll = window.setInterval(async () => {
      attempts += 1;
      try {
        if (await completeSiameseLogin()) {
          window.clearInterval(poll);
          signInPending = false;
          return;
        }
      } catch {
        // Keep polling while the popup transaction is in progress.
      }
      if (popup.closed || attempts >= 160) {
        window.clearInterval(poll);
        signInPending = false;
        if (checkbox.isConnected) checkbox.disabled = false;
        setLoginStatus(copy.signInFailed, true);
      }
    }, 750);
  }

  function renderGate() {
    if (!gate) return;
    const message = gate.querySelector(".car-maze-auth-gate__message");
    const auth = gate.querySelector(".car-maze-auth-gate__auth");
    const actions = gate.querySelector(".car-maze-auth-gate__actions");
    if (!message || !auth || !actions) return;

    message.textContent = authChecking ? copy.checking : authAvailable ? copy.available : copy.unavailable;
    auth.replaceChildren();
    actions.replaceChildren();

    if (!authChecking && authAvailable) {
      const terms = document.createElement("label");
      terms.className = "car-maze-auth-gate__terms";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.required = true;
      checkbox.setAttribute("aria-label", copy.termsRequired);
      terms.appendChild(checkbox);
      terms.appendChild(document.createTextNode(copy.termsPrefix));
      terms.appendChild(makeLegalLink(copy.termsLabel, locale === "th" ? "/terms" : "/EN/terms"));
      terms.appendChild(document.createTextNode(copy.privacyJoin));
      terms.appendChild(makeLegalLink(copy.privacyLabel, locale === "th" ? "/privacy" : "/EN/privacy"));

      const siamese = document.createElement("button");
      siamese.type = "button";
      siamese.className = "car-maze-auth-gate__siamese";
      siamese.textContent = copy.continueSiamese;
      siamese.addEventListener("click", () => void beginSiameseLogin());
      const status = document.createElement("p");
      status.className = "car-maze-auth-gate__status";
      status.setAttribute("role", "status");
      auth.append(terms, siamese, status);
    } else if (authOperationalError) {
      const status = document.createElement("p");
      status.className = "car-maze-auth-gate__status";
      status.dataset.error = "true";
      status.setAttribute("role", "alert");
      status.textContent = copy.unavailable;
      auth.appendChild(status);
    }

    if (!authChecking) {
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "car-maze-auth-gate__secondary";
      retry.textContent = copy.retry;
      retry.addEventListener("click", () => {
        authChecked = false;
        authOperationalError = false;
        authAvailable = false;
        checkAuthAvailability();
      });
      actions.appendChild(retry);
    }

    const back = document.createElement("button");
    back.type = "button";
    back.className = "car-maze-auth-gate__secondary";
    back.textContent = copy.back;
    back.addEventListener("click", returnToEarlierStages);
    actions.appendChild(back);
  }

  function showGate(stage) {
    if (accountAuthenticated) return;
    addStyles();
    if (gate && gateStage === stage) {
      return;
    }
    closeGate();
    gateStage = stage;
    gate = document.createElement("div");
    gate.className = "car-maze-auth-gate";
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-labelledby", "car-maze-auth-title");
    gate.innerHTML = `<section class="car-maze-auth-gate__card"><p class="car-maze-auth-gate__eyebrow">Car Maze · ${locale === "th" ? "ด่าน 20" : "Stage 20"}</p><h2 id="car-maze-auth-title">${copy.title}</h2><p>${copy.intro}</p><p class="car-maze-auth-gate__message">${copy.checking}</p><div class="car-maze-auth-gate__auth"></div><div class="car-maze-auth-gate__actions"></div></section>`;
    document.body.appendChild(gate);
    renderGate();
    checkAuthAvailability();
  }

  async function checkAuthAvailability() {
    if (authChecking) return;
    if (authChecked && accountAuthenticated) {
      closeGate();
      return;
    }
    authChecking = true;
    authOperationalError = false;
    renderGate();
    try {
      const [configResponse, sessionResponse] = await Promise.all([
        fetch("/api/public/game/auth/config?game=car-maze", { cache: "no-store", credentials: "same-origin" }),
        fetch("/api/public/game/auth/session", { cache: "no-store", credentials: "same-origin" }),
      ]);
      if (!configResponse.ok || !sessionResponse.ok) throw new Error("auth service unavailable");
      const config = await configResponse.json();
      const session = await sessionResponse.json();
      authAvailable = Boolean(config?.loginEnabled && config?.siameseEnabled);
      accountAuthenticated = Boolean(session?.authenticated && session?.player?.publicId);
      if (accountAuthenticated) {
        writeAccount(session.player);
        closeGate();
        const pendingButton = pendingStageButton;
        pendingStageButton = null;
        if (pendingButton?.isConnected) window.setTimeout(() => pendingButton.click(), 0);
      } else {
        clearAccount();
        ensureGuestIdentity();
      }
    } catch {
      authAvailable = false;
      accountAuthenticated = false;
      authOperationalError = true;
    } finally {
      authChecked = true;
      authChecking = false;
      if (!accountAuthenticated) renderGate();
    }
  }

  async function signOut() {
    try {
      await fetch("/api/public/game/auth/session", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "cache-control": "no-cache" },
      });
    } finally {
      clearAccount();
      accountAuthenticated = false;
      ensureGuestIdentity();
      window.location.reload();
    }
  }

  function shownMilestones() {
    try {
      const value = JSON.parse(localStorage.getItem(MILESTONE_AD_KEY) || "[]");
      const stored = Array.isArray(value) ? value.filter((stage) => MILESTONE_STAGES.has(Number(stage))).map(Number) : [];
      return [...new Set([...stored, ...handledMilestones])];
    } catch {
      return [...handledMilestones];
    }
  }

  function markMilestoneShown(stage) {
    handledMilestones.add(stage);
    try {
      localStorage.setItem(MILESTONE_AD_KEY, JSON.stringify([...new Set([...shownMilestones(), stage])].sort((left, right) => left - right)));
    } catch {
      // The in-memory fallback still prevents an ad loop in this session.
    }
  }

  function playerPublicId() {
    return readAccount()?.id || "";
  }

  function recordMilestoneAd(campaign, eventType) {
    try {
      fetch("/api/public/game/ad/event", {
        method: "POST",
        headers: { "content-type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          campaignId: campaign.id,
          playerId: playerPublicId(),
          eventType,
          placement: "car_maze_stage_milestone",
        }),
      }).catch(() => undefined);
    } catch {
      // Analytics failure must never block course progression.
    }
  }

  async function showMilestoneAd(stage, continueToNextStep) {
    if (milestoneAdPending) return;
    milestoneAdPending = true;
    // Treat this milestone as handled before campaign selection. If the API has
    // no eligible campaign (or fails), replaying the original button click must
    // continue the course instead of entering another ad request loop.
    markMilestoneShown(stage);
    let campaign = null;
    try {
      const response = await fetch(`/api/public/game/ad?language=${locale}&playerId=${encodeURIComponent(playerPublicId())}`, { cache: "no-store" });
      if (response.ok) campaign = (await response.json())?.campaign || null;
    } catch {
      campaign = null;
    }
    if (!campaign?.videoUrl) {
      milestoneAdPending = false;
      continueToNextStep();
      return;
    }

    addStyles();
    const overlay = document.createElement("div");
    overlay.className = "car-maze-house-ad";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", copy.adLabel);
    const card = document.createElement("section");
    card.className = "car-maze-house-ad__card";
    const media = document.createElement("div");
    media.className = "car-maze-house-ad__media";
    const video = document.createElement("video");
    video.playsInline = true;
    video.preload = "auto";
    video.src = campaign.videoUrl;
    if (campaign.posterUrl) video.poster = campaign.posterUrl;
    const label = document.createElement("span");
    label.className = "car-maze-house-ad__label";
    label.textContent = copy.adLabel;
    const skip = document.createElement("button");
    skip.type = "button";
    skip.className = "car-maze-house-ad__skip";
    skip.textContent = copy.adSkip;
    skip.hidden = true;
    skip.disabled = true;
    const progress = document.createElement("div");
    progress.className = "car-maze-house-ad__progress";
    const progressValue = document.createElement("span");
    progress.appendChild(progressValue);
    media.append(video, label, skip, progress);
    const meta = document.createElement("div");
    meta.className = "car-maze-house-ad__meta";
    const name = document.createElement("strong");
    name.textContent = String(campaign.name || "Siamese Cat");
    const countdown = document.createElement("span");
    countdown.textContent = copy.adCountdown;
    meta.append(name, countdown);
    card.append(media, meta);
    if (campaign.ctaLabel && campaign.destinationUrl) {
      const cta = document.createElement("a");
      cta.className = "car-maze-house-ad__cta";
      cta.href = campaign.destinationUrl;
      cta.target = "_blank";
      cta.rel = "noopener";
      cta.textContent = String(campaign.ctaLabel || copy.adLearnMore);
      cta.addEventListener("click", () => recordMilestoneAd(campaign, "click"));
      card.appendChild(cta);
    }
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    recordMilestoneAd(campaign, "impression");

    let finished = false;
    const skipAfter = Math.max(10, Math.min(300, Number(campaign.skipAfterSeconds) || 10));
    const startedAt = Date.now();
    const finish = (eventType) => {
      if (finished) return;
      finished = true;
      if (eventType) recordMilestoneAd(campaign, eventType);
      window.clearInterval(tick);
      window.clearTimeout(safety);
      try {
        video.pause();
        video.removeAttribute("src");
        video.load();
      } catch {
        // Best-effort media cleanup.
      }
      overlay.remove();
      milestoneAdPending = false;
      window.setTimeout(continueToNextStep, 0);
    };
    const tick = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const unlockIn = Math.max(0, Math.ceil(skipAfter - elapsed));
      skip.hidden = unlockIn > 0;
      skip.disabled = unlockIn > 0;
      const hasDuration = Number.isFinite(video.duration) && video.duration > 0;
      const fraction = hasDuration ? Math.max(0, Math.min(1, video.currentTime / video.duration)) : 0;
      const remaining = hasDuration ? Math.max(0, Math.ceil(video.duration - video.currentTime)) : null;
      progressValue.style.transform = `scaleX(${fraction})`;
      countdown.textContent = remaining === null ? copy.adCountdown : locale === "th" ? `${remaining} วิ` : `${remaining}s`;
    }, 250);
    const safety = window.setTimeout(() => finish("error"), Math.min(360, Math.max(45, skipAfter + 15)) * 1000);
    skip.addEventListener("click", () => {
      if (!skip.disabled) finish("skipped");
    });
    video.addEventListener("ended", () => finish("completed"));
    video.addEventListener("error", () => finish("error"));
    try {
      await video.play();
    } catch {
      video.muted = true;
      try {
        await video.play();
      } catch {
        finish("error");
      }
    }
  }

  function isMilestoneExitButton(button) {
    if (!button.closest(".winActions")) return false;
    return /next stage|stage map|ด่านถัดไป|แผนที่ด่าน/i.test(button.textContent || "");
  }

  function checkCurrentStage() {
    const stage = currentStage();
    if (stage >= 20) {
      if (accountAuthenticated) {
        stageObserver?.disconnect();
        closeGate();
        return;
      }
      showGate(stage);
    } else if (gate && !accountAuthenticated) {
      closeGate();
    }
  }

  document.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("button") : null;
    if (!button || gate?.contains(button)) return;

    const current = currentStage();
    const target = button.classList.contains("levelCard")
      ? targetStage(button)
      : /next stage|ด่านถัดไป/i.test(button.textContent || "")
        ? current + 1
        : 0;

    if (hasAccountIdentity() && /^(sign out|ออกจากระบบ)$/i.test((button.textContent || "").trim())) {
      event.preventDefault();
      event.stopImmediatePropagation();
      void signOut();
      return;
    }

    if ((target >= 20 || (current >= 20 && target === 0)) && !accountAuthenticated) {
      event.preventDefault();
      event.stopImmediatePropagation();
      pendingStageButton = button;
      showGate(Math.max(20, target || current));
      return;
    }

    if (MILESTONE_STAGES.has(current) && isMilestoneExitButton(button) && !shownMilestones().includes(current)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      void showMilestoneAd(current, () => {
        if (button.isConnected) button.click();
      });
    }
  }, true);

  let stageCheckScheduled = false;
  function scheduleStageCheck() {
    if (stageCheckScheduled) return;
    stageCheckScheduled = true;
    const run = () => {
      stageCheckScheduled = false;
      checkCurrentStage();
    };
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(run);
    } else {
      window.setTimeout(run, 0);
    }
  }

  stageObserver = new MutationObserver(scheduleStageCheck);
  const observedRoot = document.querySelector("#root") || document.documentElement;
  stageObserver.observe(observedRoot, { childList: true, subtree: true });
  window.setTimeout(checkCurrentStage, 0);
})();
