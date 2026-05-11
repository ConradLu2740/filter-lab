import { Router } from 'express';
import { 
  getPresets, 
  getPresetById, 
  createPreset, 
  deletePreset 
} from '../controllers/presetController';

const router = Router();

router.get('/', getPresets);
router.get('/:id', getPresetById);
router.post('/', createPreset);
router.delete('/:id', deletePreset);

export default router;
