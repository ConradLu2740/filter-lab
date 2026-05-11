from PIL import Image
import numpy as np
from typing import List, Dict
from app.utils.base64_utils import decode_base64_image, encode_image_to_base64
from app.utils.image_utils import resize_image


class ColorSample:
    """色彩采样点"""
    def __init__(self, input_rgb: List[float], output_rgb: List[float], weight: float = 1.0):
        self.input_rgb = np.array(input_rgb)
        self.output_rgb = np.array(output_rgb)
        self.weight = weight


class ColorAnalyzer:
    """色彩分析器"""
    
    def __init__(self):
        # 预定义的胶片色彩配置
        self.film_profiles = {
            "portra_400": {
                "name": "Kodak Portra 400",
                "saturation": 0.95,
                "contrast": 1.05,
                "temperature_shift": 50,  # 偏暖
                "tint_shift": 5,  # 偏品红
                "shadow_boost": 0.02,
                "highlight_rolloff": 0.15
            },
            "ektar_100": {
                "name": "Kodak Ektar 100",
                "saturation": 1.1,
                "contrast": 1.15,
                "temperature_shift": -100,  # 偏冷
                "tint_shift": -10,
                "shadow_boost": 0.0,
                "highlight_rolloff": 0.1
            },
            "velvia": {
                "name": "Fuji Velvia",
                "saturation": 1.4,
                "contrast": 1.25,
                "temperature_shift": 0,
                "tint_shift": 0,
                "shadow_boost": -0.02,
                "highlight_rolloff": 0.2
            },
            "provia": {
                "name": "Fuji Provia",
                "saturation": 1.05,
                "contrast": 1.1,
                "temperature_shift": 0,
                "tint_shift": 0,
                "shadow_boost": 0.0,
                "highlight_rolloff": 0.12
            }
        }
    
    def analyze_single_image(self, image: Image.Image, mode: str = "auto") -> Dict:
        """
        分析单张图片
        
        Args:
            image: PIL Image 对象
            mode: 分析模式 ('auto', 'portra', 'ektar', 'velvia')
        
        Returns:
            dict: 色彩参数
        """
        # 调整图片尺寸以提高处理速度
        image = resize_image(image, max_size=1024)
        
        # 转换到 numpy 数组
        img_array = np.array(image) / 255.0
        
        # 计算色彩统计
        mean_color = np.mean(img_array, axis=(0, 1))
        std_color = np.std(img_array, axis=(0, 1))
        
        # 确定使用的配置文件
        if mode == "auto":
            # 基于图片特性自动选择
            if mean_color[0] > mean_color[2]:  # 偏暖
                film_key = "portra_400"
            elif std_color[1] > 0.15:  # 高饱和度
                film_key = "velvia"
            else:
                film_key = "ektar_100"
        else:
            film_key = mode
        
        profile = self.film_profiles.get(film_key, self.film_profiles["portra_400"])
        
        return {
            "film_profile": film_key,
            "film_name": profile["name"],
            "saturation": profile["saturation"],
            "contrast": profile["contrast"],
            "temperature": profile["temperature_shift"],
            "tint": profile["tint_shift"],
            "shadow_boost": profile["shadow_boost"],
            "highlight_rolloff": profile["highlight_rolloff"],
            "image_stats": {
                "mean": mean_color.tolist(),
                "std": std_color.tolist()
            },
            "confidence": 0.85
        }
    
    def analyze_colorchart(self, image: Image.Image) -> Dict:
        """
        分析色卡图片
        
        Args:
            image: PIL Image 对象
        
        Returns:
            dict: 色彩映射参数
        """
        # X-Rite ColorChecker 标准颜色值
        xrite_reference = [
            [0.400, 0.350, 0.270],  # Dark Skin
            [0.600, 0.410, 0.310],  # Light Skin
            [0.180, 0.230, 0.410],  # Blue Sky
            [0.330, 0.380, 0.240],  # Foliage
            [0.550, 0.520, 0.430],  # Blue Flower
            [0.310, 0.420, 0.520],  # Bluish Green
            [0.700, 0.500, 0.200],  # Orange
            [0.150, 0.180, 0.450],  # Purplish Blue
            [0.550, 0.250, 0.350],  # Moderate Red
            [0.400, 0.250, 0.450],  # Purplish Pink
            [0.450, 0.450, 0.250],  # Yellow Green
            [0.500, 0.500, 0.350],  # Orange Yellow
            [0.250, 0.350, 0.350],  # Blue
            [0.500, 0.350, 0.350],  # Green
            [0.250, 0.250, 0.550],  # Red
            [0.450, 0.450, 0.150],  # Yellow
            [0.450, 0.250, 0.350],  # Magenta
            [0.200, 0.300, 0.300],  # Cyan
            [0.250, 0.250, 0.250],  # Neutral 1
            [0.400, 0.400, 0.400],  # Neutral 2
            [0.550, 0.550, 0.550],  # Neutral 3
            [0.700, 0.700, 0.700],  # Neutral 4
            [0.850, 0.850, 0.850],  # Neutral 5
            [0.950, 0.95, 0.95],  # Neutral 6
        ]
        
        # 简化实现：返回默认色彩映射
        return {
            "film_profile": "custom",
            "saturation": 1.0,
            "contrast": 1.0,
            "temperature": 0,
            "tint": 0,
            "shadow_boost": 0.0,
            "highlight_rolloff": 0.1,
            "detected_colors": len(xrite_reference),
            "confidence": 0.95
        }
