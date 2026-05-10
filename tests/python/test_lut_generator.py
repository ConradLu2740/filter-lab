# tests/python/test_lut_generator.py
"""
LUT 生成引擎测试
"""

import pytest
import numpy as np
from python.core.lut_generator import LUTGenerator
from python.core.color_analyzer import ColorSample


class TestLUTGenerator:
    """LUTGenerator 测试类"""

    def test_generate_identity(self):
        """测试恒等 LUT 生成"""
        gen = LUTGenerator(size=33)
        lut = gen.generate_identity()

        assert lut.shape == (33, 33, 33, 3)
        assert lut.dtype == np.float32

        # 检查角点值
        assert np.allclose(lut[0, 0, 0], [0, 0, 0])
        assert np.allclose(lut[32, 32, 32], [1, 1, 1])

    def test_generate_from_samples(self):
        """测试从采样点生成 LUT"""
        gen = LUTGenerator(size=33)

        # 创建测试采样点
        samples = []
        for i in range(10):
            for j in range(10):
                for k in range(10):
                    samples.append(ColorSample(
                        input_rgb=np.array([i/9, j/9, k/9]),
                        output_rgb=np.array([i/9, j/9, k/9]),
                        weight=1.0
                    ))

        lut = gen.generate_from_samples(samples)
        assert lut.shape == (33, 33, 33, 3)

    def test_apply_lut(self):
        """测试 LUT 应用到图像"""
        gen = LUTGenerator(size=33)
        gen.generate_identity()

        # 创建测试图像
        image = np.random.rand(100, 100, 3).astype(np.float32)
        result = gen.apply_lut(image)

        assert result.shape == image.shape
        assert np.all(result >= 0) and np.all(result <= 1)

    def test_export_cube(self, tmp_path):
        """测试 .cube 导出"""
        gen = LUTGenerator(size=33)
        gen.generate_identity()

        output_path = tmp_path / "test.cube"
        gen.export_cube(str(output_path))

        assert output_path.exists()

        # 验证文件内容
        lines = output_path.read_text().strip().split('\n')
        assert 'TITLE' in lines[0]
        assert 'LUT_3D_SIZE 33' in lines[1]
        assert len(lines) == 4 + 33**3  # 头4行 + 数据行

    def test_quality_metrics(self):
        """测试质量指标"""
        gen = LUTGenerator(size=33)
        gen.generate_identity()

        metrics = gen.get_quality_metrics()
        assert 'color_coverage' in metrics
        assert 'smoothness' in metrics
        assert metrics['size'] == 33
