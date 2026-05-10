// src/shared/types.ts
// 主进程和渲染进程共享的 IPC 类型定义

/** 胶片模式匹配结果 */
export interface FilmMatch {
  name: string;
  description: string;
  confidence: number;  // 0-100
}

/** Python 后端返回的分析结果 */
export interface AnalysisResult {
  lut3d: number[][][];  // 33x33x33x3 的 LUT 数据
  params: FilterParams;
  metadata: {
    camera?: string;
    filmMode?: string;
    lens?: string;
    iso?: number;
    aperture?: string;
    shutterSpeed?: string;
  };
  previewBase64?: string;
  debugBase64?: string;  // 色卡检测调试图像（colorchart模式）
  qualityScore: number;  // 0-1
  colorCoverage: number; // 0-100%
  features?: {
    mean_rgb: number[];
    saturation_mean: number;
    contrast: number;
    film_matches: FilmMatch[];
  };
}

/** 滤镜参数化表示 */
export interface FilterParams {
  whiteBalance: {
    temperature: number;  // 2000-10000 K
    tint: number;         // -100 to 100
  };
  tone: {
    highlights: number;   // -100 to 100
    shadows: number;      // -100 to 100
    contrast: number;     // -100 to 100
  };
  color: {
    saturation: number;   // -100 to 100
    vibrance: number;     // -100 to 100
  };
  hueShifts: Record<string, number>;
  curve: {
    rgb: number[];
    red: number[];
    green: number[];
    blue: number[];
  };
}

/** 滤镜预设 */
export interface FilterPreset {
  id: string;
  name: string;
  version: string;
  camera?: string;
  filmMode?: string;
  created: string;
  params: FilterParams;
  lut3dSize: number;
  lut3dData: number[][][];
  thumbnail?: string;  // base64
}

/** 分析模式 */
export type AnalysisMode = 'single' | 'pair' | 'colorchart';

/** 导出格式 */
export type ExportFormat = 'cube' | 'preset' | 'icc';

/** IPC 通信消息类型 */
export interface IPCChannels {
  'python:analyze': {
    request: {
      imagePath: string;
      mode: AnalysisMode;
      referencePath?: string;  // 原图路径（pair模式）
    };
    response: AnalysisResult;
  };
  'python:apply-filter': {
    request: {
      imagePath: string;
      presetId: string;
    };
    response: {
      resultPath: string;
      previewBase64: string;
    };
  };
  'python:export-lut': {
    request: {
      lut3d: number[][][];
      format: string;
      outputPath: string;
      lutSize?: number;
      presetData?: Record<string, unknown>;
    };
    response: {
      success: boolean;
      outputPath?: string;
      error?: string;
    };
  };
  'python:batch-analyze': {
    request: {
      imagePaths: string[];
      mode: AnalysisMode;
    };
    response: {
      results: AnalysisResult[];
    };
  };
  'preset:save': {
    request: Omit<FilterPreset, 'id' | 'created'> & { id?: string };
    response: FilterPreset;
  };
  'preset:list': {
    request: void;
    response: FilterPreset[];
  };
  'preset:get': {
    request: string;
    response: FilterPreset | null;
  };
  'preset:delete': {
    request: string;
    response: boolean;
  };
  'preset:search': {
    request: string;
    response: FilterPreset[];
  };
  'python:status': {
    request: void;
    response: {
      ready: boolean;
      version: string;
    };
  };
  'python:adjust-preview': {
    request: {
      imagePath: string;
      params: FilterParams;
    };
    response: {
      previewBase64: string;
    };
  };
  'image:get-thumbnail': {
    request: { filePath: string };
    response: string;
  };
  'dialog:open-file': {
    request: void;
    response: string | null;
  };
  'dialog:open-files': {
    request: void;
    response: string[];
  };
  'dialog:select-folder': {
    request: void;
    response: string | null;
  };
  'dialog:save-file': {
    request: {
      defaultPath?: string;
      filters?: { name: string; extensions: string[] }[];
    };
    response: string | null;
  };
}

/** 进度通知 */
export interface ProgressUpdate {
  progress: number;
  total: number;
  current: string;
  status: 'processing' | 'completed' | 'error';
  message?: string;
}
