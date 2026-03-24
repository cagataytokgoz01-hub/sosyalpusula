import type { ProjectMeta } from '../types/project';

export const saveProjectMeta = (slug: string, data: ProjectMeta) =>
  window.sociometryApi.writeProjectFile(slug, 'project.json', data);
