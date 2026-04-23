#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

import { formatArtifactAsMarkdown, generateSlug } from './artifacts/format.js';
import { putArtifactViaCli, putMarkdownViaCli, queryDiscoveriesViaCli, DEFAULT_GBRAIN_PATH, GBrainCliError } from './gbrain-cli.js';

type CommandName = 'pretask' | 'posttask' | 'store' | 'help';

interface ParsedArgs {
  command: CommandName;
  flags: Record<string, string | boolean>;
  positionals: string[];
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));

  switch (parsed.command) {
    case 'pretask':
      await handlePretask(parsed.flags);
      return;
    case 'posttask':
      await handlePosttask(parsed.flags);
      return;
    case 'store':
      await handleStore(parsed.flags);
      return;
    case 'help':
    default:
      printHelp();
  }
}

async function handlePretask(flags: Record<string, string | boolean>): Promise<void> {
  const task = readRequiredString(flags, 'task');
  const limit = readNumber(flags, 'limit', 5);
  const gbrainPath = readString(flags, 'gbrain-path') || DEFAULT_GBRAIN_PATH;

  try {
    const discoveries = await queryDiscoveriesViaCli(task, { gbrainPath, limit, expand: true });

    if (discoveries.length === 0) {
      console.log('No prior discoveries found.');
      return;
    }

    console.log('Prior discoveries:');
    for (const [index, discovery] of discoveries.entries()) {
      console.log(`${index + 1}. ${discovery.title}`);
      console.log(`   slug: ${discovery.slug || '(missing slug)'}`);
      if (typeof discovery.relevanceScore === 'number') {
        console.log(`   score: ${discovery.relevanceScore.toFixed(3)}`);
      }
      if (discovery.snippet) {
        console.log(`   snippet: ${discovery.snippet.replace(/\s+/g, ' ').trim()}`);
      }
    }
  } catch (error) {
    if (error instanceof GBrainCliError) {
      console.error('GBrain query failed; continuing without prior discoveries.');
      console.error(error.stderr || error.message);
      return;
    }
    throw error;
  }
}

async function handlePosttask(flags: Record<string, string | boolean>): Promise<void> {
  const task = readRequiredString(flags, 'task');
  const artifact = {
    slug: readString(flags, 'slug') || generateSlug(task),
    title: readRequiredString(flags, 'title'),
    date: readString(flags, 'date') || new Date().toISOString().slice(0, 10),
    tags: readTags(flags),
    type: 'discovery' as const,
    failedAttempt: readString(flags, 'failed-attempt') || '',
    successfulApproach: readString(flags, 'successful-approach') || '',
    constraint: readString(flags, 'constraint') || '',
    insight: readString(flags, 'insight') || '',
    taskContext: task,
  };

  const markdown = formatArtifactAsMarkdown(artifact);
  console.log(markdown);

  if (flags.store !== true) {
    return;
  }

  const gbrainPath = readString(flags, 'gbrain-path') || DEFAULT_GBRAIN_PATH;
  const stored = await putArtifactViaCli(artifact, { gbrainPath });
  console.error(`Stored discovery in GBrain as ${stored.slug}`);
}

async function handleStore(flags: Record<string, string | boolean>): Promise<void> {
  const filePath = readRequiredString(flags, 'file');
  const gbrainPath = readString(flags, 'gbrain-path') || DEFAULT_GBRAIN_PATH;
  const slug = readString(flags, 'slug');
  const content = await readFile(filePath, 'utf8');
  const stored = await putMarkdownViaCli(content, { gbrainPath, slug });

  console.log(`Stored ${filePath} as ${stored.slug}`);
}

function parseArgs(argv: string[]): ParsedArgs {
  const [rawCommand, ...rest] = argv;
  const command = normalizeCommand(rawCommand);
  const flags: Record<string, string | boolean> = {};
  const positionals: string[] = [];

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }

    const trimmed = token.slice(2);
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex >= 0) {
      const key = trimmed.slice(0, equalIndex);
      const value = trimmed.slice(equalIndex + 1);
      flags[key] = value;
      continue;
    }

    const nextToken = rest[index + 1];
    if (!nextToken || nextToken.startsWith('--')) {
      flags[trimmed] = true;
      continue;
    }

    flags[trimmed] = nextToken;
    index += 1;
  }

  return { command, flags, positionals };
}

function normalizeCommand(command: string | undefined): CommandName {
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    return 'help';
  }

  if (command === 'pretask' || command === 'posttask' || command === 'store') {
    return command;
  }

  throw new Error(`Unknown command: ${command}`);
}

function readRequiredString(flags: Record<string, string | boolean>, name: string): string {
  const value = readString(flags, name);
  if (!value) {
    throw new Error(`Missing required flag --${name}`);
  }
  return value;
}

function readString(flags: Record<string, string | boolean>, name: string): string | undefined {
  const value = flags[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readNumber(flags: Record<string, string | boolean>, name: string, fallback: number): number {
  const raw = readString(flags, name);
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    throw new Error(`Flag --${name} must be a positive integer`);
  }
  return parsed;
}

function readTags(flags: Record<string, string | boolean>): string[] {
  const raw = readString(flags, 'tags');
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);
}

function printHelp(): void {
  console.log(`Agent Context Commissary CLI

Usage:
  commissary pretask --task "Investigate OAuth callback failures" [--limit 5] [--gbrain-path <path>]
  commissary posttask --task "Investigate OAuth callback failures" --title "Scope order breaks callback validation" [--tags oauth,auth] [--failed-attempt "..."] [--successful-approach "..."] [--constraint "..."] [--insight "..."] [--store] [--gbrain-path <path>]
  commissary store --file ./discovery.md [--slug my-discovery] [--gbrain-path <path>]

Defaults:
  gbrain path: ${DEFAULT_GBRAIN_PATH}
  env override: AGENT_CONTEXT_COMMISSARY_GBRAIN_PATH`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
