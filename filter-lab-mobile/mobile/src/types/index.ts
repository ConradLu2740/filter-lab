// 色彩参数类型
export interface ColorParams {
  saturation: number;
  contrast: number;
  temperature: number;
  tint: number;
  shadow_boost: number;
  highlight_rolloff: number;
}

// 预设类型
export interface Preset {
  id: string;
  name: string;
  type: 'film' | 'custom';
  colorParams: ColorParams;
  createdAt: string;
  updatedAt: string;
}

// 分析结果类型
export interface AnalysisResult {
  film_profile: string;
  film_name: string;
  saturation: number;
  contrast: number;
  temperature: number;
  tint: number;
  shadow_boost: number;
  highlight_rolloff: number;
  confidence: number;
}

// 图像类型
export interface ImageItem {
  id: string;
  uri: string;
  width: number;
  height: number;
  name: string;
  createdAt: string;
}

// API 响应类型
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}
