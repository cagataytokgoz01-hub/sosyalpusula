export interface SociometryQuestion {
  id: string;
  dimensionLabel: string;
  questionText: string;
  sortOrder: number;
}

export interface QuestionsFile {
  sociometryQuestions: SociometryQuestion[];
  openQuestionEnabled: boolean;
  openQuestionText: string;
}
