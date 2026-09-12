const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;

function scoreVoice(v: SpeechSynthesisVoice) {
  const name = v.name.toLowerCase();
  const lang = v.lang.toLowerCase();
  let score = 0;

  if (lang === 'de-de') score += 100;
  else if (lang.startsWith('de')) score += 70;
  else return -1000;

  if (name.includes('natural')) score += 60;
  if (name.includes('neural')) score += 55;
  if (name.includes('premium')) score += 50;
  if (name.includes('google deutsch')) score += 45;
  if (name.includes('katja')) score += 42;
  if (name.includes('conrad')) score += 38;
  if (name.includes('microsoft')) score += 30;
  if (name.includes('google')) score += 25;
  if (!v.localService) score += 8;

  return score;
}

function bestGermanVoice() {
  if (!synth) return undefined;
  return [...synth.getVoices()]
    .filter(v => v.lang.toLowerCase().startsWith('de'))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
}

function tune(u: SpeechSynthesisUtterance) {
  if (!u.lang || !u.lang.toLowerCase().startsWith('de')) return;
  u.lang = 'de-DE';
  const v = bestGermanVoice();
  if (v) u.voice = v;
  u.pitch = 1;
  u.volume = 1;

  // The app used 0.82 as its normal speed, which sounds unnaturally slow
  // with many browser voices. Keep a real slow mode, but make normal mode
  // closer to conversational TELC German.
  if (u.rate >= 0.8) u.rate = 0.96;
  else if (u.rate >= 0.68) u.rate = 0.82;
  else u.rate = 0.72;
}

if (synth) {
  const originalSpeak = synth.speak.bind(synth);
  let voicesReady = synth.getVoices().length > 0;

  const refresh = () => {
    voicesReady = synth.getVoices().length > 0;
  };
  synth.addEventListener?.('voiceschanged', refresh);

  synth.speak = ((u: SpeechSynthesisUtterance) => {
    const run = () => {
      tune(u);
      originalSpeak(u);
    };

    if (voicesReady || synth.getVoices().length) {
      voicesReady = true;
      run();
      return;
    }

    // Chromium/Windows often loads voices a fraction later.
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (synth.getVoices().length || Date.now() - started > 900) {
        window.clearInterval(timer);
        voicesReady = synth.getVoices().length > 0;
        run();
      }
    }, 80);
  }) as typeof synth.speak;
}
