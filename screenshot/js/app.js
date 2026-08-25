import { PRESETS, getPreset } from "./presets.js";
import { getHandles, getLayout, pointInObject, render } from "./renderer.js";

const $ = (id) => document.getElementById(id);
const canvas = $("preview");
const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const DEFAULTS = {
  headline: "Your app. Your story.",
  subheadline: "Một trải nghiệm tuyệt vời trên mọi thiết bị.",
  textColor: "#ffffff",
  bgColor: "#5965f2",
  fitMode: "contain",
  showFrame: true,
  showSafe: false,
  layerOrder: ["image", "subheadline", "headline"],
  imageVisible: true,
  headlineVisible: true,
  subheadlineVisible: true
};
const LAYERS = {
  headline: { label: "Tiêu đề", icon: "T" },
  subheadline: { label: "Mô tả", icon: "T" },
  image: { label: "Screenshot", icon: "▧" }
};
const state = {
  presetId: readStorage("screenshot-preset", PRESETS[0].id),
  headline: readStorage("screenshot-headline", DEFAULTS.headline),
  subheadline: readStorage("screenshot-subheadline", DEFAULTS.subheadline),
  textColor: readStorage("screenshot-text-color", DEFAULTS.textColor),
  bgColor: readStorage("screenshot-bg-color", DEFAULTS.bgColor),
  fitMode: readStorage("screenshot-fit", DEFAULTS.fitMode),
  showFrame: readStorage("screenshot-frame", "true") !== "false",
  showSafe: DEFAULTS.showSafe,
  images: [],
  activeIndex: 0,
  history: [],
  historyIndex: -1,
  restoringHistory: false,
  editingText: null,
  editingPos: null
};

function readStorage(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private browsing or a disabled storage policy should not break editing.
  }
}

PRESETS.forEach((preset) => {
  const option = document.createElement("option");
  option.value = preset.id;
  option.textContent = `${preset.platform} · ${preset.name} (${preset.width} × ${preset.height})`;
  $("preset").append(option);
});

function saveSettings() {
  writeStorage("screenshot-preset", state.presetId);
  writeStorage("screenshot-headline", state.headline);
  writeStorage("screenshot-subheadline", state.subheadline);
  writeStorage("screenshot-text-color", state.textColor);
  writeStorage("screenshot-bg-color", state.bgColor);
  writeStorage("screenshot-fit", state.fitMode);
  writeStorage("screenshot-frame", state.showFrame);
}

function setValue(id, value) {
  $(id).value = value;
}

function createImageSettings() {
  return {
    headline: state.headline,
    subheadline: state.subheadline,
    textColor: state.textColor,
    bgColor: state.bgColor,
    fitMode: state.fitMode,
    showFrame: state.showFrame,
    showSafe: state.showSafe,
    layerOrder: [...DEFAULTS.layerOrder],
    imageVisible: true,
    headlineVisible: true,
    subheadlineVisible: true,
    imageScale: 1,
    headlineScale: 1,
    subheadlineScale: 1,
    imageScaleX: 1,
    imageScaleY: 1,
    headlineScaleX: 1,
    headlineScaleY: 1,
    subheadlineScaleX: 1,
    subheadlineScaleY: 1,
    imageRotation: 0,
    headlineRotation: 0,
    subheadlineRotation: 0,
    zoom: 1
  };
}

function getActiveItem() {
  return state.images[state.activeIndex] || null;
}

function getActiveSettings() {
  return getActiveItem()?.settings || state;
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const zoom = getActiveSettings().zoom || 1;
  const baseWidth = rect.width / zoom;
  const baseHeight = rect.height / zoom;
  const baseLeft = rect.left + (rect.width - baseWidth) / 2;
  const baseTop = rect.top + (rect.height - baseHeight) / 2;
  const preset = getPreset(state.presetId);
  const renderScale = Math.min(1, 560 / preset.height);
  return {
    x: ((event.clientX - baseLeft) / baseWidth) * preset.width * renderScale,
    y: ((event.clientY - baseTop) / baseHeight) * preset.height * renderScale
  };
}

