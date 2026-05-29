export interface CoachResult {
  coach: string;
  confidence: number;
  risk: number;
  severity: "low" | "medium" | "high";
  recommendation: string;
  affectedFiles?: string[];
  suggestedPatch?: string | null;
  timestamp: string;
}

export interface EmmaValidation {
  decision: "approved" | "approved_with_warnings" | "needs_revision" | "rejected";
  riskScore: number;
  concerns: string[];
  requiredChanges: string[];
  explanation: string;
}

export interface BreakingChange {
  file: string;
  impactedRepo: string;
}

export interface EcosystemReport {
  status: "safe" | "warning" | "critical";
  breakingChanges: BreakingChange[];
  recommendation: string;
}
