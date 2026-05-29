import { useState, useEffect, useRef } from 'react';
import { 
  Folder, FileCode, CheckCircle2, AlertTriangle, Shield, Play, RotateCcw, 
  Layers, Settings, Terminal, RefreshCw, Cpu, Activity, Info, Check, X, Code2, 
  GitCommit, Heart, Database, AlertOctagon, HelpCircle, GitFork
} from 'lucide-react';
import './styles/index.css';

// System Interfaces
interface ProjectDefinition {
  id: string;
  name: string;
  classification:
    | "SOVEREIGN_KERNEL"
    | "AGENT_CORE"
    | "DESKTOP_ENGINE"
    | "LIVING_MATRIX"
    | "RAGE_MODDING"
    | "SPATIAL_MCP"
    | "SWARM_SIMULATION";
  vaultFile: string;
  autoCoaches: string[];
  linkedProjects: string[];
  online?: boolean; // Dynamically resolved if exists under D:\lucy ecosystem
}

interface CoachResult {
  coach: string;
  confidence: number;
  risk: number;
  severity: "low" | "medium" | "high";
  recommendation: string;
  affectedFiles?: string[];
  suggestedPatch?: string;
  timestamp: string;
}

interface EmmaValidation {
  decision: "approved" | "approved_with_warnings" | "needs_revision" | "rejected";
  riskScore: number;
  concerns: string[];
  requiredChanges: string[];
  explanation: string;
}

interface EcosystemReport {
  status: "safe" | "warning" | "critical";
  breakingImports: string[];
  affectedRepositories: string[];
  recommendation: string;
}

interface SwarmRun {
  id: string;
  project: string;
  file: string;
  mode: "audit" | "simulation" | "patch" | "apply";
  startedAt: string;
  completedAt?: string;
  provider: string;
  model: string;
  coachResults: CoachResult[];
  emmaValidation?: EmmaValidation;
  ecosystemReport?: EcosystemReport;
  status: ExecutionState;
  finalPatch?: string;
}

interface RepositoryHealth {
  architectureScore: number;
  documentationScore: number;
  securityScore: number;
  testCoverageScore: number;
}

interface LedgerLog {
  timestamp: string;
  event: string;
  runId?: string;
  project?: string;
  file?: string;
  mode?: string;
  status?: string;
  message?: string;
  concerns?: string[];
}

type ExecutionState =
  | "idle"
  | "running_coaches"
  | "aggregating"
  | "emma_validation"
  | "ecosystem_validation"
  | "approved"
  | "rejected"
  | "applying"
  | "completed"
  | "failed";

const ALL_COACHES = [
  { id: 'Mechanic', name: 'Mechanic', emoji: '🔧', role: 'Software Engineer', description: 'Handles bugs, refactoring, code repairs and writes proposed diff changes.' },
  { id: 'Librarian', name: 'Librarian', emoji: '📚', role: 'Repository Historian', description: 'Checks local Lucy Vault files to enforce historical style/guideline compliance.' },
  { id: 'Architect', name: 'Architect', emoji: '🏗️', role: 'System Architect', description: 'Reviews overall coupling, modularity risk, system impact, and scaling.' },
  { id: 'QA', name: 'QA', emoji: '🧪', role: 'Testing Specialist', description: 'Generates unit, integration, and regression testing validations.' },
  { id: 'Security', name: 'Security', emoji: '🔐', role: 'Vulnerability Auditor', description: 'Hunts secrets leaks, SQL injections, path traversals, and unsafe script evals.' },
  { id: 'Performance', name: 'Performance', emoji: '⚡', role: 'Optimization Expert', description: 'Audits loops, db query latency, CPU threads, and memory usage spikes.' },
  { id: 'DevOps', name: 'DevOps', emoji: '🚀', role: 'Infrastructure Reviewer', description: 'Reviews Docker configurations, container builds, and CI/CD pipelines.' },
  { id: 'CFO', name: 'CFO', emoji: '💰', role: 'Financial Assessor', description: 'Measures compute credit consumption and tokens optimization ratios.' },
  { id: 'CMO', name: 'CMO', emoji: '📣', role: 'Documentation Writer', description: 'Generates changelogs, release notes summaries, and updates manuals.' },
  { id: 'Planetary', name: 'Planetary', emoji: '🌍', role: 'Planetary Pulse Auditor', spec: 'Planetary Pulse', description: 'Monitors co-evolution variables, feedback loops, and swarm simulations.' },
  { id: 'Swarm', name: 'Swarm', emoji: '🤖', role: 'Agent Swarm Manager', spec: 'Hyperswarm', description: 'Validates A2A network protocols, bottlenecks, and agent deadlocks.' },
  { id: 'CivilUnrest', name: 'CivilUnrest', emoji: '🎮', role: 'FiveM System Expert', spec: 'Civil Unrest', description: 'Reviews NPC structures, native event execution speeds, and gang configurations.' },
  { id: 'Ecosystem', name: 'Ecosystem', emoji: '🌐', role: 'Cross-Repo Auditor', description: 'Audits dependencies across all 15 repositories to prevent integration breaks.' }
];

const ECOSYSTEM_CATEGORIES = {
  SOVEREIGN_KERNEL: "Core Brains & Kernels",
  AGENT_CORE: "Core Brains & Kernels",
  DESKTOP_ENGINE: "Core Brains & Kernels",
  LIVING_MATRIX: "Intelligence Infrastructure",
  SPATIAL_MCP: "Intelligence Infrastructure",
  SWARM_SIMULATION: "Simulations & Evolution",
  RAGE_MODDING: "Applications"
};

// Complete 15 Repository registry list
const MASTER_15_REPOS = [
  { id: 'Lucy-anchor', name: 'Lucy Anchor (Workstation)', classification: 'DESKTOP_ENGINE', vaultFile: 'Lucy-anchor.json', autoCoaches: ['DevOps', 'UX', 'Architect'], linkedProjects: ['lucy-core-ai'] },
  { id: 'lucy-core-ai', name: 'Lucy Core AI Base', classification: 'AGENT_CORE', vaultFile: 'lucy-core-ai.json', autoCoaches: ['Mechanic', 'Librarian', 'Architect', 'Security'], linkedProjects: ['E.M.M.A', 'lucy-core-ai-powered by emma', 'lucy-prime-standalone'] },
  { id: 'lucy-core-ai-powered by emma', name: 'Lucy Powered By Emma', classification: 'AGENT_CORE', vaultFile: 'lucy-core-ai-powered by emma.json', autoCoaches: ['Security', 'Librarian', 'CFO'], linkedProjects: ['lucy-core-ai', 'E.M.M.A'] },
  { id: 'lucy-prime-standalone', name: 'Lucy Prime Standalone', classification: 'DESKTOP_ENGINE', vaultFile: 'lucy-prime-standalone.json', autoCoaches: ['DevOps', 'UX', 'Architect'], linkedProjects: ['lucy-core-ai', 'Lucy-anchor'] },
  { id: 'E.M.M.A', name: 'E.M.M.A. Kernel', classification: 'SOVEREIGN_KERNEL', vaultFile: 'E.M.M.A.json', autoCoaches: ['Security', 'DevOps', 'Librarian', 'Architect'], linkedProjects: ['lucy-core-ai', 'lucy-prime-standalone'] },
  { id: 'lucy-hyperswarm', name: 'Lucy Hyperswarm', classification: 'SWARM_SIMULATION', vaultFile: 'lucy-hyperswarm.json', autoCoaches: ['Swarm', 'Architect', 'Planetary'], linkedProjects: ['lucy-core-ai'] },
  { id: 'alpha-matrix-engine-ame', name: 'Alpha Matrix Engine', classification: 'LIVING_MATRIX', vaultFile: 'alpha-matrix-engine-ame.json', autoCoaches: ['UX', 'Performance', 'Architect', 'Mechanic'], linkedProjects: ['lucy-core-ai', 'lucy-prime-standalone', 'twin city'] },
  { id: 'civil-unrest-framework-hub', name: 'Civil Unrest Framework', classification: 'RAGE_MODDING', vaultFile: 'civil-unrest-framework-hub.json', autoCoaches: ['CivilUnrest', 'Performance', 'QA', 'Mechanic'], linkedProjects: ['twin city', 'lucy-core-ai'] },
  { id: 'planetary-co-evolution', name: 'Planetary Co-Evolution', classification: 'SWARM_SIMULATION', vaultFile: 'planetary-co-evolution.json', autoCoaches: ['Planetary', 'Swarm', 'Librarian'], linkedProjects: ['lucy-core-ai', 'E.M.M.A'] },
  { id: 'mcp-maps-3d', name: 'MCP Maps 3D', classification: 'SPATIAL_MCP', vaultFile: 'mcp-maps-3d.json', autoCoaches: ['Swarm', 'Architect', 'Performance'], linkedProjects: ['lucy-core-ai', 'twin city'] },
  { id: 'twin city', name: 'Twin City Pipeline', classification: 'RAGE_MODDING', vaultFile: 'twin-city.json', autoCoaches: ['CivilUnrest', 'Architect', 'Performance'], linkedProjects: ['civil-unrest-framework-hub', 'alpha-matrix-engine-ame'] },
  { id: 'planetary-pulse', name: 'Planetary Pulse Stage 4', classification: 'SWARM_SIMULATION', vaultFile: 'planetary-pulse.json', autoCoaches: ['Planetary', 'Librarian'], linkedProjects: ['planetary-co-evolution', 'E.M.M.A'] },
  { id: 'planetary-coevolution-lucy-swarm', name: 'Planetary Coevolution Lucy Swarm', classification: 'SWARM_SIMULATION', vaultFile: 'planetary-coevolution-lucy-swarm.json', autoCoaches: ['Planetary', 'Swarm'], linkedProjects: ['planetary-co-evolution'] },
  { id: 'lucy-platform', name: 'Lucy Platform (Aether)', classification: 'AGENT_CORE', vaultFile: 'lucy-platform.json', autoCoaches: ['UX', 'DevOps'], linkedProjects: ['lucy-core-ai'] },
  { id: 'my-lucy-ai', name: 'My Lucy AI Workspace', classification: 'AGENT_CORE', vaultFile: 'my-lucy-ai.json', autoCoaches: ['Mechanic'], linkedProjects: ['lucy-core-ai'] }
];

