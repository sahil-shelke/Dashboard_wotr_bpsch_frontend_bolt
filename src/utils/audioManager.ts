// src/utils/audioManager.ts
class AudioManager {
  private static instance: AudioManager;
  private audio: HTMLAudioElement | null = null;
  private onStopCallback: (() => void) | null = null;

  private constructor() {} // Private constructor to prevent direct instantiation

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public async playAudio(src: string, onStop: () => void) {
    this.stopAudio(); // Stop any currently playing audio

    this.audio = new Audio(src);
    this.onStopCallback = onStop;

    this.audio.addEventListener('ended', () => {
      this.onStopCallback?.();
      this.audio = null;
    });

    await this.audio.play();
  }

  public stopAudio() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.onStopCallback?.();
      this.audio = null;
    }
  }
}

export default AudioManager.getInstance();
