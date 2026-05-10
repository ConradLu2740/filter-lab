// src/renderer/components/DropZone.tsx
/**
 * 拖拽上传区域组件
 */

import React, { useCallback, useState } from 'react'

interface DropZoneProps {
  onFilesDrop: (files: File[]) => void
  onFilteredCount?: (count: number) => void
  accept?: string
  multiple?: boolean
}

const DropZone: React.FC<DropZoneProps> = ({
  onFilesDrop,
  onFilteredCount,
  accept = 'image/*',
  multiple = true,
}) => {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  /** 处理拖拽放置事件，过滤非图片文件并通知被过滤的数量 */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const allFiles = Array.from(e.dataTransfer.files)
    const imageFiles = allFiles.filter(file =>
      file.type.startsWith('image/')
    )
    const filteredCount = allFiles.length - imageFiles.length

    if (onFilteredCount && filteredCount > 0) {
      onFilteredCount(filteredCount)
    }

    if (imageFiles.length > 0) {
      onFilesDrop(imageFiles)
    }
  }, [onFilesDrop, onFilteredCount])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFilesDrop(files)
    }
  }, [onFilesDrop])

  return (
    <div
      style={{
        ...styles.container,
        borderColor: isDragOver ? 'var(--accent)' : 'var(--border)',
        backgroundColor: isDragOver ? 'rgba(26, 107, 60, 0.1)' : 'var(--bg-secondary)',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        style={styles.input}
        id="file-input"
      />
      <label htmlFor="file-input" style={styles.label}>
        <div style={styles.icon}>📁</div>
        <div style={styles.text}>
          拖拽照片到此处，或 <span style={styles.link}>点击选择</span>
        </div>
        <div style={styles.hint}>
          支持 JPG, PNG, TIFF, RAW 格式
        </div>
      </label>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    border: '2px dashed var(--border)',
    borderRadius: '12px',
    padding: '48px 32px',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  input: {
    display: 'none',
  },
  label: {
    cursor: 'pointer',
    display: 'block',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  text: {
    fontSize: '16px',
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  link: {
    color: 'var(--accent)',
    textDecoration: 'underline',
  },
  hint: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
}

export default DropZone
