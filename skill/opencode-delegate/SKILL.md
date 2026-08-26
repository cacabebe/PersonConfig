---
name: opencode-delegate
description: 用本地 opencode CLI（opencode-go/deepseek-v4-flash，--variant max）代替内置子 agent 执行委派任务
type: prompt
whenToUse: 在准备调用 Agent / AgentSwarm 子 agent 工具委派任务时，或用户主动要求使用 opencode 时
---

当需要把任务委派给子 agent，或用户明确要求"用 opencode"时，不要调用 Agent / AgentSwarm 工具，改用 Bash 运行本地 opencode CLI。

基本命令：

```bash
opencode run "<任务描述>" -m opencode-go/deepseek-v4-flash --variant max
```

规则：

- 模型固定为 `opencode-go/deepseek-v4-flash`，并带 `--variant max`（最高推理强度），除非用户另外指定。
- 任务描述必须完整自包含：目标、涉及文件的绝对路径、必要的已知上下文、期望产出。opencode 是独立进程，看不到当前对话，把任务当成交给一位刚进门的同事来 briefing。
- 用 `--dir <目录>` 指定工作目录（默认当前目录）；Windows 路径注意加引号。
- 需要 opencode 修改文件时加 `--auto`（自动批准权限，否则非交互模式下无法写文件）；只读分析类任务可不加。
- 耗时任务用 Bash 后台运行（run_in_background=true），完成通知到达后再读结果，不要阻塞等待。
- 多个并行子任务时，用多条独立的 Bash 调用（或后台任务）代替 AgentSwarm，每条一个任务。
- 如需续接上一次 opencode 会话，用 `-c` 或 `-s <session-id>`。
- 完成后由你把 opencode 输出的结论总结给用户——用户看不到它的原始输出，就像子 agent 一样。
- 若通过手动调用本 skill 并在 ARGUMENTS 中传入了任务描述，直接将其作为 `opencode run` 的提示词执行。
