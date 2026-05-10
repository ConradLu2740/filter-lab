// src/main/preset-store.ts
/**
 * 滤镜预设本地存储服务
 *
 * 使用 Electron userData 目录存储预设 JSON 文件
 * 每个预设独立文件，便于管理和版本控制
 */

import { app } from 'electron'
import { mkdir, readdir, readFile, writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import type { FilterPreset } from '@shared/types'

const PRESETS_DIR = 'filterlab-presets'
const PRESET_EXT = '.json'

/**
 * 获取预设存储目录路径
 */
function getPresetsDir(): string {
  return join(app.getPath('userData'), PRESETS_DIR)
}

/**
 * 确保预设目录存在
 */
async function ensurePresetsDir(): Promise<void> {
  const dir = getPresetsDir()
  await mkdir(dir, { recursive: true })
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 保存预设
 */
export async function savePreset(preset: Omit<FilterPreset, 'id' | 'created'> & { id?: string }): Promise<FilterPreset> {
  await ensurePresetsDir()

  const fullPreset: FilterPreset = {
    ...preset,
    id: preset.id || generateId(),
    created: new Date().toISOString(),
  }

  const filePath = join(getPresetsDir(), `${fullPreset.id}${PRESET_EXT}`)
  await writeFile(filePath, JSON.stringify(fullPreset, null, 2), 'utf-8')

  return fullPreset
}

/**
 * 加载所有预设
 */
export async function loadPresets(): Promise<FilterPreset[]> {
  await ensurePresetsDir()

  const dir = getPresetsDir()
  const files = await readdir(dir)
  const presetFiles = files.filter((f) => f.endsWith(PRESET_EXT))

  const presets: FilterPreset[] = []

  for (const file of presetFiles) {
    try {
      const content = await readFile(join(dir, file), 'utf-8')
      const preset = JSON.parse(content) as FilterPreset
      presets.push(preset)
    } catch {
      // 跳过损坏的文件
    }
  }

  // 按创建时间降序排列
  presets.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

  return presets
}

/**
 * 按 ID 加载单个预设
 */
export async function loadPresetById(id: string): Promise<FilterPreset | null> {
  try {
    const filePath = join(getPresetsDir(), `${id}${PRESET_EXT}`)
    const content = await readFile(filePath, 'utf-8')
    return JSON.parse(content) as FilterPreset
  } catch {
    return null
  }
}

/**
 * 删除预设
 */
export async function deletePreset(id: string): Promise<boolean> {
  try {
    const filePath = join(getPresetsDir(), `${id}${PRESET_EXT}`)
    await unlink(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * 搜索预设
 */
export async function searchPresets(query: string): Promise<FilterPreset[]> {
  const presets = await loadPresets()
  if (!query.trim()) return presets

  const lowerQuery = query.toLowerCase()
  return presets.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      (p.camera && p.camera.toLowerCase().includes(lowerQuery)) ||
      (p.filmMode && p.filmMode.toLowerCase().includes(lowerQuery))
  )
}
