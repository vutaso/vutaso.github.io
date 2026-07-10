window.Speech = (() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const SPEECH_LOCALES = {
    en: 'en-US',
    vi: 'vi-VN',
    jp: 'ja-JP',
    zh: 'zh-CN',
  };

  let recognition = null;
  let listening = false;
  let micBtn = null;
  let inputEl = null;
  let getLocale = () => 'vi';
  let onTranscript = null;
  let onError = null;
  let onListeningChange = null;

  let currentSpeakBtn = null;
  let speaking = false;
  let voicesReady = false;

  let listenBase = '';
  let sessionFinal = '';

  const getSpeechLocale = (locale) => {
    const code = window.I18n?.normalizeLocale?.(locale) || locale || 'en';
    return SPEECH_LOCALES[code] || SPEECH_LOCALES.en;
  };

  const isSTTSupported = () => !!SpeechRecognition;
  const isTTSSupported = () => typeof window.speechSynthesis !== 'undefined';

  const t = (key) => window.I18n?.t?.(key) || key;

  const ensureVoices = () => {
    if (!isTTSSupported()) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) voicesReady = true;
  };

  if (isTTSSupported()) {
    ensureVoices();
    window.speechSynthesis.addEventListener('voiceschanged', ensureVoices);
  }

  const pickVoice = (lang) => {
    const voices = window.speechSynthesis.getVoices();
    const primary = lang.split('-')[0];
    return voices.find((v) => v.lang === lang)
      || voices.find((v) => v.lang.replace('_', '-').startsWith(primary))
      || null;
  };

  const syncMicUI = () => {
    if (!micBtn) return;
    micBtn.classList.toggle('is-listening', listening);
    micBtn.setAttribute('aria-pressed', listening ? 'true' : 'false');
    const label = listening ? t('voiceInputListening') : t('voiceInput');
    micBtn.title = label;
    micBtn.setAttribute('aria-label', label);
    const icon = micBtn.querySelector('i');
    if (icon) {
      icon.className = listening ? 'fa-solid fa-microphone-lines' : 'fa-solid fa-microphone';
    }
  };

  const syncSpeakBtn = (btn, active) => {
    if (!btn) return;
    btn.classList.toggle('is-speaking', active);
    const label = active ? t('speakStop') : t('speak');
    btn.title = label;
    btn.setAttribute('aria-label', label);
    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = active ? 'fa-solid fa-stop' : 'fa-solid fa-volume-high';
    }
  };

  const clearSpeakState = () => {
    if (currentSpeakBtn) syncSpeakBtn(currentSpeakBtn, false);
    currentSpeakBtn = null;
    speaking = false;
  };

  const stopSpeaking = () => {
    if (!isTTSSupported()) return;
    window.speechSynthesis.cancel();
    clearSpeakState();
  };

  const resetListenSession = () => {
    listenBase = '';
    sessionFinal = '';
  };

  const composeInputValue = (interim = '') => {
    let out = listenBase;
    if (sessionFinal) {
      const needsSpace = out.length > 0 && !/\s$/.test(out);
      out += (needsSpace ? ' ' : '') + sessionFinal;
    }
    if (interim) {
      const needsSpace = out.length > 0 && !/\s$/.test(out) && !/^\s/.test(interim);
      out += (needsSpace ? ' ' : '') + interim;
    }
    return out;
  };

  const updateLiveTranscript = (interim = '') => {
    if (!inputEl) return;
    inputEl.value = composeInputValue(interim);
    inputEl.classList.toggle('is-voice-interim', !!interim);
    inputEl.scrollTop = inputEl.scrollHeight;
    if (typeof onTranscript === 'function') onTranscript();
  };

  const finalizeListenSession = () => {
    if (inputEl) {
      inputEl.value = composeInputValue('');
      inputEl.classList.remove('is-voice-interim');
      if (typeof onTranscript === 'function') onTranscript();
    }
    resetListenSession();
  };

  const setupRecognition = () => {
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          sessionFinal += transcript;
        } else {
          interim += transcript;
        }
      }
      updateLiveTranscript(interim);
    };

    rec.onerror = (event) => {
      const code = event.error;
      if (code === 'aborted' || code === 'no-speech') return;
      stopListening();
      if (typeof onError === 'function') {
        onError(code === 'not-allowed'
          ? t('toastSpeechPermission')
          : t('toastSpeechError'));
      }
    };

    rec.onend = () => {
      if (!listening) return;
      try {
        rec.start();
      } catch {
        listening = false;
        syncMicUI();
        if (typeof onListeningChange === 'function') onListeningChange(false);
      }
    };

    return rec;
  };

  const init = ({
    micButton,
    input,
    getLocale: getLocaleFn,
    onTranscript: onTranscriptFn,
    onError: onErrorFn,
    onListeningChange: onListeningChangeFn,
  } = {}) => {
    micBtn = micButton || null;
    inputEl = input || null;
    getLocale = typeof getLocaleFn === 'function' ? getLocaleFn : getLocale;
    onTranscript = onTranscriptFn || null;
    onError = onErrorFn || null;
    onListeningChange = onListeningChangeFn || null;

    if (micBtn) {
      if (isSTTSupported()) micBtn.classList.remove('hidden');
      else micBtn.classList.add('hidden');
      syncMicUI();
    }
  };

  const stopListening = () => {
    listening = false;
    if (recognition) {
      try { recognition.stop(); } catch { /* ignore */ }
      recognition = null;
    }
    finalizeListenSession();
    syncMicUI();
    if (typeof onListeningChange === 'function') onListeningChange(false);
  };

  const startListening = () => {
    if (!isSTTSupported() || !inputEl) {
      if (typeof onError === 'function') onError(t('toastSpeechUnsupported'));
      return;
    }
    stopSpeaking();
    listenBase = inputEl.value;
    sessionFinal = '';
    recognition = setupRecognition();
    if (!recognition) return;

    recognition.lang = getSpeechLocale(getLocale());
    listening = true;
    syncMicUI();

    try {
      recognition.start();
      if (typeof onListeningChange === 'function') onListeningChange(true);
    } catch {
      listening = false;
      recognition = null;
      syncMicUI();
      if (typeof onError === 'function') onError(t('toastSpeechError'));
    }
  };

  const toggleListening = () => {
    if (listening) stopListening();
    else startListening();
  };

  const isListening = () => listening;

  const speak = (text, locale) => {
    if (!isTTSSupported()) {
      if (typeof onError === 'function') onError(t('toastSpeechUnsupported'));
      return false;
    }
    const trimmed = (text || '').trim();
    if (!trimmed) return false;

    stopSpeaking();
    if (!voicesReady) ensureVoices();

    const lang = getSpeechLocale(locale);
    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.lang = lang;
    const voice = pickVoice(lang);
    if (voice) utterance.voice = voice;
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onend = () => clearSpeakState();
    utterance.onerror = () => clearSpeakState();

    speaking = true;
    window.speechSynthesis.speak(utterance);
    return true;
  };

  const toggleSpeak = (text, btn, locale) => {
    if (speaking && currentSpeakBtn === btn) {
      stopSpeaking();
      return;
    }
    if (speaking) stopSpeaking();
    if (!speak(text, locale)) return;
    currentSpeakBtn = btn;
    syncSpeakBtn(btn, true);
  };

  const isSpeaking = () => speaking;

  const syncLabels = () => {
    syncMicUI();
    if (currentSpeakBtn && document.contains(currentSpeakBtn)) {
      syncSpeakBtn(currentSpeakBtn, speaking);
    } else if (speaking) {
      clearSpeakState();
    }
  };

  return {
    isSTTSupported,
    isTTSSupported,
    getSpeechLocale,
    init,
    toggleListening,
    stopListening,
    isListening,
    speak,
    stopSpeaking,
    toggleSpeak,
    isSpeaking,
    syncLabels,
  };
})();
