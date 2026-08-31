const fileInput = document.querySelector("#fileInput");
const dropZone = document.querySelector("#dropZone");
const previewStage = document.querySelector("#previewStage");
const uploadTitle = document.querySelector("#uploadTitle");
const uploadHint = document.querySelector("#uploadHint");
const fileInfo = document.querySelector("#fileInfo");
const fileName = document.querySelector("#fileName");
const fileSize = document.querySelector("#fileSize");
const removeButton = document.querySelector("#removeButton");
const downloadButton = document.querySelector("#downloadButton");
const dimensionText = document.querySelector("#dimensionText");
const errorMessage = document.querySelector("#errorMessage");
const platformSelect = document.querySelector("#platformSelect");
const validationStatus = document.querySelector("#validationStatus");
const downloadLabel = document.querySelector("#downloadLabel");
const outputDescription = document.querySelector("#outputDescription");
const upscaleButton = document.querySelector("#upscaleButton");
const androidOptions = document.querySelector("#androidOptions");
const androidBackgroundColor = document.querySelector("#androidBackgroundColor");
const androidMaskPreview = document.querySelector("#androidMaskPreview");

let sourceImage = null;
let sourceFile = null;
let sourceCanvas = null;
let sourceHasAlpha = false;
let sourceNeedsUpscale = false;
let allowUpscale = false;

function t(key, vars) {
  return window.AppIconI18n ? AppIconI18n.t(key, vars) : key;
}

function platformLabel(platform = platformSelect.value) {
  return t(`platform.${platform}`);
}

const platformSlots = {
  ios: [
  { idiom: "iphone", size: "20x20", scale: "2x", pixels: 40 },
  { idiom: "iphone", size: "20x20", scale: "3x", pixels: 60 },
  { idiom: "iphone", size: "29x29", scale: "2x", pixels: 58 },
  { idiom: "iphone", size: "29x29", scale: "3x", pixels: 87 },
  { idiom: "iphone", size: "40x40", scale: "2x", pixels: 80 },
  { idiom: "iphone", size: "40x40", scale: "3x", pixels: 120 },
  { idiom: "iphone", size: "60x60", scale: "2x", pixels: 120 },
  { idiom: "iphone", size: "60x60", scale: "3x", pixels: 180 },
  { idiom: "ipad", size: "20x20", scale: "1x", pixels: 20 },
  { idiom: "ipad", size: "20x20", scale: "2x", pixels: 40 },
  { idiom: "ipad", size: "29x29", scale: "1x", pixels: 29 },
  { idiom: "ipad", size: "29x29", scale: "2x", pixels: 58 },
  { idiom: "ipad", size: "40x40", scale: "1x", pixels: 40 },
  { idiom: "ipad", size: "40x40", scale: "2x", pixels: 80 },
  { idiom: "ipad", size: "76x76", scale: "1x", pixels: 76 },
  { idiom: "ipad", size: "76x76", scale: "2x", pixels: 152 },
  { idiom: "ipad", size: "83.5x83.5", scale: "2x", pixels: 167 },
  { idiom: "ios-marketing", size: "1024x1024", scale: "1x", pixels: 1024 },
  ],
  macos: [
    { idiom: "mac", size: "16x16", scale: "1x", pixels: 16 },
    { idiom: "mac", size: "16x16", scale: "2x", pixels: 32 },
    { idiom: "mac", size: "32x32", scale: "1x", pixels: 32 },
    { idiom: "mac", size: "32x32", scale: "2x", pixels: 64 },
    { idiom: "mac", size: "128x128", scale: "1x", pixels: 128 },
    { idiom: "mac", size: "128x128", scale: "2x", pixels: 256 },
    { idiom: "mac", size: "256x256", scale: "1x", pixels: 256 },
    { idiom: "mac", size: "256x256", scale: "2x", pixels: 512 },
    { idiom: "mac", size: "512x512", scale: "1x", pixels: 512 },
    { idiom: "mac", size: "512x512", scale: "2x", pixels: 1024 },
  ],
  watchos: [
    { idiom: "watch", size: "24x24", scale: "2x", pixels: 48, role: "notificationCenter", subtype: "38mm" },
    { idiom: "watch", size: "27.5x27.5", scale: "2x", pixels: 55, role: "notificationCenter", subtype: "42mm" },
    { idiom: "watch", size: "33x33", scale: "2x", pixels: 66, role: "notificationCenter" },
    { idiom: "watch", size: "29x29", scale: "2x", pixels: 58, role: "companionSettings" },
    { idiom: "watch", size: "29x29", scale: "3x", pixels: 87, role: "companionSettings" },
    { idiom: "watch", size: "40x40", scale: "2x", pixels: 80, role: "appLauncher", subtype: "38mm" },
    { idiom: "watch", size: "44x44", scale: "2x", pixels: 88, role: "appLauncher", subtype: "40mm" },
    { idiom: "watch", size: "46x46", scale: "2x", pixels: 92, role: "appLauncher" },
    { idiom: "watch", size: "50x50", scale: "2x", pixels: 100, role: "appLauncher", subtype: "44mm" },
    { idiom: "watch", size: "51x51", scale: "2x", pixels: 102, role: "appLauncher" },
    { idiom: "watch", size: "54x54", scale: "2x", pixels: 108, role: "appLauncher" },
    { idiom: "watch", size: "86x86", scale: "2x", pixels: 172, role: "quickLook", subtype: "38mm" },
    { idiom: "watch", size: "98x98", scale: "2x", pixels: 196, role: "quickLook", subtype: "42mm" },
    { idiom: "watch", size: "108x108", scale: "2x", pixels: 216, role: "quickLook", subtype: "44mm" },
    { idiom: "watch", size: "117x117", scale: "2x", pixels: 234, role: "quickLook" },
    { idiom: "watch", size: "129x129", scale: "2x", pixels: 258, role: "quickLook" },
    { idiom: "watch-marketing", size: "1024x1024", scale: "1x", pixels: 1024 },
  ],
  tvos: [
    { idiom: "tv", size: "400x240", scale: "1x", pixels: 400, width: 400, height: 240 },
    { idiom: "tv", size: "400x240", scale: "2x", pixels: 800, width: 800, height: 480 },
    { idiom: "tv", size: "1280x768", scale: "1x", pixels: 1280, width: 1280, height: 768 },
    { idiom: "tv", size: "1280x768", scale: "2x", pixels: 2560, width: 2560, height: 1536 },
  ],
};

