import express from 'express';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { getSafePath, ECOSYSTEM_ROOT, BUNDLES_DIR, BACKUPS_DIR, PROCESS_DIR, REGISTRY_PATH } from '../utils/paths.js';
import { scanProjectFiles } from '../filesystem/scan.js';
import { readProjectFile } from '../filesystem/read.js';
import { writeProjectFile } from '../filesystem/write.js';
import { listBackups, restoreBackup, writeToLedger } from '../filesystem/backup.js';
import { bundleManager, RUNNING_PROCESSES } from '../../../ecosystem/services/bundleManager.js';
import { stateBus } from '../../../ecosystem/kernel/stateBus.js';

export const ecosystemRouter = express.Router();

// List all ecosystem folders
ecosystemRouter.get('/api/ecosystem', (req, res) => {
  try {
    if (!fs.existsSync(ECOSYSTEM_ROOT)) {
      return res.status(404).json({ error: "Ecosystem root folder not found at " + ECOSYSTEM_ROOT });
    }
    
    let registryProjects: any[] = [];
    if (fs.existsSync(REGISTRY_PATH)) {
      try {
        const reg = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
        registryProjects = reg.projects || [];
      } catch (e) {}
    }

    const directories = fs.readdirSync(ECOSYSTEM_ROOT, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && dirent.name !== 'ecosystem' && !dirent.name.includes('archive') && dirent.name !== 'node_modules' && !dirent.name.startsWith('.'))
      .map(dirent => dirent.name);
    
    const payload = directories.map(dir => {
      const reg = registryProjects.find((p: any) => p.id === dir) || {
        id: dir,
        name: dir,
        classification: 'AGENT_CORE',
        vaultFile: `${dir}.json`,
        autoCoaches: ['Mechanic', 'Librarian'],
        linkedProjects: []
      };
      return reg;
    });
    
    res.json(payload);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Scan files recursively
ecosystemRouter.get('/api/ecosystem/:project/files', (req, res) => {
  const { project } = req.params;
  try {
    const files = scanProjectFiles(project);
    res.json(files);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Read file content
ecosystemRouter.get('/api/ecosystem/:project/file', (req, res) => {
  const { project } = req.params;
  const filePathParam = req.query.path as string;

  try {
    const content = readProjectFile(project, filePathParam);
    res.json({ content });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Write file content manually
ecosystemRouter.post('/api/ecosystem/:project/file', (req, res) => {
  const { project } = req.params;
  const { path: relativePath, content } = req.body;

  try {
    writeProjectFile(project, relativePath, content);
    res.json({ success: true, message: `File updated. Backup created.` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get health metrics
ecosystemRouter.get('/api/ecosystem/:project/health', (req, res) => {
  const { project } = req.params;
  const projectPath = getSafePath(project);
  
  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({ error: "Project folder not found" });
  }

  try {
    const files = fs.readdirSync(projectPath);
    const hasReadme = files.some(f => f.toLowerCase() === 'readme.md');
    const hasTests = files.some(f => f.toLowerCase().includes('test') || f.toLowerCase() === 'spec');
    const hasEnv = files.some(f => f.toLowerCase().includes('.env'));
    
    const architectureScore = hasEnv ? 92 : 80;
    const documentationScore = hasReadme ? 95 : 45;
    const securityScore = hasEnv ? 88 : 70;
    const testCoverageScore = hasTests ? 85 : 40;

    res.json({
      architectureScore,
      documentationScore,
      securityScore,
      testCoverageScore
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get backups list
ecosystemRouter.get('/api/backups/:project', (req, res) => {
  const { project } = req.params;
  res.json(listBackups(project));
});

// Restore backup
ecosystemRouter.post('/api/backups/:project/restore', (req, res) => {
  const { project } = req.params;
  const { timestamp, file } = req.body;
  try {
    restoreBackup(project, timestamp, file);
    res.json({ success: true, message: `Successfully restored ${file} to ${timestamp} state.` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Compilation bundler
ecosystemRouter.post('/api/ecosystem/:project/bundle', async (req, res) => {
  const { project } = req.params;
  const projectPath = getSafePath(project);

  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({ error: "Project folder not found" });
  }

  try {
    const manifest = await bundleManager.compileBundle(project, projectPath);

    writeToLedger({
      event: 'bundle',
      project,
      status: 'completed',
      message: `Bundled ${project} into a single-click app release: ${manifest.bundleId}`
    });

    res.json({ success: true, message: `Successfully bundled ${project}`, manifest });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// App launcher (Native)
ecosystemRouter.post('/api/ecosystem/:project/launch', (req, res) => {
  const { project } = req.params;
  const projectPath = getSafePath(project);

  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({ error: "Project folder not found" });
  }

  const files = fs.readdirSync(projectPath);
  const batScript = files.find(f => f.toLowerCase() === 'start.bat' || f.toLowerCase() === 'start_lucy.bat' || f.toLowerCase() === 'start_emma_windows.bat');
  
  if (!batScript) {
    return res.status(404).json({ error: "No Windows launch script (start.bat) found in project directory." });
  }

  try {
    const key = `native:${project}`;
    if (RUNNING_PROCESSES.has(key)) {
      const prevProc = RUNNING_PROCESSES.get(key);
      if (prevProc && prevProc.pid) {
        child_process.exec(`taskkill /F /T /PID ${prevProc.pid}`, (err) => {
          if (err) console.error(`Failed to kill process tree: ${err}`);
        });
      } else {
        prevProc?.kill();
      }
      RUNNING_PROCESSES.delete(key);
    }

    const command = 'cmd.exe';
    const args = ['/c', batScript];

    const child = child_process.spawn(command, args, {
      cwd: projectPath,
      detached: true,
      stdio: 'ignore'
    });
    child.unref();

    RUNNING_PROCESSES.set(key, child);

    writeToLedger({
      event: 'launch',
      project,
      status: 'completed',
      message: `Launched native application target script: ${batScript}`
    });

    res.json({ success: true, message: `Application ${project} successfully launched via ${batScript}.` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// App process terminator (Native)
ecosystemRouter.post('/api/ecosystem/:project/terminate', (req, res) => {
  const { project } = req.params;
  const key = `native:${project}`;
  if (RUNNING_PROCESSES.has(key)) {
    try {
      const proc = RUNNING_PROCESSES.get(key);
      if (proc && proc.pid) {
        child_process.exec(`taskkill /F /T /PID ${proc.pid}`, (err) => {
          if (err) console.error(`Failed to kill process tree: ${err}`);
        });
      } else {
        proc?.kill();
      }
      RUNNING_PROCESSES.delete(key);
      res.json({ success: true, message: `Terminated ${project} process.` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  } else {
    res.json({ success: true, message: `Process not active.` });
  }
});

// App running status (Native)
ecosystemRouter.get('/api/ecosystem/:project/status', (req, res) => {
  const { project } = req.params;
  const key = `native:${project}`;
  res.json({ running: RUNNING_PROCESSES.has(key) });
});

// Get process state memory
ecosystemRouter.get('/api/ecosystem/:project/process', (req, res) => {
  const { project } = req.params;
  const processPath = path.join(PROCESS_DIR, `${project}.json`);
  let processMemory = { activeFile: '', currentTask: '', lastEmmaDecision: '', lastEcosystemStatus: '', lastRunId: '', historyCount: 0 };
  if (fs.existsSync(processPath)) {
    try {
      processMemory = JSON.parse(fs.readFileSync(processPath, 'utf8'));
    } catch (e) {}
  }
  res.json(processMemory);
});

// Get all bundled project releases
ecosystemRouter.get('/api/bundles', (req, res) => {
  res.json(stateBus.getState().bundles);
});

// Bundle launcher
ecosystemRouter.post('/api/bundles/:project/launch', async (req, res) => {
  const { project } = req.params;
  try {
    await bundleManager.launchBundle(project);
    writeToLedger({
      event: 'launch',
      project,
      status: 'completed',
      message: `Launched bundled release for ${project}`
    });
    res.json({ success: true, message: `Bundled app ${project} successfully launched.` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Terminate running bundle
ecosystemRouter.post('/api/bundles/:project/terminate', async (req, res) => {
  const { project } = req.params;
  try {
    await bundleManager.terminateBundle(project);
    res.json({ success: true, message: `Terminated bundled ${project} process.` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get bundle running status
ecosystemRouter.get('/api/bundles/:project/status', (req, res) => {
  const { project } = req.params;
  const bundle = stateBus.getState().bundles.find(b => b.project === project);
  res.json({ running: bundle?.lifecycle === 'running' });
});

