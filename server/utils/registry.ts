import { ProjectDefinition } from '../types/ecosystem.js';

export const PROJECT_REGISTRY: Record<string, ProjectDefinition> = {
  'E.M.M.A': {
    id: 'E.M.M.A',
    name: 'E.M.M.A. Kernel',
    classification: 'SOVEREIGN_KERNEL',
    vaultFile: 'E.M.M.A.json',
    autoCoaches: ['Security', 'DevOps', 'Librarian', 'Architect'],
    linkedProjects: ['lucy-core-ai', 'lucy-prime-standalone']
  },
  'lucy-core-ai': {
    id: 'lucy-core-ai',
    name: 'Lucy Core AI',
    classification: 'AGENT_CORE',
    vaultFile: 'lucy-core-ai.json',
    autoCoaches: ['Mechanic', 'Librarian', 'Architect', 'Security'],
    linkedProjects: ['E.M.M.A', 'lucy-core-ai-powered by emma', 'lucy-prime-standalone']
  },
  'lucy-core-ai-powered by emma': {
    id: 'lucy-core-ai-powered by emma',
    name: 'Lucy Powered By Emma',
    classification: 'AGENT_CORE',
    vaultFile: 'lucy-core-ai-powered by emma.json',
    autoCoaches: ['Security', 'Librarian', 'CFO'],
    linkedProjects: ['lucy-core-ai', 'E.M.M.A']
  },
  'lucy-prime-standalone': {
    id: 'lucy-prime-standalone',
    name: 'Lucy Prime Standalone',
    classification: 'DESKTOP_ENGINE',
    vaultFile: 'lucy-prime-standalone.json',
    autoCoaches: ['DevOps', 'UX', 'Architect'],
    linkedProjects: ['lucy-core-ai', 'Lucy-anchor']
  },
  'alpha-matrix-engine-ame': {
    id: 'alpha-matrix-engine-ame',
    name: 'Alpha Matrix Engine',
    classification: 'LIVING_MATRIX',
    vaultFile: 'alpha-matrix-engine-ame.json',
    autoCoaches: ['UX', 'Performance', 'Architect', 'Mechanic'],
    linkedProjects: ['lucy-core-ai', 'lucy-prime-standalone', 'twin city']
  },
  'civil-unrest-framework-hub': {
    id: 'civil-unrest-framework-hub',
    name: 'Civil Unrest Framework',
    classification: 'RAGE_MODDING',
    vaultFile: 'civil-unrest-framework-hub.json',
    autoCoaches: ['CivilUnrest', 'Performance', 'QA', 'Mechanic'],
    linkedProjects: ['twin city', 'lucy-core-ai']
  },
  'twin city': {
    id: 'twin city',
    name: 'Twin City Pipeline',
    classification: 'RAGE_MODDING',
    vaultFile: 'twin-city.json',
    autoCoaches: ['CivilUnrest', 'Architect', 'Performance'],
    linkedProjects: ['civil-unrest-framework-hub', 'alpha-matrix-engine-ame']
  },
  'mcp-maps-3d': {
    id: 'mcp-maps-3d',
    name: 'MCP Maps 3D Server',
    classification: 'SPATIAL_MCP',
    vaultFile: 'mcp-maps-3d.json',
    autoCoaches: ['Swarm', 'Architect', 'Performance'],
    linkedProjects: ['lucy-core-ai', 'twin city']
  },
  'planetary-co-evolution': {
    id: 'planetary-co-evolution',
    name: 'Planetary Co-Evolution',
    classification: 'SWARM_SIMULATION',
    vaultFile: 'planetary-co-evolution.json',
    autoCoaches: ['Planetary', 'Swarm', 'Librarian'],
    linkedProjects: ['lucy-core-ai', 'E.M.M.A']
  },
  'lucy-code-builder': {
    id: 'lucy-code-builder',
    name: 'Lucy Code Builder',
    classification: 'DESKTOP_ENGINE',
    vaultFile: 'lucy-code-builder.json',
    autoCoaches: ['DevOps', 'Architect', 'Performance'],
    linkedProjects: ['lucy-core-ai']
  },
  'lucys fivem modding': {
    id: 'lucys fivem modding',
    name: 'Lucy FiveM Modding',
    classification: 'RAGE_MODDING',
    vaultFile: 'lucys-fivem-modding.json',
    autoCoaches: ['CivilUnrest', 'Performance', 'Mechanic'],
    linkedProjects: ['twin city', 'civil-unrest-framework-hub']
  }
};
