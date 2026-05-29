import express from 'express';
import fs from 'fs';
import path from 'path';
import { ECOSYSTEM_ROOT, CACHE_DIR } from '../utils/paths.js';
import { PROJECT_REGISTRY } from '../utils/registry.js';

export const topologyRouter = express.Router();

topologyRouter.get('/api/ecosystem/topology', (req, res) => {
  try {
    if (!fs.existsSync(ECOSYSTEM_ROOT)) {
      return res.json({ nodes: [], edges: [] });
    }
    
    const folders = fs.readdirSync(ECOSYSTEM_ROOT, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    const nodes: any[] = [];
    const edges: any[] = [];
    
    folders.forEach(folder => {
      const reg = PROJECT_REGISTRY[folder];
      nodes.push({
        id: folder,
        label: reg ? reg.name : folder,
        classification: reg ? reg.classification : 'AGENT_CORE'
      });

      const cacheFile = path.join(CACHE_DIR, `${folder}.json`);
      if (fs.existsSync(cacheFile)) {
        try {
          const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
          const uniqueImports = new Set<string>();
          Object.values(cacheData).forEach((fileMeta: any) => {
            fileMeta.imports?.forEach((imp: string) => {
              folders.forEach(otherFolder => {
                if (otherFolder !== folder && (imp.includes(otherFolder) || imp.toLowerCase().includes(otherFolder.toLowerCase()))) {
                  uniqueImports.add(otherFolder);
                }
              });
            });
          });
          
          uniqueImports.forEach(target => {
            edges.push({
              source: folder,
              target: target,
              relationship: 'depends_on'
            });
          });
        } catch (e) {}
      }

      if (reg && reg.linkedProjects) {
        reg.linkedProjects.forEach(target => {
          if (folders.includes(target)) {
            const exists = edges.some(e => e.source === folder && e.target === target);
            if (!exists) {
              let rel = 'coordinates';
              if (reg.classification === 'SOVEREIGN_KERNEL') rel = 'secures';
              if (reg.classification === 'LIVING_MATRIX') rel = 'renders';
              edges.push({
                source: folder,
                target: target,
                relationship: rel
              });
            }
          }
        });
      }
    });

    res.json({ nodes, edges });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
