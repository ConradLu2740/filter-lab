# UX 修复方案 Spec

## Why
用户体验评估报告（ux-evaluation-report.md）发现了多处功能链断裂、错误处理缺失、交互反馈不足等问题，导致用户无法完成「导入→分析→调整→保存→导出」的核心操作链。

## What Changes
- 新增全局状态管理（AppContext），打通页面间数据流通
- 新增全局 Toast 通知组件，统一错误/成功提示
- 绑定分析页面结果操作按钮（保存为滤镜、参数微调、导出 LUT）
- 实现导入页面缩略图生成
- 实现"保存为预设"和"应用预设"功能
- 调整页面预览加载状态视觉反馈
- 导入页面非图片文件拖入时给出提示
- **BREAKING** App.tsx 重构为 Context Provider 模式

## Impact
- Affected specs: 全部 5 个页面组件、App.tsx、新增 AppContext 和 Toast 组件
- Affected code:
  - `src/renderer/App.tsx` — 重构为 Context Provider
  - `src/renderer/pages/ImportPage.tsx` — 缩略图 + 错误提示
  - `src/renderer/pages/AnalyzePage.tsx` — 按钮绑定 + 数据传递
  - `src/renderer/pages/AdjustPage.tsx` — 预设保存 + 加载反馈
  - `src/renderer/pages/ExportPage.tsx` — 接收分析 LUT 数据
  - `src/renderer/pages/LibraryPage.tsx` — 应用预设 + 错误提示
  - `src/renderer/components/DropZone.tsx` — 非图片提示
  - 新增 `src/renderer/contexts/AppContext.tsx`
  - 新增 `src/renderer/components/Toast.tsx`

---

## ADDED Requirements

### Requirement: 全局状态管理（AppContext）
系统 SHALL 提供跨页面共享的应用上下文，管理分析结果、当前图片路径、预设列表等全局状态。

#### Scenario: 分析结果传递到调整页面
- **WHEN** 用户在分析页面完成分析并点击「参数微调」
- **THEN** 调整页面自动加载该图片路径和分析得到的 FilterParams

#### Scenario: 分析结果传递到导出页面
- **WHEN** 用户在分析页面完成分析并点击「导出 LUT」
- **THEN** 导出页面自动使用该 LUT 数据，无需重新生成

#### Scenario: 预设应用到调整页面
- **WHEN** 用户在滤镜库点击「应用此滤镜」
- **THEN** 调整页面加载该预设的图片路径和参数

### Requirement: 全局 Toast 通知
系统 SHALL 提供统一的 Toast 通知组件，支持成功、错误、信息三种类型。

#### Scenario: 操作成功提示
- **WHEN** 用户保存预设成功
- **THEN** 页面右上角显示绿色成功 Toast，3 秒后自动消失

#### Scenario: 操作失败提示
- **WHEN** 任何异步操作失败（分析、导出、保存等）
- **THEN** 页面右上角显示红色错误 Toast，展示错误信息，用户可手动关闭

### Requirement: 导入页面缩略图
系统 SHALL 在导入照片后自动生成缩略图展示。

#### Scenario: 通过文件对话框导入照片
- **WHEN** 用户通过「选择文件」导入照片
- **THEN** 卡片区域显示该照片的缩略图预览（而非 emoji 占位符）

#### Scenario: 缩略图生成方式
- **WHEN** 照片路径可用
- **THEN** 使用 `file://` 协议直接加载本地图片作为缩略图 src

### Requirement: 分析页面操作按钮绑定
分析页面的结果操作按钮 SHALL 触发实际功能。

#### Scenario: 点击「保存为滤镜」
- **WHEN** 用户点击「保存为滤镜」按钮
- **THEN** 弹出命名对话框，保存为 FilterPreset 到 preset-store，显示成功 Toast

#### Scenario: 点击「参数微调」
- **WHEN** 用户点击「参数微调」按钮
- **THEN** 页面切换到调整页面，自动加载当前图片路径和分析参数

#### Scenario: 点击「导出 LUT」
- **WHEN** 用户点击「导出 LUT」按钮
- **THEN** 页面切换到导出页面，自动填充分析得到的 LUT 数据

### Requirement: 调整页面保存预设
调整页面的「保存为预设」按钮 SHALL 完成预设保存流程。

#### Scenario: 保存当前参数为预设
- **WHEN** 用户调整参数后点击「保存为预设」
- **THEN** 弹出命名输入，调用 preset:save 保存，显示成功 Toast

### Requirement: 调整页面预览加载反馈
调整页面 SHALL 在预览生成期间显示加载指示器。

#### Scenario: 参数变化触发预览更新
- **WHEN** 用户拖动滑块改变参数
- **THEN** 预览区域显示半透明加载遮罩 + spinner，直到新预览就绪

### Requirement: 滤镜库应用预设
滤镜库页面的「应用」和「应用此滤镜」按钮 SHALL 完成预设应用流程。

#### Scenario: 应用预设到调整页面
- **WHEN** 用户在滤镜库点击「应用」或「应用此滤镜」
- **THEN** 页面切换到调整页面，加载该预设的参数

### Requirement: 非图片文件拖入提示
DropZone SHALL 在用户拖入非图片文件时给出提示。

#### Scenario: 拖入非图片文件
- **WHEN** 用户拖入的文件中包含非图片类型
- **THEN** 过滤非图片文件，并通过 Toast 提示「已过滤 N 个非图片文件」

### Requirement: 导入页面错误提示
ImportPage SHALL 在文件选择失败时显示 Toast 错误提示。

#### Scenario: 文件选择对话框异常
- **WHEN** 文件选择过程中发生错误
- **THEN** 显示红色错误 Toast 而非仅 console.error

---

## MODIFIED Requirements

### Requirement: App.tsx 全局布局
App.tsx 修改为 AppContext Provider 模式，包裹所有页面组件，提供全局状态和 Toast 容器。

---

## REMOVED Requirements
无
