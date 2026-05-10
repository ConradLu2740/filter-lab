// src/main/python-bridge.ts
/**
 * Python 子进程管理 + JSON-RPC 通信桥接
 *
 * 负责启动 Python 后端子进程，通过 stdin/stdout 进行 JSON-RPC 通信
 */

import { spawn, ChildProcess } from 'child_process'
// app imported for future use when app.isPackaged is needed
// import { app } from 'electron'
import path from 'path'
import fs from 'fs'

interface JSONRPCRequest {
  jsonrpc: '2.0'
  id: number
  method: string
  params: unknown
}

interface JSONRPCResponse {
  jsonrpc: '2.0'
  id: number
  result?: unknown
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

export class PythonBridge {
  private process: ChildProcess | null = null
  private requestId = 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pendingRequests = new Map<number, {
    resolve: (value: any) => void
    reject: (reason: Error) => void
  }>()
  private buffer = ''
  private restartCount = 0
  private maxRestarts = 3
  private onProgressCallback?: (progress: unknown) => void

  /**
   * 启动 Python 子进程
   */
  async start(): Promise<void> {
    const pythonPath = await this.findPython()
    const scriptPath = this.getPythonScriptPath()

    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Python script not found: ${scriptPath}`)
    }

    this.process = spawn(pythonPath, [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    })

    this.process.stdout?.on('data', (data: Buffer) => {
      this.handleStdout(data.toString())
    })

    this.process.stderr?.on('data', (data: Buffer) => {
      console.error('[Python stderr]:', data.toString())
    })

    this.process.on('exit', (code) => {
      console.log(`Python process exited with code ${code}`)
      this.handleExit()
    })

    this.process.on('error', (err) => {
      console.error('Python process error:', err)
      this.handleExit()
    })

    // 等待 Python 就绪
    await this.waitForReady()
  }

  /**
   * 发送 JSON-RPC 请求并等待响应
   */
  async call<T>(method: string, params: unknown): Promise<T> {
    if (!this.process || this.process.killed) {
      throw new Error('Python process not running')
    }

    const id = ++this.requestId
    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params
    }

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject })

      const message = JSON.stringify(request) + '\n'
      this.process!.stdin!.write(message, (err) => {
        if (err) {
          this.pendingRequests.delete(id)
          reject(err)
        }
      })

      // 设置超时
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error(`Request timeout: ${method}`))
        }
      }, 60000) // 60秒超时
    })
  }

  /**
   * 设置进度回调
   */
  onProgress(callback: (progress: unknown) => void): void {
    this.onProgressCallback = callback
  }

  /**
   * 停止 Python 子进程
   */
  stop(): void {
    if (this.process && !this.process.killed) {
      this.process.kill('SIGTERM')
    }
  }

  /**
   * 查找系统 Python 可执行文件
   */
  private async findPython(): Promise<string> {
    const candidates = ['python3', 'python', 'py']
    for (const cmd of candidates) {
      try {
        const result = require('child_process').execSync(`${cmd} --version`, { encoding: 'utf-8' })
        if (result.includes('Python 3')) {
          return cmd
        }
      } catch {
        // 继续尝试下一个
      }
    }
    throw new Error('Python 3 not found. Please install Python 3.10+')
  }

  /**
   * 获取 Python 脚本路径
   */
  private getPythonScriptPath(): string {
    // 尝试多个可能的路径，不依赖 app.isPackaged
    const possiblePaths = [
      path.join(process.cwd(), 'python', 'main.py'),
      path.join(__dirname, '..', '..', 'python', 'main.py'),
      path.join(__dirname, '..', '..', '..', 'python', 'main.py'),
      path.join(path.dirname(process.execPath), '..', '..', 'python', 'main.py'),
      path.join(path.dirname(process.execPath), '..', '..', '..', 'python', 'main.py'),
      'D:\\code\\solo_test\\python\\main.py',
    ]
    for (const p of possiblePaths) {
      const normalizedPath = path.normalize(p)
      console.log('[PythonBridge] Checking path:', normalizedPath)
      if (fs.existsSync(normalizedPath)) {
        console.log('[PythonBridge] Found Python script at:', normalizedPath)
        return normalizedPath
      }
    }
    // 默认返回第一个路径
    return path.normalize(possiblePaths[0])
  }

  /**
   * 处理 stdout 数据
   */
  private handleStdout(data: string): void {
    this.buffer += data
    const lines = this.buffer.split('\n')
    this.buffer = lines.pop() || '' // 保留未完成的行

    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const response: JSONRPCResponse = JSON.parse(line)
        this.handleResponse(response)
      } catch {
        // 可能是进度通知或其他非JSON输出
        try {
          const notification = JSON.parse(line)
          if (notification.type === 'progress' && this.onProgressCallback) {
            this.onProgressCallback(notification.data)
          }
        } catch {
          console.log('[Python stdout]:', line)
        }
      }
    }
  }

  /**
   * 处理 JSON-RPC 响应
   */
  private handleResponse(response: JSONRPCResponse): void {
    const pending = this.pendingRequests.get(response.id)
    if (!pending) return

    this.pendingRequests.delete(response.id)

    if (response.error) {
      pending.reject(new Error(response.error.message))
    } else {
      pending.resolve(response.result)
    }
  }

  /**
   * 处理 Python 进程退出
   */
  private handleExit(): void {
    this.process = null
    // 拒绝所有待处理的请求
    for (const [, pending] of this.pendingRequests) {
      pending.reject(new Error('Python process exited unexpectedly'))
    }
    this.pendingRequests.clear()

    // 自动重启（限制次数）
    if (this.restartCount < this.maxRestarts) {
      this.restartCount++
      console.log(`Restarting Python process (attempt ${this.restartCount}/${this.maxRestarts})...`)
      setTimeout(() => this.start(), 1000)
    }
  }

  /**
   * 等待 Python 就绪
   */
  private async waitForReady(): Promise<void> {
    const maxAttempts = 30
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const result = await this.call<{ ready: boolean }>('ping', {})
        if (result.ready) {
          this.restartCount = 0
          return
        }
      } catch {
        // 继续等待
      }
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    throw new Error('Python backend failed to start')
  }
}
