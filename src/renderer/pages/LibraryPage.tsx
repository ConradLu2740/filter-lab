// src/renderer/pages/LibraryPage.tsx
/**
 * 滤镜库管理页面
 *
 * 管理已保存的滤镜预设
 * 支持：搜索、查看、删除、应用到照片
 */

import React, { useState, useCallback, useEffect } from 'react'
import type { FilterPreset } from '../types'
import { useApp } from '../contexts/AppContext'

const LibraryPage: React.FC = () => {
  const { setCurrentPage, setFilterParams, showError } = useApp()
  const [presets, setPresets] = useState<FilterPreset[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<FilterPreset | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const loadPresets = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await window.electronAPI.preset.list()
      setPresets(result as FilterPreset[])
    } catch (err) {
      console.error('加载预设失败', err)
      showError('加载预设失败：' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      setIsLoading(false)
    }
  }, [showError])

  useEffect(() => {
    loadPresets()
  }, [loadPresets])

  const handleSearch = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await window.electronAPI.preset.search(searchQuery)
      setPresets(result as FilterPreset[])
    } catch (err) {
      console.error('搜索预设失败', err)
      showError('搜索失败：' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, showError])

  const handleDelete = useCallback(async (id: string) => {
    try {
      const success = await window.electronAPI.preset.delete(id)
      if (success) {
        setPresets((prev) => prev.filter((p) => p.id !== id))
        if (selectedPreset?.id === id) {
          setSelectedPreset(null)
        }
      }
      setShowDeleteConfirm(null)
    } catch (err) {
      console.error('删除预设失败', err)
      showError('删除失败：' + (err instanceof Error ? err.message : '未知错误'))
    }
  }, [selectedPreset, showError])

  /**
   * 应用预设到调整页面
   *
   * 将选中预设的参数设置到全局上下文，然后跳转到调整页面
   *
   * @param preset - 要应用的滤镜预设
   */
  const handleApplyPreset = useCallback((preset: FilterPreset) => {
    if (preset.params) {
      setFilterParams(preset.params)
    }
    setCurrentPage('adjust')
  }, [setFilterParams, setCurrentPage])

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={styles.title}>滤镜库</h2>
        <p style={styles.subtitle}>管理已保存的滤镜预设</p>
      </header>

      {/* 搜索栏 */}
      <div style={styles.searchBar}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="搜索预设名称、相机型号..."
          style={styles.searchInput}
        />
        <button className="btn-secondary" onClick={handleSearch}>
          搜索
        </button>
        <button className="btn-secondary" onClick={loadPresets}>
          刷新
        </button>
      </div>

      {/* 预设列表 */}
      <div style={styles.content}>
        {isLoading ? (
          <div style={styles.emptyState}>
            <p>加载中...</p>
          </div>
        ) : presets.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📚</div>
            <p>暂无保存的滤镜预设</p>
            <p style={styles.emptyHint}>在分析页面完成分析后，点击「保存为滤镜」即可添加</p>
          </div>
        ) : (
          <div style={styles.presetGrid}>
            {presets.map((preset) => (
              <div
                key={preset.id}
                style={{
                  ...styles.presetCard,
                  borderColor: selectedPreset?.id === preset.id ? 'var(--accent)' : 'var(--border)',
                }}
                onClick={() => setSelectedPreset(preset)}
              >
                {/* 缩略图 */}
                <div style={styles.thumbnail}>
                  {preset.thumbnail ? (
                    <img
                      src={`data:image/jpeg;base64,${preset.thumbnail}`}
                      alt={preset.name}
                      style={styles.thumbnailImg}
                    />
                  ) : (
                    <div style={styles.thumbnailPlaceholder}>🎨</div>
                  )}
                </div>

                {/* 信息 */}
                <div style={styles.presetInfo}>
                  <h4 style={styles.presetName}>{preset.name}</h4>
                  <div style={styles.presetMeta}>
                    {preset.camera && <span style={styles.metaTag}>📷 {preset.camera}</span>}
                    {preset.filmMode && <span style={styles.metaTag}>🎞️ {preset.filmMode}</span>}
                  </div>
                  <p style={styles.presetDate}>{formatDate(preset.created)}</p>
                </div>

                {/* 操作 */}
                <div style={styles.presetActions}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '6px', fontSize: '12px' }}
                    onClick={(e) => { e.stopPropagation(); handleApplyPreset(preset); }}
                  >
                    应用
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ ...styles.actionBtn, color: 'var(--error)' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDeleteConfirm(preset.id)
                    }}
                  >
                    删除
                  </button>
                </div>

                {/* 删除确认 */}
                {showDeleteConfirm === preset.id && (
                  <div style={styles.deleteConfirm}>
                    <p style={styles.deleteText}>确认删除此预设？</p>
                    <div style={styles.deleteActions}>
                      <button
                        className="btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowDeleteConfirm(null)
                        }}
                      >
                        取消
                      </button>
                      <button
                        className="btn-primary"
                        style={{ backgroundColor: 'var(--error)' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(preset.id)
                        }}
                      >
                        确认删除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 预设详情侧边栏 */}
      {selectedPreset && (
        <div style={styles.detailPanel}>
          <div style={styles.detailHeader}>
            <h3 style={styles.detailTitle}>{selectedPreset.name}</h3>
            <button
              style={styles.closeBtn}
              onClick={() => setSelectedPreset(null)}
            >
              ✕
            </button>
          </div>

          <div style={styles.detailContent}>
            {selectedPreset.thumbnail && (
              <img
                src={`data:image/jpeg;base64,${selectedPreset.thumbnail}`}
                alt={selectedPreset.name}
                style={styles.detailThumbnail}
              />
            )}

            <div style={styles.detailSection}>
              <h4 style={styles.detailSectionTitle}>基本信息</h4>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>版本</span>
                <span>{selectedPreset.version}</span>
              </div>
              {selectedPreset.camera && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>相机</span>
                  <span>{selectedPreset.camera}</span>
                </div>
              )}
              {selectedPreset.filmMode && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>胶片模式</span>
                  <span>{selectedPreset.filmMode}</span>
                </div>
              )}
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>创建时间</span>
                <span>{formatDate(selectedPreset.created)}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>LUT 尺寸</span>
                <span>{selectedPreset.lut3dSize}×{selectedPreset.lut3dSize}×{selectedPreset.lut3dSize}</span>
              </div>
            </div>

            <div style={styles.detailSection}>
              <h4 style={styles.detailSectionTitle}>参数</h4>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>色温</span>
                <span>{selectedPreset.params.whiteBalance.temperature}K</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>色调</span>
                <span>{selectedPreset.params.whiteBalance.tint}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>饱和度</span>
                <span>{selectedPreset.params.color.saturation}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>对比度</span>
                <span>{selectedPreset.params.tone.contrast}</span>
              </div>
            </div>
          </div>

          <div style={styles.detailFooter}>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => handleApplyPreset(selectedPreset)}
            >
              应用此滤镜
            </button>
          </div>
        </div>
      )}
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
  searchBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '14px',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    minHeight: 0,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px',
    color: 'var(--text-secondary)',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyHint: {
    marginTop: '8px',
    fontSize: '13px',
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
    paddingRight: '8px',
  },
  presetCard: {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '12px',
    border: '2px solid var(--border)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative',
  },
  thumbnail: {
    height: '160px',
    backgroundColor: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  thumbnailPlaceholder: {
    fontSize: '48px',
  },
  presetInfo: {
    padding: '16px',
  },
  presetName: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '8px',
  },
  presetMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '8px',
  },
  metaTag: {
    fontSize: '12px',
    padding: '3px 8px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '4px',
    color: 'var(--text-secondary)',
  },
  presetDate: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  presetActions: {
    display: 'flex',
    gap: '8px',
    padding: '0 16px 16px',
  },
  actionBtn: {
    flex: 1,
    padding: '8px',
    fontSize: '13px',
  },
  deleteConfirm: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    borderRadius: '12px',
  },
  deleteText: {
    color: '#fff',
    fontSize: '16px',
    fontWeight: 500,
  },
  deleteActions: {
    display: 'flex',
    gap: '12px',
  },
  detailPanel: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '380px',
    height: '100vh',
    backgroundColor: 'var(--bg-secondary)',
    borderLeft: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid var(--border)',
  },
  detailTitle: {
    fontSize: '18px',
    fontWeight: 600,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
  },
  detailContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
  },
  detailThumbnail: {
    width: '100%',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  detailSection: {
    marginBottom: '24px',
  },
  detailSectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '12px',
    color: 'var(--text-secondary)',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid var(--border)',
    fontSize: '14px',
  },
  detailLabel: {
    color: 'var(--text-secondary)',
  },
  detailFooter: {
    padding: '20px',
    borderTop: '1px solid var(--border)',
  },
}

export default LibraryPage
