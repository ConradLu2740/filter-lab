import pytest
from app.services.analyze_service import ColorAnalyzer
from app.utils.base64_utils import decode_base64_image

# 测试图片 base64
TEST_IMAGE = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAASCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q=="


def test_analyze_single_image():
    """测试单图分析"""
    analyzer = ColorAnalyzer()
    image = decode_base64_image(TEST_IMAGE)
    
    result = analyzer.analyze_single_image(image)
    
    assert "film_profile" in result
    assert "saturation" in result
    assert "confidence" in result
    assert 0 <= result["confidence"] <= 1.0


def test_analyze_with_mode():
    """测试指定模式分析"""
    analyzer = ColorAnalyzer()
    image = decode_base64_image(TEST_IMAGE)
    
    result = analyzer.analyze_single_image(image, mode="portra_400")
    
    assert result["film_profile"] == "portra_400"
    assert result["film_name"] == "Kodak Portra 400"


def test_analyze_colorchart():
    """测试色卡分析"""
    analyzer = ColorAnalyzer()
    image = decode_base64_image(TEST_IMAGE)
    
    result = analyzer.analyze_colorchart(image)
    
    assert "film_profile" in result
    assert result["confidence"] > 0.9


def test_analyze_velvia_mode():
    """测试 Velvia 模式"""
    analyzer = ColorAnalyzer()
    image = decode_base64_image(TEST_IMAGE)
    
    result = analyzer.analyze_single_image(image, mode="velvia")
    
    assert result["film_profile"] == "velvia"
    assert result["film_name"] == "Fuji Velvia"
    assert result["saturation"] == 1.4