function App() {
  // Ecosystem Target Selection
  const [projectsList, setProjectsList] = useState<ProjectDefinition[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('lucy-core-ai');
  const [projectFiles, setProjectFiles] = useState<Array<{ path: string; size: number; imports: string[]; exports: string[] }>>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  
  // View States
  const [workspaceTab, setWorkspaceTab] = useState<'editor' | 'canvas' | 'diff'>('editor');
  const [canvasMode, setCanvasMode] = useState<'swarm' | 'project' | 'ecosystem'>('swarm');
  const [historyTab, setHistoryTab] = useState<'runs' | 'backups' | 'ledger' | 'bundles'>('runs');
  const [bundlesList, setBundlesList] = useState<any[]>([]);
  const [runningBundles, setRunningBundles] = useState<Record<string, boolean>>({});
  const [ecosystemState, setEcosystemState] = useState<{
    services: Record<string, 'running' | 'stopped'>;
    bundles: any[];
    activeSwarmRuns: string[];
    health: number;
    uptime: number;
  } | null>(null);

  // Dynamic Topology Cache
  const [topologyNodes, setTopologyNodes] = useState<any[]>([]);
  const [topologyEdges, setTopologyEdges] = useState<any[]>([]);
  
  // Health metrics
  const [healthMetrics, setHealthMetrics] = useState<RepositoryHealth | null>(null);

  // Provider parameters
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('Ollama');
  const [selectedModel, setSelectedModel] = useState<string>('llama3');
  const [execMode, setExecMode] = useState<'audit' | 'simulation' | 'patch' | 'apply'>('simulation');

  // Swarm configuration
  const [activeCoaches, setActiveCoaches] = useState<Record<string, boolean>>({
    Mechanic: true,
    Librarian: true,
    Architect: true,
    Security: true,
    Ecosystem: true
  });
  
  // Execution state machine
  const [executionState, setExecutionState] = useState<ExecutionState>('idle');
  const [currentRun, setCurrentRun] = useState<SwarmRun | null>(null);
  const [runHistory, setRunHistory] = useState<SwarmRun[]>([]);
  const [ledgerLogs, setLedgerLogs] = useState<LedgerLog[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [telemetryProgress, setTelemetryProgress] = useState<Record<string, { status: string; progress: number }>>({});
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  
  // Chat States
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Greeting Operator. I am Lucy Prime, Mission Control of this Sovereign Workspace. What ecosystem intelligence or codebase task do you wish to review?' }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [processState, setProcessState] = useState<any>(null);

  // Bundler & Process Launch States
  const [isBundlerModalOpen, setIsBundlerModalOpen] = useState<boolean>(false);
  const [bundlerProgress, setBundlerProgress] = useState<string[]>([]);
  const [bundlerStatus, setBundlerStatus] = useState<'idle' | 'building' | 'success' | 'failed'>('idle');
  const [isProjectRunning, setIsProjectRunning] = useState<boolean>(false);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);
  
  const [userPrompt, setUserPrompt] = useState<string>('Verify parameters and add security checkpoints.');
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  // Connect to the WebSocket server for real-time state updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:3001`;
    
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'STATE_UPDATED') {
            const state = data.state;
            if (state) {
              setEcosystemState(state);
              if (state.bundles) {
                setBundlesList(state.bundles);
                const runningMap: Record<string, boolean> = {};
                state.bundles.forEach((b: any) => {
                  runningMap[b.project] = b.lifecycle === 'running';
                });
                setRunningBundles(runningMap);
              }
            }
          } else if (data.type === 'EVENT') {
            logConsole(`EVENT: [${data.event.type}] - ${JSON.stringify(data.event.payload)}`);
            if (data.event.type === 'SWARM_RUN_COMPLETE') {
              fetchRunsHistory();
              fetchLedgerLogs();
            } else if (data.event.type.startsWith('BUNDLE_')) {
              fetchBundles();
            }
          }
        } catch (e) {}
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    }

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Load baseline on boot
  useEffect(() => {
    fetchEcosystem();
    fetchHealth();
    fetchRunsHistory();
    fetchLedgerLogs();
    fetchBundles();
    fetchProcessState(selectedProject);
    fetchProjectRunningStatus(selectedProject);
  }, []);

  // Poll running status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedProject) {
        fetchProjectRunningStatus(selectedProject);
      }
      bundlesList.forEach(b => {
        const bundleName = b.project || b.name;
        if (bundleName) {
          fetchBundleRunningStatus(bundleName);
        }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedProject, bundlesList]);

  // Auto-scroll chat window
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Fetch local projects & cross-examine online state
  const fetchEcosystem = async () => {
    try {
      const res = await fetch('/api/ecosystem');
      if (res.ok) {
        const localDirs: any[] = await res.json();
        const localNames = localDirs.map(d => d.id);
        
        // Map static registry
        const mappedList: ProjectDefinition[] = MASTER_15_REPOS.map(repo => ({
          ...repo,
          classification: repo.classification as any,
          online: localNames.includes(repo.id)
        }));
        
        // Dynamically append any folders discovered on disk that are not in the static metadata registry
        localDirs.forEach(localProj => {
          const alreadyMapped = mappedList.some(p => p.id === localProj.id);
          if (!alreadyMapped) {
            mappedList.push({
              id: localProj.id,
              name: localProj.name || localProj.id,
              classification: localProj.classification || 'AGENT_CORE',
              vaultFile: localProj.vaultFile || `${localProj.id}.json`,
              autoCoaches: localProj.autoCoaches || ['Mechanic', 'Librarian'],
              linkedProjects: localProj.linkedProjects || [],
              online: true
            });
          }
        });
        
        setProjectsList(mappedList);
        
        // Default select first online project
        const firstOnline = mappedList.find(p => p.online);
        if (firstOnline && !selectedProject) {
          handleSelectProject(firstOnline.id);
        } else {
          handleSelectProject(selectedProject || 'lucy-core-ai');
        }
      }
    } catch (e) {
      logConsole("SYSTEM: Error fetching ecosystem registry: " + e);
    }
  };

  // Fetch AI engine availability
  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setProviders(data);
        const activeProv = data.find((p: any) => p.provider === selectedProvider);
        if (activeProv && activeProv.models.length > 0) {
          setSelectedModel(activeProv.models[0]);
        }
      }
    } catch (e) {}
  };

  const fetchRunsHistory = async () => {
    try {
      const res = await fetch('/api/runs');
      if (res.ok) {
        const data = await res.json();
        setRunHistory(data);
      }
    } catch (e) {}
  };

  const fetchLedgerLogs = async () => {
    try {
      const res = await fetch('/api/ledger');
      if (res.ok) {
        const data = await res.json();
        setLedgerLogs(data);
      }
    } catch (e) {}
  };

  const fetchBundles = async () => {
    try {
      const res = await fetch('/api/bundles');
      if (res.ok) {
        const data = await res.json();
        setBundlesList(data);
        for (const b of data) {
          fetchBundleRunningStatus(b.name);
        }
      }
    } catch (e) {
      logConsole("SYSTEM: Error fetching bundles: " + e);
    }
  };

  const fetchBundleRunningStatus = async (proj: string) => {
    try {
      const res = await fetch(`/api/bundles/${proj}/status`);
      if (res.ok) {
        const data = await res.json();
        setRunningBundles(prev => ({ ...prev, [proj]: data.running }));
      }
    } catch (e) {}
  };

  const handleLaunchBundle = async (proj: string) => {
    logConsole(`SYSTEM: Spawning bundled application instance for ${proj}...`);
    try {
      const res = await fetch(`/api/bundles/${proj}/launch`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        logConsole(`SYSTEM: ${data.message}`);
        setRunningBundles(prev => ({ ...prev, [proj]: true }));
        fetchBundles();
      } else {
        const err = await res.json();
        logConsole(`SYSTEM ERROR: Launch bundle failed: ${err.error}`);
      }
    } catch (e) {
      logConsole(`SYSTEM ERROR: Launch bundle connection error: ${e}`);
    }
  };

  const handleTerminateBundle = async (proj: string) => {
    logConsole(`SYSTEM: Requesting termination of bundled ${proj}...`);
    try {
      const res = await fetch(`/api/bundles/${proj}/terminate`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        logConsole(`SYSTEM: ${data.message}`);
        setRunningBundles(prev => ({ ...prev, [proj]: false }));
        fetchBundles();
      }
    } catch (e) {
      logConsole(`SYSTEM ERROR: Terminate bundle failed: ${e}`);
    }
  };

  const fetchBackups = async (proj: string) => {
    try {
      const res = await fetch(`/api/backups/${proj}`);
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      }
    } catch (e) {}
  };

  // Fetch dynamic repository health metrics
  const fetchRepoHealth = async (proj: string) => {
    try {
      const res = await fetch(`/api/ecosystem/${proj}/health`);
      if (res.ok) {
        const data = await res.json();
        setHealthMetrics(data);
      } else {
        setHealthMetrics(null);
      }
    } catch (e) {
      setHealthMetrics(null);
    }
  };

  // Load Topology Graph dynamically from imports
  const fetchTopologyGraph = async () => {
    try {
      const res = await fetch('/api/ecosystem/topology');
      if (res.ok) {
        const data = await res.json();
        setTopologyNodes(data.nodes || []);
        setTopologyEdges(data.edges || []);
      }
    } catch (e) {}
  };

  const fetchProcessState = async (proj: string) => {
    try {
      const res = await fetch(`/api/ecosystem/${proj}/process`);
      if (res.ok) {
        const data = await res.json();
        setProcessState(data);
      }
    } catch (e) {}
  };

  const fetchProjectRunningStatus = async (proj: string) => {
    try {
      const res = await fetch(`/api/ecosystem/${proj}/status`);
      if (res.ok) {
        const data = await res.json();
        setIsProjectRunning(data.running);
      }
    } catch (e) {}
  };

  const sendChatMessage = async (text: string) => {
    if (!text.trim() || !selectedProject || isChatLoading) return;
    
    const userMsg = { role: 'user' as const, content: text };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput('');
    setIsChatLoading(true);
    logConsole(`CHAT: Sending prompt to Lucy Prime for project: ${selectedProject}`);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: selectedProject,
          messages: newMessages,
          provider: selectedProvider,
          model: selectedModel
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
        logConsole(`CHAT: Response received from Lucy Prime.`);
        fetchProcessState(selectedProject);
      } else {
        const err = await res.text();
        setChatMessages(prev => [...prev, { role: 'assistant', content: `SYSTEM ERROR: Failed to communicate with Lucy Core agent. Details: ${err}` }]);
        logConsole(`CHAT ERROR: Failed: ${err}`);
      }
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `SYSTEM ERROR: Connection error: ${e}` }]);
      logConsole(`CHAT ERROR: Connection error: ${e}`);
    } finally {
      setIsChatLoading(false);
    }
  };

  const triggerAppBundle = async () => {
    if (!selectedProject) return;
    setIsBundlerModalOpen(true);
    setBundlerStatus('building');
    setBundlerProgress(['Initializing OS Generesis Compiler...', 'Locating target project directories...']);
    
    try {
      const res = await fetch(`/api/ecosystem/${selectedProject}/bundle`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setBundlerStatus('success');
        setBundlerProgress(prev => [
          ...prev,
          `Creating backup snapshot... Done.`,
          `Bundling workspace modules... Done.`,
          `Generating release signature manifest: ${data.manifest?.bundleId}`,
          `Lucy OS compilation complete! Release compiled successfully.`
        ]);
        logConsole(`SYSTEM: Bundled project ${selectedProject}. Release signed: ${data.manifest?.bundleId}`);
        fetchBundles();
      } else {
        const err = await res.json();
        setBundlerStatus('failed');
        setBundlerProgress(prev => [...prev, `COMPILATION ERROR: ${err.error || 'Failed during package serialization.'}`]);
        logConsole(`SYSTEM ERROR: Bundling failed: ${err.error}`);
      }
    } catch (e) {
      setBundlerStatus('failed');
      setBundlerProgress(prev => [...prev, `CONNECTION ERROR: ${e}`]);
      logConsole(`SYSTEM ERROR: Bundling server error: ${e}`);
    }
  };

  const handleLaunchProject = async () => {
    if (!selectedProject) return;
    logConsole(`SYSTEM: Spawning background application instance for ${selectedProject}...`);
    try {
      const res = await fetch(`/api/ecosystem/${selectedProject}/launch`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        logConsole(`SYSTEM: ${data.message}`);
        setIsProjectRunning(true);
        fetchProjectRunningStatus(selectedProject);
      } else {
        const err = await res.json();
        logConsole(`SYSTEM ERROR: Launch failed: ${err.error}`);
      }
    } catch (e) {
      logConsole(`SYSTEM ERROR: Launch server connection error: ${e}`);
    }
  };

  const handleTerminateProject = async () => {
    if (!selectedProject) return;
    logConsole(`SYSTEM: Requesting termination of ${selectedProject}...`);
    try {
      const res = await fetch(`/api/ecosystem/${selectedProject}/terminate`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        logConsole(`SYSTEM: ${data.message}`);
        setIsProjectRunning(false);
        fetchProjectRunningStatus(selectedProject);
      }
    } catch (e) {
      logConsole(`SYSTEM ERROR: Terminate failed: ${e}`);
    }
  };

  // Select project and fetch file listings
  const handleSelectProject = async (projId: string) => {
    const projDef = MASTER_15_REPOS.find(p => p.id === projId);
    if (!projDef) return;

    setSelectedProject(projId);
    setSelectedFile('');
    setFileContent('');
    setProjectFiles([]);
    setHealthMetrics(null);
    logConsole(`SYSTEM: Workspace switched to: ${projDef.name} [${projDef.classification}]`);

    // Auto-detect coaches
    const newCoaches: Record<string, boolean> = {
      Mechanic: false,
      Librarian: false,
      Architect: false,
      QA: false,
      Security: false,
      Performance: false,
      DevOps: false,
      CFO: false,
      CMO: false,
      Planetary: false,
      Swarm: false,
      CivilUnrest: false,
      Ecosystem: true
    };
    projDef.autoCoaches.forEach(c => {
      newCoaches[c] = true;
    });
    setActiveCoaches(newCoaches);
    logConsole(`AUTO-DETECT: Loaded coaches for classification ${projDef.classification}: [${projDef.autoCoaches.join(', ')}]`);

    // Fetch repository files if folder exists
    const isOnline = projectsList.find(p => p.id === projId)?.online ?? true;
    if (isOnline) {
      try {
        const res = await fetch(`/api/ecosystem/${projId}/files`);
        if (res.ok) {
          const data = await res.json();
          setProjectFiles(data);
          if (data.length > 0) {
            handleSelectFile(projId, data[0].path);
          }
        }
      } catch (e) {}
      fetchRepoHealth(projId);
      fetchBackups(projId);
    } else {
      logConsole(`WARNING: Project folder '${projId}' is offline. Please clone/import.`);
    }

    fetchTopologyGraph();
    fetchProcessState(projId);
    fetchProjectRunningStatus(projId);
  };

  // Load file content
  const handleSelectFile = async (proj: string, filePath: string) => {
    setSelectedFile(filePath);
    setWorkspaceTab('editor');
    try {
      const res = await fetch(`/api/ecosystem/${proj}/file?path=${encodeURIComponent(filePath)}`);
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content);
      }
    } catch (e) {}
  };

  // Run Swarm state machine execution loop
  const handleRunSwarm = async () => {
    if (!selectedProject || !selectedFile) {
      logConsole("SYSTEM ERROR: Awaiting repository file selection.");
      return;
    }

    setExecutionState('running_coaches');
    setWorkspaceTab('canvas');
    logConsole(`SWARM: Triggering swarm run ID... Starting parallel coach evaluation...`);

    const activeCoachKeys = Object.keys(activeCoaches).filter(k => activeCoaches[k]);
    const progressInit: Record<string, { status: string; progress: number }> = {
      Lucy: { status: 'thinking', progress: 5 },
      Emma: { status: 'idle', progress: 0 },
      Ecosystem: { status: 'idle', progress: 0 }
    };
    activeCoachKeys.forEach(coach => {
      progressInit[coach] = { status: 'idle', progress: 0 };
    });
    setTelemetryProgress(progressInit);

    // Dynamic telemetry progress loop
    let progressTimer = setInterval(() => {
      setTelemetryProgress(prev => {
        const updated = { ...prev };
        
        // Progress active coaches in parallel
        let coachesDone = true;
        activeCoachKeys.forEach(coach => {
          if (updated[coach] && coach !== 'Ecosystem') {
            if (updated[coach].status === 'idle') {
              updated[coach].status = 'thinking';
              updated[coach].progress = 15;
              coachesDone = false;
            } else if (updated[coach].status === 'thinking') {
              const delta = Math.floor(Math.random() * 25) + 10;
              const nextVal = Math.min(100, updated[coach].progress + delta);
              updated[coach].progress = nextVal;
              if (nextVal >= 100) {
                updated[coach].status = 'complete';
              }
              coachesDone = false;
            }
          }
        });

        // Aggregation state
        if (coachesDone && updated.Lucy && updated.Lucy.status === 'thinking') {
          updated.Lucy.progress = 60;
          updated.Lucy.status = 'aggregating';
          setExecutionState('aggregating');
          logConsole("SWARM: Running Lucy Aggregation Layer Consensus reducer...");
        } else if (updated.Lucy && updated.Lucy.status === 'aggregating') {
          updated.Lucy.progress = 100;
          updated.Lucy.status = 'complete';
          updated.Emma.status = 'thinking';
          updated.Emma.progress = 20;
          setExecutionState('emma_validation');
          logConsole("SWARM: Directing patch to Emma Validation Gate...");
        }

        // Emma validation state
        if (updated.Emma && updated.Emma.status === 'thinking') {
          const nextVal = Math.min(100, updated.Emma.progress + 30);
          updated.Emma.progress = nextVal;
          if (nextVal >= 100) {
            updated.Emma.status = 'complete';
            updated.Ecosystem.status = 'thinking';
            updated.Ecosystem.progress = 10;
            setExecutionState('ecosystem_validation');
            logConsole("SWARM: Handing off to Ecosystem Coach for cross-repo integration checks...");
          }
        }

        // Ecosystem validation state
        if (updated.Ecosystem && updated.Ecosystem.status === 'thinking') {
          const nextVal = Math.min(100, updated.Ecosystem.progress + 40);
          updated.Ecosystem.progress = nextVal;
          if (nextVal >= 100) {
            updated.Ecosystem.status = 'complete';
          }
        }

        return updated;
      });
    }, 450);

    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: selectedProject,
          file: selectedFile,
          content: fileContent,
          prompt: userPrompt,
          provider: selectedProvider,
          model: selectedModel,
          mode: execMode,
          coaches: activeCoachKeys
        })
      });

      clearInterval(progressTimer);

      if (res.ok) {
        const runResult: SwarmRun = await res.json();
        setCurrentRun(runResult);
        setRunHistory(prev => [runResult, ...prev]);
        setExecutionState(runResult.status);

        // Sync final telemetry
        const finalTelemetry: Record<string, { status: string; progress: number }> = {
          Lucy: { status: 'complete', progress: 100 },
          Emma: { status: runResult.emmaValidation?.decision === 'rejected' ? 'failed' : 'complete', progress: 100 },
          Ecosystem: { status: runResult.ecosystemReport?.status === 'critical' ? 'failed' : 'complete', progress: 100 }
        };
        activeCoachKeys.forEach(coach => {
          const cr = runResult.coachResults.find(r => r.coach === coach);
          finalTelemetry[coach] = {
            status: cr ? 'complete' : 'failed',
            progress: 100
          };
        });
        setTelemetryProgress(finalTelemetry);

        logConsole(`SWARM: Finished run. Final decision: ${runResult.status.toUpperCase()}`);
        
        if (execMode !== 'audit' && runResult.finalPatch) {
          setWorkspaceTab('diff');
        } else {
          setWorkspaceTab('editor');
        }

        if (execMode === 'apply' && runResult.status === 'completed') {
          fetchBackups(selectedProject);
          handleSelectFile(selectedProject, selectedFile);
        }

        fetchLedgerLogs();
        fetchProcessState(selectedProject);

      } else {
        const err = await res.json();
        setExecutionState('failed');
        logConsole(`SWARM ERROR: execution failed: ${err.error || 'unknown'}`);
      }
    } catch (e) {
      clearInterval(progressTimer);
      setExecutionState('failed');
      logConsole(`SWARM ERROR: Server communication error: ${e}`);
    }
  };

  const handleRestoreBackup = async (backupTs: string) => {
    if (!selectedProject || !selectedFile) return;
    
    logConsole(`SYSTEM: Restoring ${selectedFile} from backup ts: ${backupTs}...`);
    try {
      const res = await fetch(`/api/backups/${selectedProject}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: backupTs,
          file: selectedFile
        })
      });
      if (res.ok) {
        const data = await res.json();
        logConsole(`SYSTEM: Restore completed: ${data.message}`);
        handleSelectFile(selectedProject, selectedFile);
        fetchBackups(selectedProject);
        fetchLedgerLogs();
      }
    } catch (e) {
      logConsole(`SYSTEM ERROR: Restore failed: ${e}`);
    }
  };

  function logConsole(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    setTimeout(() => {
      if (consoleBottomRef.current) {
        consoleBottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  }

  const renderDiff = () => {
    if (!currentRun || !currentRun.finalPatch) {
      return <div className="text-gray-500 italic text-xs">No patch available. Run simulation or patch modes to generate diff.</div>;
    }

    const origLines = fileContent.split('\n');
    const patchLines = currentRun.finalPatch.split('\n');
    const diffs: Array<{ type: 'added' | 'removed' | 'normal'; text: string; lineNo?: number }> = [];
    let i = 0, j = 0;
    while (i < origLines.length || j < patchLines.length) {
      if (i < origLines.length && j < patchLines.length) {
        if (origLines[i] === patchLines[j]) {
          diffs.push({ type: 'normal', text: origLines[i], lineNo: i + 1 });
          i++;
          j++;
        } else {
          let matchIndex = -1;
          for (let k = j; k < patchLines.length; k++) {
            if (patchLines[k] === origLines[i]) {
              matchIndex = k;
              break;
            }
          }
          if (matchIndex !== -1) {
            for (let k = j; k < matchIndex; k++) {
              diffs.push({ type: 'added', text: patchLines[k] });
            }
            j = matchIndex;
          } else {
            diffs.push({ type: 'removed', text: origLines[i], lineNo: i + 1 });
            i++;
          }
        }
      } else if (i < origLines.length) {
        diffs.push({ type: 'removed', text: origLines[i], lineNo: i + 1 });
        i++;
      } else if (j < patchLines.length) {
        diffs.push({ type: 'added', text: patchLines[j] });
        j++;
      }
    }

    return (
      <div className="bg-[#0b0b13] border border-[#00f5ff]/20 rounded p-4 font-mono text-xs overflow-auto h-[480px]">
        {diffs.map((line, idx) => (
          <div key={idx} className={`flex py-0.5 px-2 rounded ${
            line.type === 'added' ? 'bg-green-950/40 text-green-400 border-l-2 border-green-500' :
            line.type === 'removed' ? 'bg-red-950/40 text-red-400 border-l-2 border-red-500 line-through' :
            'text-gray-400'
          }`}>
            <span className="w-10 text-gray-600 select-none text-right pr-3">{line.lineNo || ''}</span>
            <span className="w-4 select-none">{line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}</span>
            <span className="whitespace-pre">{line.text}</span>
          </div>
        ))}
      </div>
    );
  };

  const getSwarmConsensus = () => {
    if (!currentRun || currentRun.coachResults.length === 0) return { confidence: 0, risk: 0, agreement: 0 };
    const confs = currentRun.coachResults.map(r => r.confidence);
    const risks = currentRun.coachResults.map(r => r.risk);
    const avgConfidence = confs.reduce((a, b) => a + b, 0) / confs.length;
    const avgRisk = risks.reduce((a, b) => a + b, 0) / risks.length;
    const mean = avgConfidence;
    const variance = confs.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / confs.length;
    const agreement = Math.max(0, Math.min(100, Math.round((1 - Math.sqrt(variance)) * 100)));
    return {
      confidence: Math.round(avgConfidence * 100),
      risk: Math.round(avgRisk * 100),
      agreement
    };
  };

  const consensus = getSwarmConsensus();

  // Helper to color project category tags
  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'SOVEREIGN_KERNEL': return 'text-red-400 bg-red-950/20 border-red-500/20';
      case 'AGENT_CORE': return 'text-cyan-400 bg-cyan-950/20 border-cyan-500/20';
      case 'LIVING_MATRIX': return 'text-purple-400 bg-purple-950/20 border-purple-500/20';
      case 'RAGE_MODDING': return 'text-orange-400 bg-orange-950/20 border-orange-500/20';
      case 'SPATIAL_MCP': return 'text-yellow-400 bg-yellow-950/20 border-yellow-500/20';
      case 'SWARM_SIMULATION': return 'text-green-400 bg-green-950/20 border-green-500/20';
      default: return 'text-gray-400 bg-gray-950/20 border-gray-500/20';
    }
  };

  return (
    <div className="flex h-screen bg-[#06060a] text-white font-mono overflow-hidden">
      
      {/* COLUMN 1: System Navigator */}
      <div className="w-[340px] bg-[#0b0b13] border-r border-[#00f5ff]/20 flex flex-col h-full flex-shrink-0">
        
        {/* Neon header branding & Health bar */}
        <div className="p-4 border-b border-[#00f5ff]/20">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#00f5ff] to-purple-400">
              LUCY ANCHOR
            </h1>
            <span className="text-[9px] bg-cyan-950 text-[#00f5ff] px-2 py-0.5 rounded border border-[#00f5ff]/20 uppercase">
              AGENTIC OS
            </span>
          </div>

          {/* Global Ecosystem Health & Services Telemetry */}
          {ecosystemState && (
            <div className="my-3 p-2 bg-[#10101c] rounded border border-[#00f5ff]/10 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Ecosystem Health</span>
                <span className={`font-bold ${
                  ecosystemState.health >= 80 ? 'text-green-400' :
                  ecosystemState.health >= 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>{ecosystemState.health}%</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded overflow-hidden">
                <div className={`h-full transition-all duration-500 ${
                  ecosystemState.health >= 80 ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' :
                  ecosystemState.health >= 50 ? 'bg-yellow-500 shadow-[0_0_8px_#eab308]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                }`} style={{ width: `${ecosystemState.health}%` }} />
              </div>
              
              <div className="grid grid-cols-3 gap-1 pt-1 text-[8px] text-center font-bold tracking-wider uppercase">
                <div className="flex flex-col items-center p-1 bg-black/40 rounded border border-white/5">
                  <span className={`w-1.5 h-1.5 rounded-full mb-0.5 ${ecosystemState.services.anchor === 'running' ? 'bg-green-500 shadow-[0_0_4px_#22c55e]' : 'bg-red-500'}`} />
                  <span className="text-gray-400">Cockpit</span>
                </div>
                <div className="flex flex-col items-center p-1 bg-black/40 rounded border border-white/5">
                  <span className={`w-1.5 h-1.5 rounded-full mb-0.5 ${ecosystemState.services.swarm === 'running' ? 'bg-green-500 shadow-[0_0_4px_#22c55e]' : 'bg-red-500'}`} />
                  <span className="text-gray-400">Swarm</span>
                </div>
                <div className="flex flex-col items-center p-1 bg-black/40 rounded border border-white/5">
                  <span className={`w-1.5 h-1.5 rounded-full mb-0.5 ${ecosystemState.services.builder === 'running' ? 'bg-green-500 shadow-[0_0_4px_#22c55e]' : 'bg-red-500'}`} />
                  <span className="text-gray-400">Builder</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1 mt-3">
            {providers.map((prov, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs bg-[#10101c] p-2 rounded border border-white/5">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${prov.online ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
                  <span className="text-gray-300 font-semibold">{prov.provider}</span>
                </div>
                <div className="text-[10px] text-gray-500">
                  {prov.online ? `${prov.latency}ms (${prov.models[0]?.substring(0,8)})` : 'offline'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grouped dropdown project selector */}
        <div className="p-4 border-b border-[#00f5ff]/10">
          <label className="text-[9px] text-gray-500 uppercase block mb-1">Ecosystem Project Target</label>
          <div className="relative">
            <select
              value={selectedProject}
              onChange={(e) => handleSelectProject(e.target.value)}
              className="w-full bg-[#10101c] border border-[#00f5ff]/20 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#00f5ff] text-gray-200 cursor-pointer appearance-none"
            >
              {Object.entries(ECOSYSTEM_CATEGORIES).map(([catId, catName]) => {
                const catRepos = projectsList.filter(p => p.classification === catId || (catId === 'AGENT_CORE' && (p.classification === 'AGENT_CORE' || p.classification === 'DESKTOP_ENGINE')));
                if (catRepos.length === 0) return null;
                return (
                  <optgroup key={catId} label={catName} className="bg-[#0b0b13] text-[#00f5ff]">
                    {catRepos.map((repo) => (
                      <option key={repo.id} value={repo.id} className="text-gray-200">
                        {repo.online ? '🟢' : '⚪'} {repo.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#00f5ff]">
              ▼
            </div>
          </div>
        </div>

        {/* Repository File Tree */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">
            <Folder size={14} className="text-[#00f5ff]" />
            <span>Filesystem Registry</span>
          </div>

          <div className="space-y-1">
            {projectFiles.map((fileObj, idx) => {
              const isActive = selectedFile === fileObj.path;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectFile(selectedProject, fileObj.path)}
                  className={`w-full flex items-center justify-between text-left p-2 rounded text-xs transition ${
                    isActive ? 'bg-[#00f5ff]/10 border-l-2 border-[#00f5ff] text-white' : 'hover:bg-white/5 text-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode size={13} className={isActive ? 'text-[#00f5ff]' : 'text-gray-600'} />
                    <span className="truncate">{fileObj.path}</span>
                  </div>
                  <span className="text-[10px] text-gray-600 flex-shrink-0">
                    {(fileObj.size / 1024).toFixed(1)}kb
                  </span>
                </button>
              );
            })}
            {projectFiles.length === 0 && (
              <div className="text-gray-600 text-xs italic p-2 bg-[#121220]/40 rounded border border-dashed border-white/5">
                Repo is offline. Run Clone/Import to fetch target branch.
              </div>
            )}
          </div>
        </div>

        {/* Histories and Ledger tab section */}
        <div className="h-[240px] border-t border-[#00f5ff]/20 flex flex-col bg-[#08080d]">
          <div className="flex border-b border-[#00f5ff]/10 text-[9px] text-center font-medium">
            <button
              onClick={() => setHistoryTab('runs')}
              className={`flex-1 py-2 ${historyTab === 'runs' ? 'bg-[#0b0b13] text-[#00f5ff] border-b border-[#00f5ff]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Runs
            </button>
            <button
              onClick={() => setHistoryTab('backups')}
              className={`flex-1 py-2 ${historyTab === 'backups' ? 'bg-[#0b0b13] text-[#00f5ff] border-b border-[#00f5ff]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Backups
            </button>
            <button
              onClick={() => setHistoryTab('ledger')}
              className={`flex-1 py-2 ${historyTab === 'ledger' ? 'bg-[#0b0b13] text-[#00f5ff] border-b border-[#00f5ff]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Ledger
            </button>
            <button
              onClick={() => setHistoryTab('bundles')}
              className={`flex-1 py-2 ${historyTab === 'bundles' ? 'bg-[#0b0b13] text-[#00f5ff] border-b border-[#00f5ff]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Bundles
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar text-xs">
            {historyTab === 'runs' && (
              <div className="space-y-1.5">
                {runHistory.map((run, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentRun(run);
                      setWorkspaceTab('diff');
                    }}
                    className={`w-full flex items-center justify-between text-left p-1.5 rounded bg-[#10101c] border ${
                      currentRun?.id === run.id ? 'border-[#00f5ff]/40 text-white' : 'border-white/5 text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold truncate">{run.file.split('/').pop()}</div>
                      <div className="text-[10px] text-gray-600">{new Date(run.startedAt).toLocaleTimeString()} • {run.mode}</div>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded capitalize ${
                      run.status === 'completed' ? 'bg-green-950 text-green-400' :
                      run.status === 'rejected' ? 'bg-red-950 text-red-400' :
                      run.status.includes('validation') ? 'bg-purple-950 text-purple-400 animate-pulse' :
                      'bg-blue-950 text-blue-400'
                    }`}>
                      {run.status}
                    </span>
                  </button>
                ))}
                {runHistory.length === 0 && <div className="text-gray-600 italic p-2 text-center">No runs logged.</div>}
              </div>
            )}

            {historyTab === 'backups' && (
              <div className="space-y-1.5">
                {backups.map((bak, idx) => (
                  <div key={idx} className="flex justify-between items-center p-1.5 rounded bg-[#10101c] border border-white/5">
                    <div className="truncate pr-2">
                      <div className="font-semibold text-gray-300 truncate w-32">{selectedFile || bak.originalFile}</div>
                      <div className="text-[10px] text-gray-600">{new Date(bak.timestamp).toLocaleString()}</div>
                    </div>
                    <button
                      onClick={() => handleRestoreBackup(bak.timestamp)}
                      className="px-2.5 py-1 bg-cyan-950 hover:bg-[#00f5ff] text-[#00f5ff] hover:text-black rounded border border-[#00f5ff]/20 text-[9px] font-bold transition uppercase"
                    >
                      Rollback
                    </button>
                  </div>
                ))}
                {backups.length === 0 && <div className="text-gray-600 italic p-2 text-center">No backups found.</div>}
              </div>
            )}

            {historyTab === 'ledger' && (
              <div className="space-y-1.5 font-mono text-[9px] text-[#00f5ff]/60">
                {ledgerLogs.map((log, idx) => (
                  <div key={idx} className="p-1 border-b border-white/5 pb-1">
                    <div className="flex justify-between text-[8px] text-gray-500">
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className="text-[#00f5ff]">{log.event.toUpperCase()}</span>
                    </div>
                    <div className="text-gray-300 font-semibold truncate mt-0.5">{log.message || `${log.project || ''} - ${log.status || ''}`}</div>
                  </div>
                ))}
                {ledgerLogs.length === 0 && <div className="text-gray-600 italic p-2 text-center">Ledger database empty.</div>}
              </div>
            )}

            {historyTab === 'bundles' && (
              <div className="space-y-1.5">
                {bundlesList.map((bun, idx) => {
                  const isRunning = bun.lifecycle === 'running';
                  const isStarting = bun.lifecycle === 'starting';
                  const isFailed = bun.lifecycle === 'failed';
                  const bundleName = bun.project || bun.name;
                  const port = bun.port || 3000;
                  const linkUrl = `http://localhost:${port}`;
                  return (
                    <div key={idx} className="p-2 rounded bg-[#10101c] border border-[#00f5ff]/10 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="truncate pr-1">
                          <div className="font-semibold text-gray-200 truncate">{bundleName}</div>
                          <div className="text-[8px] text-gray-500 truncate">{bun.id?.substring(0, 18) || bun.bundleId?.substring(0,18)}...</div>
                          <div className="text-[8px] text-gray-600">Port {port} • Health: {bun.health ?? 100}%</div>
                        </div>
                        <span className={`w-2 h-2 rounded-full ${
                          isRunning ? 'bg-green-500 shadow-[0_0_6px_#22c55e]' :
                          isStarting ? 'bg-yellow-500 animate-pulse shadow-[0_0_6px_#eab308]' :
                          isFailed ? 'bg-red-500 shadow-[0_0_6px_#ef4444]' : 'bg-red-500/40'
                        }`} />
                      </div>
                      <div className="flex gap-1.5">
                        {!isRunning && !isStarting ? (
                          <button
                            onClick={() => handleLaunchBundle(bundleName)}
                            className="flex-1 py-1 bg-green-950 hover:bg-green-900 text-green-400 rounded text-[9px] font-bold transition uppercase"
                          >
                            Launch
                          </button>
                        ) : (
                          <button
                            onClick={() => handleTerminateBundle(bundleName)}
                            className="flex-1 py-1 bg-red-950 hover:bg-red-900 text-red-400 rounded text-[9px] font-bold transition uppercase"
                            disabled={isStarting}
                          >
                            Stop
                          </button>
                        )}
                        <a
                          href={linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-1 bg-[#00f5ff]/10 hover:bg-[#00f5ff] text-[#00f5ff] hover:text-black rounded text-[9px] font-bold transition uppercase text-center border border-[#00f5ff]/20 flex items-center justify-center gap-0.5"
                        >
                          Open 🌐
                        </a>
                      </div>
                    </div>
                  );
                })}
                {bundlesList.length === 0 && <div className="text-gray-600 italic p-2 text-center">No compiled releases.</div>}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* COLUMN 2: Spatial Canvas & Code workspace */}
      <div className="flex-1 flex flex-col h-full bg-[#07070a] overflow-hidden">
        
        {/* Header Workspace HUD */}
        <div className="px-6 py-3 border-b border-[#00f5ff]/20 flex justify-between items-center flex-shrink-0 bg-[#0b0b13] gap-4">
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-wider text-gray-300">HELIXSTUDIO CONSOLE</h2>
              {selectedProject && (
                <span className={`text-[9px] px-2 py-0.5 rounded border font-semibold ${
                  getClassificationColor(projectsList.find(p => p.id === selectedProject)?.classification || '')
                }`}>
                  {projectsList.find(p => p.id === selectedProject)?.classification || ''}
                </span>
              )}
            </div>
            <div className="text-[10px] text-gray-600 truncate max-w-[280px] mt-0.5">
              Target: D:\lucy ecosystem\{selectedProject}\{selectedFile}
            </div>
          </div>

          {/* Process Memory HUD */}
          {processState && (
            <div className="hidden lg:flex items-center gap-5 border-l border-r border-white/5 px-6 py-1 mx-4 max-w-[40%] flex-1 overflow-hidden">
              <div className="truncate flex-1">
                <span className="text-[8px] text-gray-500 block uppercase font-bold tracking-wider">Milestone Task</span>
                <span className="text-xs text-cyan-400 font-semibold truncate block" title={processState.currentTask}>
                  {processState.currentTask || 'Idle'}
                </span>
              </div>
              <div className="flex-shrink-0">
                <span className="text-[8px] text-gray-500 block uppercase font-bold tracking-wider">Emma Validation</span>
                <span className={`text-xs font-bold capitalize ${
                  processState.lastEmmaDecision?.includes('approved') ? 'text-green-400' :
                  processState.lastEmmaDecision === 'rejected' ? 'text-red-400' :
                  'text-gray-500'
                }`}>
                  {processState.lastEmmaDecision ? processState.lastEmmaDecision.replace(/_/g, ' ') : 'None'}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            {/* Running status indicator */}
            <div className="flex items-center gap-1.5 bg-[#10101c] px-3 py-1.5 rounded border border-white/5 text-[10px]">
              <span className={`w-2 h-2 rounded-full ${isProjectRunning ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
              <span className="text-gray-400 font-semibold">{isProjectRunning ? 'RUNNING' : 'OFFLINE'}</span>
            </div>

            {/* Launch Controllers */}
            <div className="flex items-center gap-1">
              {!isProjectRunning ? (
                <button
                  onClick={handleLaunchProject}
                  className="px-3 py-1.5 bg-green-950 hover:bg-green-900 border border-green-500/30 text-green-400 hover:text-green-300 font-bold rounded text-[10px] transition uppercase flex items-center gap-1 cursor-pointer"
                >
                  <Play size={10} />
                  <span>Launch [🚀]</span>
                </button>
              ) : (
                <button
                  onClick={handleTerminateProject}
                  className="px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-500/30 text-red-400 hover:text-red-300 font-bold rounded text-[10px] transition uppercase flex items-center gap-1 cursor-pointer"
                >
                  <X size={10} />
                  <span>Stop [🛑]</span>
                </button>
              )}

              <button
                onClick={triggerAppBundle}
                className="px-3 py-1.5 bg-[#00f5ff]/10 hover:bg-[#00f5ff]/20 border border-[#00f5ff]/20 text-[#00f5ff] font-bold rounded text-[10px] transition uppercase flex items-center gap-1 cursor-pointer"
              >
                <Layers size={10} />
                <span>Bundle [📦]</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-[#10101c] border border-[#00f5ff]/20 rounded p-0.5 text-xs">
              {['editor', 'canvas', 'diff', 'chat'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setWorkspaceTab(tab as any)}
                  className={`px-3 py-1.5 rounded transition font-semibold capitalize ${
                    workspaceTab === tab ? 'bg-[#00f5ff] text-black shadow-[0_0_10px_rgba(0,245,255,0.25)]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab === 'editor' ? 'Code' : tab === 'canvas' ? 'Spatial' : tab === 'diff' ? 'Diff' : 'Lucy'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab content workspace viewport */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          
          {workspaceTab === 'editor' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                  <Code2 size={14} className="text-[#00f5ff]" />
                  <span>{selectedFile || 'IDE Workspace'}</span>
                </span>
                {selectedFile && (
                  <button
                    onClick={handleRunSwarm}
                    disabled={executionState !== 'idle'}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#00f5ff] to-purple-600 hover:from-white hover:to-white text-black font-bold rounded shadow-[0_0_15px_rgba(0,245,255,0.3)] disabled:opacity-50 transition text-xs"
                  >
                    {executionState !== 'idle' ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
                    <span>Deploy Swarm Workflow</span>
                  </button>
                )}
              </div>

              {fileContent ? (
                <div className="bg-[#0b0b13] border border-white/5 rounded p-4 font-mono text-xs overflow-x-auto whitespace-pre h-[480px]">
                  {fileContent.split('\n').map((line, idx) => (
                    <div key={idx} className="flex hover:bg-white/5 px-2 rounded">
                      <span className="w-8 text-gray-600 select-none text-right pr-3 border-r border-white/5 mr-3">{idx + 1}</span>
                      <span className="text-gray-300">{line || ' '}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] border border-dashed border-[#00f5ff]/10 rounded bg-[#0c0c14]/40">
                  <FileCode size={48} className="text-gray-600 mb-3 animate-pulse" />
                  <span className="text-gray-500 text-sm">Select a local project file to explore code.</span>
                </div>
              )}
            </div>
          )}

          {workspaceTab === 'canvas' && (
            <div className="space-y-6">
              
              {/* Canvas Mode Selection Buttons */}
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                  <Layers size={14} className="text-[#00f5ff]" />
                  <span>Interactive Map Canvas Viewport</span>
                </span>
                
                <div className="flex bg-[#10101c] border border-white/5 rounded p-0.5 text-[10px]">
                  {(['swarm', 'project', 'ecosystem'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setCanvasMode(mode)}
                      className={`px-3 py-1 rounded transition uppercase font-bold ${
                        canvasMode === mode ? 'bg-purple-900/60 text-purple-300' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {mode === 'swarm' ? '🧬 Swarm View' : mode === 'project' ? '📁 Project View' : '🌐 Ecosystem'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spatial View Rendering */}
              <div className="bg-[#0a0a12] border border-[#00f5ff]/20 rounded-lg p-6 relative h-[500px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 gap-0 opacity-5 pointer-events-none">
                  {Array.from({ length: 144 }).map((_, i) => (
                    <div key={i} className="border border-[#00f5ff]" />
                  ))}
                </div>

                {/* 1. Swarm View Mode */}
                {canvasMode === 'swarm' && (
                  <>
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {Object.keys(activeCoaches).filter(k => activeCoaches[k]).map((coach, i, arr) => {
                        const angle = (i / arr.length) * Math.PI - Math.PI/2;
                        const x2 = 50 + Math.cos(angle) * 32;
                        const y2 = 50 + Math.sin(angle) * 32;
                        return (
                          <line 
                            key={coach}
                            x1="50%" y1="20%" x2={`${x2}%`} y2={`${y2}%`} 
                            stroke={telemetryProgress[coach]?.status === 'thinking' ? '#a855f7' : telemetryProgress[coach]?.status === 'complete' ? '#00f5ff' : '#1d1d30'}
                            strokeWidth="1.5"
                            strokeDasharray={telemetryProgress[coach]?.status === 'thinking' ? '5,5' : 'none'}
                            className={telemetryProgress[coach]?.status === 'thinking' ? 'animate-[dash_2s_linear_infinite]' : ''}
                          />
                        );
                      })}
                      <line x1="50%" y1="20%" x2="50%" y2="82%" stroke={telemetryProgress.Emma?.status === 'thinking' ? '#a855f7' : telemetryProgress.Emma?.status === 'complete' ? '#22c55e' : '#1d1d30'} strokeWidth="2" />
                    </svg>

                    {/* Lucy Orchestrator */}
                    <div className="absolute top-[8%] left-[40%] right-[40%] flex flex-col items-center bg-[#121226] border border-[#00f5ff] rounded p-3 text-center shadow-[0_0_15px_rgba(0,245,255,0.15)] z-10">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#00f5ff]">
                        <Cpu size={14} className="animate-pulse" />
                        <span>LUCY PRIME</span>
                      </div>
                      <span className="text-[8px] text-gray-500 mt-0.5">Mission Control</span>
                      {executionState !== 'idle' && (
                        <div className="text-[8px] text-purple-400 mt-1 font-bold animate-pulse uppercase">
                          {executionState}
                        </div>
                      )}
                    </div>

                    {/* Coaches Parallel layout */}
                    <div className="absolute top-[38%] bottom-[28%] left-[8%] right-[8%] grid grid-cols-4 gap-4 items-center">
                      {ALL_COACHES.map((coach) => {
                        if (!activeCoaches[coach.id]) return <div key={coach.id} className="opacity-0 pointer-events-none" />;
                        const progressInfo = telemetryProgress[coach.id];
                        return (
                          <div 
                            key={coach.id} 
                            className={`bg-[#0b0b14] border rounded p-2.5 transition z-10 flex flex-col ${
                              progressInfo?.status === 'complete' ? 'border-[#00f5ff]/40 shadow-[0_0_8px_rgba(0,245,255,0.05)]' :
                              progressInfo?.status === 'thinking' ? 'border-purple-500 animate-pulse' :
                              'border-white/5'
                            }`}
                          >
                            <div className="flex justify-between items-center text-xs font-bold mb-1">
                              <span className="text-gray-200">{coach.emoji} {coach.name}</span>
                              <span className="text-[9px] text-[#00f5ff]">{progressInfo?.progress || 0}%</span>
                            </div>
                            <div className="w-full bg-[#151524] h-1 rounded overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 ${
                                  progressInfo?.status === 'complete' ? 'bg-[#00f5ff]' : 'bg-purple-500'
                                }`}
                                style={{ width: `${progressInfo?.progress || 0}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Emma Validation Node */}
                    <div className={`absolute bottom-[6%] left-[38%] right-[38%] flex flex-col items-center bg-[#121226] border rounded p-3 text-center z-10 transition ${
                      telemetryProgress.Emma?.status === 'complete' ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)]' : 'border-white/10'
                    }`}>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-green-400">
                        <Shield size={14} />
                        <span>EMMA GOVERNANCE</span>
                      </div>
                      <span className="text-[8px] text-gray-500 mt-0.5">Validation Gate</span>
                      <div className="mt-1 flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${
                          telemetryProgress.Emma?.status === 'complete' ? 'bg-green-500' :
                          telemetryProgress.Emma?.status === 'thinking' ? 'bg-purple-500 animate-ping' :
                          'bg-gray-600'
                        }`} />
                        <span className="text-[9px] text-gray-500">
                          {telemetryProgress.Emma?.status || 'idle'}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* 2. Project View Mode */}
                {canvasMode === 'project' && (
                  <div className="flex flex-col items-center justify-center space-y-6 w-full px-12 z-10">
                    <div className="flex items-center gap-4 bg-[#121226] border border-[#00f5ff] rounded-lg p-5 w-full shadow-[0_0_15px_rgba(0,245,255,0.1)]">
                      <Cpu size={32} className="text-[#00f5ff]" />
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-100">{selectedProject.toUpperCase()} WORKSPACE</h3>
                        <p className="text-[10px] text-gray-500 capitalize">{ECOSYSTEM_CATEGORIES[projectsList.find(p => p.id === selectedProject)?.classification || 'AGENT_CORE']}</p>
                      </div>
                    </div>

                    {/* Health Metrics panel */}
                    {healthMetrics ? (
                      <div className="grid grid-cols-4 gap-4 w-full">
                        {[
                          { label: 'Architecture', val: healthMetrics.architectureScore, color: 'text-[#00f5ff] border-[#00f5ff]/20' },
                          { label: 'Documentation', val: healthMetrics.documentationScore, color: 'text-cyan-400 border-cyan-500/20' },
                          { label: 'Security', val: healthMetrics.securityScore, color: 'text-green-400 border-green-500/20' },
                          { label: 'Test Coverage', val: healthMetrics.testCoverageScore, color: 'text-purple-400 border-purple-500/20' }
                        ].map((m, i) => (
                          <div key={i} className={`bg-[#0c0c16] border rounded-lg p-3 text-center ${m.color}`}>
                            <div className="text-[10px] text-gray-500 uppercase">{m.label}</div>
                            <div className="text-xl font-bold mt-1">{m.val}</div>
                            <div className="w-full bg-white/5 h-1 rounded overflow-hidden mt-2">
                              <div className="bg-cyan-500 h-full" style={{ width: `${m.val}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-600 italic">Ecosystem health telemetry offline. Select an online repository.</div>
                    )}
                  </div>
                )}

                {/* 3. Full Ecosystem View Mode */}
                {canvasMode === 'ecosystem' && (
                  <div className="w-full h-full relative p-4 overflow-auto custom-scrollbar flex flex-wrap items-center justify-center gap-4 z-10">
                    {/* Render visual graph representation of the 15 repos */}
                    {projectsList.map((repo) => {
                      const linked = repo.linkedProjects || [];
                      return (
                        <div 
                          key={repo.id} 
                          className={`bg-[#0c0c16] border rounded p-2 text-center w-[130px] transition ${
                            selectedProject === repo.id ? 'border-[#00f5ff] shadow-[0_0_12px_rgba(0,245,255,0.15)]' : 'border-white/5'
                          }`}
                        >
                          <div className={`text-[9px] font-bold truncate ${repo.online ? 'text-white' : 'text-gray-600'}`}>
                            {repo.online ? '🟢' : '⚪'} {repo.name.split(' ')[0]}
                          </div>
                          <div className="text-[7px] text-gray-500 uppercase truncate mt-0.5">{repo.classification}</div>
                          {linked.length > 0 && (
                            <div className="mt-1 flex items-center justify-center gap-1 text-[7px] text-gray-600">
                              <GitFork size={8} />
                              <span>{linked.length} links</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            </div>
          )}

          {workspaceTab === 'diff' && (
            <div className="space-y-6">
              
              {/* Consolidation Consensuses stats */}
              {currentRun ? (
                <div className="grid grid-cols-4 gap-4 bg-[#0b0b13] border border-[#00f5ff]/20 p-4 rounded-lg flex-shrink-0">
                  <div className="border-r border-white/5 pr-2">
                    <div className="text-[9px] text-gray-500 uppercase block mb-0.5">Execution State</div>
                    <span className="text-xs font-bold text-[#00f5ff] uppercase">{currentRun.status}</span>
                  </div>
                  <div className="border-r border-white/5 pr-2">
                    <div className="text-[9px] text-gray-500 uppercase block mb-0.5">Consensus</div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-purple-400">{consensus.confidence}% Conf</span>
                      <span className="text-[10px] text-gray-600">({consensus.agreement}% agree)</span>
                    </div>
                  </div>
                  <div className="border-r border-white/5 pr-2">
                    <div className="text-[9px] text-gray-500 uppercase block mb-0.5">Ecosystem Code Risk</div>
                    <span className={`text-xs font-bold ${consensus.risk > 40 ? 'text-red-400' : 'text-green-400'}`}>
                      {consensus.risk}% Risk
                    </span>
                  </div>
                  <div>
                    <div className="text-[9px] text-gray-500 uppercase block mb-0.5">Emma Gate decision</div>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold ${
                      currentRun.emmaValidation?.decision === 'approved' ? 'bg-green-950 text-green-400 border border-green-500/20' :
                      currentRun.emmaValidation?.decision === 'approved_with_warnings' ? 'bg-yellow-950 text-yellow-400 border border-yellow-500/20' :
                      currentRun.emmaValidation?.decision === 'needs_revision' ? 'bg-orange-950 text-orange-400 border border-orange-500/20' :
                      'bg-red-950 text-red-400 border border-red-500/20'
                    }`}>
                      {currentRun.emmaValidation?.decision.toUpperCase() || 'UNAUDITED'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 italic text-xs text-center p-4">No SwarmRun execution logged.</div>
              )}

              {/* Emma HUD Report */}
              {currentRun?.emmaValidation && (
                <div className={`border rounded-lg p-4 bg-[#0a0a14] ${
                  currentRun.emmaValidation.decision.includes('approved') ? 'border-green-500/20' : 'border-red-500/20'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={16} className={currentRun.emmaValidation.decision.includes('approved') ? 'text-green-400' : 'text-red-400'} />
                    <h3 className="text-xs font-bold text-gray-200 uppercase">Emma Governance Validation Report</h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{currentRun.emmaValidation.explanation}</p>
                  
                  {currentRun.emmaValidation.concerns.length > 0 && (
                    <div className="mb-2">
                      <div className="text-[9px] text-red-400 font-semibold uppercase">Security Concerns:</div>
                      <ul className="list-disc list-inside text-[10px] text-gray-400 mt-1 space-y-0.5">
                        {currentRun.emmaValidation.concerns.map((con, idx) => <li key={idx}>{con}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Ecosystem Coach Report HUD (Cross-Repository Validation) */}
              {currentRun?.ecosystemReport && (
                <div className={`border rounded-lg p-4 bg-[#0a0a14] ${
                  currentRun.ecosystemReport.status === 'safe' ? 'border-green-500/20' :
                  currentRun.ecosystemReport.status === 'warning' ? 'border-yellow-500/20' : 'border-red-500/20'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertOctagon size={16} className={
                      currentRun.ecosystemReport.status === 'safe' ? 'text-green-400' :
                      currentRun.ecosystemReport.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
                    } />
                    <h3 className="text-xs font-bold text-gray-200 uppercase">🌐 Ecosystem Coach Cross-Repo Validation</h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{currentRun.ecosystemReport.recommendation}</p>

                  {currentRun.ecosystemReport.breakingImports.length > 0 && (
                    <div className="mb-2">
                      <div className="text-[9px] text-yellow-400 font-semibold uppercase">Breaking Exports/Imports:</div>
                      <ul className="list-disc list-inside text-[10px] text-gray-400 mt-1 space-y-0.5">
                        {currentRun.ecosystemReport.breakingImports.map((brk, idx) => <li key={idx}>{brk}</li>)}
                      </ul>
                    </div>
                  )}

                  {currentRun.ecosystemReport.affectedRepositories.length > 0 && (
                    <div>
                      <div className="text-[9px] text-orange-400 font-semibold uppercase">Affected Repositories:</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {currentRun.ecosystemReport.affectedRepositories.map((repo, idx) => (
                          <span key={idx} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[9px] text-gray-300">
                            {repo}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Code diff comparison rendering */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Patch Code modification comparison</div>
                {renderDiff()}
              </div>

            </div>
          )}

          {workspaceTab === 'chat' && (
            <div className="flex flex-col h-[480px] bg-[#0b0b13] border border-[#00f5ff]/20 rounded-lg overflow-hidden">
              {/* Chat Status HUD */}
              <div className="bg-[#10101c] border-b border-[#00f5ff]/10 p-3 px-4 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00f5ff] animate-pulse" />
                  <span className="font-semibold text-gray-200">Lucy Prime Session</span>
                </div>
                {processState && (
                  <div className="text-[10px] text-gray-500">
                    Active File: <span className="text-[#00f5ff]">{processState.activeFile || 'None'}</span> • Runs: <span className="text-[#00f5ff]">{processState.historyCount || 0}</span>
                  </div>
                )}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 text-xs font-mono leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[#00f5ff]/10 text-[#00f5ff] border border-[#00f5ff]/20'
                        : 'bg-[#10101c] text-gray-200 border border-white/5'
                    }`}>
                      <div className="text-[9px] uppercase font-bold mb-1 opacity-60">
                        {msg.role === 'user' ? 'Operator' : 'Lucy Prime'}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-3 text-xs bg-[#10101c] border border-white/5 text-gray-400">
                      <div className="text-[9px] uppercase font-bold mb-1 opacity-60">Lucy Prime</div>
                      <div className="flex items-center gap-2">
                        <RefreshCw size={12} className="animate-spin text-[#00f5ff]" />
                        <span>Analysing process memory state...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input */}
              <div className="border-t border-[#00f5ff]/10 p-3 bg-[#0a0a12] flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      sendChatMessage(chatInput);
                    }
                  }}
                  disabled={isChatLoading}
                  placeholder="Ask Lucy about the last simulated run, Emma's report, or style guidelines..."
                  className="flex-1 bg-[#10101c] border border-white/10 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#00f5ff] text-gray-200"
                />
                <button
                  onClick={() => sendChatMessage(chatInput)}
                  disabled={isChatLoading || !chatInput.trim()}
                  className="px-4 py-2 bg-[#00f5ff] hover:bg-white text-black font-bold rounded text-xs transition font-semibold"
                >
                  Transmit
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Telemetry Console logger */}
        <div className="h-[200px] border-t border-[#00f5ff]/20 bg-[#040408] flex flex-col flex-shrink-0">
          <div className="px-4 py-2 border-b border-[#00f5ff]/10 flex justify-between items-center text-xs text-gray-500 bg-[#060610]">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-[#00f5ff]" />
              <span className="uppercase font-semibold tracking-wider">Sovereign OS Command Telemetry</span>
            </div>
            <button onClick={() => setConsoleLogs([])} className="text-[9px] hover:text-[#00f5ff] transition">Clear Logs</button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto font-mono text-[9px] space-y-1 custom-scrollbar text-[#00f5ff]/70">
            {consoleLogs.map((log, idx) => (
              <div key={idx} className="whitespace-pre-wrap">{log}</div>
            ))}
            {consoleLogs.length === 0 && (
              <div className="text-gray-700 italic">Telemetry stream idle. Deploy Swarm Audit to wake up active sensors...</div>
            )}
            <div ref={consoleBottomRef} />
          </div>
        </div>

      </div>

      {/* COLUMN 3: Swarm Config & Chat console */}
      <div className="w-[320px] bg-[#0b0b13] border-l border-[#00f5ff]/20 flex flex-col h-full flex-shrink-0">
        
        {/* Model parameters settings */}
        <div className="p-4 border-b border-[#00f5ff]/20 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">
            <Settings size={14} className="text-[#00f5ff]" />
            <span>AI Swarm Config</span>
          </div>

          <div>
            <label className="text-[9px] text-gray-500 block mb-1">Inference Provider</label>
            <div className="grid grid-cols-2 gap-2 p-0.5 bg-[#10101c] border border-white/5 rounded text-xs">
              {['Ollama', 'Gemini'].map((prov) => (
                <button
                  key={prov}
                  onClick={() => setSelectedProvider(prov)}
                  className={`py-1 rounded transition font-semibold ${
                    selectedProvider === prov ? 'bg-[#00f5ff]/20 text-[#00f5ff] border border-[#00f5ff]/30' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {prov}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[9px] text-gray-500 block mb-1">Inference Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-[#10101c] border border-[#00f5ff]/15 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#00f5ff] text-gray-300"
            >
              {selectedProvider === 'Ollama' ? (
                providers.find(p => p.provider === 'Ollama')?.models.map((m: string) => (
                  <option key={m} value={m}>{m}</option>
                )) || <option value="llama3">llama3</option>
              ) : (
                <>
                  <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                  <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="text-[9px] text-gray-500 block mb-1">Execution Mode</label>
            <div className="grid grid-cols-4 gap-1">
              {(['audit', 'simulation', 'patch', 'apply'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setExecMode(mode)}
                  className={`py-2 text-[9px] font-bold rounded uppercase tracking-wider transition ${
                    execMode === mode ? 'bg-[#00b8ff] text-black shadow-[0_0_10px_rgba(0,184,255,0.25)]' : 'bg-[#10101c] text-gray-500 border border-white/5 hover:text-gray-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Coaches list panel */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Coaching Swarm</span>
            <button 
              onClick={() => {
                const keys = Object.keys(activeCoaches);
                const allChecked = keys.every(k => activeCoaches[k]);
                const next: Record<string, boolean> = {};
                keys.forEach(k => next[k] = !allChecked);
                setActiveCoaches(next);
              }}
              className="text-[9px] text-[#00f5ff] hover:underline"
            >
              Toggle All
            </button>
          </div>

          <div className="space-y-1.5">
            {ALL_COACHES.map((coach) => {
              const isSpecialist = selectedProject ? MASTER_15_REPOS.find(p => p.id === selectedProject)?.autoCoaches.includes(coach.id) : false;
              return (
                <div 
                  key={coach.id} 
                  className={`flex items-start gap-2.5 p-2 rounded border transition ${
                    isSpecialist ? 'bg-purple-950/20 border-purple-500/30' : 'bg-[#10101c] border-white/5'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!activeCoaches[coach.id]}
                    onChange={(e) => setActiveCoaches(prev => ({ ...prev, [coach.id]: e.target.checked }))}
                    className="mt-1 accent-[#00f5ff]"
                  />
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-gray-200">{coach.emoji} {coach.name}</span>
                      {isSpecialist && (
                        <span className="text-[7px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1 rounded uppercase">
                          Auto
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{coach.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lucy prompt input triggers */}
        <div className="p-4 border-t border-[#00f5ff]/20 bg-[#07070c] space-y-3">
          <label className="text-[9px] text-gray-500 block uppercase tracking-widest">Prompt Lucy (Mission Control)</label>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            rows={3}
            placeholder="Type instructions or describe code bugs..."
            className="w-full bg-[#10101c] border border-[#00f5ff]/20 rounded p-2 text-xs focus:outline-none focus:border-[#00f5ff] text-gray-300 resize-none"
          />
          <button
            onClick={handleRunSwarm}
            disabled={executionState !== 'idle' || !selectedFile}
            className="w-full py-2.5 bg-[#00f5ff] hover:bg-white text-black font-bold rounded uppercase tracking-wider text-xs shadow-[0_0_15px_rgba(0,245,255,0.15)] disabled:opacity-50 transition"
          >
            {executionState !== 'idle' ? 'Processing Swarm...' : 'Deploy Swarm'}
          </button>
        </div>

      </div>

      {/* OS Generesis Bundler Overlay Modal */}
      {isBundlerModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-[#0b0b13] border border-[#00f5ff]/30 rounded-lg p-5 shadow-[0_0_30px_rgba(0,245,255,0.15)] flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-[#00f5ff]/20 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="text-[#00f5ff] animate-pulse" size={18} />
                <h3 className="text-sm font-bold tracking-wider text-gray-200">LUCY BUNDLER SYSTEM</h3>
              </div>
              <button onClick={() => setIsBundlerModalOpen(false)} className="text-gray-500 hover:text-white transition">
                <X size={16} />
              </button>
            </div>

            <div className="text-[10px] text-gray-400 mb-2">
              Target Project: <span className="text-[#00f5ff] font-semibold">{selectedProject}</span>
            </div>

            {/* Progress Area */}
            <div className="flex-1 bg-[#040408] border border-white/5 rounded p-3 font-mono text-[9px] text-[#00f5ff]/80 overflow-y-auto space-y-1.5 h-48 custom-scrollbar">
              {bundlerProgress.map((p, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-gray-600 select-none">&gt;&gt;</span>
                  <span>{p}</span>
                </div>
              ))}
              {bundlerStatus === 'building' && (
                <div className="flex items-center gap-2 text-purple-400 mt-2">
                  <RefreshCw size={10} className="animate-spin" />
                  <span>Compiling artifacts and signing releases...</span>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 mt-4 border-t border-white/5 pt-3">
              {bundlerStatus === 'success' && (
                <button
                  onClick={() => {
                    setIsBundlerModalOpen(false);
                    handleLaunchProject();
                  }}
                  className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded text-xs transition uppercase font-semibold cursor-pointer"
                >
                  Launch App [🚀]
                </button>
              )}
              <button
                onClick={() => setIsBundlerModalOpen(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded text-xs transition font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;