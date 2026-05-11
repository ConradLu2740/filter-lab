import { create } from 'zustand';
import { ColorParams, Preset, ImageItem } from '../types';

interface AppState {
  // 导航状态
  currentPage: string;
  setCurrentPage: (page: string) => void;

  // 当前处理的图片
  currentImage: ImageItem | null;
  setCurrentImage: (image: ImageItem | null) => void;

  // 色彩参数
  colorParams: ColorParams;
  setColorParams: (params: Partial<ColorParams>) => void;
  resetColorParams: () => void;

  // 预设
  presets: Preset[];
  setPresets: (presets: Preset[]) => void;
  addPreset: (preset: Preset) => void;
  removePreset: (id: string) => void;

  // 加载状态
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // 错误信息
  error: string | null;
  setError: (error: string | null) => void;

  // Toast 消息
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

const DEFAULT_COLOR_PARAMS: ColorParams = {
  saturation: 1.0,
  contrast: 1.0,
  temperature: 0,
  tint: 0,
  shadow_boost: 0,
  highlight_rolloff: 0.1
};

export const useAppStore = create<AppState>((set) => ({
  // 导航状态
  currentPage: 'import',
  setCurrentPage: (page) => set({ currentPage: page }),

  // 当前图片
  currentImage: null,
  setCurrentImage: (image) => set({ currentImage: image }),

  // 色彩参数
  colorParams: DEFAULT_COLOR_PARAMS,
  setColorParams: (params) =>
    set((state) => ({
      colorParams: { ...state.colorParams, ...params }
    })),
  resetColorParams: () => set({ colorParams: DEFAULT_COLOR_PARAMS }),

  // 预设
  presets: [],
  setPresets: (presets) => set({ presets }),
  addPreset: (preset) =>
    set((state) => ({ presets: [...state.presets, preset] })),
  removePreset: (id) =>
    set((state) => ({
      presets: state.presets.filter((p) => p.id !== id)
    })),

  // 加载状态
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // 错误
  error: null,
  setError: (error) => set({ error }),

  // Toast
  toast: null,
  showToast: (message, type) => set({ toast: { message, type } }),
  hideToast: () => set({ toast: null })
}));
