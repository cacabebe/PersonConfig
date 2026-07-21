---
name: conventional-commits
description: Draft, review, and refine Chinese git commit messages using the Conventional Commits format. Use when the user asks for a commit message, commit log, git commit text, changelog-oriented commit summary, staged-change commit title/body, or mentions Conventional Commits, conventional commit, 约定式提交, 中文提交日志, 提交日志, or commit message standards.
---

# Conventional Commits

## Overview

Write Simplified Chinese commit messages that follow Conventional Commits while matching the actual change. Prefer a concise single-line message for small changes and a structured title/body/footer for larger or breaking changes.

## Language Rules

- Write all human-readable commit content in Simplified Chinese by default, including the subject, body, and breaking-change explanation.
- Keep Conventional Commits syntax tokens in English: type, optional scope, `!`, and footer keys such as `BREAKING CHANGE`, `Refs`, and `Closes`.
- Do not copy an English commit-message style from repository history unless the user explicitly requests English or another language.
- Keep code identifiers, API names, configuration keys, commands, and product names in their original form when translating them would reduce clarity.

## Workflow

1. Identify the change source.
   - If staged changes are available and the user asks for a commit message, inspect `git status --short`, `git diff --staged --stat`, and enough of `git diff --staged` to understand behavior.
   - If the user supplies a diff or description, use that instead of probing the repository.
   - If there are no staged changes and no description, ask whether to use unstaged changes or wait for more context.

2. Choose the narrowest accurate type.
   - `feat`: user-visible feature or capability
   - `fix`: bug fix
   - `docs`: documentation-only change
   - `style`: formatting or style-only code change with no behavior change
   - `refactor`: code restructuring with no feature or bug-fix behavior change
   - `perf`: performance improvement
   - `test`: tests only or test infrastructure
   - `build`: build system, dependencies, packaging, generated lockfiles
   - `ci`: CI/CD configuration or workflow changes
   - `chore`: maintenance that does not fit the above
   - `revert`: revert of a prior commit

3. Add an optional scope when it improves scanning.
   - Use a short noun such as `api`, `auth`, `ui`, `deps`, `docs`, `tests`, or a package/module name.
   - Keep the scope lowercase unless the local project convention differs.

4. Write the subject.
   - Format: `<type>[optional scope][!]: <description>`
   - Write the description in concise Simplified Chinese and state the concrete action or outcome.
   - Keep it specific and under about 72 characters when possible.
   - Do not end the subject with Chinese or English punctuation.
   - Avoid vague subjects like `更新代码`, `修复问题`, or `其他修改`.

5. Include a body only when it adds useful context.
   - Separate the subject and body with a blank line.
   - Explain what changed and why in Simplified Chinese; avoid restating the diff mechanically.
   - Wrap body lines around 72 characters when practical.

6. Include footers when needed.
   - Breaking changes: add `!` before the colon and include a footer:
     `BREAKING CHANGE: <migration or compatibility impact>`.
   - Issue references: use the local convention, such as `Refs: #123` or `Closes: #123`.

## Output Format

For a simple change, output only the commit message:

```text
fix(auth): 拒绝已过期的刷新令牌
```

For a larger change, use a body:

```text
feat(api): 新增项目归档接口

允许客户端归档停用项目，同时保留项目历史记录。
接口会记录操作人和归档时间，供审计视图使用。

Refs: #248
```

For a breaking change:

```text
feat(config)!: 要求显式配置数据库地址

移除生产环境启动流程中的 SQLite 回退数据库。

BREAKING CHANGE: 部署环境必须在启动前设置 DATABASE_URL。
```

## Review Checklist

Before finalizing, verify:
- The type matches the semantic effect of the change.
- The scope is helpful and not overly broad.
- The subject describes the outcome, not the implementation chore.
- Breaking changes are explicit in both marker and footer when present.
- The subject, body, and footer explanations are in Simplified Chinese unless the user explicitly requests another language.
