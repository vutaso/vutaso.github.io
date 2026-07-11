window.ArtifactPreview = (() => {
  const { escapeHTML } = window.Utils;

  const HTML_LANG_RE = /^(?:html|htm|xhtml)$/i;
  const REACT_LANG_RE = /^(?:jsx|tsx|react)$/i;
  const SVG_LANG_RE = /^svg$/i;
  const CSS_LANG_RE = /^(?:css|scss|sass|less)$/i;
  const JSON_LANG_RE = /^(?:json|jsonc)$/i;
  const YAML_LANG_RE = /^(?:ya?ml)$/i;
  const VUE_LANG_RE = /^(?:vue)$/i;
  const SVELTE_LANG_RE = /^(?:svelte)$/i;
  const GRAPHVIZ_LANG_RE = /^(?:graphviz|dot|gv)$/i;
  const CSV_LANG_RE = /^(?:csv|tsv)$/i;
  const OPENAPI_LANG_RE = /^(?:openapi|swagger|oas)$/i;
  const CHART_LANG_RE = /^(?:chart|chartjs|echarts)$/i;
  const PYTHON_LANG_RE = /^(?:python|py)$/i;
  const SQL_LANG_RE = /^sql$/i;
  const MERMAID_LANG_RE = /^(?:mermaid|graph|flowchart|sequence(?:diagram)?|classdiagram|statediagram(?:-v2)?|erdiagram|gantt|pie|gitgraph|journey|mindmap|timeline|quadrantchart|c4context|block-beta|xychart-beta|sankey-beta|packet-beta|mmd)$/i;
  const MERMAID_START_RE = /^(?:graph\s|flowchart\s|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|gantt|pie\s|gitGraph|journey|mindmap|timeline|quadrantChart|requirementDiagram|C4Context|block-beta|xychart-beta|sankey-beta|packet-beta)/i;

  const isHtmlLang = (lang) => HTML_LANG_RE.test((lang || '').trim());
  const isReactLang = (lang) => REACT_LANG_RE.test((lang || '').trim());
  const isSvgLang = (lang) => SVG_LANG_RE.test((lang || '').trim());
  const isCssLang = (lang) => CSS_LANG_RE.test((lang || '').trim());
  const isJsonLang = (lang) => JSON_LANG_RE.test((lang || '').trim());
  const isYamlLang = (lang) => YAML_LANG_RE.test((lang || '').trim());
  const isVueLang = (lang) => VUE_LANG_RE.test((lang || '').trim());
  const isSvelteLang = (lang) => SVELTE_LANG_RE.test((lang || '').trim());
  const isGraphvizLang = (lang) => GRAPHVIZ_LANG_RE.test((lang || '').trim());
  const isCsvLang = (lang) => CSV_LANG_RE.test((lang || '').trim());
  const isOpenApiLang = (lang) => OPENAPI_LANG_RE.test((lang || '').trim());
  const isChartLang = (lang) => CHART_LANG_RE.test((lang || '').trim());
  const isPythonLang = (lang) => PYTHON_LANG_RE.test((lang || '').trim());
  const isSqlLang = (lang) => window.SqlPreview?.isSqlLang?.(lang) ?? SQL_LANG_RE.test((lang || '').trim());
  const isMermaidLang = (lang) => MERMAID_LANG_RE.test((lang || '').trim());
  const isMermaidContent = (code) => MERMAID_START_RE.test((code || '').trim());
  const isGraphvizContent = (code) => /^(?:strict\s+)?(?:di)?graph\s+(?:[\w"-]|\{)/im.test((code || '').trim());
  const isIframeArtifact = (type) =>
    type === 'html' || type === 'react' || type === 'svg' || type === 'css'
    || type === 'vue' || type === 'svelte' || type === 'chart' || type === 'python';
  const isDomArtifact = (type) =>
    type === 'mermaid' || type === 'json' || type === 'yaml' || type === 'graphviz'
    || type === 'csv' || type === 'openapi' || type === 'sql';
  const isArtifactLang = (lang) =>
    isHtmlLang(lang) || isReactLang(lang) || isSvgLang(lang)
    || isCssLang(lang) || isJsonLang(lang) || isYamlLang(lang) || isMermaidLang(lang)
    || isVueLang(lang) || isSvelteLang(lang) || isGraphvizLang(lang) || isCsvLang(lang)
    || isOpenApiLang(lang) || isChartLang(lang) || isPythonLang(lang) || isSqlLang(lang);

  const artifactTypeFromLang = (lang) => {
    if (isMermaidLang(lang)) return 'mermaid';
    if (isGraphvizLang(lang)) return 'graphviz';
    if (isReactLang(lang)) return 'react';
    if (isVueLang(lang)) return 'vue';
    if (isSvelteLang(lang)) return 'svelte';
    if (isSvgLang(lang)) return 'svg';
    if (isHtmlLang(lang)) return 'html';
    if (isCssLang(lang)) return 'css';
    if (isJsonLang(lang)) return 'json';
    if (isYamlLang(lang)) return 'yaml';
    if (isCsvLang(lang)) return 'csv';
    if (isOpenApiLang(lang)) return 'openapi';
    if (isChartLang(lang)) return 'chart';
    if (isPythonLang(lang)) return 'python';
    if (isSqlLang(lang)) return 'sql';
    return null;
  };

  const isCsvContent = (code) => {
    const lines = String(code || '').trim().split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return false;
    const delim = lines[0].includes('\t') && !lines[0].includes(',') ? '\t' : ',';
    const splitLines = lines.filter((l) => l.split(delim).length > 1);
    return splitLines.length >= 2;
  };

  const detectArtifactType = (lang, code) => {
    const trimmed = (code || '').trim();
    if (isOpenApiLang(lang) || isOpenApiContent(trimmed)) return 'openapi';
    if (isChartLang(lang) || isChartContent(trimmed)) return 'chart';

    const fromLang = artifactTypeFromLang(lang);
    if (fromLang) return fromLang;

    if (isMermaidContent(trimmed)) return 'mermaid';
    if (isGraphvizContent(trimmed)) return 'graphviz';
    if (/^<svg[\s>]/i.test(trimmed)) return 'svg';
    if (isCsvContent(trimmed)) return 'csv';
    if (/^\s*[\[{]/.test(trimmed)) {
      try {
        const parsed = JSON.parse(trimmed);
        if (isOpenApiSpec(parsed)) return 'openapi';
        return 'json';
      } catch { /* not json */ }
    }
    if (/^[\w-]+:\s*.+/m.test(trimmed) && !/<[a-z]/i.test(trimmed)) {
      if (isOpenApiContent(trimmed)) return 'openapi';
      return 'yaml';
    }
    if (/<[a-z][\w-]*[\s>]/i.test(trimmed) || /<!doctype\s+html/i.test(trimmed)) return 'html';
    return null;
  };

  const HTML_PREVIEW_HEAD = '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>';

  const wrapHtml = (source) => {
    const trimmed = (source || '').trim();
    if (!trimmed) return '';
    if (/<!doctype\s+html/i.test(trimmed) || /<html[\s>]/i.test(trimmed)) return trimmed;
    if (/<head[\s>]/i.test(trimmed)) {
      if (/<body[\s>]/i.test(trimmed)) return '<!DOCTYPE html><html>' + trimmed + '</html>';
      return '<!DOCTYPE html><html>' + trimmed + '<body></body></html>';
    }
    if (/<body[\s>]/i.test(trimmed)) {
      return '<!DOCTYPE html><html>' + HTML_PREVIEW_HEAD + trimmed + '</html>';
    }
    return '<!DOCTYPE html><html>' + HTML_PREVIEW_HEAD + '<body>' + trimmed + '</body></html>';
  };

  const CSS_DEMO_HTML = ''
    + '<div class="artifact-css-demo">'
    + '<h1>Heading</h1>'
    + '<p>Paragraph with <a href="#">link</a> and <strong>bold</strong> text.</p>'
    + '<button type="button">Button</button>'
    + '<div class="box"><span>Box</span></div>'
    + '<ul><li>List item 1</li><li>List item 2</li></ul>'
    + '</div>';

  const buildCssSrcdoc = (source, lang) => {
    const css = (source || '').trim();
    const isPreprocessor = /^(?:scss|sass|less)$/i.test((lang || '').trim());
    const notice = isPreprocessor
      ? '<p class="artifact-css-notice">Preprocessor syntax is shown as plain CSS (not compiled).</p>'
      : '';
    return '<!DOCTYPE html><html><head>'
      + '<meta charset="UTF-8">'
      + '<meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<style>'
      + '*,*::before,*::after{box-sizing:border-box}'
      + 'body{margin:0;padding:20px;font-family:system-ui,-apple-system,sans-serif;background:#fff;color:#111;line-height:1.5}'
      + '.artifact-css-notice{margin:0 0 16px;padding:10px 12px;border-radius:8px;background:#fffbeb;color:#92400e;font-size:13px;border:1px solid #fde68a}'
      + css
      + '</style>'
      + '</head><body>'
      + notice
      + CSS_DEMO_HTML
      + '</body></html>';
  };

  const prepareReactSource = (source) => {
    let code = String(source || '').trim();
    if (!code) return '';

    code = code.replace(/^\uFEFF/, '');
    code = code.replace(/^import\s+.+$/gm, '');
    code = code.replace(/^export\s+default\s+/gm, '');
    code = code.replace(/^export\s+/gm, '');

    if (/^</.test(code)) {
      code = 'function ArtifactPreview() {\n  return (\n' + code + '\n  );\n}';
      return code + '\n\nconst __artifactRoot = ReactDOM.createRoot(document.getElementById("root"));\n__artifactRoot.render(React.createElement(ArtifactPreview));';
    }

    const candidates = [];
    const fnRe = /function\s+([A-Z][A-Za-z0-9_]*)\s*\(/g;
    const constRe = /const\s+([A-Z][A-Za-z0-9_]*)\s*=/g;
    const classRe = /class\s+([A-Z][A-Za-z0-9_]*)/g;
    let match;
    while ((match = fnRe.exec(code))) candidates.push(match[1]);
    while ((match = constRe.exec(code))) candidates.push(match[1]);
    while ((match = classRe.exec(code))) candidates.push(match[1]);

    const componentName = candidates.includes('App')
      ? 'App'
      : (candidates[candidates.length - 1] || 'ArtifactPreview');

    if (!/\bcreateRoot\b/.test(code) && !/\bReactDOM\.render\b/.test(code)) {
      code += '\n\nconst __artifactRoot = ReactDOM.createRoot(document.getElementById("root"));\n'
        + '__artifactRoot.render(React.createElement(' + componentName + '));';
    }
    return code;
  };

  const usesTypeScript = (lang, source) =>
    (isReactLang(lang) && /^tsx$/i.test((lang || '').trim()))
    || /:\s*(?:string|number|boolean|void|any|never|unknown|React\.[A-Z]\w*)\b/.test(source || '');

  const buildReactBootScript = (source, lang) => {
    const code = prepareReactSource(source);
    const useTs = usesTypeScript(lang, source);
    const payload = JSON.stringify(code);
    return ''
      + 'function __artifactShowError(err){'
      + 'var root=document.getElementById("root");'
      + 'if(!root)return;'
      + 'var msg=err&&(err.stack||err.message)||String(err||"Unknown error");'
      + 'root.innerHTML=\'<pre class="artifact-error">\'+msg.replace(/</g,"&lt;")+"</pre>";'
      + '}'
      + 'function __artifactBoot(){'
      + 'if(!window.React||!window.ReactDOM||!window.Babel){'
      + '__artifactShowError("Không tải được React hoặc Babel. Kiểm tra kết nối mạng.");'
      + 'return;'
      + '}'
      + 'try{'
      + 'var useState=React.useState,useEffect=React.useEffect,useRef=React.useRef,'
      + 'useMemo=React.useMemo,useCallback=React.useCallback,useReducer=React.useReducer;'
      + 'var presets=[["react",{runtime:"classic",pragma:"React.createElement",pragmaFrag:"React.Fragment"}]];'
      + (useTs ? 'presets.unshift(["typescript",{isTSX:true,allExtensions:true}]);' : '')
      + 'var compiled=Babel.transform(' + payload + ',{presets:presets,sourceType:"script"}).code;'
      + 'new Function("React","ReactDOM","useState","useEffect","useRef","useMemo","useCallback","useReducer",compiled)'
      + '(React,ReactDOM,useState,useEffect,useRef,useMemo,useCallback,useReducer);'
      + '}catch(err){__artifactShowError(err);}'
      + '}'
      + 'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",__artifactBoot);'
      + 'else __artifactBoot();';
  };

  const buildReactSrcdoc = (source, lang) => {
    const bootScript = buildReactBootScript(source, lang);
    return '<!DOCTYPE html><html><head>'
      + '<meta charset="UTF-8">'
      + '<meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<style>'
      + '*,*::before,*::after{box-sizing:border-box}'
      + 'html,body{margin:0;height:100%}'
      + 'body{font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#111}'
      + '#root{min-height:100%}'
      + '.artifact-error{margin:16px;padding:12px 14px;border-radius:8px;background:#fef2f2;color:#b91c1c;font:13px/1.5 ui-monospace,Menlo,monospace;white-space:pre-wrap;overflow:auto}'
      + '</style>'
      + '</head><body>'
      + '<div id="root"></div>'
      + '<script src="https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.development.js"><\/script>'
      + '<script src="https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.development.js"><\/script>'
      + '<script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7.26.9/babel.min.js"><\/script>'
      + '<script>' + bootScript + '<\/script>'
      + '</body></html>';
  };

  const parseVueSfc = (source) => {
    const code = String(source || '');
    const templateMatch = code.match(/<template[^>]*>([\s\S]*?)<\/template>/i);
    const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    return {
      template: templateMatch ? templateMatch[1].trim() : '',
      script: scriptMatch ? scriptMatch[1].trim() : '',
      style: styleMatch ? styleMatch[1].trim() : ''
    };
  };

  const prepareVueComponent = (source) => {
    const raw = String(source || '').trim();
    if (!raw) return { template: '<div></div>', script: '{}', style: '' };

    const sfc = parseVueSfc(raw);
    if (sfc.template || sfc.script || sfc.style) {
      let script = sfc.script
        .replace(/^\uFEFF/, '')
        .replace(/^import\s+.+$/gm, '')
        .replace(/export\s+default\s+/g, '')
        .trim();
      if (!script) script = '{}';
      return { template: sfc.template, script, style: sfc.style };
    }

    let code = raw.replace(/^\uFEFF/, '').replace(/^import\s+.+$/gm, '');
    if (/export\s+default/.test(code)) {
      code = code.replace(/export\s+default\s+/g, '').trim();
      return { template: '', script: code, style: '' };
    }
    if (/^</.test(code)) return { template: code, script: '{}', style: '' };
    if (/^(?:const|let|var)\s+\w+\s*=/.test(code) || /data\s*\(/.test(code)) {
      return { template: '', script: code, style: '' };
    }
    return { template: '<div>' + escapeHTML(code) + '</div>', script: '{}', style: '' };
  };

  const buildVueBootScript = (source) => {
    const parts = prepareVueComponent(source);
    const payload = JSON.stringify(parts);
    return ''
      + 'function __artifactShowError(err){'
      + 'var root=document.getElementById("app");'
      + 'if(!root)return;'
      + 'var msg=err&&(err.stack||err.message)||String(err||"Unknown error");'
      + 'root.innerHTML=\'<pre class="artifact-error">\'+msg.replace(/</g,"&lt;")+"</pre>";'
      + '}'
      + 'function __artifactBoot(){'
      + 'if(!window.Vue){__artifactShowError("Failed to load Vue. Check network connection.");return;}'
      + 'try{'
      + 'var parts=' + payload + ';'
      + 'var component={};'
      + 'if(parts.script){'
      + 'var body=parts.script.trim();'
      + 'var expr=body.charAt(0)==="{"?"("+body+")":body;'
      + 'component=new Function("Vue","return "+expr)(Vue)||{};'
      + '}'
      + 'if(typeof component!=="object"||!component)component={};'
      + 'if(parts.template&&!component.template)component.template=parts.template;'
      + 'if(!component.template)component.template=\'<div style="color:#666;padding:16px">No template</div>\';'
      + 'if(parts.style){var st=document.createElement("style");st.textContent=parts.style;document.head.appendChild(st);}'
      + 'Vue.createApp(component).mount("#app");'
      + '}catch(err){__artifactShowError(err);}'
      + '}'
      + 'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",__artifactBoot);'
      + 'else __artifactBoot();';
  };

  const buildVueSrcdoc = (source) => {
    const bootScript = buildVueBootScript(source);
    return '<!DOCTYPE html><html><head>'
      + '<meta charset="UTF-8">'
      + '<meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<style>'
      + '*,*::before,*::after{box-sizing:border-box}'
      + 'html,body{margin:0;height:100%}'
      + 'body{font-family:system-ui,-apple-system,sans-serif;background:#fff;color:#111}'
      + '#app{min-height:100%}'
      + '.artifact-error{margin:16px;padding:12px 14px;border-radius:8px;background:#fef2f2;color:#b91c1c;font:13px/1.5 ui-monospace,Menlo,monospace;white-space:pre-wrap;overflow:auto}'
      + '</style>'
      + '</head><body>'
      + '<div id="app"></div>'
      + '<script src="https://cdn.jsdelivr.net/npm/vue@3.5.13/dist/vue.global.js"><\/script>'
      + '<script>' + bootScript + '<\/script>'
      + '</body></html>';
  };

  const buildSvelteBootModule = (source) => {
    const payload = JSON.stringify(String(source || '').trim());
    return ''
      + 'const __showErr=(e)=>{document.getElementById("app").innerHTML=\'<pre class="artifact-error">\'+String(e&&(e.stack||e.message)||e).replace(/</g,"&lt;")+"</pre>";};'
      + 'try{'
      + 'const { compile } = await import("https://cdn.jsdelivr.net/npm/svelte@4.2.19/compiler.mjs");'
      + 'const source=' + payload + ';'
      + 'const result=compile(source,{generate:"dom",css:"injected",dev:true});'
      + 'if(result.css?.code){const el=document.createElement("style");el.textContent=result.css.code;document.head.appendChild(el);}'
      + 'let code=result.js.code.replace(/export\\s+default\\s+class\\s+(\\w+)/,"class $1");'
      + 'code+="\\nnew "+(code.match(/class\\s+(\\w+)/)?.[1]||"App")+"({target:document.getElementById(\'app\')});";'
      + 'const blob=new Blob([code],{type:"text/javascript"});'
      + 'const url=URL.createObjectURL(blob);'
      + 'await import(url);'
      + 'URL.revokeObjectURL(url);'
      + '}catch(e){__showErr(e);}';
  };

  const buildSvelteSrcdoc = (source) => {
    const bootModule = buildSvelteBootModule(source);
    return '<!DOCTYPE html><html><head>'
      + '<meta charset="UTF-8">'
      + '<meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<script type="importmap">'
      + '{"imports":{"svelte":"https://cdn.jsdelivr.net/npm/svelte@4.2.19/src/runtime/index.js","svelte/":"https://cdn.jsdelivr.net/npm/svelte@4.2.19/src/runtime/","svelte/internal":"https://cdn.jsdelivr.net/npm/svelte@4.2.19/src/runtime/internal/index.js","svelte/internal/disclose-version":"https://cdn.jsdelivr.net/npm/svelte@4.2.19/src/runtime/internal/disclose-version/index.js"}}'
      + '<\/script>'
      + '<style>'
      + '*,*::before,*::after{box-sizing:border-box}'
      + 'html,body{margin:0;height:100%}'
      + 'body{font-family:system-ui,-apple-system,sans-serif;background:#fff;color:#111}'
      + '#app{min-height:100%}'
      + '.artifact-error{margin:16px;padding:12px 14px;border-radius:8px;background:#fef2f2;color:#b91c1c;font:13px/1.5 ui-monospace,Menlo,monospace;white-space:pre-wrap;overflow:auto}'
      + '</style>'
      + '</head><body>'
      + '<div id="app"></div>'
      + '<script type="module">' + bootModule + '<\/script>'
      + '</body></html>';
  };

  const buildSvgSrcdoc = (source) => {
    const trimmed = (source || '').trim();
    if (!trimmed) return '';
    const svg = /^<svg[\s>]/i.test(trimmed) ? trimmed : '<svg xmlns="http://www.w3.org/2000/svg">' + trimmed + '</svg>';
    return '<!DOCTYPE html><html>'
      + HTML_PREVIEW_HEAD
      + '<body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff;padding:16px">'
      + svg
      + '</body></html>';
  };

  const buildSrcdoc = (source, type, lang = '') => {
    switch (type) {
      case 'react':
        return buildReactSrcdoc(source, lang);
      case 'vue':
        return buildVueSrcdoc(source);
      case 'svelte':
        return buildSvelteSrcdoc(source);
      case 'svg':
        return buildSvgSrcdoc(source);
      case 'css':
        return buildCssSrcdoc(source, lang);
      case 'chart':
        return buildChartSrcdoc(source, lang);
      case 'python':
        return buildPythonSrcdoc(source);
      case 'html':
      default:
        return wrapHtml(source);
    }
  };

  const isOpenApiSpec = (obj) => !!(obj && (obj.openapi || obj.swagger) && obj.paths);

  const isOpenApiContent = (code) => {
    const trimmed = String(code || '').trim();
    if (!trimmed) return false;
    if ((/["']openapi["']\s*:/.test(trimmed) || /["']swagger["']\s*:/.test(trimmed)) && /paths\s*:/.test(trimmed)) {
      return true;
    }
    try {
      return isOpenApiSpec(parseOpenApiSpec(trimmed, ''));
    } catch {
      return false;
    }
  };

  const isChartContent = (code) => {
    const s = String(code || '');
    if (/echarts\.init\s*\(/.test(s)) return true;
    if (/new\s+Chart\s*\(/.test(s)) return true;
    if (/\boption\s*=\s*\{[\s\S]*\bseries\b/.test(s)) return true;
    try {
      const o = JSON.parse(s.trim());
      if (o && (o.series || o.xAxis || o.yAxis)) return true;
      if (o && o.type && o.data) return true;
    } catch { /* not json chart */ }
    return false;
  };

  const parseOpenApiSpec = (source, lang) => {
    const trimmed = String(source || '').trim();
    if (!trimmed) throw new Error('Empty OpenAPI spec');
    const useYaml = /^(?:ya?ml|openapi|swagger|oas)$/i.test((lang || '').trim())
      || (!trimmed.startsWith('{') && !trimmed.startsWith('[') && /^[\w-]+\s*:/m.test(trimmed));
    if (useYaml) {
      if (!window.jsyaml?.load) throw new Error('YAML parser not loaded');
      return window.jsyaml.load(trimmed);
    }
    return JSON.parse(trimmed);
  };

  const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'];

  const schemaTypeLabel = (schema) => {
    if (!schema || typeof schema !== 'object') return 'any';
    if (schema.$ref) return schema.$ref.split('/').pop();
    if (schema.type) {
      if (schema.type === 'array' && schema.items) {
        return 'array<' + schemaTypeLabel(schema.items) + '>';
      }
      return String(schema.type);
    }
    if (schema.allOf) return 'allOf';
    if (schema.oneOf) return 'oneOf';
    if (schema.anyOf) return 'anyOf';
    return 'object';
  };

  const renderSchemaBlock = (schema, title) => {
    if (!schema) return '';
    let html = '<div class="openapi-schema">';
    if (title) html += '<div class="openapi-schema-title">' + escapeHTML(title) + '</div>';
    if (schema.description) html += '<p class="openapi-schema-desc">' + escapeHTML(schema.description) + '</p>';
    if (schema.properties) {
      html += '<ul class="openapi-schema-props">';
      Object.entries(schema.properties).forEach(([name, prop]) => {
        const req = Array.isArray(schema.required) && schema.required.includes(name);
        html += '<li><code>' + escapeHTML(name) + '</code>'
          + (req ? ' <span class="openapi-required">required</span>' : '')
          + ' <span class="openapi-type">' + escapeHTML(schemaTypeLabel(prop)) + '</span>'
          + (prop.description ? ' — ' + escapeHTML(prop.description) : '')
          + '</li>';
      });
      html += '</ul>';
    } else {
      html += '<code class="openapi-type">' + escapeHTML(schemaTypeLabel(schema)) + '</code>';
    }
    html += '</div>';
    return html;
  };

  const renderParameters = (params) => {
    if (!Array.isArray(params) || !params.length) return '';
    let html = '<table class="openapi-params"><thead><tr><th>Name</th><th>In</th><th>Type</th><th>Description</th></tr></thead><tbody>';
    params.forEach((p) => {
      html += '<tr>'
        + '<td><code>' + escapeHTML(p.name || '') + '</code>' + (p.required ? ' <span class="openapi-required">*</span>' : '') + '</td>'
        + '<td>' + escapeHTML(p.in || '') + '</td>'
        + '<td>' + escapeHTML(schemaTypeLabel(p.schema || { type: p.type })) + '</td>'
        + '<td>' + escapeHTML(p.description || '') + '</td>'
        + '</tr>';
    });
    html += '</tbody></table>';
    return html;
  };

  const buildOpenApiDocHtml = (source, lang) => {
    try {
      const spec = parseOpenApiSpec(source, lang);
      if (!isOpenApiSpec(spec)) throw new Error('Not a valid OpenAPI/Swagger spec (missing paths)');

      const info = spec.info || {};
      const title = info.title || 'API';
      const version = info.version || spec.openapi || spec.swagger || '';
      const desc = info.description || '';

      let serversHtml = '';
      if (Array.isArray(spec.servers) && spec.servers.length) {
        serversHtml = '<section class="openapi-servers"><h2>Servers</h2><ul>';
        spec.servers.forEach((s) => {
          serversHtml += '<li><code>' + escapeHTML(s.url || '') + '</code>'
            + (s.description ? ' — ' + escapeHTML(s.description) : '') + '</li>';
        });
        serversHtml += '</ul></section>';
      }

      const tagMap = {};
      if (Array.isArray(spec.tags)) {
        spec.tags.forEach((t) => { tagMap[t.name] = t.description || ''; });
      }

      const groups = {};
      Object.entries(spec.paths || {}).forEach(([path, pathItem]) => {
        if (!pathItem || typeof pathItem !== 'object') return;
        HTTP_METHODS.forEach((method) => {
          const op = pathItem[method];
          if (!op) return;
          const tag = (op.tags && op.tags[0]) || 'default';
          if (!groups[tag]) groups[tag] = [];
          groups[tag].push({ method, path, op });
        });
      });

      let pathsHtml = '<section class="openapi-paths">';
      Object.keys(groups).sort().forEach((tag) => {
        pathsHtml += '<div class="openapi-tag-group">';
        pathsHtml += '<h2 class="openapi-tag-title">' + escapeHTML(tag) + '</h2>';
        if (tagMap[tag]) pathsHtml += '<p class="openapi-tag-desc">' + escapeHTML(tagMap[tag]) + '</p>';
        groups[tag].forEach(({ method, path, op }) => {
          const opId = 'op-' + Math.random().toString(36).slice(2, 9);
          pathsHtml += '<article class="openapi-operation">'
            + '<button type="button" class="openapi-op-toggle" aria-expanded="false" aria-controls="' + opId + '">'
            + '<span class="openapi-method openapi-method-' + method + '">' + method.toUpperCase() + '</span>'
            + '<code class="openapi-path">' + escapeHTML(path) + '</code>'
            + (op.summary ? '<span class="openapi-summary">' + escapeHTML(op.summary) + '</span>' : '')
            + '<i class="fa-solid fa-chevron-down openapi-op-chevron" aria-hidden="true"></i>'
            + '</button>'
            + '<div class="openapi-op-body hidden" id="' + opId + '">';
          if (op.description) pathsHtml += '<p class="openapi-op-desc">' + escapeHTML(op.description) + '</p>';
          if (op.parameters) pathsHtml += '<div class="openapi-section"><h4>Parameters</h4>' + renderParameters(op.parameters) + '</div>';
          if (op.requestBody) {
            pathsHtml += '<div class="openapi-section"><h4>Request body</h4>';
            const content = op.requestBody.content || {};
            Object.entries(content).forEach(([mime, body]) => {
              pathsHtml += '<div class="openapi-mime">' + escapeHTML(mime) + renderSchemaBlock(body.schema, '') + '</div>';
            });
            pathsHtml += '</div>';
          }
          if (op.responses) {
            pathsHtml += '<div class="openapi-section"><h4>Responses</h4><ul class="openapi-responses">';
            Object.entries(op.responses).forEach(([code, resp]) => {
              pathsHtml += '<li><code>' + escapeHTML(code) + '</code> — ' + escapeHTML(resp.description || '');
              const content = resp.content || {};
              Object.entries(content).forEach(([mime, body]) => {
                pathsHtml += renderSchemaBlock(body.schema, mime);
              });
              pathsHtml += '</li>';
            });
            pathsHtml += '</ul></div>';
          }
          pathsHtml += '</div></article>';
        });
        pathsHtml += '</div>';
      });
      pathsHtml += '</section>';

      const opCount = Object.values(groups).reduce((n, arr) => n + arr.length, 0);
      return ''
        + '<div class="openapi-doc">'
        + '<header class="openapi-doc-header">'
        + '<h1>' + escapeHTML(title) + '</h1>'
        + (version ? '<span class="openapi-version">' + escapeHTML(String(version)) + '</span>' : '')
        + '<p class="openapi-meta">' + opCount + ' operations · ' + Object.keys(spec.paths || {}).length + ' paths</p>'
        + (desc ? '<p class="openapi-desc">' + escapeHTML(desc) + '</p>' : '')
        + '</header>'
        + serversHtml
        + pathsHtml
        + '</div>';
    } catch (err) {
      return '<pre class="artifact-error">' + escapeHTML(err.message || String(err)) + '</pre>';
    }
  };

  const bindOpenApiDocToggles = (root) => {
    if (!root) return;
    root.querySelectorAll('.openapi-op-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const body = document.getElementById(btn.getAttribute('aria-controls') || '');
        if (!body) return;
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        const next = !expanded;
        btn.setAttribute('aria-expanded', String(next));
        body.classList.toggle('hidden', !next);
        const icon = btn.querySelector('.openapi-op-chevron');
        if (icon) icon.className = 'fa-solid fa-chevron-' + (next ? 'up' : 'down') + ' openapi-op-chevron';
      });
    });
  };

  const detectChartEngine = (source, lang) => {
    const l = (lang || '').trim().toLowerCase();
    if (l === 'echarts') return 'echarts';
    if (l === 'chartjs' || l === 'chart') return 'chartjs';
    const s = String(source || '');
    if (/echarts\.init/.test(s) || /\bseries\s*:\s*\[/.test(s)) return 'echarts';
    try {
      const o = JSON.parse(s.trim());
      if (o && (o.series || o.xAxis || o.yAxis)) return 'echarts';
      if (o && o.type && o.data) return 'chartjs';
    } catch { /* not json */ }
    return 'chartjs';
  };

  const prepareChartCode = (source, engine) => {
    const code = String(source || '').trim();
    if (!code) return '';
    if (engine === 'echarts') {
      if (/echarts\.init/.test(code)) return code;
      if (/^(?:const|let|var)\s+option\s*=/.test(code)) {
        return code + '\nvar __chart = echarts.init(document.getElementById("chart"));\n__chart.setOption(option);';
      }
      try {
        const opt = JSON.parse(code);
        return 'echarts.init(document.getElementById("chart")).setOption(' + JSON.stringify(opt) + ');';
      } catch {
        return 'echarts.init(document.getElementById("chart")).setOption(' + code + ');';
      }
    }
    if (/new\s+Chart\s*\(/.test(code)) return code;
    try {
      const cfg = JSON.parse(code);
      return 'new Chart(document.getElementById("chart"), ' + JSON.stringify(cfg) + ');';
    } catch {
      return code;
    }
  };

  const buildChartBootScript = (source, lang) => {
    const engine = detectChartEngine(source, lang);
    const userCode = prepareChartCode(source, engine);
    const payload = JSON.stringify(userCode);
    return ''
      + 'function __artifactShowError(err){'
      + 'var root=document.getElementById("chart-wrap");'
      + 'if(root)root.innerHTML=\'<pre class="artifact-error">\'+String(err&&(err.stack||err.message)||err).replace(/</g,"&lt;")+"</pre>";'
      + '}'
      + 'function __artifactBoot(){'
      + 'try{'
      + (engine === 'echarts' ? 'if(!window.echarts)throw new Error("ECharts not loaded");' : 'if(!window.Chart)throw new Error("Chart.js not loaded");')
      + 'new Function(' + payload + ')();'
      + 'window.addEventListener("resize",function(){'
      + (engine === 'echarts' ? 'var c=echarts.getInstanceByDom(document.getElementById("chart"));if(c)c.resize();' : '')
      + '});'
      + '}catch(err){__artifactShowError(err);}'
      + '}'
      + 'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",__artifactBoot);'
      + 'else __artifactBoot();';
  };

  const buildChartSrcdoc = (source, lang) => {
    const engine = detectChartEngine(source, lang);
    const bootScript = buildChartBootScript(source, lang);
    const chartLib = engine === 'echarts'
      ? '<script src="https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.min.js"><\/script>'
      : '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js"><\/script>';
    const chartEl = engine === 'echarts'
      ? '<div id="chart" style="width:100%;height:360px"></div>'
      : '<canvas id="chart"></canvas>';
    return '<!DOCTYPE html><html><head>'
      + '<meta charset="UTF-8">'
      + '<meta name="viewport" content="width=device-width,initial-scale=1">'
      + chartLib
      + '<style>'
      + '*,*::before,*::after{box-sizing:border-box}'
      + 'body{margin:0;padding:16px;font-family:system-ui,sans-serif;background:#fff}'
      + '#chart-wrap{min-height:320px}'
      + '#chart{max-width:100%}'
      + '.artifact-error{margin:16px;padding:12px 14px;border-radius:8px;background:#fef2f2;color:#b91c1c;font:13px/1.5 ui-monospace,Menlo,monospace;white-space:pre-wrap}'
      + '</style>'
      + '</head><body>'
      + '<div id="chart-wrap">' + chartEl + '</div>'
      + '<script>' + bootScript + '<\/script>'
      + '</body></html>';
  };

  const buildPythonSrcdoc = (source) => {
    const code = JSON.stringify(String(source || ''));
    const boot = ''
      + 'async function __artifactRun(){'
      + 'var out=document.getElementById("py-out");'
      + 'var status=document.getElementById("py-status");'
      + 'try{'
      + 'status.textContent="Loading Pyodide (~10MB)...";'
      + 'var pyodide=await loadPyodide({indexURL:"https://cdn.jsdelivr.net/pyodide/v0.26.4/full/"});'
      + 'status.textContent="Running...";'
      + 'var buffer="";'
      + 'var append=function(msg){buffer+=msg+"\\n";out.textContent=buffer;};'
      + 'pyodide.setStdout({batched:append});'
      + 'pyodide.setStderr({batched:append});'
      + 'await pyodide.runPythonAsync(' + code + ');'
      + 'status.textContent="Done";'
      + 'if(!buffer)out.textContent="(no output)";'
      + '}catch(e){'
      + 'status.textContent="Error";'
      + 'out.textContent=(e&&e.message)||String(e);'
      + 'out.classList.add("has-error");'
      + '}'
      + '}'
      + '__artifactRun();';
    return '<!DOCTYPE html><html><head>'
      + '<meta charset="UTF-8">'
      + '<meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<script src="https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js"><\/script>'
      + '<style>'
      + '*,*::before,*::after{box-sizing:border-box}'
      + 'body{margin:0;padding:16px;font:13px/1.5 ui-monospace,Menlo,monospace;background:#1e1e1e;color:#d4d4d4}'
      + '#py-status{font:12px system-ui,sans-serif;color:#888;margin-bottom:10px}'
      + '#py-out{margin:0;white-space:pre-wrap;word-break:break-word;min-height:80px}'
      + '#py-out.has-error{color:#f87171}'
      + '</style>'
      + '</head><body>'
      + '<div id="py-status">Initializing...</div>'
      + '<pre id="py-out"></pre>'
      + '<script>' + boot + '<\/script>'
      + '</body></html>';
  };

  const parseJson = (source) => {
    const trimmed = (source || '').trim();
    if (!trimmed) throw new Error('Empty JSON');
    return JSON.parse(trimmed);
  };

  const parseYaml = (source) => {
    const trimmed = (source || '').trim();
    if (!trimmed) throw new Error('Empty YAML');
    if (!window.jsyaml?.load) throw new Error('YAML parser not loaded');
    return window.jsyaml.load(trimmed);
  };

  const jsonPrimitiveHtml = (value) => {
    if (value === null) return '<span class="json-tree-null">null</span>';
    if (value === undefined) return '<span class="json-tree-null">undefined</span>';
    if (typeof value === 'boolean') return '<span class="json-tree-bool">' + value + '</span>';
    if (typeof value === 'number') return '<span class="json-tree-num">' + value + '</span>';
    if (typeof value === 'string') return '<span class="json-tree-str">"' + escapeHTML(value) + '"</span>';
    return '<span class="json-tree-unknown">' + escapeHTML(String(value)) + '</span>';
  };

  const jsonTreeNode = (value, keyLabel, depth = 0) => {
    const keyHtml = keyLabel != null
      ? '<span class="json-tree-key">' + escapeHTML(String(keyLabel)) + '</span><span class="json-tree-colon">: </span>'
      : '';

    if (value !== null && typeof value === 'object') {
      const isArray = Array.isArray(value);
      const entries = isArray ? value.map((v, i) => [i, v]) : Object.entries(value);
      const open = isArray ? '[' : '{';
      const close = isArray ? ']' : '}';
      const empty = entries.length === 0;
      const id = 'jt-' + Math.random().toString(36).slice(2, 9);

      if (empty) {
        return '<div class="json-tree-line">' + keyHtml + '<span class="json-tree-bracket">' + open + close + '</span></div>';
      }

      let children = '';
      entries.forEach(([k, v]) => {
        children += jsonTreeNode(v, isArray ? null : k, depth + 1);
      });

      return ''
        + '<div class="json-tree-node' + (depth > 0 ? ' json-tree-node-nested' : '') + '">'
        + '<div class="json-tree-line json-tree-line-toggle">'
        + '<button type="button" class="json-tree-toggle" aria-expanded="true" aria-controls="' + id + '" title="Thu gọn/Mở rộng">'
        + '<i class="fa-solid fa-caret-down" aria-hidden="true"></i>'
        + '</button>'
        + keyHtml
        + '<span class="json-tree-bracket">' + open + '</span>'
        + '<span class="json-tree-meta">' + entries.length + (isArray ? ' items' : ' keys') + '</span>'
        + '</div>'
        + '<div class="json-tree-children" id="' + id + '">' + children + '</div>'
        + '<div class="json-tree-line json-tree-line-close"><span class="json-tree-bracket">' + close + '</span></div>'
        + '</div>';
    }

    return '<div class="json-tree-line json-tree-line-leaf">' + keyHtml + jsonPrimitiveHtml(value) + '</div>';
  };

  const buildJsonTreeHtml = (source) => {
    try {
      const data = parseJson(source);
      const body = jsonTreeNode(data, null);
      return '<div class="json-tree-root">' + body + '</div>';
    } catch (err) {
      return '<pre class="artifact-error">' + escapeHTML(err.message || String(err)) + '</pre>';
    }
  };

  const buildYamlTreeHtml = (source) => {
    try {
      const data = parseYaml(source);
      if (data !== null && typeof data === 'object') {
        return '<div class="json-tree-root yaml-tree-root">' + jsonTreeNode(data, 'root') + '</div>';
      }
      return '<div class="json-tree-root yaml-tree-root"><div class="json-tree-line">' + jsonPrimitiveHtml(data) + '</div></div>';
    } catch (err) {
      return '<pre class="artifact-error">' + escapeHTML(err.message || String(err)) + '</pre>';
    }
  };

  const buildDomHtml = (source, type, lang = '') => {
    switch (type) {
      case 'json':
        return buildJsonTreeHtml(source);
      case 'yaml':
        return buildYamlTreeHtml(source);
      case 'csv':
        return buildCsvTableHtml(source, lang);
      case 'openapi':
        return buildOpenApiDocHtml(source, lang);
      default:
        return '';
    }
  };

  const detectCsvDelimiter = (text, lang) => {
    if (/^tsv$/i.test((lang || '').trim())) return '\t';
    const sample = String(text || '').split(/\r?\n/).slice(0, 5).join('\n');
    const tabs = (sample.match(/\t/g) || []).length;
    const commas = (sample.match(/,/g) || []).length;
    if (tabs > commas) return '\t';
    return ',';
  };

  const parseCsvRows = (text, delimiter) => {
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;
    const src = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      const next = src[i + 1];
      if (inQuotes) {
        if (ch === '"' && next === '"') {
          cell += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cell += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        row.push(cell);
        cell = '';
      } else if (ch === '\n') {
        row.push(cell);
        if (row.some((c) => c.trim() !== '')) rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += ch;
      }
    }
    if (cell.length || row.length) {
      row.push(cell);
      if (row.some((c) => c.trim() !== '')) rows.push(row);
    }
    return rows;
  };

  const buildCsvTableHtml = (source, lang) => {
    try {
      const delimiter = detectCsvDelimiter(source, lang);
      const rows = parseCsvRows(source, delimiter);
      if (!rows.length) throw new Error('Empty CSV');
      const header = rows[0];
      const bodyRows = rows.slice(1);
      let thead = '<thead><tr>';
      header.forEach((col, i) => {
        thead += '<th scope="col" data-col="' + i + '">' + escapeHTML(col) + '<span class="csv-sort-icon" aria-hidden="true"></span></th>';
      });
      thead += '</tr></thead>';
      let tbody = '<tbody>';
      bodyRows.forEach((cells) => {
        tbody += '<tr>';
        header.forEach((_, i) => {
          tbody += '<td>' + escapeHTML(cells[i] ?? '') + '</td>';
        });
        tbody += '</tr>';
      });
      tbody += '</tbody>';
      return ''
        + '<div class="csv-preview-wrap">'
        + '<div class="csv-preview-meta">' + bodyRows.length + ' rows · ' + header.length + ' columns</div>'
        + '<div class="csv-preview-scroll"><table class="csv-preview-table">' + thead + tbody + '</table></div>'
        + '</div>';
    } catch (err) {
      return '<pre class="artifact-error">' + escapeHTML(err.message || String(err)) + '</pre>';
    }
  };

  const bindCsvTableSort = (root) => {
    if (!root) return;
    const table = root.querySelector('.csv-preview-table');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    const headers = table.querySelectorAll('thead th');
    headers.forEach((th) => {
      th.style.cursor = 'pointer';
      th.addEventListener('click', () => {
        const col = Number(th.dataset.col);
        const current = th.dataset.sort || 'none';
        const next = current === 'asc' ? 'desc' : 'asc';
        headers.forEach((h) => {
          h.dataset.sort = 'none';
          h.classList.remove('is-sorted-asc', 'is-sorted-desc');
        });
        th.dataset.sort = next;
        th.classList.add(next === 'asc' ? 'is-sorted-asc' : 'is-sorted-desc');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        rows.sort((a, b) => {
          const av = (a.children[col]?.textContent || '').trim();
          const bv = (b.children[col]?.textContent || '').trim();
          const an = Number(av);
          const bn = Number(bv);
          let cmp;
          if (!Number.isNaN(an) && !Number.isNaN(bn) && av !== '' && bv !== '') cmp = an - bn;
          else cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
          return next === 'asc' ? cmp : -cmp;
        });
        rows.forEach((r) => tbody.appendChild(r));
      });
    });
  };

  let vizLoadPromise = null;

  const loadViz = () => {
    if (window.Viz) return Promise.resolve(window.Viz);
    if (vizLoadPromise) return vizLoadPromise;
    vizLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@viz-js/viz@3.11.0/lib/viz-standalone.js';
      script.onload = () => resolve(window.Viz);
      script.onerror = () => reject(new Error('Failed to load Graphviz'));
      document.head.appendChild(script);
    });
    return vizLoadPromise;
  };

  const normalizeGraphvizSource = (source) => {
    let src = String(source || '').replace(/\r\n/g, '\n').trim();
    src = src.replace(/^```(?:\w+)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
    return src.trim();
  };

  const renderGraphvizPreview = async (container, source) => {
    if (!container) return;
    container.innerHTML = '<div class="graphviz-preview-loading"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i></div>';
    try {
      const Viz = await loadViz();
      const viz = await Viz.instance();
      const dot = normalizeGraphvizSource(source);
      const svg = viz.renderSVGElement(dot);
      const wrap = document.createElement('div');
      wrap.className = 'graphviz-preview-view';
      wrap.appendChild(svg);
      container.innerHTML = '';
      container.appendChild(wrap);
    } catch (err) {
      container.innerHTML = '<pre class="artifact-error">' + escapeHTML(err.message || String(err)) + '</pre>';
    }
  };

  const bindJsonTreeToggles = (root) => {
    if (!root) return;
    root.querySelectorAll('.json-tree-toggle').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const node = btn.closest('.json-tree-node');
        if (!node) return;
        const expanded = btn.getAttribute('aria-expanded') !== 'false';
        const next = !expanded;
        btn.setAttribute('aria-expanded', String(next));
        node.classList.toggle('is-collapsed', !next);
        const icon = btn.querySelector('i');
        if (icon) icon.className = next ? 'fa-solid fa-caret-down' : 'fa-solid fa-caret-right';
      });
    });
  };

  const renderSqlPreview = (container, source) =>
    window.SqlPreview?.renderSqlPreview?.(container, source) ?? Promise.resolve();

  const openInNewTab = (srcdoc) => {
    const blob = new Blob([srcdoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const tab = window.open(url, '_blank', 'noopener,noreferrer');
    if (tab) {
      tab.addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } else {
      URL.revokeObjectURL(url);
    }
    return !!tab;
  };

  return {
    isHtmlLang,
    isReactLang,
    isSvgLang,
    isCssLang,
    isJsonLang,
    isYamlLang,
    isVueLang,
    isSvelteLang,
    isGraphvizLang,
    isCsvLang,
    isOpenApiLang,
    isChartLang,
    isPythonLang,
    isSqlLang,
    isMermaidLang,
    isMermaidContent,
    isGraphvizContent,
    isOpenApiContent,
    isChartContent,
    isArtifactLang,
    isIframeArtifact,
    isDomArtifact,
    artifactTypeFromLang,
    detectArtifactType,
    buildSrcdoc,
    buildDomHtml,
    bindJsonTreeToggles,
    bindCsvTableSort,
    bindOpenApiDocToggles,
    renderGraphvizPreview,
    renderSqlPreview,
    openInNewTab
  };
})();
