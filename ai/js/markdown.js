window.Markdown = (() => {
  const { escapeHTML } = window.Utils;

  const COPY_BTN = '<button type="button" class="copy-code-btn" data-copy-code title="Sao chép" aria-label="Sao chép"><i class="fa-solid fa-copy"></i></button>';
  const previewBtnTitle = (key, fallback) => {
    try {
      return window.I18n?.t?.(key) || fallback;
    } catch {
      return fallback;
    }
  };
  const copyBtnTitle = (key, fallback) => previewBtnTitle(key, fallback);

  const copyTablePlainBtn = () => {
    const title = escapeHTML(copyBtnTitle('copy', 'Sao chép'));
    return '<button type="button" class="copy-code-btn copy-table-btn" data-copy-table-plain title="' + title + '" aria-label="' + title + '"><i class="fa-solid fa-copy"></i></button>';
  };

  const copyTableMarkdownBtn = () => {
    const title = escapeHTML(copyBtnTitle('copyTableMarkdown', 'Sao chép bảng (Markdown)'));
    return '<button type="button" class="copy-table-btn" data-copy-table title="' + title + '" aria-label="' + title + '"><i class="fa-solid fa-table"></i></button>';
  };

  const previewMdBtn = () =>
    '<button type="button" class="preview-md-btn" data-preview-md title="' + escapeHTML(previewBtnTitle('previewMarkdown', 'Preview Markdown')) + '" aria-label="' + escapeHTML(previewBtnTitle('previewMarkdown', 'Preview Markdown')) + '"><i class="fa-solid fa-eye"></i></button>';

  const PREVIEW_ARTIFACT_META = {
    html: { key: 'previewHtml', fallback: 'Preview HTML', icon: 'fa-solid fa-eye' },
    react: { key: 'previewReact', fallback: 'Preview React', icon: 'fa-brands fa-react' },
    svg: { key: 'previewSvg', fallback: 'Preview SVG', icon: 'fa-solid fa-bezier-curve' },
    mermaid: { key: 'previewMermaid', fallback: 'Preview Mermaid', icon: 'fa-solid fa-diagram-project' },
    css: { key: 'previewCss', fallback: 'Preview CSS', icon: 'fa-brands fa-css3-alt' },
    json: { key: 'previewJson', fallback: 'Preview JSON', icon: 'fa-solid fa-code' },
    yaml: { key: 'previewYaml', fallback: 'Preview YAML', icon: 'fa-solid fa-file-lines' },
    vue: { key: 'previewVue', fallback: 'Preview Vue', icon: 'fa-brands fa-vuejs' },
    svelte: { key: 'previewSvelte', fallback: 'Preview Svelte', icon: 'fa-solid fa-bolt' },
    graphviz: { key: 'previewGraphviz', fallback: 'Preview Graphviz', icon: 'fa-solid fa-share-nodes' },
    csv: { key: 'previewCsv', fallback: 'Preview CSV', icon: 'fa-solid fa-table' },
    openapi: { key: 'previewOpenapi', fallback: 'Preview API doc', icon: 'fa-solid fa-book' },
    chart: { key: 'previewChart', fallback: 'Preview Chart', icon: 'fa-solid fa-chart-column' },
    python: { key: 'previewPython', fallback: 'Run Python', icon: 'fa-brands fa-python' },
    sql: { key: 'previewSql', fallback: 'SQL Preview', icon: 'fa-solid fa-database' }
  };

  const previewArtifactBtn = (type) => {
    const meta = PREVIEW_ARTIFACT_META[type] || PREVIEW_ARTIFACT_META.html;
    const title = escapeHTML(previewBtnTitle(meta.key, meta.fallback));
    return '<button type="button" class="preview-md-btn preview-artifact-btn" data-preview-artifact="' + type + '" title="' + title + '" aria-label="' + title + '"><i class="' + meta.icon + '"></i></button>';
  };

  const MD_LANG_RE = /^(?:markdown|md|mdown|mkdn)$/i;
  const isMarkdownLang = (lang) => MD_LANG_RE.test((lang || '').trim());

  const isHtmlLang = (lang) => window.ArtifactPreview?.isHtmlLang?.(lang) ?? /^(?:html|htm|xhtml)$/i.test((lang || '').trim());
  const isReactLang = (lang) => window.ArtifactPreview?.isReactLang?.(lang) ?? /^(?:jsx|tsx|react)$/i.test((lang || '').trim());
  const isSvgLang = (lang) => window.ArtifactPreview?.isSvgLang?.(lang) ?? /^svg$/i.test((lang || '').trim());
  const isCssLang = (lang) => window.ArtifactPreview?.isCssLang?.(lang) ?? /^(?:css|scss|sass|less)$/i.test((lang || '').trim());
  const isJsonLang = (lang) => window.ArtifactPreview?.isJsonLang?.(lang) ?? /^(?:json|jsonc)$/i.test((lang || '').trim());
  const isYamlLang = (lang) => window.ArtifactPreview?.isYamlLang?.(lang) ?? /^(?:ya?ml)$/i.test((lang || '').trim());
  const isVueLang = (lang) => window.ArtifactPreview?.isVueLang?.(lang) ?? /^vue$/i.test((lang || '').trim());
  const isSvelteLang = (lang) => window.ArtifactPreview?.isSvelteLang?.(lang) ?? /^svelte$/i.test((lang || '').trim());
  const isGraphvizLang = (lang) => window.ArtifactPreview?.isGraphvizLang?.(lang) ?? /^(?:graphviz|dot|gv)$/i.test((lang || '').trim());
  const isCsvLang = (lang) => window.ArtifactPreview?.isCsvLang?.(lang) ?? /^(?:csv|tsv)$/i.test((lang || '').trim());
  const isOpenApiLang = (lang) => window.ArtifactPreview?.isOpenApiLang?.(lang) ?? /^(?:openapi|swagger|oas)$/i.test((lang || '').trim());
  const isChartLang = (lang) => window.ArtifactPreview?.isChartLang?.(lang) ?? /^(?:chart|chartjs|echarts)$/i.test((lang || '').trim());
  const isPythonLang = (lang) => window.ArtifactPreview?.isPythonLang?.(lang) ?? /^(?:python|py)$/i.test((lang || '').trim());
  const isSqlLang = (lang) => window.ArtifactPreview?.isSqlLang?.(lang) ?? /^sql$/i.test((lang || '').trim());

  const countCodeLines = (code) => {
    const normalized = String(code ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    if (!normalized) return 1;
    const lines = normalized.split('\n');
    if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
    return Math.max(1, lines.length);
  };

  const lineNumbersText = (code) =>
    Array.from({ length: countCodeLines(code) }, (_, i) => String(i + 1)).join('\n');

  const codeBlockBodyHTML = (code, highlightedHtml, langClass) =>
    '<div class="code-block-body">'
    + '<div class="line-numbers" aria-hidden="true">' + lineNumbersText(code) + '</div>'
    + '<pre><code class="hljs' + langClass + '">' + highlightedHtml + '</code></pre>'
    + '</div>';

  const wrapCodeWithLineNumbers = (block, code) => {
    if (!block || !code || block.querySelector('.code-block-body')) return;
    const body = document.createElement('div');
    body.className = 'code-block-body';
    const lineNums = document.createElement('div');
    lineNums.className = 'line-numbers';
    lineNums.setAttribute('aria-hidden', 'true');
    lineNums.textContent = lineNumbersText(code.textContent || '');
    const innerPre = document.createElement('pre');
    code.remove();
    innerPre.appendChild(code);
    body.appendChild(lineNums);
    body.appendChild(innerPre);
    block.appendChild(body);
  };

  const highlightCode = (code, lang) => {
    const validLang = lang && window.hljs && window.hljs.getLanguage(lang) ? lang : '';
    let html;
    if (validLang && window.hljs) {
      try {
        html = window.hljs.highlight(code, { language: validLang, ignoreIllegals: true }).value;
      } catch {
        html = escapeHTML(code);
      }
    } else {
      html = escapeHTML(code);
    }
    return { html, validLang };
  };

  const MERMAID_START_RE = /^(?:graph\s|flowchart\s|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|gantt|pie\s|gitGraph|journey|mindmap|timeline|quadrantChart|requirementDiagram|C4Context|block-beta|xychart-beta|sankey-beta|packet-beta)/i;

  const MERMAID_LANG_RE = /^(?:mermaid|graph|flowchart|sequence(?:diagram)?|classdiagram|statediagram(?:-v2)?|erdiagram|gantt|pie|gitgraph|journey|mindmap|timeline|quadrantchart|c4context|block-beta|xychart-beta|sankey-beta|packet-beta|mmd)$/i;

  const isMermaidLang = (lang) => MERMAID_LANG_RE.test((lang || '').trim());

  const isMermaidContent = (code) => MERMAID_START_RE.test((code || '').trim());

  const shouldRenderMermaid = (lang, code) => isMermaidLang(lang) || isMermaidContent(code);

  const sanitizeMermaidSource = (code) => {
    let src = (code || '').replace(/\r\n/g, '\n').trim();
    src = src.replace(/^```(?:\w+)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
    src = src.replace(/<br\s*\/?>/gi, '\n');
    src = src.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
    src = src.replace(/\u2192/g, '-->').replace(/\u2190/g, '<--');
    return src.trim();
  };

  const MERMAID_LABEL_SPECIAL_RE = /[()/:;,&|=?!<>%+\-]/;

  const quoteMermaidLabel = (label) =>
    '"' + label.replace(/"/g, '').trim() + '"';

  const wrapMermaidLabel = (match, id, label, wrap) => {
    const trimmed = label.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || !MERMAID_LABEL_SPECIAL_RE.test(trimmed)) {
      return match;
    }
    return id + wrap(quoteMermaidLabel(trimmed));
  };

  const fixMermaidEmbeddedQuotes = (src) =>
    src.replace(/(\b[\w-]+)\[([^\]\n]*"[^\]\n]*)\]/g, (match, id, label) =>
      id + '[' + quoteMermaidLabel(label) + ']');

  const fixMermaidLineBreaks = (src) =>
    src
      .replace(/([\]\}\)])\s{2,}(?=[\w-]+)/g, '$1\n')
      .replace(/\b([\w-]+)\s{2,}([\w-]+(?:\s*(?:\[|\(|\{|--)))/g, '$1\n$2');

  const fixMermaidLabels = (src) => {
    let out = fixMermaidEmbeddedQuotes(src);
    out = out.replace(/(\b[\w-]+)\(\[([^\]]+)\]\)/g, (match, id, label) =>
      wrapMermaidLabel(match, id, label, (text) => '([' + text + '])'));
    out = out.replace(/(\b[\w-]+)\(\(([^)]+)\)\)/g, (match, id, label) =>
      wrapMermaidLabel(match, id, label, (text) => '((' + text + '))'));
    out = out.replace(/(\b[\w-]+)\{([^}]+)\}/g, (match, id, label) =>
      wrapMermaidLabel(match, id, label, (text) => '{' + text + '}'));
    out = out.replace(/(\b[\w-]+)\[([^\]]+)\]/g, (match, id, label) =>
      wrapMermaidLabel(match, id, label, (text) => '[' + text + ']'));
    return out;
  };

  const fixMermaidMarkdown = (src) =>
    src.replace(/\*\*([^*\n]+)\*\*/g, '$1').replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '$1');

  const normalizeMermaidSource = (src) =>
    fixMermaidMarkdown(fixMermaidLabels(fixMermaidLineBreaks(sanitizeMermaidSource(src))));

  const isMermaidErrorOutput = (container) => {
    const svg = container?.querySelector('svg');
    if (!svg) return true;
    const text = (svg.textContent || '').toLowerCase();
    if (text.includes('syntax error in text')) return true;
    if (text.includes('parse error on line')) return true;
    if (svg.querySelector('.error-icon, .error-text, [data-mermaid-error]')) return true;
    return false;
  };

  const mermaidBlockHTML = (code) => {
    const source = normalizeMermaidSource(code.replace(/\n$/, ''));
    return '<div class="mermaid-block" data-rendered="false">'
      + '<div class="pre-header">'
      + '<span class="lang">mermaid</span>'
      + '<div class="mermaid-header-actions">'
      + previewArtifactBtn('mermaid')
      + '<button type="button" class="toggle-mermaid-btn" data-toggle-mermaid title="Xem mã nguồn"><i class="fa-solid fa-code"></i></button>'
      + COPY_BTN
      + '</div>'
      + '</div>'
      + '<div class="mermaid-view"></div>'
      + '<div class="mermaid-source hidden">' + codeBlockBodyHTML(source, escapeHTML(source), '') + '</div>'
      + '<script type="text/plain" class="mermaid-source-raw">' + source.replace(/<\/script/gi, '<\\/script') + '</script>'
      + '</div>';
  };

  const codeBlockActions = (lang, code = '') => {
    const AP = window.ArtifactPreview;
    let preview = '';
    if (isMarkdownLang(lang)) preview = previewMdBtn();
    else if (isMermaidLang(lang)) preview = previewArtifactBtn('mermaid');
    else if (isOpenApiLang(lang) || AP?.isOpenApiContent?.(code)) preview = previewArtifactBtn('openapi');
    else if (isReactLang(lang)) preview = previewArtifactBtn('react');
    else if (isSvgLang(lang)) preview = previewArtifactBtn('svg');
    else if (isHtmlLang(lang)) preview = previewArtifactBtn('html');
    else if (isCssLang(lang)) preview = previewArtifactBtn('css');
    else if (isJsonLang(lang)) preview = previewArtifactBtn('json');
    else if (isYamlLang(lang)) preview = previewArtifactBtn('yaml');
    else if (isVueLang(lang)) preview = previewArtifactBtn('vue');
    else if (isSvelteLang(lang)) preview = previewArtifactBtn('svelte');
    else if (isGraphvizLang(lang)) preview = previewArtifactBtn('graphviz');
    else if (isCsvLang(lang)) preview = previewArtifactBtn('csv');
    else if (isChartLang(lang) || AP?.isChartContent?.(code)) preview = previewArtifactBtn('chart');
    else if (isPythonLang(lang)) preview = previewArtifactBtn('python');
    else if (isSqlLang(lang)) preview = previewArtifactBtn('sql');
    return '<div class="pre-header-actions">' + preview + COPY_BTN + '</div>';
  };

  const codeBlockHTML = (code, lang) => {
    if (shouldRenderMermaid(lang, code)) return mermaidBlockHTML(code);
    const { html, validLang } = highlightCode(code, lang);
    const label = validLang || lang || '';
    const langClass = validLang ? ' language-' + validLang : (lang ? ' language-' + lang : '');
    return '<div class="code-block"><div class="pre-header"><span class="lang">' + escapeHTML(label) + '</span>' + codeBlockActions(lang, code) + '</div>'
      + codeBlockBodyHTML(code, html, langClass) + '</div>';
  };

  const parseCodeArgs = (arg, infostring) => {
    if (arg && typeof arg === 'object' && 'text' in arg) {
      const lang = (arg.lang || '').match(/\S*/)?.[0] || '';
      return { code: arg.text, lang };
    }
    const lang = (infostring || '').match(/\S*/)?.[0] || '';
    return { code: arg || '', lang };
  };

  const renderKatex = (tex, display) => {
    if (!window.katex) {
      return escapeHTML(display ? '$$' + tex + '$$' : '$' + tex + '$');
    }
    try {
      return window.katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
        strict: 'ignore',
        trust: false,
        output: 'html'
      });
    } catch {
      return escapeHTML(display ? '$$' + tex + '$$' : '$' + tex + '$');
    }
  };

  const mathPlaceholder = (id, display) =>
    display
      ? '<div class="math-ph" data-mid="' + id + '"></div>'
      : '<span class="math-ph" data-mid="' + id + '"></span>';

  const protectContent = (text) => {
    const held = [];
    const mathParts = [];

    const holdHtml = (html) => {
      const id = held.length;
      held.push(html);
      return '<!--CODEPH' + id + '-->';
    };

    const holdMath = (tex, display) => {
      const id = mathParts.length;
      mathParts.push({ tex: tex.trim(), display });
      return mathPlaceholder(id, display);
    };

    let src = text || '';

    src = src.replace(/```([^\n`]*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const trimmedLang = (lang || '').trim();
      const trimmedCode = code.replace(/\n$/, '');
      return holdHtml(codeBlockHTML(trimmedCode, trimmedLang));
    });

    src = src.replace(/`([^`\n]+)`/g, (_, code) =>
      holdHtml('<code>' + escapeHTML(code) + '</code>')
    );

    src = src.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => holdMath(tex, true));
    src = src.replace(/\\\[([\s\S]+?)\\\]/g, (_, tex) => holdMath(tex, true));
    src = src.replace(/\\\(([\s\S]+?)\\\)/g, (_, tex) => holdMath(tex, false));
    src = src.replace(/(?<!\$)\$(?!\$)((?:\\.|[^$\n])+?)\$(?!\$)/g, (_, tex) => holdMath(tex, false));

    return { src, held, mathParts };
  };

  const restoreContent = (html, held, mathParts) => {
    let out = html.replace(/<!--CODEPH(\d+)-->/g, (_, id) => held[Number(id)] || '');

    out = out.replace(/<(span|div) class="math-ph" data-mid="(\d+)"><\/\1>/g, (_, tag, id) => {
      const item = mathParts[Number(id)];
      if (!item) return '';
      const rendered = renderKatex(item.tex, item.display);
      return item.display
        ? '<div class="math-block">' + rendered + '</div>'
        : '<span class="math-inline">' + rendered + '</span>';
    });

    return out;
  };

  const ensure = () => {
    if (!window.marked) return;
    const renderer = new window.marked.Renderer();

    renderer.link = function (token) {
      const href = typeof token === 'object' ? token.href : token;
      const title = typeof token === 'object' ? token.title : arguments[1];
      const text = typeof token === 'object' && token.tokens
        ? this.parser.parseInline(token.tokens)
        : (typeof token === 'object' ? token.text : arguments[2]) || '';
      let out = '<a href="' + escapeHTML(href) + '" target="_blank" rel="noopener noreferrer"';
      if (title) out += ' title="' + escapeHTML(title) + '"';
      out += '>' + text + '</a>';
      return out;
    };

    renderer.code = (arg, infostring) => {
      const { code, lang } = parseCodeArgs(arg, infostring);
      return codeBlockHTML(code.replace(/\n$/, ''), lang);
    };

    window.marked.use({ renderer, breaks: true, gfm: true });
  };

  const enhanceLinks = (root) => {
    if (!root) return;
    root.querySelectorAll('a[href]').forEach((a) => {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    });
  };

  const getMermaidTheme = () => {
    const theme = document.documentElement.getAttribute('data-theme');
    return theme === 'dark' || theme === 'vs-dark' || theme === 'apple-dark' || theme === 'cyberpunk' || theme === 'nvidia' || theme === 'liquid-glass' ? 'dark' : 'default';
  };

  let mermaidReady = false;

  const initMermaid = () => {
    if (!window.mermaid || mermaidReady) return;
    try {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: getMermaidTheme(),
        securityLevel: 'loose',
        fontFamily: 'Inter, system-ui, sans-serif',
        logLevel: 'error',
        suppressErrorRendering: true
      });
      mermaidReady = true;
    } catch (e) {
      console.warn('Mermaid init failed', e);
    }
  };

  const updateMermaidTheme = () => {
    if (!window.mermaid) return;
    try {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: getMermaidTheme(),
        securityLevel: 'loose',
        fontFamily: 'Inter, system-ui, sans-serif',
        logLevel: 'error',
        suppressErrorRendering: true
      });
    } catch (e) {
      console.warn('Mermaid theme update failed', e);
    }
  };

  let mermaidIdCounter = 0;
  const nextMermaidId = () => 'mmd-' + Date.now().toString(36) + '-' + (++mermaidIdCounter);

  const getMermaidSource = (block) => {
    const script = block.querySelector('script.mermaid-source-raw');
    if (script) return script.textContent || '';
    const legacy = block.querySelector('.mermaid-source code');
    return legacy?.textContent || '';
  };

  const renderOneMermaid = async (source, view) => {
    const attempts = [
      normalizeMermaidSource(source),
      sanitizeMermaidSource(source),
      fixMermaidLabels(sanitizeMermaidSource(source))
    ];
    const seen = new Set();
    let lastError = null;

    for (const attempt of attempts) {
      const text = (attempt || '').trim();
      if (!text || seen.has(text)) continue;
      seen.add(text);

      const id = nextMermaidId();
      try {
        const { svg, bindFunctions } = await window.mermaid.render(id, text);
        const probe = document.createElement('div');
        probe.innerHTML = svg;
        if (isMermaidErrorOutput(probe)) {
          probe.remove();
          throw new Error('Syntax error in text');
        }
        probe.remove();
        view.innerHTML = svg;
        if (typeof bindFunctions === 'function') bindFunctions(view);
        return { ok: true, source: text };
      } catch (err) {
        lastError = err;
        const orphan = document.getElementById(id);
        if (orphan) orphan.remove();
        const orphanD = document.getElementById('d' + id);
        if (orphanD) orphanD.remove();
      }
    }

    return { ok: false, error: lastError };
  };

  const renderMermaidPreview = async (source, container) => {
    if (!container) return { ok: false, error: new Error('No container') };
    initMermaid();
    const view = document.createElement('div');
    view.className = 'mermaid-preview-view';
    container.innerHTML = '';
    container.appendChild(view);
    const result = await renderOneMermaid(source, view);
    if (!result.ok) {
      const msg = result.error?.message || result.error?.str || 'Mermaid render failed';
      container.innerHTML = '<pre class="artifact-error">' + escapeHTML(msg) + '</pre>';
    }
    return result;
  };

  let mermaidRenderQueue = Promise.resolve();

  const renderMermaid = (root, { skipIfStreaming = true } = {}) => {
    if (!root || !window.mermaid) return Promise.resolve();
    if (skipIfStreaming && root.closest && root.closest('.streaming')) {
      root.querySelectorAll('.mermaid-block[data-rendered="false"]').forEach((block) => {
        const source = getMermaidSource(block);
        const view = block.querySelector('.mermaid-view');
        if (view && source.trim()) {
          view.innerHTML = '<pre class="mermaid-pending"><code>' + escapeHTML(source) + '</code></pre>';
        }
      });
      return Promise.resolve();
    }

    mermaidRenderQueue = mermaidRenderQueue.then(async () => {
      initMermaid();
      const blocks = root.querySelectorAll('.mermaid-block[data-rendered="false"]');
      for (const block of blocks) {
        const source = getMermaidSource(block);
        const view = block.querySelector('.mermaid-view');
        if (!view || !source.trim()) continue;

        view.innerHTML = '';
        const result = await renderOneMermaid(source, view);
        if (result.ok) {
          block.dataset.rendered = 'true';
          continue;
        }

        const detail = result.error?.message || result.error?.str || '';
        const hint = detail ? ' <span class="mermaid-error-detail">' + escapeHTML(detail.slice(0, 120)) + '</span>' : '';
        view.innerHTML = '<div class="mermaid-error">Không thể hiển thị sơ đồ Mermaid. Kiểm tra cú pháp hoặc xem mã nguồn.' + hint + '</div>';
        block.dataset.rendered = 'error';
        console.warn('Mermaid render failed', result.error);
      }
    }).catch((e) => console.warn('Mermaid render failed', e));

    return mermaidRenderQueue;
  };

  const resetMermaidBlocks = (root) => {
    if (!root) return;
    root.querySelectorAll('.mermaid-block').forEach((block) => {
      block.dataset.rendered = 'false';
      const view = block.querySelector('.mermaid-view');
      if (view) view.innerHTML = '';
    });
  };

  const migrateOrphanCodeBlocks = (root) => {
    root.querySelectorAll('.code-block-body').forEach((body) => {
      if (body.closest('.code-block')) return;

      const block = document.createElement('div');
      block.className = 'code-block';
      body.parentNode.insertBefore(block, body);

      const prev = block.previousElementSibling;
      if (prev?.classList.contains('pre-header')) {
        prev.remove();
        block.appendChild(prev);
      }

      const emptyPre = block.previousElementSibling;
      if (emptyPre?.tagName === 'PRE' && !emptyPre.textContent.trim() && !emptyPre.querySelector('code')) {
        emptyPre.remove();
      }

      const code = body.querySelector('code');
      if (code && !body.querySelector('pre')) {
        const innerPre = document.createElement('pre');
        code.remove();
        innerPre.appendChild(code);
        body.appendChild(innerPre);
      }

      body.remove();
      block.appendChild(body);
    });
  };

  const enhanceCodeBlocks = (root) => {
    if (!root) return;
    migrateOrphanCodeBlocks(root);
    root.querySelectorAll('pre').forEach((pre) => {
      if (pre.closest('.code-block-body')) return;
      if (pre.closest('.mermaid-block') && !pre.classList.contains('mermaid-source')) return;

      const code = pre.querySelector('code');
      if (!code) return;

      let block = pre.closest('.code-block');
      if (!block) {
        block = document.createElement('div');
        block.className = 'code-block';
        pre.parentNode.insertBefore(block, pre);

        const header = pre.querySelector('.pre-header');
        if (header) {
          header.remove();
          block.appendChild(header);
        } else {
          const lang = [...code.classList].find((c) => c.startsWith('language-'))?.slice(9) || '';
          const headerEl = document.createElement('div');
          headerEl.className = 'pre-header';
          headerEl.innerHTML = '<span class="lang">' + escapeHTML(lang) + '</span>' + codeBlockActions(lang, code.textContent || '');
          block.appendChild(headerEl);
          if (!code.classList.contains('hljs')) code.classList.add('hljs');
          if (lang && !code.classList.contains('language-' + lang)) code.classList.add('language-' + lang);
        }

        const existingBody = pre.querySelector('.code-block-body');
        if (existingBody) {
          existingBody.remove();
          block.appendChild(existingBody);
        } else {
          wrapCodeWithLineNumbers(block, code);
        }

        pre.remove();
        return;
      }

      if (!block.querySelector('.pre-header')) {
        const lang = [...code.classList].find((c) => c.startsWith('language-'))?.slice(9) || '';
        const header = document.createElement('div');
        header.className = 'pre-header';
        header.innerHTML = '<span class="lang">' + escapeHTML(lang) + '</span>' + codeBlockActions(lang, code.textContent || '');
        block.insertBefore(header, block.firstChild);
        if (!code.classList.contains('hljs')) code.classList.add('hljs');
        if (lang && !code.classList.contains('language-' + lang)) code.classList.add('language-' + lang);
      }

      if (!block.querySelector('.code-block-body')) {
        wrapCodeWithLineNumbers(block, code);
      }
    });
  };

  const cellText = (cell) =>
    (cell.innerText || '').replace(/\t/g, ' ').replace(/\n+/g, ' ').trim();

  const escapeMdCell = (text) => text.replace(/\|/g, '\\|');

  const tableToPlainText = (table) => {
    const rows = [...table.querySelectorAll('tr')];
    if (!rows.length) return '';
    return rows.map((row) =>
      [...row.querySelectorAll('th, td')].map((cell) => cell.innerText.replace(/\s+/g, ' ').trim()).join('\t')
    ).join('\n');
  };

  const tableToMarkdown = (table) => {
    const rows = [...table.querySelectorAll('tr')];
    if (!rows.length) return '';

    const mdRows = rows.map((row) => {
      const cells = [...row.querySelectorAll('th, td')].map(cellText).map(escapeMdCell);
      return '| ' + cells.join(' | ') + ' |';
    });

    const colCount = rows[0].querySelectorAll('th, td').length;
    const separator = '| ' + Array(colCount).fill('---').join(' | ') + ' |';
    mdRows.splice(1, 0, separator);
    return mdRows.join('\n');
  };

  const enhanceTables = (root) => {
    if (!root) return;
    root.querySelectorAll('table').forEach((table) => {
      if (table.closest('.table-block')) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'table-block';
      const header = document.createElement('div');
      header.className = 'table-header';
      header.innerHTML = '<span class="table-label">' + escapeHTML(copyBtnTitle('tableLabel', 'Bảng')) + '</span>'
        + '<div class="table-header-actions">' + copyTableMarkdownBtn() + copyTablePlainBtn() + '</div>';
      const scroll = document.createElement('div');
      scroll.className = 'table-scroll';

      table.parentNode.insertBefore(wrapper, table);
      scroll.appendChild(table);
      wrapper.appendChild(header);
      wrapper.appendChild(scroll);
    });
  };

  const typesetMath = (root) => {
    if (!root || !window.renderMathInElement) return;
    try {
      window.renderMathInElement(root, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false,
        strict: 'ignore',
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
        ignoredClasses: ['math-inline', 'math-block', 'katex']
      });
    } catch (e) {
      console.warn('KaTeX auto-render failed', e);
    }
  };

  const render = (text) => {
    if (!window.marked) return '';
    try {
      const { src, held, mathParts } = protectContent(text);
      return restoreContent(window.marked.parse(src), held, mathParts);
    } catch {
      return '<p>' + escapeHTML(text || '') + '</p>';
    }
  };

  const wrapMath = (tex, display = false) => {
    const rendered = renderKatex(String(tex || '').trim(), !!display);
    return display
      ? '<div class="math-block">' + rendered + '</div>'
      : '<span class="math-inline">' + rendered + '</span>';
  };

  const init = () => {
    ensure();
    initMermaid();
  };

  return { init, render, wrapMath, enhanceCodeBlocks, enhanceTables, enhanceLinks, tableToMarkdown, tableToPlainText, typesetMath, renderMermaid, renderMermaidPreview, resetMermaidBlocks, initMermaid, updateMermaidTheme, getMermaidSource, isMarkdownLang };
})();
