import type { TowerId } from "./game_types";

type Tone = { frequency: number; duration: number; gain: number; type: OscillatorType };

const TREATMENT_TONES: Record<TowerId, readonly Tone[]> = {
  doctor: [{ frequency: 540, duration: 0.055, gain: 0.055, type: "triangle" }],
  chemotherapy: [
    { frequency: 170, duration: 0.11, gain: 0.075, type: "sine" },
    { frequency: 390, duration: 0.075, gain: 0.035, type: "triangle" },
  ],
  t_cell: [{ frequency: 800, duration: 0.035, gain: 0.035, type: "square" }],
  radiation: [
    { frequency: 235, duration: 0.13, gain: 0.07, type: "sawtooth" },
    { frequency: 620, duration: 0.06, gain: 0.028, type: "sine" },
  ],
  antibody: [
    { frequency: 470, duration: 0.1, gain: 0.045, type: "sine" },
    { frequency: 705, duration: 0.07, gain: 0.03, type: "sine" },
  ],
};

let context: AudioContext | undefined;
let lastAttackAt = 0;
let activated = false;

function getContext(): AudioContext | undefined {
  if (!activated || typeof window === "undefined" || typeof AudioContext === "undefined")
    return undefined;
  context ??= new AudioContext();
  return context;
}

function playTone(tone: Tone, offset = 0): void {
  const audio = getContext();
  if (audio === undefined || audio.state !== "running") return;
  const start = audio.currentTime + offset;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = tone.type;
  oscillator.frequency.setValueAtTime(tone.frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(tone.gain, start + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + tone.duration + 0.01);
}

export function activateAudio(): void {
  activated = true;
  const audio = getContext();
  if (audio?.state === "suspended") void audio.resume();
}

export function playTreatmentSound(type: TowerId): void {
  const audio = getContext();
  if (audio === undefined || audio.state !== "running" || audio.currentTime - lastAttackAt < 0.055)
    return;
  lastAttackAt = audio.currentTime;
  TREATMENT_TONES[type].forEach((tone, index) => playTone(tone, index * 0.025));
}

export function playUiSound(kind: "place" | "wave" | "win" | "loss"): void {
  const tones: Record<typeof kind, readonly Tone[]> = {
    place: [{ frequency: 660, duration: 0.07, gain: 0.04, type: "triangle" }],
    wave: [
      { frequency: 440, duration: 0.08, gain: 0.045, type: "triangle" },
      { frequency: 660, duration: 0.1, gain: 0.045, type: "triangle" },
    ],
    win: [
      { frequency: 523, duration: 0.1, gain: 0.055, type: "triangle" },
      { frequency: 659, duration: 0.1, gain: 0.055, type: "triangle" },
      { frequency: 784, duration: 0.16, gain: 0.06, type: "triangle" },
    ],
    loss: [
      { frequency: 260, duration: 0.12, gain: 0.055, type: "sine" },
      { frequency: 185, duration: 0.18, gain: 0.055, type: "sine" },
    ],
  };
  tones[kind].forEach((tone, index) => playTone(tone, index * 0.1));
}
