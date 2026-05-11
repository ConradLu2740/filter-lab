from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.analyze_service import ColorAnalyzer
from app.utils.base64_utils import decode_base64_image, encode_image_to_base64

router = APIRouter()
analyzer = ColorAnalyzer()


class AnalyzeRequest(BaseModel):
    """色彩分析请求"""
    image: str  # base64 编码的图片
    mode: Optional[str] = "auto"  # 分析模式


class AnalyzeResponse(BaseModel):
    """色彩分析响应"""
    film_profile: str
    film_name: str
    saturation: float
    contrast: float
    temperature: float
    tint: float
    shadow_boost: float
    highlight_rolloff: float
    confidence: float
    preview_image: Optional[str] = None


@router.post("/single", response_model=AnalyzeResponse)
async def analyze_single(request: AnalyzeRequest):
    """
    单图色彩分析 API
    
    - 解码 base64 图片
    - 执行色彩分析
    - 返回色彩参数
    """
    try:
        # 解码图片
        image = decode_base64_image(request.image)
        
        # 执行分析
        result = analyzer.analyze_single_image(image, request.mode)
        
        return AnalyzeResponse(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/colorchart", response_model=AnalyzeResponse)
async def analyze_colorchart(request: AnalyzeRequest):
    """
    色卡分析 API
    
    - 检测 X-Rite ColorChecker
    - 计算精确色彩映射
    """
    try:
        image = decode_base64_image(request.image)
        result = analyzer.analyze_colorchart(image)
        
        return AnalyzeResponse(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Color chart analysis failed: {str(e)}")
