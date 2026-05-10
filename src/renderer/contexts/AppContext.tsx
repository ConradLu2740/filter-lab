/**
 * 全局应用状态管理 Context
 *
 * 集中管理当前页面、Python 后端就绪状态、图片路径、分析结果、
 * 滤镜参数、LUT 数据以及 Toast 消息通知等全局状态。
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import type { Page, AnalysisResult, FilterParams } from '../types'

/** Toast 消息项 */
export interface ToastItem {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

/** 全局应用上下文类型 */
export interface AppContextType {
  currentPage: Page
  setCurrentPage: (page: Page) => void
  pythonReady: boolean
  setPythonReady: (ready: boolean) => void
  currentImagePath: string
  setCurrentImagePath: (path: string) => void
  analysisResult: AnalysisResult | null
  setAnalysisResult: (result: AnalysisResult | null) => void
  filterParams: FilterParams | null
  setFilterParams: (params: FilterParams | null) => void
  lut3d: number[][][] | null
  setLut3d: (lut: number[][][] | null) => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showInfo: (message: string) => void
  toasts: ToastItem[]
  removeToast: (id: string) => void
}

const AppContext = createContext<AppContextType | null>(null)

/**
 * 生成唯一的 Toast ID
 *
 * 使用当前时间戳拼接随机数，确保并发场景下不会重复
 */
function generateToastId(): string {
  return `${Date.now()}-${Math.random()}`
}

/**
 * 全局应用状态 Provider
 *
 * 管理所有全局状态并通过 Context 向子组件提供访问能力。
 * Toast 消息会在添加后 3 秒自动移除。
 */
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<Page>('import')
  const [pythonReady, setPythonReady] = useState(false)
  const [currentImagePath, setCurrentImagePath] = useState('')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [filterParams, setFilterParams] = useState<FilterParams | null>(null)
  const [lut3d, setLut3d] = useState<number[][][] | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  /** 存储每个 toast 的自动移除定时器，便于在组件卸载时清理 */
  const timerMapRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  /**
   * 添加一条 Toast 消息
   *
   * @param type - 消息类型：success / error / info
   * @param message - 消息文本
   */
  const addToast = useCallback((type: ToastItem['type'], message: string) => {
    const id = generateToastId()
    const newToast: ToastItem = { id, type, message }

    setToasts((prev) => [...prev, newToast])

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      timerMapRef.current.delete(id)
    }, 3000)

    timerMapRef.current.set(id, timer)
  }, [])

  /**
   * 显示成功提示
   *
   * @param message - 提示文本
   */
  const showSuccess = useCallback(
    (message: string) => addToast('success', message),
    [addToast],
  )

  /**
   * 显示错误提示
   *
   * @param message - 提示文本
   */
  const showError = useCallback(
    (message: string) => addToast('error', message),
    [addToast],
  )

  /**
   * 显示信息提示
   *
   * @param message - 提示文本
   */
  const showInfo = useCallback(
    (message: string) => addToast('info', message),
    [addToast],
  )

  /**
   * 手动移除指定 Toast
   *
   * 同时清除该 Toast 对应的自动移除定时器，防止二次触发
   *
   * @param id - 要移除的 Toast ID
   */
  const removeToast = useCallback((id: string) => {
    const timer = timerMapRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timerMapRef.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value: AppContextType = {
    currentPage,
    setCurrentPage,
    pythonReady,
    setPythonReady,
    currentImagePath,
    setCurrentImagePath,
    analysisResult,
    setAnalysisResult,
    filterParams,
    setFilterParams,
    lut3d,
    setLut3d,
    showSuccess,
    showError,
    showInfo,
    toasts,
    removeToast,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

/**
 * 获取全局应用状态的 Hook
 *
 * 必须在 AppProvider 内部使用，否则会抛出异常
 *
 * @returns AppContextType 全局状态与操作方法
 */
export function useApp(): AppContextType {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp 必须在 AppProvider 内部使用')
  }
  return context
}

export default AppContext
