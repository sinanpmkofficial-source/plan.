export const BULLET_TYPES = ['task', 'note', 'event'] as const;

export const PRAYERS_CONFIG = [
  { key: 'fajr', label: 'Fajr', time: 'Dawn' },
  { key: 'dhuhr', label: 'Dhuhr', time: 'Noon' },
  { key: 'asr', label: 'Asr', time: 'After' },
  { key: 'maghrib', label: 'Maghrib', time: 'Sunset' },
  { key: 'isha', label: 'Isha', time: 'Night' },
] as const;
