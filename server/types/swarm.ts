import { CoachResult, EmmaValidation, EcosystemReport } from './agents.js';

export type ExecutionState =
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

export interface SwarmRun {
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

export interface SwarmTask {
  project: string;
  file: string;
  content: string;
  prompt: string;
  provider: string;
  model: string;
  mode: "audit" | "simulation" | "patch" | "apply";
  coaches: string[];
}

export interface ProcessMemory {
  activeFile: string;
  currentTask: string;
  lastEmmaDecision: string;
  lastEcosystemStatus: string;
  lastRunId: string;
  historyCount: number;
}
