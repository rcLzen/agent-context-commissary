/**
 * GBrain storage integration for the Agent Context Commissary.
 *
 * Persists discovery artifacts through the local gbrain CLI wrapper.
 */

import { formatArtifactAsMarkdown, generateSlug } from './format.js';
import { putArtifactViaCli } from '../gbrain-cli.js';

export interface StorageResult {
  success: boolean;
  slug: string;
  error?: string;
}

export interface StoreDiscoveryOptions {
  gbrainPath?: string;
}

/**
 * Store a discovery artifact in GBrain
 */
export async function storeDiscovery(
  artifact: Partial<import('./format.js').DiscoveryArtifact>,
  options: StoreDiscoveryOptions = {}
): Promise<StorageResult> {
  try {
    await putArtifactViaCli(artifact, options);

    return {
      success: true,
      slug: artifact.slug || generateDefaultSlug(),
    };
  } catch (error) {
    return {
      success: false,
      slug: artifact.slug || '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Prepare artifact content for GBrain storage
 * Returns the formatted markdown ready for gbrain__put_page
 */
export function prepareForStorage(artifact: Partial<import('./format.js').DiscoveryArtifact>): { slug: string; content: string } {
  const slug = artifact.slug || generateDefaultSlug();
  const content = formatArtifactAsMarkdown({ ...artifact, slug });
  return { slug, content };
}

function generateDefaultSlug(): string {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `discovery-${timestamp}`;
}

/**
 * Validate that an artifact has the minimum required fields
 */
export function validateArtifact(artifact: Partial<import('./format.js').DiscoveryArtifact>): string[] {
  const errors: string[] = [];

  if (!artifact.taskContext && !artifact.insight) {
    errors.push('Either taskContext or insight is required');
  }

  if (!artifact.slug && !artifact.taskContext) {
    errors.push('Either slug or taskContext (to generate slug) is required');
  }

  return errors;
}
