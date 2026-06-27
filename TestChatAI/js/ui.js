window.UI = (() => {
  const { escapeHTML, formatTime, truncate, copyToClipboard, autoResize } = window.Utils;
  const { DEFAULT_SYSTEM_PROMPT } = window.APP_CONFIG;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {};

  const cacheEls = () => {
    els.sidebar = $('#sidebar');
    els.sidebarOverlay = $('#sidebarOverlay');
    els.conversationList = $('#conversationList');
    els.messages = $('#messages');
    els.composer = $('#composer');
    els.composerInput = $('#composerInput');
    els.sendBtn = $('#sendBtn');
    els.stopBtn = $('#stopBtn');
    els.newChatBtn = $('#newChatBtn');
    els.themeToggleBtn = $('#themeToggleBtn');
    els.themeIcon = $('#themeIcon');
    els.openSidebarBtn = $('#openSidebarBtn');
    els.settingsModal = $('#settingsModal');
    els.apiKeyInput = $('#apiKeyInput');
    els.apiKeyIcon = $('#apiKeyIcon');
    els.anthropicApiKeyInput = $('#anthropicApiKeyInput');
    els.anthropicApiKeyIcon = $('#anthropicApiKeyIcon');
    els.deepseekApiKeyInput = $('#deepseekApiKeyInput');
    els.deepseekApiKeyIcon = $('#deepseekApiKeyIcon');
    els.geminiApiKeyInput = $('#geminiApiKeyInput');
    els.geminiApiKeyIcon = $('#geminiApiKeyIcon');
    els.systemPromptInput = $('#systemPromptInput');
    els.settingsForm = $('#settingsForm');
    els.toast = $('#toast');
    els.selectionReplyTooltip = $('#selectionReplyTooltip');
    els.openSettingsBtn = $('#openSettingsBtn');
    els.headerSettingsBtn = $('#headerSettingsBtn');
    els.guideModal = $('#guideModal');
    els.openGuideBtn = $('#openGuideBtn');
    els.headerGuideBtn = $('#headerGuideBtn');
    els.settingsGuideBtn = $('#settingsGuideBtn');
    els.guideOpenSettingsBtn = $('#guideOpenSettingsBtn');
    els.guideBody = $('#guideModal')?.querySelector('.guide-body');
    els.downloadConvoBtn = $('#downloadConvoBtn');
    els.copyMarkdownBtn = $('#copyMarkdownBtn');
    els.pdfExportBtn = $('#pdfExportBtn');
    els.docxExportBtn = $('#docxExportBtn');
    els.clearAllBtn = $('#clearAllBtn');
    els.clearAllSidebarBtn = $('#clearAllSidebarBtn');
    els.toggleApiKeyBtn = $('#toggleApiKeyBtn');
    els.toggleAnthropicApiKeyBtn = $('#toggleAnthropicApiKeyBtn');
    els.toggleDeepseekApiKeyBtn = $('#toggleDeepseekApiKeyBtn');
    els.toggleGeminiApiKeyBtn = $('#toggleGeminiApiKeyBtn');
    els.composerAttachments = $('#composerAttachments');
    els.composerTools = $('#composerTools');
    els.webSearchBtn = $('#webSearchBtn');
    els.imageGenBtn = $('#imageGenBtn');
    els.thinkingBtn = $('#thinkingBtn');
    els.translateBtn = $('#translateBtn');
    els.composerTranslateBar = $('#composerTranslateBar');
    els.translateChipClose = $('#translateChipClose');
    els.translateLangBtn = $('#translateLangBtn');
    els.translateLangLabel = $('#translateLangLabel');
    els.translateLangMenu = $('#translateLangMenu');
    els.translateLangOptions = $('#translateLangOptions');
    els.composerImageGenBar = $('#composerImageGenBar');
    els.imageGenChipClose = $('#imageGenChipClose');
    els.imageGenRefBtn = $('#imageGenRefBtn');
    els.imageGenRefLabel = $('#imageGenRefLabel');
    els.imageGenRefInput = $('#imageGenRefInput');
    els.imageGenRatioBtn = $('#imageGenRatioBtn');
    els.imageGenRatioPicker = $('#imageGenRatioPicker');
    els.imageGenRatioChip = $('#imageGenRatioChip');
    els.imageGenRatioChipLabel = $('#imageGenRatioChipLabel');
    els.imageGenRatioChipClear = $('#imageGenRatioChipClear');
    els.imageGenRatioMenu = $('#imageGenRatioMenu');
    els.imageGenRatioOptions = $('#imageGenRatioOptions');
    els.imageGenStyleBtn = $('#imageGenStyleBtn');
    els.imageGenStylePicker = $('#imageGenStylePicker');
    els.imageGenStyleChip = $('#imageGenStyleChip');
    els.imageGenStyleChipLabel = $('#imageGenStyleChipLabel');
    els.imageGenStyleChipClear = $('#imageGenStyleChipClear');
    els.imageGenStyleMenu = $('#imageGenStyleMenu');
    els.imageGenStyleOptions = $('#imageGenStyleOptions');
    els.imageGenTemplateBtn = $('#imageGenTemplateBtn');
    els.imageGenTemplatePicker = $('#imageGenTemplatePicker');
    els.imageGenTemplateChip = $('#imageGenTemplateChip');
    els.imageGenTemplateChipLabel = $('#imageGenTemplateChipLabel');
    els.imageGenTemplateChipClear = $('#imageGenTemplateChipClear');
    els.imageGenTemplateMenu = $('#imageGenTemplateMenu');
    els.imageGenTemplateOptions = $('#imageGenTemplateOptions');
    els.composerDropZone = $('#composerDropZone');
    els.appDropOverlay = $('#appDropOverlay');
    els.app = $('#app');
    els.attachImageBtn = $('#attachImageBtn');
    els.attachFileBtn = $('#attachFileBtn');
    els.imageFileInput = $('#imageFileInput');
    els.documentFileInput = $('#documentFileInput');
    els.markdownPreviewPanel = $('#markdownPreviewPanel');
    els.markdownPreviewContent = $('#markdownPreviewContent');
    els.closeMdPreviewBtn = $('#closeMdPreviewBtn');
    els.mdPreviewOverlay = $('#mdPreviewOverlay');
    els.previewPanelIcon = $('#previewPanelIcon');
    els.previewPanelTitle = $('#previewPanelTitle');
    els.renameModal = $('#renameModal');
    els.renameForm = $('#renameForm');
    els.renameInput = $('#renameInput');
    els.modelSelect = $('#modelSelect');
  };

  const syncComposerToolsUI = (modelId, toolState) => {
    const {
      webSearchEnabled, imageGenEnabled, thinkingEnabled, translateEnabled, translateTargetLang,
      imageGenRatio, imageGenStyle, imageGenTemplate
    } = toolState;
    const showWebSearch = window.APP_CONFIG.modelSupportsWebSearch(modelId);
    const showImageGen = window.APP_CONFIG.modelSupportsImageGen(modelId);
    const showThinking = window.APP_CONFIG.modelSupportsThinking(modelId);
    const hasTools = showWebSearch || showImageGen || showThinking || true;

    if (els.composerTools) {
      els.composerTools.classList.toggle('hidden', !hasTools);
    }
    if (els.webSearchBtn) {
      els.webSearchBtn.classList.toggle('hidden', !showWebSearch);
      const active = showWebSearch && !!webSearchEnabled;
      els.webSearchBtn.classList.toggle('is-active', active);
      els.webSearchBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    if (els.imageGenBtn) {
      els.imageGenBtn.classList.toggle('hidden', !showImageGen);
      const active = showImageGen && !!imageGenEnabled;
      els.imageGenBtn.classList.toggle('is-active', active);
      els.imageGenBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    if (els.thinkingBtn) {
      els.thinkingBtn.classList.toggle('hidden', !showThinking);
      const active = showThinking && !!thinkingEnabled;
      els.thinkingBtn.classList.toggle('is-active', active);
      els.thinkingBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    if (els.translateBtn) {
      const active = !!translateEnabled;
      els.translateBtn.classList.toggle('is-active', active);
      els.translateBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    syncTranslateUI({ translateEnabled, translateTargetLang: translateTargetLang || stateTranslateLang });
    syncImageGenUI({
      imageGenEnabled: showImageGen && !!imageGenEnabled,
      imageGenRatio,
      imageGenStyle,
      imageGenTemplate,
      referenceImage: toolState.referenceImage,
      imageGenRatioPicked: toolState.imageGenRatioPicked,
      imageGenStylePicked: toolState.imageGenStylePicked,
      imageGenTemplatePicked: toolState.imageGenTemplatePicked
    });
    syncComposerPlaceholder({ imageGenEnabled, translateEnabled });
  };

  let stateTranslateLang = window.APP_CONFIG.DEFAULT_TRANSLATE_LANG;

  const initTranslateLangMenu = () => {
    if (!els.translateLangOptions) return;
    const { TRANSLATE_LANGUAGES } = window.APP_CONFIG;
    els.translateLangOptions.innerHTML = TRANSLATE_LANGUAGES.map((lang) =>
      '<button type="button" class="translate-lang-option" role="option" data-lang="' + escapeHTML(lang.code) + '">'
      + '<span>' + escapeHTML(lang.label) + '</span>'
      + '<i class="fa-solid fa-check" aria-hidden="true"></i>'
      + '</button>'
    ).join('');
  };

  const closeTranslateLangMenu = () => {
    if (!els.translateLangMenu) return;
    els.translateLangMenu.classList.add('hidden');
    if (els.translateLangBtn) els.translateLangBtn.setAttribute('aria-expanded', 'false');
  };

  const syncTranslateUI = ({ translateEnabled, translateTargetLang }) => {
    const langCode = translateTargetLang || window.APP_CONFIG.DEFAULT_TRANSLATE_LANG;
    stateTranslateLang = langCode;

    if (els.composerTranslateBar) {
      const on = !!translateEnabled;
      els.composerTranslateBar.classList.toggle('hidden', !on);
      els.composerTranslateBar.setAttribute('aria-hidden', on ? 'false' : 'true');
    }
    if (els.translateLangLabel) {
      els.translateLangLabel.textContent = window.APP_CONFIG.getTranslateLabel(langCode);
    }
    if (els.composerInput) {
      els.composerInput.placeholder = 'Nhập nội dung...';
    }
    if (els.translateLangOptions) {
      els.translateLangOptions.querySelectorAll('.translate-lang-option').forEach((btn) => {
        const selected = btn.dataset.lang === langCode;
        btn.classList.toggle('is-selected', selected);
        btn.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
    }
    closeTranslateLangMenu();
  };

  const syncComposerPlaceholder = ({ imageGenEnabled, translateEnabled }) => {
    if (!els.composerInput) return;
    if (imageGenEnabled) {
      els.composerInput.placeholder = 'Mô tả hình ảnh bạn muốn tạo';
    } else if (translateEnabled) {
      els.composerInput.placeholder = 'Nhập văn bản';
    } else {
      els.composerInput.placeholder = 'Nhập nội dung...';
    }
  };

  const closeImageGenMenus = () => {
    [els.imageGenRatioMenu, els.imageGenStyleMenu, els.imageGenTemplateMenu].forEach((menu) => {
      if (menu) menu.classList.add('hidden');
    });
    [els.imageGenRatioBtn, els.imageGenStyleBtn, els.imageGenTemplateBtn].forEach((btn) => {
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  };

  const toggleImageGenMenu = (menu, btn) => {
    const isOpen = !menu.classList.contains('hidden');
    closeImageGenMenus();
    closeTranslateLangMenu();
    if (!isOpen) {
      menu.classList.remove('hidden');
      btn.setAttribute('aria-expanded', 'true');
    }
  };

  const initImageGenMenus = () => {
    if (els.imageGenRatioOptions) {
      els.imageGenRatioOptions.innerHTML = window.APP_CONFIG.IMAGE_GEN_RATIOS.map((ratio) =>
        '<button type="button" class="composer-dropdown-option" role="option" data-value="' + escapeHTML(ratio.id) + '">'
        + '<span class="ratio-icon" data-ratio="' + escapeHTML(ratio.id) + '" aria-hidden="true"></span>'
        + '<span class="composer-dropdown-option-text">'
        + '<span class="composer-dropdown-option-title">' + escapeHTML(ratio.label) + '</span> '
        + '<span class="composer-dropdown-option-desc">(' + escapeHTML(ratio.desc) + ')</span>'
        + '</span>'
        + '<i class="fa-solid fa-check" aria-hidden="true"></i>'
        + '</button>'
      ).join('');
    }
    if (els.imageGenStyleOptions) {
      els.imageGenStyleOptions.innerHTML = window.APP_CONFIG.IMAGE_GEN_STYLES.map((style) =>
        '<button type="button" class="composer-dropdown-option" role="option" data-value="' + escapeHTML(style.id) + '">'
        + '<span class="composer-dropdown-option-text">' + escapeHTML(style.label) + '</span>'
        + '<i class="fa-solid fa-check" aria-hidden="true"></i>'
        + '</button>'
      ).join('');
    }
    if (els.imageGenTemplateOptions) {
      els.imageGenTemplateOptions.innerHTML = window.APP_CONFIG.IMAGE_GEN_TEMPLATES.map((tpl) =>
        '<button type="button" class="composer-dropdown-option" role="option" data-value="' + escapeHTML(tpl.id) + '">'
        + '<span class="composer-dropdown-option-text">' + escapeHTML(tpl.label) + '</span>'
        + '<i class="fa-solid fa-check" aria-hidden="true"></i>'
        + '</button>'
      ).join('');
    }
  };

  const setImageGenOptionPicked = (type, picked, { ratioId, styleId, templateId } = {}) => {
    const ratio = window.APP_CONFIG.getImageGenRatio(ratioId || window.APP_CONFIG.DEFAULT_IMAGE_GEN_RATIO);
    const style = window.APP_CONFIG.getImageGenStyle(styleId || window.APP_CONFIG.DEFAULT_IMAGE_GEN_STYLE);
    const template = window.APP_CONFIG.getImageGenTemplate(templateId || window.APP_CONFIG.DEFAULT_IMAGE_GEN_TEMPLATE);

    if (type === 'ratio') {
      if (els.imageGenRatioPicker) els.imageGenRatioPicker.classList.toggle('hidden', picked);
      if (els.imageGenRatioChip) els.imageGenRatioChip.classList.toggle('hidden', !picked);
      if (picked && els.imageGenRatioChipLabel) {
        els.imageGenRatioChipLabel.textContent = ratio.label;
      }
      if (picked && els.imageGenRatioChip) {
        const icon = els.imageGenRatioChip.querySelector('.ratio-icon');
        if (icon) icon.setAttribute('data-ratio', ratio.id);
      }
      if (picked) closeImageGenMenus();
    }

    if (type === 'style') {
      if (els.imageGenStylePicker) els.imageGenStylePicker.classList.toggle('hidden', picked);
      if (els.imageGenStyleChip) els.imageGenStyleChip.classList.toggle('hidden', !picked);
      if (picked && els.imageGenStyleChipLabel) {
        els.imageGenStyleChipLabel.textContent = style.label;
      }
      if (picked) closeImageGenMenus();
    }

    if (type === 'template') {
      if (els.imageGenTemplatePicker) els.imageGenTemplatePicker.classList.toggle('hidden', picked);
      if (els.imageGenTemplateChip) els.imageGenTemplateChip.classList.toggle('hidden', !picked);
      if (picked && els.imageGenTemplateChipLabel) {
        els.imageGenTemplateChipLabel.textContent = template.label;
      }
      if (picked) closeImageGenMenus();
    }
  };

  const syncImageGenUI = ({
    imageGenEnabled, imageGenRatio, imageGenStyle, imageGenTemplate, referenceImage,
    imageGenRatioPicked, imageGenStylePicked, imageGenTemplatePicked
  }) => {
    const ratioId = imageGenRatio || window.APP_CONFIG.DEFAULT_IMAGE_GEN_RATIO;
    const styleId = imageGenStyle || window.APP_CONFIG.DEFAULT_IMAGE_GEN_STYLE;
    const templateId = imageGenTemplate || window.APP_CONFIG.DEFAULT_IMAGE_GEN_TEMPLATE;

    if (els.composerImageGenBar) {
      const on = !!imageGenEnabled;
      els.composerImageGenBar.classList.toggle('hidden', !on);
      els.composerImageGenBar.setAttribute('aria-hidden', on ? 'false' : 'true');
    }
    if (els.imageGenRatioBtn) {
      const icon = els.imageGenRatioBtn.querySelector('.ratio-icon');
      if (icon) icon.setAttribute('data-ratio', ratioId);
    }
    setImageGenOptionPicked('ratio', !!imageGenRatioPicked, { ratioId });
    setImageGenOptionPicked('style', !!imageGenStylePicked, { styleId });
    setImageGenOptionPicked('template', !!imageGenTemplatePicked, { templateId });
    if (els.imageGenRatioOptions) {
      els.imageGenRatioOptions.querySelectorAll('.composer-dropdown-option').forEach((btn) => {
        const selected = btn.dataset.value === ratioId;
        btn.classList.toggle('is-selected', selected);
        btn.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
    }
    if (els.imageGenStyleOptions) {
      els.imageGenStyleOptions.querySelectorAll('.composer-dropdown-option').forEach((btn) => {
        const selected = btn.dataset.value === styleId;
        btn.classList.toggle('is-selected', selected);
        btn.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
    }
    if (els.imageGenTemplateOptions) {
      els.imageGenTemplateOptions.querySelectorAll('.composer-dropdown-option').forEach((btn) => {
        const selected = btn.dataset.value === templateId;
        btn.classList.toggle('is-selected', selected);
        btn.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
    }
    if (els.imageGenRefBtn) {
      const hasRef = !!referenceImage;
      els.imageGenRefBtn.classList.toggle('is-active', hasRef);
      if (els.imageGenRefLabel) {
        els.imageGenRefLabel.textContent = hasRef
          ? truncate(referenceImage.name || 'Ảnh tham chiếu', 18)
          : 'Hình ảnh tham chiếu';
      }
    }
    if (!imageGenEnabled) {
      closeImageGenMenus();
      setImageGenOptionPicked('ratio', false);
      setImageGenOptionPicked('style', false);
      setImageGenOptionPicked('template', false);
    }
  };

  const setStreamingSearchStatus = (article, status) => {
    if (!article) return;
    let badge = article.querySelector('.streaming-search-badge');
    if (status === 'searching') {
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'streaming-tool-badge streaming-search-badge';
        badge.innerHTML = '<i class="fa-solid fa-globe" aria-hidden="true"></i> Đang tìm kiếm web...';
        article.querySelector('.content')?.prepend(badge);
      }
    } else if (badge) {
      badge.remove();
    }
  };

  const setStreamingImageStatus = (article, status) => {
    if (!article) return;
    let badge = article.querySelector('.streaming-image-badge');
    if (status === 'generating') {
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'streaming-tool-badge streaming-image-badge';
        badge.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> Đang tạo hình ảnh...';
        article.querySelector('.content')?.prepend(badge);
      }
    } else if (badge) {
      badge.remove();
    }
  };

  const generatedImagesHTML = (images) => {
    if (!images || !images.length) return '';
    return '<div class="message-images message-generated-images">' + images.map((img, i) => {
      const alt = escapeHTML(img.name || 'Hình ảnh AI ' + (i + 1));
      return '<div class="message-image-wrap message-generated-image-wrap">'
        + '<img src="' + img.dataUrl + '" alt="' + alt + '" loading="lazy" />'
        + '<div class="generated-image-actions" aria-label="Thao tác ảnh">'
        + '<button type="button" class="generated-image-btn" data-copy-generated-image title="Sao chép ảnh" aria-label="Sao chép ảnh">'
        + '<i class="fa-solid fa-copy" aria-hidden="true"></i></button>'
        + '<button type="button" class="generated-image-btn" data-download-generated-image title="Tải ảnh" aria-label="Tải ảnh">'
        + '<i class="fa-solid fa-download" aria-hidden="true"></i></button>'
        + '</div></div>';
    }).join('') + '</div>';
  };

  const reasoningHTML = (reasoning, { open = false } = {}) => {
    if (!reasoning || !reasoning.trim()) return '';
    return '<details class="message-reasoning"' + (open ? ' open' : '') + '>'
      + '<summary><i class="fa-solid fa-brain" aria-hidden="true"></i> Quá trình suy nghĩ</summary>'
      + '<div class="message-reasoning-body">' + window.Markdown.render(reasoning) + '</div>'
      + '</details>';
  };

  const groundingHTML = (meta) => {
    if (!meta) return '';
    const chunks = (meta.groundingChunks || []).filter((c) => c.web?.uri);
    const queries = meta.webSearchQueries || [];
    if (!chunks.length && !queries.length) return '';
    let html = '<details class="message-grounding"><summary><i class="fa-solid fa-globe" aria-hidden="true"></i> Nguồn tham khảo';
    if (queries.length) {
      html += '<span class="message-grounding-queries">' + escapeHTML(queries.join(', ')) + '</span>';
    }
    html += '</summary>';
    if (chunks.length) {
      html += '<ul class="message-grounding-sources">';
      chunks.forEach((chunk) => {
        const uri = chunk.web.uri;
        const title = chunk.web.title || uri;
        html += '<li><a href="' + escapeHTML(uri) + '" target="_blank" rel="noopener noreferrer">'
          + escapeHTML(title) + '</a></li>';
      });
      html += '</ul>';
    }
    html += '</details>';
    return html;
  };

  const assistantContentHTML = (m) => {
    const text = window.Conversations.getAssistantContent(m);
    return reasoningHTML(m.reasoningContent)
      + groundingHTML(m.groundingMetadata)
      + window.Markdown.render(text)
      + generatedImagesHTML(m.generatedImages);
  };

  const initModelSelect = (currentModel) => {
    const { MODELS, DEFAULT_MODEL } = window.APP_CONFIG;
    const selected = currentModel || DEFAULT_MODEL;
    els.modelSelect.innerHTML = MODELS.map((m) =>
      '<option value="' + escapeHTML(m.id) + '"' + (m.id === selected ? ' selected' : '') + '>'
      + escapeHTML(m.label) + '</option>'
    ).join('');
  };

  const userFilesHTML = (files) => {
    if (!files || !files.length) return '';
    return '<div class="message-files">' + files.map((f) =>
      '<div class="message-file-chip">'
      + '<i class="fa-solid ' + window.Files.getIconClass(f.name) + '"></i>'
      + '<span class="message-file-name" title="' + escapeHTML(f.name) + '">' + escapeHTML(f.name) + '</span>'
      + '<span class="message-file-size">' + window.Files.formatSize(f.size || 0) + '</span>'
      + '</div>'
    ).join('') + '</div>';
  };

  const userImagesHTML = (images) => {
    if (!images || !images.length) return '';
    return '<div class="message-images">' + images.map((img, i) =>
      '<div class="message-image-wrap">'
      + '<img src="' + img.dataUrl + '" alt="' + escapeHTML(img.name || 'Hình ảnh ' + (i + 1)) + '" loading="lazy" />'
      + '</div>'
    ).join('') + '</div>';
  };

  const userContentHTML = (m) => {
    let text = '';
    if (m.content && m.content.trim()) {
      const escaped = escapeHTML(m.content).replace(/\n/g, '<br>');
      if (m.translateTo) {
        const label = window.APP_CONFIG.getTranslateLabel(m.translateTo);
        text = '<p class="message-translate-original">' + escaped + '</p>'
          + '<p class="message-translate-label">' + escapeHTML(label) + '</p>';
      } else if (m.imageGen) {
        const parts = ['Tỷ lệ ' + window.APP_CONFIG.getImageGenRatio(m.imageGen.ratio).label];
        const style = window.APP_CONFIG.getImageGenStyle(m.imageGen.style);
        const template = window.APP_CONFIG.getImageGenTemplate(m.imageGen.template);
        if (style.id !== 'auto') parts.push('Phong cách ' + style.label.toLowerCase());
        if (template.id !== 'none') parts.push('Mẫu ' + template.label.toLowerCase());
        text = '<p class="message-imagegen-prompt">' + escaped + '</p>'
          + '<p class="message-imagegen-label">' + escapeHTML(parts.join(' · ')) + '</p>';
      } else {
        text = '<p>' + escaped + '</p>';
      }
    }
    return text + userImagesHTML(m.images) + userFilesHTML(m.files);
  };

  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    const mc = document.querySelector('meta[name="theme-color"]');
    if (mc) mc.setAttribute('content', theme === 'dark' ? '#0c0c0e' : '#f8f9fc');
    els.themeIcon.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  };

  const renderConversationList = (conversations, currentId) => {
    const html = conversations.length
      ? conversations.map(c => `
          <li class="conversation-item ${c.id === currentId ? 'active' : ''}" data-id="${c.id}">
            <span class="icon" aria-hidden="true"><i class="fa-solid fa-message"></i></span>
            <span class="title" title="${escapeHTML(c.title)}">${escapeHTML(c.title)}</span>
            <span class="actions">
              <button type="button" class="btn btn-icon" data-action="rename" title="Đổi tên"><i class="fa-solid fa-pen"></i></button>
              <button type="button" class="btn btn-icon" data-action="delete" title="Xoá"><i class="fa-solid fa-trash"></i></button>
            </span>
          </li>`).join('')
      : `<li class="conversation-empty" style="padding:12px 16px;color:var(--text-dim);font-size:13px;">Chưa có cuộc trò chuyện nào</li>`;
    els.conversationList.innerHTML = html;
  };

  const renderEmpty = () => {
    closeMarkdownPreview();
    els.messages.innerHTML = '<div class="messages-empty"><div class="brand-avatar brand-avatar-lg" aria-hidden="true">V</div><h2>Xin chào!</h2><p class="messages-empty-sub">Tôi có thể giúp gì cho bạn hôm nay? Kéo thả ảnh hoặc tài liệu vào màn hình để phân tích.</p></div>';
  };

  const renderMessages = (convo) => {
    closeMarkdownPreview();
    if (!convo || !convo.messages.length) {
      renderEmpty();
      return;
    }
    const shown = convo.messages.map((m, i) => ({ m, i })).filter(({ m }) => {
      if (m.role === 'assistant') {
        const hasText = !!window.Conversations.getAssistantContent(m);
        const hasImages = !!(m.generatedImages && m.generatedImages.length);
        if (!hasText && !hasImages) return false;
      }
      return true;
    });
    if (!shown.length) {
      renderEmpty();
      return;
    }
    els.messages.innerHTML = shown.map(({ m, i }) => messageHTML(m, i)).join('');
    polishContent(els.messages);
    scrollToBottom();
  };

  const assistantToolbarHTML = (m) => {
    const variants = m.variants && m.variants.length ? m.variants : (m.content ? [m.content] : []);
    const variantIndex = m.variantIndex ?? 0;
    const total = variants.length;
    const current = variantIndex + 1;

    let pager = '';
    if (total > 1) {
      pager = '<span class="variant-nav">'
        + '<button type="button" class="tb-btn variant-btn" data-action="variant-prev" title="Phiên bản trước"'
        + (variantIndex <= 0 ? ' disabled' : '')
        + '><i class="fa-solid fa-chevron-left"></i></button>'
        + '<span class="variant-count">' + current + ' / ' + total + '</span>'
        + '<button type="button" class="tb-btn variant-btn" data-action="variant-next" title="Phiên bản sau"'
        + (variantIndex >= total - 1 ? ' disabled' : '')
        + '><i class="fa-solid fa-chevron-right"></i></button>'
        + '</span>';
    }

    return '<button type="button" class="tb-btn" data-action="copy" title="Sao chép"><i class="fa-solid fa-copy"></i></button>'
      + '<button type="button" class="tb-btn" data-action="retry" title="Tạo lại"><i class="fa-solid fa-rotate-right"></i></button>'
      + pager;
  };

  const messageHTML = (m, idx) => {
    const isUser = m.role === 'user';
    const avatar = isUser
      ? '<div class="avatar user-av"><i class="fa-solid fa-user"></i></div>'
      : '<div class="avatar assistant-av">V</div>';
    const assistantText = isUser ? '' : window.Conversations.getAssistantContent(m);
    const body = isUser
      ? '<div class="content">' + userContentHTML(m) + '</div>'
      : '<div class="content">' + assistantContentHTML(m) + '</div>';
    const idxAttr = idx !== undefined ? ' data-idx="' + idx + '"' : '';
    const editBtn = isUser
      ? '<button type="button" class="tb-btn" data-action="edit" title="Sửa"><i class="fa-solid fa-pen-to-square"></i></button>'
      : '';
    const delBtn = isUser
      ? '<button type="button" class="tb-btn" data-action="delete-msg" title="Xoá"><i class="fa-solid fa-trash"></i></button>'
      : '';
    const toolbar = isUser
      ? editBtn
        + '<button type="button" class="tb-btn" data-action="copy" title="Sao chép"><i class="fa-solid fa-copy"></i></button>'
        + delBtn
      : assistantToolbarHTML(m);
    return '<article class="message ' + m.role + '" data-role="' + m.role + '"' + idxAttr + '>'
      + avatar
      + '<div class="body">' + body
      + '<div class="toolbar">' + toolbar + '</div>'
      + '</div></article>';
  };

  const appendMessage = (m, idx) => {
    const empty = els.messages.querySelector('.messages-empty');
    if (empty) empty.remove();
    const div = document.createElement('div');
    div.innerHTML = messageHTML(m, idx);
    const article = div.firstElementChild;
    els.messages.appendChild(article);
    scrollToBottom();
    return article;
  };

  const appendStreamingMessage = (idx) => {
    resetStreamingCodeScroll();
    const empty = els.messages.querySelector('.messages-empty');
    if (empty) empty.remove();
    const article = appendMessage({ role: 'assistant', content: '', variants: [''], variantIndex: 0, ts: Date.now() }, idx);
    article.classList.add('streaming');
    const content = article.querySelector('.content');
    return { article, content };
  };

  const setAssistantToolbar = (article, m) => {
    const toolbar = article?.querySelector('.toolbar');
    if (toolbar && m?.role === 'assistant') toolbar.innerHTML = assistantToolbarHTML(m);
  };

  const updateAssistantMessage = (idx, m) => {
    const article = els.messages.querySelector('[data-idx="' + idx + '"]');
    if (!article) return;
    const content = article.querySelector('.content');
    if (content) {
      content.innerHTML = assistantContentHTML(m);
      polishContent(content, { renderMermaid: true });
    }
    setAssistantToolbar(article, m);
  };

  const beginRetryStreaming = (idx) => {
    resetStreamingCodeScroll();
    els.messages.querySelectorAll('.message').forEach((article) => {
      const i = parseInt(article.dataset.idx, 10);
      if (!isNaN(i) && i > idx) article.remove();
    });

    let article = els.messages.querySelector('[data-idx="' + idx + '"]');
    if (!article) return null;

    article.classList.add('streaming');
    const content = article.querySelector('.content');
    if (content) content.innerHTML = '';
    return { article, content };
  };

  let streamThrottle = null;
  let _latestCE = null;
  let _latestText = '';
  let _latestImages = null;
  let _streamingCodeScrollTarget = 0;

  let _latestReasoning = '';
  let _latestGrounding = null;
  let _reasoningOpen = false;

  const renderStreamingAssistantHTML = (text, images, reasoning, { reasoningOpen = false, groundingMetadata = null } = {}) => {
    return reasoningHTML(reasoning, { open: reasoningOpen })
      + groundingHTML(groundingMetadata)
      + window.Markdown.render(text || '') + generatedImagesHTML(images);
  };

  const updateStreamingAssistantContent = (contentEl, text, images, reasoning, { reasoningOpen = false, groundingMetadata = null } = {}) => {
    _latestCE = contentEl;
    _latestText = text;
    _latestImages = images;
    _latestReasoning = reasoning || '';
    _latestGrounding = groundingMetadata;
    _reasoningOpen = reasoningOpen;
    if (streamThrottle) return;
    streamThrottle = requestAnimationFrame(() => {
      if (_latestCE) {
        _latestCE.innerHTML = renderStreamingAssistantHTML(
          _latestText, _latestImages, _latestReasoning, {
            reasoningOpen: _reasoningOpen,
            groundingMetadata: _latestGrounding
          }
        );
        polishContent(_latestCE, { streaming: true });
        scrollStreamingCodeToEnd(_latestCE, _latestText);
        scrollToBottomIfNear();
      }
      streamThrottle = null;
    });
  };

  const updateStreamingContent = (contentEl, text) => {
    updateStreamingAssistantContent(
      contentEl, text, _latestImages, _latestReasoning, {
        reasoningOpen: _reasoningOpen,
        groundingMetadata: _latestGrounding
      }
    );
  };

  const finalizeStreaming = (article, text, message) => {
    resetStreamingCodeScroll();
    _latestImages = null;
    _latestText = '';
    _latestReasoning = '';
    _latestGrounding = null;
    _reasoningOpen = false;
    _latestCE = null;
    article.classList.remove('streaming');
    const content = article.querySelector('.content');
    if (content) {
      content.innerHTML = renderStreamingAssistantHTML(
        text, message?.generatedImages, message?.reasoningContent, {
          reasoningOpen: false,
          groundingMetadata: message?.groundingMetadata
        }
      );
      polishContent(content, { renderMermaid: true });
    }
    if (message) setAssistantToolbar(article, message);
    scrollToBottomIfNear();
  };

  const rerenderMermaid = () => {
    window.Markdown.updateMermaidTheme();
    window.Markdown.resetMermaidBlocks(els.messages);
    window.Markdown.renderMermaid(els.messages, { skipIfStreaming: false });
    if (els.markdownPreviewPanel?.classList.contains('is-open')
      && els.markdownPreviewContent
      && !els.markdownPreviewContent.classList.contains('is-html-preview')) {
      window.Markdown.resetMermaidBlocks(els.markdownPreviewContent);
      window.Markdown.renderMermaid(els.markdownPreviewContent, { skipIfStreaming: false });
    }
  };

  const enterEditMode = (article) => {
    if (article.classList.contains('editing')) return;
    const contentEl = article.querySelector('.content');
    const toolbarEl = article.querySelector('.toolbar');
    article._editOriginal = {
      content: contentEl.innerHTML,
      toolbar: toolbarEl.innerHTML
    };
    const p = contentEl.querySelector('p');
    const text = p ? p.innerText : contentEl.innerText;
    contentEl.innerHTML = '<textarea class="edit-textarea" rows="1">' + escapeHTML(text) + '</textarea>';
    toolbarEl.innerHTML =
      '<button type="button" class="tb-btn" data-action="save-edit" title="Lưu"><i class="fa-solid fa-check"></i></button>' +
      '<button type="button" class="tb-btn" data-action="cancel-edit" title="Huỷ"><i class="fa-solid fa-xmark"></i></button>';
    article.classList.add('editing');
    const textarea = contentEl.querySelector('.edit-textarea');
    autoResize(textarea);
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  };

  const exitEditMode = (article) => {
    if (!article.classList.contains('editing')) return;
    const saved = article._editOriginal;
    if (saved) {
      article.querySelector('.content').innerHTML = saved.content;
      article.querySelector('.toolbar').innerHTML = saved.toolbar;
    }
    article.classList.remove('editing');
    delete article._editOriginal;
  };

  const rehighlight = (root) => {
    if (!window.hljs) return;
    root.querySelectorAll('pre code').forEach((block) => {
      try { window.hljs.highlightElement(block); } catch {}
    });
  };

  const polishContent = (root, { renderMermaid = true, streaming = false } = {}) => {
    window.Markdown.enhanceCodeBlocks(root);
    window.Markdown.enhanceTables(root);
    if (!streaming) rehighlight(root);
    if (!streaming) window.Markdown.typesetMath(root);
    if (renderMermaid) window.Markdown.renderMermaid(root);
  };

  const hasOpenCodeFence = (text) => {
    const count = (text.match(/```/g) || []).length;
    return count % 2 === 1;
  };

  const CODE_SCROLL_LERP = 0.18;
  const CODE_SCROLL_SNAP_GAP = 96;
  const codeScrollStates = new WeakMap();
  const codeScrollElements = new Set();

  const stopCodeScrollAnimations = () => {
    codeScrollElements.forEach((el) => {
      const state = codeScrollStates.get(el);
      if (state?.rafId) cancelAnimationFrame(state.rafId);
      if (state) state.rafId = null;
    });
    codeScrollElements.clear();
  };

  const resetStreamingCodeScroll = () => {
    _streamingCodeScrollTarget = 0;
    stopCodeScrollAnimations();
  };

  const animateCodeScroll = (el, targetTop) => {
    let state = codeScrollStates.get(el);
    if (!state) {
      state = { rafId: null, target: 0 };
      codeScrollStates.set(el, state);
    }
    state.target = Math.max(0, targetTop);
    codeScrollElements.add(el);

    if (state.rafId) return;

    const tick = () => {
      const st = codeScrollStates.get(el);
      if (!st) return;

      const dest = st.target;
      const cur = el.scrollTop;
      const diff = dest - cur;

      if (Math.abs(diff) < 0.5) {
        el.scrollTop = dest;
        st.rafId = null;
        codeScrollElements.delete(el);
        return;
      }

      el.scrollTop = cur + diff * CODE_SCROLL_LERP;
      st.rafId = requestAnimationFrame(tick);
    };

    state.rafId = requestAnimationFrame(tick);
  };

  const scrollElementToEnd = (el, { streaming = false } = {}) => {
    if (!el || el.scrollHeight <= el.clientHeight) {
      if (streaming) _streamingCodeScrollTarget = 0;
      return;
    }

    const target = el.scrollHeight - el.clientHeight;

    if (streaming) {
      stopCodeScrollAnimations();

      if (_streamingCodeScrollTarget > 0 && target >= _streamingCodeScrollTarget - 4) {
        el.scrollTop = Math.min(_streamingCodeScrollTarget, target);
        if (target - el.scrollTop > 0.5) animateCodeScroll(el, target);
        _streamingCodeScrollTarget = target;
        return;
      }

      if (target > CODE_SCROLL_SNAP_GAP) {
        el.scrollTop = target;
        _streamingCodeScrollTarget = target;
        return;
      }

      animateCodeScroll(el, target);
      _streamingCodeScrollTarget = target;
      return;
    }

    el.scrollTop = target;
  };

  const scrollStreamingCodeToEnd = (root, text) => {
    if (!root || !hasOpenCodeFence(text)) return;

    const pres = root.querySelectorAll('pre');
    const lastPre = pres[pres.length - 1];
    if (!lastPre) return;

    if (lastPre.classList.contains('mermaid-pending')) {
      scrollElementToEnd(lastPre, { streaming: true });
      scrollElementToEnd(lastPre.closest('.mermaid-view'), { streaming: true });
      return;
    }

    if (lastPre.closest('.mermaid-block')) {
      const source = lastPre.closest('.mermaid-source');
      scrollElementToEnd(source || lastPre, { streaming: true });
      return;
    }

    scrollElementToEnd(lastPre, { streaming: true });
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      els.messages.scrollTop = els.messages.scrollHeight;
    });
  };

  const isNearBottom = () => {
    const el = els.messages;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  };

  const scrollToBottomIfNear = () => {
    if (isNearBottom()) scrollToBottom();
  };

  const showError = (err) => {
    removeError();
    const div = document.createElement('div');
    div.className = 'error-banner';
    div.id = 'errorBanner';
    div.textContent = `Lỗi: ${err.message || err}. Kiểm tra API key trong Cài đặt.`;
    els.composer.insertAdjacentElement('beforebegin', div);
  };

  const removeError = () => {
    const e = document.getElementById('errorBanner');
    if (e) e.remove();
  };

  const setStreaming = (on) => {
    els.sendBtn.classList.toggle('hidden', on);
    els.stopBtn.classList.toggle('hidden', !on);
    els.composerInput.disabled = on;
    els.attachImageBtn.disabled = on;
    els.attachFileBtn.disabled = on;
    if (els.webSearchBtn) els.webSearchBtn.disabled = on;
    if (els.imageGenBtn) els.imageGenBtn.disabled = on;
    if (els.translateBtn) els.translateBtn.disabled = on;
    if (els.translateChipClose) els.translateChipClose.disabled = on;
    if (els.translateLangBtn) els.translateLangBtn.disabled = on;
    if (els.imageGenChipClose) els.imageGenChipClose.disabled = on;
    if (els.imageGenRefBtn) els.imageGenRefBtn.disabled = on;
    if (els.imageGenRatioBtn) els.imageGenRatioBtn.disabled = on;
    if (els.imageGenStyleBtn) els.imageGenStyleBtn.disabled = on;
    if (els.imageGenTemplateBtn) els.imageGenTemplateBtn.disabled = on;
    if (els.imageGenRatioChipClear) els.imageGenRatioChipClear.disabled = on;
    if (els.imageGenStyleChipClear) els.imageGenStyleChipClear.disabled = on;
    if (els.imageGenTemplateChipClear) els.imageGenTemplateChipClear.disabled = on;
    els.messages.classList.toggle('is-streaming', on);
  };

  const renderComposerAttachments = (images, files) => {
    const imgList = images || [];
    const fileList = files || [];
    if (!imgList.length && !fileList.length) {
      els.composerAttachments.innerHTML = '';
      els.composerAttachments.classList.add('hidden');
      return;
    }
    els.composerAttachments.classList.remove('hidden');
    const imageHtml = imgList.map((img, i) =>
      '<div class="composer-attachment composer-attachment-image" data-type="image" data-idx="' + i + '">'
      + '<img src="' + img.dataUrl + '" alt="' + escapeHTML(img.name || 'Ảnh ' + (i + 1)) + '" />'
      + '<button type="button" class="composer-attachment-remove" data-remove-type="image" data-remove-idx="' + i + '" title="Xoá ảnh" aria-label="Xoá ảnh">'
      + '<i class="fa-solid fa-xmark"></i></button>'
      + '</div>'
    ).join('');
    const fileHtml = fileList.map((f, i) =>
      '<div class="composer-attachment composer-attachment-file" data-type="file" data-idx="' + i + '">'
      + '<i class="fa-solid ' + window.Files.getIconClass(f.name) + '"></i>'
      + '<span class="composer-file-name" title="' + escapeHTML(f.name) + '">' + escapeHTML(f.name) + '</span>'
      + '<span class="composer-file-size">' + window.Files.formatSize(f.size || 0) + '</span>'
      + '<button type="button" class="composer-attachment-remove" data-remove-type="file" data-remove-idx="' + i + '" title="Xoá tệp" aria-label="Xoá tệp">'
      + '<i class="fa-solid fa-xmark"></i></button>'
      + '</div>'
    ).join('');
    els.composerAttachments.innerHTML = imageHtml + fileHtml;
  };

  const setDragOverlay = (visible) => {
    els.appDropOverlay.classList.toggle('hidden', !visible);
    els.composerDropZone.classList.toggle('drag-over', visible);
  };

  const openSettings = (state) => {
    els.apiKeyInput.value = state.apiKey || '';
    els.anthropicApiKeyInput.value = state.anthropicApiKey || '';
    els.deepseekApiKeyInput.value = state.deepseekApiKey || '';
    els.geminiApiKeyInput.value = state.geminiApiKey || '';
    els.systemPromptInput.value = state.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    const radios = els.settingsForm.querySelectorAll('input[name="theme"]');
    radios.forEach(r => { r.checked = r.value === (state.theme || 'dark'); });
    els.apiKeyInput.type = 'password';
    els.apiKeyIcon.innerHTML = '<i class="fa-solid fa-eye"></i>';
    els.anthropicApiKeyInput.type = 'password';
    els.anthropicApiKeyIcon.innerHTML = '<i class="fa-solid fa-eye"></i>';
    els.deepseekApiKeyInput.type = 'password';
    els.deepseekApiKeyIcon.innerHTML = '<i class="fa-solid fa-eye"></i>';
    els.geminiApiKeyInput.type = 'password';
    els.geminiApiKeyIcon.innerHTML = '<i class="fa-solid fa-eye"></i>';
    els.settingsModal.classList.remove('hidden');
    setTimeout(() => els.apiKeyInput.focus(), 50);
  };

  const closeSettings = () => els.settingsModal.classList.add('hidden');

  const openGuide = () => {
    closeSettings();
    if (!els.guideModal) return;
    els.guideModal.classList.remove('hidden');
    if (els.guideBody) els.guideBody.scrollTop = 0;
  };

  const closeGuide = () => {
    if (els.guideModal) els.guideModal.classList.add('hidden');
  };

  const isGuideModalOpen = () => !!(els.guideModal && !els.guideModal.classList.contains('hidden'));

  let renameResolve = null;

  const openRenameModal = (title) => {
    return new Promise((resolve) => {
      renameResolve = resolve;
      els.renameInput.value = title || '';
      els.renameModal.classList.remove('hidden');
      setTimeout(() => {
        els.renameInput.focus();
        els.renameInput.select();
      }, 50);
    });
  };

  const closeRenameModal = (result = null) => {
    els.renameModal.classList.add('hidden');
    if (renameResolve) {
      renameResolve(result);
      renameResolve = null;
    }
  };

  const isRenameModalOpen = () => !els.renameModal.classList.contains('hidden');

  const isMobileSidebar = () => window.matchMedia('(max-width: 768px)').matches;

  const toggleSidebar = (force) => {
    const app = els.app || document.getElementById('app');
    const current = app.getAttribute('data-sidebar');
    let next;
    if (force === true) {
      next = 'open';
    } else if (force === false) {
      next = 'closed';
    } else {
      next = current === 'open' ? 'closed' : 'open';
    }
    app.setAttribute('data-sidebar', next);
    const btn = els.openSidebarBtn;
    if (btn) btn.title = next === 'open' ? 'Đóng sidebar' : 'Mở sidebar';
  };

  const closeMobileSidebar = () => {
    if (isMobileSidebar()) toggleSidebar(false);
  };

  const initSidebar = () => {
    if (isMobileSidebar()) toggleSidebar(false);
  };

  const setPreviewPanelTitle = (mode) => {
    if (els.previewPanelIcon) {
      els.previewPanelIcon.className = mode === 'html'
        ? 'fa-brands fa-html5'
        : 'fa-brands fa-markdown';
    }
    if (els.previewPanelTitle) {
      els.previewPanelTitle.textContent = mode === 'html' ? 'Preview HTML' : 'Preview Markdown';
    }
    if (els.markdownPreviewPanel) {
      els.markdownPreviewPanel.setAttribute('aria-label', mode === 'html' ? 'Preview HTML' : 'Preview Markdown');
    }
  };

  const wrapHtmlPreview = (source) => {
    const trimmed = (source || '').trim();
    if (/<!doctype\s+html|<html[\s>]/i.test(trimmed)) return trimmed;
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'
      + trimmed + '</body></html>';
  };

  const openPreviewPanel = () => {
    els.markdownPreviewPanel.classList.add('is-open');
    els.markdownPreviewPanel.setAttribute('aria-hidden', 'false');
    els.app.setAttribute('data-md-preview', 'open');
    if (els.mdPreviewOverlay) els.mdPreviewOverlay.classList.remove('hidden');
  };

  const openMarkdownPreview = (source) => {
    if (!source || !els.markdownPreviewPanel || !els.markdownPreviewContent) return;
    setPreviewPanelTitle('markdown');
    els.markdownPreviewContent.classList.remove('is-html-preview');
    els.markdownPreviewContent.innerHTML = window.Markdown.render(source);
    polishContent(els.markdownPreviewContent, { renderMermaid: true });
    els.markdownPreviewContent.scrollTop = 0;
    openPreviewPanel();
  };

  const openHtmlPreview = (source) => {
    if (!source || !els.markdownPreviewPanel || !els.markdownPreviewContent) return;
    setPreviewPanelTitle('html');
    els.markdownPreviewContent.classList.add('is-html-preview');
    els.markdownPreviewContent.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.className = 'html-preview-frame';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-modals');
    iframe.setAttribute('title', 'HTML Preview');
    iframe.srcdoc = wrapHtmlPreview(source);
    els.markdownPreviewContent.appendChild(iframe);
    openPreviewPanel();
  };

  const closeMarkdownPreview = () => {
    if (!els.markdownPreviewPanel) return;
    els.markdownPreviewPanel.classList.remove('is-open');
    els.markdownPreviewPanel.setAttribute('aria-hidden', 'true');
    els.app.removeAttribute('data-md-preview');
    if (els.mdPreviewOverlay) els.mdPreviewOverlay.classList.add('hidden');
    if (els.markdownPreviewContent) {
      els.markdownPreviewContent.classList.remove('is-html-preview');
      els.markdownPreviewContent.innerHTML = '';
    }
  };

  const downloadConversation = (convo) => {
    const { formatConversation, downloadFile } = window.Utils;
    const md = formatConversation(convo);
    const safeName = (convo.title || 'conversation').replace(/[^a-zA-Z0-9\u00C0-\u1EF9_\-\s]/g, '').trim() || 'conversation';
    downloadFile(md, safeName + '.md', 'text/markdown');
  };

  let toastTimer;
  const showToast = (msg) => {
    els.toast.textContent = msg;
    els.toast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.add('hidden'), 1800);
  };

  return {
    cacheEls, setTheme, initModelSelect, initTranslateLangMenu, initImageGenMenus,
    syncComposerToolsUI, syncTranslateUI, closeTranslateLangMenu, closeImageGenMenus, toggleImageGenMenu, setImageGenOptionPicked,
    setStreamingSearchStatus, setStreamingImageStatus, updateStreamingAssistantContent,
    renderConversationList, renderMessages, renderEmpty,
    appendMessage, appendStreamingMessage, updateStreamingContent, finalizeStreaming,
    enterEditMode, exitEditMode, downloadConversation,
    scrollToBottom, scrollToBottomIfNear, showError, removeError, setStreaming,
    renderComposerAttachments, setDragOverlay,
    openSettings, closeSettings, openGuide, closeGuide, isGuideModalOpen,
    openRenameModal, closeRenameModal, isRenameModalOpen, toggleSidebar, closeMobileSidebar, initSidebar, showToast, rerenderMermaid,
    setAssistantToolbar, updateAssistantMessage, beginRetryStreaming,
    openMarkdownPreview, openHtmlPreview, closeMarkdownPreview, els
  };
})();
