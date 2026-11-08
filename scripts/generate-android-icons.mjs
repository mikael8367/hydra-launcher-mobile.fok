import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const source = resolve("resources/icon.png");
const res = resolve("android/app/src/main/res");

const densities = {
  mdpi: { icon: 48, adaptive: 108, foreground: 72 },
  hdpi: { icon: 72, adaptive: 162, foreground: 108 },
  xhdpi: { icon: 96, adaptive: 216, foreground: 144 },
  xxhdpi: { icon: 144, adaptive: 324, foreground: 216 },
  xxxhdpi: { icon: 192, adaptive: 432, foreground: 288 },
};

const image = sharp(source).ensureAlpha();
const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

// Turn the black square background transparent for Android's adaptive icon.
// Keep the Hydra mark white and preserve antialiased edges.
for (let i = 0; i < data.length; i += info.channels) {
  const luminance = (data[i] + data[i + 1] + data[i + 2]) / 3;
  const alpha = Math.max(0, Math.min(255, Math.round(((luminance - 12) / 220) * 255)));
  data[i] = 255;
  data[i + 1] = 255;
  data[i + 2] = 255;
  data[i + 3] = alpha;
}

const foregroundSource = sharp(data, {
  raw: { width: info.width, height: info.height, channels: info.channels },
});

for (const [density, sizes] of Object.entries(densities)) {
  const directory = resolve(res, `mipmap-${density}`);
  await mkdir(directory, { recursive: true });

  await sharp(source)
    .resize(sizes.icon, sizes.icon, { fit: "contain" })
    .png()
    .toFile(resolve(directory, "ic_launcher.png"));

  await sharp(source)
    .resize(sizes.icon, sizes.icon, { fit: "contain" })
    .png()
    .toFile(resolve(directory, "ic_launcher_round.png"));

  const foreground = await foregroundSource
    .clone()
    .resize(sizes.foreground, sizes.foreground, { fit: "contain" })
    .png()
    .toBuffer();

  const offset = Math.round((sizes.adaptive - sizes.foreground) / 2);
  await sharp({
    create: {
      width: sizes.adaptive,
      height: sizes.adaptive,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: foreground, left: offset, top: offset }])
    .png()
    .toFile(resolve(directory, "ic_launcher_foreground.png"));
}

const adaptiveDirectory = resolve(res, "mipmap-anydpi-v26");
const valuesDirectory = resolve(res, "values");
await mkdir(adaptiveDirectory, { recursive: true });
await mkdir(valuesDirectory, { recursive: true });

const adaptiveIcon = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;

await import("node:fs/promises").then(({ writeFile }) =>
  Promise.all([
    writeFile(resolve(adaptiveDirectory, "ic_launcher.xml"), adaptiveIcon),
    writeFile(resolve(adaptiveDirectory, "ic_launcher_round.xml"), adaptiveIcon),
    writeFile(
      resolve(valuesDirectory, "ic_launcher_background.xml"),
      `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#080808</color>
</resources>
`
    ),
  ])
);

console.log("Generated Hydra launcher icons for all Android densities.");
