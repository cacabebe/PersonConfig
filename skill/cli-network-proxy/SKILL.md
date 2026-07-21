---
name: cli-network-proxy
description: "Use automatically whenever Codex is about to run command-line tools that access the external network, including git clone/fetch/pull, curl/wget, npm/npx/pnpm/yarn installs, node scripts using fetch/HTTP, GitHub raw downloads, package registries, or API calls from shell commands. Before running the network command, attach the local proxy at 127.0.0.1:10808 temporarily for that command; prefer scoped CLI/env proxy settings and do not change Windows system/browser proxy settings."
---

# CLI Network Proxy

Use the local proxy for shell commands that access the public internet.

Proxy endpoints:

- HTTP/HTTPS proxy: `http://127.0.0.1:10808`
- SOCKS fallback: `socks5h://127.0.0.1:10808`
- Local bypass: `localhost,127.0.0.1,::1`

## Default workflow

1. For any external network command, first add a command-scoped proxy.
2. Keep the proxy scoped to the shell command unless the user explicitly asks for persistent config.
3. Do not modify Windows system proxy, browser proxy, Chrome flags, or global user env vars unless explicitly requested.
4. If a direct network command fails with timeout, reset, DNS, TLS, or registry errors, retry once through the proxy.

## PowerShell wrapper

For most commands, prepend temporary env vars in the same PowerShell command:

```powershell
$env:HTTP_PROXY='http://127.0.0.1:10808'; $env:HTTPS_PROXY='http://127.0.0.1:10808'; $env:ALL_PROXY='socks5h://127.0.0.1:10808'; $env:NO_PROXY='localhost,127.0.0.1,::1'; <command>
```

For Node runtime network calls, also enable Node's environment proxy support:

```powershell
$env:HTTP_PROXY='http://127.0.0.1:10808'; $env:HTTPS_PROXY='http://127.0.0.1:10808'; $env:NO_PROXY='localhost,127.0.0.1,::1'; $env:NODE_OPTIONS=(($env:NODE_OPTIONS + ' --use-env-proxy').Trim()); node <script-or--eval>
```

## Tool-specific forms

- Git, scoped to one command:
  - `git -c http.proxy=http://127.0.0.1:10808 -c https.proxy=http://127.0.0.1:10808 clone <url>`
- curl:
  - `curl.exe --proxy http://127.0.0.1:10808 -L <url>`
- npm/npx/pnpm:
  - Prefer existing npm proxy config when present.
  - For one command, still set `HTTP_PROXY` and `HTTPS_PROXY` in the command environment.
- Node fetch/HTTP:
  - Set `HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY`, and `NODE_OPTIONS=--use-env-proxy` in the same command.

## Quick checks

- Check proxy port:
  - `Test-NetConnection 127.0.0.1 -Port 10808 -InformationLevel Detailed`
- Check GitHub through proxy:
  - `curl.exe --proxy http://127.0.0.1:10808 -I --connect-timeout 10 --max-time 25 https://github.com/`

## Persistent config policy

Persistent config is okay only when the user asks for it. Preferred persistent settings:

```powershell
git config --global http.proxy http://127.0.0.1:10808
git config --global https.proxy http://127.0.0.1:10808
npm config set proxy http://127.0.0.1:10808 --location=user
npm config set https-proxy http://127.0.0.1:10808 --location=user
```

Avoid persistent `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, `NODE_OPTIONS`, or Windows system proxy unless the user explicitly requests broader impact.
