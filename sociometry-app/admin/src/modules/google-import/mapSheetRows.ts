import type { Participant } from '../types/participant';
import type { QuestionsFile } from '../types/question';
import type { RawResponse } from '../types/response';

const tokenize = (value: string): string[] =>
  value
    .split(/[;,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

export const mapSheetRows = (
  rows: Record<string, string>[],
  participants: Participant[],
  questions: QuestionsFile,
): RawResponse[] => {
  return rows.map((row, index) => {
    const respondentName = (row['respondentName'] || row['Ad Soyad'] || '').trim();
    const respondent = participants.find((p) => p.fullName.toLowerCase() === respondentName.toLowerCase()) ?? null;
    const parsedChoicesByQuestion: Record<string, string[]> = {};
    const parsedRejectsByQuestion: Record<string, string[]> = {};

    for (const q of questions.sociometryQuestions) {
      parsedChoicesByQuestion[q.id] = tokenize(row[`${q.dimensionLabel}_choice`] || row[`${q.questionText}_choice`] || '');
      parsedRejectsByQuestion[q.id] = tokenize(row[`${q.dimensionLabel}_reject`] || row[`${q.questionText}_reject`] || '');
    }

    return {
      id: crypto.randomUUID(),
      submittedAt: row['Timestamp'] || row['submittedAt'] || new Date().toISOString(),
      respondentName,
      respondentParticipantId: respondent?.id ?? null,
      rawRow: row,
      parsedChoicesByQuestion,
      parsedRejectsByQuestion,
      openQuestionAnswer: row['openQuestionAnswer'] || row['Açık Uçlu'] || '',
      isPassive: false,
    } satisfies RawResponse;
  });
};
