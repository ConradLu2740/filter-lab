import pytest
import json
import numpy as np
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "python"))

from utils.image_io import load_image_rgb
from core.color_analyzer import ColorAnalyzer


class TestAnalyzeSingle:
    def test_returns_dict(self, test_image_path):
        img = load_image_rgb(test_image_path)
        analyzer = ColorAnalyzer()
        result = analyzer.analyze_single(img)
        assert isinstance(result, dict)

    def test_has_required_keys(self, test_image_path):
        img = load_image_rgb(test_image_path)
        analyzer = ColorAnalyzer()
        result = analyzer.analyze_single(img)
        for key in ['mean_rgb', 'std_rgb', 'median_rgb', 'saturation_mean', 'contrast', 'histogram_peaks', 'film_matches']:
            assert key in result, f"Missing key: {key}"

    def test_json_serializable(self, test_image_path):
        img = load_image_rgb(test_image_path)
        analyzer = ColorAnalyzer()
        result = analyzer.analyze_single(img)
        json_str = json.dumps(result)
        assert len(json_str) > 0

    def test_mean_rgb_values(self, test_image_path):
        img = load_image_rgb(test_image_path)
        analyzer = ColorAnalyzer()
        result = analyzer.analyze_single(img)
        for v in result['mean_rgb']:
            assert isinstance(v, float)
            assert 0.0 <= v <= 1.0

    def test_film_matches_structure(self, test_image_path):
        img = load_image_rgb(test_image_path)
        analyzer = ColorAnalyzer()
        result = analyzer.analyze_single(img)
        assert len(result['film_matches']) > 0
        for match in result['film_matches']:
            assert 'name' in match
            assert 'description' in match
            assert 'confidence' in match
            assert isinstance(match['confidence'], float)

    def test_black_image(self, test_black_path):
        img = load_image_rgb(test_black_path)
        analyzer = ColorAnalyzer()
        result = analyzer.analyze_single(img)
        assert all(v < 0.05 for v in result['mean_rgb'])

    def test_white_image(self, test_white_path):
        img = load_image_rgb(test_white_path)
        analyzer = ColorAnalyzer()
        result = analyzer.analyze_single(img)
        assert all(v > 0.9 for v in result['mean_rgb'])

    def test_gradient_has_higher_contrast(self, test_gradient_path):
        img = load_image_rgb(test_gradient_path)
        analyzer = ColorAnalyzer()
        result = analyzer.analyze_single(img)
        assert result['contrast'] > 0

    def test_chinese_path_image(self, chinese_path_image):
        img = load_image_rgb(chinese_path_image)
        analyzer = ColorAnalyzer()
        result = analyzer.analyze_single(img)
        assert 'mean_rgb' in result
        json.dumps(result)

    def test_colors_image(self, test_colors_path):
        img = load_image_rgb(test_colors_path)
        analyzer = ColorAnalyzer()
        result = analyzer.analyze_single(img)
        assert result['saturation_mean'] > 0.1


class TestAnalyzePair:
    def test_same_image_returns_samples(self, test_image_path):
        img = load_image_rgb(test_image_path)
        analyzer = ColorAnalyzer()
        samples = analyzer.analyze_pair(img, img.copy())
        assert isinstance(samples, list)
        assert len(samples) > 0

    def test_sample_structure(self, test_image_path):
        img = load_image_rgb(test_image_path)
        analyzer = ColorAnalyzer()
        samples = analyzer.analyze_pair(img, img.copy())
        s = samples[0]
        assert hasattr(s, 'input_rgb')
        assert hasattr(s, 'output_rgb')
        assert hasattr(s, 'weight')
