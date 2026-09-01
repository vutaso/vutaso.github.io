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
assert.strictEqual(unsafe.data.n, 9007199254740992);

const unsafeExp = core.formatJson("1e20");
assert.ok(unsafeExp.ok);
assert.strictEqual(unsafeExp.unsafe, true);

const unsafeInString = core.formatJson('{"n":"9007199254740993"}');
assert.ok(unsafeInString.ok);
assert.ok(!unsafeInString.unsafe);

const safeInt = core.formatJson('{"n":9007199254740991}');
assert.ok(safeInt.ok);
assert.ok(!safeInt.unsafe);

const pos = core.formatJson("{not json");
assert.strictEqual(pos.ok, false);
assert.strictEqual(pos.code, "json");
assert.ok(pos.line >= 1);
assert.ok(pos.col >= 1);
assert.ok(!pos.error);

const deep = "[".repeat(8000) + "1" + "]".repeat(8000);
const deepR = core.formatJson(deep);
assert.strictEqual(deepR.ok, false);
assert.strictEqual(deepR.code, "depth");

const redosStart = Date.now();
const redos = core.formatJson("callback(" + " ".repeat(30000) + "x");
assert.strictEqual(redos.ok, false);
assert.ok(Date.now() - redosStart < 50, "jsonp unwrap should not backtrack");

const xssi = core.formatJson(")]}'\n{\"n\":2}");
assert.ok(xssi.ok);
assert.deepStrictEqual(xssi.data, { n: 2 });

const htmlPre = core.formatJson('<html><body><pre>{"pre":true}</pre></body></html>');
assert.ok(htmlPre.ok);
assert.deepStrictEqual(htmlPre.data, { pre: true });

console.log("90 passed");
