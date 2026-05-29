import fs from 'fs';
import { getSafePath } from '../utils/paths.js';

export function readProjectFile(project: string, filePath: string): string {
  const fullPath = getSafePath(project, filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}
