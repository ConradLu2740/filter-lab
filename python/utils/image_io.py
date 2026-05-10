# python/utils/image_io.py
"""
图像读写工具模块

提供统一的图像加载和保存接口，支持多种格式
特别处理中文路径（Windows 兼容）
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Tuple, Optional


def load_image(path: str) -> np.ndarray:
    """
    加载图像文件

    使用 np.fromfile 读取字节后通过 cv2.imdecode 解码，
    以支持包含中文、空格等特殊字符的文件路径。

    Args:
        path: 图像文件路径

    Returns:
        BGR格式的numpy数组 (H, W, 3)

    Raises:
        FileNotFoundError: 文件不存在
        ValueError: 无法读取图像
    """
    img_path = Path(path)
    if not img_path.exists():
        raise FileNotFoundError(f"Image not found: {path}")

    # 使用 np.fromfile 读取文件字节（支持中文路径）
    file_bytes = np.fromfile(str(img_path), dtype=np.uint8)

    if file_bytes.size == 0:
        raise ValueError(f"Cannot read image (empty file): {path}")

    # 通过 imdecode 解码图像
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError(f"Cannot read image: {path}")

    return img


def load_image_rgb(path: str) -> np.ndarray:
    """
    加载图像并转换为 RGB 格式

    Args:
        path: 图像文件路径

    Returns:
        RGB格式的numpy数组 (H, W, 3)，值域 [0, 1]
    """
    img = load_image(path)
    # BGR -> RGB，并归一化到 [0, 1]
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    return img_rgb


def save_image(path: str, img: np.ndarray) -> None:
    """
    保存图像

    使用 cv2.imencode + np.tofile 以支持中文路径。

    Args:
        path: 输出路径
        img: 图像数组，可以是 [0, 1] 浮点或 [0, 255] 整数
    """
    if img.dtype == np.float32 or img.dtype == np.float64:
        img = np.clip(img * 255, 0, 255).astype(np.uint8)

    # RGB -> BGR for OpenCV
    if len(img.shape) == 3 and img.shape[2] == 3:
        img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

    # 使用 imencode + tofile 支持中文路径
    ext = Path(path).suffix.lower()
    if ext in ['.jpg', '.jpeg']:
        _, buffer = cv2.imencode(ext, img, [cv2.IMWRITE_JPEG_QUALITY, 95])
    elif ext == '.png':
        _, buffer = cv2.imencode(ext, img, [cv2.IMWRITE_PNG_COMPRESSION, 3])
    else:
        _, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 95])

    buffer.tofile(path)


def resize_image(img: np.ndarray, max_size: int = 2048) -> np.ndarray:
    """
    等比例缩放图像，限制最大边长

    Args:
        img: 输入图像
        max_size: 最大边长

    Returns:
        缩放后的图像
    """
    h, w = img.shape[:2]
    if max(h, w) <= max_size:
        return img

    scale = max_size / max(h, w)
    new_w = int(w * scale)
    new_h = int(h * scale)

    return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)


def image_to_base64(img: np.ndarray, quality: int = 85) -> str:
    """
    将图像转换为 base64 字符串（用于预览）

    Args:
        img: 图像数组 [0, 1] 或 [0, 255]
        quality: JPEG 质量

    Returns:
        base64 编码的 JPEG 图像字符串
    """
    import base64

    if img.dtype == np.float32 or img.dtype == np.float64:
        img = np.clip(img * 255, 0, 255).astype(np.uint8)

    # 确保是 3 通道 RGB
    if len(img.shape) == 2:
        # 灰度图转 RGB
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
    elif len(img.shape) == 3:
        if img.shape[2] == 4:
            # RGBA 转 RGB
            img = cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)
        elif img.shape[2] == 3:
            # 已经是 RGB，转换为 BGR 用于 imencode
            img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
        elif img.shape[2] == 1:
            # 单通道转 RGB
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
            img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

    _, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, quality])
    return base64.b64encode(buffer).decode('utf-8')
