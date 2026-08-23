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

const platformNames = {
  ios: "iOS / iPadOS",
  macos: "macOS",
  watchos: "watchOS",
  tvos: "tvOS",
  android: "Android / Android Studio",
};

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
    { idiom: "watch", size: "24x24", scale: "2x", pixels: 48 },
    { idiom: "watch", size: "27.5x27.5", scale: "2x", pixels: 55 },
    { idiom: "watch", size: "40x40", scale: "2x", pixels: 80 },
    { idiom: "watch", size: "44x44", scale: "2x", pixels: 88 },
    { idiom: "watch", size: "86x86", scale: "2x", pixels: 172 },
    { idiom: "watch", size: "98x98", scale: "2x", pixels: 196 },
    { idiom: "watch", size: "1024x1024", scale: "1x", pixels: 1024 },
  ],
  tvos: [
    { idiom: "tv", size: "1280x768", scale: "1x", pixels: 1280, width: 1280, height: 768 },
  ],
};

const androidDensities = [
  { name: "mdpi", pixels: 48 },
  { name: "hdpi", pixels: 72 },
  { name: "xhdpi", pixels: 96 },
  { name: "xxhdpi", pixels: 144 },
  { name: "xxxhdpi", pixels: 192 },
];

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
const maxFileBytes = 25 * 1024 * 1024;

function selectedSlots() {
  return platformSlots[platformSelect.value] || platformSlots.ios;
}

