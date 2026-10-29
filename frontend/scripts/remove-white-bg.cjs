// frontend/scripts/remove-white-bg.cjs
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

async function processLogo() {
  const inputPath = path.resolve(__dirname, "../public/brand/fn-logo.jpg");
  const outputPath = path.resolve(__dirname, "../public/brand/fn-logo.png");

  console.log("Processing logo from:", inputPath);

  // Get raw RGBA buffer
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const { data, info } = await image
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  console.log(`Dimensions: ${width}x${height}, channels: ${channels}`);

  // Process pixels to remove white background with soft antialiasing
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Distance from pure white
    const dr = 255 - r;
    const dg = 255 - g;
    const db = 255 - b;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);

    // If practically white (distance < 24), make fully transparent
    if (dist < 24) {
      data[i + 3] = 0;
    } else if (dist < 60) {
      // Soft transition edge feathering
      const alpha = Math.min(255, Math.round(((dist - 24) / 36) * 255));
      data[i + 3] = alpha;
    }
  }

  // Save as high-quality transparent PNG
  await sharp(data, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);

  console.log("Successfully saved transparent logo to:", outputPath);
  console.log("Output file size:", fs.statSync(outputPath).size, "bytes");
}

processLogo().catch(console.error);
