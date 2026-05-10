import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "python"))

from core.film_profiles import FilmProfileLibrary, FilmProfile


EXPECTED_PROFILES = [
    'PROVIA/标准', 'Velvia/鲜艳', 'ASTIA/柔和', 'CLASSIC CHROME',
    'PRO Neg.Hi', 'PRO Neg.Std', 'CLASSIC Neg.', 'ETERNA/影院',
    'ETERNA BLEACH BYPASS', 'ACROS', 'NOSTALGIC Neg.'
]


class TestFilmProfileLibrary:
    def test_init_loads_profiles(self):
        lib = FilmProfileLibrary()
        assert len(lib.profiles) == 11

    def test_all_profiles_loaded(self):
        lib = FilmProfileLibrary()
        names = [p.name for p in lib.profiles]
        for expected in EXPECTED_PROFILES:
            assert expected in names, f"Missing profile: {expected}"

    def test_list_profiles(self):
        lib = FilmProfileLibrary()
        profiles = lib.list_profiles()
        assert len(profiles) == 11
        for p in profiles:
            assert 'name' in p
            assert 'description' in p

    def test_get_profile_by_name(self):
        lib = FilmProfileLibrary()
        provia = lib.get_profile('PROVIA/标准')
        assert provia is not None
        assert provia.name == 'PROVIA/标准'

    def test_get_nonexistent_profile(self):
        lib = FilmProfileLibrary()
        result = lib.get_profile('NonExistent')
        assert result is None


class TestFilmProfileMatch:
    def test_match_returns_sorted(self):
        lib = FilmProfileLibrary()
        features = {
            'mean_rgb': [0.45, 0.45, 0.45],
            'std_rgb': [0.18, 0.18, 0.18],
            'saturation_mean': 0.55,
            'contrast': 45.0,
            'histogram_peaks': {'r': 128, 'g': 128, 'b': 128},
        }
        matches = lib.match(features, top_k=3)
        assert len(matches) == 3
        for i in range(len(matches) - 1):
            assert matches[i][1] >= matches[i + 1][1]

    def test_match_provia_for_standard_features(self):
        lib = FilmProfileLibrary()
        features = {
            'mean_rgb': [0.45, 0.45, 0.45],
            'std_rgb': [0.18, 0.18, 0.18],
            'saturation_mean': 0.55,
            'contrast': 45.0,
            'histogram_peaks': {'r': 128, 'g': 128, 'b': 128},
        }
        matches = lib.match(features, top_k=1)
        assert matches[0][0].name == 'PROVIA/标准'

    def test_match_top_k_parameter(self):
        lib = FilmProfileLibrary()
        features = {
            'mean_rgb': [0.45, 0.45, 0.45],
            'std_rgb': [0.18, 0.18, 0.18],
            'saturation_mean': 0.55,
            'contrast': 45.0,
            'histogram_peaks': {'r': 128, 'g': 128, 'b': 128},
        }
        matches_1 = lib.match(features, top_k=1)
        matches_5 = lib.match(features, top_k=5)
        assert len(matches_1) == 1
        assert len(matches_5) == 5

    def test_match_similarity_range(self):
        lib = FilmProfileLibrary()
        features = {
            'mean_rgb': [0.45, 0.45, 0.45],
            'std_rgb': [0.18, 0.18, 0.18],
            'saturation_mean': 0.55,
            'contrast': 45.0,
            'histogram_peaks': {'r': 128, 'g': 128, 'b': 128},
        }
        matches = lib.match(features, top_k=11)
        for profile, sim in matches:
            assert 0.0 <= sim <= 1.0

    def test_match_low_saturation_matches_acros(self):
        lib = FilmProfileLibrary()
        features = {
            'mean_rgb': [0.45, 0.45, 0.45],
            'std_rgb': [0.18, 0.18, 0.18],
            'saturation_mean': 0.02,
            'contrast': 50.0,
            'histogram_peaks': {'r': 125, 'g': 125, 'b': 125},
        }
        matches = lib.match(features, top_k=1)
        assert matches[0][0].name == 'ACROS'


class TestFilmProfileSimilarity:
    def test_similarity_range(self):
        lib = FilmProfileLibrary()
        profile = lib.profiles[0]
        features = {
            'mean_rgb': [0.5, 0.5, 0.5],
            'std_rgb': [0.2, 0.2, 0.2],
            'saturation_mean': 0.5,
            'contrast': 50.0,
            'histogram_peaks': {'r': 128, 'g': 128, 'b': 128},
        }
        sim = profile.similarity(features)
        assert 0.0 <= sim <= 1.0

    def test_identical_features_high_similarity(self):
        lib = FilmProfileLibrary()
        profile = lib.get_profile('PROVIA/标准')
        features = dict(profile.fingerprint)
        sim = profile.similarity(features)
        assert sim > 0.9

    def test_empty_features_returns_zero(self):
        lib = FilmProfileLibrary()
        profile = lib.profiles[0]
        sim = profile.similarity({})
        assert sim == 0.0