const androidDensities = [
  { name: "mdpi", pixels: 48 },
  { name: "hdpi", pixels: 72 },
  { name: "xhdpi", pixels: 96 },
  { name: "xxhdpi", pixels: 144 },
  { name: "xxxhdpi", pixels: 192 },
];

const androidAdaptiveDensities = [
  { name: "mdpi", pixels: 108 },
  { name: "hdpi", pixels: 162 },
  { name: "xhdpi", pixels: 216 },
  { name: "xxhdpi", pixels: 324 },
  { name: "xxxhdpi", pixels: 432 },
];

function slotFilename(slot) {
  return `AppIcon-${slot.idiom}-${slot.size.replaceAll(".", "_")}-${slot.scale}.png`;
}

function slotContentsEntry(slot) {
  const entry = {
    filename: slotFilename(slot),
    idiom: slot.idiom,
    scale: slot.scale,
    size: slot.size,
  };
  if (slot.role) entry.role = slot.role;
  if (slot.subtype) entry.subtype = slot.subtype;
  return entry;
}

function prepareContext(context) {
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  return context;
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
}

function clearError() {
  errorMessage.classList.add("hidden");
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const supportedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const extensionTypes = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};
const maxFileBytes = 25 * 1024 * 1024;
const tvBrandInfo = { author: "AppIcon", version: 1 };

function resolvedImageType(file) {
  if (!file) return "";
  if (supportedTypes.has(file.type)) return file.type;
  if (file.type === "image/jpg") return "image/jpeg";
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return extensionTypes[ext] || "";
}

function fileLooksLikeJpeg(file) {
  const type = resolvedImageType(file);
  if (type === "image/jpeg") return true;
  return /\.jpe?g$/i.test(file && file.name ? file.name : "");
}

function selectedSlots() {
  return platformSlots[platformSelect.value] || platformSlots.ios;
}

