// src/renderer/pages/AdjustPage.tsx
/**
 * 参数微调页面
 *
 * 调整滤镜参数，实时预览效果
 * 支持：白平衡、色调、色彩、色相偏移
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import ImageViewer from '../components/ImageViewer'
import NamePrompt from '../components/NamePrompt'
import { useApp } from '../contexts/AppContext'
import type { FilterParams } from '../types'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}

/**
 * 通用滑块组件
 */
const Slider: React.FC<SliderProps> = ({ label, value, min, max, step = 1, onChange }) => {
  return (
    <div style={sliderStyles.container}>
      <div style={sliderStyles.header}>
        <span style={sliderStyles.label}>{label}</span>
        <span style={sliderStyles.value}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={sliderStyles.input}
      />
    </div>
  )
}

const sliderStyles: Record<string, React.CSSProperties> = {
  container: {
    marginBottom: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  value: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    minWidth: '40px',
    textAlign: 'right',
  },
  input: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    backgroundColor: 'var(--bg-tertiary)',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none' as const,
  },
}

const defaultParams: FilterParams = {
  whiteBalance: { temperature: 5500, tint: 0 },
  tone: { highlights: 0, shadows: 0, contrast: 0 },
  color: { saturation: 0, vibrance: 0 },
  hueShifts: {},
  curve: { rgb: [], red: [], green: [], blue: [] },
}

const hueColors = [
  { key: 'red', label: '红', color: '#e74c3c' },
  { key: 'orange', label: '橙', color: '#e67e22' },
  { key: 'yellow', label: '黄', color: '#f1c40f' },
  { key: 'green', label: '绿', color: '#2ecc71' },
  { key: 'cyan', label: '青', color: '#1abc9c' },
  { key: 'blue', label: '蓝', color: '#3498db' },
  { key: 'purple', label: '紫', color: '#9b59b6' },
  { key: 'magenta', label: '品红', color: '#e84393' },
]

