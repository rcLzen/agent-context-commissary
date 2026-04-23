/**
 * Post-task write discipline trigger for the Agent Context Commissary
 *
 * Provides a template and checklist for agents to write discovery artifacts
 * after completing non-trivial tasks.
 */

import { generateSlug } from './format.js';

export interface WritePromptConfig {
  taskDescription: string;
  outcome: 'success' | 'failure' | 'partial';
  agentNotes?: string;
  timeSpent?: string;
}

/**
 * Generate a write prompt/checklist for the agent after task completion
 */
export function generateWritePrompt(config: WritePromptConfig): string {
  const { taskDescription, outcome, agentNotes, timeSpent } = config;

  const outcomeLabel = {
    success: 'completed successfully',
    failure: 'failed or had issues',
    partial: 'completed with reservations',
  }[outcome];

  return `
## Post-Task Discovery Write

**Task:** ${taskDescription}
**Outcome:** ${outcomeLabel}
${timeSpent ? `**Time spent:** ${timeSpent}` : ''}

---

### Discovery Artifact Checklist

Before closing this task, consider whether a discovery artifact should be captured.

**Did you encounter any of the following?**

- [ ] An approach that didn't work as expected
- [ ] A constraint that wasn't obvious upfront
- [ ] A non-obvious insight about what actually worked
- [ ] A failure mode worth documenting for future agents
- [ ] A confirmed approach that should be shared

### If yes, fill this in:

\`\`\`
---
slug: ${generateSlug(taskDescription)}
title: [Brief descriptive title]
date: ${new Date().toISOString().slice(0, 10)}
tags: []
type: discovery
failed_attempt: "[What didn't work]"
successful_approach: "[What actually worked]"
constraint: "[The specific condition]"
insight: "[The non-obvious realization]"
task_context: "${taskDescription}"
---

# Discovery: [Title]

## What Failed
[Description]

## What Worked
[Description]

## Constraint
[Condition]

## Insight
[Realization]
\`\`\`

${agentNotes ? `### Agent Notes\n${agentNotes}\n` : ''}
---
*This prompt is part of the Agent Context Commissary write discipline system.*
`;
}

/**
 * Quick template for rapid discovery capture
 */
export function quickTemplate(taskDescription: string): string {
  return `---
slug: ${generateSlug(taskDescription)}
title: 
date: ${new Date().toISOString().slice(0, 10)}
tags: []
type: discovery
failed_attempt: ""
successful_approach: ""
constraint: ""
insight: ""
task_context: "${taskDescription}"
---

# Discovery: 

## What Failed

## What Worked

## Constraint

## Insight
`;
}

/**
 * Check if a task likely generated worthwile discoveries
 * Simple heuristic based on common patterns
 */
export function taskWarrantsDiscovery(taskDescription: string): boolean {
  const lowValuePatterns = [
    'simple fix',
    'typo',
    'format',
    'comment',
    'readme',
    'cleanup',
  ];

  const highValuePatterns = [
    'implement',
    'build',
    'create',
    'design',
    'architect',
    'refactor',
    'debug',
    'investigate',
    'explore',
    'evaluate',
    'compare',
    'integrate',
    'setup',
    'configure',
  ];

  const desc = taskDescription.toLowerCase();

  // If it matches a low-value pattern, likely not worth a discovery
  if (lowValuePatterns.some(p => desc.includes(p))) {
    return false;
  }

  // If it matches a high-value pattern, likely worth a discovery
  if (highValuePatterns.some(p => desc.includes(p))) {
    return true;
  }

  // Default: ask for discovery
  return true;
}
