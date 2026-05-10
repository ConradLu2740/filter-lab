// src/renderer/pages/ExportPage.tsx
/**
 * 导出页面
 *
 * 导出 LUT 文件和滤镜预设
 * 支持：.cube LUT、JSON 预设、.icc 配置文件
 */

import React, { useState, useCallback } from 'react'
import { useApp } from '../contexts/AppContext'

interface ExportFormat {
  key: string
  label: string
  description: string
  extension: string
  icon: string
}

const exportFormats: ExportFormat[] = [
  {
    key: 'cube',
    label: '.cube LUT',
    description: '标准 3D LUT 文件，兼容 DaVinci Resolve、Premiere Pro、Final Cut Pro 等',
    extension: 'cube',
    icon: '🎬',
  },
  {
    key: 'preset',
    label: 'JSON 预设',
    description: 'FilterLab 原生预设格式，包含完整参数和 LUT 数据',
    extension: 'json',
    icon: '📋',
  },
  {
    key: 'icc',
    label: '.icc 配置文件',
    description: 'ICC 色彩配置文件，可用于系统级色彩管理（实验性功能）',
    extension: 'icc',
    icon: '🎨',
  },
]

const ExportPage: React.FC = () => {
  const { lut3d: ctxLut3d, showError } = useApp()
  const [selectedFormat, setSelectedFormat] = useState('cube')
  const [lutSize, setLutSize] = useState(33)
  const [isExporting, setIsExporting] = useState(false)
  const [exportResult, setExportResult] = useState<{ success: boolean; path?: string; error?: string } | null>(null)

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    setExportResult(null)

    try {
      const format = exportFormats.find((f) => f.key === selectedFormat)
      if (!format) return

      // 选择保存路径
      const defaultName = `filterlab-export.${format.extension}`
      const outputPath = await window.electronAPI.invoke('dialog:save-file', {
        defaultPath: defaultName,
        filters: [{ name: format.label, extensions: [format.extension] }],
      })

      if (!outputPath) {
        setIsExporting(false)
        return
      }

      // 优先使用 AppContext 中的 LUT 数据，若无则生成恒等 LUT
      const lut3d = ctxLut3d || generateIdentityLUT(lutSize)

      const response = await window.electronAPI.invoke('python:export-lut', {
        lut3d: lut3d as unknown as number[][][],
        format: selectedFormat,
        outputPath,
        lutSize,
        presetData: {
          name: 'FilterLab Export',
          version: '1.0',
        },
      })

      setExportResult({
        success: (response as { success: boolean }).success,
        path: (response as { outputPath?: string }).outputPath,
        error: (response as { error?: string }).error,
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '导出失败'
      showError(errorMsg)
      setExportResult({
        success: false,
        error: errorMsg,
      })
    } finally {
      setIsExporting(false)
    }
  }, [selectedFormat, lutSize, ctxLut3d, showError])

  const currentFormat = exportFormats.find((f) => f.key === selectedFormat)

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={styles.title}>导出</h2>
        <p style={styles.subtitle}>将滤镜导出为标准格式，用于其他软件</p>
        {ctxLut3d && (
          <p style={{ color: 'var(--accent)', fontSize: '14px', margin: '0 0 24px' }}>
            已加载分析生成的 LUT 数据（33×33×33）
          </p>
        )}
      </header>

      <div style={styles.content}>
        {/* 格式选择 */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>选择导出格式</h3>
          <div style={styles.formatGrid}>
            {exportFormats.map((fmt) => (
              <button
                key={fmt.key}
                style={{
                  ...styles.formatCard,
                  borderColor: selectedFormat === fmt.key ? 'var(--accent)' : 'var(--border)',
                  backgroundColor: selectedFormat === fmt.key ? 'rgba(26, 107, 60, 0.1)' : 'var(--bg-secondary)',
                }}
                onClick={() => {
                  setSelectedFormat(fmt.key)
                  setExportResult(null)
                }}
              >
                <div style={styles.formatIcon}>{fmt.icon}</div>
                <div style={styles.formatLabel}>{fmt.label}</div>
                <div style={styles.formatDesc}>{fmt.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 选项设置 */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>导出选项</h3>
          <div style={styles.options}>
            <div style={styles.optionRow}>
              <label style={styles.optionLabel}>LUT 尺寸</label>
              <select
                value={lutSize}
                onChange={(e) => setLutSize(Number(e.target.value))}
                style={styles.select}
              >
                <option value={17}>17×17×17 (较小)</option>
                <option value={33}>33×33×33 (标准)</option>
                <option value={65}>65×65×65 (高质量)</option>
              </select>
            </div>

            {currentFormat && (
              <div style={styles.formatInfo}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>文件扩展名</span>
                  <span>.{currentFormat.extension}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>兼容性</span>
                  <span>{currentFormat.description}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 导出按钮 */}
        <div style={styles.exportAction}>
          <button
            className="btn-primary"
            onClick={handleExport}
            disabled={isExporting}
            style={{
              minWidth: '160px',
              opacity: isExporting ? 0.7 : 1,
            }}
          >
            {isExporting ? '导出中...' : '开始导出'}
          </button>
        </div>

        {/* 导出结果 */}
        {exportResult && (
          <div
            style={{
              ...styles.result,
              backgroundColor: exportResult.success ? 'rgba(26, 107, 60, 0.1)' : 'rgba(231, 76, 60, 0.1)',
              borderColor: exportResult.success ? 'var(--accent)' : 'var(--error)',
            }}
          >
            {exportResult.success ? (
              <>
                <div style={styles.resultIcon}>✅</div>
                <div>
                  <p style={styles.resultText}>导出成功！</p>
                  <p style={styles.resultPath}>{exportResult.path}</p>
                </div>
              </>
            ) : (
              <>
                <div style={styles.resultIcon}>❌</div>
                <div>
                  <p style={styles.resultText}>导出失败</p>
                  <p style={styles.resultError}>{exportResult.error}</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 生成恒等 LUT（用于测试导出）
 */
type RGBTriplet = [number, number, number]

function generateIdentityLUT(size: number): RGBTriplet[][][] {
  const lut: RGBTriplet[][][] = []
  for (let r = 0; r < size; r++) {
    lut[r] = []
    for (let g = 0; g < size; g++) {
      lut[r][g] = []
      for (let b = 0; b < size; b++) {
        const entry: RGBTriplet = [
          r / (size - 1),
          g / (size - 1),
          b / (size - 1),
        ]
        lut[r][g][b] = entry
      }
    }
  }
  return lut
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '24px',
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
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  section: {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid var(--border)',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '16px',
  },
  formatGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '12px',
  },
  formatCard: {
    padding: '20px',
    borderRadius: '10px',
    border: '2px solid var(--border)',
    backgroundColor: 'var(--bg-secondary)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
  },
  formatIcon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  formatLabel: {
    fontSize: '15px',
    fontWeight: 600,
    marginBottom: '6px',
  },
  formatDesc: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  optionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  optionLabel: {
    fontSize: '14px',
    fontWeight: 500,
    minWidth: '100px',
  },
  select: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    minWidth: '200px',
  },
  formatInfo: {
    padding: '16px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoRow: {
    display: 'flex',
    gap: '12px',
    fontSize: '13px',
  },
  infoLabel: {
    color: 'var(--text-secondary)',
    minWidth: '80px',
  },
  exportAction: {
    display: 'flex',
    justifyContent: 'center',
    padding: '16px',
  },
  result: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    borderRadius: '10px',
    border: '2px solid',
  },
  resultIcon: {
    fontSize: '28px',
    flexShrink: 0,
  },
  resultText: {
    fontSize: '15px',
    fontWeight: 600,
    marginBottom: '4px',
  },
  resultPath: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    wordBreak: 'break-all',
  },
  resultError: {
    fontSize: '13px',
    color: 'var(--error)',
  },
}

export default ExportPage
