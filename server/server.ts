import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { healthRouter } from './routes/health.js';
import { topologyRouter } from './routes/topology.js';
import { ecosystemRouter } from './routes/ecosystem.js';
import { agentRouter } from './routes/agent.js';

// Ecosystem core imports
import { ecosystemBoot } from '../../ecosystem/kernel/boot.js';
import { websocketHub } from '../../ecosystem/services/websocketHub.js';
import { healthMonitor } from '../../ecosystem/services/healthMonitor.js';
import { bundleManager } from '../../ecosystem/services/bundleManager.js';
import { MEMORY_DIR, REGISTRY_PATH, BUNDLES_DIR } from './utils/paths.js';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(express.json({ limit: '10mb' }));

// Mount modular sub-routers
app.use(healthRouter);
app.use(topologyRouter);
app.use(ecosystemRouter);
app.use(agentRouter);

const httpServer = createServer(app);

// Sequentially Boot Ecosystem Subsystems
await ecosystemBoot.start(MEMORY_DIR, REGISTRY_PATH);

// Initialize Services
websocketHub.init(httpServer);
bundleManager.init(BUNDLES_DIR);
healthMonitor.init(MEMORY_DIR);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server listening on port ${PORT}`);
});

