from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.health import router as health_router
from app.api.analyze import router as analyze_router
from app.api.lut import router as lut_router
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="FilterLab 核心算法服务"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(health_router, prefix="/health", tags=["健康检查"])
app.include_router(analyze_router, prefix="/api/v1/analyze", tags=["色彩分析"])
app.include_router(lut_router, prefix="/api/v1/lut", tags=["LUT 生成"])

@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "status": "running"
    }
