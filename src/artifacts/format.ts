/**
 * Artifact format utilities for the Agent Context Commissary
 *
 * Defines the discovery artifact structure and parsing helpers.
 */

export interface DiscoveryArtifact {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  type: 'discovery';
  failedAttempt: string;
  successfulApproach: string;
  constraint: string;
  insight: string;
  taskContext: string;
}

export interface RawArtifact {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  type: string;
  failed_attempt: string;
  successful_approach: string;
  constraint: string;
  insight: string;
  task_context: string;
  rawContent: string;
}

/**
 * Convert a raw artifact (from YAML frontmatter parsing) to a clean DiscoveryArtifact
 */
export function parseArtifact(raw: RawArtifact): DiscoveryArtifact {
  return {
    slug: raw.slug,
    title: raw.title,
    date: raw.date,
    tags: raw.tags || [],
    type: 'discovery',
    failedAttempt: raw.failed_attempt || '',
    successfulApproach: raw.successful_approach || '',
    constraint: raw.constraint || '',
    insight: raw.insight || '',
    taskContext: raw.task_context || '',
  };
}

/**
 * Generate a discovery artifact slug from context
 */
export function generateSlug(taskDescription: string): string {
  const sanitized = taskDescription
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 60);
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${sanitized}-${timestamp}`;
}

/**
 * Format an artifact as markdown for storage in GBrain
 */
export function formatArtifactAsMarkdown(artifact: Partial<DiscoveryArtifact>): string {
  const slug = artifact.slug || generateSlug(artifact.taskContext || 'untitled');
  const date = artifact.date || new Date().toISOString().slice(0, 10);
  const title = artifact.title || 'Untitled Discovery';

  const frontmatter = [
    '---',
    `slug: ${slug}`,
    `title: ${title}`,
    `date: ${date}`,
    `tags: [${(artifact.tags || []).join(', ')}]`,
    'type: discovery',
    `failed_attempt: "${artifact.failedAttempt || ''}"`,
    `successful_approach: "${artifact.successfulApproach || ''}"`,
    `constraint: "${artifact.constraint || ''}"`,
    `insight: "${artifact.insight || ''}"`,
    `task_context: "${artifact.taskContext || ''}"`,
    '---',
    '',
    `# Discovery: ${title}`,
    '',
    '## What Failed',
    artifact.failedAttempt || '<!-- Describe the approach that did not work -->',
    '',
    '## What Worked',
    artifact.successfulApproach || '<!-- Describe what actually worked -->',
    '',
    '## Constraint',
    artifact.constraint || '<!-- The specific condition or context this applies to -->',
    '',
    '## Insight',
    artifact.insight || '<!-- The non-obvious realization -->',
    '',
    '## Task Context',
    artifact.taskContext || '<!-- The original task situation -->',
  ].join('\n');

  return frontmatter;
}

interface ParsedFrontmatter {
  frontmatter: Record<string, string | string[]>;
  body: string;
}

/**
 * Parse frontmatter from markdown content
 */
export function parseFrontmatter(content: string): ParsedFrontmatter {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    return { frontmatter: {}, body: content };
  }

  const fmLines = fmMatch[1].split('\n');
  const frontmatter: Record<string, string | string[]> = {};
  let currentKey = '';

  for (const line of fmLines) {
    const keyMatch = line.match(/^(\w+):\s*(.*)$/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      const rawValue: string = keyMatch[2];

      // Handle array syntax: [item1, item2]
      if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
        frontmatter[currentKey] = rawValue.slice(1, -1).split(',').map(s => s.trim());
      } else {
        frontmatter[currentKey] = rawValue;
      }
    }
  }

  return { frontmatter, body: fmMatch[2] };
}
