import type { CleanResponse, RawResponse } from '../types/response';

export const normalizeResponses = (raw: RawResponse[]): CleanResponse[] => {
  return raw
    .filter((r) => !r.isPassive && !!r.respondentParticipantId)
    .map((r) => {
      const choicesByQuestion: Record<string, string[]> = {};
      const rejectsByQuestion: Record<string, string[]> = {};
      for (const [qid, list] of Object.entries(r.parsedChoicesByQuestion)) {
        choicesByQuestion[qid] = [...new Set(list)].slice(0, 3);
      }
      for (const [qid, list] of Object.entries(r.parsedRejectsByQuestion)) {
        rejectsByQuestion[qid] = [...new Set(list)].slice(0, 3);
      }
      return {
        id: r.id,
        submittedAt: r.submittedAt,
        respondentParticipantId: r.respondentParticipantId!,
        choicesByQuestion,
        rejectsByQuestion,
        openQuestionAnswer: r.openQuestionAnswer,
      };
    });
};
