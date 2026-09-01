(() => {
  const core = window.DevToolsCore;
  if (!core) return;
  const MAX_DOC_CHARS = core.MAX_DOC_CHARS;
  const JF_CHUNK = 240;
  const t = (key, vars) => (window.DevToolsI18n ? DevToolsI18n.t(key, vars) : key);

  const workspace = document.querySelector("#workspace");
  const stats = document.querySelector("#stats");
  const toastEl = document.querySelector("#toast");
  const tablist = document.querySelector("#toolTabs");
  const tabs = Array.from(document.querySelectorAll(".tab-btn"));
  const jsonInput = document.querySelector("#jsonInput");
  const jsonOutput = document.querySelector("#jsonOutput");
  const jsonOutputWrap = document.querySelector("#jsonOutputWrap");
  const jsonTree = document.querySelector("#jsonTree");
  const btnJsonParsed = document.querySelector("#btnJsonParsed");
  const btnJsonRaw = document.querySelector("#btnJsonRaw");
  const b64Input = document.querySelector("#b64Input");
  const b64Output = document.querySelector("#b64Output");
  const hashInput = document.querySelector("#hashInput");
  const hashMd5 = document.querySelector("#hashMd5");
  const hashSha256 = document.querySelector("#hashSha256");
  const hashOutput = document.querySelector("#hashOutput");

  const toolbars = {
    json: document.querySelector("#toolbarJson"),
    base64: document.querySelector("#toolbarBase64"),
    hash: document.querySelector("#toolbarHash"),
  };
  const inputs = { json: jsonInput, base64: b64Input, hash: hashInput };
  const outputs = { json: jsonOutputWrap, base64: b64Output, hash: hashOutput };

  let toastTimer = 0;
  let hashTimer = 0;
  let sizeWarned = false;
  let currentTool = "json";
  let jsonGen = 0;
  let hasParsed = false;
  let parsedJson;
  let jsonFetchSeq = 0;
  const jfData = new WeakMap();

  function showToast(message, isError) {
    toastEl.textContent = message;
    toastEl.classList.toggle("error", !!isError);
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 2400);
  }

  function hideToast() {
    toastEl.classList.remove("is-on");
    clearTimeout(toastTimer);
  }

  function jsonErrorMessage(result) {
    if (result.code === "empty") return t("error.json.empty");
    if (result.code === "depth") return t("error.json.depth");
    if (result.line && result.col) return t("error.json.pos", { line: String(result.line), col: String(result.col) });
    return t("error.json");
  }

  function setHidden(el, hide) {
    if (!el) return;
    el.classList.toggle("hidden", hide);
    el.toggleAttribute("hidden", hide);
    if (hide) el.setAttribute("aria-hidden", "true");
    else el.removeAttribute("aria-hidden");
    el.inert = hide;
  }

  function tooBig(text) {
    if (String(text || "").length <= MAX_DOC_CHARS) return false;
    showToast(t("error.size"), true);
    return true;
  }

  function updateStats() {
    const el = inputs[currentTool];
    const chars = el ? el.value.length : 0;
    stats.textContent = t("stats.meta", { chars: String(chars) });
  }

  function setTool(tool) {
    currentTool = tool;
    workspace.setAttribute("data-tool", tool);
    workspace.setAttribute("aria-labelledby", "tab-" + tool);
    tabs.forEach((btn) => {
      const active = btn.getAttribute("data-tool") === tool;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
      btn.tabIndex = active ? 0 : -1;
    });
    Object.keys(toolbars).forEach((name) => {
      setHidden(toolbars[name], name !== tool);
    });
    Object.keys(inputs).forEach((name) => {
      setHidden(inputs[name], name !== tool);
    });
    Object.keys(outputs).forEach((name) => {
      setHidden(outputs[name], name !== tool);
    });
    if (tool === "hash") updateHash(true);
    updateStats();
  }

  async function copyText(text) {
    const value = String(text || "");
    if (!value) {
      showToast(t("copy.empty"), true);
      return;
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        throw new Error("clipboard");
      }
      showToast(t("copied"));
    } catch {
      showToast(t("copy.fail"), true);
    }
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function collectionSize(value) {
    return Array.isArray(value) ? value.length : Object.keys(value).length;
  }

  function shouldExpand(value, depth) {
    if (depth > 0) return false;
    return collectionSize(value) <= 300;
  }

  function renderString(str) {
    const wrap = el("span", "jf-string");
    if (core.isSafeHttpUrl(str)) {
      wrap.appendChild(document.createTextNode('"'));
      const link = document.createElement("a");
      link.className = "jf-link";
      link.href = str;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = str;
      wrap.appendChild(link);
      wrap.appendChild(document.createTextNode('"'));
      return wrap;
    }
    wrap.textContent = JSON.stringify(str);
    return wrap;
  }

  function renderPrimitive(value) {
    if (value === null) return el("span", "jf-null", "null");
    if (typeof value === "boolean") return el("span", "jf-bool", String(value));
    if (typeof value === "number") return el("span", "jf-num", JSON.stringify(value));
    return renderString(value);
  }

  function appendKey(entry, key, before) {
    if (key == null) return;
    const keyEl = el("span", "jf-key", JSON.stringify(String(key)));
    const colon = el("span", "jf-colon", ": ");
    entry.insertBefore(colon, before);
    entry.insertBefore(keyEl, colon);
  }

  function renderValue(value, depth, isLast, gen, key) {
    if (value !== null && typeof value === "object") {
      return renderCollection(value, depth, isLast, gen, key);
    }
    const row = el("div", "jf-entry");
    const prim = renderPrimitive(value);
    row.appendChild(prim);
    appendKey(row, key, prim);
    if (!isLast) row.appendChild(el("span", "jf-comma", ","));
    return row;
  }

  function renderCollection(value, depth, isLast, gen, key) {
    const isArray = Array.isArray(value);
    const keys = isArray ? null : Object.keys(value);
    const size = isArray ? value.length : keys.length;
    const entry = el("div", "jf-entry");

    if (!size) {
      const punct = el("span", "jf-punct", isArray ? "[]" : "{}");
      entry.appendChild(punct);
      appendKey(entry, key, punct);
      if (!isLast) entry.appendChild(el("span", "jf-comma", ","));
      return entry;
    }

    const expanded = shouldExpand(value, depth);
    entry.classList.add("jf-expandable");
    if (!expanded) entry.classList.add("is-collapsed");

    const toggle = el("button", "jf-toggle");
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    toggle.setAttribute("aria-label", expanded ? t("json.collapse") : t("json.expand"));
    entry.appendChild(toggle);
    appendKey(entry, key, null);
    entry.appendChild(el("span", "jf-punct", isArray ? "[" : "{"));
    entry.appendChild(el("span", "jf-ellipsis", "…"));
    const children = el("div", "jf-children");
    entry.appendChild(children);
    entry.appendChild(el("span", "jf-punct jf-close", isArray ? "]" : "}"));
    if (!isLast) entry.appendChild(el("span", "jf-comma", ","));

    jfData.set(entry, {
      value,
      isArray,
      keys,
      size,
      depth,
      gen,
      childrenEl: children,
      nextIndex: 0,
    });
    if (expanded) fillChildren(entry);
    return entry;
  }

  function fillChildren(entry) {
    const meta = jfData.get(entry);
    if (!meta || meta.gen !== jsonGen) return;
    if (entry.classList.contains("is-collapsed")) return;
    const { value, isArray, keys, size, depth, gen, childrenEl } = meta;
    let i = meta.nextIndex;
    const end = Math.min(i + JF_CHUNK, size);
    if (isArray) {
      for (; i < end; i++) {
        childrenEl.appendChild(renderValue(value[i], depth + 1, i === size - 1, gen, null));
      }
    } else {
      for (; i < end; i++) {
        const key = keys[i];
        childrenEl.appendChild(renderValue(value[key], depth + 1, i === size - 1, gen, key));
      }
    }
    meta.nextIndex = i;
    if (i < size) {
      requestAnimationFrame(() => fillChildren(entry));
    }
  }

  function setEntryExpanded(entry, expanded) {
    if (!entry.classList.contains("jf-expandable")) return;
    entry.classList.toggle("is-collapsed", !expanded);
    const toggle = entry.querySelector(":scope > .jf-toggle");
    if (toggle) {
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
      toggle.setAttribute("aria-label", expanded ? t("json.collapse") : t("json.expand"));
    }
    if (expanded) fillChildren(entry);
  }

  function setJsonView(mode) {
    setHidden(jsonTree, mode !== "tree");
    setHidden(jsonOutput, mode !== "raw");
    const parsedOn = hasParsed && mode === "tree";
    const rawOn = hasParsed && mode === "raw";
    if (btnJsonParsed) {
      btnJsonParsed.classList.toggle("is-active", parsedOn);
      btnJsonParsed.setAttribute("aria-pressed", parsedOn ? "true" : "false");
    }
    if (btnJsonRaw) {
      btnJsonRaw.classList.toggle("is-active", rawOn);
      btnJsonRaw.setAttribute("aria-pressed", rawOn ? "true" : "false");
    }
  }

  function setParsedButtons(enabled) {
    if (btnJsonParsed) btnJsonParsed.disabled = !enabled;
    if (btnJsonRaw) btnJsonRaw.disabled = !enabled;
  }

  function exportWindowJson(data) {
    try {
      window.json = data;
    } catch {}
  }

  function clearWindowJson() {
    try {
      window.json = undefined;
    } catch {}
  }

  function commitParsed(data, rawText, view) {
    hasParsed = true;
    parsedJson = data;
    jsonOutput.value = rawText;
    exportWindowJson(data);
    setParsedButtons(true);
    showJsonTree(data);
    if (view === "raw") setJsonView("raw");
  }

  function resetParsed() {
    hasParsed = false;
    parsedJson = undefined;
    jsonOutput.value = "";
    clearJsonTree();
    clearWindowJson();
    setParsedButtons(false);
    setJsonView("raw");
  }

  function readFetchUrl(text) {
    const raw = String(text || "").trim();
    if (!raw || /\s/.test(raw)) return "";
    if (core.isJsonFetchUrl(raw)) return raw;
    if (raw.charCodeAt(0) === 47 && raw.charCodeAt(1) !== 47) {
      try {
        return new URL(raw, window.location.origin).href;
      } catch {
        return "";
      }
    }
    return "";
  }

  function showParsedView() {
    if (!hasParsed) {
      showToast(t("error.json.empty"), true);
      return;
    }
    if (!jsonTree.childElementCount) showJsonTree(parsedJson);
    else setJsonView("tree");
  }

  function showRawView() {
    if (!hasParsed) {
      showToast(t("error.json.empty"), true);
      return;
    }
    setJsonView("raw");
  }

  function clearJsonTree() {
    jsonGen += 1;
    jsonTree.replaceChildren();
  }

  function showJsonTree(data) {
    jsonGen += 1;
    jsonTree.replaceChildren();
    jsonTree.appendChild(renderValue(data, 0, true, jsonGen, null));
    setJsonView("tree");
  }

  function applyJsonText(text, minify) {
    if (tooBig(text)) {
      resetParsed();
      return false;
    }
    let result;
    try {
      result = minify ? core.minifyJson(text) : core.formatJson(text);
    } catch {
      resetParsed();
      showToast(t("error.json.depth"), true);
      return false;
    }
    if (!result.ok) {
      resetParsed();
      showToast(jsonErrorMessage(result), true);
      return false;
    }
    commitParsed(result.data, result.value, minify ? "raw" : "tree");
    updateStats();
    if (result.unsafe) showToast(t("json.unsafe"));
    else hideToast();
    return true;
  }

  async function loadJsonUrl(url, minify) {
    const seq = ++jsonFetchSeq;
    showToast(t("json.fetching"));
    try {
      const response = await fetch(url, { credentials: "omit" });
      if (seq !== jsonFetchSeq) return;
      if (!response.ok) {
        resetParsed();
        showToast(t("error.json.fetch"), true);
        return;
      }
      const body = await response.text();
      if (seq !== jsonFetchSeq) return;
      if (tooBig(body)) {
        resetParsed();
        return;
      }
      applyJsonText(body, minify);
    } catch {
      if (seq !== jsonFetchSeq) return;
      resetParsed();
      showToast(t("error.json.fetch"), true);
    }
  }

  function runJson(minify) {
    const source = jsonInput.value;
    const url = readFetchUrl(source);
    if (url) {
      loadJsonUrl(url, minify);
      return;
    }
    jsonFetchSeq += 1;
    applyJsonText(source, minify);
  }

  function runB64(mode) {
    if (tooBig(b64Input.value)) {
      b64Output.value = "";
      return;
    }
    const result = mode === "decode" ? core.decodeBase64(b64Input.value) : core.encodeBase64(b64Input.value);
    if (!result.ok) {
      if (result.code === "binary") {
        b64Output.value = result.value || "";
        showToast(t("error.b64.binary"), true);
      } else {
        b64Output.value = "";
        showToast(t("error.b64"), true);
      }
      return;
    }
    b64Output.value = result.value;
    updateStats();
  }

  function swapB64() {
    const nextIn = b64Output.value;
    b64Output.value = b64Input.value;
    b64Input.value = nextIn;
    updateStats();
  }

  function copyHash(which) {
    updateHash(true);
    copyText(which === "sha" ? hashSha256.textContent : hashMd5.textContent);
  }

  function computeHash() {
    const value = hashInput.value;
    if (value.length > MAX_DOC_CHARS) {
      hashMd5.textContent = "";
      hashSha256.textContent = "";
      return;
    }
    hashMd5.textContent = core.md5(value);
    hashSha256.textContent = core.sha256(value);
  }

  function updateHash(immediate) {
    const over = hashInput.value.length > MAX_DOC_CHARS;
    if (over) {
      clearTimeout(hashTimer);
      hashMd5.textContent = "";
      hashSha256.textContent = "";
      if (!sizeWarned) {
        showToast(t("error.size"), true);
        sizeWarned = true;
      }
      updateStats();
      return;
    }
    sizeWarned = false;
    if (immediate) {
      clearTimeout(hashTimer);
      computeHash();
      updateStats();
      return;
    }
    updateStats();
    clearTimeout(hashTimer);
    hashTimer = setTimeout(computeHash, 180);
  }

  function moveTab(fromIndex, key) {
    const last = tabs.length - 1;
    let next = fromIndex;
    if (key === "ArrowRight" || key === "ArrowDown") next = (fromIndex + 1) % tabs.length;
    else if (key === "ArrowLeft" || key === "ArrowUp") next = (fromIndex - 1 + tabs.length) % tabs.length;
    else if (key === "Home") next = 0;
    else if (key === "End") next = last;
    else return false;
    const btn = tabs[next];
    setTool(btn.getAttribute("data-tool"));
    btn.focus();
    return true;
  }

  function bindJsonTree() {
    jsonTree.addEventListener("click", (event) => {
      const toggle = event.target.closest(".jf-toggle");
      if (!toggle || !jsonTree.contains(toggle)) return;
      event.preventDefault();
      const entry = toggle.parentElement;
      const expand = entry.classList.contains("is-collapsed");
      if (event.metaKey || event.ctrlKey) {
        const parent = entry.parentElement;
        parent.querySelectorAll(":scope > .jf-entry.jf-expandable").forEach((sib) => {
          setEntryExpanded(sib, expand);
        });
        return;
      }
      setEntryExpanded(entry, expand);
    });
  }

  function refreshToggleLabels() {
    jsonTree.querySelectorAll(".jf-toggle").forEach((btn) => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-label", expanded ? t("json.collapse") : t("json.expand"));
    });
  }

  function bind() {
    tabs.forEach((btn) => {
      btn.addEventListener("click", () => setTool(btn.getAttribute("data-tool")));
    });
    if (tablist) {
      tablist.addEventListener("keydown", (event) => {
        const index = tabs.indexOf(document.activeElement);
        if (index < 0) return;
        if (moveTab(index, event.key)) event.preventDefault();
      });
    }

    document.querySelector("#btnJsonFormat").addEventListener("click", () => runJson(false));
    document.querySelector("#btnJsonMinify").addEventListener("click", () => runJson(true));
    if (btnJsonParsed) btnJsonParsed.addEventListener("click", showParsedView);
    if (btnJsonRaw) btnJsonRaw.addEventListener("click", showRawView);
    document.querySelector("#btnJsonCopy").addEventListener("click", () => copyText(jsonOutput.value));
    document.querySelector("#btnJsonClear").addEventListener("click", () => {
      jsonInput.value = "";
      jsonFetchSeq += 1;
      resetParsed();
      updateStats();
      showToast(t("cleared"));
    });

    document.querySelector("#btnB64Encode").addEventListener("click", () => runB64("encode"));
    document.querySelector("#btnB64Decode").addEventListener("click", () => runB64("decode"));
    document.querySelector("#btnB64Swap").addEventListener("click", swapB64);
    document.querySelector("#btnB64Copy").addEventListener("click", () => copyText(b64Output.value));
    document.querySelector("#btnB64Clear").addEventListener("click", () => {
      b64Input.value = "";
      b64Output.value = "";
      updateStats();
      showToast(t("cleared"));
    });

    document.querySelector("#btnHashCopyMd5").addEventListener("click", () => copyHash("md5"));
    document.querySelector("#btnHashCopySha").addEventListener("click", () => copyHash("sha"));
    document.querySelector("#btnHashClear").addEventListener("click", () => {
      hashInput.value = "";
      updateHash(true);
      showToast(t("cleared"));
    });

    jsonInput.addEventListener("input", updateStats);
    b64Input.addEventListener("input", updateStats);
    hashInput.addEventListener("input", () => updateHash(false));

    document.addEventListener("i18n:change", () => {
      updateStats();
      refreshToggleLabels();
    });
    bindJsonTree();
    setParsedButtons(false);
    setJsonView("raw");
    setTool("json");
    bootFromQuery();
  }

  function bootFromQuery() {
    let params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch {
      return;
    }
    const url = params.get("url");
    const inline = params.get("json");
    if (url) {
      jsonInput.value = url;
      updateStats();
      runJson(false);
      return;
    }
    if (inline) {
      jsonInput.value = inline;
      updateStats();
      runJson(false);
    }
  }

  bind();
})();
