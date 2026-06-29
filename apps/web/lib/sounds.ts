// Sound utility using Web Audio API for programmatic tone generation
// No external audio files needed - generates tones on the fly

let audioContext: AudioContext | null = null;
let audioEnabled = false;

export function initAudio() {
  if (typeof window === "undefined") return;
  if (audioContext) return;
  
  audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Resume on first user interaction
  const resume = () => {
    if (audioContext?.state === "suspended") {
      audioContext.resume();
    }
    audioEnabled = true;
    document.removeEventListener("click", resume);
    document.removeEventListener("keydown", resume);
  };
  
  document.addEventListener("click", resume, { once: true });
  document.addEventListener("keydown", resume, { once: true });
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.1) {
  if (!audioContext || !audioEnabled) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

// Sound effects
export function playBidSound() {
  // Cash register "ching" - two quick high notes
  playTone(1200, 0.08, "square", 0.08);
  setTimeout(() => playTone(1600, 0.08, "square", 0.06), 60);
}

export function playWarningSound() {
  // Double beep for timer warning
  playTone(800, 0.1, "sine", 0.1);
  setTimeout(() => playTone(800, 0.1, "sine", 0.1), 150);
}

export function playSoldSound() {
  // Triumphant chord - major triad
  playTone(523.25, 0.3, "sine", 0.08);  // C5
  setTimeout(() => playTone(659.25, 0.3, "sine", 0.08), 30);  // E5
  setTimeout(() => playTone(783.99, 0.4, "sine", 0.08), 60);  // G5
}

export function playUnsoldSound() {
  // Soft downward tone
  playTone(400, 0.2, "sine", 0.08);
  setTimeout(() => playTone(300, 0.3, "sine", 0.06), 100);
  setTimeout(() => playTone(220, 0.4, "sine", 0.04), 200);
}

export function playErrorSound() {
  // Low buzz for errors
  playTone(150, 0.2, "sawtooth", 0.1);
}