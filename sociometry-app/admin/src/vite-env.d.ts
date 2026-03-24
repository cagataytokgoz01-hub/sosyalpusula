/// <reference types="vite/client" />

import type { AnalysisFile } from './modules/types/analysis';
import type { Participant } from './modules/types/participant';
import type { ProjectMeta } from './modules/types/project';
import type { QuestionsFile } from './modules/types/question';
import type { CleanResponse, RawResponse } from './modules/types/response';
import type { SourceConfig } from './modules/types/source';

declare global {
  interface Window {
    sociometryApi: {
      listProjects: () => Promise<ProjectMeta[]>;
      createProject: (title: string, organizationName: string) => Promise<ProjectMeta>;
      loadProject: (slug: string) => Promise<{
        project: ProjectMeta;
        participants: Participant[];
        questions: QuestionsFile;
        source: SourceConfig;
        rawResponses: RawResponse[];
        cleanResponses: CleanResponse[];
        analysis: AnalysisFile;
      }>;
      readProjectFile: <T>(slug: string, fileName: string) => Promise<T>;
      writeProjectFile: <T>(slug: string, fileName: string, payload: T) => Promise<void>;
      fetchSheetData: (sheetId: string) => Promise<{ rows: Record<string, string>[]; error?: string }>;
      setPassive: (slug: string, responseId: string, isPassive: boolean) => Promise<{ raw: RawResponse[]; clean: CleanResponse[] }>;
      importSheet: (slug: string) => Promise<{ raw?: RawResponse[]; clean?: CleanResponse[]; source?: SourceConfig; error?: string }>;
      runAnalysis: (slug: string) => Promise<AnalysisFile>;
      exportReport: (slug: string, kind: 'pdf' | 'word' | 'excel') => Promise<string>;
      getRecentProjects: () => Promise<string[]>;
      setRecentProject: (slug: string) => Promise<void>;
    };
  }
}
