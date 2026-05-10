import pytest
import json
import numpy as np
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "python"))


class TestRPCPing:
    def test_ping_returns_ready(self, rpc_client):
        resp = rpc_client.call("ping")
        assert resp["jsonrpc"] == "2.0"
        assert "result" in resp
        assert resp["result"]["ready"] is True

    def test_ping_has_version(self, rpc_client):
        resp = rpc_client.call("ping")
        assert "version" in resp["result"]


class TestRPCAnalyze:
    def test_analyze_single_mode(self, rpc_client, test_image_path):
        resp = rpc_client.call("analyze", {
            "imagePath": test_image_path,
            "mode": "single"
        }, timeout=30)
        assert "result" in resp, f"Error: {resp.get('error')}"
        result = resp["result"]
        assert "lut3d" in result
        assert "previewBase64" in result
        assert "metadata" in result

    def test_analyze_lut_shape(self, rpc_client, test_image_path):
        resp = rpc_client.call("analyze", {
            "imagePath": test_image_path,
            "mode": "single"
        }, timeout=30)
        result = resp["result"]
        lut = np.array(result["lut3d"])
        assert lut.shape == (33, 33, 33, 3)

    def test_analyze_preview_is_base64(self, rpc_client, test_image_path):
        resp = rpc_client.call("analyze", {
            "imagePath": test_image_path,
            "mode": "single"
        }, timeout=30)
        result = resp["result"]
        preview = result["previewBase64"]
        assert isinstance(preview, str)
        assert len(preview) > 100

    def test_analyze_has_features(self, rpc_client, test_image_path):
        resp = rpc_client.call("analyze", {
            "imagePath": test_image_path,
            "mode": "single"
        }, timeout=30)
        result = resp["result"]
        assert "features" in result
        features = result["features"]
        assert "mean_rgb" in features
        assert "film_matches" in features

    def test_analyze_chinese_path(self, rpc_client, chinese_path_image):
        resp = rpc_client.call("analyze", {
            "imagePath": chinese_path_image,
            "mode": "single"
        }, timeout=30)
        assert "result" in resp, f"Error: {resp.get('error')}"
        assert "previewBase64" in resp["result"]

    def test_analyze_nonexistent_file(self, rpc_client):
        resp = rpc_client.call("analyze", {
            "imagePath": "D:/nonexistent_999.jpg",
            "mode": "single"
        }, timeout=10)
        assert "error" in resp


class TestRPCAdjustPreview:
    def test_adjust_preview_basic(self, rpc_client, test_image_path):
        params = {
            "whiteBalance": {"temperature": 5500, "tint": 0},
            "tone": {"highlights": 10, "shadows": -5, "contrast": 5},
            "color": {"saturation": 10, "vibrance": 5},
            "hueShifts": {},
            "curve": {"rgb": [], "red": [], "green": [], "blue": []},
        }
        resp = rpc_client.call("adjust_preview", {
            "imagePath": test_image_path,
            "params": params
        }, timeout=15)
        assert "result" in resp, f"Error: {resp.get('error')}"
        assert "previewBase64" in resp["result"]

    def test_adjust_preview_warm_tone(self, rpc_client, test_image_path):
        params = {
            "whiteBalance": {"temperature": 7000, "tint": 10},
            "tone": {"highlights": -20, "shadows": 15, "contrast": 20},
            "color": {"saturation": 30, "vibrance": 20},
            "hueShifts": {},
            "curve": {"rgb": [], "red": [], "green": [], "blue": []},
        }
        resp = rpc_client.call("adjust_preview", {
            "imagePath": test_image_path,
            "params": params
        }, timeout=15)
        assert "result" in resp, f"Error: {resp.get('error')}"
        assert "previewBase64" in resp["result"]

    def test_adjust_preview_empty_params(self, rpc_client, test_image_path):
        params = {
            "whiteBalance": {},
            "tone": {},
            "color": {},
            "hueShifts": {},
            "curve": {},
        }
        resp = rpc_client.call("adjust_preview", {
            "imagePath": test_image_path,
            "params": params
        }, timeout=15)
        assert "result" in resp, f"Error: {resp.get('error')}"
        assert "previewBase64" in resp["result"]


class TestRPCExportLut:
    def test_export_cube_format(self, rpc_client, test_image_path, tmp_dir):
        analyze_resp = rpc_client.call("analyze", {
            "imagePath": test_image_path,
            "mode": "single"
        }, timeout=30)
        result = analyze_resp["result"]

        out_path = str(Path(tmp_dir) / "test_export.cube")
        resp = rpc_client.call("export_lut", {
            "lut3d": result["lut3d"],
            "format": "cube",
            "outputPath": out_path,
        }, timeout=15)
        assert "result" in resp, f"Error: {resp.get('error')}"
        assert resp["result"]["success"] is True
        assert Path(out_path).exists()

    def test_export_preset_format(self, rpc_client, test_image_path, tmp_dir):
        out_path = str(Path(tmp_dir) / "test_export.json")
        resp = rpc_client.call("export_lut", {
            "lut3d": np.zeros((33, 33, 33, 3)).tolist(),
            "format": "preset",
            "outputPath": out_path,
            "presetData": {"name": "test", "author": "test"},
        }, timeout=15)
        assert "result" in resp, f"Error: {resp.get('error')}"
        assert resp["result"]["success"] is True
        assert Path(out_path).exists()

    def test_export_unsupported_format(self, rpc_client, tmp_dir):
        out_path = str(Path(tmp_dir) / "test.xyz")
        resp = rpc_client.call("export_lut", {
            "lut3d": np.zeros((33, 33, 33, 3)).tolist(),
            "format": "xyz_unknown",
            "outputPath": out_path,
        }, timeout=15)
        assert "result" in resp
        assert resp["result"]["success"] is False


class TestRPCBatchAnalyze:
    def test_batch_two_images(self, rpc_client, test_image_path, test_png_path):
        resp = rpc_client.call("batch_analyze", {
            "imagePaths": [test_image_path, test_png_path],
            "mode": "single"
        }, timeout=60)
        assert "result" in resp, f"Error: {resp.get('error')}"
        results = resp["result"]["results"]
        assert len(results) == 2

    def test_batch_one_fails_gracefully(self, rpc_client, test_image_path):
        resp = rpc_client.call("batch_analyze", {
            "imagePaths": [test_image_path, "D:/nonexistent.jpg"],
            "mode": "single"
        }, timeout=60)
        assert "result" in resp
        results = resp["result"]["results"]
        assert len(results) == 2
        assert "error" in results[1]


class TestRPCErrorHandling:
    def test_unknown_method(self, rpc_client):
        resp = rpc_client.call("fake_method_xyz")
        assert "error" in resp
        assert resp["error"]["code"] == -32601

    def test_server_stays_alive_after_error(self, rpc_client):
        rpc_client.call("fake_method_xyz")
        resp = rpc_client.call("ping")
        assert resp["result"]["ready"] is True

    def test_missing_params(self, rpc_client):
        resp = rpc_client.call("analyze", {})
        assert "error" in resp
