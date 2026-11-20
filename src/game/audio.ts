let audioCtx: AudioContext | null = null;

export function playTone(
  enabled: boolean,
  freq: number,
  type: OscillatorType = 'sine',
  duration = 0.1,
  volume = 0.06,
  endFreq?: number
): void {
  if (!enabled) return;
  try {
    const AudioContextCtor =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    if (!audioCtx) audioCtx = new AudioContextCtor();
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (endFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), audioCtx.currentTime + duration);
    }
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    // Ignore audio context restrictions
  }
}

export const sfx = {
  slash: (enabled: boolean) => playTone(enabled, 250, 'sawtooth', 0.08, 0.055, 110),
  bow: (enabled: boolean) => playTone(enabled, 480, 'triangle', 0.09, 0.05, 220),
  gun: (enabled: boolean) => playTone(enabled, 170, 'square', 0.11, 0.065, 55),
  explosion: (enabled: boolean) => playTone(enabled, 110, 'sawtooth', 0.28, 0.09, 32),
  hit: (enabled: boolean) => playTone(enabled, 150, 'triangle', 0.07, 0.07, 68),
  mine: (enabled: boolean) => playTone(enabled, 620, 'square', 0.06, 0.045, 380),
  hurt: (enabled: boolean) => playTone(enabled, 125, 'sawtooth', 0.14, 0.07, 50),
  dash: (enabled: boolean) => playTone(enabled, 430, 'sine', 0.1, 0.055, 700),
  eat: (enabled: boolean) => playTone(enabled, 480, 'triangle', 0.11, 0.065, 680),
  pickup: (enabled: boolean) => playTone(enabled, 560, 'sine', 0.08, 0.05, 820),
  chest: (enabled: boolean) => {
    playTone(enabled, 523, 'triangle', 0.12, 0.06, 659);
    setTimeout(() => playTone(enabled, 784, 'triangle', 0.18, 0.06, 1046), 80);
  },
  build: (enabled: boolean) => playTone(enabled, 290, 'square', 0.13, 0.05, 540),
  levelUp: (enabled: boolean) => {
    playTone(enabled, 523, 'triangle', 0.14, 0.07, 659);
    setTimeout(() => playTone(enabled, 784, 'triangle', 0.22, 0.07, 1046), 90);
  },
  warHorn: (enabled: boolean) => {
    playTone(enabled, 146, 'sawtooth', 0.26, 0.07, 138);
    setTimeout(() => playTone(enabled, 196, 'sawtooth', 0.34, 0.07, 185), 180);
  },
  turret: (enabled: boolean) => playTone(enabled, 680, 'square', 0.06, 0.035, 320),
  stealAlert: (enabled: boolean) => playTone(enabled, 380, 'square', 0.14, 0.06, 260),
  gameOver: (enabled: boolean) => playTone(enabled, 190, 'sawtooth', 0.35, 0.08, 60),
};
