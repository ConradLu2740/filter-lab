import pytest
import numpy as np
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "python"))

from utils.image_io import load_image, load_image_rgb, save_image, resize_image, image_to_base64


class TestLoadImage:
    def test_load_jpeg(self, test_image_path):
        img = load_image(test_image_path)
        assert img is not None
        assert img.shape == (300, 200, 3)
        assert img.dtype == np.uint8

    def test_load_png(self, test_png_path):
        img = load_image(test_png_path)
        assert img is not None
        assert img.shape == (300, 200, 3)

    def test_load_bmp(self, test_bmp_path):
        img = load_image(test_bmp_path)
        assert img is not None
        assert img.shape == (300, 200, 3)

    def test_load_chinese_path(self, chinese_path_image):
        img = load_image(chinese_path_image)
        assert img is not None
        assert len(img.shape) == 3

    def test_file_not_found(self):
        with pytest.raises(FileNotFoundError):
            load_image("D:/nonexistent_image.jpg")

    def test_corrupted_file(self, corrupted_path):
        with pytest.raises(ValueError):
            load_image(corrupted_path)

    def test_empty_file(self, empty_path):
        with pytest.raises(ValueError):
            load_image(empty_path)

    def test_text_file(self, text_file_path):
        with pytest.raises(ValueError):
            load_image(text_file_path)


class TestLoadImageRgb:
    def test_returns_float32(self, test_image_path):
        img = load_image_rgb(test_image_path)
        assert img.dtype == np.float32

    def test_range_0_to_1(self, test_image_path):
        img = load_image_rgb(test_image_path)
        assert img.min() >= 0.0
        assert img.max() <= 1.0

    def test_shape_preserved(self, test_image_path):
        img = load_image_rgb(test_image_path)
        assert img.shape == (300, 200, 3)

    def test_chinese_path(self, chinese_path_image):
        img = load_image_rgb(chinese_path_image)
        assert img.dtype == np.float32
        assert img.min() >= 0.0

    def test_black_image(self, test_black_path):
        img = load_image_rgb(test_black_path)
        assert img.max() < 0.02

    def test_white_image(self, test_white_path):
        img = load_image_rgb(test_white_path)
        assert img.min() > 0.95


class TestSaveImage:
    def test_save_and_reload(self, test_image_path, tmp_dir):
        img = load_image_rgb(test_image_path)
        out_path = str(Path(tmp_dir) / "output.jpg")
        save_image(out_path, img)
        assert Path(out_path).exists()
        reloaded = load_image(out_path)
        assert reloaded.shape == (300, 200, 3)

    def test_save_png(self, test_image_path, tmp_dir):
        img = load_image_rgb(test_image_path)
        out_path = str(Path(tmp_dir) / "output.png")
        save_image(out_path, img)
        assert Path(out_path).exists()

    def test_save_chinese_path(self, test_image_path, tmp_dir):
        img = load_image_rgb(test_image_path)
        out_path = str(Path(tmp_dir) / "输出_测试.jpg")
        save_image(out_path, img)
        assert Path(out_path).exists()


class TestResizeImage:
    def test_no_resize_small_image(self, test_image_path):
        img = load_image(test_image_path)
        resized = resize_image(img, max_size=2048)
        assert resized.shape == img.shape

    def test_resize_large_image(self):
        large = np.zeros((4000, 3000, 3), dtype=np.uint8)
        resized = resize_image(large, max_size=2048)
        assert max(resized.shape[:2]) <= 2048

    def test_aspect_ratio_preserved(self):
        img = np.zeros((1000, 2000, 3), dtype=np.uint8)
        resized = resize_image(img, max_size=1000)
        assert resized.shape[1] == 1000
        assert resized.shape[0] == 500


class TestImageToBase64:
    def test_returns_string(self, test_image_path):
        img = load_image_rgb(test_image_path)
        b64 = image_to_base64(img)
        assert isinstance(b64, str)
        assert len(b64) > 0

    def test_decodable(self, test_image_path):
        import base64
        img = load_image_rgb(test_image_path)
        b64 = image_to_base64(img)
        data = base64.b64decode(b64)
        assert data[:2] == b'\xff\xd8'

    def test_black_image(self, test_black_path):
        img = load_image_rgb(test_black_path)
        b64 = image_to_base64(img)
        assert len(b64) > 0

    def test_quality_parameter(self, test_image_path):
        img = load_image_rgb(test_image_path)
        b64_high = image_to_base64(img, quality=95)
        b64_low = image_to_base64(img, quality=10)
        assert len(b64_high) > len(b64_low)
