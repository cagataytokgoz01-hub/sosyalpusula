import type { RawResponse } from '../types/response';

export const saveRawResponses = (slug: string, data: RawResponse[]) =>
  window.sociometryApi.writeProjectFile(slug, 'raw-responses.json', data);
