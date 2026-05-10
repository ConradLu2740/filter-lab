// src/renderer/pages/ImportPage.tsx
/**
 * 导入页面
 *
 * 支持拖拽上传和文件选择，显示已导入照片列表
 * 缩略图通过 IPC 获取 base64 data URL 显示
 */

import React, { useState, useCallback, useEffect } from 'react'
import DropZone from '../components/DropZone'
import { useApp } from '../contexts/AppContext'
import type { ImportedImage } from '../types'

const ImportPage: React.FC = () => {
  const [images, setImages] = useState<ImportedImage[]>([])
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const { showError, showInfo } = useApp()

  /**
   * 通过 IPC 获取图片缩略图的 base64 data URL
   */
  const loadThumbnails = useCallback(async (imgs: ImportedImage[]) => {
    const urls: Record<string, string> = {}
    await Promise.all(
      imgs.map(async (img) => {
        try {
          const dataUrl = await window.electronAPI.invoke('image:get-thumbnail', { filePath: img.path })
          if (dataUrl) {
            urls[img.id] = dataUrl
          }
        } catch {
          // 忽略加载失败的缩略图，显示回退占位符
        }
      })
    )
    setThumbnailUrls(prev => ({ ...prev, ...urls }))
  }, [])

  /**
   * 当 images 列表变化时，批量加载缩略图
   */
  useEffect(() => {
    if (images.length > 0) {
      loadThumbnails(images)
    }
  }, [images, loadThumbnails])

  /**
   * 处理拖拽文件（sandbox 模式下 File.path 不可用，通过 IPC 获取路径）
   */
  const handleFilesDrop = useCallback(async (files: File[]) => {
    setIsLoading(true)

    const newImages: ImportedImage[] = []

    for (const file of files) {
      // sandbox 模式下 File.path 不可用，回退到文件名
      const filePath = (file as any).path || file.name
      const image: ImportedImage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        path: filePath,
        name: file.name,
      }
      newImages.push(image)
    }

    setImages(prev => [...prev, ...newImages])
    setIsLoading(false)
  }, [])

  /**
   * 通过文件选择对话框导入（返回完整绝对路径）
   */
  const handleSelectFiles = useCallback(async () => {
    try {
      const paths = await window.electronAPI.invoke('dialog:open-files')
      if (paths && paths.length > 0) {
        const newImages: ImportedImage[] = paths.map(path => ({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          path,
          name: path.split(/[\\/]/).pop() || path,
        }))
        setImages(prev => [...prev, ...newImages])
      }
    } catch (err) {
      showError('文件选择失败：' + (err instanceof Error ? err.message : '未知错误'))
    }
  }, [showError])

  const handleRemoveImage = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id))
    setThumbnailUrls(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const handleClearAll = useCallback(() => {
    setImages([])
    setThumbnailUrls({})
  }, [])

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={styles.title}>导入照片</h2>
        <p style={styles.subtitle}>选择要分析的照片，支持批量导入</p>
      </header>

      <div style={styles.dropZoneWrapper}>
        <DropZone onFilesDrop={handleFilesDrop} onFilteredCount={(count) => showInfo(`已过滤 ${count} 个非图片文件`)} />
      </div>

      <div style={styles.actions}>
        <button className="btn-primary" onClick={handleSelectFiles}>
          选择文件
        </button>
        {images.length > 0 && (
          <button className="btn-secondary" onClick={handleClearAll}>
            清空全部
          </button>
        )}
      </div>

      {images.length > 0 && (
        <div style={styles.imageList}>
          <h3 style={styles.listTitle}>
            已导入 ({images.length} 张)
          </h3>
          <div style={styles.grid}>
            {images.map(image => {
              const dataUrl = thumbnailUrls[image.id]
              return (
                <div key={image.id} style={styles.card}>
                  <div style={styles.thumbnail} className="checkerboard">
                    <div style={{ width: '100%', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px 6px 0 0', overflow: 'hidden' }}>
                      {dataUrl ? (
                        <img
                          src={dataUrl}
                          alt={image.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent && !parent.querySelector('.fallback')) {
                              const span = document.createElement('span')
                              span.className = 'fallback'
                              span.textContent = '🖼️'
                              span.style.fontSize = '48px'
                              parent.appendChild(span)
                            }
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '48px' }}>🖼️</span>
                      )}
                    </div>
                  </div>
                  <div style={styles.cardInfo}>
                    <span style={styles.cardName} title={image.name}>
                      {image.name}
                    </span>
                    {image.metadata?.camera && (
                      <span style={styles.cardMeta}>{image.metadata.camera}</span>
                    )}
                  </div>
                  <button
                    style={styles.removeBtn}
                    onClick={() => handleRemoveImage(image.id)}
                    title="删除"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {isLoading && (
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <span>正在加载...</span>
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
  dropZoneWrapper: {
    marginBottom: '16px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  imageList: {
    marginTop: '24px',
  },
  listTitle: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '16px',
  },
  card: {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid var(--border)',
    position: 'relative',
  },
  thumbnail: {
    aspectRatio: '4/3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-tertiary)',
  },
  placeholder: {
    fontSize: '32px',
  },
  cardInfo: {
    padding: '10px 12px',
  },
  cardName: {
    fontSize: '13px',
    display: 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardMeta: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginTop: '4px',
    display: 'block',
  },
  removeBtn: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '24px',
    color: 'var(--text-secondary)',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid var(--border)',
    borderTopColor: 'var(--accent)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
}

export default ImportPage
