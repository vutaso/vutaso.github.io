const Translator = {
  _apiKey: null,

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

  async translate(text, sourceLang, targetLang, options = {}) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Please enter your DeepSeek API key first.');
    }

    if (!text || !text.trim()) {
      throw new Error('No text to translate.');
    }

    // Validate text length (rough estimate: 1 token ≈ 4-5 chars)
    const maxChars = 50000; // ~10k tokens safe buffer
    if (text.length > maxChars) {
      throw new Error(`Text too long (${text.length.toLocaleString()} characters). Maximum is ${maxChars.toLocaleString()} characters. Please split into smaller parts.`);
    }

    // Extract options with defaults
    const domain = options.domain || 'general';
    const tone = options.tone || 'professional';
    const glossary = options.glossary || '';
    const context = options.context || '';

    // Build system prompt with domain and tone
    const sourceHint = sourceLang === 'auto' ? '' : ` from ${sourceLang}`;
    let systemPrompt = `You are a professional ${domain} translator specialized in ${targetLang}.

Translate the following text${sourceHint} to ${targetLang} with a ${tone} tone.

Return ONLY the translated text, with no explanations, notes, or additional commentary.

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

    let response;
    // A fixed 60s timeout is too tight once output approaches the 8192
    // max_tokens ceiling (large texts easily take longer than that to
    // generate) — scale the budget with input size, capped at 3 minutes.
    const timeoutMs = Math.min(180000, 60000 + Math.floor(text.length / 200) * 1000);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          temperature: 0.3,
          max_tokens: 8192
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error(`Translation timed out after ${Math.round(timeoutMs / 1000)} seconds. Try translating a shorter text.`);
      }
      throw new Error('Network error. Please check your internet connection and try again.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error?.message || `API error (${response.status})`;
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check and try again.');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait and try again.');
      }
      throw new Error(message);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const translated = choice?.message?.content?.trim();

    if (!translated) {
      throw new Error('No translation received from API.');
    }

    // Keep the truncation warning out of the translated text itself \u2014
    // callers copy/save this text verbatim (clipboard, History), so a
    // hardcoded English note baked into e.g. a Vietnamese translation
    // would corrupt the actual output. Surface it as a separate flag instead.
    return {
      text: translated,
      truncated: choice.finish_reason === 'length'
    };
  }
};
