// src/renderer/pages/AnalyzePage.tsx
/**
 * 分析页面（核心页面）
 *
 * 支持三种分析模式，显示分析结果和预览
 */

import React, { useState, useCallback } from 'react'
import ImageViewer from '../components/ImageViewer'
import NamePrompt from '../components/NamePrompt'
import { useApp } from '../contexts/AppContext'
import type { AnalysisMode, AnalysisResult, FilterParams } from '../types'

const AnalyzePage: React.FC = () => {
  const [mode, setMode] = useState<AnalysisMode>('single')
  const [imagePath, setImagePath] = useState('')
  const [referencePath, setReferencePath] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showNamePrompt, setShowNamePrompt] = useState(false)

  const { setCurrentPage, setCurrentImagePath, setFilterParams, setLut3d, showSuccess, showError } = useApp()

  const handleSelectImage = useCallback(async () => {
    try {
      const filePath = await window.electronAPI.invoke('dialog:open-file')
      if (filePath) {
        setImagePath(filePath as unknown as string)
        setResult(null)
        setError(null)
      }
    } catch (err) {
      setError('选择文件失败')
    }
  }, [])

  const handleSelectReference = useCallback(async () => {
    try {
      const filePath = await window.electronAPI.invoke('dialog:open-file')
      if (filePath) {
        setReferencePath(filePath as unknown as string)
      }
    } catch (err) {
      setError('选择参考文件失败')
    }
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (!imagePath) {
      setError('请先选择照片')
      return
    }

    if (mode === 'pair' && !referencePath) {
      setError('pair模式需要选择参考照片')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await window.electronAPI.invoke('python:analyze', {
        imagePath,
        mode,
        referencePath: mode === 'pair' ? referencePath : undefined,
      })

      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败')
    } finally {
      setIsAnalyzing(false)
    }
  }, [imagePath, referencePath, mode])

  /** 将分析结果保存为滤镜预设 */
  const handleSaveAsPreset = useCallback(() => {
    if (!result) return
    setShowNamePrompt(true)
  }, [result])

  const handleConfirmSave = useCallback(async (presetName: string) => {
    if (!result) return
    setShowNamePrompt(false)

    try {
      const preset = {
        name: presetName,
        version: '1.0',
        camera: result.metadata?.camera || '未指定',
        filmMode: '未指定',
        params: result.params,
        lut3dSize: 33,
        lut3dData: result.lut3d || [],
        thumbnail: result.previewBase64 || '',
      }
      await window.electronAPI.preset.save(preset)
      showSuccess(`预设"${presetName}"保存成功`)
    } catch (err) {
      showError('保存预设失败：' + (err instanceof Error ? err.message : '未知错误'))
    }
  }, [result, showSuccess, showError])

  /** 跳转到调整页面，携带图片路径和分析参数 */
  const handleGoToAdjust = useCallback(() => {
    if (!result) return
    setCurrentImagePath(imagePath)
    if (result.params) {
      setFilterParams(result.params as FilterParams)
    }
    setCurrentPage('adjust')
  }, [result, imagePath, setCurrentImagePath, setFilterParams, setCurrentPage])

  /** 跳转到导出页面，携带分析生成的 LUT 数据 */
  const handleGoToExport = useCallback(() => {
    if (!result) return
    setLut3d(result.lut3d)
    setCurrentPage('export')
  }, [result, setLut3d, setCurrentPage])

  const modes: { value: AnalysisMode; label: string; description: string }[] = [
    { value: 'single', label: '单张分析', description: '分析单张照片的色彩特征' },
    { value: 'pair', label: '原图+滤镜图', description: '对比两张照片计算色彩映射' },
    { value: 'colorchart', label: '色卡参考', description: '使用标准色卡精确还原' },
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
        <h2 style={styles.title}>色彩分析</h2>
        <p style={styles.subtitle}>选择分析模式并导入照片</p>
      </header>

      {/* 分析模式选择 */}
      <div style={styles.modeSelector}>
        {modes.map(m => (
          <button
            key={m.value}
            style={{
              ...styles.modeBtn,
              borderColor: mode === m.value ? 'var(--accent)' : 'var(--border)',
              backgroundColor: mode === m.value ? 'rgba(26, 107, 60, 0.1)' : 'var(--bg-secondary)',
            }}
            onClick={() => setMode(m.value)}
          >
            <div style={styles.modeLabel}>{m.label}</div>
            <div style={styles.modeDesc}>{m.description}</div>
          </button>
        ))}
      </div>

      {/* 文件选择 */}
      <div style={styles.fileSelector}>
        <div style={styles.fileInput}>
          <label style={styles.label}>目标照片</label>
          <div style={styles.fileRow}>
            <input
              type="text"
              value={imagePath}
              readOnly
              placeholder="选择照片..."
              style={styles.pathInput}
            />
            <button className="btn-secondary" onClick={handleSelectImage}>
              选择
            </button>
          </div>
        </div>

        {mode === 'pair' && (
          <div style={styles.fileInput}>
            <label style={styles.label}>参考照片（原图）</label>
            <div style={styles.fileRow}>
              <input
                type="text"
                value={referencePath}
                readOnly
                placeholder="选择参考照片..."
                style={styles.pathInput}
              />
              <button className="btn-secondary" onClick={handleSelectReference}>
                选择
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 分析按钮 */}
      <div style={styles.analyzeBtnWrapper}>
        <button
          className="btn-primary"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          style={{
            opacity: isAnalyzing ? 0.7 : 1,
            minWidth: '120px',
          }}
        >
          {isAnalyzing ? '分析中...' : '开始分析'}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={styles.error}>
          ⚠️ {error}
        </div>
      )}

      {/* 分析结果 */}
      {result && (
        <div style={styles.result}>
          <div style={styles.resultHeader}>
            <h3 style={styles.resultTitle}>分析结果</h3>
            <div style={styles.qualityBadge}>
              质量评分: {Math.round(result.qualityScore * 100)}/100
            </div>
          </div>

          {/* 色卡检测调试视图 */}
          {mode === 'colorchart' && result.debugBase64 && (
            <div style={styles.previewSection}>
              <div style={styles.previewLabel}>色卡检测区域</div>
              <div style={{...styles.previewContainer, height: '300px'}}>
                <ImageViewer
                  src={`data:image/jpeg;base64,${result.debugBase64}`}
                  alt="Color chart detection"
                />
              </div>
            </div>
          )}

          {/* 预览对比 */}
          {result.previewBase64 && (
            <div style={styles.previewSection}>
              <div style={styles.previewLabel}>效果预览</div>
              <div style={styles.previewContainer}>
                <ImageViewer
                  src={`data:image/jpeg;base64,${result.previewBase64}`}
                  alt="Preview"
                />
              </div>
            </div>
          )}

          {/* 胶片模式匹配结果（单张分析模式） */}
          {mode === 'single' && result.features?.film_matches && (
            <div style={styles.filmMatchSection}>
              <div style={styles.previewLabel}>胶片模式匹配</div>
              <div style={styles.filmMatchList}>
                {result.features.film_matches.map((match, idx) => (
                  <div
                    key={match.name}
                    style={{
                      ...styles.filmMatchItem,
                      backgroundColor: idx === 0 ? 'rgba(26, 107, 60, 0.15)' : 'var(--bg-tertiary)',
                      borderColor: idx === 0 ? 'var(--accent)' : 'transparent',
                    }}
                  >
                    <div style={styles.filmMatchInfo}>
                      <span style={styles.filmMatchName}>{match.name}</span>
                      <span style={styles.filmMatchDesc}>{match.description}</span>
                    </div>
                    <div style={styles.filmMatchConfidence}>
                      <div style={styles.confidenceBar}>
                        <div
                          style={{
                            ...styles.confidenceFill,
                            width: `${match.confidence}%`,
                            backgroundColor: idx === 0 ? 'var(--accent)' : 'var(--text-secondary)',
                          }}
                        />
                      </div>
                      <span style={styles.confidenceText}>{match.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 元数据 */}
          <div style={styles.metadata}>
            {result.metadata.camera && (
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>📷 相机</span>
                <span>{result.metadata.camera}</span>
              </div>
            )}
            {result.metadata.filmMode && (
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>🎞️ 胶片模式</span>
                <span>{result.metadata.filmMode}</span>
              </div>
            )}
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>🎨 色彩覆盖率</span>
              <span>{Math.round(result.colorCoverage)}%</span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div style={styles.actions}>
            <button className="btn-primary" onClick={handleSaveAsPreset}>保存为滤镜</button>
            <button className="btn btn-primary" onClick={handleGoToAdjust}>参数微调</button>
            <button className="btn btn-primary" onClick={handleGoToExport}>导出LUT</button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
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
  modeSelector: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  modeBtn: {
    flex: 1,
    padding: '16px',
    borderRadius: '8px',
    border: '2px solid var(--border)',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modeLabel: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '4px',
  },
  modeDesc: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  fileSelector: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
  },
  fileInput: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  fileRow: {
    display: 'flex',
    gap: '8px',
  },
  pathInput: {
    flex: 1,
  },
  analyzeBtnWrapper: {
    marginBottom: '24px',
  },
  error: {
    padding: '12px 16px',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    border: '1px solid var(--error)',
    borderRadius: '6px',
    color: 'var(--error)',
    marginBottom: '24px',
  },
  result: {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid var(--border)',
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  resultTitle: {
    fontSize: '18px',
    fontWeight: 600,
  },
  qualityBadge: {
    padding: '6px 12px',
    backgroundColor: 'var(--accent)',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 500,
  },
  previewSection: {
    marginBottom: '20px',
  },
  previewLabel: {
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '8px',
    color: 'var(--text-secondary)',
  },
  previewContainer: {
    height: '400px',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-tertiary)',
  },
  metadata: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '12px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '6px',
  },
  metaLabel: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
  },
  filmMatchSection: {
    marginBottom: '20px',
  },
  filmMatchList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  filmMatchItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid transparent',
  },
  filmMatchInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  filmMatchName: {
    fontSize: '14px',
    fontWeight: 600,
  },
  filmMatchDesc: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  filmMatchConfidence: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: '120px',
  },
  confidenceBar: {
    flex: 1,
    height: '6px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  confidenceText: {
    fontSize: '13px',
    fontWeight: 500,
    minWidth: '40px',
    textAlign: 'right',
  },
}

export default AnalyzePage
