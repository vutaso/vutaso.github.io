window.Markdown = (() => {
  const { escapeHTML } = window.Utils;

  const ensure = () => {
    if (!window.marked) return;
    const renderer = new window.marked.Renderer();

    renderer.code = (code, infostring) => {
      const lang = (infostring || '').match(/\S*/)[0];
      const validLang = lang && window.hljs && window.hljs.getLanguage(lang) ? lang : '';
      let html;
      if (validLang && window.hljs) {
        try {
          html = window.hljs.highlight(code, { language: validLang, ignoreIllegals: true }).value;
        } catch (e) {
          html = escapeHTML(code);
        }
      } else {
        html = escapeHTML(code);
      }
      const label = validLang || '';
      return '<pre><div class="pre-header"><span class="lang">' + label + '</span><button type="button" class="copy-code-btn" data-copy-code>&#128203; Sao ch&#233;p</button></div><code class="hljs' + (validLang ? ' language-' + validLang : '') + '">' + html + '</code></pre>';
    };

    window.marked.setOptions({ renderer, breaks: true, gfm: true });
  };

  const render = (text) => {
    if (!window.marked) return '';
    try {
      return window.marked.parse(text || '');
    } catch {
      return '<p>' + escapeHTML(text || '') + '</p>';
    }
  };

  const init = () => ensure();

  return { init, render };
})();
