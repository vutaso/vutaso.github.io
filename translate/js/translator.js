const Translator = {
  _apiKey: null,

  // Long texts are split into chunks that are translated sequentially and
  // reassembled — a single request can return at most max_tokens (8192)
  // of output, so anything beyond ~10k characters would otherwise come
  // back truncated.
  MAX_CHARS: 200000,
  CHUNK_SIZE: 10000,
  _MAX_SPLIT_DEPTH: 2,
  // While streaming, the request is only aborted when NO data arrives for
  // this long — a long-running generation that keeps producing tokens is
  // perfectly healthy and must not be cut off.
  _STREAM_IDLE_TIMEOUT: 90000,
  // When the source language is 'auto', the model is asked to prefix its
  // response with a [LANG: ...] tag which is stripped before display.
  _DETECT_TAG_RE: /^\s*\[LANG:\s*([^\]\n]{1,40})\]\s*\n?/i,
  // Give up waiting for the detect tag after this many streamed characters
  // (the longest possible tag is ~50 chars; past this it isn't coming).
  _DETECT_TAG_MAX_LEN: 60,

  getApiKey() {
    if (this._apiKey) return this._apiKey;
    this._apiKey = localStorage.getItem('deepseek_api_key') || '';
    return this._apiKey;
  },

  setApiKey(key) {
    this._apiKey = key;
    localStorage.setItem('deepseek_api_key', key);
  },

  clearApiKey() {
    this._apiKey = null;
    localStorage.removeItem('deepseek_api_key');
  },

  // Quick key check against the lightweight /models endpoint (no tokens
  // consumed). Throws with `unverified = true` when the key COULDN'T be
  // checked (network/server hiccup) — callers may still accept the key.
  // A plain throw (no flag) means the key is definitively invalid.
  async validateApiKey(key) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    let response;
    try {
      response = await fetch('https://api.deepseek.com/v1/models', {
        headers: { 'Authorization': `Bearer ${key}` },
        signal: controller.signal
      });
    } catch (err) {
      const e = new Error('Could not verify the key (network error) — it was saved anyway.');
      e.unverified = true;
      throw e;
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.status === 401) {
      throw new Error('Invalid API key — please check it and try again.');
    }
    if (!response.ok) {
      const e = new Error(`Could not verify the key (API error ${response.status}) — it was saved anyway.`);
      e.unverified = true;
      throw e;
    }
  },

  // ===== Cancellation (job-based) =====
  // A "job" groups one or more in-flight requests so they can be cancelled
  // together: a single Text/File translation is one implicit job, while a
  // parallel batch run shares one job across all its concurrent requests.
  // cancel() aborts ALL active jobs — the app only ever runs one
  // user-facing operation at a time.
  _jobs: new Set(),

  createJob() {
    const job = { cancelled: false, controllers: new Set() };
    this._jobs.add(job);
    return job;
  },

  endJob(job) {
    this._jobs.delete(job);
  },

  cancel() {
    for (const job of this._jobs) {
      job.cancelled = true;
      for (const controller of job.controllers) {
        controller.abort();
      }
    }
  },

  _throwIfCancelled(job) {
    if (job.cancelled) {
      const err = new Error('Translation cancelled.');
      err.cancelled = true;
      throw err;
    }
  },

  // Runs `worker(item)` over `items` with at most `concurrency` workers
  // active at once. A worker returning `false` stops the whole pool early
  // (used for cancellation): no new items are picked up by any worker,
  // while already-running ones wind down. Workers are expected to handle
  // their own per-item errors.
  async _runPool(items, worker, concurrency) {
    let nextIndex = 0;
    let stopped = false;
    const runnerCount = Math.min(concurrency, items.length);
    const runners = [];
    for (let i = 0; i < runnerCount; i++) {
      runners.push((async () => {
        while (!stopped && nextIndex < items.length) {
          const item = items[nextIndex++];
          const keepGoing = await worker(item);
          if (keepGoing === false) {
            stopped = true;
            return;
          }
        }
      })());
    }
    await Promise.all(runners);
  },

  // options:
  //   domain, tone, glossary, context — prompt customization
  //   job — cancellation token (shared across calls in a batch run);
  //         a fresh implicit job is created when omitted
  //   onProgress({current, total}) — fired when moving to the next chunk
  //   onStream({text, chunkCurrent, chunkTotal}) — fired on every streamed
  //     token; `text` is ALWAYS the full translation so far (completed
  //     chunks + current partial), so callers can render it verbatim.
  //   onDetectedLang(lang) — fired once when the source language is
  //     auto-detected (sourceLang === 'auto' only)
  // Returns { text, truncated, chunks?, detectedLang }.
  async translate(text, sourceLang, targetLang, options = {}) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Please enter your DeepSeek API key first.');
    }

    if (!text || !text.trim()) {
      throw new Error('No text to translate.');
    }

    if (text.length > this.MAX_CHARS) {
      throw new Error(`Text too long (${text.length.toLocaleString()} characters). Maximum is ${this.MAX_CHARS.toLocaleString()} characters. Please split into smaller parts.`);
    }

    const job = options.job || this.createJob();
    const implicitJob = !options.job;

    // Auto-detected source language — reported to the UI once and
    // attached to the return value (e.g. for History).
    let detectedLang = null;
    const reportDetected = (lang) => {
      if (detectedLang || !lang) return;
      detectedLang = lang;
      if (typeof options.onDetectedLang === 'function') {
        options.onDetectedLang(lang);
      }
    };

    // Token usage is summed across every API call of this translation
    // (all chunks, truncation re-splits and retries — everything billed).
    const usageTotal = { promptTokens: 0, completionTokens: 0 };

    const ctx = {
      apiKey,
      systemPrompt: this._buildSystemPrompt(sourceLang, targetLang, options),
      job,
      detectLang: sourceLang === 'auto',
      onDetectedLang: reportDetected,
      onUsage: (u) => {
        usageTotal.promptTokens += u.prompt_tokens || 0;
        usageTotal.completionTokens += u.completion_tokens || 0;
      }
    };

    const buildResult = (text, truncated, chunks) => ({
      text,
      truncated,
      chunks,
      detectedLang,
      usage: {
        promptTokens: usageTotal.promptTokens,
        completionTokens: usageTotal.completionTokens,
        totalTokens: usageTotal.promptTokens + usageTotal.completionTokens
      }
    });

    try {
      const chunks = this._splitIntoChunks(text, this.CHUNK_SIZE);
      const reportProgress = (current, total) => {
        if (typeof options.onProgress === 'function') {
          options.onProgress({ current, total });
        }
      };

      if (chunks.length === 1) {
        reportProgress(1, 1);
        const result = await this._translateChunk(ctx, chunks[0].text, 0,
          this._makeStreamEmitter(options, '', 1, 1));
        return buildResult(result.text, result.truncated, 1);
      }

      let combined = '';
      let anyTruncated = false;

      for (let i = 0; i < chunks.length; i++) {
        reportProgress(i + 1, chunks.length);
        // Stop between chunks when the user cancelled while the previous
        // chunk was still translating.
        this._throwIfCancelled(job);
        const chunk = chunks[i];
        // Whitespace-only chunks (stray separators) pass through untouched —
        // no point spending an API call on them.
        if (!chunk.text.trim()) {
          combined += chunk.sepBefore + chunk.text;
          continue;
        }
        const result = await this._translateChunk(ctx, chunk.text, 0,
          this._makeStreamEmitter(options, combined + chunk.sepBefore, i + 1, chunks.length));
        combined += chunk.sepBefore + result.text;
        if (result.truncated) anyTruncated = true;
      }

      return buildResult(combined, anyTruncated, chunks.length);
    } finally {
      if (implicitJob) this.endJob(job);
    }
  },

  // Wraps the caller's onStream callback so every emission carries the
  // full text translated so far (completed chunks + separator + partial
  // current chunk) — the UI renders it verbatim, and a mid-stream retry
  // simply re-emits from an empty partial without corrupting the display.
  _makeStreamEmitter(options, prefix, chunkCurrent, chunkTotal) {
    if (typeof options.onStream !== 'function') return undefined;
    return {
      emit: (partial) => options.onStream({ text: prefix + partial, chunkCurrent, chunkTotal })
    };
  },

  _buildSystemPrompt(sourceLang, targetLang, options = {}) {
    // Extract options with defaults
    const domain = options.domain || 'general';
    const tone = options.tone || 'professional';
    const glossary = options.glossary || '';
    const context = options.context || '';

    // Build system prompt with domain and tone
    const sourceHint = sourceLang === 'auto' ? '' : `The source text is in ${sourceLang}. `;
    let systemPrompt = `You are a professional ${domain} translator. Your task is to translate text into ${targetLang}.

${sourceHint}Translate the user text into ${targetLang} with a ${tone} tone.

Return ONLY the translated text in ${targetLang}, with no explanations, notes, or additional commentary. The entire output must be in ${targetLang}.

Important:
- Preserve the original formatting, line breaks, and paragraph structure
- Use standard terminology for the ${domain} domain
- Maintain cultural nuances and idioms naturally
- If specialized terms appear, translate them appropriately for the domain`;

    // Add glossary if provided
    if (glossary && glossary.trim()) {
      systemPrompt += `\n\nGlossary (use these translations):`;
      glossary.split('\n').forEach(line => {
        // Split on the FIRST "=" only — naive split('=') would mangle any
        // entry where the term or translation itself contains "=" (e.g. "A=B testing").
        const separatorIndex = line.indexOf('=');
        if (separatorIndex === -1) return;
        const en = line.slice(0, separatorIndex).trim();
        const translatedTerm = line.slice(separatorIndex + 1).trim();
        if (en && translatedTerm) {
          systemPrompt += `\n- ${en} = ${translatedTerm}`;
        }
      });
    }

    // Add context if provided
    if (context && context.trim()) {
      systemPrompt += `\n\nAdditional context:\n${context}`;
    }

    // Ask for the detected language as a machine-readable first-line tag
    // (stripped before the text reaches the user). Placed last for salience.
    if (sourceLang === 'auto') {
      systemPrompt += `\n\nThe source language was not specified — auto-detect it. The VERY FIRST line of your response must be exactly: [LANG: <detected source language name>]. The translation starts on the following line.`;
    }

    return systemPrompt;
  },

  // Translates one chunk. If the API still runs out of output tokens
  // (finish_reason === 'length'), the chunk is split in half and each
  // half is translated separately, recursively (bounded depth).
  async _translateChunk(ctx, text, depth, stream) {
    const result = await this._callApiWithRetry(ctx, text, stream?.emit);

    if (!result.truncated || depth >= this._MAX_SPLIT_DEPTH || text.length < 2000) {
      return result;
    }

    const splitAt = this._findSplitPoint(text, Math.ceil(text.length / 2));
    // The whitespace right before the cut belongs between the two halves —
    // detach it so neither half is sent to the API with stray edge
    // whitespace (which the API would trim anyway), and re-insert the
    // original separator when joining the translations.
    const head = text.slice(0, splitAt);
    const joiner = head.match(/\s+$/)?.[0] || '';
    const firstText = joiner ? head.slice(0, head.length - joiner.length) : head;

    if (!firstText.trim()) {
      const second = await this._translateChunk(ctx, text.slice(splitAt), depth + 1,
        stream ? { emit: (p) => stream.emit(joiner + p) } : undefined);
      return { text: joiner + second.text, truncated: second.truncated };
    }

    const first = await this._translateChunk(ctx, firstText, depth + 1, stream);
    const second = await this._translateChunk(ctx, text.slice(splitAt), depth + 1,
      stream ? { emit: (p) => stream.emit(first.text + joiner + p) } : undefined);

    return { text: first.text + joiner + second.text, truncated: second.truncated };
  },

  // A multi-chunk translation is only as strong as its weakest chunk, so
  // transient failures (rate limit, server errors, network hiccups, stream
  // stalls) get a couple of retries with backoff instead of failing the
  // whole job.
  async _callApiWithRetry(ctx, text, onPartial) {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // Covers cancellation that happened during a backoff sleep
      this._throwIfCancelled(ctx.job);
      try {
        return await this._callApi(ctx, text, onPartial);
      } catch (err) {
        if (!err.retryable || attempt === maxAttempts) throw err;
        // The next attempt restarts the chunk from scratch — reset any
        // partial text already streamed for it.
        if (onPartial) onPartial('');
        await new Promise(resolve => setTimeout(resolve, 1500 * attempt));
      }
    }
  },

  async _callApi(ctx, text, onPartial) {
    const streaming = typeof onPartial === 'function';

    // While auto-detecting, buffer the stream until the [LANG: ...] tag is
    // parsed (or ruled out) so the tag never reaches the user's screen.
    let emit = onPartial;
    if (streaming && ctx.detectLang) {
      emit = this._makeTagStripper(onPartial, ctx.onDetectedLang);
    }

    // Non-streaming: one overall deadline scaled to input size (a fixed
    // 60s budget is too tight once output approaches the 8192 max_tokens
    // ceiling). Streaming: the deadline is an *idle* limit that is
    // re-armed on every arriving chunk of data, so only a genuinely
    // stalled connection is aborted.
    const timeoutMs = streaming
      ? this._STREAM_IDLE_TIMEOUT
      : Math.min(180000, 60000 + Math.floor(text.length / 200) * 1000);

    const controller = new AbortController();
    // Register the controller on the job so cancel() can abort it
    ctx.job.controllers.add(controller);
    let timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      let response;
      try {
        response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ctx.apiKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: ctx.systemPrompt },
              { role: 'user', content: text }
            ],
            temperature: 0.3,
            max_tokens: 8192,
            stream: streaming,
            // Ask the API to append a usage summary event at the end of
            // the stream (ignored by the parser if it never arrives)
            ...(streaming ? { stream_options: { include_usage: true } } : {})
          }),
          signal: controller.signal
        });
      } catch (err) {
        // An abort caused by the user takes precedence over the timeout
        // interpretation of the same AbortError.
        this._throwIfCancelled(ctx.job);
        if (err.name === 'AbortError') {
          throw new Error(`Translation timed out after ${Math.round(timeoutMs / 1000)} seconds. Try translating a shorter text.`);
        }
        const networkError = new Error('Network error. Please check your internet connection and try again.');
        networkError.retryable = true;
        throw networkError;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error?.message || `API error (${response.status})`;
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check and try again.');
        }
        if (response.status === 429) {
          const rateLimitError = new Error('Rate limit exceeded. Please wait and try again.');
          rateLimitError.retryable = true;
          throw rateLimitError;
        }
        if (response.status >= 500) {
          const serverError = new Error(message);
          serverError.retryable = true;
          throw serverError;
        }
        throw new Error(message);
      }

      // Non-streaming fallback (no onStream callback provided, or the
      // environment gave us no readable body): plain JSON response.
      if (!streaming || !response.body) {
        let data;
        try {
          data = await response.json();
        } catch (err) {
          this._throwIfCancelled(ctx.job);
          if (err.name === 'AbortError') {
            throw new Error(`Translation timed out after ${Math.round(timeoutMs / 1000)} seconds. Try translating a shorter text.`);
          }
          throw new Error('Failed to read the API response.');
        }
        const choice = data.choices?.[0];
        let translated = choice?.message?.content?.trim();

        if (!translated) {
          throw new Error('No translation received from API.');
        }

        if (data.usage && ctx.onUsage) {
          ctx.onUsage(data.usage);
        }

        if (ctx.detectLang) {
          const stripped = this._stripDetectTag(translated);
          if (stripped.lang) ctx.onDetectedLang(stripped.lang);
          translated = stripped.text;
          if (!translated) {
            throw new Error('No translation received from API.');
          }
        }

        // Keep the truncation warning out of the translated text itself —
        // callers copy/save this text verbatim (clipboard, History), so a
        // hardcoded English note baked into e.g. a Vietnamese translation
        // would corrupt the actual output. Surface it as a separate flag instead.
        return {
          text: translated,
          truncated: choice.finish_reason === 'length'
        };
      }

      // Streaming path — read SSE events, reporting the accumulated text of
      // this chunk after every delta.
      let result;
      try {
        result = await this._readStream(response, emit, () => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        });
      } catch (err) {
        this._throwIfCancelled(ctx.job);
        if (err.name === 'AbortError') {
          const stallError = new Error(`Translation stalled — no data received for ${Math.round(timeoutMs / 1000)} seconds. Please try again.`);
          stallError.retryable = true;
          throw stallError;
        }
        const streamError = new Error('Network error while streaming. Please check your internet connection and try again.');
        streamError.retryable = true;
        throw streamError;
      }

      if (ctx.detectLang) {
        // The tag itself never reaches the UI (the stripper holds it
        // back), but the raw accumulated text still contains it.
        const stripped = this._stripDetectTag(result.text);
        if (stripped.lang) ctx.onDetectedLang(stripped.lang);
        result.text = stripped.text;
      }

      if (result.usage && ctx.onUsage) {
        ctx.onUsage(result.usage);
      }

      if (!result.text) {
        throw new Error('No translation received from API.');
      }
      return result;
    } finally {
      clearTimeout(timeoutId);
      ctx.job.controllers.delete(controller);
    }
  },

  // Removes a leading [LANG: ...] tag from a completed response.
  _stripDetectTag(text) {
    const m = text.match(this._DETECT_TAG_RE);
    if (!m) return { text, lang: null };
    return { text: text.slice(m[0].length).trim(), lang: m[1].trim() };
  },

  // Buffers a stream's accumulated text until the [LANG: ...] tag is
  // either found (reported via onTag, then hidden from all emissions) or
  // ruled out (past the max tag length — emit everything as-is).
  _makeTagStripper(onPartial, onTag) {
    let resolved = false;
    let prefixLen = 0;
    return (accumulatedRaw) => {
      if (!resolved) {
        const m = accumulatedRaw.match(this._DETECT_TAG_RE);
        if (m) {
          prefixLen = m[0].length;
          resolved = true;
          onTag(m[1].trim());
        } else if (accumulatedRaw.length > this._DETECT_TAG_MAX_LEN) {
          resolved = true;
        } else {
          return; // keep buffering — nothing shown yet
        }
      }
      onPartial(accumulatedRaw.slice(prefixLen));
    };
  },

  // Reads a Server-Sent Events stream (OpenAI/DeepSeek compatible),
  // invoking onPartial with the accumulated text after every content
  // delta and calling onActivity whenever bytes arrive (so the caller can
  // re-arm its idle timeout).
  async _readStream(response, onPartial, onActivity) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulated = '';
    let truncated = false;
    let usage = null;

    const processLine = (line) => {
      if (!line.startsWith('data:')) return; // blank lines, comments, keepalives
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') return;
      let json;
      try {
        json = JSON.parse(payload);
      } catch {
        return; // ignore a malformed event instead of killing the stream
      }
      // Final usage summary event (stream_options.include_usage) — arrives
      // with an empty choices array
      if (json.usage) usage = json.usage;
      const choice = json.choices?.[0];
      const delta = choice?.delta?.content;
      if (delta) {
        accumulated += delta;
        onPartial(accumulated);
      }
      if (choice?.finish_reason === 'length') truncated = true;
    };

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      onActivity();
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, idx).replace(/\r$/, '');
        buffer = buffer.slice(idx + 1);
        processLine(line);
      }
    }
    // Flush any bytes still held by the streaming decoder, plus a
    // possible trailing line without a final newline.
    buffer += decoder.decode();
    if (buffer.trim()) processLine(buffer);

    return { text: accumulated.trim(), truncated, usage };
  },

  // Split text into chunks of at most maxChunkSize characters, breaking at
  // paragraph boundaries whenever possible so each chunk still reads as
  // coherent prose. Each chunk records the separator that preceded it in
  // the original text (sepBefore) so the translated pieces can be
  // reassembled with the original paragraph structure intact.
  _splitIntoChunks(text, maxChunkSize) {
    if (text.length <= maxChunkSize) {
      return [{ text, sepBefore: '' }];
    }

    // Alternating [text, separator, text, separator, ...]
    const parts = text.split(/(\n{2,})/);
    const units = [];
    for (let i = 0; i < parts.length; i += 2) {
      if (!parts[i]) continue; // empty edge piece — its separator attaches to the next unit
      units.push({ text: parts[i], sepBefore: i > 0 ? parts[i - 1] : '' });
    }

    // Break up any single unit that is larger than a whole chunk
    const expanded = [];
    for (const unit of units) {
      if (unit.text.length > maxChunkSize) {
        expanded.push(...this._splitOversized(unit.text, maxChunkSize, unit.sepBefore));
      } else {
        expanded.push(unit);
      }
    }

    // Greedily pack units into chunks
    const chunks = [];
    for (const unit of expanded) {
      const last = chunks[chunks.length - 1];
      if (last && (last.text + unit.sepBefore + unit.text).length <= maxChunkSize) {
        last.text += unit.sepBefore + unit.text;
      } else {
        chunks.push({ text: unit.text, sepBefore: unit.sepBefore });
      }
    }
    return chunks;
  },

  // Fallback splitter for a single over-long block with no paragraph
  // breaks: prefer line breaks, then sentence ends, then spaces, and only
  // cut mid-text when there is no better option. Boundary whitespace is
  // moved into the next piece's sepBefore so nothing is lost on reassembly.
  _splitOversized(text, maxSize, sepBefore) {
    const pieces = [];
    let remaining = text;
    let nextSepBefore = sepBefore;
    while (remaining.length > maxSize) {
      const splitAt = this._findSplitPoint(remaining, maxSize);
      let head = remaining.slice(0, splitAt);
      const trailingWhitespace = head.match(/\s+$/)?.[0] || '';
      if (trailingWhitespace) {
        head = head.slice(0, head.length - trailingWhitespace.length);
      }
      pieces.push({ text: head, sepBefore: nextSepBefore });
      nextSepBefore = trailingWhitespace;
      remaining = remaining.slice(splitAt);
    }
    if (remaining) {
      pieces.push({ text: remaining, sepBefore: nextSepBefore });
    }
    return pieces;
  },

  // Find the best position to cut `text` so the first piece is at most
  // maxSize long. The cut happens after the boundary character, so no
  // content is lost when the pieces are later concatenated.
  _findSplitPoint(text, maxSize) {
    const window = text.slice(0, maxSize);
    // Don't accept boundaries too close to the start — that would produce
    // tiny fragments and needlessly multiply the number of API calls.
    const minUseful = maxSize * 0.3;

    let idx = window.lastIndexOf('\n\n');
    if (idx >= minUseful) return idx + 2;

    idx = window.lastIndexOf('\n');
    if (idx >= minUseful) return idx + 1;

    // Sentence-ending punctuation (including CJK) followed by an optional
    // closing quote/bracket and whitespace
    const sentenceEnd = /[.!?。！？…]["'”’)\]]*[\s\n]/g;
    let match;
    let lastEnd = -1;
    while ((match = sentenceEnd.exec(window)) !== null) {
      lastEnd = match.index + match[0].length;
    }
    if (lastEnd >= minUseful) return lastEnd;

    idx = window.lastIndexOf(' ');
    if (idx >= minUseful) return idx + 1;

    return maxSize;
  }
};
