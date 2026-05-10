/**
 * 应用根组件
 *
 * 使用 AppProvider 包裹全局状态，内部分离为 AppContent 负责实际渲染。
 * 集成 Toast 通知容器，提供全局错误/成功/信息提示能力。
 */

import React, { useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import ImportPage from './pages/ImportPage'
import AnalyzePage from './pages/AnalyzePage'
import AdjustPage from './pages/AdjustPage'
import LibraryPage from './pages/LibraryPage'
import ExportPage from './pages/ExportPage'
import ToastContainer from './components/Toast'
import { AppProvider, useApp } from './contexts/AppContext'

/**
 * 应用内容组件（消费 AppContext）
 *
 * 负责 Python 后端状态轮询、页面路由渲染和 Toast 容器挂载。
 * 必须在 AppProvider 内部使用。
 */
const AppContent: React.FC = () => {
  const { currentPage, setCurrentPage, pythonReady, setPythonReady, toasts, removeToast } = useApp()

  /**
   * 检查 Python 后端就绪状态
   *
   * 每 5 秒轮询一次，更新 pythonReady 状态
   */
  const checkPythonStatus = useCallback(async () => {
    try {
      const status = await window.electronAPI.invoke('python:status') as { ready: boolean; version: string }
      setPythonReady(status.ready)
    } catch {
      setPythonReady(false)
    }
  }, [setPythonReady])

  useEffect(() => {
    checkPythonStatus()
    const interval = setInterval(checkPythonStatus, 5000)
    return () => clearInterval(interval)
  }, [checkPythonStatus])

  /**
   * 根据当前页面渲染对应组件
   */
  const renderPage = () => {
    switch (currentPage) {
      case 'import': return <ImportPage />
      case 'analyze': return <AnalyzePage />
      case 'adjust': return <AdjustPage />
      case 'library': return <LibraryPage />
      case 'export': return <ExportPage />
      default: return <ImportPage />
    }
  }

  return (
    <div style={styles.app}>
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        pythonReady={pythonReady}
      />
      <main style={styles.main}>
        {renderPage()}
      </main>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

/**
 * 应用根组件
 *
 * 提供 AppProvider 全局状态上下文，内部通过 AppContent 消费状态
 */
const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: 'flex',
    height: '100vh',
    fontFamily: 'var(--font-family)',
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-primary)',
  },
  main: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
  },
}

export default App
