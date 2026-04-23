/**
 * Example usage of the Agent Context Commissary
 *
 * This file demonstrates how to integrate the commissary into agent workflows.
 */

import {
  // Format and parse discovery artifacts
  formatArtifactAsMarkdown,
  parseFrontmatter,
  generateSlug,
  type DiscoveryArtifact,
  // Storage utilities
  prepareForStorage,
  validateArtifact,
  // Surfacing hook
  surfaceRelevantDiscoveries,
  formatForAgent,
  // Write trigger
  generateWritePrompt,
  quickTemplate,
  taskWarrantsDiscovery,
} from './index.js';

// ============================================================
// EXAMPLE 1: Surfacing relevant discoveries before a task
// ============================================================

async function exampleSurfacing() {
  const taskDescription = 'Implement user authentication with OAuth2';

  // This would be called by the orchestrator before starting the task
  // In real usage, gbrain__query would be injected from the OpenClaw runtime
  const mockGbrainQuery = async (params: { query: string; expand?: boolean; limit?: number }) => {
    console.log('Querying GBrain with:', params);
    return [
      {
        slug: 'oauth-scope-order-matters-20260410',
        title: 'OAuth2 scope order affects token validation',
        content: 'When requesting OAuth2 tokens, the scope order in the request must match...',
        score: 0.92,
      },
    ];
  };

  const discoveries = await surfaceRelevantDiscoveries(taskDescription, mockGbrainQuery, 3);

  if (discoveries.length > 0) {
    console.log('\n=== Prior Discoveries ===');
    console.log(formatForAgent(discoveries));
  } else {
    console.log('No prior discoveries found.');
  }
}

// ============================================================
// EXAMPLE 2: Writing a discovery after task completion
// ============================================================

function exampleWriteDiscovery() {
  const artifact: Partial<DiscoveryArtifact> = {
    slug: generateSlug('Implement user authentication with OAuth2'),
    title: 'OAuth2 scope order affects token validation',
    date: new Date().toISOString().slice(0, 10),
    tags: ['oauth2', 'authentication', 'security'],
    failedAttempt:
      'Requesting scopes in alphabetical order caused token validation to fail silently.',
    successfulApproach:
      'Scopes must be requested in the exact order defined by the authorization server.',
    constraint: 'OAuth2 providers vary in scope ordering requirements',
    insight:
      'Silent token validation failures often indicate scope mismatches, not authentication failures.',
    taskContext: 'Implement user authentication with OAuth2',
  };

  const errors = validateArtifact(artifact);
  if (errors.length > 0) {
    console.error('Validation errors:', errors);
    return;
  }

  const markdown = formatArtifactAsMarkdown(artifact);
  console.log('\n=== Formatted Discovery Artifact ===');
  console.log(markdown);

  // Prepare for GBrain storage
  const { slug, content } = prepareForStorage(artifact);
  console.log('\n=== Ready for GBrain ===');
  console.log('Slug:', slug);
  console.log('Content length:', content.length, 'chars');
}

// ============================================================
// EXAMPLE 3: Generating a post-task write prompt
// ============================================================

function exampleWriteTrigger() {
  const prompt = generateWritePrompt({
    taskDescription: 'Build a custom React hook for data fetching',
    outcome: 'success',
    agentNotes: 'Used SWR as the underlying library. Would consider alternatives for simpler use cases.',
    timeSpent: '2 hours',
  });

  console.log('\n=== Post-Task Write Prompt ===');
  console.log(prompt);

  // Check if a simpler task warrants discovery
  const simpleTask = 'Fix a typo in the README';
  const complexTask = 'Debug a race condition in the worker queue';

  console.log('\nTask warrants discovery?');
  console.log(`  "${simpleTask}": ${taskWarrantsDiscovery(simpleTask)}`);
  console.log(`  "${complexTask}": ${taskWarrantsDiscovery(complexTask)}`);
}

// ============================================================
// EXAMPLE 4: Quick template for rapid capture
// ============================================================

function exampleQuickTemplate() {
  const template = quickTemplate('Investigate memory leak in background worker');
  console.log('\n=== Quick Template ===');
  console.log(template);
}

// ============================================================
// EXAMPLE 5: Parsing an existing artifact from GBrain
// ============================================================

function exampleParsing() {
  const existingContent = `---
slug: redis-connection-pool-exhaustion-20260409
title: Redis connection pool exhaustion under load
date: 2026-04-09
tags: [redis, performance, connections]
type: discovery
failed_attempt: "Default pool size (10) exhausted under moderate load"
successful_approach: "Set pool size to 50 and implement connection recycling"
constraint: "AWS ElastiCache has a hard limit of 65k connections per node"
insight: "Connection pool errors manifest as timeout exceptions, not pool errors"
task_context: "Debug slow API responses under production load"
---

# Discovery: Redis connection pool exhaustion under load

## What Failed
Default pool size (10) exhausted under moderate load

## What Worked
Set pool size to 50 and implement connection recycling

## Constraint
AWS ElastiCache has a hard limit of 65k connections per node

## Insight
Connection pool errors manifest as timeout exceptions, not pool errors

## Task Context
Debug slow API responses under production load
`;

  const { frontmatter, body } = parseFrontmatter(existingContent);
  console.log('\n=== Parsed Frontmatter ===');
  console.log(frontmatter);
  console.log('\n=== Body Preview ===');
  console.log(body.slice(0, 200));
}

// Run examples
async function main() {
  console.log('Agent Context Commissary - Example Usage\n');
  console.log('='.repeat(50));

  await exampleSurfacing();
  exampleWriteDiscovery();
  exampleWriteTrigger();
  exampleQuickTemplate();
  exampleParsing();
}

main().catch(console.error);
