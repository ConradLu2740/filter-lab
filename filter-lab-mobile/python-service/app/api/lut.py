from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.lut_service import LUTGenerator

router = APIRouter()
lut_generator = LUTGenerator(size=33)


class LUTGenerateRequest(BaseModel):
    """LUT 生成请求"""
    color_params: dict
    size: Optional[int] = 33


class LUTGenerateResponse(BaseModel):
    """LUT 生成响应"""
    lut_base64: str
    lut_size: int
    cube_format: str  # .cube 格式文本
    preview_image: Optional[str] = None


class LUTApplyRequest(BaseModel):
    """LUT 应用请求"""
    image: str  # base64 图片
    lut_base64: Optional[str] = None  # 可选，如果为空则使用上次生成的 LUT
    color_params: Optional[dict] = None  # 可选，用于生成新 LUT


class LUTApplyResponse(BaseModel):
    """LUT 应用响应"""
    result_image: str  # 处理后的图片 base64


@router.post("/generate", response_model=LUTGenerateResponse)
async def generate_lut(request: LUTGenerateRequest):
    """
    生成 3D LUT API
    
    - 接收色彩参数
    - 生成 33x33x33 LUT
    - 返回 LUT 数据和 .cube 格式
    """
    try:
        # 更新 LUT 大小
        lut_generator.size = request.size
        
        # 生成 LUT
        lut = lut_generator.generate_lut(request.color_params)
        
        # 导出 .cube 格式
        cube_format = lut_generator.export_cube_format(lut)
        
        # 转换为 base64
        lut_base64 = lut_generator.lut_to_base64(lut)
        
        return LUTGenerateResponse(
            lut_base64=lut_base64,
            lut_size=request.size,
            cube_format=cube_format
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LUT generation failed: {str(e)}")


@router.post("/apply", response_model=LUTApplyResponse)
async def apply_lut(request: LUTApplyRequest):
    """
    应用 LUT 到图片 API
    
    - 解码图片
    - 应用 LUT
    - 返回处理后的图片
    """
    try:
        # 如果提供了新的色彩参数，先生成 LUT
        if request.color_params:
            lut_generator.generate_lut(request.color_params)
        
        # 应用 LUT 到图片
        result_image = lut_generator.apply_lut_to_image(request.image)
        
        return LUTApplyResponse(result_image=result_image)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LUT application failed: {str(e)}")
