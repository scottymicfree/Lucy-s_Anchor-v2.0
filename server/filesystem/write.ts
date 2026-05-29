import fs from 'fs';
import path from 'path';
import { getSafePath, BACKUPS_DIR } from '../utils/paths.js';

export function writeProjectFile(project: string, filePath: string, content: string): void {
  const fullPath = getSafePath(project, filePath);

  if (fs.existsSync(fullPath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupProjectDir = path.join(BACKUPS_DIR, project, timestamp);
    fs.mkdirSync(backupProjectDir, { recursive: true });

    fs.copyFileSync(fullPath, path.join(backupProjectDir, 'original'));
    fs.writeFileSync(path.join(backupProjectDir, 'patched'), content, 'utf8');
    fs.writeFileSync(
      path.join(backupProjectDir, 'metadata.json'),
      JSON.stringify({
        originalFile: filePath,
        timestamp: new Date().toISOString()
      }, null, 2),
      'utf8'
    );
  }

  // Ensure parent directories exist
  const parentDir = path.dirname(fullPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  fs.writeFileSync(fullPath, content, 'utf8');
}
