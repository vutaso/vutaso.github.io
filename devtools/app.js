(() => {
  const core = window.DevToolsCore;
  if (!core) return;
  const MAX_DOC_CHARS = core.MAX_DOC_CHARS;
  const JF_CHUNK = 48;
  const TREE_SLICE_MS = 8;
  const TREE_EXPAND_BUDGET = 2000;
  const TREE_AUTO_OBJECT_MAX = 64;
  const TREE_AUTO_ARRAY_MAX = 32;
  const t = (key, vars) => (window.DevToolsI18n ? DevToolsI18n.t(key, vars) : key);

  const workspace = document.querySelector("#workspace");
  const stats = document.querySelector("#stats");
  const toastEl = document.querySelector("#toast");
  const tablist = document.querySelector("#toolTabs");
  const tabs = Array.from(document.querySelectorAll(".tab-btn"));
  const jsonInput = document.querySelector("#jsonInput");
  const jsonOutput = document.querySelector("#jsonOutput");
  const jsonOutputWrap = document.querySelector("#jsonOutputWrap");
  const jsonStatus = document.querySelector("#jsonStatus");
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
  let treeExpandBudget = TREE_EXPAND_BUDGET;
  let treeFillQueue = [];
  let treeFillScheduled = false;
  const WORKER_TIMEOUT_MS = 30000;
  let jsonWorker = null;
  let jsonWorkerFailed = false;
  let jsonWorkSeq = 0;
  const JSON_DRAFT_KEY = "devtools-json-draft";
  let jsonDraftTimer = 0;

  function showToast(message, isError) {
    toastEl.textContent = message;
    toastEl.classList.toggle("error", !!isError);
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 2400);
  }

  function hideToast() {
    toastEl.classList.remove("is-on", "error");
    clearTimeout(toastTimer);
  }

  function jsonReasonText(reason) {
    if (reason === "trailing_comma") return t("error.json.reason.trailing_comma");
    if (reason === "expected_key") return t("error.json.reason.expected_key");
    if (reason === "expected_colon") return t("error.json.reason.expected_colon");
    if (reason === "comma_or_end") return t("error.json.reason.comma_or_end");
    if (reason === "unterminated_string") return t("error.json.reason.unterminated_string");
    if (reason === "bad_escape") return t("error.json.reason.bad_escape");
    if (reason === "control") return t("error.json.reason.control");
    if (reason === "number") return t("error.json.reason.number");
    if (reason === "trailing") return t("error.json.reason.trailing");
    if (reason === "not_json") return t("error.json.reason.not_json");
    if (reason === "unexpected") return t("error.json.reason.unexpected");
    return "";
  }

  function jsonErrorMessage(result) {
    if (result.code === "empty") return t("error.json.empty");
    if (result.code === "depth") return t("error.json.depth");
    if (result.code === "worker") return t("error.json.worker");
    if (result.code === "encoding") return t("error.json.encoding");
    const detail = jsonReasonText(result.reason);
    if (result.line && result.col && detail) {
      return t("error.json.pos.reason", { line: String(result.line), col: String(result.col), detail: detail });
    }
    if (detail) return detail;
    if (result.line && result.col) return t("error.json.pos", { line: String(result.line), col: String(result.col) });
    return t("error.json");
  }

  function clearJsonStatus() {
    if (jsonInput) jsonInput.classList.remove("has-error");
    if (!jsonStatus) return;
    jsonStatus.textContent = "";
    jsonStatus.classList.remove("is-error", "is-ok");
    jsonStatus.setAttribute("role", "status");
    setHidden(jsonStatus, true);
  }

  function setJsonStatus(result) {
    if (!jsonStatus) return;
    if (!result) {
      clearJsonStatus();
      return;
    }
    const ok = !!result.ok;
    jsonStatus.textContent = ok ? t("json.valid") : jsonErrorMessage(result);
    jsonStatus.classList.toggle("is-error", !ok);
    jsonStatus.classList.toggle("is-ok", ok);
    jsonStatus.setAttribute("role", ok ? "status" : "alert");
    setHidden(jsonStatus, false);
    if (jsonInput) jsonInput.classList.toggle("has-error", !ok);
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

  function readJsonDraft() {
    try {
      const raw = localStorage.getItem(JSON_DRAFT_KEY);
      return raw == null ? "" : String(raw);
    } catch {
      return "";
    }
  }

  function writeJsonDraft(text) {
    try {
      const value = String(text || "");
      if (!value) localStorage.removeItem(JSON_DRAFT_KEY);
      else if (value.length <= MAX_DOC_CHARS) localStorage.setItem(JSON_DRAFT_KEY, value);
    } catch {}
  }

  function scheduleJsonDraftSave() {
    clearTimeout(jsonDraftTimer);
    jsonDraftTimer = setTimeout(() => writeJsonDraft(jsonInput.value), 200);
  }

  function restoreJsonDraft() {
    if (!jsonInput || jsonInput.value) return;
    const draft = readJsonDraft();
    if (!draft || draft.length > MAX_DOC_CHARS) return;
    jsonInput.value = draft;
    updateStats();
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

  function autoExpandCap(isArray) {
    return isArray ? TREE_AUTO_ARRAY_MAX : TREE_AUTO_OBJECT_MAX;
  }

  function shouldExpand(size, cap) {
    if (size > cap) return false;
    if (treeExpandBudget < size) return false;
    treeExpandBudget -= size;
    return true;
  }

  function resetTreeScheduler() {
    treeFillQueue = [];
    treeFillScheduled = false;
    treeExpandBudget = TREE_EXPAND_BUDGET;
  }

  function enqueueTreeFill(entry) {
    const meta = jfData.get(entry);
    if (!meta || meta.gen !== jsonGen || meta.queued) return;
    if (entry.classList.contains("is-collapsed")) return;
    meta.queued = true;
    treeFillQueue.push(entry);
  }

  function scheduleTreeFill() {
    if (treeFillScheduled) return;
    treeFillScheduled = true;
    requestAnimationFrame(pumpTreeFill);
  }

  function pumpTreeFill() {
    treeFillScheduled = false;
    const gen = jsonGen;
    const deadline = performance.now() + TREE_SLICE_MS;
    while (treeFillQueue.length && performance.now() < deadline) {
      const entry = treeFillQueue[0];
      const meta = jfData.get(entry);
      if (!entry.isConnected || !meta || meta.gen !== gen) {
        if (meta) meta.queued = false;
        treeFillQueue.shift();
        continue;
      }
      if (entry.classList.contains("is-collapsed")) {
        meta.queued = false;
        treeFillQueue.shift();
        continue;
      }
      if (fillTreeSlice(entry, deadline)) {
        meta.queued = false;
        treeFillQueue.shift();
      }
    }
    if (treeFillQueue.length && jsonGen === gen) scheduleTreeFill();
  }

  function fillTreeSlice(entry, deadline) {
    const meta = jfData.get(entry);
    const { value, isArray, keys, size, depth, gen, childrenEl, lazyChildren } = meta;
    let i = meta.nextIndex;
    let n = 0;
    while (i < size && n < JF_CHUNK && performance.now() < deadline) {
      if (isArray) {
        childrenEl.appendChild(renderValue(value[i], depth + 1, i === size - 1, gen, null, lazyChildren));
      } else {
        const key = keys[i];
        childrenEl.appendChild(renderValue(value[key], depth + 1, i === size - 1, gen, key, lazyChildren));
      }
      i += 1;
      n += 1;
    }
    meta.nextIndex = i;
    return i >= size;
  }

  function dropTreeChildren(entry) {
    const meta = jfData.get(entry);
    if (!meta || meta.size <= autoExpandCap(meta.isArray)) return;
    meta.childrenEl.replaceChildren();
    meta.nextIndex = 0;
    meta.queued = false;
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
    if (typeof value === "bigint") return el("span", "jf-num", String(value));
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

  function renderValue(value, depth, isLast, gen, key, lazy) {
    if (value !== null && typeof value === "object") {
      return renderCollection(value, depth, isLast, gen, key, lazy);
    }
    const row = el("div", "jf-entry");
    const prim = renderPrimitive(value);
    row.appendChild(prim);
    appendKey(row, key, prim);
    if (!isLast) row.appendChild(el("span", "jf-comma", ","));
    return row;
  }

  function renderCollection(value, depth, isLast, gen, key, lazy) {
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

    const cap = autoExpandCap(isArray);
    const expanded = !lazy && shouldExpand(size, cap);
    const lazyChildren = !!lazy || size > cap;
    entry.classList.add("jf-expandable");
    if (!expanded) entry.classList.add("is-collapsed");

    const toggle = el("button", "jf-toggle");
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    toggle.setAttribute("aria-label", expanded ? t("json.collapse") : t("json.expand"));
    entry.appendChild(toggle);
    appendKey(entry, key, null);
    entry.appendChild(el("span", "jf-punct", isArray ? "[" : "{"));
    entry.appendChild(el("span", "jf-ellipsis", "… " + size));
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
      queued: false,
      lazyChildren: lazyChildren,
    });
    if (expanded) enqueueTreeFill(entry);
    return entry;
  }

  function setEntryExpanded(entry, expanded) {
    if (!entry.classList.contains("jf-expandable")) return;
    entry.classList.toggle("is-collapsed", !expanded);
    const toggle = entry.querySelector(":scope > .jf-toggle");
    if (toggle) {
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
      toggle.setAttribute("aria-label", expanded ? t("json.collapse") : t("json.expand"));
    }
    if (expanded) {
      enqueueTreeFill(entry);
      scheduleTreeFill();
    } else dropTreeChildren(entry);
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
    clearJsonStatus();
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
    resetTreeScheduler();
    jsonTree.replaceChildren();
  }

  function showJsonTree(data) {
    jsonGen += 1;
    resetTreeScheduler();
    jsonTree.replaceChildren();
    jsonTree.appendChild(renderValue(data, 0, true, jsonGen, null, false));
    setJsonView("tree");
    if (treeFillQueue.length) {
      treeFillScheduled = true;
      pumpTreeFill();
    }
  }

  function setJsonBusy(busy) {
    if (workspace) workspace.setAttribute("aria-busy", busy ? "true" : "false");
    ["btnJsonFormat", "btnJsonMinify", "btnJsonValidate", "btnJsonUpload"].forEach((id) => {
      const btn = document.querySelector("#" + id);
      if (btn) btn.disabled = busy;
    });
  }

  function killJsonWorker() {
    if (!jsonWorker) return;
    try {
      jsonWorker.terminate();
    } catch {}
    jsonWorker = null;
  }

  function ensureJsonWorker() {
    if (jsonWorker || jsonWorkerFailed || typeof Worker === "undefined") return;
    try {
      jsonWorker = new Worker("json-worker.js?v=1.7");
    } catch {
      jsonWorkerFailed = true;
    }
  }

  function callJsonWorker(text, opts, id) {
    const minify = !!(opts && opts.minify);
    const validate = !!(opts && opts.validate);
    return new Promise((resolve) => {
      let settled = false;
      function finish(result) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(result);
      }
      const timer = setTimeout(() => {
        killJsonWorker();
        finish({ ok: false, code: "worker" });
      }, WORKER_TIMEOUT_MS);
      function onMessage(event) {
        if (!event.data || event.data.id !== id) return;
        jsonWorker.removeEventListener("message", onMessage);
        jsonWorker.removeEventListener("error", onError);
        finish(event.data.result || { ok: false, code: "worker" });
      }
      function onError() {
        jsonWorker.removeEventListener("message", onMessage);
        jsonWorker.removeEventListener("error", onError);
        killJsonWorker();
        jsonWorkerFailed = true;
        finish({ ok: false, code: "fallback" });
      }
      jsonWorker.addEventListener("message", onMessage);
      jsonWorker.addEventListener("error", onError);
      try {
        jsonWorker.postMessage({ id: id, text: text, minify: minify, validate: validate });
      } catch {
        onError();
      }
    });
  }

  function runJsonLocal(text, opts) {
    if (opts && opts.validate) return core.validateJson(text);
    if (opts && opts.minify) return core.minifyJson(text);
    return core.formatJson(text);
  }

  async function runJsonEngine(text, opts, id) {
    ensureJsonWorker();
    if (jsonWorker) {
      const result = await callJsonWorker(text, opts, id);
      if (result && result.code === "fallback") {
        try {
          return runJsonLocal(text, opts);
        } catch {
          return { ok: false, code: "depth" };
        }
      }
      return result;
    }
    try {
      return runJsonLocal(text, opts);
    } catch {
      return { ok: false, code: "depth" };
    }
  }

  function revealJsonError(result) {
    if (result.line == null && result.offset == null) return;
    const text = jsonInput.value;
    let idx = 0;
    if (result.offset != null) {
      let base = 0;
      if (text.charCodeAt(0) === 0xfeff) base = 1;
      while (base < text.length) {
        const c = text.charCodeAt(base);
        if (c === 32 || c === 9 || c === 10 || c === 13) base++;
        else break;
      }
      idx = Math.min(text.length, base + result.offset);
    } else {
      let line = 1;
      while (line < result.line && idx < text.length) {
        if (text.charCodeAt(idx) === 10) line++;
        idx++;
      }
      idx = Math.min(text.length, idx + Math.max(0, (result.col || 1) - 1));
    }
    jsonInput.focus();
    jsonInput.setSelectionRange(idx, Math.min(text.length, idx + 1));
    const lh = Number.parseFloat(window.getComputedStyle(jsonInput).lineHeight) || 22;
    jsonInput.scrollTop = Math.max(0, ((result.line || 1) - 3) * lh);
  }

  async function applyJsonText(text, minify) {
    if (tooBig(text)) {
      jsonWorkSeq += 1;
      setJsonBusy(false);
      resetParsed();
      return false;
    }
    const seq = ++jsonWorkSeq;
    setJsonBusy(true);
    let result;
    try {
      result = await runJsonEngine(text, { minify: !!minify }, seq);
    } catch {
      if (seq !== jsonWorkSeq) return false;
      resetParsed();
      showToast(t("error.json.depth"), true);
      setJsonBusy(false);
      return false;
    }
    if (seq !== jsonWorkSeq) return false;
    setJsonBusy(false);
    if (!result || !result.ok) {
      resetParsed();
      setJsonStatus(result || { code: "json" });
      showToast(jsonErrorMessage(result || { code: "json" }), true);
      if (result) revealJsonError(result);
      return false;
    }
    commitParsed(result.data, result.value, minify ? "raw" : "tree");
    updateStats();
    clearJsonStatus();
    if (result.unwrapped) showToast(t("json.unwrapped"));
    else hideToast();
    return true;
  }

  async function applyJsonValidate(text) {
    if (tooBig(text)) {
      jsonWorkSeq += 1;
      setJsonBusy(false);
      return false;
    }
    const seq = ++jsonWorkSeq;
    setJsonBusy(true);
    let result;
    try {
      result = await runJsonEngine(text, { validate: true }, seq);
    } catch {
      if (seq !== jsonWorkSeq) return false;
      setJsonStatus({ ok: false, code: "depth" });
      setJsonBusy(false);
      return false;
    }
    if (seq !== jsonWorkSeq) return false;
    setJsonBusy(false);
    if (!result || !result.ok) {
      setJsonStatus(result || { code: "json" });
      if (result) revealJsonError(result);
      return false;
    }
    setJsonStatus({ ok: true });
    hideToast();
    return true;
  }

  async function loadJsonUrl(url, minify, validate) {
    const seq = ++jsonFetchSeq;
    showToast(t("json.fetching"));
    try {
      const response = await fetch(url, { credentials: "omit" });
      if (seq !== jsonFetchSeq) return;
      if (!response.ok) {
        if (!validate) resetParsed();
        setJsonStatus({ ok: false, code: "json" });
        showToast(t("error.json.fetch"), true);
        return;
      }
      const body = await response.text();
      if (seq !== jsonFetchSeq) return;
      if (tooBig(body)) {
        if (!validate) resetParsed();
        return;
      }
      if (validate) await applyJsonValidate(body);
      else await applyJsonText(body, minify);
    } catch {
      if (seq !== jsonFetchSeq) return;
      if (!validate) resetParsed();
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

  function runValidate() {
    const source = jsonInput.value;
    const url = readFetchUrl(source);
    if (url) {
      loadJsonUrl(url, false, true);
      return;
    }
    jsonFetchSeq += 1;
    applyJsonValidate(source);
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

  function downloadJson() {
    const value = jsonOutput.value;
    if (!value) {
      showToast(t("download.empty"), true);
      return;
    }
    try {
      const blob = new Blob([value], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "devtools.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(t("downloaded"));
    } catch {
      showToast(t("download.fail"), true);
    }
  }

  async function loadJsonFile(file) {
    if (!file) return;
    if (file.size > MAX_DOC_CHARS) {
      showToast(t("error.size"), true);
      return;
    }
    let bytes;
    try {
      bytes = new Uint8Array(await file.arrayBuffer());
    } catch {
      showToast(t("error.json.encoding"), true);
      return;
    }
    const decoded = core.decodeUtf8Document(bytes, MAX_DOC_CHARS);
    if (!decoded.ok) {
      showToast(decoded.code === "size" ? t("error.size") : t("error.json.encoding"), true);
      return;
    }
    jsonInput.value = decoded.value;
    writeJsonDraft(decoded.value);
    updateStats();
    runJson(false);
  }

  function bindFileIo() {
    const fileInput = document.querySelector("#jsonFile");
    const pane = document.querySelector(".editor-pane");
    const uploadBtn = document.querySelector("#btnJsonUpload");
    const downloadBtn = document.querySelector("#btnJsonDownload");
    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", () => {
        const file = fileInput.files && fileInput.files[0];
        fileInput.value = "";
        loadJsonFile(file);
      });
    }
    if (downloadBtn) downloadBtn.addEventListener("click", downloadJson);
    if (!pane) return;
    ["dragenter", "dragover"].forEach((type) => {
      pane.addEventListener(type, (event) => {
        if (currentTool !== "json") return;
        event.preventDefault();
        pane.classList.add("is-drop");
      });
    });
    pane.addEventListener("dragleave", (event) => {
      if (event.relatedTarget && pane.contains(event.relatedTarget)) return;
      pane.classList.remove("is-drop");
    });
    pane.addEventListener("drop", (event) => {
      event.preventDefault();
      pane.classList.remove("is-drop");
      if (currentTool !== "json") return;
      const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      loadJsonFile(file);
    });
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
    const btnJsonValidate = document.querySelector("#btnJsonValidate");
    if (btnJsonValidate) btnJsonValidate.addEventListener("click", runValidate);
    if (btnJsonParsed) btnJsonParsed.addEventListener("click", showParsedView);
    if (btnJsonRaw) btnJsonRaw.addEventListener("click", showRawView);
    document.querySelector("#btnJsonCopy").addEventListener("click", () => copyText(jsonOutput.value));
    document.querySelector("#btnJsonClear").addEventListener("click", () => {
      jsonInput.value = "";
      jsonFetchSeq += 1;
      jsonWorkSeq += 1;
      setJsonBusy(false);
      writeJsonDraft("");
      resetParsed();
      updateStats();
      showToast(t("cleared"));
    });
    bindFileIo();

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

    jsonInput.addEventListener("input", () => {
      updateStats();
      scheduleJsonDraftSave();
    });
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
    if (!readFetchUrl(jsonInput.value)) restoreJsonDraft();
    window.addEventListener("pagehide", () => writeJsonDraft(jsonInput.value));
  }

  function bootFromQuery() {
    let params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch {
      return;
    }
    const url = params.get("url");
    if (url) {
      jsonInput.value = url;
      updateStats();
      runJson(false);
    }
  }

  try {
    bind();
  } catch {
    showToast(t("error.json.worker"), true);
  }
})();
