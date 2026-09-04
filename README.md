<img width="5658" height="1600" alt="image" src="https://github.com/user-attachments/assets/d30fb971-4b39-490c-ac08-0d688e8f9ada" />

# NetGoat — Self-Hostable Cloudflare Alternative (Reverse Proxy Engine)

## 💖 Special Thanks

A huge thank you to **Cozy Critters Society** and **Snow** for being our first donors! Their support means the world to us. Check out their nonprofit here: [Cozy Critters Society](https://opencollective.com/cozy-critters-society).

> *“The team at Cozy Critters Society is happy to support the development of NetGoat in hopes that we can help them succeed in making their self-hostable Cloudflare alternative.”*

---


## TLDR: Work In Progess
Hii! Its ducky the project is Work In Progress and will be publicly working beta at December

**NetGoat** is a **blazing-fast, self-hostable reverse proxy and traffic manager** designed for developers, homelabbers, and teams who want **Cloudflare-like features** without the cost.


## Frontend
This is the frontend of the Netgoat Services, its built in next.js 
just setup the .env and install dependencies then run build (You would need to setup the others too FYI)

## Control-plane MVP

This dashboard is the control-plane UI. Saves go to Mongo so stream-server can build the ConfigSnapshot agents already poll. This is not Cloudflare parity; VSA, deep fingerprint, and AI classifier UI are out of scope.

**Manage in the existing dashboard**

| Surface | Path | Mongo fields stream-server reads |
| --- | --- | --- |
| Create / list domains | `/dashboard/[team]/new`, `/dashboard/[team]/domains` | `domain`, `target_url`, `auto_ssl` |
| Routes / upstreams | `/dashboard/[team]/[domain]/reverse-proxies` | `target_url`, `proxy_configs.upstream_servers` |
| Origin | domain Settings | `target_url` |
| Certs | `/dashboard/[team]/[domain]/ssl` | `certificate_pem`, `private_key_pem`, `ssl_enabled`, `auto_ssl` |
| Policy | domain Settings cache/bandwidth | `route_policy` → stream-server emits agent `policy` |
| WAF | `/dashboard/[team]/[domain]/waf` Rule Sets | `waf_rules` → agent `WAFRules` |

Performance and Danger Zone widgets are labeled as not-yet-streamed. They do not persist.

## Connect an agent

Point the Go agent at stream-server. Local `routes:` can stay empty; the agent picks up dashboard saves from the snapshot.

```yaml
api:
  url: http://127.0.0.1:8787   # stream-server; also API_STREAM_URL
  key: ""                      # same value as stream-server API_KEY
routes: {}
```

Set `API_STREAM_KEY` (or `API_KEY`) in the agent environment so the key is not committed. stream-server authenticates `/domains` with `X-API-Key` or `Authorization: Bearer`.

stream-server now emits `policy` on `/domains` from Mongo `route_policy`. If the control plane or stream-server dies, the agent keeps serving last-known-good config from its local recovery snapshot (`./database/config-snapshot.json`). That recovery is agent-side; this repo does not reimplement it.