import express from 'express';
import { checkSpellingController, autoCorrectController } from '../controllers/spellCheckController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Check spelling
router.post('/check', checkSpellingController);

// Auto-correct text
router.post('/correct', autoCorrectController);

export default router;
