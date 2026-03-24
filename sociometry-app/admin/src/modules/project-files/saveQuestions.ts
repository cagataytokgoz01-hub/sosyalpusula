import type { QuestionsFile } from '../types/question';

export const saveQuestions = (slug: string, data: QuestionsFile) =>
  window.sociometryApi.writeProjectFile(slug, 'questions.json', data);
