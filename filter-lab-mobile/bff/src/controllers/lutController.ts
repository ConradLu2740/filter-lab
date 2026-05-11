import { Request, Response, NextFunction } from 'express';
import { pythonService } from '../services/pythonService';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export const generateLUT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { colorParams, size } = req.body;

    if (!colorParams) {
      throw new AppError('Color parameters are required', 400);
    }

    logger.info('Generating LUT', { size: size || 33 });

    const result = await pythonService.generateLUT(colorParams, size || 33);

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const applyLUT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { image, colorParams } = req.body;

    if (!image) {
      throw new AppError('Image is required', 400);
    }

    logger.info('Applying LUT to image');

    const result = await pythonService.applyLUT(image, colorParams);

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
