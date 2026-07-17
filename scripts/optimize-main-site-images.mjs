import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const assets = path.join(process.cwd(), "public", "main-site", "assets");

const responsiveSources = [
  "environment-creative-room.webp",
  "environment-entrance-pickup.webp",
  "environment-play-area.webp",
  "environment-shop-front.webp",
];

async function writeVariant(source, width, output) {
  await sharp(path.join(assets, source))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 78, effort: 6 })
    .toFile(path.join(assets, output));
}

async function run() {
  await mkdir(assets, { recursive: true });

  await writeVariant("logo-circle.webp", 96, "logo-circle-96.webp");
  await writeVariant("siamese-cat-cafe-logo.webp", 320, "siamese-cat-cafe-logo-320.webp");
  await writeVariant("environment-cat-cafe-dinner.webp", 320, "environment-cat-cafe-dinner-320.webp");

  for (const source of responsiveSources) {
    const stem = source.replace(/\.webp$/, "");
    await Promise.all([
      writeVariant(source, 480, `${stem}-480.webp`),
      writeVariant(source, 720, `${stem}-720.webp`),
    ]);
  }

  console.log("main-site:images -> responsive WebP variants generated");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
