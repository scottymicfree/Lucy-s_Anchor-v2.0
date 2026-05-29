import express from 'express';
import fs from 'fs';
import path from 'path';
import { runSwarm } from '../../../ecosystem/swarm/orchestrator.js';
import { dispatchLLMCall } from '../../../ecosystem/providers/providerManager.js';
import { ECOSYSTEM_VERSION } from '../../../ecosystem/kernel/version.js';
import { PROCESS_DIR, RUNS_DIR, LEDGER_DIR, CACHE_DIR, MEMORY_DIR, getSafePath } from '../utils/paths.js';
import { writeProjectFile } from '../filesystem/write.js';

export const agentRouter = express.Router();

function loadProjectVault(project: string): any {
  const vaultPath = path.join(MEMORY_DIR, 'vault', `${project}.json`);
  let vaultMemory = { 
    classification: '', 
    architecture: '', 
    codingStyle: '', 
    knownProblems: [] as string[], 
    preferredPatterns: [] as string[], 
    dependencies: [] as string[], 
    relatedProjects: [] as string[] 
  };
  
  if (fs.existsSync(vaultPath)) {
    try {
      vaultMemory = {
        ...vaultMemory,
        ...JSON.parse(fs.readFileSync(vaultPath, 'utf8'))
      };
    } catch (e) {}
  }
  return vaultMemory;
}

// Get Ecosystem Core Version
agentRouter.get('/api/ecosystem/version', (req, res) => {
  res.json(ECOSYSTEM_VERSION);
});

// Swarm Orchestrator Endpoint
agentRouter.post('/api/agent/run', async (req, res) => {
  const { project, file, content, prompt, provider, model, mode, coaches } = req.body;
  
  const task = {
    project,
    file,
    content,
    prompt,
    provider,
    model,
    mode,
    coaches
  };

  const orchestratorPaths = {
    runsDir: RUNS_DIR,
    ledgerDir: LEDGER_DIR,
    cacheDir: CACHE_DIR,
    vaultFile: path.join(MEMORY_DIR, 'vault', `${project}.json`),
    writeProjectFile: (proj: string, f: string, c: string) => {
      writeProjectFile(proj, f, c);
    },
    getSafePath: (proj: string, relativePath?: string) => {
      return getSafePath(proj, relativePath);
    }
  };

  try {
    const result = await runSwarm(task, orchestratorPaths);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Conversational chat endpoint
agentRouter.post('/api/chat', async (req, res) => {
  const { project, messages, provider, model } = req.body;

  // Load project static instructions
  const vaultMemory = loadProjectVault(project);

  // Load dynamic process memory state
  const processPath = path.join(PROCESS_DIR, `${project}.json`);
  let processMemory = { activeFile: '', currentTask: '', lastEmmaDecision: '', lastEcosystemStatus: '', lastRunId: '' };
  if (fs.existsSync(processPath)) {
    try {
      processMemory = JSON.parse(fs.readFileSync(processPath, 'utf8'));
    } catch (e) {}
  }

  let lastRunSummary = "";
  if (processMemory.lastRunId) {
    const runPath = path.join(RUNS_DIR, `${processMemory.lastRunId}.json`);
    if (fs.existsSync(runPath)) {
      try {
        const runData = JSON.parse(fs.readFileSync(runPath, 'utf8'));
        lastRunSummary = `
  [Last Swarm Run Details (Run ID: ${runData.id})]:
  - File: ${runData.file}
  - Mode: ${runData.mode}
  - Status: ${runData.status}
  - Coach Recommendations:
${runData.coachResults.map((c: any) => `    * [${c.coach}] Risk: ${c.risk}, Rec: ${c.recommendation}`).join('\n')}
  - Emma Decision: ${runData.emmaValidation?.decision || 'None'}
  - Emma Concerns: ${runData.emmaValidation?.concerns?.join(', ') || 'None'}
  - Ecosystem Status: ${runData.ecosystemReport?.status || 'None'}
  - Ecosystem Recommendation: ${runData.ecosystemReport?.recommendation || 'None'}
`;
      } catch (e) {}
    }
  }

  const systemInstructions = `You are Lucy Prime, the autonomous Mission Control agent of this Sovereign Engineering OS. You have direct context of the user's workspace process.
  Active Project: ${project}
  Classification: ${vaultMemory.classification || 'AGENT_CORE'}
  
  [Project Architecture memory]:
  ${vaultMemory.architecture || 'No guidelines seeded.'}
  Coding Style: ${vaultMemory.codingStyle || 'Standard guidelines.'}
  Preferred Patterns: ${vaultMemory.preferredPatterns?.join(', ') || 'None'}
  
  [Ecosystem Workspace Status / Process Memory]:
  Active File: ${processMemory.activeFile || 'None'}
  Staged Task: ${processMemory.currentTask || 'Idle'}
  Last Emma validation decision: ${processMemory.lastEmmaDecision || 'None'}
  Last Ecosystem validation status: ${processMemory.lastEcosystemStatus || 'None'}
  Last Run ID: ${processMemory.lastRunId || 'None'}
  ${lastRunSummary}
  
  Guide the developer. Answer technical questions about the codebase, explain validation gates warnings, or recommend changes. Maintain an intelligent, concise, cyber-ops tone.`;

  try {
    const userMsg = messages[messages.length - 1]?.content || '';
    
    // Format full conversation history
    let conversationHistory = "";
    if (messages && messages.length > 1) {
      conversationHistory = "[Conversation History]:\n" + messages.slice(0, -1).map((m: any) => {
        const roleName = m.role === 'user' ? 'Operator' : 'Lucy Prime';
        return `${roleName}: ${m.content}`;
      }).join('\n') + "\n\n";
    }
    const finalUserPrompt = `${conversationHistory}Operator: ${userMsg}`;

    const responseText = await dispatchLLMCall(provider, model, systemInstructions, finalUserPrompt, false);
    res.json({ text: responseText });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get runs history
agentRouter.get('/api/runs', (req, res) => {
  try {
    if (!fs.existsSync(RUNS_DIR)) {
      return res.json([]);
    }
    const files = fs.readdirSync(RUNS_DIR);
    const runs = files.map(file => {
      try {
        return JSON.parse(fs.readFileSync(path.join(RUNS_DIR, file), 'utf8'));
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    res.json(runs);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get persistent ledger log
agentRouter.get('/api/ledger', (req, res) => {
  try {
    if (!fs.existsSync(LEDGER_DIR)) {
      return res.json([]);
    }
    const files = fs.readdirSync(LEDGER_DIR).filter(f => f.endsWith('.json'));
    const logs = files.map(file => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(LEDGER_DIR, file), 'utf8'));
        return {
          timestamp: data.timestamp || data.startedAt || new Date().toISOString(),
          event: data.event || (data.finalOutcome ? 'swarm_run' : 'generic'),
          runId: data.runId,
          project: data.project,
          file: data.affectedFiles?.[0] || data.file,
          mode: data.finalOutcome || data.mode,
          status: data.finalOutcome || data.status || 'completed',
          message: data.message || data.task || `Event: ${data.event}`,
          concerns: data.emmaValidation?.concerns || data.concerns || []
        };
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(logs);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
