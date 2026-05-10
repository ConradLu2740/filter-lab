// src/preload/index.ts
/**
 * 预加载脚本 - 安全桥接主进程和渲染进程
 *
 * 通过 contextBridge 暴露安全的 API 给渲染进程
 */

import { contextBridge, ipcRenderer } from 'electron'
import type { IPCChannels, ProgressUpdate } from '@shared/types'

type IPCChannelName = keyof IPCChannels

const api = {
  /**
   * 调用 IPC 通道
   */
  invoke: <K extends IPCChannelName>(
    channel: K,
    ...args: IPCChannels[K]['request'] extends void
      ? []
      : [IPCChannels[K]['request']]
  ): Promise<IPCChannels[K]['response']> => {
    return ipcRenderer.invoke(channel, ...(args as [unknown]))
  },

  /**
   * 监听进度通知
   */
  onProgress: (callback: (progress: ProgressUpdate) => void): (() => void) => {
    const handler = (_event: unknown, progress: ProgressUpdate) => callback(progress)
    ipcRenderer.on('python:progress', handler)
    return () => {
      ipcRenderer.removeListener('python:progress', handler)
    }
  },

  /**
   * 监听一次性事件
   */
  once: <K extends string>(channel: K, callback: (...args: unknown[]) => void): void => {
    ipcRenderer.once(channel, callback)
  },

  /**
   * 预设管理 API
   */
  preset: {
    save: (preset: unknown) => ipcRenderer.invoke('preset:save', preset),
    list: () => ipcRenderer.invoke('preset:list'),
    get: (id: string) => ipcRenderer.invoke('preset:get', id),
    delete: (id: string) => ipcRenderer.invoke('preset:delete', id),
    search: (query: string) => ipcRenderer.invoke('preset:search', query),
  }
}

// 暴露 API 到 window.electronAPI
contextBridge.exposeInMainWorld('electronAPI', api)

// TypeScript 类型声明（供渲染进程使用）
declare global {
  interface Window {
    electronAPI: typeof api
  }
}
