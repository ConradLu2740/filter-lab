// src/renderer/components/Toast.tsx
/**
 * Toast 通知组件
 *
 * 右上角固定定位的通知栏，支持 success / error / info 三种类型，
 * 自动堆叠显示多条消息，每条可手动关闭。
 */

import React from 'react'

/** 单条 Toast 数据结构 */
interface ToastItem {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

/** Toast 容器组件 Props */
interface ToastContainerProps {
  toasts: ToastItem[]
  onRemove: (id: string) => void
}

/** 不同类型 Toast 对应的主题色配置 */
const typeConfig: Record<
  ToastItem['type'],
  { border: string; bg: string; icon: string }
> = {
  success: {
    border: '#2ecc71',
    bg: 'rgba(46, 204, 113, 0.1)',
    icon: '✅',
  },
  error: {
    border: '#e74c3c',
    bg: 'rgba(231, 76, 60, 0.1)',
    icon: '❌',
  },
  info: {
    border: '#3498db',
    bg: 'rgba(52, 152, 219, 0.1)',
    icon: 'ℹ️',
  },
}

/**
 * ToastContainer - 固定在右上角的通知容器
 *
 * 接收 toasts 数组渲染通知列表，点击关闭按钮触发 onRemove 移除对应条目。
 */
const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null

  return (
    <div style={styles.container}>
      {toasts.map((toast) => {
        const config = typeConfig[toast.type]
        return (
          <div
            key={toast.id}
            style={{
              ...styles.toast,
              borderLeftColor: config.border,
              backgroundColor: config.bg,
            }}
          >
            <span style={styles.icon}>{config.icon}</span>
            <span style={styles.message}>{toast.message}</span>
            <button style={styles.closeBtn} onClick={() => onRemove(toast.id)}>
              ✕
            </button>
          </div>
        )
      })}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: '16px',
    right: '16px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxWidth: '380px',
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    borderRadius: '8px',
    borderLeft: '4px solid',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    lineHeight: '1.5',
    backdropFilter: 'blur(8px)',
    animation: 'toastSlideIn 0.3s ease',
  },
  icon: {
    flexShrink: 0,
    fontSize: '16px',
  },
  message: {
    flex: 1,
    wordBreak: 'break-word',
  },
  closeBtn: {
    flexShrink: 0,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: 'var(--text-muted)',
    padding: '0 2px',
    lineHeight: 1,
    opacity: 0.7,
  },
}

export default ToastContainer
