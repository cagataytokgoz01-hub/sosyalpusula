export interface Edge {
  from: string;
  to: string;
  relationType: 'choice' | 'reject' | 'mixed';
  weight: number;
  mutual: boolean;
}

export interface QuestionAnalysis {
  questionId: string;
  choiceMatrix: Record<string, Record<string, number>>;
  rejectMatrix: Record<string, Record<string, number>>;
  edges: Edge[];
}

export interface ParticipantMetrics {
  participantId: string;
  receivedChoices: number;
  receivedRejects: number;
  sentChoices: number;
  sentRejects: number;
  mutualChoices: number;
  mutualRejects: number;
  mixedRelations: number;
  inDegree: number;
  outDegree: number;
}

export interface AnalysisFile {
  generatedAt: string;
  questionAnalyses: QuestionAnalysis[];
  combinedAnalysis: {
    edges: Edge[];
  };
  participantMetrics: ParticipantMetrics[];
}