function selectElementAt(point) {
  const settings = getActiveSettings();
  const preset = getPreset(state.presetId);
  const scale = Math.min(1, 560 / preset.height);
  const layout = getLayout(preset, settings, scale);
  const order = [...(settings.layerOrder || DEFAULTS.layerOrder)].reverse();
  const selected = settings.selectedElement;
  if (selected && layout[selected]) {
    const handle = Object.values(getHandles(layout[selected], 12)).find((item) =>
      Math.hypot(point.x - item.x, point.y - item.y) <= item.size);
    if (handle) return { element: selected, handle: handle.id };
  }
  for (const id of order) {
    if (pointInObject(point, layout[id])) return { element: id, handle: null };
  }
  return null;
}

function updateZoom() {
  const settings = getActiveSettings();
  settings.zoom = Math.max(0.5, Math.min(2, settings.zoom || 1));
  $("zoomValue").textContent = `${Math.round(settings.zoom * 100)}%`;
  canvas.style.transform = `scale(${settings.zoom})`;
}

function updateDraggedElement(settings, deltaX, deltaY) {
  const preset = getPreset(state.presetId);
  const renderScale = Math.min(1, 560 / preset.height);
  const normalizedX = deltaX / (preset.width * renderScale);
  const normalizedY = deltaY / (preset.height * renderScale);
  if (settings.selectedElement === "image") {
    settings.imageX = (settings.imageX || 0) + normalizedX;
    settings.imageY = (settings.imageY || 0) + normalizedY;
  } else if (settings.selectedElement === "headline") {
    settings.headlineX = (settings.headlineX || 0) + normalizedX;
    settings.headlineY = (settings.headlineY || 0) + normalizedY;
  } else if (settings.selectedElement === "subheadline") {
    settings.subheadlineX = (settings.subheadlineX || 0) + normalizedX;
    settings.subheadlineY = (settings.subheadlineY || 0) + normalizedY;
  }
}

function settingsSnapshot(settings) {
  const copy = structuredClone(settings);
  delete copy.dragStart;
  delete copy.guides;
  delete copy.interaction;
  return copy;
}

function pushHistory() {
  if (state.restoringHistory || !getActiveItem()) return;
  const snapshot = JSON.stringify(settingsSnapshot(getActiveSettings()));
  if (state.history[state.historyIndex]?.snapshot === snapshot) return;
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push({ imageIndex: state.activeIndex, snapshot });
  if (state.history.length > 60) state.history.shift();
  state.historyIndex = state.history.length - 1;
  updateHistoryButtons();
}

function restoreHistory(index) {
  const entry = state.history[index];
  if (!entry || !state.images[entry.imageIndex]) return;
  state.restoringHistory = true;
  state.activeIndex = entry.imageIndex;
  state.images[entry.imageIndex].settings = JSON.parse(entry.snapshot);
  state.historyIndex = index;
  update();
  state.restoringHistory = false;
  updateHistoryButtons();
}

function updateHistoryButtons() {
  $("undoButton").disabled = state.historyIndex <= 0;
  $("redoButton").disabled = state.historyIndex >= state.history.length - 1;
}

function closeTextEditor() {
  const editor = $("textEditor");
  const input = $("textEditorInput");
  const settings = getActiveSettings();
  if (state.editingText && input.value) {
    settings[state.editingText] = input.value;
    pushHistory();
  }
  state.editingText = null;
  state.editingPos = null;
  editor.style.display = "none";
  update();
}

