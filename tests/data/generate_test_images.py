import os
import shutil
import numpy as np
import cv2

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CHINESE_DIR = r"D:\测试目录\FilterLab"
WIDTH = 200
HEIGHT = 300

generated_files = []


def cleanup():
    for f in os.listdir(SCRIPT_DIR):
        path = os.path.join(SCRIPT_DIR, f)
        if os.path.isfile(path) and f not in ("__init__.py", "generate_test_images.py"):
            os.remove(path)
    if os.path.exists(CHINESE_DIR):
        shutil.rmtree(CHINESE_DIR)


def save_image(path, img):
    cv2.imwrite(path, img)
    generated_files.append(path)


def generate_red():
    img = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    img[:] = (0, 0, 255)
    save_image(os.path.join(SCRIPT_DIR, "test_red.jpg"), img)


def generate_gradient():
    gradient = np.linspace(0, 255, WIDTH, dtype=np.uint8)
    img = np.tile(gradient, (HEIGHT, 1))
    img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    save_image(os.path.join(SCRIPT_DIR, "test_gradient.jpg"), img)


def generate_colors():
    img = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    block_w = WIDTH // 3
    block_h = HEIGHT // 2
    colors = [
        (0, 0, 255),
        (0, 255, 0),
        (255, 0, 0),
        (0, 255, 255),
        (255, 255, 255),
        (0, 0, 0),
    ]
    positions = [
        (0, 0),
        (0, block_w),
        (0, block_w * 2),
        (block_h, 0),
        (block_h, block_w),
        (block_h, block_w * 2),
    ]
    for (r, c), color in zip(positions, colors):
        img[r:r + block_h, c:c + block_w] = color
    save_image(os.path.join(SCRIPT_DIR, "test_colors.jpg"), img)


def generate_black():
    img = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    save_image(os.path.join(SCRIPT_DIR, "test_black.jpg"), img)


def generate_white():
    img = np.ones((HEIGHT, WIDTH, 3), dtype=np.uint8) * 255
    save_image(os.path.join(SCRIPT_DIR, "test_white.jpg"), img)


def generate_png():
    img = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    img[:] = (128, 64, 32)
    save_image(os.path.join(SCRIPT_DIR, "test_png.png"), img)


def generate_bmp():
    img = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    img[:] = (32, 64, 128)
    save_image(os.path.join(SCRIPT_DIR, "test_bmp.bmp"), img)


def generate_chinese_path():
    os.makedirs(CHINESE_DIR, exist_ok=True)
    img = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    img[:] = (100, 150, 200)
    path = os.path.join(CHINESE_DIR, "测试图片.jpg")
    ext = os.path.splitext(path)[1]
    _, buf = cv2.imencode(ext, img)
    buf.tofile(path)
    generated_files.append(path)


def generate_corrupted():
    path = os.path.join(SCRIPT_DIR, "test_corrupted.jpg")
    data = np.random.bytes(1024)
    with open(path, "wb") as f:
        f.write(data)
    generated_files.append(path)


def generate_empty():
    path = os.path.join(SCRIPT_DIR, "test_empty.jpg")
    open(path, "w").close()
    generated_files.append(path)


def generate_text():
    path = os.path.join(SCRIPT_DIR, "test_text.txt")
    with open(path, "w") as f:
        f.write("this is not an image")
    generated_files.append(path)


def main():
    cleanup()
    os.makedirs(SCRIPT_DIR, exist_ok=True)
    generate_red()
    generate_gradient()
    generate_colors()
    generate_black()
    generate_white()
    generate_png()
    generate_bmp()
    generate_chinese_path()
    generate_corrupted()
    generate_empty()
    generate_text()
    print("Generated files:")
    for f in generated_files:
        print(f"  {f}")
    print(f"\nTotal: {len(generated_files)} files")


if __name__ == "__main__":
    main()
