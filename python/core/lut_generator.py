# python/core/lut_generator.py
"""
3D LUT 生成引擎

基于色彩采样点生成 33x33x33 的三维查找表
"""

import numpy as np
from scipy.interpolate import RegularGridInterpolator
from typing import List, Optional
from core.color_analyzer import ColorSample


class LUTGenerator:
    """3D LUT 生成器"""

    def __init__(self, size: int = 33):
        """
        初始化 LUT 生成器

        Args:
            size: LUT 维度大小（默认33）
        """
        self.size = size
        self.lut = None

    def generate_from_samples(self, samples: List[ColorSample],
                              smooth: bool = True) -> np.ndarray:
        """
        从色彩采样点生成 3D LUT

        Args:
            samples: 色彩采样点列表
            smooth: 是否应用平滑处理

        Returns:
            3D LUT 数组 (size, size, size, 3)
        """
        if len(samples) < 8:
            raise ValueError(f"Need at least 8 samples, got {len(samples)}")

        # 提取输入和输出色彩
        inputs = np.array([s.input_rgb for s in samples])
        outputs = np.array([s.output_rgb for s in samples])
        weights = np.array([s.weight for s in samples])

        # 构建网格坐标
        grid_coords = np.linspace(0, 1, self.size)

        # 为每个通道分别进行插值
        lut = np.zeros((self.size, self.size, self.size, 3), dtype=np.float32)

        # 使用 RBF 插值或最近邻加权平均
        # 这里使用加权距离插值
        for i, r in enumerate(grid_coords):
            for j, g in enumerate(grid_coords):
                for k, b in enumerate(grid_coords):
                    point = np.array([r, g, b])
                    lut[i, j, k] = self._interpolate_point(
                        point, inputs, outputs, weights
                    )

        if smooth:
            lut = self._smooth_lut(lut)

        self.lut = lut
        return lut

    def generate_identity(self) -> np.ndarray:
        """
        生成恒等 LUT（无变换）

        Returns:
            恒等 3D LUT
        """
        lut = np.zeros((self.size, self.size, self.size, 3), dtype=np.float32)
        coords = np.linspace(0, 1, self.size)

        for i, r in enumerate(coords):
            for j, g in enumerate(coords):
                for k, b in enumerate(coords):
                    lut[i, j, k] = [r, g, b]

        self.lut = lut
        return lut

    def apply_lut(self, image: np.ndarray) -> np.ndarray:
        """
        将 LUT 应用到图像

        Args:
            image: RGB 图像 [0, 1]

        Returns:
            应用 LUT 后的图像
        """
        if self.lut is None:
            raise ValueError("LUT not generated yet")

        h, w = image.shape[:2]
        flat = image.reshape(-1, 3)

        # 将 [0, 1] 映射到 LUT 索引
        indices = flat * (self.size - 1)

        # 三线性插值
        result = self._trilinear_interpolate(indices, self.lut)

        return result.reshape(h, w, 3)

    def export_cube(self, filepath: str, title: str = "FilterLab LUT") -> None:
        """
        导出为 .cube 格式

        Args:
            filepath: 输出文件路径
            title: LUT 标题
        """
        if self.lut is None:
            raise ValueError("LUT not generated yet")

        with open(filepath, 'w') as f:
            f.write(f"TITLE \"{title}\"\n")
            f.write(f"LUT_3D_SIZE {self.size}\n")
            f.write("DOMAIN_MIN 0.0 0.0 0.0\n")
            f.write("DOMAIN_MAX 1.0 1.0 1.0\n")

            # 按 R 变化最快，B 变化最慢的顺序输出
            for b in range(self.size):
                for g in range(self.size):
                    for r in range(self.size):
                        rgb = self.lut[r, g, b]
                        f.write(f"{rgb[0]:.6f} {rgb[1]:.6f} {rgb[2]:.6f}\n")

    def get_quality_metrics(self) -> dict:
        """
        获取 LUT 质量指标

        Returns:
            质量指标字典
        """
        if self.lut is None:
            return {}

        # 计算色彩覆盖率
        unique_colors = len(np.unique(
            self.lut.reshape(-1, 3),
            axis=0
        ))
        coverage = unique_colors / (self.size ** 3)

        # 计算平滑度（相邻点差异）
        diffs = []
        for axis in range(3):
            shifted = np.roll(self.lut, 1, axis=axis)
            diff = np.abs(self.lut - shifted)
            diffs.append(float(np.mean(diff)))
        smoothness = 1.0 - np.mean(diffs)

        return {
            'color_coverage': float(coverage),
            'smoothness': float(smoothness),
            'size': self.size,
            'total_entries': self.size ** 3,
        }

    def _interpolate_point(self, point: np.ndarray,
                           inputs: np.ndarray,
                           outputs: np.ndarray,
                           weights: np.ndarray) -> np.ndarray:
        """加权距离插值单个点"""
        # 计算与所有采样点的距离
        distances = np.linalg.norm(inputs - point, axis=1)

        # 避免除零
        distances = np.maximum(distances, 1e-8)

        # 使用逆距离加权
        inv_distances = 1.0 / distances
        w = inv_distances * weights
        w_sum = np.sum(w)

        if w_sum < 1e-8:
            return point  # 返回原始值

        # 加权平均
        result = np.sum(outputs * w[:, np.newaxis], axis=0) / w_sum
        return np.clip(result, 0, 1)

    def _smooth_lut(self, lut: np.ndarray, iterations: int = 1) -> np.ndarray:
        """对 LUT 进行平滑处理"""
        smoothed = lut.copy()

        for _ in range(iterations):
            # 3D 高斯平滑
            from scipy.ndimage import gaussian_filter
            for c in range(3):
                smoothed[:, :, :, c] = gaussian_filter(
                    smoothed[:, :, :, c], sigma=0.5
                )

        return np.clip(smoothed, 0, 1)

    def _trilinear_interpolate(self, indices: np.ndarray,
                                lut: np.ndarray) -> np.ndarray:
        """三线性插值 - 优化版本"""
        n = indices.shape[0]

        # 确保索引在有效范围内
        indices = np.clip(indices, 0, self.size - 1 - 1e-6)

        # 获取整数索引和小数部分
        i0 = np.floor(indices).astype(np.int32)
        i1 = np.minimum(i0 + 1, self.size - 1)
        frac = indices - i0.astype(np.float32)

        # 预计算插值权重
        fr, fg, fb = frac[:, 0], frac[:, 1], frac[:, 2]
        w000 = (1 - fr) * (1 - fg) * (1 - fb)
        w001 = (1 - fr) * (1 - fg) * fb
        w010 = (1 - fr) * fg * (1 - fb)
        w011 = (1 - fr) * fg * fb
        w100 = fr * (1 - fg) * (1 - fb)
        w101 = fr * (1 - fg) * fb
        w110 = fr * fg * (1 - fb)
        w111 = fr * fg * fb

        # 使用高级索引一次性获取所有角点值（向量化操作）
        r0, g0, b0 = i0[:, 0], i0[:, 1], i0[:, 2]
        r1, g1, b1 = i1[:, 0], i1[:, 1], i1[:, 2]

        c000 = lut[r0, g0, b0]
        c001 = lut[r0, g0, b1]
        c010 = lut[r0, g1, b0]
        c011 = lut[r0, g1, b1]
        c100 = lut[r1, g0, b0]
        c101 = lut[r1, g0, b1]
        c110 = lut[r1, g1, b0]
        c111 = lut[r1, g1, b1]

        # 向量化三线性插值
        result = (
            c000 * w000[:, np.newaxis] +
            c001 * w001[:, np.newaxis] +
            c010 * w010[:, np.newaxis] +
            c011 * w011[:, np.newaxis] +
            c100 * w100[:, np.newaxis] +
            c101 * w101[:, np.newaxis] +
            c110 * w110[:, np.newaxis] +
            c111 * w111[:, np.newaxis]
        )

        return np.clip(result.astype(np.float32), 0, 1)
