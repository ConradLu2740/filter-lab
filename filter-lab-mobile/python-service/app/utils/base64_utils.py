import base64
import io
from PIL import Image
from typing import Tuple


def decode_base64_image(base64_string: str) -> Image.Image:
    """
    解码 base64 字符串为 PIL Image 对象
    
    Args:
        base64_string: 图片的 base64 编码（不含 data URI 前缀）
    
    Returns:
        PIL Image 对象
    
    Raises:
        ValueError: base64 格式无效或图片解码失败
    """
    try:
        # 移除可能的 data URI 前缀
        if "," in base64_string:
            base64_string = base64_string.split(",", 1)[1]
        
        # 解码 base64
        image_data = base64.b64decode(base64_string)
        
        # 转换为 PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # 确保 RGB 模式
        if image.mode != "RGB":
            image = image.convert("RGB")
        
        return image
        
    except Exception as e:
        raise ValueError(f"Failed to decode base64 image: {str(e)}")


def encode_image_to_base64(image: Image.Image, format: str = "JPEG", quality: int = 95) -> str:
    """
    将 PIL Image 对象编码为 base64 字符串
    
    Args:
        image: PIL Image 对象
        format: 输出格式 (JPEG/PNG)
        quality: JPEG 质量 (1-100)
    
    Returns:
        base64 编码字符串（不含 data URI 前缀）
    """
    buffer = io.BytesIO()
    
    if format.upper() == "JPEG":
        image.save(buffer, format=format, quality=quality)
    else:
        image.save(buffer, format=format)
    
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def get_image_info(base64_string: str) -> dict:
    """
    获取图片信息（尺寸、格式等）
    
    Returns:
        dict: {width, height, format, size_bytes}
    """
    image = decode_base64_image(base64_string)
    
    return {
        "width": image.width,
        "height": image.height,
        "format": image.format or "JPEG",
        "mode": image.mode
    }
