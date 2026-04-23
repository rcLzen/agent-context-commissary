/**
 * GBrain surfacing hook for the Agent Context Commissary
 *
 * Provides a query function that takes a task description and returns
 * relevant past discoveries before starting a new task.
 */

import type { DiscoveryArtifact } from './format.js';
import { queryDiscoveriesViaCli } from '../gbrain-cli.js';

export interface SurfacedDiscovery {
  slug: string;
  title: string;
  snippet: string;
  relevanceScore?: number;
}

/**
 * Query GBrain for relevant prior discoveries based on task description.
 *
 * This function is designed to be called by an orchestrator before starting a new task.
 * It preserves the original injected-query path for runtime integrations.
 *
 * @param taskDescription - Description of the upcoming task
 * @param gbrainQueryFn - The gbrain__query function (passed in to avoid circular dependency)
 * @param limit - Maximum number of results to return
 * @returns Array of relevant discoveries with snippets
 */
export async function surfaceRelevantDiscoveries(
  taskDescription: string,
  gbrainQueryFn: (params: { query: string; expand?: boolean; limit?: number }) => Promise<any[]>,
  limit: number = 5
): Promise<SurfacedDiscovery[]> {
  // Expand query to capture related discoveries
  const results = await gbrainQueryFn({
    query: taskDescription,
    expand: true,
    limit,
  });

  if (!results || results.length === 0) {
    return [];
  }

  return results.map((result: any) => ({
    slug: result.slug || result.id || '',
    title: result.title || 'Untitled Discovery',
    snippet: result.content?.slice(0, 300) || result.snippet || '',
    relevanceScore: result.score,
  }));
}

/**
 * Query GBrain using the local CLI binary instead of an injected runtime tool.
 */
export async function surfaceRelevantDiscoveriesWithCli(
  taskDescription: string,
  options: { gbrainPath?: string; limit?: number } = {}
): Promise<SurfacedDiscovery[]> {
  return queryDiscoveriesViaCli(taskDescription, {
    gbrainPath: options.gbrainPath,
    limit: options.limit,
    expand: true,
  });
}

/**
 * Format surfaced discoveries for display to an agent
 */
export function formatForAgent(discoveries: SurfacedDiscovery[]): string {
  if (discoveries.length === 0) {
    return 'No prior discoveries found for this task context.';
  }

  const lines = [
    '## Prior Discoveries (from Agent Context Commissary)',
    '',
    ...discoveries.map((d, i) => [
      `### ${i + 1}. ${d.title}`,
      `**Slug:** ${d.slug}`,
      '',
      d.snippet,
      '',
      '---',
      '',
    ].join('\n')),
  ];

  return lines.join('');
}

/**
 * Build a query string that captures task context broadly
 */
export function buildQueryFromTask(taskDescription: string, keywords?: string[]): string {
  const base = taskDescription;
  const expanded = keywords?.length
    ? `${base} ${keywords.join(' ')}`
    : base;
  return expanded;
}

/**
 * Check if a discovery is likely relevant to the current task
 * Simple heuristic based on keyword overlap
 */
export function isRelevant(discovery: SurfacedDiscovery, taskKeywords: string[]): boolean {
  const discoveryText = `${discovery.title} ${discovery.snippet}`.toLowerCase();
  const matches = taskKeywords.filter(kw =>
    discoveryText.includes(kw.toLowerCase())
  );
  return matches.length >= 2;
}
