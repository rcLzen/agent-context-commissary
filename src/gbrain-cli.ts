import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { type DiscoveryArtifact, formatArtifactAsMarkdown, parseFrontmatter } from './artifacts/format.js';
import { type SurfacedDiscovery } from './artifacts/surfacing.js';

const execFileAsync = promisify(execFile);

export const DEFAULT_GBRAIN_PATH =
  process.env.AGENT_CONTEXT_COMMISSARY_GBRAIN_PATH ||
  '/home/rclzen/.openclaw/workspace/skills/gbrain/bin/gbrain';

export interface GBrainCommandResult {
  stdout: string;
  stderr: string;
}

export interface GBrainQueryOptions {
  gbrainPath?: string;
  limit?: number;
  expand?: boolean;
  detail?: 'low' | 'medium' | 'high';
}

export interface GBrainStoreOptions {
  gbrainPath?: string;
}

export interface GBrainQueryResult {
  slug?: string;
  id?: string;
  title?: string;
  content?: string;
  snippet?: string;
  score?: number;
  similarity?: number;
}

export class GBrainCliError extends Error {
  constructor(
    message: string,
    readonly command: string,
    readonly exitCode: number | null,
    readonly stdout: string,
    readonly stderr: string
  ) {
    super(message);
    this.name = 'GBrainCliError';
  }
}

export async function runGbrainCommand(
  args: string[],
  options: { gbrainPath?: string } = {}
): Promise<GBrainCommandResult> {
  const gbrainPath = options.gbrainPath || DEFAULT_GBRAIN_PATH;

  try {
    const { stdout, stderr } = await execFileAsync(gbrainPath, args, {
      maxBuffer: 10 * 1024 * 1024,
    });

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    };
  } catch (error: unknown) {
    const command = [gbrainPath, ...args].join(' ');
    const details = error as NodeJS.ErrnoException & {
      code?: number | string;
      stdout?: string;
      stderr?: string;
    };

    throw new GBrainCliError(
      details.stderr?.trim() || details.message || 'gbrain command failed',
      command,
      typeof details.code === 'number' ? details.code : null,
      details.stdout?.trim() || '',
      details.stderr?.trim() || '',
    );
  }
}

export async function queryDiscoveriesViaCli(
  taskDescription: string,
  options: GBrainQueryOptions = {}
): Promise<SurfacedDiscovery[]> {
  const payload = {
    query: taskDescription,
    limit: options.limit ?? 5,
    expand: options.expand ?? true,
    detail: options.detail ?? 'medium',
  };

  const { stdout } = await runGbrainCommand(
    ['call', 'query', JSON.stringify(payload)],
    options
  );

  const parsed = tryParseJson(stdout);
  const results = extractQueryResults(parsed);

  return results.map(result => ({
    slug: result.slug || result.id || '',
    title: result.title || 'Untitled Discovery',
    snippet: normalizeSnippet(result),
    relevanceScore: typeof result.score === 'number' ? result.score : result.similarity,
  }));
}

export async function putArtifactViaCli(
  artifact: Partial<DiscoveryArtifact>,
  options: GBrainStoreOptions = {}
): Promise<{ slug: string; content: string }> {
  const content = formatArtifactAsMarkdown(artifact);
  const { frontmatter } = parseFrontmatter(content);
  const slugValue = frontmatter.slug;
  const slug = typeof slugValue === 'string' && slugValue.length > 0
    ? slugValue
    : artifact.slug || 'discovery';

  await runGbrainCommand(
    ['put', slug, '--content', content],
    options
  );

  return { slug, content };
}

export async function putMarkdownViaCli(
  content: string,
  options: GBrainStoreOptions & { slug?: string } = {}
): Promise<{ slug: string; content: string }> {
  const { frontmatter } = parseFrontmatter(content);
  const slugValue = options.slug || frontmatter.slug;
  const slug = typeof slugValue === 'string' && slugValue.length > 0
    ? slugValue
    : '';

  if (!slug) {
    throw new Error('Markdown content must include a frontmatter slug or pass --slug.');
  }

  await runGbrainCommand(
    ['put', slug, '--content', content],
    options
  );

  return { slug, content };
}

function tryParseJson(stdout: string): unknown {
  try {
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

function extractQueryResults(parsed: unknown): GBrainQueryResult[] {
  if (Array.isArray(parsed)) {
    return parsed.filter(isRecordLike);
  }

  if (isRecordLike(parsed)) {
    const candidates = ['results', 'hits', 'matches', 'items', 'data'];

    for (const key of candidates) {
      const value = parsed[key];
      if (Array.isArray(value)) {
        return value.filter(isRecordLike);
      }
    }
  }

  return [];
}

function normalizeSnippet(result: GBrainQueryResult): string {
  const value = result.snippet || result.content || '';
  return value.slice(0, 300);
}

function isRecordLike(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null;
}
