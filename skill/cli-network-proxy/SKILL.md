---
name: cli-network-proxy
description: "当 Codex 准备运行可能访问网络的命令行工具时自动使用，包括 git clone/fetch/pull、curl/wget、npm/npx/pnpm/yarn 安装、使用 fetch/HTTP 的 Node.js 脚本、软件包注册表或通过 shell 发起的 API 调用。先判断目标地址：localhost、私有地址和内网地址直接连接；公网地址通过 127.0.0.1:10808 本地代理访问。代理设置仅作用于当前命令，不修改 Windows 系统或浏览器代理。"
---

# CLI 网络代理

访问公网的 shell 命令使用本地代理，访问内网的命令直接连接。

代理端点：

- HTTP/HTTPS 代理：`http://127.0.0.1:10808`
- SOCKS 备用代理：`socks5h://127.0.0.1:10808`
- 直连目标：
  - 回环地址、链路本地地址、私有地址、运营商级 NAT 地址和 IPv6 唯一本地地址
  - `.local`、`.lan`、`.internal`、`.intranet`、`.corp`、`.home.arpa` 等内网主机名

## 默认流程

1. 选择代理设置前，先识别命令的网络目标。
2. 目标为内网地址时直接运行命令，不要先尝试代理。
3. 目标为公网地址时，仅为当前命令设置代理。
4. 命令可能访问多个目标时，只要其中有目标不在直连集合内，就启用代理；同时保留
   `NO_PROXY`，使符合条件的请求仍然直连。
5. 除非用户明确要求持久化配置，否则仅在当前 shell 命令内设置代理。
6. 除非用户明确要求，否则不要修改 Windows 系统代理、浏览器代理、Chrome 参数或用户级全局环境变量。
7. 如果代理命令因 `127.0.0.1:10808` 不可用而失败，检查一次端口并报告结果。不要静默改用持久化配置或修改系统设置。

## PowerShell 包装脚本

随附的包装脚本接收一个可执行文件及其参数。脚本直接调用可执行文件，不解析命令字符串：

```powershell
& ./scripts/with-proxy.ps1 git clone https://github.com/owner/repo
& ./scripts/with-proxy.ps1 -Node node script.mjs
& ./scripts/with-proxy.ps1 curl.exe -L http://service.internal/
```

包装脚本以保守方式识别 URL 主机、私有 IP 字面量和常见内网域名后缀。

需要代理时，在同一个 PowerShell 命令内临时设置环境变量：

```powershell
$env:HTTP_PROXY='http://127.0.0.1:10808'; $env:HTTPS_PROXY='http://127.0.0.1:10808'; $env:ALL_PROXY='socks5h://127.0.0.1:10808'; $env:NO_PROXY='localhost,127.0.0.1,::1,.local,.lan,.internal,.intranet,.corp,.home.arpa,10.0.0.0/8,100.64.0.0/10,169.254.0.0/16,172.16.0.0/12,192.168.0.0/16,fc00::/7,fe80::/10'; <command>
```

Node.js 运行时发起网络请求时，同时启用 Node.js 的环境变量代理支持：

```powershell
$env:HTTP_PROXY='http://127.0.0.1:10808'; $env:HTTPS_PROXY='http://127.0.0.1:10808'; $env:NO_PROXY='localhost,127.0.0.1,::1,.local,.lan,.internal,.intranet,.corp,.home.arpa,10.0.0.0/8,100.64.0.0/10,169.254.0.0/16,172.16.0.0/12,192.168.0.0/16,fc00::/7,fe80::/10'; $env:NODE_OPTIONS=(($env:NODE_OPTIONS + ' --use-env-proxy').Trim()); node <script-or--eval>
```

## 各工具用法

- Git（仅作用于当前命令）：
  - `git -c http.proxy=http://127.0.0.1:10808 -c https.proxy=http://127.0.0.1:10808 clone <url>`
  - 远程地址位于内网时，不设置 `http.proxy` 和 `https.proxy`，直接运行 Git。
- curl：
  - `curl.exe --proxy http://127.0.0.1:10808 -L <url>`
  - URL 位于内网时省略 `--proxy`；如果继承的环境变量或用户配置可能启用代理，则使用 `--noproxy '*'`。
- npm/npx/pnpm：
  - 已存在 npm 代理配置时优先沿用。
  - 单次命令仍在命令环境中设置 `HTTP_PROXY` 和 `HTTPS_PROXY`。
- Node.js fetch/HTTP：
  - 在同一命令内设置 `HTTP_PROXY`、`HTTPS_PROXY`、`NO_PROXY` 和 `NODE_OPTIONS=--use-env-proxy`。

## 快速检查

- 检查代理端口：
  - `Test-NetConnection 127.0.0.1 -Port 10808 -InformationLevel Detailed`
- 通过代理检查 GitHub：
  - `curl.exe --proxy http://127.0.0.1:10808 -I --connect-timeout 10 --max-time 25 https://github.com/`

## 持久化配置策略

仅在用户明确要求时使用持久化配置。优先使用以下设置：

```powershell
git config --global http.proxy http://127.0.0.1:10808
git config --global https.proxy http://127.0.0.1:10808
npm config set proxy http://127.0.0.1:10808 --location=user
npm config set https-proxy http://127.0.0.1:10808 --location=user
```

用户明确要求持久化代理配置时，同时为上述直连目标配置工具的绕过列表。提醒用户：
不同工具对 `NO_PROXY` CIDR 的支持程度不同，可能仍需使用工具原生的代理绕过设置。

除非用户明确要求扩大影响范围，否则不要持久化设置 `HTTP_PROXY`、`HTTPS_PROXY`、
`ALL_PROXY`、`NODE_OPTIONS` 或 Windows 系统代理。
