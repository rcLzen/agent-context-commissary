# Agent Context Commissary

An internal knowledge layer for agent teams.

## Purpose

Capture hard-won discoveries so agents do not repeat the same failures:
- confirmed approaches
- failure modes
- discovered constraints
- non-obvious insights

## Status

Operational CLI wiring for real task-start/task-finish flows using the local `gbrain` binary.

## What Is Wired

- `pretask`: query real GBrain for relevant discoveries before starting work
- `posttask`: generate a discovery artifact and optionally store it in GBrain
- `store`: push an existing markdown artifact into GBrain
- library helpers for CLI-backed query/store calls without removing the existing exports

## GBrain Binary

Default path:

```bash
/home/rclzen/.openclaw/workspace/skills/gbrain/bin/gbrain
```

Override with:

```bash
export AGENT_CONTEXT_COMMISSARY_GBRAIN_PATH=/custom/path/to/gbrain
```

Or pass `--gbrain-path` to each command.

## Task Flow

### 1. Surface context before the task

```bash
npm run commissary -- pretask \
  --task "Investigate OAuth callback failures" \
  --limit 5 \
  --gbrain-path /home/rclzen/.openclaw/workspace/skills/gbrain/bin/gbrain
```

Behavior:
- queries real GBrain via `gbrain call query ...`
- prints matching discoveries if any exist
- degrades gracefully if GBrain is unavailable so the task can still start

### 2. Generate a discovery at task finish

```bash
npm run commissary -- posttask \
  --task "Investigate OAuth callback failures" \
  --title "Scope order breaks callback validation" \
  --tags oauth,auth,callbacks \
  --failed-attempt "Alphabetized scopes caused silent callback rejection." \
  --successful-approach "Request scopes in provider-defined order." \
  --constraint "Provider compares requested scopes positionally." \
  --insight "Silent callback failures can be scope-shape failures, not token failures."
```

That prints the markdown artifact to stdout.

### 3. Optionally store the artifact immediately

```bash
npm run commissary -- posttask \
  --task "Investigate OAuth callback failures" \
  --title "Scope order breaks callback validation" \
  --insight "Silent callback failures can be scope-shape failures, not token failures." \
  --store \
  --gbrain-path /home/rclzen/.openclaw/workspace/skills/gbrain/bin/gbrain
```

### 4. Store an existing artifact file

```bash
npm run commissary -- store \
  --file ./discovery.md \
  --gbrain-path /home/rclzen/.openclaw/workspace/skills/gbrain/bin/gbrain
```

## Library Usage

CLI-backed helpers are exported from [`src/index.ts`](./src/index.ts):

- `queryDiscoveriesViaCli(taskDescription, options)`
- `putArtifactViaCli(artifact, options)`
- `putMarkdownViaCli(markdown, options)`
- `surfaceRelevantDiscoveriesWithCli(taskDescription, options)`

The formatting, parsing, and prompt helpers remain available for library consumers.

## Verification

Build:

```bash
npm run build
```

Real command-path demo:

```bash
npm run commissary -- pretask \
  --task "Agent Context Commissary operational wiring" \
  --limit 3 \
  --gbrain-path /home/rclzen/.openclaw/workspace/skills/gbrain/bin/gbrain
```
