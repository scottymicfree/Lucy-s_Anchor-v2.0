import express from 'express';
import { checkProvidersStatus } from '../../../ecosystem/providers/providerManager.js';

export const healthRouter = express.Router();

healthRouter.get('/api/health', async (req, res) => {
  try {
    const status = await checkProvidersStatus();
    res.json(status);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