function isAndroid() {
  return platformSelect.value === "android";
}

function isTvOS() {
  return platformSelect.value === "tvos";
}

function showStatus(message, type = "") {
  validationStatus.textContent = message;
  validationStatus.className = `validation-status ${type}`.trim();
}

function updateDownloadState() {
  const blocked = !sourceImage || (sourceNeedsUpscale && !allowUpscale);
  downloadButton.disabled = blocked;
  upscaleButton.classList.toggle("hidden", !sourceNeedsUpscale || allowUpscale);
}

function refreshValidationStatus() {
  if (!sourceImage) {
    showStatus("");
    return;
  }
  const warnings = [];
  if (sourceNeedsUpscale && !allowUpscale) warnings.push(t("warn.upscale"));
  else if (sourceNeedsUpscale && allowUpscale) warnings.push(t("warn.upscaleOn"));
  if (sourceHasAlpha) {
    if (isAndroid()) warnings.push(t("warn.alphaAndroid"));
    else if (isTvOS()) warnings.push(t("warn.alphaTvos"));
    else warnings.push(t("warn.alphaIos"));
  }
  showStatus(warnings.length ? t("status.note", { details: warnings.join("; ") }) : t("status.ok"), warnings.length ? "warning" : "success");
}

function updateGuides() {
  document.querySelector("#appleGuide").classList.toggle("hidden", isAndroid());
  document.querySelector("#androidGuide").classList.toggle("hidden", !isAndroid());
  androidOptions.classList.toggle("hidden", !isAndroid());
  androidMaskPreview.classList.toggle("hidden", !isAndroid() || !sourceImage);
  updateAndroidMaskPreview();
  const title = document.querySelector("#appleGuideTitle");
  const body = document.querySelector("#appleGuideBody");
  if (title && body) {
    title.textContent = t("guide.apple.title");
    body.innerHTML = isTvOS() ? t("guide.apple.bodyTv") : t("guide.apple.body");
  }
}

function analyzeAlpha(image, file) {
  if (fileLooksLikeJpeg(file)) return false;
  const maxSide = 256;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height, 1));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] < 255) return true;
  }
  return false;
}

async function decodeImage(file) {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext("2d").drawImage(bitmap, 0, 0);
      bitmap.close();
      const image = new Image();
      image.src = canvas.toDataURL("image/png");
      await image.decode();
      return image;
    } catch (error) {
      console.warn("EXIF orientation fallback:", error);
    }
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function loadFile(file) {
  clearError();
  const type = resolvedImageType(file);
  if (!file || !supportedTypes.has(type)) {
    showError(t("error.type"));
    return;
  }
  if (file.size > maxFileBytes) {
    showError(t("error.size"));
    return;
  }
  try {
    const image = await decodeImage(file);
    sourceImage = image;
    sourceFile = file;
    sourceHasAlpha = analyzeAlpha(image, file);
    sourceNeedsUpscale = image.width < 1024 || image.height < 1024;
    allowUpscale = !sourceNeedsUpscale;
    fileName.textContent = file.name;
    fileSize.textContent = `${image.width} × ${image.height}px · ${formatBytes(file.size)}`;
    fileInfo.classList.remove("hidden");
    restoreUploadCopy();
    updateDownloadState();
    updatePlatformUI();
    renderPreview();
  } catch (error) {
    showError(t("error.decode"));
    console.error(error);
  }
}

function coverDrawMetrics(width, height) {
  const imageRatio = sourceImage.width / sourceImage.height;
  let drawWidth = width;
  let drawHeight = height;
  let offsetX = 0;
  let offsetY = 0;
  if (imageRatio > 1) {
    drawWidth = height * imageRatio;
    offsetX = (width - drawWidth) / 2;
  } else if (imageRatio < 1) {
    drawHeight = width / imageRatio;
    offsetY = (height - drawHeight) / 2;
  }
  return { drawWidth, drawHeight, offsetX, offsetY };
}

function drawCover(context, width, height) {
  const metrics = coverDrawMetrics(width, height);
  context.drawImage(sourceImage, metrics.offsetX, metrics.offsetY, metrics.drawWidth, metrics.drawHeight);
}

