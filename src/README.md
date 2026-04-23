# Source Code

## Structure

```
src/
├── index.ts              # Main exports
├── example.ts            # Usage examples
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

### `artifacts/storage.ts`
GBrain storage utilities using `gbrain__put_page` for persistence.

### `artifacts/surfacing.ts`
Query hook that surfaces relevant past discoveries before new tasks using `gbrain__query`.

### `artifacts/write-trigger.ts`
Post-task prompt/checklist template for agents to capture discoveries.

## Integration

The commissary integrates with OpenClaw's GBrain system:

1. **Before task**: Call `surfaceRelevantDiscoveries()` to query GBrain for relevant prior discoveries
2. **After task**: Call `generateWritePrompt()` to prompt discovery capture, then use `prepareForStorage()` to format for GBrain
3. **Storage**: The orchestrator calls `gbrain__put_page` with the prepared content

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
