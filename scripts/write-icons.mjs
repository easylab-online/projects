import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const iconsDir = join(root, "public", "icons");
mkdirSync(iconsDir, { recursive: true });

const data = JSON.parse(readFileSync(join(root, "scripts", "icon-pngs.json"), "utf8"));
for (const [name, b64] of Object.entries(data)) {
  writeFileSync(join(iconsDir, name), Buffer.from(b64, "base64"));
  console.log("wrote", name);
}
