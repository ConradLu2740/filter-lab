import pytest
import sys
import os
import subprocess
import json
import time
import threading
import queue
import tempfile
import shutil
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.parent
PYTHON_ROOT = PROJECT_ROOT / "python"
TESTS_DATA = PROJECT_ROOT / "tests" / "data"
CHINESE_PATH_IMAGE = Path("D:/测试目录/FilterLab/测试图片.jpg")


@pytest.fixture
def test_image_path():
    return str(TESTS_DATA / "test_red.jpg")


@pytest.fixture
def test_gradient_path():
    return str(TESTS_DATA / "test_gradient.jpg")


@pytest.fixture
def test_colors_path():
    return str(TESTS_DATA / "test_colors.jpg")


@pytest.fixture
def test_black_path():
    return str(TESTS_DATA / "test_black.jpg")


@pytest.fixture
def test_white_path():
    return str(TESTS_DATA / "test_white.jpg")


@pytest.fixture
def test_png_path():
    return str(TESTS_DATA / "test_png.png")


@pytest.fixture
def test_bmp_path():
    return str(TESTS_DATA / "test_bmp.bmp")


@pytest.fixture
def chinese_path_image():
    if not CHINESE_PATH_IMAGE.exists():
        pytest.skip("Chinese path test image not found")
    return str(CHINESE_PATH_IMAGE)


@pytest.fixture
def corrupted_path():
    return str(TESTS_DATA / "test_corrupted.jpg")


@pytest.fixture
def empty_path():
    return str(TESTS_DATA / "test_empty.jpg")


@pytest.fixture
def text_file_path():
    return str(TESTS_DATA / "test_text.txt")


@pytest.fixture
def tmp_dir():
    d = tempfile.mkdtemp(prefix="filterlab_test_")
    yield d
    shutil.rmtree(d, ignore_errors=True)


@pytest.fixture
def python_root():
    return str(PYTHON_ROOT)


class RPCClient:
    def __init__(self, python_root):
        env = os.environ.copy()
        env["PYTHONPATH"] = python_root
        self.proc = subprocess.Popen(
            [sys.executable, "-u", str(Path(python_root) / "main.py")],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
            cwd=python_root
        )
        self._queue = queue.Queue()
        self._reader = threading.Thread(target=self._read_stdout, daemon=True)
        self._reader.start()
        self._next_id = 1

    def _read_stdout(self):
        try:
            for line in self.proc.stdout:
                self._queue.put(line.decode("utf-8").strip())
        except:
            pass

    def call(self, method, params=None, timeout=60):
        req_id = self._next_id
        self._next_id += 1
        request = {"jsonrpc": "2.0", "method": method, "id": req_id}
        if params:
            request["params"] = params
        self.proc.stdin.write((json.dumps(request) + "\n").encode())
        self.proc.stdin.flush()

        start = time.time()
        while time.time() - start < timeout:
            try:
                line = self._queue.get(timeout=0.5)
                if line:
                    resp = json.loads(line)
                    if resp.get("id") == req_id:
                        return resp
            except queue.Empty:
                continue
        raise TimeoutError(f"RPC call '{method}' timed out after {timeout}s")

    def close(self):
        try:
            self.proc.terminate()
            self.proc.wait(timeout=5)
        except:
            self.proc.kill()


@pytest.fixture
def rpc_client(python_root):
    client = RPCClient(python_root)
    yield client
    client.close()
