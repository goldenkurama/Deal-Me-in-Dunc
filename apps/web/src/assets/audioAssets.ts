export const DUNCAN_VOICE_ASSETS = Object.freeze([
  { key: "duncan-voice-1", url: "/assets/audio/sfx/duncan-voice-1.wav" },
  { key: "duncan-voice-2", url: "/assets/audio/sfx/duncan-voice-2.wav" },
  { key: "duncan-voice-3", url: "/assets/audio/sfx/duncan-voice-3.wav" }
] as const);

export const GAME_SFX = Object.freeze({
  menuClick: { key: "menu-click", url: "/assets/audio/sfx/menu-click.wav" },
  bet: { key: "bet", url: "/assets/audio/sfx/bet.wav" },
  coin: { key: "coin", url: "/assets/audio/sfx/coin.wav" },
  bust: { key: "bust", url: "/assets/audio/sfx/bust.wav" }
} as const);

export const GAME_MUSIC = Object.freeze({
  solitaire: {
    key: "solitaire-theme",
    url: "/assets/audio/music/solitaire.ogg"
  },
  rain: { key: "rain-ambience", url: "/assets/audio/music/rain.ogg" }
} as const);
