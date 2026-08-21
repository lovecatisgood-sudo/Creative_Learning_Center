if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    const loopback = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
    if (loopback) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations
        .filter((registration) => new URL(registration.scope).pathname.startsWith("/game/learn_python/"))
        .map((registration) => registration.unregister()));
      if ("caches" in window) {
        const cacheNames = await window.caches.keys();
        await Promise.all(cacheNames
          .filter((name) => name.includes("workbox-precache") || name.includes("car-maze-world-media"))
          .map((name) => window.caches.delete(name)));
      }
      const reloadKey = "car-maze-local-sw-cleanup-v1";
      if (navigator.serviceWorker.controller && sessionStorage.getItem(reloadKey) !== "done") {
        sessionStorage.setItem(reloadKey, "done");
        window.location.reload();
      } else {
        sessionStorage.removeItem(reloadKey);
      }
      return;
    }
    await navigator.serviceWorker.register("/game/learn_python/en/sw.js", { scope: "/game/learn_python/en/" });
  });
}
