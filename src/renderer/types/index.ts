// src/renderer/types/index.ts
/**
 * 渲染进程类型定义
 */

import type { AnalysisResult, FilterPreset, FilterParams, AnalysisMode, ExportFormat, ProgressUpdate } from '@shared/types'

export type { AnalysisResult, FilterPreset, FilterParams, AnalysisMode, ExportFormat, ProgressUpdate }

/** 导航页面 */
export type Page = 'import' | 'analyze' | 'adjust' | 'library' | 'export'

/** 导入的照片 */
export interface ImportedImage {
  id: string
  path: string
  name: string
  thumbnail?: string
  metadata?: {
    camera?: string
    filmMode?: string
    dimensions?: { width: number; height: number }
  }
}

/** 分析状态 */
export interface AnalysisState {
  mode: AnalysisMode
  isAnalyzing: boolean
  result: AnalysisResult | null
  error: string | null
}

/** 应用状态 */
export interface AppState {
  currentPage: Page
  importedImages: ImportedImage[]
  selectedImageId: string | null
  analysis: AnalysisState
  presets: FilterPreset[]
  selectedPresetId: string | null
  pythonReady: boolean
  pythonVersion: string
}
