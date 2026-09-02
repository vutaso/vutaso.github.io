/**
 * Fuzz / property tests — run with: node tests/fuzz.test.js
 */
const assert = require("assert");
const core = require("../core.js");

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260902);

function randInt(n) {
  return Math.floor(rand() * n);
}

function randString(len) {
  let out = "";
  for (let i = 0; i < len; i++) {
    const cp = randInt(96);
    out += cp < 90 ? String.fromCharCode(32 + cp) : "👋";
  }
  return out;
}

function genValid(depth) {
  const pick = randInt(depth > 4 ? 4 : 6);
  if (pick === 0) return "null";
  if (pick === 1) return rand() < 0.5 ? "true" : "false";
  if (pick === 2) return JSON.stringify(randString(randInt(8)));
  if (pick === 3) {
    const kind = randInt(4);
    if (kind === 0) return String(randInt(1e6) - 5e5);
    if (kind === 1) return String(9007199254740993 + randInt(50));
    if (kind === 2) return (rand() * 1000 - 500).toFixed(4);
    return String(randInt(20) - 10) + "e" + String(randInt(8) - 3);
  }
  if (pick === 4) {
    const n = randInt(4);
    const items = [];
    for (let i = 0; i < n; i++) items.push(genValid(depth + 1));
    return "[" + items.join(",") + "]";
  }
  const n = randInt(4);
  const keys = [];
  for (let i = 0; i < n; i++) {
    keys.push(JSON.stringify("k" + i + randString(2)) + ":" + genValid(depth + 1));
  }
  return "{" + keys.join(",") + "}";
}

let passed = 0;

function check(name, fn) {
  fn();
  passed++;
}

check("malformed noise never throws", () => {
  const junk = ["", " ", "{", "[", "}", "]", "{]", "[}", "{a:1}", "{'a':1}", "[1,]", '{"a":}', "01", "+1", "1.", ".1", "truee", "nul", '"unterminated', '"\\x"', '"\\u12"', "\u0000", "callback(", "<pre>", ")]}'", "1 2", '{"a":1}{"b":2}'];
  for (let i = 0; i < 250; i++) {
    junk.push(randString(randInt(80)));
  }
  junk.forEach((sample) => {
    let result;
    try {
      result = core.formatJson(sample);
    } catch (error) {
      throw new Error("threw on " + JSON.stringify(sample) + ": " + error.message);
    }
    assert.ok(result && typeof result === "object");
    assert.ok(typeof result.ok === "boolean");
    if (!result.ok) {
      assert.ok(["json", "empty", "depth"].includes(result.code), "bad code " + result.code);
      assert.ok(!result.error);
    }
  });
});

check("valid generated JSON round-trips semantically", () => {
  for (let i = 0; i < 80; i++) {
    const src = genValid(0);
    const formatted = core.formatJson(src);
    assert.ok(formatted.ok, "format failed for " + src);
    const minified = core.minifyJson(formatted.value);
    assert.ok(minified.ok);
    const again = core.formatJson(minified.value);
    assert.ok(again.ok);
    assert.strictEqual(core.minifyJson(again.value).value, minified.value);
    assert.deepStrictEqual(again.data, minified.data);
  }
});

check("deeply nested over the cap fails closed", () => {
  const deep = '{"a":'.repeat(core.MAX_JSON_DEPTH + 2) + "1" + "}".repeat(core.MAX_JSON_DEPTH + 2);
  const result = core.formatJson(deep);
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.code, "depth");
});

console.log(passed + " fuzz groups passed");
