# Source Code

## Structure

```
src/
├── index.ts              # Main exports
├── cli.ts                # Operational CLI entrypoint
├── example.ts            # Real-path usage examples
├── gbrain-cli.ts         # Thin wrapper around the gbrain binary
└── artifacts/
    ├── format.ts         # Artifact format utilities
    ├── storage.ts        # GBrain storage integration
    ├── surfacing.ts      # Query hook for task start
    ├── write-trigger.ts  # Post-task write prompts
    └── discovery-template.md  # Template artifact
```

## Modules

### `artifacts/format.ts`
Defines the discovery artifact structure with YAML frontmatter + markdown body pattern.

### `gbrain-cli.ts`
Runs the real `gbrain` binary for query and storage operations.

### `artifacts/storage.ts`
GBrain storage utilities backed by the CLI wrapper.

### `artifacts/surfacing.ts`
Query hook that surfaces relevant past discoveries before new tasks. Supports injected runtime queries and the local CLI path.

### `artifacts/write-trigger.ts`
Post-task prompt/checklist template for agents to capture discoveries.

## Integration

The commissary integrates with GBrain in two ways:

1. **Before task**: Run `commissary pretask` or call `surfaceRelevantDiscoveriesWithCli()`
2. **After task**: Run `commissary posttask` to generate an artifact
3. **Storage**: Pass `--store` on `posttask`, call `storeDiscovery()`, or run `commissary store`

## Artifact Format

Each discovery follows this structure:

```yaml
---
slug: unique-identifier-YYYYMMDD
title: Brief descriptive title
date: YYYY-MM-DD
tags: [tag1, tag2]
type: discovery
failed_attempt: "What didn't work"
successful_approach: "What actually worked"
constraint: "The specific condition"
insight: "The non-obvious realization"
task_context: "Original task description"
---
```

Followed by markdown body with detailed sections.
