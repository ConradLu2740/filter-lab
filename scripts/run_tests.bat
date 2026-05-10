@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ============================================================
echo          FilterLab 功能测试一键运行脚本
echo ============================================================
echo.

cd /d "%~dp0\.."

set TOTAL_PASS=0
set TOTAL_FAIL=0
set TOTAL_ERROR=0
set ALL_PASS=1

echo [1/5] 生成测试数据...
python tests\data\generate_test_images.py 2>nul
if errorlevel 1 (
    echo   [跳过] 测试数据可能已存在
) else (
    echo   [完成] 测试数据已生成
)
echo.

echo [2/5] 运行单元测试 (image_io + color_analyzer + film_profiles)...
python -m pytest tests\python\test_image_io.py tests\python\test_color_analyzer.py tests\python\test_film_profiles.py -v --tb=short
if errorlevel 1 set ALL_PASS=0
echo.

echo [3/5] 运行 LUT 模块测试 (lut_generator + lut_supplement)...
python -m pytest tests\python\test_lut_generator.py tests\python\test_lut_supplement.py -v --tb=short
if errorlevel 1 set ALL_PASS=0
echo.

echo [4/5] 运行 RPC 集成测试...
python -m pytest tests\python\test_rpc_integration.py -v --tb=short
if errorlevel 1 set ALL_PASS=0
echo.

echo [5/5] 运行端到端冒烟测试...
python -m pytest tests\e2e\test_smoke.py -v --tb=short
if errorlevel 1 set ALL_PASS=0
echo.

echo ============================================================
if %ALL_PASS%==1 (
    echo          全部测试通过！
) else (
    echo          部分测试失败，请检查上方输出
)
echo ============================================================
echo.

python -m pytest tests\ -v --tb=short -q 2>nul | findstr "passed failed error"

echo.
pause
