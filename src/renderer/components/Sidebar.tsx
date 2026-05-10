// src/renderer/components/Sidebar.tsx
/**
 * 侧边栏导航组件
 */

import React from 'react'
import type { Page } from '../types'

interface SidebarProps {
  currentPage: Page
  onPageChange: (page: Page) => void
  pythonReady: boolean
}

const navItems: { page: Page; label: string; icon: string }[] = [
  { page: 'import', label: '导入', icon: '📷' },
  { page: 'analyze', label: '分析', icon: '🔍' },
  { page: 'adjust', label: '调整', icon: '🎛️' },
  { page: 'library', label: '滤镜库', icon: '📚' },
  { page: 'export', label: '导出', icon: '📦' },
]

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, pythonReady }) => {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.header}>
        <h1 style={styles.title}>🎨 FilterLab</h1>
        <div style={styles.status}>
          <span style={{
            ...styles.statusDot,
            backgroundColor: pythonReady ? 'var(--success)' : 'var(--error)'
          }} />
          <span style={styles.statusText}>
            {pythonReady ? '就绪' : '未连接'}
          </span>
        </div>
      </div>

      <nav style={styles.nav}>
        {navItems.map(item => (
          <button
            key={item.page}
            style={{
              ...styles.navItem,
              backgroundColor: currentPage === item.page
                ? 'var(--accent)'
                : 'transparent',
            }}
            onClick={() => onPageChange(item.page)}
          >
            <span style={styles.icon}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div style={styles.footer}>
        <span style={styles.version}>v0.1.0</span>
      </div>
    </aside>
  )
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 'var(--sidebar-width)',
    backgroundColor: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 0',
  },
  header: {
    padding: '0 16px 16px',
    borderBottom: '1px solid var(--border)',
    marginBottom: '8px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '8px',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '12px',
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '0 8px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '6px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    textAlign: 'left',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  icon: {
    fontSize: '18px',
  },
  footer: {
    padding: '16px',
    borderTop: '1px solid var(--border)',
    textAlign: 'center',
  },
  version: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
}

export default Sidebar
