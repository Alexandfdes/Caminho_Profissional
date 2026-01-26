import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const root = process.cwd();
const publicDir = path.join(root, 'public');

const sourceSvg = path.join(publicDir, 'favicon.svg');
const sourcePng = path.join(publicDir, 'favicon.png');

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const sourcePath = (await fileExists(sourceSvg)) ? sourceSvg : sourcePng;
  if (!(await fileExists(sourcePath))) {
    throw new Error(`Source favicon not found: ${sourceSvg} or ${sourcePng}`);
  }

  const sizes = [16, 32, 48, 180, 192, 512];

  const outputs = new Map([
    [16, 'favicon-16x16.png'],
    [32, 'favicon-32x32.png'],
    [48, 'favicon-48x48.png'],
    [180, 'apple-touch-icon.png'],
    [192, 'android-chrome-192x192.png'],
    [512, 'android-chrome-512x512.png'],
  ]);

  // Generate PNGs
  for (const size of sizes) {
    const outName = outputs.get(size);
    const outPath = path.join(publicDir, outName);

    const buffer = await sharp(sourcePath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9 })
      .toBuffer();

    await fs.writeFile(outPath, buffer);
  }

  // Generate favicon.ico containing 16/32/48
  const icoPngs = await Promise.all(
    [16, 32, 48].map(async (size) =>
      sharp(sourcePath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png({ compressionLevel: 9 })
        .toBuffer()
    )
  );

  const icoBuf = await pngToIco(icoPngs);
  await fs.writeFile(path.join(publicDir, 'favicon.ico'), icoBuf);

  console.log('Favicons generated in /public');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
