from PIL import Image
from typing import Tuple


def resize_image(image: Image.Image, max_size: int = 2048) -> Image.Image:
    """
    调整图片尺寸，保持宽高比
    
    Args:
        image: PIL Image 对象
        max_size: 最大边长
    
    Returns:
        调整后的 PIL Image 对象
    """
    width, height = image.size
    
    if width <= max_size and height <= max_size:
        return image
    
    if width > height:
        new_width = max_size
        new_height = int(height * (max_size / width))
    else:
        new_height = max_size
        new_width = int(width * (max_size / height))
    
    return image.resize((new_width, new_height), Image.Resampling.LANCZOS)


def create_thumbnail(image: Image.Image, size: Tuple[int, int] = (256, 256)) -> Image.Image:
    """
    创建缩略图
    
    Args:
        image: PIL Image 对象
        size: 缩略图尺寸 (width, height)
    
    Returns:
        缩略图 PIL Image 对象
    """
    image_copy = image.copy()
    image_copy.thumbnail(size, Image.Resampling.LANCZOS)
    return image_copy
