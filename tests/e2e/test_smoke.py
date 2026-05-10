import pytest
import sys
import os
import json
import time
import subprocess
import threading
import queue
import tempfile
import shutil
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.parent
PYTHON_ROOT = PROJECT_ROOT / "python"
TEST_IMAGE = PROJECT_ROOT / "tests" / "data" / "test_red.jpg"
CHINESE_IMAGE = Path("D:/测试目录/FilterLab/测试图片.jpg")


class SmokeClient:
    def __init__(self):
        env = os.environ.copy()
        env["PYTHONPATH"] = str(PYTHON_ROOT)
        self.proc = subprocess.Popen(
            [sys.executable, "-u", str(PYTHON_ROOT / "main.py")],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
            cwd=str(PYTHON_ROOT)
        )
        self._queue = queue.Queue()
        self._reader = threading.Thread(target=self._read, daemon=True)
        self._reader.start()
        self._id = 0

    def _read(self):
        try:
            for line in self.proc.stdout:
                self._queue.put(line.decode("utf-8").strip())
        except:
            pass

    def call(self, method, params=None, timeout=60):
        self._id += 1
        req = {"jsonrpc": "2.0", "method": method, "id": self._id}
        if params:
            req["params"] = params
        self.proc.stdin.write((json.dumps(req) + "\n").encode())
        self.proc.stdin.flush()
        start = time.time()
        while time.time() - start < timeout:
            try:
                line = self._queue.get(timeout=0.5)
                if line:
                    resp = json.loads(line)
                    if resp.get("id") == self._id:
                        return resp
            except queue.Empty:
                continue
        raise TimeoutError(f"'{method}' timed out after {timeout}s")

    def close(self):
        try:
            self.proc.terminate()
            self.proc.wait(timeout=5)
        except:
            self.proc.kill()


@pytest.fixture(scope="module")
def smoke_client():
    client = SmokeClient()
    yield client
    client.close()


@pytest.fixture(scope="module")
def tmp_dir():
    d = tempfile.mkdtemp(prefix="smoke_test_")
    yield d
    shutil.rmtree(d, ignore_errors=True)


class TestSmokeNormalPath:
    def test_step1_ping(self, smoke_client):
        resp = smoke_client.call("ping")
        assert resp["result"]["ready"] is True

    def test_step2_analyze(self, smoke_client):
        resp = smoke_client.call("analyze", {"imagePath": str(TEST_IMAGE), "mode": "single"}, timeout=30)
        assert "result" in resp
        assert "lut3d" in resp["result"]
        assert "previewBase64" in resp["result"]

    def test_step3_adjust_preview(self, smoke_client):
        params = {
            "whiteBalance": {"temperature": 5500, "tint": 0},
            "tone": {"highlights": 10, "shadows": -5, "contrast": 5},
            "color": {"saturation": 10, "vibrance": 5},
            "hueShifts": {},
            "curve": {"rgb": [], "red": [], "green": [], "blue": []},
        }
        resp = smoke_client.call("adjust_preview", {"imagePath": str(TEST_IMAGE), "params": params}, timeout=15)
        assert "result" in resp
        assert "previewBase64" in resp["result"]

    def test_step4_export_cube(self, smoke_client, tmp_dir):
        analyze_resp = smoke_client.call("analyze", {"imagePath": str(TEST_IMAGE), "mode": "single"}, timeout=30)
        result = analyze_resp["result"]
        out_path = str(Path(tmp_dir) / "smoke.cube")
        resp = smoke_client.call("export_lut", {
            "lut3d": result["lut3d"],
            "params": result["params"],
            "metadata": result["metadata"],
            "format": "cube",
            "outputPath": out_path,
        }, timeout=15)
        assert "result" in resp
        assert Path(resp["result"]["outputPath"]).exists()


class TestSmokeChinesePath:
    def test_analyze_chinese_path(self, smoke_client):
        if not CHINESE_IMAGE.exists():
            pytest.skip("Chinese path image not found")
        resp = smoke_client.call("analyze", {"imagePath": str(CHINESE_IMAGE), "mode": "single"}, timeout=30)
        assert "result" in resp, f"Error: {resp.get('error')}"
        assert "previewBase64" in resp["result"]

    def test_adjust_chinese_path(self, smoke_client):
        if not CHINESE_IMAGE.exists():
            pytest.skip("Chinese path image not found")
        params = {
            "whiteBalance": {"temperature": 5500, "tint": 0},
            "tone": {"highlights": 0, "shadows": 0, "contrast": 0},
            "color": {"saturation": 0, "vibrance": 0},
            "hueShifts": {},
            "curve": {"rgb": [], "red": [], "green": [], "blue": []},
        }
        resp = smoke_client.call("adjust_preview", {"imagePath": str(CHINESE_IMAGE), "params": params}, timeout=15)
        assert "result" in resp, f"Error: {resp.get('error')}"


class TestSmokeErrorRecovery:
    def test_error_does_not_crash_server(self, smoke_client):
        smoke_client.call("analyze", {"imagePath": "D:/nonexistent.jpg", "mode": "single"}, timeout=10)
        resp = smoke_client.call("ping")
        assert resp["result"]["ready"] is True

    def test_unknown_method_recovery(self, smoke_client):
        smoke_client.call("fake_method", timeout=5)
        resp = smoke_client.call("ping")
        assert resp["result"]["ready"] is True
