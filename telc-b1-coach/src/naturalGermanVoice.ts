const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;

function scoreVoice(v: SpeechSynthesisVoice) {
  const name = v.name.toLowerCase();
  const lang = v.lang.toLowerCase();
  let score = 0;

  if (lang === 'de-de') score += 100;
  else if (lang.startsWith('de')) score += 70;
  else return -1000;

  // Prefer the same high-quality voices that already sound natural on single words.
  if (name.includes('natural')) score += 80;
  if (name.includes('neural')) score += 75;
  if (name.includes('premium')) score += 70;
  if (name.includes('enhanced')) score += 65;
  if (name.includes('google deutsch')) score += 58;
  if (name.includes('katja')) score += 55;
  if (name.includes('conrad')) score += 52;
  if (name.includes('microsoft')) score += 42;
  if (name.includes('google')) score += 35;
  if (!v.localService) score += 10;

  return score;
}

function bestGermanVoice() {
  if (!synth) return undefined;
  return [...synth.getVoices()]
    .filter(v => v.lang.toLowerCase().startsWith('de'))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
}

function naturalRate(requested: number) {
  // Listening has two explicit modes in the UI: normal (.82) and slow (.62).
  // Keep that distinction, but avoid the stretched synthetic sound caused by
  // extremely slow browser TTS playback.
  if (requested < 0.68) return 0.78;
  if (requested < 0.8) return 0.88;
  return 0.96;
}

function tune(u: SpeechSynthesisUtterance, requestedRate = u.rate) {
  if (!u.lang || !u.lang.toLowerCase().startsWith('de')) return;
  u.lang = 'de-DE';
  const v = bestGermanVoice();
  if (v) u.voice = v;
  u.pitch = 1;
  u.volume = 1;
  u.rate = naturalRate(requestedRate);
}

function splitForNaturalProsody(text: string) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= 75) return [clean];

  // Long Web Speech utterances often become flat/robotic. Feed the exact same
  // natural German voice short sentence/clause-sized units instead. Punctuation
  // stays attached so the TTS engine still produces a real pause/intonation.
  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
  const chunks: string[] = [];
  for (const sentence of sentences) {
    const s = sentence.trim();
    if (s.length <= 115) {
      chunks.push(s);
      continue;
    }
    const clauses = s.match(/[^,;:]+[,;:]?|[^,;:]+$/g) || [s];
    let current = '';
    for (const clause of clauses) {
      const c = clause.trim();
      if (!c) continue;
      if (current && `${current} ${c}`.length > 105) {
        chunks.push(current);
        current = c;
      } else {
        current = current ? `${current} ${c}` : c;
      }
    }
    if (current) chunks.push(current);
  }
  return chunks.filter(Boolean);
}

if (synth) {
  const originalSpeak = synth.speak.bind(synth);
  let voicesReady = synth.getVoices().length > 0;

  const refresh = () => {
    voicesReady = synth.getVoices().length > 0;
  };
  synth.addEventListener?.('voiceschanged', refresh);

  function speakGermanNaturally(source: SpeechSynthesisUtterance) {
    const requestedRate = source.rate;
    const pieces = splitForNaturalProsody(source.text);
    if (pieces.length <= 1) {
      tune(source, requestedRate);
      originalSpeak(source);
      return;
    }

    let index = 0;
    const next = () => {
      if (index >= pieces.length) {
        source.onend?.(new SpeechSynthesisEvent('end', { utterance: source }));
        return;
      }
      const part = new SpeechSynthesisUtterance(pieces[index++]);
      part.lang = 'de-DE';
      part.rate = requestedRate;
      part.pitch = source.pitch;
      part.volume = source.volume;
      tune(part, requestedRate);
      part.onend = () => window.setTimeout(next, 80);
      part.onerror = () => window.setTimeout(next, 40);
      originalSpeak(part);
    };
    next();
  }

  synth.speak = ((u: SpeechSynthesisUtterance) => {
    const run = () => {
      if (u.lang?.toLowerCase().startsWith('de')) speakGermanNaturally(u);
      else originalSpeak(u);
    };

    if (voicesReady || synth.getVoices().length) {
      voicesReady = true;
      run();
      return;
    }

    // Chromium/Windows often exposes the better German voices shortly after load.
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (synth.getVoices().length || Date.now() - started > 1200) {
        window.clearInterval(timer);
        voicesReady = synth.getVoices().length > 0;
        run();
      }
    }, 80);
  }) as typeof synth.speak;
}
