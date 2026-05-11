import { Router } from 'express';
import { generateLUT, applyLUT } from '../controllers/lutController';

const router = Router();

router.post('/generate', generateLUT);
router.post('/apply', applyLUT);

export default router;
