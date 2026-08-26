(function (global) {
  "use strict";

  var button = document.getElementById("game-session-signout");
  var status = document.getElementById("game-session-status");
  if (!button || !status) return;

  function sync(session) {
    var authenticated = Boolean(session && session.authenticated && session.player);
    button.hidden = !authenticated;
    button.disabled = false;
    button.textContent = button.dataset.idleLabel || "Sign out";
    status.textContent = "";
  }

  async function logout() {
    button.disabled = true;
    button.textContent = button.dataset.busyLabel || "Signing out…";
    status.textContent = "";
    try {
      var response = await fetch("/api/public/game/auth/session", { method: "DELETE" });
      if (!response.ok) throw new Error("logout_failed");
      await response.json();
      localStorage.removeItem("scvd_pid");
      localStorage.removeItem("scvd_player_name");
      var session = { authenticated: false, player: null };
      sync(session);
      global.dispatchEvent(new CustomEvent("scvd:session-changed", { detail: session }));
    } catch (_error) {
      button.disabled = false;
      button.textContent = button.dataset.idleLabel || "Sign out";
      status.textContent = button.dataset.errorLabel || "Sign out failed. Try again.";
    }
  }

  button.addEventListener("click", logout);
  global.SCVDSessionControl = { sync: sync, logout: logout };
})(window);
