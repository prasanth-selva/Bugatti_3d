import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "public", "hero-webp");
const skipIfExists = process.argv.includes("--skip-if-exists");
const naturalCompare = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
const candidates = [
  process.env.FRAME_SOURCE_DIR && path.resolve(root, process.env.FRAME_SOURCE_DIR),
  path.join(root, "public", "hero"),
  path.join(root, "hero"),
  path.join(root, "source-frames", "hero"),
].filter(Boolean);

async function findSourceDir() {
  for (const candidate of candidates) {
    try {
      const entries = await fs.readdir(candidate);
      if (entries.some((name) => name.toLowerCase().endsWith(".png"))) return candidate;
    } catch {
      // Try the next expected input location.
    }
  }
  throw new Error(`No PNG frames found. Checked: ${candidates.join(", ")}`);
}

async function existingOutputIsComplete() {
  try {
    const manifest = JSON.parse(await fs.readFile(path.join(outputDir, "manifest.json"), "utf8"));
    if (!Number.isInteger(manifest.frameCount) || manifest.frameCount < 1) return false;
    for (let index = 1; index <= manifest.frameCount; index += 1) {
      const name = `frame_${String(index).padStart(4, "0")}.webp`;
      await fs.access(path.join(outputDir, name));
    }
    return true;
  } catch {
    return false;
  }
}

async function averageCornerColor(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    const width = Math.min(10, metadata.width ?? 0);
    const height = Math.min(10, metadata.height ?? 0);
    if (!width || !height) throw new Error("Invalid source dimensions");
    const { data, info } = await sharp(filePath)
      .extract({ left: 0, top: 0, width, height })
      .removeAlpha()
      .toColourspace("srgb")
      .raw()
      .toBuffer({ resolveWithObject: true });
    const sums = [0, 0, 0];
    for (let offset = 0; offset < data.length; offset += info.channels) {
      for (let channel = 0; channel < 3; channel += 1) sums[channel] += data[offset + channel] ?? 0;
    }
    const pixels = width * height;
    return `#${sums.map((value) => Math.round(value / pixels).toString(16).padStart(2, "0")).join("")}`;
  } catch {
    return "#050505";
  }
}

if (skipIfExists && (await existingOutputIsComplete())) {
  console.log("Frame conversion skipped: complete WebP sequence and manifest already exist.");
  process.exit(0);
}

const sourceDir = await findSourceDir();
const sourceFiles = (await fs.readdir(sourceDir))
  .filter((name) => name.toLowerCase().endsWith(".png"))
  .sort(naturalCompare.compare);

if (sourceFiles.length === 0) throw new Error(`No PNG frames found in ${sourceDir}`);
const selectedFiles = sourceFiles.length > 200 ? sourceFiles.filter((_, index) => index % 2 === 0) : sourceFiles;
const frameNumber = sourceFiles[0].match(/\d+(?=\.png$)/i)?.[0];
const inputPattern = frameNumber
  ? sourceFiles[0].replace(frameNumber, `{index:${String(frameNumber.length).padStart(2, "0")}}`)
  : sourceFiles[0];
const inputBytes = (await Promise.all(sourceFiles.map((file) => fs.stat(path.join(sourceDir, file))))).reduce(
  (total, stats) => total + stats.size,
  0,
);

await fs.mkdir(outputDir, { recursive: true });
for (const name of await fs.readdir(outputDir)) {
  if (/^frame_\d{4}\.webp$/i.test(name) || name === "manifest.json") {
    await fs.rm(path.join(outputDir, name), { force: true });
  }
}

const bgColor = await averageCornerColor(path.join(sourceDir, sourceFiles[0]));
let firstOutputMetadata;
for (const [index, file] of selectedFiles.entries()) {
  const destination = path.join(outputDir, `frame_${String(index + 1).padStart(4, "0")}.webp`);
  const metadata = await sharp(path.join(sourceDir, file))
    .rotate()
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 80, effort: 6 })
    .toFile(destination);
  firstOutputMetadata ??= metadata;
}

const manifest = {
  frameCount: selectedFiles.length,
  width: firstOutputMetadata.width,
  height: firstOutputMetadata.height,
  bgColor,
  pattern: `${inputPattern}; natural order${sourceFiles.length > 200 ? "; every 2nd frame retained" : ""}`,
};
await fs.writeFile(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

const outputNames = (await fs.readdir(outputDir)).filter((name) => /^frame_\d{4}\.webp$/i.test(name));
const outputBytes = (await Promise.all(outputNames.map((name) => fs.stat(path.join(outputDir, name))))).reduce(
  (total, stats) => total + stats.size,
  0,
);
console.log(`Source pattern: ${inputPattern}`);
console.log(`Source frames: ${sourceFiles.length}; frames kept: ${selectedFiles.length}`);
console.log(`Source PNG size: ${(inputBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`Output WebP size: ${(outputBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`Reduction: ${(100 * (1 - outputBytes / inputBytes)).toFixed(1)}%`);
console.log(`Frame dimensions: ${manifest.width}×${manifest.height}; background: ${bgColor}`);
console.log(`Manifest: ${path.relative(root, path.join(outputDir, "manifest.json"))}`);
