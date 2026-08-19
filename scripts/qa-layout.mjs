const baseUrl = process.env.QA_BASE_URL ?? "http://127.0.0.1:3000";
const devtoolsUrl = process.env.QA_DEVTOOLS_URL ?? "http://127.0.0.1:9223";
const pages = (process.env.QA_PATHS ? process.env.QA_PATHS.split(",") : [
  "/",
  "/EN",
  "/creative",
  "/EN/creative",
  "/coding-with-ai",
  "/EN/coding-with-ai",
  "/faq",
  "/EN/faq",
  "/signup",
  "/EN/signup",
  "/privacy",
  "/EN/privacy",
]).map((path) => path.trim()).filter(Boolean);
const sizes = [
  [390, 844],
  [1440, 1100],
];

let ws;
let id = 1;
const pending = new Map();

function send(method, params = {}) {
  const requestId = id++;
  ws.send(JSON.stringify({ id: requestId, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(requestId, { resolve, reject });
    setTimeout(() => {
      if (pending.has(requestId)) {
        pending.delete(requestId);
        reject(new Error(`CDP timeout: ${method}`));
      }
    }, 10_000);
  });
}

const browserExpression = `(async () => {
  if (document.readyState !== "complete") {
    await new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
  }
  const imageDecode = Promise.all([...document.images].map((image) => {
    if (image.complete && image.naturalWidth > 0) return Promise.resolve();
    return image.decode?.().catch(() => undefined) ?? Promise.resolve();
  }));
  await Promise.race([imageDecode, new Promise((resolve) => setTimeout(resolve, 3000))]);
  const root = document.documentElement;
  const body = document.body;
  const scrollWidth = Math.max(root.scrollWidth, body.scrollWidth);
  const brokenCandidates = [...document.images]
    .filter((image) => !image.complete || image.naturalWidth === 0)
    .map((image) => image.currentSrc || image.src || image.alt);
  const brokenImages = [];
  for (const src of brokenCandidates) {
    try {
      const response = await fetch(src, { method: "HEAD" });
      if (!response.ok) brokenImages.push(src);
    } catch {
      brokenImages.push(src);
    }
  }
  const overflowing = [...document.querySelectorAll("body *")]
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const scrollableAncestor = element.closest(".blog-categories .container");
      return rect.width > 0 &&
        rect.height > 0 &&
        style.position !== "fixed" &&
        !scrollableAncestor &&
        (rect.right - window.innerWidth > 2 || rect.left < -2);
    })
    .slice(0, 8)
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName,
        className: String(element.className || ""),
        text: String(element.textContent || "").trim().slice(0, 80),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
      };
    });
  return {
    url: location.pathname + location.search,
    title: document.title,
    innerWidth: window.innerWidth,
    scrollWidth,
    overflow: scrollWidth - window.innerWidth,
    brokenImages,
    overflowing,
  };
})()`;

const tab = await fetch(`${devtoolsUrl}/json/new?${encodeURIComponent(`${baseUrl}/`)}`, { method: "PUT" }).then((response) => response.json());
ws = new WebSocket(tab.webSocketDebuggerUrl);
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id).resolve(message);
    pending.delete(message.id);
  }
};
await new Promise((resolve) => {
  ws.onopen = resolve;
});

const failures = [];
for (const [width, height] of sizes) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });

  for (const path of pages) {
    await send("Page.navigate", { url: `${baseUrl}${path}` });
    await new Promise((resolve) => setTimeout(resolve, 900));
    const response = await send("Runtime.evaluate", {
      expression: browserExpression,
      awaitPromise: true,
      returnByValue: true,
    });
    const value = response.result.result.value;
    const failed = value.overflow > 2 || value.brokenImages.length > 0 || value.overflowing.length > 0;
    console.log(`${width}x${height} ${path} overflow=${value.overflow} broken=${value.brokenImages.length} badEls=${value.overflowing.length}`);
    if (failed) failures.push({ width, height, path, value });
  }
}

ws.close();
if (failures.length > 0) {
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}

console.log("qa:layout -> no horizontal overflow or broken images found");
