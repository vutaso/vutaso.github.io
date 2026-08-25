function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, width, height, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawImageCover(ctx, image, x, y, width, height, mode) {
  const scale = mode === "cover"
    ? Math.max(width / image.width, height / image.height)
    : Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.trim() ? text.trim().split(/\s+/) : [];
  let line = "";
  let lines = [];
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  lines.forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight));
  return lines.length;
}

export function getLayout(preset, state, scale = 1) {
  const width = preset.width * scale;
  const height = preset.height * scale;
  const unit = width / preset.width;
  const pad = preset.width * 0.1 * unit;
  const textWidth = width - pad * 2;
  const imageWidth = width - pad * 2;
  const imageHeight = height * 0.68;
  const makeBox = (id, centerX, centerY, baseWidth, baseHeight) => {
    const objectScale = state[`${id}Scale`] || 1;
    const scaleX = state[`${id}ScaleX`] || objectScale;
    const scaleY = state[`${id}ScaleY`] || objectScale;
    const boxWidth = baseWidth * scaleX;
    const boxHeight = baseHeight * scaleY;
    return {
      id,
      centerX,
      centerY,
      x: centerX - boxWidth / 2,
      y: centerY - boxHeight / 2,
      width: boxWidth,
      height: boxHeight,
      rotation: state[`${id}Rotation`] || 0,
      visible: state[`${id}Visible`] !== false
    };
  };
  return {
    width,
    height,
    pad,
    headline: makeBox("headline", width / 2 + (state.headlineX || 0) * width, height * 0.095 + (state.headlineY || 0) * height, textWidth, preset.width * 0.09 * unit),
    subheadline: makeBox("subheadline", width / 2 + (state.subheadlineX || 0) * width, height * 0.19 + (state.subheadlineY || 0) * height, textWidth, preset.width * 0.06 * unit),
    image: makeBox("image", width / 2 + (state.imageX || 0) * width, height * 0.58 + (state.imageY || 0) * height, imageWidth, imageHeight)
  };
}

function withObjectTransform(ctx, bounds, draw) {
  ctx.save();
  ctx.translate(bounds.centerX, bounds.centerY);
  ctx.rotate(bounds.rotation);
  draw({
    ...bounds,
    x: -bounds.width / 2,
    y: -bounds.height / 2,
    centerX: 0,
    centerY: 0
  });
  ctx.restore();
}

export function getHandles(bounds, size = 10) {
  const points = {
    nw: [-bounds.width / 2, -bounds.height / 2],
    n: [0, -bounds.height / 2],
    ne: [bounds.width / 2, -bounds.height / 2],
    e: [bounds.width / 2, 0],
    se: [bounds.width / 2, bounds.height / 2],
    s: [0, bounds.height / 2],
    sw: [-bounds.width / 2, bounds.height / 2],
    w: [-bounds.width / 2, 0],
    rotate: [0, -bounds.height / 2 - 28]
  };
  const cos = Math.cos(bounds.rotation);
  const sin = Math.sin(bounds.rotation);
  return Object.fromEntries(Object.entries(points).map(([id, [x, y]]) => [id, {
    id,
    x: bounds.centerX + x * cos - y * sin,
    y: bounds.centerY + x * sin + y * cos,
    size
  }]));
}

export function pointInObject(point, bounds) {
  if (!bounds.visible) return false;
  const dx = point.x - bounds.centerX;
  const dy = point.y - bounds.centerY;
  const cos = Math.cos(-bounds.rotation);
  const sin = Math.sin(-bounds.rotation);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  return Math.abs(localX) <= bounds.width / 2 && Math.abs(localY) <= bounds.height / 2;
}

function drawSelection(ctx, bounds, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  withObjectTransform(ctx, bounds, (local) => ctx.strokeRect(local.x, local.y, local.width, local.height));
  const handles = getHandles(bounds);
  ctx.beginPath();
  ctx.moveTo(handles.n.x, handles.n.y);
  ctx.lineTo(handles.rotate.x, handles.rotate.y);
  ctx.stroke();
  Object.values(handles).forEach((handle) => {
    ctx.beginPath();
    ctx.arc(handle.x, handle.y, handle.id === "rotate" ? 5 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  ctx.restore();
}

export function render(canvas, image, preset, state, scale = 1, quality = 1, editor = false) {
  const width = Math.round(preset.width * scale);
  const height = Math.round(preset.height * scale);
  const pixelRatio = Math.max(1, Math.min(quality, 3));
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  canvas.style.aspectRatio = `${width} / ${height}`;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas 2D không khả dụng trong trình duyệt này.");
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = state.bgColor;
  ctx.fillRect(0, 0, width, height);
  const unit = width / preset.width;
  const layout = getLayout(preset, state, scale);
  const pad = layout.pad;
  const order = state.layerOrder || ["image", "subheadline", "headline"];
  const drawLayer = {
    headline: () => {
      if (!layout.headline.visible) return;
      withObjectTransform(ctx, layout.headline, (box) => {
        ctx.textAlign = "center";
        ctx.fillStyle = state.textColor;
        ctx.font = `700 ${Math.max(16, preset.width * 0.052 * unit * (state.headlineScaleY || state.headlineScale || 1))}px Manrope, sans-serif`;
        drawWrappedText(ctx, state.headline, 0, box.y + box.height * 0.28, box.width, preset.width * 0.065 * unit * (state.headlineScale || 1));
      });
    },
    subheadline: () => {
      if (!layout.subheadline.visible) return;
      withObjectTransform(ctx, layout.subheadline, (box) => {
        ctx.textAlign = "center";
        ctx.fillStyle = state.textColor;
        ctx.font = `400 ${Math.max(10, preset.width * 0.023 * unit * (state.subheadlineScaleY || state.subheadlineScale || 1))}px Manrope, sans-serif`;
        drawWrappedText(ctx, state.subheadline, 0, box.y + box.height * 0.32, box.width, preset.width * 0.032 * unit * (state.subheadlineScale || 1));
      });
    },
    image: () => {
      if (!image || !layout.image.visible) return;
    const imageBox = layout.image;
      withObjectTransform(ctx, imageBox, (box) => {
        if (state.showFrame) {
          ctx.fillStyle = "#11131a";
          roundedRect(ctx, box.x - 8 * unit, box.y - 8 * unit, box.width + 16 * unit, box.height + 16 * unit, preset.width * 0.05 * unit);
          ctx.fill();
        }
        ctx.save();
        roundedRect(ctx, box.x, box.y, box.width, box.height, preset.width * 0.045 * unit);
        ctx.clip();
        drawImageCover(ctx, image, box.x, box.y, box.width, box.height, state.fitMode);
        ctx.restore();
      });
    }
  };
  order.forEach((id) => drawLayer[id]?.());
  if (state.showSafe) {
    ctx.save();
    ctx.strokeStyle = "#a8f36b";
    ctx.setLineDash([8 * unit, 8 * unit]);
    ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);
    ctx.restore();
  }
  if (editor && state.guides) {
    ctx.save();
    ctx.strokeStyle = "#49bfff";
    ctx.lineWidth = 1;
    state.guides.forEach((guide) => {
      ctx.beginPath();
      if (guide.axis === "x") {
        ctx.moveTo(guide.value, 0);
        ctx.lineTo(guide.value, height);
      } else {
        ctx.moveTo(0, guide.value);
        ctx.lineTo(width, guide.value);
      }
      ctx.stroke();
    });
    ctx.restore();
  }
  if (editor && state.selectedElement && layout[state.selectedElement]?.visible) {
    drawSelection(ctx, layout[state.selectedElement], "#a8f36b");
  }
  return canvas;
}
