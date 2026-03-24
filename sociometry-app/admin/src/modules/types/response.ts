export interface RawResponse {
  id: string;
  submittedAt: string;
  respondentName: string;
  respondentParticipantId: string | null;
  rawRow: Record<string, string>;
  parsedChoicesByQuestion: Record<string, string[]>;
  parsedRejectsByQuestion: Record<string, string[]>;
  openQuestionAnswer: string;
  isPassive: boolean;
}

export interface CleanResponse {
  id: string;
  submittedAt: string;
  respondentParticipantId: string;
  choicesByQuestion: Record<string, string[]>;
  rejectsByQuestion: Record<string, string[]>;
  openQuestionAnswer: string;
}
