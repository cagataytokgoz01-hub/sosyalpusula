import type { CleanResponse } from '../types/response';

export const buildRejectMatrix = (responses: CleanResponse[], questionId: string) => {
  const matrix: Record<string, Record<string, number>> = {};
  for (const r of responses) {
    matrix[r.respondentParticipantId] ??= {};
    for (const target of r.rejectsByQuestion[questionId] ?? []) {
      if (target === r.respondentParticipantId) continue;
      matrix[r.respondentParticipantId][target] = (matrix[r.respondentParticipantId][target] || 0) + 1;
    }
  }
  return matrix;
};
