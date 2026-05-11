import { Request, Response, NextFunction } from 'express';
import { pythonService } from '../services/pythonService';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export const analyzeSingle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { image, mode } = req.body;

    if (!image) {
      throw new AppError('Image is required', 400);
    }

    logger.info('Starting single image analysis', { mode });

    const result = await pythonService.analyzeSingle(image, mode || 'auto');

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const analyzeColorchart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { image } = req.body;

    if (!image) {
      throw new AppError('Image is required', 400);
    }

    logger.info('Starting color chart analysis');

    const result = await pythonService.analyzeColorchart(image);

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
