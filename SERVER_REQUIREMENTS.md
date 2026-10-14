# Server requirements and live health checks

| Service | Requirement | Verification | Start/recovery |
|---|---|---|---|
| Core app/game UI | Required; no server dependency proven by this inventory | Launch app and test core workflows | No server for local-only features. |
| Remote AI/model API | Optional only when enabled | Inspect active provider config and make a real request | Configure HTTPS endpoint and credentials securely. |
| Game/content backend | Unverified | Find the exact configured URL, check its documented health route, then test the feature | Deploy only if active implementation requires it. |

## Health states
Use live probes. HEALTHY requires the actual capability to work, not merely a configured URL. Also support DEGRADED, STOPPED, UNREACHABLE, AUTH REQUIRED, NOT CONFIGURED and UNVERIFIED. Display checked-at time, safe endpoint, last error and next step. Never show green based on source code alone.

## Startup
Local feature: no server. Cloud provider: configure credentials, check internet/provider/model and make a real request. Self-hosted service: start the documented service and test both health endpoint and consuming feature.

## Verification boundary
No remote server or API key is claimed to be configured or reachable. Runtime status remains UNVERIFIED until checked from the running app/device.
