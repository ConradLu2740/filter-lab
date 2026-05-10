// src/main/ipc-handlers.ts
/**
 * IPC 事件处理器
 *
 * 注册所有 IPC 通道的处理逻辑，桥接渲染进程和 Python 后端
 */

import { ipcMain, dialog } from 'electron'
import fs from 'fs'
import path from 'path'
import { PythonBridge } from './python-bridge'
import { savePreset, loadPresets, loadPresetById, deletePreset, searchPresets } from './preset-store'
import type { IPCChannels, ProgressUpdate, FilterPreset } from '@shared/types'

export function registerIPCHandlers(bridge: PythonBridge): void {
  // 分析照片
  ipcMain.handle('python:analyze', async (_event, request: IPCChannels['python:analyze']['request']) => {
    return bridge.call<IPCChannels['python:analyze']['response']>('analyze', request)
  })

  // 应用滤镜
  ipcMain.handle('python:apply-filter', async (_event, request: IPCChannels['python:apply-filter']['request']) => {
    return bridge.call<IPCChannels['python:apply-filter']['response']>('apply_filter', request)
  })

  // 导出 LUT
  ipcMain.handle('python:export-lut', async (_event, request: IPCChannels['python:export-lut']['request']) => {
    return bridge.call<IPCChannels['python:export-lut']['response']>('export_lut', request)
  })

  // 批量分析
  ipcMain.handle('python:batch-analyze', async (_event, request: IPCChannels['python:batch-analyze']['request']) => {
    return bridge.call<IPCChannels['python:batch-analyze']['response']>('batch_analyze', request)
  })

  // 检查 Python 状态
  ipcMain.handle('python:status', async () => {
    try {
      return bridge.call<IPCChannels['python:status']['response']>('ping', {})
    } catch {
      return { ready: false, version: '' }
    }
  })

  // 参数调整实时预览
  ipcMain.handle('python:adjust-preview', async (_event, request: IPCChannels['python:adjust-preview']['request']) => {
    return bridge.call<IPCChannels['python:adjust-preview']['response']>('adjust_preview', request)
  })

  // 获取本地图片缩略图（base64 data URL）
  ipcMain.handle('image:get-thumbnail', async (_event, request: IPCChannels['image:get-thumbnail']['request']) => {
    try {
      const data = fs.readFileSync(request.filePath)
      const ext = path.extname(request.filePath).toLowerCase()
      const mimeMap: Record<string, string> = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.png': 'image/png', '.gif': 'image/gif',
        '.bmp': 'image/bmp', '.webp': 'image/webp',
        '.tiff': 'image/tiff', '.tif': 'image/tiff',
      }
      const contentType = mimeMap[ext] || 'image/jpeg'
      const base64 = data.toString('base64')
      return `data:${contentType};base64,${base64}`
    } catch {
      return ''
    }
  })

  // 选择文件/文件夹对话框
  ipcMain.handle('dialog:open-file', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'tiff', 'tif', 'raw', 'raf'] }
      ]
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('dialog:open-files', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'tiff', 'tif', 'raw', 'raf'] }
      ]
    })
    return result.canceled ? [] : result.filePaths
  })

  ipcMain.handle('dialog:select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('dialog:save-file', async (_event, options: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) => {
    const result = await dialog.showSaveDialog({
      defaultPath: options.defaultPath,
      filters: options.filters
    })
    return result.canceled ? null : result.filePath
  })

  // --- 预设管理 IPC ---

  ipcMain.handle('preset:save', async (_event, preset: Omit<FilterPreset, 'id' | 'created'> & { id?: string }) => {
    return savePreset(preset)
  })

  ipcMain.handle('preset:list', async () => {
    return loadPresets()
  })

  ipcMain.handle('preset:get', async (_event, id: string) => {
    return loadPresetById(id)
  })

  ipcMain.handle('preset:delete', async (_event, id: string) => {
    return deletePreset(id)
  })

  ipcMain.handle('preset:search', async (_event, query: string) => {
    return searchPresets(query)
  })

  // 进度通知转发到渲染进程
  bridge.onProgress((progress: unknown) => {
    const typedProgress = progress as ProgressUpdate
    // 通过 BrowserWindow 的 webContents 发送
    const { BrowserWindow } = require('electron')
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      win.webContents.send('python:progress', typedProgress)
    }
  })
}
