# 🧠 Lucy Anchor & Ecosystem Core — Sovereign Engineering Platform v1.0

> 🌐 **Fenton Lab official website:** [fentonlabai.pages.dev](https://fentonlabai.pages.dev/)  
> Planned primary domain: `fentonlabai.com` (custom-domain connection pending).

Welcome to the **Lucy Ecosystem**, a modular platform separating platform infrastructure (**Ecosystem Core**) from the visual command interface (**Lucy Anchor**).

## 🪐 Ecosystem Architecture

The ecosystem operates on a decoupled command plane:

```text
       +---------------------------------------------+
       |             Lucy Ecosystem Core             |
       |  (Boot Manager, State Bus, Swarm Runtime)   |
       +----------------------+----------------------+
                              |
                     WebSocket / REST API
                              |
       +----------------------+----------------------+
       |            Lucy Anchor Command              |
       |             (UI Cockpit Console)            |
       +---------------------------------------------+
```

### Subsystems Map
- **`ecosystem/kernel`**: Control plane interfaces, unified `stateBus` state machine, and sequential boot manager.
- **`ecosystem/registry`**: Centralized JSON database classifying active ecosystem repositories.
- **`ecosystem/services`**: WebSocket event hub, tcp health monitor, and process bundle manager.
- **`ecosystem/swarm`**: Parallel AI agent council orchestrator logging runs to `ledger/`.
- **`ecosystem/memory`**: Unified folders for credentials vault, backups, ledger, runs, and bundles.

---

## 🚀 Key Features

> [!IMPORTANT]
> **Decoupled Architecture**: Lucy Anchor is no longer a monolith. It serves strictly as the user interface (command cockpit) that communicates with the underlying Ecosystem Core via WebSocket events and API proxies.

- **Unified State Bus & Event Streams**: Centralized `stateBus` publishes `EcosystemEvent` notifications via WebSockets on port 3001, dynamically synchronizing UI views on client changes.
- **Sequential Boot Sequence**: Sequential `EcosystemBoot` verifies directories, loads project registries, and spins up monitors on startup.
- **First-Class Bundle Definitions**: Application bundles are registered as structured runtimes (`stopped`, `starting`, `running`, `failed`) and tracked with live health scoring.
- **Detailed Swarm Ledger Playback**: Completed agent workflows are saved as separate `SwarmLedgerEntry` logs in JSON format in the ledger directory.

---

## 🛠️ Installation & Launch

### 1. Prerequisites
- **Node.js** (v18+)
- **Ollama** (Local LLM server running on `http://localhost:11434`)
- **Gemini API** (`GEMINI_API_KEY` defined in a `.env` file)

### 2. Single-Click Launch (`start.bat`)
We provide a root-level launcher script that automatically installs dependencies for all sub-projects and boots them in parallel.
- Simply run `start.bat` at the root of the workspace directory.
- This will boot:
  - **Lucy Anchor frontend:** http://localhost:3000
  - **Lucy Anchor backend & WebSocket Server:** http://localhost:3001
  - **Lucy Code Builder:** http://localhost:3002

---

## 📁 Workspace Schema Layout
```text
D:\lucy ecosystem
│
├── start.bat                 # Parallel launcher script
│
├── ecosystem                 # Modular core platform
│   ├── kernel/               # Control plane, stateBus, boot manager
│   ├── registry/             # registry.json project classification database
│   ├── services/             # WebSocket hub, bundle manager, health monitor
│   ├── swarm/                # Swarm orchestrator, agent reducers, validations
│   └── memory/               # Backups, runs, ledger, sessions, bundles
│
├── Lucy-anchor               # Command cockpit UI client
│   ├── client/               # React Vite UI app
│   └── server/               # Proxy router forwarding to ecosystem
│
└── lucy-code-builder         # Connected editor console (Port 3002)
```

---
*Signed by Lucy Prime, Mission Control.*
