import QRCode from "qrcode";
import { promises as fs } from "fs";

// Generates the printable QR that parents scan to reach the signup form.
// Usage: pnpm signup-qr https://your-domain.com   (writes signup-qr.png)
async function main() {
  const base = process.argv[2];
  if (!base) {
    console.error("Usage: pnpm signup-qr https://your-domain.com");
    process.exit(1);
  }
  const url = `${base.replace(/\/+$/, "")}/signup`;
  const png = await QRCode.toBuffer(url, { type: "png", width: 1024, margin: 2 });
  await fs.writeFile("signup-qr.png", png);
  console.log(`Wrote signup-qr.png → ${url}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
