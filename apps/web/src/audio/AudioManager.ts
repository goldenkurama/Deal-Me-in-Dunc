import Phaser from "phaser";

export interface AudioSettings {
  musicVolume: number;
  effectsVolume: number;
  muted: boolean;
}

const STORAGE_KEY = "fox-blackjack.audio";
const DEFAULT_SETTINGS: AudioSettings = {
  musicVolume: 0.35,
  effectsVolume: 0.7,
  muted: false
};
const musicVolumeMultipliers = new Map<string, number>();
let sharedSettings: AudioSettings | null = null;

function supportsVolumeControl(
  sound: Phaser.Sound.BaseSound
): sound is Phaser.Sound.BaseSound & { setVolume(value: number): unknown } {
  return "setVolume" in sound && typeof sound.setVolume === "function";
}

function loadSettings(): AudioSettings {
  if (sharedSettings) return sharedSettings;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    sharedSettings = raw
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
      : { ...DEFAULT_SETTINGS };
  } catch {
    sharedSettings = { ...DEFAULT_SETTINGS };
  }

  return sharedSettings ?? { ...DEFAULT_SETTINGS };
}

export class AudioManager {
  constructor(private readonly scene: Phaser.Scene) {
    this.scene.sound.mute = loadSettings().muted;
  }

  getSettings(): AudioSettings {
    return { ...loadSettings() };
  }

  updateSettings(next: Partial<AudioSettings>): void {
    const current = loadSettings();
    sharedSettings = {
      ...current,
      ...next,
      musicVolume: Phaser.Math.Clamp(
        next.musicVolume ?? current.musicVolume,
        0,
        1
      ),
      effectsVolume: Phaser.Math.Clamp(
        next.effectsVolume ?? current.effectsVolume,
        0,
        1
      )
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sharedSettings));
    this.scene.sound.mute = sharedSettings.muted;

    for (const [key, multiplier] of musicVolumeMultipliers) {
      const sound = this.scene.sound.get(key);
      if (sound && supportsVolumeControl(sound)) {
        sound.setVolume(sharedSettings.musicVolume * multiplier);
      }
    }
  }

  playEffect(
    key: string,
    options: { volumeMultiplier?: number; rate?: number } = {}
  ): void {
    if (!this.scene.cache.audio.exists(key)) return;

    const settings = loadSettings();

    this.scene.sound.play(key, {
      volume: settings.effectsVolume * (options.volumeMultiplier ?? 1),
      rate: options.rate ?? 1
    });
  }

  playLoop(
    key: string,
    volumeMultiplier = 1
  ): Phaser.Sound.BaseSound | null {
    if (!this.scene.cache.audio.exists(key)) return null;

    musicVolumeMultipliers.set(key, volumeMultiplier);

    const existing = this.scene.sound.get(key);
    if (existing) return existing;

    const settings = loadSettings();

    const sound = this.scene.sound.add(key, {
      loop: true,
      volume: settings.musicVolume * volumeMultiplier
    });

    sound.play();
    return sound;
  }

  stopLoop(key: string): void {
    const sound = this.scene.sound.get(key);
    if (sound) {
      sound.stop();
      sound.destroy();
    }
    musicVolumeMultipliers.delete(key);
  }
}
