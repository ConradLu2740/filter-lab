import pytest
import numpy as np
from app.services.lut_service import LUTGenerator


def test_generate_lut():
    """测试 LUT 生成"""
    generator = LUTGenerator(size=33)
    
    color_params = {
        "saturation": 1.0,
        "contrast": 1.0,
        "temperature": 0,
        "tint": 0,
        "shadow_boost": 0,
        "highlight_rolloff": 0.1
    }
    
    lut = generator.generate_lut(color_params)
    
    assert lut.shape == (33, 33, 33, 3)
    assert np.all(lut >= 0) and np.all(lut <= 1)


def test_generate_lut_with_saturation():
    """测试带饱和度调整的 LUT"""
    generator = LUTGenerator(size=17)
    
    color_params = {
        "saturation": 1.5,
        "contrast": 1.0,
        "temperature": 0,
        "tint": 0,
        "shadow_boost": 0,
        "highlight_rolloff": 0.1
    }
    
    lut = generator.generate_lut(color_params)
    
    assert lut.shape == (17, 17, 17, 3)
    # 更高的饱和度应该产生更饱和的颜色
    assert np.mean(lut) > 0.4  # 平均值应该较高


def test_export_cube_format():
    """测试 .cube 格式导出"""
    generator = LUTGenerator(size=17)
    
    color_params = {
        "saturation": 1.0,
        "contrast": 1.0,
        "temperature": 0,
        "tint": 0,
        "shadow_boost": 0,
        "highlight_rolloff": 0.1
    }
    
    lut = generator.generate_lut(color_params)
    cube_text = generator.export_cube_format(lut)
    
    assert "LUT_3D_SIZE 17" in cube_text
    assert "TITLE \"FilterLab LUT\"" in cube_text


def test_lut_base64_conversion():
    """测试 LUT base64 转换"""
    generator = LUTGenerator(size=17)
    
    color_params = {
        "saturation": 1.0,
        "contrast": 1.0,
        "temperature": 0,
        "tint": 0,
        "shadow_boost": 0,
        "highlight_rolloff": 0.1
    }
    
    lut = generator.generate_lut(color_params)
    lut_base64 = generator.lut_to_base64(lut)
    
    assert isinstance(lut_base64, str)
    assert len(lut_base64) > 0


def test_generate_lut_with_temperature():
    """测试带色温调整的 LUT"""
    generator = LUTGenerator(size=17)
    
    # 暖色调
    color_params_warm = {
        "saturation": 1.0,
        "contrast": 1.0,
        "temperature": 500,  # 偏暖
        "tint": 0,
        "shadow_boost": 0,
        "highlight_rolloff": 0.1
    }
    
    # 冷色调
    color_params_cool = {
        "saturation": 1.0,
        "contrast": 1.0,
        "temperature": -500,  # 偏冷
        "tint": 0,
        "shadow_boost": 0,
        "highlight_rolloff": 0.1
    }
    
    lut_warm = generator.generate_lut(color_params_warm)
    lut_cool = generator.generate_lut(color_params_cool)
    
    # 暖色调的 R 通道平均值应该更高
    assert np.mean(lut_warm[:, :, :, 0]) > np.mean(lut_cool[:, :, :, 0])