function renderPreview() {
  previewStage.querySelectorAll(".icon-preview").forEach((node) => node.remove());
  const main = document.createElement("img");
  main.className = "icon-preview main";
  main.src = sourceImage.src;
  main.alt = t("preview.alt");
  const small = document.createElement("img");
  small.className = "icon-preview small";
  small.src = sourceImage.src;
  small.alt = "";
  previewStage.append(main, small);
  previewStage.querySelector(".empty-preview").classList.add("hidden");
  updateAndroidMaskPreview();
}

function updateAndroidMaskPreview() {
  previewStage.classList.toggle("android-preview", isAndroid() && !!sourceImage);
  const url = sourceImage ? `url("${sourceImage.src}")` : "none";
  const color = androidBackgroundColor.value;
  androidMaskPreview.querySelectorAll("[data-mask]").forEach((node) => {
    node.style.backgroundColor = color;
    const inner = node.querySelector("i");
    if (inner) inner.style.backgroundImage = url;
  });
}

function drawIcon(slot) {
  const canvas = document.createElement("canvas");
  const width = slot.width || slot.pixels;
  const height = slot.height || slot.pixels;
  canvas.width = width;
  canvas.height = height;
  const context = prepareContext(canvas.getContext("2d"));
  if (sourceHasAlpha && (slot.flatten || slot.idiom === "ios-marketing" || slot.idiom === "watch-marketing")) {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }
  drawCover(context, width, height);
  return canvas.toDataURL("image/png");
}

function drawAndroidIcon(size, { round = false } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = prepareContext(canvas.getContext("2d"));
  if (round) {
    context.beginPath();
    context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    context.closePath();
    context.clip();
  }
  drawCover(context, size, size);
  return canvas.toDataURL("image/png");
}

function drawAndroidForeground(size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = prepareContext(canvas.getContext("2d"));
  const safeSize = size * (66 / 108);
  const imageRatio = sourceImage.width / sourceImage.height;
  let width = safeSize;
  let height = safeSize;
  if (imageRatio > 1) height = safeSize / imageRatio;
  if (imageRatio < 1) width = safeSize * imageRatio;
  context.drawImage(sourceImage, (size - width) / 2, (size - height) / 2, width, height);
  return canvas.toDataURL("image/png");
}

function drawAndroidMonochrome(size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = prepareContext(canvas.getContext("2d"));
  drawCover(context, size, size);
  const imageData = context.getImageData(0, 0, size, size);
  for (let index = 0; index < imageData.data.length; index += 4) {
    const alpha = imageData.data[index + 3];
    const luminance = Math.round((imageData.data[index] * 0.299) + (imageData.data[index + 1] * 0.587) + (imageData.data[index + 2] * 0.114));
    imageData.data[index] = 255;
    imageData.data[index + 1] = 255;
    imageData.data[index + 2] = 255;
    imageData.data[index + 3] = Math.round(alpha * (luminance / 255));
  }
  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

function drawAndroidPlayIcon() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = prepareContext(canvas.getContext("2d"));
  context.fillStyle = androidBackgroundColor.value;
  context.fillRect(0, 0, 512, 512);
  drawCover(context, 512, 512);
  const dataUrl = canvas.toDataURL("image/png");
  const bytes = atob(dataUrl.split(",")[1]).length;
  if (bytes > 1024 * 1024) throw new Error("Google Play icon exceeds 1 MB");
  return dataUrl;
}

