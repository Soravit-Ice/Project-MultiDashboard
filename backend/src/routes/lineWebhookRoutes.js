import express from 'express';
import { handleLineWebhook } from '../controllers/lineWebhookController.js';

const router = express.Router();

router.post('/:integrationId', handleLineWebhook);

export default router;