function updateLayerPanel() {
  const settings = getActiveSettings();
  const panel = $("layerPanel");
  panel.replaceChildren();
  [...(settings.layerOrder || DEFAULTS.layerOrder)].reverse().forEach((id) => {
    const row = document.createElement("div");
    row.className = `layer-row${settings.selectedElement === id ? " active" : ""}`;
    row.draggable = true;
    row.dataset.layer = id;
    const select = document.createElement("button");
    select.type = "button";
    select.className = "layer-select";
    select.innerHTML = `<b>${LAYERS[id].icon}</b><span>${LAYERS[id].label}</span>`;
    select.addEventListener("click", () => { settings.selectedElement = id; update(); });
    const visibility = document.createElement("button");
    visibility.type = "button";
    visibility.className = "layer-visibility";
    visibility.textContent = settings[`${id}Visible`] === false ? "○" : "◉";
    visibility.title = settings[`${id}Visible`] === false ? "Hiện layer" : "Ẩn layer";
    visibility.addEventListener("click", () => {
      settings[`${id}Visible`] = settings[`${id}Visible`] === false;
      pushHistory();
      update();
    });
    row.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", id));
    row.addEventListener("dragover", (event) => event.preventDefault());
    row.addEventListener("drop", (event) => {
      event.preventDefault();
      const source = event.dataTransfer.getData("text/plain");
      if (!LAYERS[source] || source === id) return;
      const visualOrder = [...settings.layerOrder].reverse();
      visualOrder.splice(visualOrder.indexOf(source), 1);
      visualOrder.splice(visualOrder.indexOf(id), 0, source);
      settings.layerOrder = visualOrder.reverse();
      pushHistory();
      update();
    });
    row.append(select, visibility);
    panel.append(row);
  });
}

function syncControls(settings) {
  setValue("headline", settings.headline);
  setValue("subheadline", settings.subheadline);
  setValue("textColor", settings.textColor);
  setValue("bgColor", settings.bgColor);
  setValue("fitMode", settings.fitMode);
  $("showFrame").checked = settings.showFrame;
  $("showSafe").checked = settings.showSafe;
}

function updateList() {
  $("imageList").replaceChildren();
  state.images.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = `image-item${index === state.activeIndex ? " active" : ""}`;
    const thumbnail = document.createElement("img");
    thumbnail.alt = "";
    thumbnail.src = item.url;
    const name = document.createElement("span");
    name.textContent = `${index + 1}. ${item.file.name}${item.loading ? " (đang đọc…)" : ""}`;
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `Xóa ${item.file.name}`);
    removeButton.textContent = "×";
    row.append(thumbnail, name, removeButton);
    row.addEventListener("click", () => { state.activeIndex = index; update(); });
    removeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      URL.revokeObjectURL(item.url);
      state.images.splice(index, 1);
      state.activeIndex = Math.max(0, Math.min(state.activeIndex, state.images.length - 1));
      update();
    });
    $("imageList").append(row);
  });
}

function update() {
  const preset = getPreset(state.presetId);
  const settings = getActiveSettings();
  $("preset").value = preset.id;
  $("dimension").textContent = `${preset.width} × ${preset.height} PX`;
  $("empty").hidden = state.images.length > 0;
  const readyImages = state.images.filter((item) => item.image);
  $("downloadButton").disabled = readyImages.length === 0 || !state.images[state.activeIndex]?.image;
  $("downloadAllButton").disabled = readyImages.length === 0;
  if (state.images.length && state.images[state.activeIndex]?.image) {
    const image = state.images[state.activeIndex].image;
    // Render preview at a higher internal resolution, then let CSS scale it down.
    // This avoids the browser enlarging a low-resolution preview canvas.
    render(canvas, image, preset, settings, Math.min(1, 560 / preset.height), 2, true);
    const tooSmall = image.width < preset.width * 0.6 || image.height < preset.height * 0.6;
    $("validation").textContent = tooSmall ? "Ảnh gốc nhỏ hơn khuyến nghị; kết quả có thể bị mờ." : "Ảnh đủ độ phân giải cho preset này.";
  } else {
    state.activeIndex = 0;
    canvas.width = 1; canvas.height = 1; $("validation").textContent = "";
  }
  syncControls(settings);
  updateZoom();
  updateLayerPanel();
  updateHistoryButtons();
  $("validation").classList.remove("error");
  updateList();
  saveSettings();
}

