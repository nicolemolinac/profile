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

  if (name.includes('natural')) score += 160;
  if (name.includes('neural')) score += 150;
  if (name.includes('premium')) score += 145;
  if (name.includes('enhanced')) score += 140;
  // Apple German voices: prefer the full/downloaded voices over the generic default.
  if (name.includes('anna')) score += 135;
  if (name.includes('siri')) score += 130;
  if (name.includes('petra')) score += 115;
  if (name.includes('helena')) score += 110;
  if (name.includes('katja')) score += 108;
  if (name.includes('conrad')) score += 105;
  if (name.includes('markus')) score += 100;
  if (name.includes('yannick')) score += 98;
  if (name.includes('google deutsch')) score += 95;
  if (name.includes('microsoft')) score += 65;
  if (name.includes('google')) score += 50;
  if (name.includes('apple') || uri.includes('apple')) score += 45;

  // Never deliberately select compact/legacy voices: those are the robotic ones.
  if (/compact|eloquence|espeak|pico|svox|festival/.test(`${name} ${uri}`)) score -= 500;
  return score;
}

function bestGermanVoice() {
  if (!synth) return undefined;
  const ranked = [...synth.getVoices()]
    .filter(v => v.lang.toLowerCase().startsWith('de'))
    .filter(v => !/compact|eloquence|espeak|pico|svox|festival/.test(`${v.name} ${v.voiceURI || ''}`.toLowerCase()))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a));
  // Important: do not return undefined merely because iOS does not expose a quality
  // label. That made Safari fall back to its generic/compact German voice.
  return ranked.find(v => scoreVoice(v) > 0);
}

function naturalRate(requested: number) {
  if (requested < 0.68) return mobile ? 0.82 : 0.84;
  if (requested < 0.8) return mobile ? 0.88 : 0.90;
  return mobile ? 0.91 : 0.94;
}

function tune(u: SpeechSynthesisUtterance, requestedRate = u.rate) {
  if (!u.lang || !u.lang.toLowerCase().startsWith('de')) return;
  u.lang = 'de-DE';
  const v = bestGermanVoice();
  if (v) u.voice = v;
  // A slightly lower pitch/rate avoids the clipped "navigation voice" effect on iOS.
  u.pitch = mobile ? 0.98 : 1;
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
    if (s.length <= 115) { chunks.push(s); continue; }
    const clauses = s.match(/[^,;:]+[,;:]?|[^,;:]+$/g) || [s];
    let current = '';
    for (const clause of clauses) {
      const c = clause.trim(); if (!c) continue;
      if (current && `${current} ${c}`.length > 105) { chunks.push(current); current = c; }
      else current = current ? `${current} ${c}` : c;
    }
    if (current) chunks.push(current);
  }
  return chunks.filter(Boolean);
}

if (synth) {
  const originalSpeak = synth.speak.bind(synth);
  let voicesReady = synth.getVoices().some(v => v.lang.toLowerCase().startsWith('de'));
  const refresh = () => { voicesReady = synth.getVoices().some(v => v.lang.toLowerCase().startsWith('de')); };
  synth.addEventListener?.('voiceschanged', refresh);

  function speakGermanNaturally(source: SpeechSynthesisUtterance) {
    const requestedRate = source.rate;
    const pieces = splitForNaturalProsody(source.text);
    if (pieces.length <= 1) { tune(source, requestedRate); originalSpeak(source); return; }
    let index = 0;
    const next = () => {
      if (index >= pieces.length) return;
      const part = new SpeechSynthesisUtterance(pieces[index++]);
      part.lang = 'de-DE'; part.rate = requestedRate; part.pitch = source.pitch; part.volume = source.volume;
      tune(part, requestedRate);
      part.onend = () => window.setTimeout(next, mobile ? 90 : 70);
      part.onerror = () => window.setTimeout(next, 50);
      originalSpeak(part);
    };
    next();
  }

  synth.speak = ((u: SpeechSynthesisUtterance) => {
    const run = () => u.lang?.toLowerCase().startsWith('de') ? speakGermanNaturally(u) : originalSpeak(u);
    if (voicesReady || synth.getVoices().some(v => v.lang.toLowerCase().startsWith('de'))) { voicesReady = true; run(); return; }
    // iOS can publish the downloaded high-quality voices late. Give it time rather
    // than locking in the first robotic fallback voice.
    const started = Date.now();
    const maxWait = mobile ? 4500 : 1600;
    const timer = window.setInterval(() => {
      if (synth.getVoices().some(v => v.lang.toLowerCase().startsWith('de')) || Date.now() - started > maxWait) {
        window.clearInterval(timer); refresh(); run();
      }
    }, 100);
  }) as typeof synth.speak;
}
