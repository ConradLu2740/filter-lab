# python/core/color_analyzer.py
"""
色彩分析引擎

提供三种分析模式：
1. 单张照片分析 - 提取色彩统计特征，匹配胶片模式
2. 原图+滤镜图对比 - 计算色彩映射关系
3. 色卡参考分析 - 基于标准色卡构建精确映射
"""

import cv2
import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from core.film_profiles import FilmProfileLibrary


@dataclass
class ColorSample:
    """色彩采样点"""
    input_rgb: np.ndarray  # 输入色彩 [R, G, B]
    output_rgb: np.ndarray  # 输出色彩 [R, G, B]
    weight: float = 1.0  # 权重


class ColorChartDetector:
    """
    标准色卡检测器

    支持 X-Rite ColorChecker Classic 24色色卡的自动检测与色块提取。
    检测流程：
    1. 图像预处理（降采样、去噪）
    2. 边缘检测与轮廓查找
    3. 四边形轮廓筛选（面积、长宽比约束）
    4. 透视变换校正色卡区域
    5. 网格分割提取 24 个色块
    6. 计算每个色块的平均 RGB 值
    """

    # X-Rite ColorChecker Classic 24色标准值 (sRGB, D65, 归一化到 [0,1])
    XRITE_COLORS = np.array([
        [0.400, 0.350, 0.270],  # 1. Dark Skin
        [0.600, 0.410, 0.310],  # 2. Light Skin
        [0.180, 0.230, 0.410],  # 3. Blue Sky
        [0.330, 0.380, 0.240],  # 4. Foliage
        [0.550, 0.520, 0.430],  # 5. Blue Flower
        [0.310, 0.420, 0.520],  # 6. Bluish Green
        [0.700, 0.500, 0.200],  # 7. Orange
        [0.150, 0.180, 0.450],  # 8. Purplish Blue
        [0.550, 0.250, 0.350],  # 9. Moderate Red
        [0.250, 0.350, 0.250],  # 10. Purple
        [0.750, 0.600, 0.200],  # 11. Yellow Green
        [0.700, 0.450, 0.150],  # 12. Orange Yellow
        [0.100, 0.100, 0.350],  # 13. Blue
        [0.350, 0.450, 0.250],  # 14. Green
        [0.600, 0.300, 0.250],  # 15. Red
        [0.200, 0.250, 0.450],  # 16. Yellow
        [0.450, 0.350, 0.300],  # 17. Magenta
        [0.850, 0.800, 0.650],  # 18. Cyan
        [0.950, 0.950, 0.950],  # 19. White
        [0.800, 0.800, 0.800],  # 20. Neutral 8
        [0.650, 0.650, 0.650],  # 21. Neutral 6.5
        [0.500, 0.500, 0.500],  # 22. Neutral 5
        [0.350, 0.350, 0.350],  # 23. Neutral 3.5
        [0.200, 0.200, 0.200],  # 24. Black
    ], dtype=np.float32)

    # SpyderCHECKR 24色标准值 (简化版)
    SPYDER_COLORS = np.array([
        [0.380, 0.330, 0.260],  # 近似值
        [0.580, 0.400, 0.300],
        [0.170, 0.220, 0.400],
        [0.320, 0.370, 0.230],
        [0.530, 0.500, 0.420],
        [0.300, 0.410, 0.510],
        [0.680, 0.480, 0.190],
        [0.140, 0.170, 0.440],
        [0.530, 0.240, 0.340],
        [0.240, 0.340, 0.240],
        [0.730, 0.580, 0.190],
        [0.680, 0.440, 0.140],
        [0.090, 0.090, 0.340],
        [0.340, 0.440, 0.240],
        [0.580, 0.290, 0.240],
        [0.190, 0.240, 0.440],
        [0.430, 0.340, 0.290],
        [0.830, 0.780, 0.630],
        [0.940, 0.940, 0.940],
        [0.790, 0.790, 0.790],
        [0.640, 0.640, 0.640],
        [0.490, 0.490, 0.490],
        [0.340, 0.340, 0.340],
        [0.190, 0.190, 0.190],
    ], dtype=np.float32)

    def __init__(self, chart_type: str = 'xrite'):
        """
        初始化色卡检测器

        Args:
            chart_type: 色卡类型 ('xrite' 或 'spyder')
        """
        self.chart_type = chart_type
        self.reference_colors = (
            self.XRITE_COLORS if chart_type == 'xrite' else self.SPYDER_COLORS
        )

    def detect(self, image: np.ndarray) -> Tuple[List[ColorSample], np.ndarray]:
        """
        检测图像中的色卡并提取色块

        Args:
            image: RGB 图像 [0, 1]

        Returns:
            (samples, debug_image): 色彩采样点列表和调试用可视化图像
        """
        h, w = image.shape[:2]

        # 1. 转换为 uint8 用于 OpenCV 处理
        img_uint8 = np.clip(image * 255, 0, 255).astype(np.uint8)

        # 2. 尝试多种方法检测色卡
        chart_region = self._detect_by_contours(img_uint8)

        if chart_region is None:
            # 轮廓检测失败，尝试基于颜色聚类的备用方案
            chart_region = self._detect_by_color_clustering(img_uint8)

        if chart_region is None:
            # 所有检测方法失败，使用手动网格采样（全图均匀采样 24 个区域）
            return self._fallback_grid_sampling(image), img_uint8

        # 3. 透视变换校正色卡
        warped = self._warp_chart(img_uint8, chart_region)

        # 4. 提取 24 个色块
        patch_colors = self._extract_patches(warped)

        # 5. 构建 ColorSample
        samples = []
        for i, (ref_color, detected_color) in enumerate(
            zip(self.reference_colors, patch_colors)
        ):
            # 根据色块位置分配权重：中心色块权重更高
            row = i // 6
            col = i % 6
            center_dist = abs(row - 1.5) + abs(col - 2.5)
            weight = 1.0 + (3.0 - center_dist) * 0.3

            sample = ColorSample(
                input_rgb=ref_color,
                output_rgb=detected_color,
                weight=weight
            )
            samples.append(sample)

        # 6. 生成调试图像
        debug_img = self._draw_debug_overlay(img_uint8, chart_region, patch_colors)

        return samples, debug_img

    def _detect_by_contours(self, img_uint8: np.ndarray) -> Optional[np.ndarray]:
        """
        基于轮廓检测定位色卡

        检测逻辑：
        - 色卡外框通常为矩形，内部有 24 个色块
        - 通过查找大面积四边形轮廓来定位

        Args:
            img_uint8: uint8 BGR 图像

        Returns:
            四边形角点坐标 (4, 2) 或 None
        """
        h, w = img_uint8.shape[:2]
        img_area = h * w

        # 预处理：降采样加速
        scale = 1.0
        working = img_uint8.copy()
        if max(h, w) > 1500:
            scale = 1500 / max(h, w)
            new_w = int(w * scale)
            new_h = int(h * scale)
            working = cv2.resize(working, (new_w, new_h))

        # 灰度化
        gray = cv2.cvtColor(working, cv2.COLOR_BGR2GRAY)

        # 高斯模糊去噪
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        # 自适应阈值处理
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2
        )

        # 形态学操作连接边缘
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        morph = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)

        # 查找轮廓
        contours, _ = cv2.findContours(
            morph, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        candidates = []

        for cnt in contours:
            area = cv2.contourArea(cnt)
            # 面积过滤：色卡应占图像的 5%-80%
            area_ratio = area / (working.shape[0] * working.shape[1])
            if area_ratio < 0.05 or area_ratio > 0.80:
                continue

            # 多边形逼近
            peri = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)

            # 必须是四边形
            if len(approx) != 4:
                continue

            # 长宽比检查：ColorChecker 约为 1.37:1 (4行6列色块)
            pts = approx.reshape(4, 2).astype(np.float32)
            rect = self._order_points(pts)
            width = np.linalg.norm(rect[1] - rect[0])
            height = np.linalg.norm(rect[2] - rect[1])
            aspect_ratio = max(width, height) / max(min(width, height), 1e-6)

            # 允许一定误差
            if not (1.0 <= aspect_ratio <= 2.5):
                continue

            # 计算轮廓的矩形度（面积比）
            bounding_rect = cv2.boundingRect(cnt)
            bounding_area = bounding_rect[2] * bounding_rect[3]
            rect_extent = area / max(bounding_area, 1e-6)

            # 矩形度应较高
            if rect_extent < 0.5:
                continue

            # 评分：面积适中 + 矩形度高
            score = area_ratio * rect_extent

            # 将坐标缩放回原始图像尺寸
            if scale < 1.0:
                rect = rect / scale

            candidates.append((score, rect))

        if not candidates:
            return None

        # 选择评分最高的候选
        candidates.sort(key=lambda x: x[0], reverse=True)
        return candidates[0][1]

    def _detect_by_color_clustering(self, img_uint8: np.ndarray) -> Optional[np.ndarray]:
        """
        基于颜色聚类的备用检测方案

        当轮廓检测失败时使用。利用色卡包含大量不同颜色的特性，
        通过颜色多样性来定位色卡区域。

        Args:
            img_uint8: uint8 BGR 图像

        Returns:
            四边形角点坐标 (4, 2) 或 None
        """
        h, w = img_uint8.shape[:2]

        # 缩小图像加速处理
        scale = 800 / max(h, w)
        small = cv2.resize(img_uint8, (int(w * scale), int(h * scale)))

        # 转换为 Lab 色彩空间进行聚类
        lab = cv2.cvtColor(small, cv2.COLOR_BGR2LAB)
        pixels = lab.reshape(-1, 3).astype(np.float32)

        # K-Means 聚类
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
        _, labels, centers = cv2.kmeans(
            pixels, 24, None, criteria, 5,
            cv2.KMEANS_RANDOM_CENTERS
        )

        # 计算颜色多样性图
        diversity = np.zeros((small.shape[0], small.shape[1]), dtype=np.float32)

        # 滑动窗口计算局部颜色多样性
        window = 50
        for y in range(0, small.shape[0] - window, 10):
            for x in range(0, small.shape[1] - window, 10):
                patch_labels = labels[
                    y * small.shape[1] + x:
                    (y + window) * small.shape[1] + x + window
                ]
                unique_labels = len(np.unique(patch_labels))
                diversity[y:y+window, x:x+window] += unique_labels

        # 找到多样性最高的区域
        max_loc = np.unravel_index(np.argmax(diversity), diversity.shape)

        # 在该区域尝试查找矩形
        cy, cx = max_loc
        roi_size = int(min(small.shape[:2]) * 0.5)
        y1 = max(0, cy - roi_size // 2)
        x1 = max(0, cx - roi_size // 2)
        y2 = min(small.shape[0], cy + roi_size // 2)
        x2 = min(small.shape[1], cx + roi_size // 2)

        roi = small[y1:y2, x1:x2]

        # 在 ROI 内重新尝试轮廓检测
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for cnt in contours:
            area = cv2.contourArea(cnt)
            roi_area = roi.shape[0] * roi.shape[1]
            if area < roi_area * 0.1:
                continue

            peri = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)

            if len(approx) == 4:
                pts = approx.reshape(4, 2).astype(np.float32)
                rect = self._order_points(pts)
                # 缩放回原始坐标
                rect[:, 0] += x1
                rect[:, 1] += y1
                rect = rect / scale
                return rect

        return None

    def _fallback_grid_sampling(self, image: np.ndarray) -> List[ColorSample]:
        """
        备用方案：全图均匀网格采样

        当自动检测完全失败时，将图像划分为 4x6 网格，
        假设色卡大致位于画面中央。

        Args:
            image: RGB 图像 [0, 1]

        Returns:
            色彩采样点列表
        """
        h, w = image.shape[:2]
        samples = []

        # 使用中央 60% 区域
        margin_y = int(h * 0.2)
        margin_x = int(w * 0.2)
        roi = image[margin_y:h-margin_y, margin_x:w-margin_x]
        roi_h, roi_w = roi.shape[:2]

        # 4行6列网格
        rows, cols = 4, 6
        cell_h = roi_h / rows
        cell_w = roi_w / cols

        # 采样边距（避免色块边缘）
        padding = 0.2

        for i in range(24):
            row = i // cols
            col = i % cols

            y1 = int(row * cell_h + cell_h * padding)
            y2 = int((row + 1) * cell_h - cell_h * padding)
            x1 = int(col * cell_w + cell_w * padding)
            x2 = int((col + 1) * cell_w - cell_w * padding)

            patch = roi[y1:y2, x1:x2]
            mean_color = np.mean(patch, axis=(0, 1))

            sample = ColorSample(
                input_rgb=self.reference_colors[i],
                output_rgb=np.clip(mean_color, 0, 1),
                weight=0.5  # 备用方案权重较低
            )
            samples.append(sample)

        return samples

    def _warp_chart(self, img_uint8: np.ndarray, corners: np.ndarray) -> np.ndarray:
        """
        透视变换校正色卡

        Args:
            img_uint8: uint8 BGR 图像
            corners: 四边形角点 (4, 2)

        Returns:
            校正后的色卡图像
        """
        # 目标尺寸：保持原始比例，宽度约 600px
        width = 600
        height = int(width * 4 / 6)  # 4行6列

        dst_pts = np.array([
            [0, 0],
            [width - 1, 0],
            [width - 1, height - 1],
            [0, height - 1]
        ], dtype=np.float32)

        src_pts = corners.astype(np.float32)

        # 计算透视变换矩阵
        matrix = cv2.getPerspectiveTransform(src_pts, dst_pts)
        warped = cv2.warpPerspective(img_uint8, matrix, (width, height))

        return warped

    def _extract_patches(self, warped: np.ndarray) -> np.ndarray:
        """
        从校正后的色卡图像提取 24 个色块的颜色

        Args:
            warped: 校正后的色卡图像 (uint8 BGR)

        Returns:
            24 个色块的平均 RGB 值 (24, 3)
        """
        h, w = warped.shape[:2]
        rows, cols = 4, 6

        # 计算每个色块的区域（去除边框和间隙）
        cell_h = h / rows
        cell_w = w / cols

        # 边距比例（色卡通常有色块之间的黑色边框）
        margin = 0.15

        colors = []

        for i in range(24):
            row = i // cols
            col = i % cols

            y1 = int(row * cell_h + cell_h * margin)
            y2 = int((row + 1) * cell_h - cell_h * margin)
            x1 = int(col * cell_w + cell_w * margin)
            x2 = int((col + 1) * cell_w - cell_w * margin)

            # 确保不越界
            y1, y2 = max(0, y1), min(h, y2)
            x1, x2 = max(0, x1), min(w, x2)

            patch = warped[y1:y2, x1:x2]

            if patch.size == 0:
                colors.append(np.array([0.5, 0.5, 0.5]))
                continue

            # 转换为 RGB 并归一化
            patch_rgb = cv2.cvtColor(patch, cv2.COLOR_BGR2RGB)

            # 使用中值滤波去除噪点后取平均
            patch_rgb = cv2.medianBlur(patch_rgb, 3)
            mean_color = np.median(patch_rgb.reshape(-1, 3), axis=0) / 255.0

            colors.append(mean_color)

        return np.array(colors, dtype=np.float32)

    def _order_points(self, pts: np.ndarray) -> np.ndarray:
        """
        将四边形角点按顺序排列：左上、右上、右下、左下

        Args:
            pts: 四个角点 (4, 2)

        Returns:
            排序后的角点 (4, 2)
        """
        rect = np.zeros((4, 2), dtype=np.float32)

        # 计算每个点的坐标和
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]  # 左上：和最小
        rect[2] = pts[np.argmax(s)]  # 右下：和最大

        # 计算差值
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]  # 右上：差最小
        rect[3] = pts[np.argmax(diff)]  # 左下：差最大

        return rect

    def _draw_debug_overlay(self, img_uint8: np.ndarray,
                            corners: np.ndarray,
                            patch_colors: np.ndarray) -> np.ndarray:
        """
        绘制调试可视化图像

        Args:
            img_uint8: 原始图像
            corners: 检测到的色卡角点
            patch_colors: 提取的色块颜色

        Returns:
            带标注的调试图像
        """
        debug = img_uint8.copy()

        # 绘制检测到的四边形
        if corners is not None:
            pts = corners.astype(np.int32)
            cv2.polylines(debug, [pts], True, (0, 255, 0), 3)

            # 绘制角点编号
            for i, pt in enumerate(pts):
                cv2.circle(debug, tuple(pt), 8, (0, 0, 255), -1)
                cv2.putText(debug, str(i), tuple(pt + 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

        return debug


class ColorAnalyzer:
    """色彩分析引擎"""

    def __init__(self):
        self.samples: List[ColorSample] = []

    def analyze_single(self, image: np.ndarray) -> Dict:
        """
        单张照片分析 - 提取色彩统计特征并匹配胶片模式

        Args:
            image: RGB 图像 [0, 1]

        Returns:
            色彩特征字典，包含匹配的胶片模式
        """
        # 提取直方图特征
        hist_r = cv2.calcHist([image], [0], None, [256], [0, 1])
        hist_g = cv2.calcHist([image], [1], None, [256], [0, 1])
        hist_b = cv2.calcHist([image], [2], None, [256], [0, 1])

        # 计算统计特征，确保转换为 Python 原生类型
        features = {
            'mean_rgb': [float(x) for x in np.mean(image, axis=(0, 1))],
            'std_rgb': [float(x) for x in np.std(image, axis=(0, 1))],
            'median_rgb': [float(x) for x in np.median(image, axis=(0, 1))],
            'saturation_mean': float(self._compute_saturation(image).mean()),
            'contrast': float(self._compute_contrast(image)),
            'histogram_peaks': {
                'r': int(np.argmax(hist_r)),
                'g': int(np.argmax(hist_g)),
                'b': int(np.argmax(hist_b)),
            }
        }

        # 胶片模式匹配
        library = FilmProfileLibrary()
        matches = library.match(features, top_k=3)

        features['film_matches'] = [
            {
                'name': profile.name,
                'description': profile.description,
                'confidence': float(round(similarity * 100, 1)),
            }
            for profile, similarity in matches
        ]

        return features

    def analyze_pair(self, original: np.ndarray, filtered: np.ndarray,
                     sample_count: int = 1000) -> List[ColorSample]:
        """
        原图+滤镜图对比分析

        Args:
            original: 原图 RGB [0, 1]
            filtered: 滤镜图 RGB [0, 1]
            sample_count: 采样点数量

        Returns:
            色彩采样点列表
        """
        h, w = original.shape[:2]
        samples = []

        # 均匀采样 + 边缘区域加权采样
        # 1. 均匀网格采样
        grid_size = int(np.sqrt(sample_count / 2))
        y_step = h // grid_size
        x_step = w // grid_size

        for i in range(grid_size):
            for j in range(grid_size):
                y = min(i * y_step + y_step // 2, h - 1)
                x = min(j * x_step + x_step // 2, w - 1)

                sample = ColorSample(
                    input_rgb=original[y, x].copy(),
                    output_rgb=filtered[y, x].copy(),
                    weight=1.0
                )
                samples.append(sample)

        # 2. 基于色彩变化的随机采样
        diff = np.abs(filtered - original).mean(axis=2)
        high_diff_mask = diff > np.percentile(diff, 75)

        high_diff_coords = np.argwhere(high_diff_mask)
        if len(high_diff_coords) > 0:
            n_random = min(sample_count // 2, len(high_diff_coords))
            indices = np.random.choice(len(high_diff_coords), n_random, replace=False)

            for idx in indices:
                y, x = high_diff_coords[idx]
                sample = ColorSample(
                    input_rgb=original[y, x].copy(),
                    output_rgb=filtered[y, x].copy(),
                    weight=2.0  # 变化大的区域权重更高
                )
                samples.append(sample)

        self.samples = samples
        return samples

    def analyze_colorchart(self, image: np.ndarray,
                           chart_type: str = 'xrite') -> Tuple[List[ColorSample], np.ndarray]:
        """
        色卡参考分析

        使用 ColorChartDetector 自动检测图像中的标准色卡，
        提取 24 个色块的实际颜色，构建输入→输出的色彩映射。

        Args:
            image: 包含色卡的照片 RGB [0, 1]
            chart_type: 色卡类型 ('xrite' 或 'spyder')

        Returns:
            (samples, debug_image): 色彩采样点列表和调试图像
        """
        detector = ColorChartDetector(chart_type=chart_type)
        samples, debug_img = detector.detect(image)

        self.samples = samples
        return samples, debug_img

    def _compute_saturation(self, image: np.ndarray) -> np.ndarray:
        """计算图像饱和度"""
        hsv = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2HSV)
        return hsv[:, :, 1].astype(np.float32) / 255.0

    def _compute_contrast(self, image: np.ndarray) -> float:
        """计算图像对比度（标准差）"""
        gray = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
        return float(np.std(gray))

    def get_samples(self) -> List[ColorSample]:
        """获取当前采样点"""
        return self.samples
