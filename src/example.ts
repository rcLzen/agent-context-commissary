/**
 * Example usage of the Agent Context Commissary
 *
 * This file demonstrates the real operational flow using the local gbrain CLI.
 */

import {
  DEFAULT_GBRAIN_PATH,
  formatArtifactAsMarkdown,
  parseFrontmatter,
  queryDiscoveriesViaCli,
  putArtifactViaCli,
} from './index.js';

async function examplePretask(): Promise<void> {
  const taskDescription = 'Implement user authentication with OAuth2';
  console.log(`Using gbrain binary: ${DEFAULT_GBRAIN_PATH}`);

  try {
    const discoveries = await queryDiscoveriesViaCli(taskDescription, {
      gbrainPath: DEFAULT_GBRAIN_PATH,
      limit: 3,
    });

    console.log('\n=== Pretask Discoveries ===');
    if (discoveries.length === 0) {
      console.log('No prior discoveries found.');
      return;
    }

    for (const discovery of discoveries) {
      console.log(`- ${discovery.title} (${discovery.slug})`);
    }
  } catch (error) {
    console.log('\n=== Pretask Discoveries ===');
    console.log(`GBrain query failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function examplePosttask(store: boolean): Promise<void> {
  const artifact = {
    slug: 'oauth2-scope-order-affects-token-validation-20260423',
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

  const markdown = formatArtifactAsMarkdown(artifact);
  console.log('\n=== Posttask Artifact ===');
  console.log(markdown);

  if (!store) {
    return;
  }

  try {
    const stored = await putArtifactViaCli(artifact, { gbrainPath: DEFAULT_GBRAIN_PATH });
    console.log(`Stored in GBrain as ${stored.slug}`);
  } catch (error) {
    console.log(`GBrain store failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

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
  console.log('Agent Context Commissary - Operational Example\n');
  console.log('='.repeat(50));

  await examplePretask();
  await examplePosttask(false);
  exampleParsing();
}

main().catch(console.error);
