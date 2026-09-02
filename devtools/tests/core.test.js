/**
 * Unit tests — run with: node tests/core.test.js
 */
const assert = require("assert");
const core = require("../core.js");

assert.strictEqual(core.md5(""), "d41d8cd98f00b204e9800998ecf8427e");
assert.strictEqual(core.md5("abc"), "900150983cd24fb0d6963f7d28e17f72");
assert.strictEqual(core.sha256(""), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
assert.strictEqual(core.sha256("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");

const crypto = require("crypto");
function nodeMd5(s) { return crypto.createHash("md5").update(s, "utf8").digest("hex"); }
function nodeSha(s) { return crypto.createHash("sha256").update(s, "utf8").digest("hex"); }

["Xin chào 👋", "The quick brown fox jumps over the lazy dog"].forEach((s) => {
  assert.strictEqual(core.md5(s), nodeMd5(s));
  assert.strictEqual(core.sha256(s), nodeSha(s));
});

[55, 56, 63, 64, 65].forEach((n) => {
  const s = "x".repeat(n);
  assert.strictEqual(core.md5(s), nodeMd5(s), "md5 len " + n);
  assert.strictEqual(core.sha256(s), nodeSha(s), "sha256 len " + n);
});

const pretty = core.formatJson('{"a":1,"b":[true,null]}');
assert.ok(pretty.ok);
assert.ok(pretty.value.includes("\n"));
assert.ok(pretty.value.includes("  "));
assert.deepStrictEqual(pretty.data, { a: 1, b: [true, null] });

assert.strictEqual(core.looksLikeJson('{"a":1}'), true);
assert.strictEqual(core.looksLikeJson("\uFEFF  [1]"), true);
assert.strictEqual(core.looksLikeJson("true"), true);
assert.strictEqual(core.looksLikeJson("false"), true);
assert.strictEqual(core.looksLikeJson("null"), true);
assert.strictEqual(core.looksLikeJson("hello world"), false);
assert.strictEqual(core.looksLikeJson("not json at all"), false);
assert.strictEqual(core.looksLikeJson("nullify"), false);
assert.strictEqual(core.looksLikeJson("xxxx"), false);

assert.strictEqual(core.isSafeHttpUrl("https://vutaso.com/devtools/"), true);
assert.strictEqual(core.isSafeHttpUrl("http://localhost:8765/"), true);
assert.strictEqual(core.isSafeHttpUrl("javascript:alert(1)"), false);
assert.strictEqual(core.isSafeHttpUrl("https://example.com/path?q=1"), true);
assert.strictEqual(core.isSafeHttpUrl(" not a url "), false);

const sniffStart = Date.now();
assert.strictEqual(core.looksLikeJson("x".repeat(200000)), false);
assert.ok(Date.now() - sniffStart < 5, "non-JSON sniff should be under 5ms");

const mini = core.minifyJson(pretty.value);
assert.ok(mini.ok);
assert.strictEqual(mini.value, '{"a":1,"b":[true,null]}');

const bad = core.formatJson("{not json");
assert.strictEqual(bad.ok, false);
assert.strictEqual(bad.code, "json");
assert.ok(!bad.error || !/Unexpected/.test(bad.error));

const emptyJson = core.formatJson("  \n");
assert.strictEqual(emptyJson.ok, false);
assert.strictEqual(emptyJson.code, "empty");

const encoded = core.encodeBase64("Xin chào 👋");
assert.ok(encoded.ok);
const decoded = core.decodeBase64(encoded.value);
assert.ok(decoded.ok);
assert.strictEqual(decoded.value, "Xin chào 👋");

const spaced = core.decodeBase64(encoded.value.replace(/(.{4})/g, "$1\n"));
assert.ok(spaced.ok);
assert.strictEqual(spaced.value, "Xin chào 👋");

const unpadded = core.decodeBase64("YQ");
assert.ok(unpadded.ok);
assert.strictEqual(unpadded.value, "a");

const jwtHeader = core.decodeBase64("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
assert.ok(jwtHeader.ok);
assert.strictEqual(jwtHeader.value, '{"alg":"HS256","typ":"JWT"}');

const urlSafe = core.decodeBase64("aGVsbG8_");
assert.ok(urlSafe.ok);
assert.strictEqual(urlSafe.value, "hello?");

const unpaddedUrl = core.decodeBase64("fn5-fg");
assert.ok(unpaddedUrl.ok);
assert.strictEqual(unpaddedUrl.value, "~~~~");

const urlBinary = core.decodeBase64("-_8");
const stdBinary = core.decodeBase64("+/8=");
assert.strictEqual(urlBinary.code, "binary");
assert.strictEqual(stdBinary.code, "binary");
assert.strictEqual(urlBinary.value, stdBinary.value);

const invalidB64 = core.decodeBase64("@@@");
assert.strictEqual(invalidB64.ok, false);
assert.strictEqual(invalidB64.code, "invalid");

const binaryB64 = core.decodeBase64("/9j/");
assert.strictEqual(binaryB64.ok, false);
assert.strictEqual(binaryB64.code, "binary");
assert.ok(/^[0-9a-f]+$/.test(binaryB64.value));

assert.strictEqual(core.isJsonFetchUrl("https://example.com/api/users"), true);
assert.strictEqual(core.isJsonFetchUrl("https://example.com/data.json"), true);
assert.strictEqual(core.isJsonFetchUrl("javascript:alert(1)"), false);
assert.strictEqual(core.isJsonFetchUrl("{ \"a\": 1 }"), false);
assert.strictEqual(core.isJsonFetchUrl("https://example.com/a https://example.com/b"), false);

const jsonp = core.formatJson('callback({"a":1,"ok":true})');
assert.ok(jsonp.ok);
assert.deepStrictEqual(jsonp.data, { a: 1, ok: true });

assert.ok(core.formatJson("true").ok);
assert.strictEqual(core.minifyJson(" true ").value, "true");
assert.ok(core.formatJson("null").ok);
assert.ok(core.formatJson('"hi"').ok);

const jsonpParen = core.formatJson('cb({"a":"hello)"})');
assert.ok(jsonpParen.ok);
assert.deepStrictEqual(jsonpParen.data, { a: "hello)" });

const jsonpAnd = core.formatJson('window.foo && window.foo({"a":1})');
assert.ok(jsonpAnd.ok);
assert.deepStrictEqual(jsonpAnd.data, { a: 1 });

const notJsonp = core.formatJson("alert(1)");
assert.strictEqual(notJsonp.ok, false);

const xssiThrow = core.formatJson("throw 1;{\"n\":4}");
assert.ok(xssiThrow.ok);
assert.deepStrictEqual(xssiThrow.data, { n: 4 });

const unsafe = core.formatJson('{"n":9007199254740993}');
assert.ok(unsafe.ok);
assert.strictEqual(unsafe.unsafe, true);
assert.strictEqual(unsafe.data.n, 9007199254740993n);
assert.ok(unsafe.value.includes("9007199254740993"));
assert.strictEqual(core.minifyJson('{"n": 9007199254740993 }').value, '{"n":9007199254740993}');

const unsafeExp = core.formatJson("1e20");
assert.ok(unsafeExp.ok);
assert.strictEqual(unsafeExp.unsafe, true);
assert.strictEqual(unsafeExp.value.trim(), "1e20");
assert.strictEqual(core.minifyJson("1e20").value, "1e20");

const unsafeInString = core.formatJson('{"n":"9007199254740993"}');
assert.ok(unsafeInString.ok);
assert.ok(!unsafeInString.unsafe);

const safeInt = core.formatJson('{"n":9007199254740991}');
assert.ok(safeInt.ok);
assert.ok(!safeInt.unsafe);
assert.strictEqual(safeInt.data.n, 9007199254740991);

const pos = core.formatJson("{not json");
assert.strictEqual(pos.ok, false);
assert.strictEqual(pos.code, "json");
assert.ok(pos.line >= 1);
assert.ok(pos.col >= 1);
assert.ok(pos.offset >= 0);
assert.ok(!pos.error);
assert.strictEqual(pos.reason, "expected_key");

const validOk = core.validateJson('{"a":1,"b":[true,null]}');
assert.ok(validOk.ok);

const trailObj = core.validateJson('{"a":1,}');
assert.strictEqual(trailObj.ok, false);
assert.strictEqual(trailObj.reason, "trailing_comma");

const trailArr = core.validateJson("[1,]");
assert.strictEqual(trailArr.reason, "trailing_comma");

const needColon = core.validateJson('{"a" 1}');
assert.strictEqual(needColon.reason, "expected_colon");

const unterm = core.validateJson('"hello');
assert.strictEqual(unterm.reason, "unterminated_string");

const extra = core.validateJson("true true");
assert.strictEqual(extra.reason, "trailing");

const notJson = core.validateJson("hello world");
assert.strictEqual(notJson.ok, false);
assert.strictEqual(notJson.reason, "not_json");

const deep = "[".repeat(8000) + "1" + "]".repeat(8000);
const deepR = core.formatJson(deep);
assert.strictEqual(deepR.ok, false);
assert.strictEqual(deepR.code, "depth");

const nestedOk = core.minifyJson("[[[[true]]]]");
assert.ok(nestedOk.ok);
assert.strictEqual(nestedOk.value, "[[[[true]]]]");

const redosStart = Date.now();
const redos = core.formatJson("callback(" + " ".repeat(30000) + "x");
assert.strictEqual(redos.ok, false);
assert.ok(Date.now() - redosStart < 50, "jsonp unwrap should not backtrack");

const xssi = core.formatJson(")]}'\n{\"n\":2}");
assert.ok(xssi.ok);
assert.deepStrictEqual(xssi.data, { n: 2 });
assert.strictEqual(xssi.unwrapped, true);

const htmlPre = core.formatJson('<html><body><pre>{"pre":true}</pre></body></html>');
assert.ok(htmlPre.ok);
assert.deepStrictEqual(htmlPre.data, { pre: true });
assert.strictEqual(htmlPre.unwrapped, true);

assert.strictEqual(pretty.unwrapped, false);
assert.strictEqual(jsonp.unwrapped, true);

assert.strictEqual(core.minifyJson("{}").value, "{}");
assert.strictEqual(core.minifyJson("[]").value, "[]");
assert.strictEqual(core.minifyJson(" \n\t ").code, "empty");

const uni = core.minifyJson('{"e":"👋","v":"Xin chào","esc":"a\\nb"}');
assert.ok(uni.ok);
assert.ok(uni.value.includes("👋"));
assert.ok(uni.value.includes("Xin chào"));
assert.ok(uni.value.includes("\\n"));

const floats = core.minifyJson('{"a":0.1,"b":1.0,"c":-2.5e-3,"d":-0}');
assert.ok(floats.ok);
assert.strictEqual(floats.value, '{"a":0.1,"b":1.0,"c":-2.5e-3,"d":-0}');

const order = core.minifyJson('{"z":1,"a":2}');
assert.strictEqual(order.value, '{"z":1,"a":2}');

const bom = core.minifyJson('\uFEFF{"a":1}');
assert.ok(bom.ok);
assert.strictEqual(bom.value, '{"a":1}');
assert.ok(!bom.unwrapped);

const crlf = core.minifyJson('{\r\n"a": 1\r\n}');
assert.strictEqual(crlf.value, '{"a":1}');

const formatted = core.formatJson('{"a":1,"b":[true,null]}');
const again = core.minifyJson(formatted.value);
assert.strictEqual(again.value, '{"a":1,"b":[true,null]}');
assert.deepStrictEqual(again.data, formatted.data);

const utfBad = core.decodeUtf8Document(new Uint8Array([0xc3]));
assert.strictEqual(utfBad.ok, false);
assert.strictEqual(utfBad.code, "encoding");
const utfOk = core.decodeUtf8Document(new TextEncoder().encode('{"ok":true}'));
assert.ok(utfOk.ok);
assert.strictEqual(utfOk.value, '{"ok":true}');
const utfSize = core.decodeUtf8Document(new Uint8Array(core.MAX_DOC_CHARS + 1));
assert.strictEqual(utfSize.code, "size");

function jsonOfSize(target) {
  const chunks = ['{"items":['];
  let size = chunks[0].length;
  for (let i = 0; size < target - 2; i++) {
    const row = (i ? "," : "") + '{"id":' + i + ',"n":9007199254740993}';
    chunks.push(row);
    size += row.length;
  }
  chunks.push("]}");
  return chunks.join("");
}

const oneMb = jsonOfSize(1024 * 1024);
assert.ok(oneMb.length >= 1024 * 1024);
const benchStart = Date.now();
const bench = core.formatJson(oneMb);
const benchMs = Date.now() - benchStart;
assert.ok(bench.ok, "1MB format should succeed");
assert.ok(bench.value.includes("9007199254740993"));
assert.ok(benchMs < core.PERF_BUDGET_1MB_MS, "1MB format " + benchMs + "ms exceeds " + core.PERF_BUDGET_1MB_MS + "ms");
const miniBig = core.minifyJson(bench.value);
assert.ok(miniBig.ok);
assert.ok(miniBig.value.includes("9007199254740993"));
assert.ok(!miniBig.value.includes("9007199254740992"));

console.log("core tests passed");
