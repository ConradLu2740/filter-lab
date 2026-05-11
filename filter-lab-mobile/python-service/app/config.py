from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置"""
    app_name: str = "FilterLab Python Service"
    debug: bool = False
    
    # 图像处理配置
    max_image_size: int = 4096
    lut_size: int = 33
    
    # 性能配置
    max_concurrent_tasks: int = 5
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