function addFiles(files) {
  const availableSlots = MAX_IMAGES - state.images.length;
  [...files].slice(0, availableSlots).forEach((file) => {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      showError(`${file.name}: chỉ hỗ trợ PNG, JPG hoặc WEBP.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showError(`${file.name}: kích thước vượt quá 25 MB.`);
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    const item = { file, url, image: null, loading: true, settings: createImageSettings() };
    state.images.push(item);
    image.onload = () => {
      item.image = image;
      item.loading = false;
      state.activeIndex = state.images.indexOf(item);
      pushHistory();
      update();
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      const itemIndex = state.images.indexOf(item);
      if (itemIndex >= 0) state.images.splice(itemIndex, 1);
      showError(`${file.name}: không thể đọc ảnh.`);
      update();
    };
    image.src = url;
  });
  if (files.length > availableSlots) showError(`Chỉ có thể xử lý tối đa ${MAX_IMAGES} ảnh.`);
}

function showError(message) {
  $("validation").textContent = message;
  $("validation").classList.add("error");
}

$("imageInput").addEventListener("change", (event) => addFiles(event.target.files));
$("dropzone").addEventListener("dragover", (event) => { event.preventDefault(); });
$("dropzone").addEventListener("drop", (event) => { event.preventDefault(); addFiles(event.dataTransfer.files); });
$("preset").addEventListener("change", (event) => { state.presetId = event.target.value; update(); });
["headline", "subheadline", "textColor", "bgColor", "fitMode"].forEach((id) => {
  $(id).addEventListener("input", (event) => {
    const settings = getActiveSettings();
    settings[id] = event.target.value;
    update();
  });
  $(id).addEventListener("change", pushHistory);
});
$("showFrame").addEventListener("change", (event) => {
  getActiveSettings().showFrame = event.target.checked;
  pushHistory();
  update();
});
$("showSafe").addEventListener("change", (event) => {
  getActiveSettings().showSafe = event.target.checked;
  pushHistory();
  update();
});
function openTextEditor(element, settings) {
  if (!["headline", "subheadline"].includes(element)) return;
  state.editingText = element;
  const editor = $("textEditor");
  const input = $("textEditorInput");
  const label = $("textEditorLabel");
  input.value = settings[element];
  label.textContent = element === "headline" ? "Chỉnh sửa tiêu đề" : "Chỉnh sửa mô tả";
  const preset = getPreset(state.presetId);
  const renderScale = Math.min(1, 560 / preset.height);
  const layout = getLayout(preset, settings, renderScale);
  const bounds = layout[element];
  const zoom = settings.zoom || 1;
  const rect = canvas.getBoundingClientRect();
  const canvasLeft = rect.left + (rect.width - rect.width / zoom) / 2;
  const canvasTop = rect.top + (rect.height - rect.height / zoom) / 2;
  const scale = (rect.width / zoom) / (preset.width * renderScale);
  editor.style.left = `${canvasLeft + bounds.x * scale}px`;
  editor.style.top = `${canvasTop + bounds.y * scale}px`;
  editor.style.width = `${Math.max(200, bounds.width * scale)}px`;
  editor.style.display = "flex";
  input.focus();
  input.select();
}

$("canvasWrap").addEventListener("pointerdown", (event) => {
  if (event.target !== canvas) return;
  const settings = getActiveSettings();
  const point = getCanvasPoint(event);
  const hit = selectElementAt(point);
  settings.selectedElement = hit?.element || null;
  
  // Single click vào tiêu đề/mô tả để mở editor
  if (hit?.element && ["headline", "subheadline"].includes(hit.element) && !hit.handle) {
    openTextEditor(hit.element, settings);
    canvas.setPointerCapture?.(event.pointerId);
    return;
  }
  
  settings.dragStart = point;
  settings.interaction = hit?.handle === "rotate" ? "rotate" : hit?.handle ? "resize" : hit?.element ? "move" : null;
  settings.activeHandle = hit?.handle || null;
  if (settings.interaction) {
    settings.interactionStart = settingsSnapshot(settings);
    const layout = getLayout(getPreset(state.presetId), settings, Math.min(1, 560 / getPreset(state.presetId).height));
    settings.startBounds = layout[settings.selectedElement];
    settings.startAngle = Math.atan2(point.y - settings.startBounds.centerY, point.x - settings.startBounds.centerX);
    settings.startDistance = Math.hypot(point.x - settings.startBounds.centerX, point.y - settings.startBounds.centerY);
  }
  canvas.setPointerCapture?.(event.pointerId);
  update();
});
$("canvasWrap").addEventListener("pointermove", (event) => {
  const settings = getActiveSettings();
  if (!settings.dragStart || !settings.selectedElement || !settings.interaction) return;
  const point = getCanvasPoint(event);
  if (settings.interaction === "move") {
    updateDraggedElement(settings, point.x - settings.dragStart.x, point.y - settings.dragStart.y);
    const preset = getPreset(state.presetId);
    const scale = Math.min(1, 560 / preset.height);
    const bounds = getLayout(preset, settings, scale)[settings.selectedElement];
    const threshold = 7;
    settings.guides = [];
    if (Math.abs(bounds.centerX - preset.width * scale / 2) < threshold) {
      settings[`${settings.selectedElement}X`] = 0;
      settings.guides.push({ axis: "x", value: preset.width * scale / 2 });
    }
    if (Math.abs(bounds.centerY - preset.height * scale / 2) < threshold) {
      settings[`${settings.selectedElement}Y`] -= (bounds.centerY - preset.height * scale / 2) / (preset.height * scale);
      settings.guides.push({ axis: "y", value: preset.height * scale / 2 });
    }
  } else if (settings.interaction === "rotate") {
    const angle = Math.atan2(point.y - settings.startBounds.centerY, point.x - settings.startBounds.centerX);
    let rotation = (settings.interactionStart[`${settings.selectedElement}Rotation`] || 0) + angle - settings.startAngle;
    const snap = Math.PI / 12;
    if (Math.abs(rotation / snap - Math.round(rotation / snap)) < 0.08) rotation = Math.round(rotation / snap) * snap;
    settings[`${settings.selectedElement}Rotation`] = rotation;
  } else {
    const id = settings.selectedElement;
    const handle = settings.activeHandle;
    const dx = point.x - settings.startBounds.centerX;
    const dy = point.y - settings.startBounds.centerY;
    const cos = Math.cos(-settings.startBounds.rotation);
    const sin = Math.sin(-settings.startBounds.rotation);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    const startScaleX = settings.interactionStart[`${id}ScaleX`] || settings.interactionStart[`${id}Scale`] || 1;
    const startScaleY = settings.interactionStart[`${id}ScaleY`] || settings.interactionStart[`${id}Scale`] || 1;
    const horizontal = ["nw", "w", "sw", "ne", "e", "se"].includes(handle);
    const vertical = ["nw", "n", "ne", "sw", "s", "se"].includes(handle);
    let scaleX = Math.max(0.2, Math.min(3, Math.abs(localX * 2) / Math.max(1, settings.startBounds.width) * startScaleX));
    let scaleY = Math.max(0.2, Math.min(3, Math.abs(localY * 2) / Math.max(1, settings.startBounds.height) * startScaleY));
    if (["nw", "ne", "se", "sw"].includes(handle) && !event.shiftKey) {
      const uniform = Math.max(scaleX, scaleY);
      scaleX = uniform;
      scaleY = uniform;
    }
    if (horizontal) settings[`${id}ScaleX`] = scaleX;
    if (vertical) settings[`${id}ScaleY`] = scaleY;
  }
  settings.dragStart = point;
  update();
});
$("canvasWrap").addEventListener("pointerup", (event) => {
  const settings = getActiveSettings();
  if (settings.interaction) pushHistory();
  settings.dragStart = null;
  settings.guides = null;
  settings.interaction = null;
  canvas.releasePointerCapture?.(event.pointerId);
});
$("canvasWrap").addEventListener("pointercancel", () => {
  getActiveSettings().dragStart = null;
});
$("canvasWrap").addEventListener("wheel", (event) => {
  if (!getActiveItem()?.image) return;
  event.preventDefault();
  const settings = getActiveSettings();
  settings.zoom = Math.max(0.5, Math.min(2, (settings.zoom || 1) - event.deltaY * 0.001));
  update();
}, { passive: false });
document.querySelectorAll("[data-tool]").forEach((button) => {
  button.addEventListener("click", () => {
    const tool = button.dataset.tool;
    const settings = getActiveSettings();
    if (tool === "zoomIn") settings.zoom = Math.min(2, (settings.zoom || 1) + 0.1);
    if (tool === "zoomOut") settings.zoom = Math.max(0.5, (settings.zoom || 1) - 0.1);
    if (tool === "center") {
      settings.zoom = 1;
      settings.imageX = 0;
      settings.imageY = 0;
      settings.headlineX = 0;
      settings.headlineY = 0;
      settings.subheadlineX = 0;
      settings.subheadlineY = 0;
    }
    update();
    if (tool === "center") pushHistory();
  });
});
$("undoButton").addEventListener("click", () => restoreHistory(state.historyIndex - 1));
$("redoButton").addEventListener("click", () => restoreHistory(state.historyIndex + 1));
document.addEventListener("keydown", (event) => {
  if (state.editingText) {
    if (event.key === "Enter") {
      event.preventDefault();
      closeTextEditor();
    } else if (event.key === "Escape") {
      event.preventDefault();
      const input = $("textEditorInput");
      const settings = getActiveSettings();
      input.value = settings[state.editingText];
      closeTextEditor();
    }
    return;
  }
  if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z") return;
  event.preventDefault();
  restoreHistory(state.historyIndex + (event.shiftKey ? 1 : -1));
});
$("textEditorInput").addEventListener("input", () => {
  const settings = getActiveSettings();
  if (state.editingText) settings[state.editingText] = $("textEditorInput").value;
  update();
});
$("textEditorInput").addEventListener("blur", closeTextEditor);
$("resetButton").addEventListener("click", () => {
  const item = getActiveItem();
  if (item) item.settings = { ...DEFAULTS, selectedElement: null, zoom: 1 };
  pushHistory();
  update();
});

function downloadCanvas(item, index) {
  const output = document.createElement("canvas");
  render(output, item.image, getPreset(state.presetId), item.settings, 1);
  return new Promise((resolve, reject) => output.toBlob((blob) => {
    if (!blob) {
      reject(new Error("Không thể tạo file PNG từ canvas."));
      return;
    }
    resolve({ blob, name: `${String(index + 1).padStart(2, "0")}-${getPreset(state.presetId).id}.png` });
  }, "image/png"));
}

function saveBlob(blob, name) {
  if (!blob) throw new Error("Không có dữ liệu để tải xuống.");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function withExportState(button, task) {
  button.disabled = true;
  try {
    await task();
  } catch (error) {
    showError(error.message || "Xuất file thất bại.");
  } finally {
    update();
  }
}

$("downloadButton").addEventListener("click", () => withExportState($("downloadButton"), async () => {
  const current = state.images[state.activeIndex];
  if (!current?.image) throw new Error("Chưa có screenshot để xuất.");
  const result = await downloadCanvas(current, state.activeIndex);
  saveBlob(result.blob, result.name);
}));
$("downloadAllButton").addEventListener("click", () => withExportState($("downloadAllButton"), async () => {
  if (!window.JSZip) throw new Error("Thư viện ZIP chưa sẵn sàng.");
  const zip = new JSZip();
  for (let index = 0; index < state.images.length; index += 1) {
    if (!state.images[index].image) continue;
    const result = await downloadCanvas(state.images[index], index);
    zip.file(result.name, result.blob);
  }
  saveBlob(await zip.generateAsync({ type: "blob" }), `screenshot-${state.presetId}.zip`);
}));

update();
