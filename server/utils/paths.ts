import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(path.dirname(__filename))); // project root

export const ECOSYSTEM_ROOT = 'd:\\lucy ecosystem';
export const ECOSYSTEM_CORE = path.join(ECOSYSTEM_ROOT, 'ecosystem');
export const REGISTRY_PATH = path.join(ECOSYSTEM_CORE, 'registry', 'registry.json');
export const MEMORY_DIR = path.join(ECOSYSTEM_CORE, 'memory');
export const RUNS_DIR = path.join(MEMORY_DIR, 'runs');
export const BACKUPS_DIR = path.join(MEMORY_DIR, 'backups');
export const PROCESS_DIR = path.join(MEMORY_DIR, 'sessions');
export const BUNDLES_DIR = path.join(MEMORY_DIR, 'bundles');
export const LEDGER_DIR = path.join(MEMORY_DIR, 'ledger');
export const VAULT_DIR = path.join(MEMORY_DIR, 'vault');
export const CACHE_DIR = path.join(ECOSYSTEM_CORE, '.cache');

// Automatically create directories
[MEMORY_DIR, RUNS_DIR, BACKUPS_DIR, PROCESS_DIR, BUNDLES_DIR, LEDGER_DIR, VAULT_DIR, CACHE_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export function getSafePath(project: string, relativePath?: string): string {
  const projPath = path.join(ECOSYSTEM_ROOT, project);
  if (relativePath) {
    const fullPath = path.join(projPath, relativePath);
    if (!fullPath.startsWith(ECOSYSTEM_ROOT)) {
      throw new Error("Path traversal blocked");
    }
    return fullPath;
  }
  return projPath;
}
