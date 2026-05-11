import axios, { AxiosInstance } from 'axios';
import Config from 'react-native-config';

// 创建 API 客户端
const apiClient: AxiosInstance = axios.create({
  baseURL: Config.API_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    // 可以添加 token 等
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// API 方法
export const analyzeApi = {
  single: (image: string, mode: string = 'auto') =>
    apiClient.post('/api/v1/analyze/single', { image, mode }),

  colorchart: (image: string) =>
    apiClient.post('/api/v1/analyze/colorchart', { image })
};

export const lutApi = {
  generate: (colorParams: object, size: number = 33) =>
    apiClient.post('/api/v1/lut/generate', { colorParams, size }),

  apply: (image: string, colorParams?: object) =>
    apiClient.post('/api/v1/lut/apply', { image, colorParams })
};

export const presetApi = {
  getAll: (params?: { type?: string; search?: string }) =>
    apiClient.get('/api/v1/presets', { params }),

  getById: (id: string) =>
    apiClient.get(`/api/v1/presets/${id}`),

  create: (preset: object) =>
    apiClient.post('/api/v1/presets', preset),

  delete: (id: string) =>
    apiClient.delete(`/api/v1/presets/${id}`)
};

export default apiClient;
