# python/main.py
"""
Python 后端主入口 - JSON-RPC 服务器

通过 stdin/stdout 与 Electron 主进程通信
"""

import sys
import json
import traceback
from pathlib import Path
from datetime import datetime

import numpy as np
import cv2

# 添加项目根目录到路径
project_root = str(Path(__file__).parent)
sys.path.insert(0, project_root)

# 使用相对导入
from core.exif_parser import EXIFParser
from core.color_analyzer import ColorAnalyzer
from core.lut_generator import LUTGenerator
from utils.image_io import load_image_rgb, save_image, image_to_base64, resize_image


class JSONRPCServer:
    """JSON-RPC 服务器"""

    def __init__(self):
        self.methods = {
            'ping': self.handle_ping,
            'analyze': self.handle_analyze,
            'apply_filter': self.handle_apply_filter,
            'export_lut': self.handle_export_lut,
            'batch_analyze': self.handle_batch_analyze,
            'adjust_preview': self.handle_adjust_preview,
        }

    def run(self):
        """运行服务器，从 stdin 读取请求"""
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue

            try:
                request = json.loads(line)
                response = self.handle_request(request)
            except json.JSONDecodeError as e:
                response = self.error_response(None, -32700, f"Parse error: {e}")
            except Exception as e:
                response = self.error_response(None, -32603, f"Internal error: {e}")

            self.send_response(response)

    def handle_request(self, request: dict) -> dict:
        """处理单个请求"""
        if request.get('jsonrpc') != '2.0':
            return self.error_response(request.get('id'), -32600, "Invalid Request")

        method_name = request.get('method')
        params = request.get('params', {})
        req_id = request.get('id')

        if method_name not in self.methods:
            return self.error_response(req_id, -32601, f"Method not found: {method_name}")

        try:
            result = self.methods[method_name](params)
            return {
                'jsonrpc': '2.0',
                'id': req_id,
                'result': result
            }
        except Exception as e:
            traceback.print_exc()
            return self.error_response(req_id, -32603, str(e))

    def error_response(self, req_id, code: int, message: str) -> dict:
        """生成错误响应"""
        return {
            'jsonrpc': '2.0',
            'id': req_id,
            'error': {
                'code': code,
                'message': message
            }
        }

    def send_response(self, response: dict):
        """发送响应到 stdout"""
        print(json.dumps(response), flush=True)

    def send_progress(self, progress: dict):
        """发送进度通知"""
        notification = {
            'type': 'progress',
            'data': progress
        }
        print(json.dumps(notification), flush=True)

    # --- 处理器方法 ---

    def handle_ping(self, params: dict) -> dict:
        """健康检查"""
        return {
            'ready': True,
            'version': '0.1.0'
        }

    def handle_analyze(self, params: dict) -> dict:
        """
        分析照片

        Args:
            params: {
                imagePath: str,
                mode: 'single' | 'pair' | 'colorchart',
                referencePath?: str
            }
        """
        image_path = params['imagePath']
        mode = params['mode']

        # 加载图像
        image = load_image_rgb(image_path)
        image = resize_image(image, max_size=2048)

        # 解析 EXIF
        metadata = EXIFParser.parse(image_path)

        # 色彩分析
        analyzer = ColorAnalyzer()

        debug_b64 = None

        features = None

        if mode == 'single':
            features = analyzer.analyze_single(image)
            samples = []
        elif mode == 'pair':
            reference_path = params.get('referencePath')
            if not reference_path:
                raise ValueError("referencePath required for pair mode")
            ref_image = load_image_rgb(reference_path)
            ref_image = resize_image(ref_image, max_size=2048)
            samples = analyzer.analyze_pair(ref_image, image)
        elif mode == 'colorchart':
            samples, debug_img = analyzer.analyze_colorchart(image)
            # 编码调试图像
            debug_rgb = cv2.cvtColor(debug_img, cv2.COLOR_BGR2RGB)
            debug_b64 = image_to_base64(debug_rgb, quality=85)
        else:
            raise ValueError(f"Unknown mode: {mode}")

        # 生成 LUT
        generator = LUTGenerator(size=33)

        if samples:
            lut = generator.generate_from_samples(samples)
        else:
            # 单张分析模式：生成恒等 LUT（待完善）
            lut = generator.generate_identity()

        # 生成预览图
        preview = generator.apply_lut(image)
        preview_b64 = image_to_base64(preview, quality=85)

        # 质量指标
        metrics = generator.get_quality_metrics()

        result = {
            'lut3d': lut.tolist(),
            'params': self._extract_params(samples),
            'metadata': metadata,
            'previewBase64': preview_b64,
            'qualityScore': metrics.get('smoothness', 0.5),
            'colorCoverage': metrics.get('color_coverage', 0) * 100,
        }

        if debug_b64:
            result['debugBase64'] = debug_b64

        # 单张分析模式：添加特征和匹配结果
        if features and mode == 'single':
            result['features'] = {
                'mean_rgb': features['mean_rgb'],
                'saturation_mean': round(features['saturation_mean'], 3),
                'contrast': round(features['contrast'], 1),
                'film_matches': features.get('film_matches', []),
            }

        return result

    def handle_apply_filter(self, params: dict) -> dict:
        """
        应用滤镜到照片

        Args:
            params: {
                imagePath: str,
                presetId: str
            }
        """
        # TODO: 从预设库加载 LUT 并应用
        image_path = params['imagePath']
        image = load_image_rgb(image_path)

        # 临时：返回原图
        preview_b64 = image_to_base64(image, quality=90)

        return {
            'resultPath': image_path,
            'previewBase64': preview_b64,
        }

    def handle_export_lut(self, params: dict) -> dict:
        """
        导出 LUT

        支持三种格式：
        - cube: 标准 3D LUT .cube 文件
        - preset: JSON 格式的预设文件
        - icc: ICC 色彩配置文件（简化版）

        Args:
            params: {
                lut3d: number[][][],  // LUT 数据
                format: 'cube' | 'preset' | 'icc',
                outputPath: str,
                lutSize?: number,
                presetData?: dict  // preset 格式需要的额外数据
            }
        """
        output_path = params['outputPath']
        fmt = params['format']
        lut_size = params.get('lutSize', 33)

        try:
            if fmt == 'cube':
                self._export_cube(params, output_path, lut_size)
            elif fmt == 'preset':
                self._export_preset(params, output_path)
            elif fmt == 'icc':
                self._export_icc(params, output_path, lut_size)
            else:
                raise ValueError(f"Unsupported format: {fmt}")

            return {
                'success': True,
                'outputPath': output_path,
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    def _export_cube(self, params: dict, output_path: str, lut_size: int) -> None:
        """导出为 .cube 格式（标准 3D LUT）"""
        lut_data = params['lut3d']
        lut = np.array(lut_data, dtype=np.float32)

        with open(output_path, 'w') as f:
            f.write('TITLE "FilterLab Generated LUT"\n')
            f.write(f'LUT_3D_SIZE {lut_size}\n')
            f.write('DOMAIN_MIN 0.0 0.0 0.0\n')
            f.write('DOMAIN_MAX 1.0 1.0 1.0\n')

            # 按 R 变化最快，B 变化最慢的顺序输出
            for b in range(lut_size):
                for g in range(lut_size):
                    for r in range(lut_size):
                        rgb = lut[r, g, b]
                        f.write(f'{rgb[0]:.6f} {rgb[1]:.6f} {rgb[2]:.6f}\n')

    def _export_preset(self, params: dict, output_path: str) -> None:
        """导出为 JSON 预设格式"""
        preset_data = params.get('presetData', {})

        export_data = {
            'version': '1.0',
            'type': 'filterlab-preset',
            'exported': datetime.now().isoformat(),
            **preset_data,
        }

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, ensure_ascii=False, indent=2)

    def _export_icc(self, params: dict, output_path: str, lut_size: int) -> None:
        """导出为 ICC 配置文件（简化版，使用 3D LUT 封装）"""
        # ICC 文件格式较为复杂，这里创建一个简化版本
        # 实际应用中可能需要使用专业库如 Little-CMS
        lut_data = params['lut3d']

        # 创建最小化的 ICC  profile（仅作为占位）
        # 真实 ICC 导出需要完整的色彩空间定义
        icc_header = self._create_icc_header()
        icc_tags = self._create_icc_tags(lut_data, lut_size)

        with open(output_path, 'wb') as f:
            f.write(icc_header)
            f.write(icc_tags)

    def _create_icc_header(self) -> bytes:
        """创建 ICC 文件头（128字节）"""
        header = bytearray(128)
        # Profile size (4 bytes) - 稍后填充
        # CMM Type (4 bytes)
        header[4:8] = b'\x00\x00\x00\x00'
        # Profile version (4 bytes) - 4.3.0.0
        header[8:12] = bytes([4, 3, 0, 0])
        # Profile/Device class (4 bytes) - lutRGB
        header[12:16] = b'mntr'
        # Color space (4 bytes) - RGB
        header[16:20] = b'RGB '
        # PCS (4 bytes) - XYZ
        header[20:24] = b'XYZ '
        # Date/time (12 bytes)
        header[24:36] = bytes([2024, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0])
        # Profile file signature (4 bytes)
        header[36:40] = b'acsp'
        # Primary platform (4 bytes)
        header[40:44] = b'\x00\x00\x00\x00'
        # CMM flags (4 bytes)
        header[44:48] = bytes([0, 0, 0, 0])
        # Device manufacturer (4 bytes)
        header[48:52] = b'\x00\x00\x00\x00'
        # Device model (4 bytes)
        header[52:56] = b'\x00\x00\x00\x00'
        # Device attributes (8 bytes)
        header[56:64] = bytes([0] * 8)
        # Rendering intent (4 bytes)
        header[64:68] = bytes([0, 0, 0, 0])
        # PCS illuminant (12 bytes) - D50
        header[68:80] = bytes([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
        # Profile creator (4 bytes)
        header[80:84] = b'FLab'
        # Profile ID (16 bytes)
        header[84:100] = bytes([0] * 16)
        # Reserved (28 bytes)
        header[100:128] = bytes([0] * 28)

        return bytes(header)

    def _create_icc_tags(self, lut_data: list, lut_size: int) -> bytes:
        """创建 ICC tag 表（简化版）"""
        # 这是一个非常简化的实现
        # 实际 ICC profile 需要完整的 tag 结构
        return bytes([0] * 256)

    def handle_batch_analyze(self, params: dict) -> dict:
        """
        批量分析

        Args:
            params: {
                imagePaths: str[],
                mode: str
            }
        """
        image_paths = params['imagePaths']
        mode = params['mode']
        results = []

        total = len(image_paths)
        for i, path in enumerate(image_paths):
            self.send_progress({
                'progress': i + 1,
                'total': total,
                'current': Path(path).name,
                'status': 'processing'
            })

            try:
                result = self.handle_analyze({
                    'imagePath': path,
                    'mode': mode
                })
                results.append(result)
            except Exception as e:
                results.append({
                    'error': str(e),
                    'imagePath': path
                })

        self.send_progress({
            'progress': total,
            'total': total,
            'status': 'completed',
            'results': results
        })

        return {
            'results': results
        }

    def handle_adjust_preview(self, params: dict) -> dict:
        """
        参数调整实时预览

        根据用户调整的参数，实时生成预览图像。
        使用 CSS-filter 风格的参数映射到图像处理。

        Args:
            params: {
                imagePath: str,
                params: {
                    whiteBalance: {temperature, tint},
                    tone: {highlights, shadows, contrast},
                    color: {saturation, vibrance},
                    hueShifts: {},
                    curve: {rgb, red, green, blue}
                }
            }
        """
        image_path = params['imagePath']
        adjust_params = params.get('params', {})

        # 加载图像
        image = load_image_rgb(image_path)
        image = resize_image(image, max_size=1200)  # 预览用小尺寸

        # 应用参数调整
        adjusted = self._apply_adjustments(image, adjust_params)

        # 编码预览图
        preview_b64 = image_to_base64(adjusted, quality=85)

        return {
            'previewBase64': preview_b64,
        }

    def _apply_adjustments(self, image: np.ndarray, params: dict) -> np.ndarray:
        """
        应用参数调整到图像

        Args:
            image: RGB 图像 [0, 1]
            params: 调整参数字典

        Returns:
            调整后的图像
        """
        result = image.copy()

        # 白平衡调整
        wb = params.get('whiteBalance', {})
        if wb:
            temperature = wb.get('temperature', 5500)
            tint = wb.get('tint', 0)
            result = self._apply_white_balance(result, temperature, tint)

        # 色调调整
        tone = params.get('tone', {})
        if tone:
            highlights = tone.get('highlights', 0)
            shadows = tone.get('shadows', 0)
            contrast = tone.get('contrast', 0)
            result = self._apply_tone(result, highlights, shadows, contrast)

        # 色彩调整
        color = params.get('color', {})
        if color:
            saturation = color.get('saturation', 0)
            vibrance = color.get('vibrance', 0)
            result = self._apply_color(result, saturation, vibrance)

        # 色相偏移
        hue_shifts = params.get('hueShifts', {})
        if hue_shifts:
            result = self._apply_hue_shifts(result, hue_shifts)

        # 曲线调整
        curve = params.get('curve', {})
        if curve and curve.get('rgb'):
            result = self._apply_curves(result, curve)

        return np.clip(result, 0, 1)

    def _apply_white_balance(self, image: np.ndarray, temperature: float, tint: float) -> np.ndarray:
        """应用白平衡调整"""
        result = image.copy()

        # 色温映射：将 Kelvin 转换为 RGB 乘数
        # 5500K 为基准
        temp_factor = (temperature - 5500) / 5500

        # 暖色调（低色温）：增加红色，减少蓝色
        # 冷色调（高色温）：减少红色，增加蓝色
        r_mult = 1.0 + temp_factor * 0.3
        b_mult = 1.0 - temp_factor * 0.3

        result[:, :, 0] *= r_mult
        result[:, :, 2] *= b_mult

        # 色调（绿-品红轴）
        tint_factor = tint / 100.0
        result[:, :, 1] *= 1.0 + tint_factor * 0.2

        return np.clip(result, 0, 1)

    def _apply_tone(self, image: np.ndarray, highlights: float, shadows: float, contrast: float) -> np.ndarray:
        """应用色调调整"""
        result = image.copy()

        # 高光调整：影响亮部区域
        if highlights != 0:
            luminance = np.mean(image, axis=2, keepdims=True)
            highlight_mask = (luminance > 0.5).astype(np.float32)
            highlight_factor = highlights / 100.0 * 0.5
            # 使用 mask 进行混合，避免 np.where 广播问题
            result = result + highlight_mask * highlight_factor

        # 阴影调整：影响暗部区域
        if shadows != 0:
            luminance = np.mean(image, axis=2, keepdims=True)
            shadow_mask = (luminance < 0.5).astype(np.float32)
            shadow_factor = shadows / 100.0 * 0.5
            result = result + shadow_mask * shadow_factor

        # 对比度调整
        if contrast != 0:
            contrast_factor = 1.0 + contrast / 100.0
            result = (result - 0.5) * contrast_factor + 0.5

        return np.clip(result, 0, 1)

    def _apply_color(self, image: np.ndarray, saturation: float, vibrance: float) -> np.ndarray:
        """应用色彩调整"""
        result = image.copy()

        # 饱和度调整
        if saturation != 0:
            hsv = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32)
            sat_factor = 1.0 + saturation / 100.0
            hsv[:, :, 1] = np.clip(hsv[:, :, 1] * sat_factor, 0, 255)
            result = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB).astype(np.float32) / 255.0

        # 鲜艳度调整（保护肤色，主要增强低饱和区域）
        if vibrance != 0:
            hsv = cv2.cvtColor((result * 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32)
            # 低饱和度区域增强更多
            low_sat_mask = hsv[:, :, 1] < 128
            vibrance_factor = 1.0 + vibrance / 100.0 * 0.5
            hsv[:, :, 1] = np.where(
                low_sat_mask,
                np.clip(hsv[:, :, 1] * vibrance_factor, 0, 255),
                hsv[:, :, 1]
            )
            result = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB).astype(np.float32) / 255.0

        return np.clip(result, 0, 1)

    def _apply_hue_shifts(self, image: np.ndarray, hue_shifts: dict) -> np.ndarray:
        """应用色相偏移"""
        if not hue_shifts:
            return image

        hsv = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32)
        hue = hsv[:, :, 0]

        # 8 个色相区域的偏移
        hue_ranges = {
            'red': (0, 15, 165, 180),
            'orange': (15, 45),
            'yellow': (45, 75),
            'green': (75, 105),
            'cyan': (105, 135),
            'blue': (135, 165),
            'purple': (165, 195),
            'magenta': (195, 225),
        }

        for color_name, shift in hue_shifts.items():
            if color_name not in hue_ranges:
                continue
            ranges = hue_ranges[color_name]
            shift_degrees = shift / 100.0 * 30  # 最大偏移 30 度

            if len(ranges) == 4:
                # 跨 0 度的范围（如红色）
                mask = ((hue >= ranges[0]) & (hue < ranges[1])) | ((hue >= ranges[2]) & (hue < ranges[3]))
            else:
                mask = (hue >= ranges[0]) & (hue < ranges[1])

            hue = np.where(mask, (hue + shift_degrees) % 180, hue)

        hsv[:, :, 0] = hue
        return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB).astype(np.float32) / 255.0

    def _apply_curves(self, image: np.ndarray, curve: dict) -> np.ndarray:
        """应用曲线调整（简化版）"""
        rgb_curve = curve.get('rgb', [])
        if not rgb_curve or len(rgb_curve) < 2:
            return image

        # 使用 LUT 映射实现曲线
        lut = np.array(rgb_curve)
        lut_size = len(lut)

        # 将图像值映射到 LUT 索引
        indices = np.clip(image * (lut_size - 1), 0, lut_size - 1).astype(np.int32)

        result = np.zeros_like(image)
        for c in range(3):
            result[:, :, c] = lut[indices[:, :, c]]

        return np.clip(result, 0, 1)

    def _extract_params(self, samples: list) -> dict:
        """从采样点提取可解释参数（简化版）"""
        # TODO: 实现更精确的参数提取
        return {
            'whiteBalance': {'temperature': 5500, 'tint': 0},
            'tone': {'highlights': 0, 'shadows': 0, 'contrast': 0},
            'color': {'saturation': 0, 'vibrance': 0},
            'hueShifts': {},
            'curve': {'rgb': [], 'red': [], 'green': [], 'blue': []},
        }


if __name__ == '__main__':
    server = JSONRPCServer()
    server.run()
