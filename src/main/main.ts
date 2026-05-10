// src/main/main.ts
/**
 * Electron 主进程入口
 */

import { app, BrowserWindow } from 'electron'
import path from 'path'
import { PythonBridge } from './python-bridge'
import { registerIPCHandlers } from './ipc-handlers'

let mainWindow: BrowserWindow | null = null
let pythonBridge: PythonBridge | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  // 加载页面
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    // 开发模式下使用 localhost，生产模式使用文件
    const devUrl = 'http://localhost:5173/'
    mainWindow.loadURL(devUrl).catch(() => {
      // 如果 localhost 失败，回退到文件
      mainWindow!.loadFile(path.join(__dirname, '../renderer/index.html'))
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

async function initialize(): Promise<void> {
  await app.whenReady()

  // 创建窗口
  createWindow()

  // 启动 Python 后端
  pythonBridge = new PythonBridge()

  // 先注册 IPC 处理器，再启动后端，避免渲染进程轮询时 handler 未注册
  registerIPCHandlers(pythonBridge)

  try {
    await pythonBridge.start()
    console.log('Python backend started successfully')
  } catch (err) {
    console.error('Failed to start Python backend:', err)
    const { dialog } = require('electron')
    dialog.showErrorBox(
      'Python 后端启动失败',
      `无法启动 Python 图像处理引擎。请确保已安装 Python 3.10+ 和所需依赖。\n\n错误: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
}

app.on('window-all-closed', () => {
  if (pythonBridge) {
    pythonBridge.stop()
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  if (pythonBridge) {
    pythonBridge.stop()
  }
})

initialize().catch(console.error)
