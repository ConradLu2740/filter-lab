import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

// 预设数据结构
interface Preset {
  id: string;
  name: string;
  type: 'film' | 'custom';
  colorParams: {
    saturation: number;
    contrast: number;
    temperature: number;
    tint: number;
    shadow_boost: number;
    highlight_rolloff: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// 模拟数据（后续连接 Firebase）
const presets: Preset[] = [
  {
    id: '1',
    name: 'Kodak Portra 400',
    type: 'film',
    colorParams: {
      saturation: 0.95,
      contrast: 1.05,
      temperature: 50,
      tint: 5,
      shadow_boost: 0.02,
      highlight_rolloff: 0.15
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Fuji Velvia',
    type: 'film',
    colorParams: {
      saturation: 1.4,
      contrast: 1.25,
      temperature: 0,
      tint: 0,
      shadow_boost: -0.02,
      highlight_rolloff: 0.2
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const getPresets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, search } = req.query;

    let filteredPresets = presets;

    if (type) {
      filteredPresets = filteredPresets.filter(p => p.type === type);
    }

    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredPresets = filteredPresets.filter(p => 
        p.name.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      status: 'success',
      data: filteredPresets
    });
  } catch (error) {
    next(error);
  }
};

export const getPresetById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const preset = presets.find(p => p.id === id);

    if (!preset) {
      throw new AppError('Preset not found', 404);
    }

    res.json({
      status: 'success',
      data: preset
    });
  } catch (error) {
    next(error);
  }
};

export const createPreset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, type, colorParams } = req.body;

    if (!name || !colorParams) {
      throw new AppError('Name and color parameters are required', 400);
    }

    const newPreset: Preset = {
      id: String(presets.length + 1),
      name,
      type: type || 'custom',
      colorParams,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    presets.push(newPreset);

    logger.info('Preset created', { id: newPreset.id, name });

    res.status(201).json({
      status: 'success',
      data: newPreset
    });
  } catch (error) {
    next(error);
  }
};

export const deletePreset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const index = presets.findIndex(p => p.id === id);

    if (index === -1) {
      throw new AppError('Preset not found', 404);
    }

    presets.splice(index, 1);

    logger.info('Preset deleted', { id });

    res.json({
      status: 'success',
      message: 'Preset deleted'
    });
  } catch (error) {
    next(error);
  }
};
