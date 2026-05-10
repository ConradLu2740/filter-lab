# Checklist

## 基础设施
- [x] AppContext 正确定义并导出 useApp() hook
- [x] AppProvider 包裹在 App.tsx 根节点
- [x] Toast 组件支持 success/error/info 三种类型
- [x] Toast 支持自动消失（3秒）和手动关闭
- [x] Toast 支持多条堆叠（右上角固定定位）

## 导入页面
- [x] 导入照片后卡片显示真实缩略图（file:// 协议加载）
- [x] 缩略图加载失败时显示 fallback 占位
- [x] 文件选择失败时显示红色错误 Toast
- [x] 拖入非图片文件时 Toast 提示已过滤数量

## 分析页面
- [x] 「保存为滤镜」按钮点击后弹出命名输入并保存到 preset-store
- [x] 「保存为滤镜」成功后显示绿色成功 Toast
- [x] 「参数微调」按钮点击后跳转调整页面，自动加载图片和参数
- [x] 「导出 LUT」按钮点击后跳转导出页面，自动填入 LUT 数据

## 调整页面
- [x] 「保存为预设」按钮点击后弹出命名输入并保存
- [x] 预览生成期间显示半透明加载遮罩 + spinner
- [x] 从 AppContext 接收外部传入的 imagePath 时自动加载
- [x] 从 AppContext 接收外部传入的 filterParams 时自动设置参数

## 导出页面
- [x] 有 AppContext.lut3d 时直接使用，不生成恒等 LUT
- [x] 无 LUT 数据时 fallback 到 generateIdentityLUT

## 滤镜库页面
- [x] 卡片「应用」按钮跳转调整页面并传递预设参数
- [x] 详情面板「应用此滤镜」按钮跳转调整页面并传递预设参数
- [x] 异步操作失败时显示错误 Toast（非 console.error）

## DropZone
- [x] 拖入非图片文件时通过 onFilteredCount 回调通知父组件
- [x] ImportPage 接收 onFilteredCount 并通过 Toast 提示

## 编译与测试
- [x] `npm run build` 编译无错误
- [x] `python -m pytest tests/ -v` 后端 95 个测试全部通过
- [x] 完整操作链：导入→分析→保存预设→跳转调整→跳转导出 可走通
- [x] 滤镜库应用预设→跳转调整页面 可走通
