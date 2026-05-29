import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getSafePath, CACHE_DIR } from '../utils/paths.js';
import { FileMetadata, ScannedFile } from '../types/ecosystem.js';

export function scanProjectFiles(project: string): ScannedFile[] {
  const projectPath = getSafePath(project);
  if (!fs.existsSync(projectPath)) {
    throw new Error(`Project folder not found: ${projectPath}`);
  }

  const cacheFile = path.join(CACHE_DIR, `${project}.json`);
  let cachedIndex: Record<string, FileMetadata> = {};
  if (fs.existsSync(cacheFile)) {
    try {
      cachedIndex = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    } catch (e) {}
  }

  const filesList: ScannedFile[] = [];
  const scannedHashes: Record<string, FileMetadata> = {};

  function scanDir(dir: string, relDir: string = '') {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const relPath = path.join(relDir, item.name).replace(/\\/g, '/');
      if (item.name === 'node_modules' || item.name === '.git' || item.name === 'dist' || item.name === 'build' || item.name === '.cache') {
        continue;
      }

      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        scanDir(fullPath, relPath);
      } else {
        const stats = fs.statSync(fullPath);
        const fileKey = `${relPath}_${stats.size}_${stats.mtimeMs}`;

        let fileMeta = cachedIndex[fileKey];
        if (!fileMeta) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const imports: string[] = [];
            const exports: string[] = [];

            const importRegex = /import\s+[\s\S]*?\s+from\s+['"](.*?)['"]/g;
            let match;
            while ((match = importRegex.exec(content)) !== null) {
              imports.push(match[1]);
            }

            const exportRegex = /export\s+(const|class|function|type|interface|default)\s+(\w+)/g;
            while ((match = exportRegex.exec(content)) !== null) {
              exports.push(match[2]);
            }

            fileMeta = {
              path: relPath,
              size: stats.size,
              mtime: stats.mtimeMs,
              imports,
              exports,
              hash: crypto.createHash('md5').update(content).digest('hex')
            };
          } catch (err) {
            // Handle binary or unreadable files gracefully
            fileMeta = {
              path: relPath,
              size: stats.size,
              mtime: stats.mtimeMs,
              imports: [],
              exports: [],
              hash: ''
            };
          }
        }

        scannedHashes[fileKey] = fileMeta;
        filesList.push({
          path: relPath,
          size: stats.size,
          imports: fileMeta.imports,
          exports: fileMeta.exports
        });
      }
    }
  }

  scanDir(projectPath);
  fs.writeFileSync(cacheFile, JSON.stringify(scannedHashes, null, 2), 'utf8');
  return filesList;
}
