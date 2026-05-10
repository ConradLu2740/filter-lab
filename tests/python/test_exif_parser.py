# tests/python/test_exif_parser.py
"""
EXIF 解析模块测试
"""

import pytest
from python.core.exif_parser import EXIFParser


class TestEXIFParser:
    """EXIFParser 测试类"""

    def test_parse_returns_dict(self):
        """测试解析返回字典"""
        # 使用一个测试图片（需要准备测试图片）
        result = EXIFParser.parse("tests/data/test_fuji.jpg")
        assert isinstance(result, dict)
        assert 'camera' in result
        assert 'filmMode' in result

    def test_parse_nonexistent_file(self):
        """测试不存在的文件"""
        result = EXIFParser.parse("nonexistent.jpg")
        assert result['camera'] is None

    def test_is_fuji_camera(self):
        """测试富士相机识别"""
        # 需要测试图片
        pass

    def test_fuji_film_modes(self):
        """测试胶片模式映射"""
        assert EXIFParser.FUJI_FILM_MODES[0] == 'Provia/Standard'
        assert EXIFParser.FUJI_FILM_MODES[1] == 'Velvia/Vivid'
        assert EXIFParser.FUJI_FILM_MODES[3] == 'Classic Chrome'
