import type { CleanResponse } from '../types/response';

export const saveCleanResponses = (slug: string, data: CleanResponse[]) =>
  window.sociometryApi.writeProjectFile(slug, 'clean-responses.json', data);
