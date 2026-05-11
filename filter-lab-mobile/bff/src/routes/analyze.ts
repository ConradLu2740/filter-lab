import { Router } from 'express';
import { analyzeSingle, analyzeColorchart } from '../controllers/analyzeController';

const router = Router();

router.post('/single', analyzeSingle);
router.post('/colorchart', analyzeColorchart);

export default router;
