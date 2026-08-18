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
        available: "เข้าสู่ระบบด้วย Google เพื่อเล่นต่อจากด่าน 20",
        unavailable: "ขณะนี้ระบบเข้าสู่ระบบยังไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง ความคืบหน้าในอุปกรณ์นี้ยังอยู่ครบ และด่าน 1–19 ยังคงเล่นได้",
        termsPrefix: "ฉันเป็นผู้ปกครองและยอมรับ ",
        termsLabel: "ข้อกำหนดการใช้งาน",
        privacyJoin: " และ ",
        privacyLabel: "ประกาศความเป็นส่วนตัว",
        termsRequired: "กรุณายอมรับข้อกำหนดการใช้งานและประกาศความเป็นส่วนตัวก่อนดำเนินการต่อ",
        loadingGoogle: "กำลังโหลด Google Sign-In…",
        googleLoadFailed: "โหลด Google Sign-In ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่",
        signingIn: "กำลังสร้างบัญชีผู้เล่น…",
        signInFailed: "เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง",
        retry: "ลองตรวจสอบอีกครั้ง",
        back: "กลับไปเล่นด่านก่อนหน้า",
      }
    : {
        checking: "Checking account sign-in availability…",
        title: "Sign-in starts at Stage 20",
        intro: "Stages 1–19 are playable without an account.",
        available: "Sign in with Google to continue from Stage 20.",
        unavailable: "Account sign-in is not available right now. Try again in a moment. Your local progress is safe, and stages 1–19 remain playable.",
        termsPrefix: "I am a parent or guardian and agree to the ",
        termsLabel: "Terms",
        privacyJoin: " and the ",
        privacyLabel: "Privacy Notice",
        termsRequired: "Please accept the Terms and Privacy Notice before continuing.",
        loadingGoogle: "Loading Google sign-in…",
        googleLoadFailed: "Google sign-in could not load. Check your connection and try again.",
        signingIn: "Creating your player account…",
        signInFailed: "Sign-in did not work. Please try again.",
        retry: "Check again",
        back: "Keep playing earlier stages",
      };

  let gate = null;
  let gateStage = 0;
  let authChecked = false;
  let authChecking = false;
  let authAvailable = false;
  let authOperationalError = false;
  let accountAuthenticated = false;
  let googleClientId = "";
  let googleLoadPromise = null;
  let googleLoadFailed = false;
  let signInPending = false;
  let pendingStageButton = null;

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
      .car-maze-auth-gate__google { min-height: 44px; display: flex; justify-content: center; }
      .car-maze-auth-gate__status { min-height: 22px; margin: 12px 0 0; color: #526970; font-size: 13px; text-align: center; }
      .car-maze-auth-gate__status[data-error="true"] { color: #b33a2c; font-weight: 700; }
      .car-maze-auth-gate__actions { display: flex; flex-wrap: wrap; gap: 10px; }
      .car-maze-auth-gate button { min-height: 44px; padding: 10px 16px; border: 0; border-radius: 12px; cursor: pointer; font: inherit; font-weight: 800; }
      .car-maze-auth-gate button:disabled { cursor: wait; opacity: .65; }
      .car-maze-auth-gate__primary { background: #087fa3; color: #fff; }
      .car-maze-auth-gate__secondary { background: #e8f1f3; color: #087fa3; }
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

  function loadGoogleIdentityServices() {
    if (window.google?.accounts?.id) return Promise.resolve();
    if (googleLoadPromise) return googleLoadPromise;
    googleLoadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector("script[data-google-identity-services]");
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", () => reject(new Error(copy.googleLoadFailed)), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentityServices = "";
      script.onload = resolve;
      script.onerror = () => reject(new Error(copy.googleLoadFailed));
      document.head.appendChild(script);
    });
    return googleLoadPromise;
  }

  function makeLegalLink(label, href) {
    const link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = label;
    return link;
  }

  async function handleGoogleCredential(response) {
    if (signInPending) return;
    const checkbox = gate?.querySelector(".car-maze-auth-gate__terms input");
    if (!checkbox?.checked) {
      setLoginStatus(copy.termsRequired, true);
      checkbox?.focus();
      return;
    }
    const credential = typeof response?.credential === "string" ? response.credential.trim() : "";
    if (!credential) {
      setLoginStatus(copy.signInFailed, true);
      return;
    }

    signInPending = true;
    checkbox.disabled = true;
    setLoginStatus(copy.signingIn);
    try {
      const response = await fetch("/api/public/game/auth/google", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ credential, acceptTerms: true, language: locale }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.player) {
        throw new Error(response.status === 503 ? copy.unavailable : String(payload?.error || copy.signInFailed));
      }

      writeAccount(payload.player);
      accountAuthenticated = true;
      authOperationalError = false;
      try {
        // Keep car-maze-progress-v1 intact so the account handoff never loses guest progress.
        localStorage.removeItem(GUEST_KEY);
      } catch {
        // The server session is already established even if storage is unavailable.
      }
      closeGate();
      window.dispatchEvent(new CustomEvent("car-maze-authenticated", { detail: payload.player }));
      const pendingButton = pendingStageButton;
      pendingStageButton = null;
      if (pendingButton?.isConnected) window.setTimeout(() => pendingButton.click(), 0);
    } catch (error) {
      checkbox.disabled = false;
      setLoginStatus(error instanceof Error ? error.message : copy.signInFailed, true);
    } finally {
      signInPending = false;
    }
  }

  async function mountGoogleButton(slot) {
    if (!authAvailable || googleLoadFailed || !slot?.isConnected) return;
    try {
      setLoginStatus(copy.loadingGoogle);
      await loadGoogleIdentityServices();
      if (!gate || !slot.isConnected || !window.google?.accounts?.id) throw new Error(copy.googleLoadFailed);
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      window.google.accounts.id.renderButton(slot, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: Math.min(360, Math.max(240, window.innerWidth - 96)),
        locale,
      });
      setLoginStatus("");
    } catch {
      googleLoadFailed = true;
      setLoginStatus(copy.googleLoadFailed, true);
    }
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

      const google = document.createElement("div");
      google.className = "car-maze-auth-gate__google";
      const status = document.createElement("p");
      status.className = "car-maze-auth-gate__status";
      status.setAttribute("role", "status");
      auth.append(terms, google, status);
      void mountGoogleButton(google);
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
        googleLoadFailed = false;
        googleLoadPromise = null;
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
        fetch("/api/public/game/auth/config", { cache: "no-store", credentials: "same-origin" }),
        fetch("/api/public/game/auth/session", { cache: "no-store", credentials: "same-origin" }),
      ]);
      if (!configResponse.ok || !sessionResponse.ok) throw new Error("auth service unavailable");
      const config = await configResponse.json();
      const session = await sessionResponse.json();
      googleClientId = typeof config?.googleClientId === "string" ? config.googleClientId.trim() : "";
      authAvailable = Boolean(config?.loginEnabled && config?.googleEnabled && googleClientId);
      accountAuthenticated = Boolean(session?.authenticated && session?.player?.publicId);
      if (accountAuthenticated) {
        writeAccount(session.player);
        closeGate();
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

  function checkCurrentStage() {
    const stage = currentStage();
    if (stage >= 20) {
      if (accountAuthenticated) {
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

    if (target >= 20 || (current >= 20 && target === 0)) {
      if (accountAuthenticated) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      pendingStageButton = button;
      showGate(Math.max(20, target || current));
    }
  }, true);

  const observer = new MutationObserver(checkCurrentStage);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(checkCurrentStage, 0);
})();
