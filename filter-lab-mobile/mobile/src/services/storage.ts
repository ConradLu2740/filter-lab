import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({
  id: 'filterlab-storage'
});

// 存储键
const STORAGE_KEYS = {
  PRESETS: 'local_presets',
  SETTINGS: 'user_settings',
  RECENT_IMAGES: 'recent_images'
};

// 预设存储
export const presetStorage = {
  getAll: (): string | null => {
    return storage.getString(STORAGE_KEYS.PRESETS);
  },

  save: (presets: string): void => {
    storage.set(STORAGE_KEYS.PRESETS, presets);
  },

  clear: (): void => {
    storage.delete(STORAGE_KEYS.PRESETS);
  }
};

// 设置存储
export const settingsStorage = {
  get: (): string | null => {
    return storage.getString(STORAGE_KEYS.SETTINGS);
  },

  save: (settings: string): void => {
    storage.set(STORAGE_KEYS.SETTINGS, settings);
  }
};
