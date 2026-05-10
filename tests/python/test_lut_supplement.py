import pytest
import time
import numpy as np
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "python"))

from core.lut_generator import LUTGenerator


class TestLUTPerformance:
    def test_apply_lut_200x300_under_500ms(self, test_image_path):
        from utils.image_io import load_image_rgb
        img = load_image_rgb(test_image_path)
        generator = LUTGenerator(size=33)
        generator.generate_identity()
        start = time.time()
        generator.apply_lut(img)
        elapsed_ms = (time.time() - start) * 1000
        assert elapsed_ms < 500, f"LUT apply took {elapsed_ms:.0f}ms, expected < 500ms"

    def test_apply_lut_500x500_under_1s(self):
        generator = LUTGenerator(size=33)
        generator.generate_identity()
        img = np.random.rand(500, 500, 3).astype(np.float32)
        start = time.time()
        generator.apply_lut(img)
        elapsed_ms = (time.time() - start) * 1000
        assert elapsed_ms < 1000, f"LUT apply took {elapsed_ms:.0f}ms, expected < 1000ms"

    def test_generate_identity_under_100ms(self):
        generator = LUTGenerator(size=33)
        start = time.time()
        generator.generate_identity()
        elapsed_ms = (time.time() - start) * 1000
        assert elapsed_ms < 100, f"Identity LUT generation took {elapsed_ms:.0f}ms"


class TestLUTValueRange:
    def test_identity_lut_range(self):
        generator = LUTGenerator(size=33)
        lut = generator.generate_identity()
        assert lut.min() >= 0.0
        assert lut.max() <= 1.0

    def test_apply_lut_output_range(self, test_image_path):
        from utils.image_io import load_image_rgb
        img = load_image_rgb(test_image_path)
        generator = LUTGenerator(size=33)
        generator.generate_identity()
        result = generator.apply_lut(img)
        assert result.min() >= 0.0
        assert result.max() <= 1.0
        assert result.dtype == np.float32

    def test_apply_lut_preserves_shape(self, test_image_path):
        from utils.image_io import load_image_rgb
        img = load_image_rgb(test_image_path)
        generator = LUTGenerator(size=33)
        generator.generate_identity()
        result = generator.apply_lut(img)
        assert result.shape == img.shape

    def test_identity_lut_no_change(self, test_image_path):
        from utils.image_io import load_image_rgb
        img = load_image_rgb(test_image_path)
        generator = LUTGenerator(size=33)
        generator.generate_identity()
        result = generator.apply_lut(img)
        np.testing.assert_allclose(result, img, atol=0.05)


class TestCubeExport:
    def test_cube_header(self, tmp_dir):
        generator = LUTGenerator(size=33)
        generator.generate_identity()
        out_path = str(Path(tmp_dir) / "test.cube")
        generator.export_cube(out_path)
        with open(out_path, 'r') as f:
            content = f.read()
        assert "LUT_3D_SIZE 33" in content
        assert "DOMAIN_MIN" in content
        assert "DOMAIN_MAX" in content

    def test_cube_data_lines(self, tmp_dir):
        generator = LUTGenerator(size=33)
        generator.generate_identity()
        out_path = str(Path(tmp_dir) / "test.cube")
        generator.export_cube(out_path)
        with open(out_path, 'r') as f:
            lines = f.readlines()
        data_lines = [l for l in lines if l.strip()
                      and not l.startswith('#')
                      and not l.startswith('LUT')
                      and not l.startswith('DOMAIN')
                      and not l.startswith('TITLE')]
        assert len(data_lines) == 33 * 33 * 33

    def test_cube_values_valid(self, tmp_dir):
        generator = LUTGenerator(size=33)
        generator.generate_identity()
        out_path = str(Path(tmp_dir) / "test.cube")
        generator.export_cube(out_path)
        with open(out_path, 'r') as f:
            for line in f:
                if (line.strip()
                        and not line.startswith('#')
                        and not line.startswith('LUT')
                        and not line.startswith('DOMAIN')
                        and not line.startswith('TITLE')):
                    values = [float(x) for x in line.strip().split()]
                    assert len(values) == 3
                    for v in values:
                        assert 0.0 <= v <= 1.0
