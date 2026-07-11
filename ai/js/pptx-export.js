window.PptxExport = (() => {
  const SLIDES_INSTRUCTION = [
    'Bạn là chuyên gia tạo bài thuyết trình PowerPoint.',
    'Người dùng mô tả chủ đề/nội dung cần tạo slides.',
    '',
    'Trả lời theo format:',
    '1. Một đoạn mô tả ngắn (2-3 câu) về bài thuyết trình.',
    '2. Một khối code JSON hợp lệ (```json ... ```) theo schema:',
    '',
    '{',
    '  "title": "Tiêu đề bài thuyết trình",',
    '  "slides": [',
    '    { "layout": "title", "title": "...", "subtitle": "..." },',
    '    { "layout": "content", "title": "...", "bullets": ["...", "..."] },',
    '    { "layout": "two-column", "title": "...", "left": ["..."], "right": ["..."] },',
    '    { "layout": "section", "title": "..." },',
    '    { "layout": "closing", "title": "...", "subtitle": "..." }',
    '  ]',
    '}',
    '',
    'Layouts hỗ trợ: title, content, two-column, section, closing.',
    'Tạo 6-12 slides phù hợp với mô tả. JSON phải parse được, không có comment.',
    'Ngôn ngữ slides theo ngôn ngữ người dùng nhập.',
  ].join('\n');

  const THEME = {
    primary: '1E3A5F',
    accent: '2563EB',
    light: 'F8FAFC',
    text: '1E293B',
    muted: '64748B',
    white: 'FFFFFF',
  };

  const sanitizeFilename = (name) => {
    const base = String(name || 'presentation')
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
    return base || 'presentation';
  };

  const buildFilename = (data) => sanitizeFilename(data?.title) + '.pptx';

  const tryParseJson = (raw) => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const normalizeSlidesData = (parsed) => {
    if (!parsed || typeof parsed !== 'object') return null;
    const slides = Array.isArray(parsed.slides) ? parsed.slides : null;
    if (!slides || !slides.length) return null;
    const title = String(parsed.title || slides[0]?.title || 'Presentation').trim();
    return { title, slides };
  };

  const extractSlidesData = (text) => {
    const source = String(text || '');
    if (!source.trim()) return null;

    const fenced = source.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      const parsed = tryParseJson(fenced[1].trim());
      const normalized = normalizeSlidesData(parsed);
      if (normalized) return normalized;
    }

    const objectMatch = source.match(/\{[\s\S]*"slides"\s*:\s*\[[\s\S]*\][\s\S]*\}/);
    if (objectMatch) {
      const parsed = tryParseJson(objectMatch[0]);
      const normalized = normalizeSlidesData(parsed);
      if (normalized) return normalized;
    }

    return null;
  };

  const bulletTexts = (items) => (Array.isArray(items) ? items : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean);

  const addTitleSlide = (pptx, slide, data) => {
    const s = pptx.addSlide({ masterName: 'TITLE_SLIDE' });
    s.addText(data.title || '', {
      x: 0.8, y: 1.8, w: 8.4, h: 1.4,
      fontSize: 36, bold: true, color: THEME.white, fontFace: 'Arial',
    });
    if (data.subtitle) {
      s.addText(data.subtitle, {
        x: 0.8, y: 3.3, w: 8.4, h: 0.8,
        fontSize: 20, color: 'CBD5E1', fontFace: 'Arial',
      });
    }
  };

  const addContentSlide = (pptx, slide, data) => {
    const s = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
    s.addText(data.title || '', {
      x: 0.6, y: 0.4, w: 8.8, h: 0.7,
      fontSize: 28, bold: true, color: THEME.primary, fontFace: 'Arial',
    });
    const bullets = bulletTexts(data.bullets);
    if (bullets.length) {
      s.addText(bullets.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })), {
        x: 0.8, y: 1.4, w: 8.4, h: 3.8,
        fontSize: 18, color: THEME.text, fontFace: 'Arial', valign: 'top',
      });
    }
  };

  const addTwoColumnSlide = (pptx, slide, data) => {
    const s = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
    s.addText(data.title || '', {
      x: 0.6, y: 0.4, w: 8.8, h: 0.7,
      fontSize: 28, bold: true, color: THEME.primary, fontFace: 'Arial',
    });
    const left = bulletTexts(data.left);
    const right = bulletTexts(data.right);
    if (left.length) {
      s.addText(left.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })), {
        x: 0.6, y: 1.4, w: 4.2, h: 3.8,
        fontSize: 16, color: THEME.text, fontFace: 'Arial', valign: 'top',
      });
    }
    if (right.length) {
      s.addText(right.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })), {
        x: 5.2, y: 1.4, w: 4.2, h: 3.8,
        fontSize: 16, color: THEME.text, fontFace: 'Arial', valign: 'top',
      });
    }
  };

  const addSectionSlide = (pptx, slide, data) => {
    const s = pptx.addSlide({ masterName: 'SECTION_SLIDE' });
    s.addText(data.title || '', {
      x: 0.8, y: 2.2, w: 8.4, h: 1.2,
      fontSize: 34, bold: true, color: THEME.white, fontFace: 'Arial', align: 'center',
    });
  };

  const addClosingSlide = (pptx, slide, data) => {
    const s = pptx.addSlide({ masterName: 'TITLE_SLIDE' });
    s.addText(data.title || 'Cảm ơn', {
      x: 0.8, y: 2.0, w: 8.4, h: 1.2,
      fontSize: 40, bold: true, color: THEME.white, fontFace: 'Arial', align: 'center',
    });
    if (data.subtitle) {
      s.addText(data.subtitle, {
        x: 0.8, y: 3.3, w: 8.4, h: 0.8,
        fontSize: 20, color: 'CBD5E1', fontFace: 'Arial', align: 'center',
      });
    }
  };

  const addSlideByLayout = (pptx, slide) => {
    const layout = String(slide?.layout || 'content').toLowerCase();
    if (layout === 'title') return addTitleSlide(pptx, slide, slide);
    if (layout === 'two-column' || layout === 'twocolumn' || layout === 'two_column') {
      return addTwoColumnSlide(pptx, slide, slide);
    }
    if (layout === 'section') return addSectionSlide(pptx, slide, slide);
    if (layout === 'closing' || layout === 'end' || layout === 'thankyou') {
      return addClosingSlide(pptx, slide, slide);
    }
    return addContentSlide(pptx, slide, slide);
  };

  const defineSlideMasters = (pptx) => {
    pptx.defineSlideMaster({
      title: 'TITLE_SLIDE',
      background: { color: THEME.primary },
    });
    pptx.defineSlideMaster({
      title: 'SECTION_SLIDE',
      background: { color: THEME.accent },
    });
    pptx.defineSlideMaster({
      title: 'CONTENT_SLIDE',
      background: { color: THEME.white },
    });
  };

  const generatePptx = async (data) => {
    const PptxGen = window.PptxGenJS;
    if (!PptxGen) throw new Error('PptxGenJS chưa tải');

    const normalized = normalizeSlidesData(data);
    if (!normalized) throw new Error('Dữ liệu slides không hợp lệ');

    const pptx = new PptxGen();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = normalized.title;
    pptx.author = 'VUTASO AI';
    defineSlideMasters(pptx);

    normalized.slides.forEach((slide) => addSlideByLayout(pptx, slide));

    const blob = await pptx.write({ outputType: 'blob' });
    return {
      blob,
      filename: buildFilename(normalized),
      slideCount: normalized.slides.length,
      title: normalized.title,
    };
  };

  const appendSlidesInstruction = (text, m) => {
    if (!m.slides) return text || '';
    const userText = text || '';
    return userText
      ? SLIDES_INSTRUCTION + '\n\n---\n\n' + userText
      : SLIDES_INSTRUCTION;
  };

  return {
    SLIDES_INSTRUCTION,
    extractSlidesData,
    generatePptx,
    buildFilename,
    appendSlidesInstruction,
  };
})();