function createAndroidFiles(zip) {
  const files = [];
  androidDensities.forEach((density) => {
    const folder = zip.folder(`AndroidStudio/res/mipmap-${density.name}`);
    const filename = `ic_launcher.png`;
    folder.file(filename, drawAndroidIcon(density.pixels).split(",")[1], { base64: true });
    folder.file("ic_launcher_round.png", drawAndroidIcon(density.pixels, { round: true }).split(",")[1], { base64: true });
    files.push(`AndroidStudio/res/mipmap-${density.name}/${filename}`, `AndroidStudio/res/mipmap-${density.name}/ic_launcher_round.png`);
  });
  const anydpi = zip.folder("AndroidStudio/res/mipmap-anydpi-v26");
  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/ic_launcher_background" />\n    <foreground android:drawable="@drawable/ic_launcher_foreground" />\n    <monochrome android:drawable="@drawable/ic_launcher_monochrome" />\n</adaptive-icon>\n`;
  anydpi.file("ic_launcher.xml", adaptiveXml);
  anydpi.file("ic_launcher_round.xml", adaptiveXml);
  const values = zip.folder("AndroidStudio/res/values");
  values.file("ic_launcher_colors.xml", `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${androidBackgroundColor.value}</color>\n</resources>\n`);
  androidAdaptiveDensities.forEach((density) => {
    const folder = zip.folder(`AndroidStudio/res/drawable-${density.name}`);
    folder.file("ic_launcher_foreground.png", drawAndroidForeground(density.pixels).split(",")[1], { base64: true });
    folder.file("ic_launcher_monochrome.png", drawAndroidMonochrome(density.pixels).split(",")[1], { base64: true });
    files.push(`AndroidStudio/res/drawable-${density.name}/ic_launcher_foreground.png`, `AndroidStudio/res/drawable-${density.name}/ic_launcher_monochrome.png`);
  });
  const playIcon = drawAndroidPlayIcon();
  zip.file("AndroidStudio/play-store-icon.png", playIcon.split(",")[1], { base64: true });
  zip.file("AndroidStudio/AndroidManifest-snippet.txt", "Add these attributes on the <application> element in AndroidManifest.xml:\n\n    android:icon=\"@mipmap/ic_launcher\"\n    android:roundIcon=\"@mipmap/ic_launcher_round\"\n");
  files.push("AndroidStudio/res/mipmap-anydpi-v26/ic_launcher.xml", "AndroidStudio/res/mipmap-anydpi-v26/ic_launcher_round.xml", "AndroidStudio/res/values/ic_launcher_colors.xml", "AndroidStudio/play-store-icon.png", "AndroidStudio/AndroidManifest-snippet.txt");
  zip.file("AndroidStudio/README.txt", [
    "Merge the CONTENTS of the res folder into app/src/main/res.",
    "Do not copy the res folder itself — that would create app/src/main/res/res.",
    "",
    "Copy these directories/files into app/src/main/res:",
    "  - mipmap-mdpi, mipmap-hdpi, mipmap-xhdpi, mipmap-xxhdpi, mipmap-xxxhdpi",
    "  - mipmap-anydpi-v26",
    "  - drawable-mdpi through drawable-xxxhdpi (adaptive foreground + monochrome)",
    "  - values/ic_launcher_colors.xml",
    "",
    "Do not overwrite an existing values/colors.xml. This package uses ic_launcher_colors.xml so it merges safely.",
    "Then set android:icon=\"@mipmap/ic_launcher\" and android:roundIcon=\"@mipmap/ic_launcher_round\" on <application>.",
    "",
    "Legacy mipmap-* PNGs are 48dp launcher icons for API < 26.",
    "Adaptive layers are 108dp; PNGs are exported at mdpi 108px through xxxhdpi 432px.",
    "play-store-icon.png is a 512x512 sRGB PNG for Google Play and is checked against the 1 MB limit.",
  ].join("\n"));
  return files;
}

function transparentPng(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas.toDataURL("image/png");
}

function addTvImageSet(zip, path, files) {
  const folder = zip.folder(path);
  folder.file("Contents.json", JSON.stringify({
    images: files.map((file) => ({ idiom: "tv", filename: file.filename, scale: file.scale })),
    info: tvBrandInfo,
  }, null, 2));
  files.forEach((file) => {
    folder.file(file.filename, file.dataUrl.split(",")[1], { base64: true });
  });
}

function addTvStackLayer(zip, path, files) {
  zip.folder(path).file("Contents.json", JSON.stringify({ info: tvBrandInfo }, null, 2));
  addTvImageSet(zip, `${path}/Content.imageset`, files);
}

function tvLayerFiles(width, height, flatten) {
  return [
    { filename: "img.png", scale: "1x", dataUrl: drawIcon({ width, height, pixels: width, flatten }) },
    { filename: "img@2x.png", scale: "2x", dataUrl: drawIcon({ width: width * 2, height: height * 2, pixels: width * 2, flatten }) },
  ];
}

