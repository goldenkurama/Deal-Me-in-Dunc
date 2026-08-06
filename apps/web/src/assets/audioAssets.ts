export const DUNCAN_VOICE_ASSETS = Object.freeze([
  { key: "duncan-voice-1", url: "/assets/audio/sfx/duncan-voice-1.wav" },
  { key: "duncan-voice-2", url: "/assets/audio/sfx/duncan-voice-2.wav" },
  { key: "duncan-voice-3", url: "/assets/audio/sfx/duncan-voice-3.wav" },
  { key: "duncan-voice-4", url: "/assets/audio/sfx/duncan-voice-4.wav" }
] as const);

export const GAME_SFX = Object.freeze({
  menuClick: { key: "menu-click", url: "/assets/audio/sfx/menu-click.wav" },
  bet: { key: "bet", url: "/assets/audio/sfx/bet.wav" },
  coin: { key: "coin", url: "/assets/audio/sfx/coin.wav" },
  bust: { key: "bust", url: "/assets/audio/sfx/bust.wav" }
} as const);

export const GAME_MUSIC = Object.freeze({
  switchWithMe: {
    key: "switch-with-me-theme",
    url: "/assets/audio/music/switch-with-me.ogg"
  },
  breakbeatChips: {
    key: "breakbeat-chips-theme",
    url: "/assets/audio/music/breakbeat-chips.ogg"
  },
  rain: { key: "rain-ambience", url: "/assets/audio/music/rain.ogg" }
} as const);
