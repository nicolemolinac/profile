const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
const mobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

function scoreVoice(v: SpeechSynthesisVoice) {
  const name = v.name.toLowerCase();
  const uri = (v.voiceURI || '').toLowerCase();
  const lang = v.lang.toLowerCase();
  let score = 0;

  if (lang === 'de-de') score += 110;
  else if (lang.startsWith('de')) score += 75;
  else return -1000;

  // Quality markers exposed by Windows/Chromium and some Android engines.
  if (name.includes('natural')) score += 100;
  if (name.includes('neural')) score += 95;
  if (name.includes('premium')) score += 90;
  if (name.includes('enhanced')) score += 85;

  // High quality German voices commonly exposed by the major OSes.
  if (name.includes('katja')) score += 82;
  if (name.includes('conrad')) score += 78;
  if (name.includes('anna')) score += 80;
  if (name.includes('petra')) score += 76;
  if (name.includes('helena')) score += 74;
  if (name.includes('markus')) score += 72;
  if (name.includes('yannick')) score += 70;
  if (name.includes('siri')) score += 88;
  if (name.includes('google deutsch')) score += 70;
  if (name.includes('microsoft')) score += 52;
  if (name.includes('google')) score += 42;
  if (name.includes('apple') || uri.includes('apple')) score += 38;

  // Compact / legacy engines are usually the robotic voices users notice on mobile.
  if (/compact|eloquence|espeak|pico|svox|festival/.test(`${name} ${uri}`)) score -= 120;
  if (mobile && !v.localService && /natural|neural|premium|enhanced/.test(name)) score += 20;

  return score;
}

function bestGermanVoice() {
  if (!synth) return undefined;
  const ranked = [...synth.getVoices()]
    .filter(v => v.lang.toLowerCase().startsWith('de'))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a));
  if (!ranked.length) return undefined;

  // On phones, do not force a clearly low-quality compact voice. Let the OS default
  // German voice handle it instead; iOS/Android often choose a better downloaded voice.
  if (mobile && scoreVoice(ranked[0]) < 105) return undefined;
  return ranked[0];
}

function naturalRate(requested: number) {
  // A slightly slower mobile rate sounds substantially less synthetic on short words.
  if (requested < 0.68) return mobile ? 0.74 : 0.78;
  if (requested < 0.8) return mobile ? 0.84 : 0.88;
  return mobile ? 0.90 : 0.96;
}

function tune(u: SpeechSynthesisUtterance, requestedRate = u.rate) {
  if (!u.lang || !u.lang.toLowerCase().startsWith('de')) return;
  u.lang = 'de-DE';
  const v = bestGermanVoice();
  if (v) u.voice = v;
  u.pitch = mobile ? 1.02 : 1;
  u.volume = 1;
  u.rate = naturalRate(requestedRate);
}

function splitForNaturalProsody(text: string) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= 75) return [clean];

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
  let voicesReady = synth.getVoices().some(v => v.lang.toLowerCase().startsWith('de'));

  const refresh = () => {
    voicesReady = synth.getVoices().some(v => v.lang.toLowerCase().startsWith('de'));
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
      if (index >= pieces.length) return;
      const part = new SpeechSynthesisUtterance(pieces[index++]);
      part.lang = 'de-DE';
      part.rate = requestedRate;
      part.pitch = source.pitch;
      part.volume = source.volume;
      tune(part, requestedRate);
      part.onend = () => window.setTimeout(next, mobile ? 110 : 80);
      part.onerror = () => window.setTimeout(next, 50);
      originalSpeak(part);
    };
    next();
  }

  synth.speak = ((u: SpeechSynthesisUtterance) => {
    const run = () => {
      if (u.lang?.toLowerCase().startsWith('de')) speakGermanNaturally(u);
      else originalSpeak(u);
    };

    if (voicesReady || synth.getVoices().some(v => v.lang.toLowerCase().startsWith('de'))) {
      voicesReady = true;
      run();
      return;
    }

    // Mobile browsers often expose downloaded system voices noticeably later than desktop.
    // Wait a little longer before falling back so iPhone/iPad can surface the natural voice.
    const started = Date.now();
    const maxWait = mobile ? 2600 : 1200;
    const timer = window.setInterval(() => {
      if (synth.getVoices().some(v => v.lang.toLowerCase().startsWith('de')) || Date.now() - started > maxWait) {
        window.clearInterval(timer);
        refresh();
        run();
      }
    }, 80);
  }) as typeof synth.speak;
}
