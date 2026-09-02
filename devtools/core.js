(function (root) {
  const MAX_DOC_CHARS = 2 * 1024 * 1024;
  const MAX_JSON_DEPTH = 512;
  const PERF_BUDGET_1MB_MS = 8000;

  function toBytes(input) {
    if (input instanceof Uint8Array) return input;
    return new TextEncoder().encode(String(input == null ? "" : input));
  }

  function toHex(bytes) {
    let out = "";
    for (let i = 0; i < bytes.length; i++) {
      out += (bytes[i] + 256).toString(16).slice(-2);
    }
    return out;
  }

  function looksLikeJson(text) {
    const raw = String(text == null ? "" : text);
    let i = 0;
    const n = raw.length;
    if (n && raw.charCodeAt(0) === 0xfeff) i = 1;
    while (i < n) {
      const c = raw.charCodeAt(i);
      if (c === 32 || c === 9 || c === 10 || c === 13) i++;
      else break;
    }
    if (i >= n) return false;
    const c = raw.charCodeAt(i);
    if (c === 123 || c === 91 || c === 34 || c === 45 || (c >= 48 && c <= 57)) return true;
    if (c === 116) return isJsonAtom(raw, i, "true");
    if (c === 102) return isJsonAtom(raw, i, "false");
    if (c === 110) return isJsonAtom(raw, i, "null");
    return false;
  }

  function isJsonAtom(raw, i, token) {
    if (!raw.startsWith(token, i)) return false;
    const next = raw.charCodeAt(i + token.length);
    return !next || next === 32 || next === 9 || next === 10 || next === 13;
  }

  function isSafeHttpUrl(value) {
    if (typeof value !== "string" || value.length < 8 || value.length > 2048) return false;
    if (value !== value.trim()) return false;
    if (value.charCodeAt(0) !== 104 && value.charCodeAt(0) !== 72) return false;
    if (!/^https?:\/\//i.test(value)) return false;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  function unwrapHtmlPre(text) {
    if (!text || text.charCodeAt(0) !== 60) return text;
    const match = text.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
    if (!match) return text;
    return decodeBasicEntities(match[1]);
  }

  function decodeBasicEntities(text) {
    return String(text)
      .replace(/&quot;/g, '"')
      .replace(/&#34;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
  }

  function stripXssiPrefix(text) {
    return String(text).replace(/^(?:\)\]\}'?\,?|while\s*\(\s*(?:1|true)\s*\)\s*;|for\s*\(\s*;\s*;\s*\)\s*;|throw\s+\d+\s*;)\s*/, "");
  }

  function isIdentStart(c) {
    return (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 36 || c === 95;
  }

  function isIdentPart(c) {
    return isIdentStart(c) || (c >= 48 && c <= 57);
  }

  function readIdentPath(raw, from) {
    let i = from;
    if (!isIdentStart(raw.charCodeAt(i))) return -1;
    i++;
    while (isIdentPart(raw.charCodeAt(i))) i++;
    while (raw.charCodeAt(i) === 46) {
      if (!isIdentStart(raw.charCodeAt(i + 1))) return i;
      i += 2;
      while (isIdentPart(raw.charCodeAt(i))) i++;
    }
    return i;
  }

  function skipWs(raw, from) {
    let i = from;
    const n = raw.length;
    while (i < n) {
      const c = raw.charCodeAt(i);
      if (c === 32 || c === 9 || c === 10 || c === 13) i++;
      else break;
    }
    return i;
  }

  function findJsonpOpenParen(raw) {
    let i = readIdentPath(raw, 0);
    if (i < 0) return -1;
    i = skipWs(raw, i);
    if (raw.charCodeAt(i) === 38 && raw.charCodeAt(i + 1) === 38) {
      i = readIdentPath(raw, skipWs(raw, i + 2));
      if (i < 0) return -1;
      i = skipWs(raw, i);
    }
    return raw.charCodeAt(i) === 40 ? i : -1;
  }

  function sliceBalancedParen(raw, openIndex) {
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = openIndex; i < raw.length; i++) {
      const c = raw.charCodeAt(i);
      if (inString) {
        if (escape) escape = false;
        else if (c === 92) escape = true;
        else if (c === 34) inString = false;
        continue;
      }
      if (c === 34) {
        inString = true;
        continue;
      }
      if (c === 40) depth++;
      else if (c === 41) {
        depth--;
        if (depth === 0) return raw.slice(openIndex + 1, i);
      }
    }
    return null;
  }

  function unwrapJsonp(text) {
    const raw = String(text).replace(/^\/\*\*?\/\s*/, "");
    const open = findJsonpOpenParen(raw);
    if (open < 0) return raw;
    const inner = sliceBalancedParen(raw, open);
    if (inner == null) return raw;
    let rest = raw.slice(open + inner.length + 2).trim();
    if (rest === ";") rest = "";
    if (rest) return raw;
    const payload = inner.trim();
    const c = payload.charCodeAt(0);
    if (c !== 123 && c !== 91) return raw;
    return payload;
  }

  function indexToLoc(source, index) {
    let line = 1;
    let col = 1;
    const pos = Math.max(0, Math.min(index, source.length));
    for (let i = 0; i < pos; i++) {
      if (source.charCodeAt(i) === 10) {
        line++;
        col = 1;
      } else col++;
    }
    return { line, col, offset: pos };
  }

  function isUnsafeNumberLiteral(lit) {
    if (/[.eE]/.test(lit)) {
      const n = Number(lit);
      return !Number.isFinite(n) || (n === Math.trunc(n) && !Number.isSafeInteger(n));
    }
    try {
      const b = BigInt(lit);
      return b > BigInt(Number.MAX_SAFE_INTEGER) || b < BigInt(Number.MIN_SAFE_INTEGER);
    } catch {
      return true;
    }
  }

  function hasUnsafeNumbers(text) {
    const re = /"(?:\\.|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
    let m;
    while ((m = re.exec(String(text)))) {
      if (m[0].charCodeAt(0) === 34) continue;
      if (isUnsafeNumberLiteral(m[0])) return true;
    }
    return false;
  }

  function extractJsonPayload(text) {
    let raw = String(text == null ? "" : text);
    let unwrapped = false;
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
    raw = raw.trim();
    if (!raw) return { ok: false, code: "empty" };
    const afterPre = unwrapHtmlPre(raw).trim();
    if (afterPre !== raw) {
      unwrapped = true;
      raw = afterPre;
    }
    const afterXssi = stripXssiPrefix(raw).trim();
    if (afterXssi !== raw) {
      unwrapped = true;
      raw = afterXssi;
    }
    const afterJsonp = unwrapJsonp(raw).trim();
    if (afterJsonp !== raw) {
      unwrapped = true;
      raw = afterJsonp;
    }
    if (!raw) return { ok: false, code: "empty" };
    return { ok: true, value: raw, unwrapped };
  }

  function isJsonFetchUrl(text) {
    const raw = String(text == null ? "" : text).trim();
    if (!raw || /\s/.test(raw)) return false;
    return isSafeHttpUrl(raw);
  }

  function parseFail(source, index, code, reason) {
    const loc = indexToLoc(source, index);
    const out = { ok: false, code: code || "json", line: loc.line, col: loc.col, offset: loc.offset };
    if (reason) out.reason = reason;
    return out;
  }

  function astToData(node) {
    switch (node.type) {
      case "null":
        return null;
      case "bool":
        return node.value;
      case "string":
        return node.value;
      case "number": {
        if (!isUnsafeNumberLiteral(node.raw)) return Number(node.raw);
        if (!/[.eE]/.test(node.raw)) {
          try {
            return BigInt(node.raw);
          } catch {
            return node.raw;
          }
        }
        return Number(node.raw);
      }
      case "array":
        return node.items.map(astToData);
      case "object": {
        const out = {};
        for (let i = 0; i < node.keys.length; i++) out[node.keys[i]] = astToData(node.values[i]);
        return out;
      }
      default:
        return null;
    }
  }

  function printAst(node, space) {
    const pretty = space > 0;
    const unit = pretty ? (typeof space === "number" ? " ".repeat(space) : String(space)) : "";

    function walk(n, level) {
      switch (n.type) {
        case "null":
          return "null";
        case "bool":
          return n.value ? "true" : "false";
        case "number":
          return n.raw;
        case "string":
          return JSON.stringify(n.value);
        case "array": {
          if (!n.items.length) return "[]";
          if (!pretty) return "[" + n.items.map((item) => walk(item, 0)).join(",") + "]";
          const inner = n.items
            .map((item) => unit.repeat(level + 1) + walk(item, level + 1))
            .join(",\n");
          return "[\n" + inner + "\n" + unit.repeat(level) + "]";
        }
        case "object": {
          if (!n.keys.length) return "{}";
          const mid = pretty ? ": " : ":";
          const pairs = n.keys.map((key, i) => {
            const line = JSON.stringify(key) + mid + walk(n.values[i], pretty ? level + 1 : 0);
            return pretty ? unit.repeat(level + 1) + line : line;
          });
          if (!pretty) return "{" + pairs.join(",") + "}";
          return "{\n" + pairs.join(",\n") + "\n" + unit.repeat(level) + "}";
        }
        default:
          throw new Error("depth");
      }
    }

    return walk(node, 0);
  }

  function parseLossless(source) {
    const src = String(source);
    const n = src.length;
    let i = 0;

    function fail(index, code, reason) {
      const err = new Error("json");
      err.index = index;
      err.code = code || "json";
      err.reason = reason || "unexpected";
      throw err;
    }

    function skipWs() {
      while (i < n) {
        const c = src.charCodeAt(i);
        if (c === 32 || c === 9 || c === 10 || c === 13) i++;
        else break;
      }
    }

    function parseString() {
      const start = i;
      i++;
      let out = "";
      while (i < n) {
        const c = src.charCodeAt(i);
        if (c === 34) {
          i++;
          return { type: "string", value: out };
        }
        if (c < 32) fail(i, "json", "control");
        if (c !== 92) {
          out += src.charAt(i);
          i++;
          continue;
        }
        i++;
        if (i >= n) fail(start, "json", "unterminated_string");
        const e = src.charCodeAt(i);
        i++;
        if (e === 34) out += '"';
        else if (e === 92) out += "\\";
        else if (e === 47) out += "/";
        else if (e === 98) out += "\b";
        else if (e === 102) out += "\f";
        else if (e === 110) out += "\n";
        else if (e === 114) out += "\r";
        else if (e === 116) out += "\t";
        else if (e === 117) {
          let cp = 0;
          for (let h = 0; h < 4; h++) {
            if (i >= n) fail(i, "json", "bad_escape");
            const hex = src.charCodeAt(i);
            i++;
            let v;
            if (hex >= 48 && hex <= 57) v = hex - 48;
            else if (hex >= 65 && hex <= 70) v = hex - 55;
            else if (hex >= 97 && hex <= 102) v = hex - 87;
            else fail(i - 1, "json", "bad_escape");
            cp = (cp << 4) | v;
          }
          out += String.fromCharCode(cp);
        } else fail(i - 1, "json", "bad_escape");
      }
      fail(start, "json", "unterminated_string");
    }

    function parseNumber() {
      const start = i;
      if (src.charCodeAt(i) === 45) i++;
      const first = src.charCodeAt(i);
      if (first === 48) i++;
      else if (first >= 49 && first <= 57) {
        i++;
        while (src.charCodeAt(i) >= 48 && src.charCodeAt(i) <= 57) i++;
      } else fail(start, "json", "number");
      if (src.charCodeAt(i) === 46) {
        i++;
        if (!(src.charCodeAt(i) >= 48 && src.charCodeAt(i) <= 57)) fail(i, "json", "number");
        while (src.charCodeAt(i) >= 48 && src.charCodeAt(i) <= 57) i++;
      }
      const exp = src.charCodeAt(i);
      if (exp === 101 || exp === 69) {
        i++;
        const sign = src.charCodeAt(i);
        if (sign === 43 || sign === 45) i++;
        if (!(src.charCodeAt(i) >= 48 && src.charCodeAt(i) <= 57)) fail(i, "json", "number");
        while (src.charCodeAt(i) >= 48 && src.charCodeAt(i) <= 57) i++;
      }
      return { type: "number", raw: src.slice(start, i) };
    }

    function parseKeyword(word, node) {
      if (!src.startsWith(word, i)) fail(i, "json", "unexpected");
      i += word.length;
      return node;
    }

    function parseValue(depth) {
      if (depth > MAX_JSON_DEPTH) fail(i, "depth");
      skipWs();
      if (i >= n) fail(i, "json", "unexpected");
      const c = src.charCodeAt(i);
      if (c === 34) return parseString();
      if (c === 45 || (c >= 48 && c <= 57)) return parseNumber();
      if (c === 123) {
        i++;
        const keys = [];
        const values = [];
        skipWs();
        if (src.charCodeAt(i) === 125) {
          i++;
          return { type: "object", keys, values };
        }
        while (true) {
          skipWs();
          if (src.charCodeAt(i) === 125) fail(i, "json", "trailing_comma");
          if (src.charCodeAt(i) !== 34) fail(i, "json", "expected_key");
          const key = parseString().value;
          skipWs();
          if (src.charCodeAt(i) !== 58) fail(i, "json", "expected_colon");
          i++;
          const value = parseValue(depth + 1);
          keys.push(key);
          values.push(value);
          skipWs();
          const sep = src.charCodeAt(i);
          if (sep === 125) {
            i++;
            return { type: "object", keys, values };
          }
          if (sep !== 44) fail(i, "json", "comma_or_end");
          i++;
        }
      }
      if (c === 91) {
        i++;
        const items = [];
        skipWs();
        if (src.charCodeAt(i) === 93) {
          i++;
          return { type: "array", items };
        }
        while (true) {
          skipWs();
          if (src.charCodeAt(i) === 93) fail(i, "json", "trailing_comma");
          items.push(parseValue(depth + 1));
          skipWs();
          const sep = src.charCodeAt(i);
          if (sep === 93) {
            i++;
            return { type: "array", items };
          }
          if (sep !== 44) fail(i, "json", "comma_or_end");
          i++;
        }
      }
      if (c === 116) return parseKeyword("true", { type: "bool", value: true });
      if (c === 102) return parseKeyword("false", { type: "bool", value: false });
      if (c === 110) return parseKeyword("null", { type: "null" });
      fail(i, "json", "unexpected");
    }

    try {
      const ast = parseValue(1);
      skipWs();
      if (i < n) fail(i, "json", "trailing");
      return { ok: true, ast };
    } catch (error) {
      if (error && error.code === "depth") return parseFail(src, error.index || i, "depth");
      return parseFail(
        src,
        error && error.index != null ? error.index : i,
        "json",
        error && error.reason
      );
    }
  }

  function parseJsonText(text) {
    const extracted = extractJsonPayload(text);
    if (!extracted.ok) return extracted;
    if (!looksLikeJson(extracted.value)) return { ok: false, code: "json", reason: "not_json" };
    const parsed = parseLossless(extracted.value);
    if (!parsed.ok) return parsed;
    return {
      ok: true,
      ast: parsed.ast,
      data: astToData(parsed.ast),
      unsafe: hasUnsafeNumbers(extracted.value),
      unwrapped: extracted.unwrapped,
    };
  }

  function formatJson(text, space) {
    const parsed = parseJsonText(text);
    if (!parsed.ok) return parsed;
    try {
      const value = printAst(parsed.ast, space == null ? 2 : space);
      return {
        ok: true,
        value,
        data: parsed.data,
        unsafe: parsed.unsafe,
        unwrapped: parsed.unwrapped,
      };
    } catch {
      return { ok: false, code: "depth" };
    }
  }

  function minifyJson(text) {
    const parsed = parseJsonText(text);
    if (!parsed.ok) return parsed;
    try {
      const value = printAst(parsed.ast, 0);
      return {
        ok: true,
        value,
        data: parsed.data,
        unsafe: parsed.unsafe,
        unwrapped: parsed.unwrapped,
      };
    } catch {
      return { ok: false, code: "depth" };
    }
  }

  function validateJson(text) {
    const parsed = parseJsonText(text);
    if (!parsed.ok) return parsed;
    return { ok: true, unwrapped: parsed.unwrapped, unsafe: parsed.unsafe };
  }

  function decodeUtf8Document(bytes, maxChars) {
    const cap = maxChars == null ? MAX_DOC_CHARS : maxChars;
    if (!bytes) return { ok: false, code: "encoding" };
    const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    if (view.byteLength > cap) return { ok: false, code: "size" };
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(view);
      if (text.length > cap) return { ok: false, code: "size" };
      return { ok: true, value: text };
    } catch {
      return { ok: false, code: "encoding" };
    }
  }

  function bytesToBase64(bytes) {
    const chunk = 0x8000;
    let binary = "";
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  function normalizeBase64(text) {
    const cleaned = String(text || "").replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
    if (!cleaned) return "";
    const rem = cleaned.length % 4;
    if (rem === 1) throw new Error("Invalid Base64");
    const padded = rem ? cleaned + "=".repeat(4 - rem) : cleaned;
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(padded)) throw new Error("Invalid Base64");
    return padded;
  }

  function base64ToBytes(text) {
    const padded = normalizeBase64(text);
    if (!padded) return new Uint8Array(0);
    let binary;
    try {
      binary = atob(padded);
    } catch {
      throw new Error("Invalid Base64");
    }
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function encodeBase64(text) {
    try {
      return { ok: true, value: bytesToBase64(toBytes(text)) };
    } catch (error) {
      return { ok: false, error: error && error.message ? error.message : "Encode failed" };
    }
  }

  function decodeBase64(text) {
    try {
      const bytes = base64ToBytes(text);
      try {
        return { ok: true, value: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
      } catch {
        return { ok: false, code: "binary", value: toHex(bytes) };
      }
    } catch {
      return { ok: false, code: "invalid" };
    }
  }

  function md5(input) {
    const bytes = toBytes(input);
    function cmn(q, a, b, x, s, t) {
      a = (a + q + x + t) | 0;
      return (((a << s) | (a >>> (32 - s))) + b) | 0;
    }
    function ff(a, b, c, d, x, s, t) { return cmn((b & c) | (~b & d), a, b, x, s, t); }
    function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & ~d), a, b, x, s, t); }
    function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
    function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | ~d), a, b, x, s, t); }

    const n = bytes.length;
    const padded = new Uint8Array((((n + 8) >>> 6) + 1) << 6);
    padded.set(bytes);
    padded[n] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(padded.length - 8, n * 8, true);

    let a = 1732584193;
    let b = -271733879;
    let c = -1732584194;
    let d = 271733878;
    const x = new Int32Array(16);

    for (let i = 0; i < padded.length; i += 64) {
      for (let j = 0; j < 16; j++) x[j] = view.getInt32(i + j * 4, true);
      const oa = a, ob = b, oc = c, od = d;

      a = ff(a, b, c, d, x[0], 7, -680876936);
      d = ff(d, a, b, c, x[1], 12, -389564586);
      c = ff(c, d, a, b, x[2], 17, 606105819);
      b = ff(b, c, d, a, x[3], 22, -1044525330);
      a = ff(a, b, c, d, x[4], 7, -176418897);
      d = ff(d, a, b, c, x[5], 12, 1200080426);
      c = ff(c, d, a, b, x[6], 17, -1473231341);
      b = ff(b, c, d, a, x[7], 22, -45705983);
      a = ff(a, b, c, d, x[8], 7, 1770035416);
      d = ff(d, a, b, c, x[9], 12, -1958414417);
      c = ff(c, d, a, b, x[10], 17, -42063);
      b = ff(b, c, d, a, x[11], 22, -1990404162);
      a = ff(a, b, c, d, x[12], 7, 1804603682);
      d = ff(d, a, b, c, x[13], 12, -40341101);
      c = ff(c, d, a, b, x[14], 17, -1502002290);
      b = ff(b, c, d, a, x[15], 22, 1236535329);

      a = gg(a, b, c, d, x[1], 5, -165796510);
      d = gg(d, a, b, c, x[6], 9, -1069501632);
      c = gg(c, d, a, b, x[11], 14, 643717713);
      b = gg(b, c, d, a, x[0], 20, -373897302);
      a = gg(a, b, c, d, x[5], 5, -701558691);
      d = gg(d, a, b, c, x[10], 9, 38016083);
      c = gg(c, d, a, b, x[15], 14, -660478335);
      b = gg(b, c, d, a, x[4], 20, -405537848);
      a = gg(a, b, c, d, x[9], 5, 568446438);
      d = gg(d, a, b, c, x[14], 9, -1019803690);
      c = gg(c, d, a, b, x[3], 14, -187363961);
      b = gg(b, c, d, a, x[8], 20, 1163531501);
      a = gg(a, b, c, d, x[13], 5, -1444681467);
      d = gg(d, a, b, c, x[2], 9, -51403784);
      c = gg(c, d, a, b, x[7], 14, 1735328473);
      b = gg(b, c, d, a, x[12], 20, -1926607734);

      a = hh(a, b, c, d, x[5], 4, -378558);
      d = hh(d, a, b, c, x[8], 11, -2022574463);
      c = hh(c, d, a, b, x[11], 16, 1839030562);
      b = hh(b, c, d, a, x[14], 23, -35309556);
      a = hh(a, b, c, d, x[1], 4, -1530992060);
      d = hh(d, a, b, c, x[4], 11, 1272893353);
      c = hh(c, d, a, b, x[7], 16, -155497632);
      b = hh(b, c, d, a, x[10], 23, -1094730640);
      a = hh(a, b, c, d, x[13], 4, 681279174);
      d = hh(d, a, b, c, x[0], 11, -358537222);
      c = hh(c, d, a, b, x[3], 16, -722521979);
      b = hh(b, c, d, a, x[6], 23, 76029189);
      a = hh(a, b, c, d, x[9], 4, -640364487);
      d = hh(d, a, b, c, x[12], 11, -421815835);
      c = hh(c, d, a, b, x[15], 16, 530742520);
      b = hh(b, c, d, a, x[2], 23, -995338651);

      a = ii(a, b, c, d, x[0], 6, -198630844);
      d = ii(d, a, b, c, x[7], 10, 1126891415);
      c = ii(c, d, a, b, x[14], 15, -1416354905);
      b = ii(b, c, d, a, x[5], 21, -57434055);
      a = ii(a, b, c, d, x[12], 6, 1700485571);
      d = ii(d, a, b, c, x[3], 10, -1894986606);
      c = ii(c, d, a, b, x[10], 15, -1051523);
      b = ii(b, c, d, a, x[1], 21, -2054922799);
      a = ii(a, b, c, d, x[8], 6, 1873313359);
      d = ii(d, a, b, c, x[15], 10, -30611744);
      c = ii(c, d, a, b, x[6], 15, -1560198380);
      b = ii(b, c, d, a, x[13], 21, 1309151649);
      a = ii(a, b, c, d, x[4], 6, -145523070);
      d = ii(d, a, b, c, x[11], 10, -1120210379);
      c = ii(c, d, a, b, x[2], 15, 718787259);
      b = ii(b, c, d, a, x[9], 21, -343485551);

      a = (a + oa) | 0;
      b = (b + ob) | 0;
      c = (c + oc) | 0;
      d = (d + od) | 0;
    }

    const out = new Uint8Array(16);
    const outView = new DataView(out.buffer);
    outView.setInt32(0, a, true);
    outView.setInt32(4, b, true);
    outView.setInt32(8, c, true);
    outView.setInt32(12, d, true);
    return toHex(out);
  }

  function sha256(input) {
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];
    const bytes = toBytes(input);
    const bitLen = bytes.length * 8;
    const withPad = bytes.length + 1 + 8;
    const paddedLen = ((withPad + 63) >> 6) << 6;
    const padded = new Uint8Array(paddedLen);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(paddedLen - 4, bitLen >>> 0, false);
    const extra = Math.floor(bitLen / 0x100000000);
    view.setUint32(paddedLen - 8, extra >>> 0, false);

    let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
    let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    const w = new Uint32Array(64);

    function rotr(n, x) { return (x >>> n) | (x << (32 - n)); }

    for (let i = 0; i < paddedLen; i += 64) {
      for (let t = 0; t < 16; t++) w[t] = view.getUint32(i + t * 4, false);
      for (let t = 16; t < 64; t++) {
        const s0 = rotr(7, w[t - 15]) ^ rotr(18, w[t - 15]) ^ (w[t - 15] >>> 3);
        const s1 = rotr(17, w[t - 2]) ^ rotr(19, w[t - 2]) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }
      let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (let t = 0; t < 64; t++) {
        const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + S1 + ch + K[t] + w[t]) >>> 0;
        const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + temp1) >>> 0;
        d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
      }
      h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
      h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
    }

    const out = new Uint8Array(32);
    const outView = new DataView(out.buffer);
    outView.setUint32(0, h0, false);
    outView.setUint32(4, h1, false);
    outView.setUint32(8, h2, false);
    outView.setUint32(12, h3, false);
    outView.setUint32(16, h4, false);
    outView.setUint32(20, h5, false);
    outView.setUint32(24, h6, false);
    outView.setUint32(28, h7, false);
    return toHex(out);
  }

  const api = {
    MAX_DOC_CHARS,
    MAX_JSON_DEPTH,
    PERF_BUDGET_1MB_MS,
    looksLikeJson,
    isSafeHttpUrl,
    isJsonFetchUrl,
    extractJsonPayload,
    formatJson,
    minifyJson,
    validateJson,
    decodeUtf8Document,
    encodeBase64,
    decodeBase64,
    md5,
    sha256,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.DevToolsCore = api;
})(typeof window !== "undefined" ? window : globalThis);
