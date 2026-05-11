import pytest
from app.utils.base64_utils import decode_base64_image, encode_image_to_base64, get_image_info

# 测试用的小图片 base64 (1x1 红色 JPEG)
TEST_IMAGE_BASE64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q=="


def test_decode_base64_image():
    """测试 base64 解码"""
    image = decode_base64_image(TEST_IMAGE_BASE64)
    assert image is not None
    assert image.size == (1, 1)


def test_get_image_info():
    """测试获取图片信息"""
    info = get_image_info(TEST_IMAGE_BASE64)
    assert info["width"] == 1
    assert info["height"] == 1
    assert info["format"] == "JPEG"


def test_encode_decode_roundtrip():
    """测试编码解码往返"""
    original = decode_base64_image(TEST_IMAGE_BASE64)
    encoded = encode_image_to_base64(original)
    decoded = decode_base64_image(encoded)
    assert decoded.size == original.size