function isAndroid() {
  return platformSelect.value === "android";
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

function updateGuides() {
  document.querySelector("#appleGuide").classList.toggle("hidden", isAndroid());
  document.querySelector("#androidGuide").classList.toggle("hidden", !isAndroid());
  androidOptions.classList.toggle("hidden", !isAndroid());
  androidMaskPreview.classList.toggle("hidden", !isAndroid() || !sourceImage);
}

function analyzeAlpha(image) {
  const canvas = document.createElement("canvas");
  const size = Math.min(image.width, 256);
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const ratio = image.width / image.height;
  const width = ratio >= 1 ? size : size * ratio;
  const height = ratio <= 1 ? size : size / ratio;
  context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
  const pixels = context.getImageData(0, 0, size, size).data;
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
  if (!file || !supportedTypes.has(file.type)) {
    showError("Vui lòng chọn đúng file PNG, JPG hoặc WEBP.");
    return;
  }
  if (file.size > maxFileBytes) {
    showError("File quá lớn. Vui lòng chọn ảnh nhỏ hơn 25 MB.");
    return;
  }
  try {
    const image = await decodeImage(file);
    sourceImage = image;
    sourceFile = file;
    sourceHasAlpha = analyzeAlpha(image);
    sourceNeedsUpscale = image.width < 1024 || image.height < 1024;
    allowUpscale = !sourceNeedsUpscale;
    fileName.textContent = file.name;
    fileSize.textContent = `${image.width} × ${image.height}px · ${formatBytes(file.size)}`;
    fileInfo.classList.remove("hidden");
    uploadTitle.textContent = "Ảnh đã sẵn sàng";
    uploadHint.textContent = "Chọn ảnh khác nếu muốn thay đổi";
    updateDownloadState();
    updatePlatformUI();
    renderPreview();
    const warnings = [];
    if (sourceNeedsUpscale) warnings.push("ảnh sẽ được upscale khi xuất");
    if (sourceHasAlpha) warnings.push("có transparency; icon App Store sẽ được flatten trên nền trắng");
    showStatus(warnings.length ? `Lưu ý: ${warnings.join("; ")}.` : "Ảnh hợp lệ và sẵn sàng xuất.", warnings.length ? "warning" : "success");
  } catch (error) {
    showError("Không thể đọc ảnh này. Hãy thử một file PNG hoặc JPG khác.");
    console.error(error);
  }
}

function renderPreview() {
  previewStage.querySelectorAll(".icon-preview").forEach((node) => node.remove());
  const main = document.createElement("img");
  main.className = "icon-preview main";
  main.src = sourceImage.src;
  main.alt = "Preview App Icon";
  const small = document.createElement("img");
  small.className = "icon-preview small";
  small.src = sourceImage.src;
  small.alt = "";
  previewStage.append(main, small);
  previewStage.querySelector(".empty-preview").classList.add("hidden");
}

function drawIcon(slot) {
  const canvas = document.createElement("canvas");
  const width = slot.width || slot.pixels;
  const height = slot.height || slot.pixels;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
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
  if (slot.idiom === "ios-marketing" && sourceHasAlpha) {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(sourceImage, offsetX, offsetY, drawWidth, drawHeight);
  return canvas.toDataURL("image/png");
}

function drawAndroidIcon(size, background = false) {
  const slot = { pixels: size };
  const dataUrl = drawIcon(slot);
  if (!background || !sourceHasAlpha) return dataUrl;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size, size);
  context.drawImage(sourceImage, 0, 0, size, size);
  return canvas.toDataURL("image/png");
}

function drawAndroidForeground(size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
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
  const context = canvas.getContext("2d");
  context.drawImage(sourceImage, 0, 0, size, size);
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
  const context = canvas.getContext("2d");
  context.fillStyle = androidBackgroundColor.value;
  context.fillRect(0, 0, 512, 512);
  const imageRatio = sourceImage.width / sourceImage.height;
  let width = 512;
  let height = 512;
  let offsetX = 0;
  let offsetY = 0;
  if (imageRatio > 1) {
    width = 512 * imageRatio;
    offsetX = (512 - width) / 2;
  } else if (imageRatio < 1) {
    height = 512 / imageRatio;
    offsetY = (512 - height) / 2;
  }
  context.drawImage(sourceImage, offsetX, offsetY, width, height);
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
    folder.file("ic_launcher_round.png", drawAndroidIcon(density.pixels).split(",")[1], { base64: true });
    files.push(`AndroidStudio/res/mipmap-${density.name}/${filename}`, `AndroidStudio/res/mipmap-${density.name}/ic_launcher_round.png`);
  });
  const anydpi = zip.folder("AndroidStudio/res/mipmap-anydpi-v26");
  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/ic_launcher_background" />\n    <foreground android:drawable="@drawable/ic_launcher_foreground" />\n    <monochrome android:drawable="@drawable/ic_launcher_monochrome" />\n</adaptive-icon>\n`;
  anydpi.file("ic_launcher.xml", adaptiveXml);
  anydpi.file("ic_launcher_round.xml", adaptiveXml);
  const values = zip.folder("AndroidStudio/res/values");
  values.file("colors.xml", `<?xml version="1.0" encoding="utf-8"?>\n<resources><color name="ic_launcher_background">${androidBackgroundColor.value}</color></resources>\n`);
  const drawables = zip.folder("AndroidStudio/res/drawable-nodpi");
  drawables.file("ic_launcher_foreground.png", drawAndroidForeground(108).split(",")[1], { base64: true });
  drawables.file("ic_launcher_monochrome.png", drawAndroidMonochrome(108).split(",")[1], { base64: true });
  const playIcon = drawAndroidPlayIcon();
  zip.file("AndroidStudio/play-store-icon.png", playIcon.split(",")[1], { base64: true });
  zip.file("AndroidStudio/AndroidManifest-snippet.xml", `<application\n    android:icon="@mipmap/ic_launcher"\n    android:roundIcon="@mipmap/ic_launcher_round"\n    ... />\n`);
  files.push("AndroidStudio/res/mipmap-anydpi-v26/ic_launcher.xml", "AndroidStudio/res/mipmap-anydpi-v26/ic_launcher_round.xml", "AndroidStudio/res/values/colors.xml", "AndroidStudio/res/drawable-nodpi/ic_launcher_foreground.png", "AndroidStudio/res/drawable-nodpi/ic_launcher_monochrome.png", "AndroidStudio/play-store-icon.png", "AndroidStudio/AndroidManifest-snippet.xml");
  zip.file("AndroidStudio/README.txt", "Copy the res folder into app/src/main/res, then reference @mipmap/ic_launcher in AndroidManifest.xml.\nThe mipmap-* PNGs support legacy launchers. The adaptive XML includes foreground, background, and monochrome layers for Android 8.0+ and Android 13+ themed icons.\nThe play-store-icon.png is a 512x512 sRGB PNG intended for Google Play and has been checked against the 1 MB limit.\n");
  return files;
}