function transparentLayerFiles(width, height) {
  return [
    { filename: "img.png", scale: "1x", dataUrl: transparentPng(width, height) },
    { filename: "img@2x.png", scale: "2x", dataUrl: transparentPng(width * 2, height * 2) },
  ];
}

function addTvImageStack(zip, path, width, height) {
  zip.folder(path).file("Contents.json", JSON.stringify({
    info: tvBrandInfo,
    layers: [
      { filename: "Front.imagestacklayer" },
      { filename: "Middle.imagestacklayer" },
      { filename: "Back.imagestacklayer" },
    ],
  }, null, 2));
  addTvStackLayer(zip, `${path}/Front.imagestacklayer`, tvLayerFiles(width, height, false));
  addTvStackLayer(zip, `${path}/Middle.imagestacklayer`, transparentLayerFiles(width, height));
  addTvStackLayer(zip, `${path}/Back.imagestacklayer`, tvLayerFiles(width, height, true));
}

function createTvBrandAssets(zip) {
  const root = "App Icon & Top Shelf Image.brandassets";
  zip.folder(root).file("Contents.json", JSON.stringify({
    assets: [
      { size: "1280x768", idiom: "tv", filename: "App Icon - App Store.imagestack", role: "primary-app-icon" },
      { size: "400x240", idiom: "tv", filename: "App Icon.imagestack", role: "primary-app-icon" },
      { size: "2320x720", idiom: "tv", filename: "Top Shelf Image Wide.imageset", role: "top-shelf-image-wide" },
      { size: "1920x720", idiom: "tv", filename: "Top Shelf Image.imageset", role: "top-shelf-image" },
    ],
    info: tvBrandInfo,
  }, null, 2));
  addTvImageStack(zip, `${root}/App Icon.imagestack`, 400, 240);
  addTvImageStack(zip, `${root}/App Icon - App Store.imagestack`, 1280, 768);
  addTvImageSet(zip, `${root}/Top Shelf Image.imageset`, [
    { filename: "TopShelf.png", scale: "1x", dataUrl: drawIcon({ width: 1920, height: 720, pixels: 1920, flatten: true }) },
    { filename: "TopShelf@2x.png", scale: "2x", dataUrl: drawIcon({ width: 3840, height: 1440, pixels: 3840, flatten: true }) },
  ]);
  addTvImageSet(zip, `${root}/Top Shelf Image Wide.imageset`, [
    { filename: "TopShelfWide.png", scale: "1x", dataUrl: drawIcon({ width: 2320, height: 720, pixels: 2320, flatten: true }) },
    { filename: "TopShelfWide@2x.png", scale: "2x", dataUrl: drawIcon({ width: 4640, height: 1440, pixels: 4640, flatten: true }) },
  ]);
  zip.file("README.txt", [
    "Drag the folder App Icon & Top Shelf Image.brandassets into Assets.xcassets in your tvOS target.",
    "App icons are layered image stacks (Front / Middle / Back). Back is opaque; Front keeps source alpha.",
    "Top Shelf Image is 1920x720 (@2x 3840x1440). Top Shelf Image Wide is 2320x720 (@2x 4640x1440).",
    "These PNG stacks are a single-artwork approximation. For a custom parallax look, edit layers in Xcode or Icon Composer.",
  ].join("\n"));
}

function createContents() {
  if (isAndroid()) return null;
  const slots = selectedSlots();
  const seen = new Set();
  const images = slots.map((slot) => slotContentsEntry(slot));
  images.forEach((image) => {
    if (seen.has(image.filename)) throw new Error("Duplicate asset filename");
    seen.add(image.filename);
  });
  return {
    images,
    info: { author: "AppIcon", version: 1 },
  };
}

