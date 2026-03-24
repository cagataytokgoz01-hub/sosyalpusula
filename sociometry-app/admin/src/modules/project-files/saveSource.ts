import type { SourceConfig } from '../types/source';

export const saveSource = (slug: string, data: SourceConfig) =>
  window.sociometryApi.writeProjectFile(slug, 'source.json', data);
