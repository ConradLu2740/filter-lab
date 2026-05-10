# 修复导入页面缩略图显示 Spec

## Why

导入页面（ImportPage）的照片缩略图始终不显示。之前尝试了自定义协议 `filterlab-file://` 方案，但在 Electron 30 + sandbox 模式 + Vite 开发服务器环境下存在多个兼容性问题，导致图片无法加载。

## 根因分析

经过代码审查，缩略图不显示有**两个层面的问题**：

### 问题 1：拖拽导入时路径丢失
- DropZone 通过 `e.dataTransfer.files` 获取 `File` 对象
- ImportPage 用 `(file as any).path` 获取路径，但在 Electron `sandbox: true` 模式下，拖拽的 `File` 对象**不暴露 `path` 属性**
- 回退到 `file.name`（仅文件名如 `"test.jpg"`），不是绝对路径
- 导致 `filterlab-file:///test.jpg` 无法被协议处理器解析

### 问题 2：自定义协议在开发模式下不可靠
- 渲染进程从 `http://localhost:5173/` 加载页面
- 从 HTTP 页面发起 `filterlab-file://` 请求时，Electron 的 `protocol.handle` 可能无法正确拦截
- `registerSchemesAsPrivileged` 的 `standard: true` 配置要求 scheme 遵循标准 URL 规范，与 HTTP 页面的混合内容策略可能冲突
- `new Response(Buffer)` 在 Electron 30 的 Fetch API 实现中对 Node.js Buffer 的兼容性不确定

## What Changes

- **移除**自定义协议 `filterlab-file://` 方案（`registerSchemesAsPrivileged` + `protocol.handle`）
- **新增** IPC 通道 `image:get-thumbnail`，由主进程读取本地图片文件并返回 base64 data URL
- **改造** ImportPage：通过 IPC 获取缩略图 data URL，用 `<img src="data:image/...;base64,...">` 显示
- **修复**拖拽导入路径问题：拖拽文件通过 IPC 获取真实路径

## Impact

- Affected code: `src/main/main.ts`, `src/main/ipc-handlers.ts`, `src/shared/types.ts`, `src/renderer/pages/ImportPage.tsx`

## ADDED Requirements

### Requirement: IPC 图片加载通道
系统 SHALL 提供 `image:get-thumbnail` IPC 通道，接收文件绝对路径，返回 base64 编码的 data URL。

#### Scenario: 加载存在的图片
- **WHEN** 渲染进程调用 `image:get-thumbnail` 并传入有效图片路径
- **THEN** 主进程读取文件，返回 `data:image/jpeg;base64,...` 格式的字符串

#### Scenario: 加载不存在的图片
- **WHEN** 渲染进程传入不存在的路径
- **THEN** 主进程返回空字符串或抛出错误，渲染进程显示 emoji 回退占位符

### Requirement: 拖拽文件路径获取
系统 SHALL 通过 IPC 通道 `dialog:get-file-path` 获取拖拽文件的真实路径。

#### Scenario: Electron 拖拽获取路径
- **WHEN** 用户拖拽文件到 DropZone
- **THEN** 渲染进程通过 IPC 获取完整绝对路径

## MODIFIED Requirements

### Requirement: 缩略图显示
不再使用自定义协议，改为通过 IPC 获取 base64 data URL 显示缩略图。

### Requirement: 主进程文件协议
移除 `filterlab-file://` 自定义协议注册和处理器。

## REMOVED Requirements

### Requirement: 自定义文件协议 `filterlab-file://`
**Reason**: 在 Electron 30 sandbox + Vite 开发服务器环境下不可靠
**Migration**: 改用 IPC base64 方案
