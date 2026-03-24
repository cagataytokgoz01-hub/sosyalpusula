import type { Participant } from '../types/participant';

export const saveParticipants = (slug: string, data: Participant[]) =>
  window.sociometryApi.writeProjectFile(slug, 'participants.json', data);
