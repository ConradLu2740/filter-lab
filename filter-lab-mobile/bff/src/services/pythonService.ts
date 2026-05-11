import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

class PythonService {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    
    this.client = axios.create({
      baseURL,
      timeout: 30000, // 30 秒超时
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 响应拦截器
    this.client.interceptors.response.use(
      response => response,
      error => {
        logger.error('Python service error:', error.message);
        throw new AppError(`Python service error: ${error.message}`, 502);
      }
    );
  }

  async analyzeSingle(imageBase64: string, mode: string = 'auto') {
    try {
      const response = await this.client.post('/api/v1/analyze/single', {
        image: imageBase64,
        mode
      });
      return response.data;
    } catch (error) {
      logger.error('analyzeSingle failed:', error);
      throw error;
    }
  }

  async analyzeColorchart(imageBase64: string) {
    try {
      const response = await this.client.post('/api/v1/analyze/colorchart', {
        image: imageBase64
      });
      return response.data;
    } catch (error) {
      logger.error('analyzeColorchart failed:', error);
      throw error;
    }
  }

  async generateLUT(colorParams: object, size: number = 33) {
    try {
      const response = await this.client.post('/api/v1/lut/generate', {
        color_params: colorParams,
        size
      });
      return response.data;
    } catch (error) {
      logger.error('generateLUT failed:', error);
      throw error;
    }
  }

  async applyLUT(imageBase64: string, colorParams?: object) {
    try {
      const response = await this.client.post('/api/v1/lut/apply', {
        image: imageBase64,
        color_params: colorParams
      });
      return response.data;
    } catch (error) {
      logger.error('applyLUT failed:', error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      logger.error('Health check failed:', error);
      return null;
    }
  }
}

export const pythonService = new PythonService();
