import { chmod, readdir } from "node:fs/promises";
import path from "node:path";

if (process.platform === "win32") {
  process.exit(0);
}

const architecture = process.arch === "x64" ? "x64" : process.arch === "arm64" ? "arm64" : process.arch;
const packageName = `${process.platform}-${architecture}`;
const pnpmStore = path.resolve("node_modules/.pnpm");
const candidates = [
  path.resolve(`node_modules/@esbuild/${packageName}/bin/esbuild`),
];

try {
  const entries = await readdir(pnpmStore, { withFileTypes: true });
  const prefix = `@esbuild+${packageName}@`;

  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith(prefix)) {
      candidates.push(
        path.join(
          pnpmStore,
          entry.name,
          "node_modules",
          "@esbuild",
          packageName,
          "bin",
          "esbuild",
        ),
      );
    }
  }
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

let repaired = 0;
for (const candidate of new Set(candidates)) {
  try {
    await chmod(candidate, 0o755);
    repaired += 1;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

if (repaired === 0) {
  throw new Error(
    `Unable to locate the esbuild binary for ${packageName}. Run pnpm install before building.`,
  );
}

console.log(`esbuild: verified executable permission on ${repaired} binary path(s)`);