async function downloadAssetSet() {
  if (!sourceImage) return;
  if (sourceNeedsUpscale && !allowUpscale) {
    showError(t("error.upscale"));
    return;
  }
  clearError();
  if (!window.JSZip) {
    showError(t("error.zipLib"));
    return;
  }
  downloadButton.disabled = true;
  downloadLabel.textContent = t("download.working");
  try {
    const zip = new JSZip();
    if (isAndroid()) {
      createAndroidFiles(zip);
    } else if (isTvOS()) {
      createTvBrandAssets(zip);
    } else {
      const folder = zip.folder("AppIcon.appiconset");
      folder.file("Contents.json", JSON.stringify(createContents(), null, 2));
      const expectedFiles = new Set();
      selectedSlots().forEach((slot) => {
        const filename = slotFilename(slot);
        if (expectedFiles.has(filename)) throw new Error("Duplicate asset filename");
        expectedFiles.add(filename);
        folder.file(filename, drawIcon(slot).split(",")[1], { base64: true });
      });
      const contents = JSON.parse(JSON.stringify(createContents()));
      if (contents.images.length !== expectedFiles.size) throw new Error("Invalid asset manifest");
    }
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${platformSelect.value}-AppIcon.zip`;
    anchor.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);
    const detail = error && error.message ? error.message : "";
    if (/1 MB/.test(detail)) {
      showError(t("error.playSize"));
    } else if (detail === "Duplicate asset filename" || detail === "Invalid asset manifest") {
      showError(t("error.manifest"));
    } else {
      showError(t("error.zip"));
    }
  } finally {
    downloadButton.disabled = false;
    downloadLabel.textContent = t("download.label", { platform: platformSelect.value });
  }
}

function restoreUploadCopy() {
  if (sourceImage) {
    uploadTitle.textContent = t("upload.ready");
    uploadHint.textContent = t("upload.change");
  } else {
    uploadTitle.textContent = t("upload.title");
    uploadHint.innerHTML = t("upload.hintHtml");
  }
}

function updatePlatformUI() {
  const platform = platformSelect.value;
  const slots = selectedSlots();
  if (!sourceImage) {
    dimensionText.textContent = "—";
  } else if (isAndroid()) {
    dimensionText.textContent = t("dim.android");
  } else if (isTvOS()) {
    dimensionText.textContent = t("dim.tvos");
  } else {
    dimensionText.textContent = t("dim.apple", { count: slots.length, platform: platformLabel(platform) });
  }
  downloadLabel.textContent = t("download.label", { platform });
  if (isAndroid()) {
    outputDescription.innerHTML = t("output.android");
  } else if (isTvOS()) {
    outputDescription.innerHTML = t("output.tvos");
  } else {
    outputDescription.innerHTML = t("output.apple", { platform: platformLabel(platform) });
  }
  restoreUploadCopy();
  updateGuides();
  updateDownloadState();
  if (sourceImage) refreshValidationStatus();
}

updatePlatformUI();
document.addEventListener("i18n:change", updatePlatformUI);

fileInput.addEventListener("change", (event) => loadFile(event.target.files[0]));
["dragenter", "dragover"].forEach((eventName) => dropZone.addEventListener(eventName, (event) => {
  event.preventDefault();
  dropZone.classList.add("dragging");
}));
["dragleave", "drop"].forEach((eventName) => dropZone.addEventListener(eventName, (event) => {
  event.preventDefault();
  dropZone.classList.remove("dragging");
}));
dropZone.addEventListener("drop", (event) => loadFile(event.dataTransfer.files[0]));
removeButton.addEventListener("click", () => {
  sourceImage = null;
  sourceFile = null;
  sourceHasAlpha = false;
  sourceNeedsUpscale = false;
  allowUpscale = false;
  fileInput.value = "";
  fileInfo.classList.add("hidden");
  restoreUploadCopy();
  downloadButton.disabled = true;
  dimensionText.textContent = "—";
  previewStage.querySelectorAll(".icon-preview").forEach((node) => node.remove());
  previewStage.querySelector(".empty-preview").classList.remove("hidden");
  previewStage.classList.remove("android-preview");
  updateAndroidMaskPreview();
  showStatus("");
  updateDownloadState();
  updateGuides();
  clearError();
});
downloadButton.addEventListener("click", downloadAssetSet);
platformSelect.addEventListener("change", updatePlatformUI);
androidBackgroundColor.addEventListener("input", updatePlatformUI);
upscaleButton.addEventListener("click", () => {
  allowUpscale = true;
  updateDownloadState();
  refreshValidationStatus();
});
