import type { AnalysisFile } from '../types/analysis';

export const saveAnalysis = (slug: string, data: AnalysisFile) =>
  window.sociometryApi.writeProjectFile(slug, 'analysis.json', data);
