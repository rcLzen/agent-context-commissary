/**
 * Agent Context Commissary
 *
 * Internal knowledge layer for agent teams.
 * Captures hard-won discoveries so agents do not repeat the same failures.
 */

export {
  type DiscoveryArtifact,
  type RawArtifact,
  parseArtifact,
  generateSlug,
  formatArtifactAsMarkdown,
  parseFrontmatter,
} from './artifacts/format.js';

export {
  type StorageResult,
  storeDiscovery,
  prepareForStorage,
  validateArtifact,
} from './artifacts/storage.js';

export {
  type SurfacedDiscovery,
  surfaceRelevantDiscoveries,
  formatForAgent,
  buildQueryFromTask,
  isRelevant,
} from './artifacts/surfacing.js';

export {
  type WritePromptConfig,
  generateWritePrompt,
  quickTemplate,
  taskWarrantsDiscovery,
} from './artifacts/write-trigger.js';
