import fs from 'fs';
import path from 'path';
import { BACKUPS_DIR, LEDGER_DIR, getSafePath } from '../utils/paths.js';
import { LedgerLog } from '../types/ecosystem.js';
import crypto from 'crypto';

export function writeToLedger(log: LedgerLog): void {
  try {
    const runId = log.runId || crypto.randomUUID();
    const entryPath = path.join(LEDGER_DIR, `${runId}.json`);
    const data = {
      runId,
      timestamp: new Date().toISOString(),
      ...log
    };
    fs.mkdirSync(LEDGER_DIR, { recursive: true });
    fs.writeFileSync(entryPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error("Ledger logging failed: ", e);
  }
}

export function listBackups(project: string): any[] {
  const projBackupDir = path.join(BACKUPS_DIR, project);
  if (!fs.existsSync(projBackupDir)) {
    return [];
  }

  try {
    const timestamps = fs.readdirSync(projBackupDir);
    return timestamps.map(ts => {
      const metaPath = path.join(projBackupDir, ts, 'metadata.json');
      let meta = {};
      if (fs.existsSync(metaPath)) {
        try {
          meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        } catch (e) {}
      }
      return { timestamp: ts, ...meta };
    });
  } catch (e) {
    console.error("Failed to read backups lists: ", e);
    return [];
  }
}

export function restoreBackup(project: string, timestamp: string, file: string): void {
  const backupFile = path.join(BACKUPS_DIR, project, timestamp, 'original');
  const targetFile = getSafePath(project, file);

  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup file not found for timestamp ${timestamp}`);
  }

  fs.copyFileSync(backupFile, targetFile);

  writeToLedger({
    event: 'restore',
    project,
    file,
    status: 'completed',
    message: `Restored ${file} to checkpoint ${timestamp}`
  });
}