const AdjustPage: React.FC = () => {
  const [imagePath, setImagePath] = useState('')
  const [params, setParams] = useState<FilterParams>(defaultParams)
  const [previewBase64, setPreviewBase64] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'whitebalance' | 'tone' | 'color' | 'hue'>('whitebalance')
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 使用 ref 存储最新参数，避免 useCallback 依赖循环
  const paramsRef = useRef(params)
  paramsRef.current = params

  const { currentImagePath: ctxImagePath, filterParams: ctxFilterParams, setCurrentImagePath, setFilterParams, showSuccess, showError } = useApp()

  /** 从 AppContext 接收外部传入的图片路径（来自分析页面「参数微调」跳转） */
  useEffect(() => {
    if (ctxImagePath && ctxImagePath !== imagePath) {
      setImagePath(ctxImagePath)
    }
  }, [ctxImagePath]) // eslint-disable-line react-hooks/exhaustive-deps

  /** 从 AppContext 接收外部传入的滤镜参数 */
  useEffect(() => {
    if (ctxFilterParams) {
      setParams(ctxFilterParams)
      setCurrentImagePath('')
      setFilterParams(null)
    }
  }, [ctxFilterParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectImage = useCallback(async () => {
    try {
      const filePath = await window.electronAPI.invoke('dialog:open-file')
      if (filePath) {
        setImagePath(filePath as unknown as string)
        setPreviewBase64('')
      }
    } catch (err) {
      console.error('选择文件失败', err)
    }
  }, [])

  // 将预览更新逻辑提取到 useEffect 内部，避免依赖循环
  useEffect(() => {
    if (!imagePath) return

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const currentParams = paramsRef.current
        const response = await window.electronAPI.invoke('python:adjust-preview', {
          imagePath,
          params: currentParams,
        })
        if (response.previewBase64) {
          setPreviewBase64(response.previewBase64)
        }
      } catch (err) {
        console.error('预览生成失败', err)
      } finally {
        setIsLoading(false)
      }
    }, 200)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [imagePath, params])

  const updateParam = useCallback(<K extends keyof FilterParams>(
    section: K,
    key: keyof FilterParams[K],
    value: number
  ) => {
    setParams((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }))
  }, [])

  const updateHueShift = useCallback((colorKey: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      hueShifts: {
        ...prev.hueShifts,
        [colorKey]: value,
      },
    }))
  }, [])

  const resetParams = useCallback(() => {
    setParams(defaultParams)
  }, [])

  /** 将当前参数保存为预设 */
  const handleSavePreset = useCallback(() => {
    setShowNamePrompt(true)
  }, [])

  const handleConfirmSave = useCallback(async (presetName: string) => {
    setShowNamePrompt(false)

    try {
      const preset = {
        name: presetName,
        version: '1.0',
        camera: '未指定',
        filmMode: '未指定',
        params: params,
        lut3dSize: 33,
        lut3dData: [],
        thumbnail: previewBase64 || '',
      }
      await window.electronAPI.preset.save(preset)
      showSuccess(`预设"${presetName}"保存成功`)
    } catch (err) {
      showError('保存预设失败：' + (err instanceof Error ? err.message : '未知错误'))
    }
  }, [params, previewBase64, showSuccess, showError])

  const tabs = [
    { key: 'whitebalance' as const, label: '白平衡', icon: '☀️' },
    { key: 'tone' as const, label: '色调', icon: '⚡' },
    { key: 'color' as const, label: '色彩', icon: '🎨' },
    { key: 'hue' as const, label: '色相', icon: '🌈' },
  ]

  return (
    <div style={styles.container}>
      <NamePrompt
        visible={showNamePrompt}
        title="保存为滤镜预设"
        placeholder="请输入预设名称"
        onConfirm={handleConfirmSave}
        onCancel={() => setShowNamePrompt(false)}
      />
      <header style={styles.header}>
        <h2 style={styles.title}>参数微调</h2>
        <p style={styles.subtitle}>调整滤镜参数，实时预览效果</p>
      </header>

      <div style={styles.mainContent}>
        {/* 左侧：预览区域 */}
        <div style={styles.previewSection}>
          {!imagePath ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🖼️</div>
              <p>请先选择一张照片</p>
              <button className="btn-primary" onClick={handleSelectImage} style={{ marginTop: '12px' }}>
                选择照片
              </button>
            </div>
          ) : (
            <>
              <div style={styles.previewToolbar}>
                <button className="btn-secondary" onClick={handleSelectImage}>
                  更换照片
                </button>
                {isLoading && <span style={styles.loadingText}>生成预览中...</span>}
              </div>
              <div style={{ ...styles.previewContainer, position: 'relative' }}>
                {previewBase64 ? (
                  <ImageViewer src={`data:image/jpeg;base64,${previewBase64}`} alt="Preview" />
                ) : (
                  <div style={styles.previewPlaceholder}>加载中...</div>
                )}
                {isLoading && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '12px', zIndex: 10,
                  }}>
                    <div style={{
                      width: '40px', height: '40px',
                      border: '3px solid rgba(255, 255, 255, 0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 右侧：参数调整面板 */}
        <div style={styles.panel}>
          {/* Tab 切换 */}
          <div style={styles.tabBar}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                style={{
                  ...styles.tabBtn,
                  backgroundColor: activeTab === tab.key ? 'var(--accent)' : 'transparent',
                  color: activeTab === tab.key ? '#fff' : 'var(--text-secondary)',
                }}
                onClick={() => setActiveTab(tab.key)}
              >
                <span style={styles.tabIcon}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* 参数控制区域 */}
          <div style={styles.controls}>
            {activeTab === 'whitebalance' && (
              <div>
                <h4 style={styles.sectionTitle}>白平衡</h4>
                <Slider
                  label="色温 (K)"
                  value={params.whiteBalance.temperature}
                  min={2000}
                  max={10000}
                  step={100}
                  onChange={(v) => updateParam('whiteBalance', 'temperature', v)}
                />
                <Slider
                  label="色调"
                  value={params.whiteBalance.tint}
                  min={-100}
                  max={100}
                  onChange={(v) => updateParam('whiteBalance', 'tint', v)}
                />
              </div>
            )}

            {activeTab === 'tone' && (
              <div>
                <h4 style={styles.sectionTitle}>色调</h4>
                <Slider
                  label="高光"
                  value={params.tone.highlights}
                  min={-100}
                  max={100}
                  onChange={(v) => updateParam('tone', 'highlights', v)}
                />
                <Slider
                  label="阴影"
                  value={params.tone.shadows}
                  min={-100}
                  max={100}
                  onChange={(v) => updateParam('tone', 'shadows', v)}
                />
                <Slider
                  label="对比度"
                  value={params.tone.contrast}
                  min={-100}
                  max={100}
                  onChange={(v) => updateParam('tone', 'contrast', v)}
                />
              </div>
            )}

            {activeTab === 'color' && (
              <div>
                <h4 style={styles.sectionTitle}>色彩</h4>
                <Slider
                  label="饱和度"
                  value={params.color.saturation}
                  min={-100}
                  max={100}
                  onChange={(v) => updateParam('color', 'saturation', v)}
                />
                <Slider
                  label="鲜艳度"
                  value={params.color.vibrance}
                  min={-100}
                  max={100}
                  onChange={(v) => updateParam('color', 'vibrance', v)}
                />
              </div>
            )}

            {activeTab === 'hue' && (
              <div>
                <h4 style={styles.sectionTitle}>色相偏移</h4>
                {hueColors.map((hue) => (
                  <div key={hue.key} style={styles.hueRow}>
                    <div style={{ ...styles.hueDot, backgroundColor: hue.color }} />
                    <span style={styles.hueLabel}>{hue.label}</span>
                    <input
                      type="range"
                      min={-100}
                      max={100}
                      value={params.hueShifts[hue.key] || 0}
                      onChange={(e) => updateHueShift(hue.key, Number(e.target.value))}
                      style={{ ...sliderStyles.input, flex: 1 }}
                    />
                    <span style={styles.hueValue}>{params.hueShifts[hue.key] || 0}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 底部操作 */}
          <div style={styles.panelFooter}>
            <button className="btn-secondary" onClick={resetParams}>
              重置
            </button>
            <button className="btn-primary" onClick={handleSavePreset}>
              保存为预设
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    height: 'calc(100vh - 48px)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    marginBottom: '20px',
    flexShrink: 0,
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '8px',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
  },
  mainContent: {
    display: 'flex',
    gap: '24px',
    flex: 1,
    minHeight: 0,
  },
  previewSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  previewToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  previewContainer: {
    flex: 1,
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-tertiary)',
    minHeight: 0,
  },
  previewPlaceholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-secondary)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-secondary)',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '12px',
    border: '2px dashed var(--border)',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  loadingText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  panel: {
    width: '360px',
    flexShrink: 0,
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  tabBar: {
    display: 'flex',
    borderBottom: '1px solid var(--border)',
    padding: '4px',
    gap: '4px',
  },
  tabBtn: {
    flex: 1,
    padding: '10px 8px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s',
  },
  tabIcon: {
    fontSize: '18px',
  },
  controls: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '16px',
    color: 'var(--text-primary)',
  },
  panelFooter: {
    display: 'flex',
    gap: '12px',
    padding: '16px 20px',
    borderTop: '1px solid var(--border)',
  },
  hueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  hueDot: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  hueLabel: {
    fontSize: '13px',
    width: '40px',
    flexShrink: 0,
  },
  hueValue: {
    fontSize: '13px',
    fontWeight: 600,
    width: '36px',
    textAlign: 'right',
    flexShrink: 0,
  },
}

export default AdjustPage
