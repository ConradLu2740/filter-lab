// src/renderer/components/NamePrompt.tsx
/**
 * 名称输入模态框组件
 *
 * 替代 window.prompt()，在 Electron sandbox 模式下可靠工作
 */

import React, { useState, useRef, useEffect } from 'react'

interface NamePromptProps {
  visible: boolean
  title?: string
  placeholder?: string
  onConfirm: (name: string) => void
  onCancel: () => void
}

const NamePrompt: React.FC<NamePromptProps> = ({
  visible,
  title = '请输入名称',
  placeholder = '',
  onConfirm,
  onCancel,
}) => {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (visible) {
      setValue('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [visible])

  if (!visible) return null

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.title}>{title}</h3>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={styles.input}
        />
        <div style={styles.actions}>
          <button className="btn-secondary" onClick={onCancel}>取消</button>
          <button className="btn-primary" onClick={handleConfirm} disabled={!value.trim()}>确认</button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  dialog: {
    backgroundColor: 'var(--bg-primary)',
    borderRadius: '12px',
    padding: '24px',
    width: '360px',
    border: '1px solid var(--border)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '16px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px',
  },
}

export default NamePrompt
