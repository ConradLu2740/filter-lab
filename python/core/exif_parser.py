# python/core/exif_parser.py
"""
EXIF 元数据解析模块

读取照片EXIF信息，识别相机型号和胶片模拟模式
"""

import exifread
from pathlib import Path
from typing import Dict, Optional


class EXIFParser:
    """EXIF 元数据解析器"""

    # 富士胶片模拟模式映射
    FUJI_FILM_MODES = {
        0: 'Provia/Standard',
        1: 'Velvia/Vivid',
        2: 'Astia/Soft',
        3: 'Classic Chrome',
        4: 'PRO Neg. Hi',
        5: 'PRO Neg. Std',
        6: 'Classic Neg',
        7: 'Nostalgic Neg',
        8: 'Acros',
        9: 'Monochrome',
        10: 'Sepia',
    }

    @staticmethod
    def parse(path: str) -> Dict[str, Optional[str]]:
        """
        解析图像文件的 EXIF 信息

        Args:
            path: 图像文件路径

        Returns:
            包含相机信息的字典
        """
        result = {
            'camera': None,
            'filmMode': None,
            'lens': None,
            'iso': None,
            'aperture': None,
            'shutterSpeed': None,
        }

        try:
            with open(path, 'rb') as f:
                tags = exifread.process_file(f, details=False)

            # 相机品牌
            make = tags.get('Image Make')
            if make:
                result['camera'] = str(make).strip()

            # 相机型号
            model = tags.get('Image Model')
            if model:
                model_str = str(model).strip()
                if result['camera']:
                    result['camera'] = f"{result['camera']} {model_str}"
                else:
                    result['camera'] = model_str

            # 镜头信息
            lens = tags.get('EXIF LensModel')
            if lens:
                result['lens'] = str(lens).strip()

            # ISO
            iso = tags.get('EXIF ISOSpeedRatings')
            if iso:
                result['iso'] = int(str(iso))

            # 光圈
            aperture = tags.get('EXIF FNumber')
            if aperture:
                result['aperture'] = str(aperture)

            # 快门速度
            shutter = tags.get('EXIF ExposureTime')
            if shutter:
                result['shutterSpeed'] = str(shutter)

            # 富士胶片模拟模式（MakerNote中）
            film_mode = EXIFParser._extract_fuji_film_mode(tags)
            if film_mode:
                result['filmMode'] = film_mode

        except Exception as e:
            print(f"EXIF parsing error: {e}")

        return result

    @staticmethod
    def _extract_fuji_film_mode(tags: Dict) -> Optional[str]:
        """
        从富士 MakerNote 中提取胶片模拟模式

        Args:
            tags: exifread 解析的标签字典

        Returns:
            胶片模拟模式名称，或 None
        """
        # 尝试从 MakerNote 中获取
        maker_note = tags.get('MakerNote Tag 0x1401')
        if maker_note:
            try:
                mode_value = int(str(maker_note))
                return EXIFParser.FUJI_FILM_MODES.get(mode_value)
            except (ValueError, TypeError):
                pass

        # 备用：从其他标签尝试
        # 富士的胶片模式信息有时在不同标签中
        for tag_name in ['MakerNote Tag 0x1401', 'MakerNote Tag 0x3101']:
            tag = tags.get(tag_name)
            if tag:
                try:
                    mode_value = int(str(tag))
                    mode = EXIFParser.FUJI_FILM_MODES.get(mode_value)
                    if mode:
                        return mode
                except (ValueError, TypeError):
                    continue

        return None

    @staticmethod
    def is_fuji_camera(path: str) -> bool:
        """
        判断是否为富士相机拍摄的照片

        Args:
            path: 图像文件路径

        Returns:
            是否为富士相机
        """
        try:
            with open(path, 'rb') as f:
                tags = exifread.process_file(f, details=False)
            make = tags.get('Image Make')
            if make:
                return 'FUJIFILM' in str(make).upper()
        except Exception:
            pass
        return False
