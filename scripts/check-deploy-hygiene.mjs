import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ignoredDirectories = new Set([".git", ".next", ".claude", "node_modules", "uploads", "var"]);
const contentScanRoots = new Set(["public", "scripts", "src"]);
const rootContentScanFiles = new Set([
  "ecosystem.config.js",
  "next.config.mjs",
  "package.json",
  "pnpm-workspace.yaml",
  "postcss.config.mjs",
  "server.js",
]);

function listFiles(directory = ".") {
  const result = [];
  for (const entry of readdirSync(directory)) {
    const path = directory === "." ? entry : join(directory, entry);
    const normalized = path.replaceAll("\\", "/");
    const firstSegment = normalized.split("/")[0];
    if (ignoredDirectories.has(entry) || ignoredDirectories.has(firstSegment)) continue;
    const stats = statSync(path);
    if (stats.isDirectory()) {
      result.push(...listFiles(path));
    } else {
      result.push(normalized);
    }
  }
  return result;
}

const files = listFiles();

const forbiddenPathPatterns = [
  /^sandbox\//,
  /^dist-landing\//,
  /(^|\/).*prototype.*\.html$/i,
  /(^|\/).*preview.*\.html$/i,
  /\.zip$/i,
  /\.ph(p|tml|ar)$/i,
  /(^|\/)\.htaccess$/i,
  /\.(cgi|pl|asp|aspx)$/i,
];

const suspiciousContentPatterns = [
  /\bbase64_decode\s*\(/i,
  /\bgzinflate\s*\(/i,
  /\bstr_rot13\s*\(/i,
  /\bshell_exec\s*\(/i,
  /\bpassthru\s*\(/i,
  /\bproc_open\s*\(/i,
  /\bpopen\s*\(/i,
  /\bcurl_exec\s*\(/i,
  /\beval\s*\(/i,
  /\bnew Function\s*\(/i,
  /\bString\.fromCharCode\s*\(/i,
  /\batob\s*\(/i,
  /\bdocument\.write\s*\(/i,
  /data:[^"')\s]+;base64,[A-Za-z0-9+/=]{1000,}/i,
];

const allowedExternalScriptHosts = new Set(["www.googletagmanager.com"]);
const scannedExtensions = /\.(html|js|jsx|ts|tsx|mjs|cjs|css)$/i;
const failures = [];

for (const file of files) {
  if (forbiddenPathPatterns.some((pattern) => pattern.test(file))) {
    failures.push(`${file}: forbidden production path or file type`);
    continue;
  }

  const firstSegment = file.split("/")[0];
  if (!scannedExtensions.test(file) || (!contentScanRoots.has(firstSegment) && !rootContentScanFiles.has(file))) continue;

  const content = readFileSync(file, "utf8");
  for (const pattern of suspiciousContentPatterns) {
    if (pattern.test(content)) {
      failures.push(`${file}: suspicious content matched ${pattern}`);
      break;
    }
  }

  for (const match of content.matchAll(/<script\b[^>]*\bsrc=["']https?:\/\/([^/"']+)/gi)) {
    if (!allowedExternalScriptHosts.has(match[1])) {
      failures.push(`${file}: unapproved external script host ${match[1]}`);
    }
  }
}

if (failures.length > 0) {
  console.error("deploy:hygiene failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("deploy:hygiene -> tracked production files look clean");
