import Phaser from "phaser";

export interface AudioSettings {
  musicVolume: number;
  effectsVolume: number;
  muted: boolean;
}

const STORAGE_KEY = "fox-blackjack.audio";

export class AudioManager {
  private settings: AudioSettings;

  constructor(private readonly scene: Phaser.Scene) {
    this.settings = this.loadSettings();
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  updateSettings(next: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...next };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    this.scene.sound.mute = this.settings.muted;
  }

  playEffect(key: string): void {
    if (!this.scene.cache.audio.exists(key)) return;

    this.scene.sound.play(key, {
      volume: this.settings.effectsVolume
    });
  }

  playLoop(key: string): Phaser.Sound.BaseSound | null {
    if (!this.scene.cache.audio.exists(key)) return null;

    const sound = this.scene.sound.add(key, {
      loop: true,
      volume: this.settings.musicVolume
    });

    sound.play();
    return sound;
  }

  private loadSettings(): AudioSettings {
    const fallback: AudioSettings = {
      musicVolume: 0.35,
      effectsVolume: 0.7,
      muted: false
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
    } catch {
      return fallback;
    }
  }
}
