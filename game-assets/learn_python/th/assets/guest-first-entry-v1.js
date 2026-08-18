(() => {
  "use strict";

  const GUEST_KEY = "car-maze-guest-identity-v1";
  const locale = document.documentElement.dataset.defaultLocale === "th" ? "th" : "en";
  const copy = locale === "th"
    ? {
        checking: "กำลังตรวจสอบการตั้งค่าบัญชี…",
        title: "เริ่มเข้าสู่ระบบเมื่อถึงด่าน 20",
        intro: "คุณเล่นด่าน 1–19 ได้โดยไม่ต้องมีบัญชี",
        unavailable: "ขณะนี้ระบบเข้าสู่ระบบยังไม่ได้ตั้งค่า ความคืบหน้าในอุปกรณ์นี้ยังอยู่ครบ และคุณสามารถกลับมาเล่นด่านก่อนหน้าได้",
        available: "เข้าสู่ระบบเพื่อเล่นต่อจากด่าน 20",
        signIn: "เข้าสู่ระบบเพื่อเล่นต่อ",
        back: "กลับไปเล่นด่านก่อนหน้า",
      }
    : {
        checking: "Checking account sign-in availability…",
        title: "Sign-in starts at Stage 20",
        intro: "Stages 1–19 are playable without an account.",
        unavailable: "Account sign-in is not configured for this release yet. Your local progress is safe; you can keep playing the earlier stages.",
        available: "Sign in to continue from Stage 20.",
        signIn: "Sign in to continue",
        back: "Keep playing earlier stages",
      };

  let gate = null;
  let gateStage = 0;
  let authChecked = false;
  let authChecking = false;
  let authAvailable = false;
  let accountAuthenticated = false;

  function readGuest() {
    try {
      const value = JSON.parse(localStorage.getItem(GUEST_KEY) || "null");
      if (!value || value.role !== "guest" || typeof value.id !== "string" || typeof value.nickname !== "string") return null;
      return value;
    } catch {
      return null;
    }
  }

  function ensureGuestIdentity() {
    if (readGuest()) return;
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

  ensureGuestIdentity();

  function hasStoredAuthSession() {
    try {
      return Object.keys(localStorage).some((key) => /auth-token/i.test(key) && !key.includes(GUEST_KEY));
    } catch {
      return false;
    }
  }

  function isGuest() {
    if (accountAuthenticated || hasStoredAuthSession()) return false;
    return Boolean(readGuest());
  }

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
      .car-maze-auth-gate { position: fixed; inset: 0; z-index: 10000; display: grid; place-items: center; padding: 24px; background: rgba(10, 24, 38, .72); backdrop-filter: blur(5px); }
      .car-maze-auth-gate__card { width: min(100%, 500px); padding: 30px; border: 1px solid rgba(8, 127, 163, .24); border-radius: 24px; background: #fff; box-shadow: 0 24px 80px rgba(0, 0, 0, .28); color: #17202b; font: 500 16px/1.55 system-ui, sans-serif; }
      .car-maze-auth-gate__eyebrow { margin: 0 0 8px; color: #087fa3; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
      .car-maze-auth-gate h2 { margin: 0 0 10px; font-size: clamp(24px, 5vw, 34px); line-height: 1.1; }
      .car-maze-auth-gate p { margin: 0 0 18px; }
      .car-maze-auth-gate__message { color: #526970; }
      .car-maze-auth-gate__actions { display: flex; flex-wrap: wrap; gap: 10px; }
      .car-maze-auth-gate button { min-height: 44px; padding: 10px 16px; border: 0; border-radius: 12px; cursor: pointer; font: inherit; font-weight: 800; }
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

  function renderGate() {
    if (!gate) return;
    const message = gate.querySelector(".car-maze-auth-gate__message");
    const actions = gate.querySelector(".car-maze-auth-gate__actions");
    if (!message || !actions) return;
    message.textContent = authChecking ? copy.checking : authAvailable ? copy.available : copy.unavailable;
    actions.replaceChildren();
    if (!authChecking && authAvailable) {
      const signIn = document.createElement("button");
      signIn.type = "button";
      signIn.className = "car-maze-auth-gate__primary";
      signIn.textContent = copy.signIn;
      signIn.addEventListener("click", () => {
        try {
          localStorage.removeItem(GUEST_KEY);
        } catch {
          // The auth entry flow will report the storage problem if it cannot continue.
        }
        window.location.reload();
      });
      actions.appendChild(signIn);
    }
    const back = document.createElement("button");
    back.type = "button";
    back.className = "car-maze-auth-gate__secondary";
    back.textContent = copy.back;
    back.addEventListener("click", returnToEarlierStages);
    actions.appendChild(back);
  }

  function showGate(stage) {
    if (!isGuest()) return;
    addStyles();
    if (gate && gateStage === stage) {
      renderGate();
      return;
    }
    closeGate();
    gateStage = stage;
    gate = document.createElement("div");
    gate.className = "car-maze-auth-gate";
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-labelledby", "car-maze-auth-title");
    gate.innerHTML = `<section class="car-maze-auth-gate__card"><p class="car-maze-auth-gate__eyebrow">Car Maze · ${locale === "th" ? "ด่าน 20" : "Stage 20"}</p><h2 id="car-maze-auth-title">${copy.title}</h2><p>${copy.intro}</p><p class="car-maze-auth-gate__message">${copy.checking}</p><div class="car-maze-auth-gate__actions"></div></section>`;
    document.body.appendChild(gate);
    renderGate();
    checkAuthAvailability();
  }

  async function checkAuthAvailability() {
    if (authChecked || authChecking) return;
    authChecking = true;
    renderGate();
    try {
      const [configResponse, sessionResponse] = await Promise.all([
        fetch("/api/public/game/auth/config", { cache: "no-store", credentials: "same-origin" }),
        fetch("/api/public/game/auth/session", { cache: "no-store", credentials: "same-origin" }),
      ]);
      const config = configResponse.ok ? await configResponse.json() : null;
      const session = sessionResponse.ok ? await sessionResponse.json() : null;
      authAvailable = Boolean(config?.loginEnabled);
      accountAuthenticated = Boolean(session?.authenticated);
    } catch {
      authAvailable = false;
      accountAuthenticated = false;
    } finally {
      authChecked = true;
      authChecking = false;
      if (accountAuthenticated) closeGate();
      else renderGate();
    }
  }

  function checkCurrentStage() {
    if (!isGuest()) {
      closeGate();
      return;
    }
    const stage = currentStage();
    if (stage >= 20) showGate(stage);
  }

  document.addEventListener("click", (event) => {
    if (!isGuest()) return;
    const button = event.target instanceof Element ? event.target.closest("button") : null;
    if (!button || gate?.contains(button)) return;
    const current = currentStage();
    const target = button.classList.contains("levelCard") ? targetStage(button) : /next stage|ด่านถัดไป/i.test(button.textContent || "") ? current + 1 : 0;
    if (target >= 20 || (current >= 20 && target === 0)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showGate(Math.max(20, target || current));
    }
  }, true);

  const observer = new MutationObserver(checkCurrentStage);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(checkCurrentStage, 0);
})();