function createContents() {
  if (isAndroid()) return null;
  const slots = selectedSlots();
  const seen = new Set();
  const images = slots.map((slot) => ({
    filename: `AppIcon-${slot.idiom}-${slot.size.replaceAll(".", "_")}-${slot.scale}.png`,
    idiom: slot.idiom,
    scale: slot.scale,
    size: slot.size,
  }));
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
    showError("Ảnh nhỏ hơn 1024px. Hãy xác nhận upscale trước khi tải.");
    return;
  }
  clearError();
  if (!window.JSZip) {
    showError("Không tải được bộ nén. Hãy kiểm tra kết nối rồi thử lại.");
    return;
  }
  downloadButton.disabled = true;
  downloadLabel.textContent = "Đang tạo bộ icon…";
  try {
    const zip = new JSZip();
    if (isAndroid()) {
      createAndroidFiles(zip);
    } else {
      const folder = zip.folder("AppIcon.appiconset");
      folder.file("Contents.json", JSON.stringify(createContents(), null, 2));
      const expectedFiles = new Set();
      selectedSlots().forEach((slot) => {
        const filename = `AppIcon-${slot.idiom}-${slot.size.replaceAll(".", "_")}-${slot.scale}.png`;
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
    showError("Có lỗi khi tạo file ZIP. Vui lòng thử lại.");
    console.error(error);
  } finally {
    downloadButton.disabled = false;
    downloadLabel.textContent = `Tải ${platformSelect.value}-AppIcon.zip`;
  }
}

function updatePlatformUI() {
  const platform = platformSelect.value;
  const slots = selectedSlots();
  dimensionText.textContent = sourceImage ? (isAndroid() ? "10 launcher PNGs + adaptive + Play icon" : `${slots.length} files · ${platformNames[platform]}`) : "—";
  downloadLabel.textContent = `Tải ${platform}-AppIcon.zip`;
  outputDescription.innerHTML = isAndroid()
    ? "ZIP Android Studio gồm thư mục <code>res/mipmap-*</code>, PNG launcher và adaptive icon XML."
    : `ZIP ${platformNames[platform]} gồm PNG và <code>Contents.json</code> cho Xcode.`;
  updateGuides();
  updateDownloadState();
}

updatePlatformUI();

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
  fileInput.value = "";
  fileInfo.classList.add("hidden");
  uploadTitle.textContent = "Kéo thả ảnh vào đây";
  uploadHint.innerHTML = "hoặc <u>chọn file</u> từ máy tính";
  downloadButton.disabled = true;
  dimensionText.textContent = "—";
  previewStage.querySelectorAll(".icon-preview").forEach((node) => node.remove());
  previewStage.querySelector(".empty-preview").classList.remove("hidden");
  showStatus("");
  updateDownloadState();
  clearError();
});
downloadButton.addEventListener("click", downloadAssetSet);
platformSelect.addEventListener("change", updatePlatformUI);
androidBackgroundColor.addEventListener("input", updatePlatformUI);
upscaleButton.addEventListener("click", () => {
  allowUpscale = true;
  updateDownloadState();
  showStatus("Đã cho phép upscale ảnh. Chất lượng ở các kích thước nhỏ có thể giảm.", "warning");
});
