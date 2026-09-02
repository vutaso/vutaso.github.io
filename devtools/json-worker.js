/* global DevToolsCore */
importScripts("core.js" + self.location.search);

self.onmessage = function (event) {
  const msg = event.data || {};
  const id = msg.id;
  try {
    const result = msg.validate
      ? DevToolsCore.validateJson(msg.text)
      : msg.minify
        ? DevToolsCore.minifyJson(msg.text)
        : DevToolsCore.formatJson(msg.text, msg.space);
    self.postMessage({
      id: id,
      result: {
        ok: result.ok,
        value: result.value,
        data: result.data,
        unsafe: result.unsafe,
        unwrapped: result.unwrapped,
        code: result.code,
        reason: result.reason,
        line: result.line,
        col: result.col,
        offset: result.offset,
      },
    });
  } catch {
    self.postMessage({ id: id, result: { ok: false, code: "depth" } });
  }
};
