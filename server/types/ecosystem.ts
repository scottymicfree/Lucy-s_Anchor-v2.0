export interface ProjectDefinition {
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
  online?: boolean;
}

export interface RepositoryHealth {
  architectureScore: number;
  documentationScore: number;
  securityScore: number;
  testCoverageScore: number;
}

export interface LedgerLog {
  timestamp?: string;
  event: string;
  runId?: string;
  project?: string;
  file?: string;
  mode?: string;
  status?: string;
  message?: string;
  concerns?: string[];
  ecoStatus?: string;
  coachResultsCount?: number;
  emmaDecision?: string;
}

export interface FileMetadata {
  path: string;
  size: number;
  mtime: number;
  imports: string[];
  exports: string[];
  hash: string;
}

export interface ScannedFile {
  path: string;
  size: number;
  imports: string[];
  exports: string[];
}
