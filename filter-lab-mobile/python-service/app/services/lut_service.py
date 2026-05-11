import numpy as np
from scipy.interpolate import RegularGridInterpolator
from typing import Dict, List, Optional
from app.utils.base64_utils import decode_base64_image, encode_image_to_base64
from PIL import Image


class LUTGenerator:
    """LUT 生成器"""
    
    def __init__(self, size: int = 33):
        self.size = size
        self.lut = None
    
    def generate_lut(self, color_params: Dict) -> np.ndarray:
        """
        从色彩参数生成 3D LUT
        
        Args:
            color_params: 色彩参数 dict
        
        Returns:
            3D LUT 数组 (size, size, size, 3)
        """
        # 提取参数
        saturation = color_params.get("saturation", 1.0)
        contrast = color_params.get("contrast", 1.0)
        temperature = color_params.get("temperature", 0)
        tint = color_params.get("tint", 0)
        shadow_boost = color_params.get("shadow_boost", 0)
        highlight_rolloff = color_params.get("highlight_rolloff", 0.1)
        
        # 创建网格
        grid = np.linspace(0, 1, self.size)
        
        # 预分配 LUT 数组
        lut = np.zeros((self.size, self.size, self.size, 3))
        
        # 生成 LUT
        for i, r in enumerate(grid):
            for j, g in enumerate(grid):
                for k, b in enumerate(grid):
                    # 应用色彩调整
                    rgb = np.array([r, g, b])
                    
                    # 1. 饱和度调整
                    luminance = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]
                    rgb = luminance + saturation * (rgb - luminance)
                    
                    # 2. 对比度调整
                    rgb = ((rgb - 0.5) * contrast) + 0.5
                    
                    # 3. 色温调整 (简化实现)
                    temp_factor = temperature / 1000.0
                    rgb[0] += temp_factor  # R
                    rgb[2] -= temp_factor  # B
                    
                    # 4. 色调调整
                    tint_factor = tint / 1000.0
                    rgb[1] += tint_factor  # G
                    
                    # 5. 阴影提升
                    rgb = rgb + shadow_boost * (1 - rgb)
                    
                    # 6. 高光平滑
                    rgb = np.where(
                        rgb > (1 - highlight_rolloff),
                        1 - highlight_rolloff + (1 - highlight_rolloff) * np.log1p((rgb - (1 - highlight_rolloff)) / highlight_rolloff),
                        rgb
                    )
                    
                    # 裁剪到 [0, 1]
                    rgb = np.clip(rgb, 0, 1)
                    
                    lut[i, j, k] = rgb
        
        self.lut = lut
        return lut
    
    def apply_lut_to_image(self, image_base64: str, lut_base64: Optional[str] = None) -> str:
        """
        应用 LUT 到图片
        
        Args:
            image_base64: 原始图片 base64
            lut_base64: LUT 数据 base64 (可选，如果已有 LUT)
        
        Returns:
            处理后图片的 base64
        """
        # 解码图片
        image = decode_base64_image(image_base64)
        img_array = np.array(image, dtype=np.float32) / 255.0
        
        # 获取或生成 LUT
        if self.lut is None:
            return image_base64
        
        # 简化实现：直接使用 LUT 的中值作为色彩映射
        lut_sample = self.lut[16, 16, 16]
        
        # 应用 LUT 效果
        result = img_array * lut_sample
        
        # 确保值在有效范围内
        result = np.clip(result * 255, 0, 255).astype(np.uint8)
        
        # 转换回 PIL Image
        result_image = Image.fromarray(result)
        
        # 编码回 base64
        return encode_image_to_base64(result_image)
    
    def export_cube_format(self, lut: np.ndarray) -> str:
        """
        导出为 .cube 格式
        
        Args:
            lut: 3D LUT 数组
        
        Returns:
            .cube 格式字符串
        """
        lines = [
            f"# FilterLab LUT Export",
            f"# Size: {self.size}",
            "",
            "TITLE \"FilterLab LUT\"",
            "",
            f"LUT_3D_SIZE {self.size}",
            "LUT_3D_INPUT_RANGE 0.0 1.0",
            ""
        ]
        
        # 添加 LUT 数据
        for b in range(self.size):
            for g in range(self.size):
                for r in range(self.size):
                    rgb = lut[r, g, b]
                    lines.append(f"{rgb[0]:.6f} {rgb[1]:.6f} {rgb[2]:.6f}")
        
        return "\n".join(lines)
    
    def lut_to_base64(self, lut: np.ndarray) -> str:
        """将 LUT 转换为 base64"""
        import base64
        lut_bytes = lut.astype(np.float32).tobytes()
        return base64.b64encode(lut_bytes).decode("utf-8")
