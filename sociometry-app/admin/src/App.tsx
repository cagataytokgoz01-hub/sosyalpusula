import { useEffect, useMemo, useState } from 'react';
import type { AnalysisFile } from './modules/types/analysis';
import type { Participant } from './modules/types/participant';
import type { ProjectMeta } from './modules/types/project';
import type { QuestionsFile } from './modules/types/question';
import type { CleanResponse, RawResponse } from './modules/types/response';
import type { SourceConfig } from './modules/types/source';
import ProjectListPage from './pages/ProjectListPage';
import ProjectInfoPage from './pages/ProjectInfoPage';
import ParticipantPage from './pages/ParticipantPage';
import QuestionPage from './pages/QuestionPage';
import SourcePage from './pages/SourcePage';
import ImportedResponsesPage from './pages/ImportedResponsesPage';
import AnalysisPage from './pages/AnalysisPage';
import SociogramPage from './pages/SociogramPage';
import ReportPage from './pages/ReportPage';

export interface ProjectState {
  project: ProjectMeta;
  participants: Participant[];
  questions: QuestionsFile;
  source: SourceConfig;
  rawResponses: RawResponse[];
  cleanResponses: CleanResponse[];
  analysis: AnalysisFile;
}

export type PageKey =
  | 'projects'
  | 'info'
  | 'participants'
  | 'questions'
  | 'source'
  | 'imported'
  | 'analysis'
  | 'sociogram'
  | 'report';

const menu: { key: PageKey; label: string }[] = [
  { key: 'projects', label: 'Projeler' },
  { key: 'info', label: 'Proje Bilgisi' },
  { key: 'participants', label: 'Katılımcılar' },
  { key: 'questions', label: 'Sorular' },
  { key: 'source', label: 'Kaynak' },
  { key: 'imported', label: 'Ham Veriler' },
  { key: 'analysis', label: 'Analiz' },
  { key: 'sociogram', label: 'Sosyogram' },
  { key: 'report', label: 'Rapor' },
];

function App() {
  const [activePage, setActivePage] = useState<PageKey>('projects');
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [current, setCurrent] = useState<ProjectState | null>(null);

  const refreshProjects = async () => setProjects(await window.sociometryApi.listProjects());
  useEffect(() => {
    refreshProjects();
  }, []);

  const canUse = useMemo(() => !!current, [current]);

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2>Sosyometri</h2>
        {menu.map((m) => (
          <button key={m.key} onClick={() => setActivePage(m.key)} disabled={!canUse && m.key !== 'projects'}>
            {m.label}
          </button>
        ))}
      </aside>
      <main className="main-area">
        {activePage === 'projects' && (
          <ProjectListPage
            projects={projects}
            onRefresh={refreshProjects}
            onLoad={async (slug) => {
              const loaded = await window.sociometryApi.loadProject(slug);
              setCurrent(loaded);
              setActivePage('info');
              await window.sociometryApi.setRecentProject(slug);
            }}
          />
        )}
        {current && activePage === 'info' && <ProjectInfoPage current={current} setCurrent={setCurrent} />}
        {current && activePage === 'participants' && <ParticipantPage current={current} setCurrent={setCurrent} />}
        {current && activePage === 'questions' && <QuestionPage current={current} setCurrent={setCurrent} />}
        {current && activePage === 'source' && <SourcePage current={current} setCurrent={setCurrent} />}
        {current && activePage === 'imported' && <ImportedResponsesPage current={current} setCurrent={setCurrent} />}
        {current && activePage === 'analysis' && <AnalysisPage current={current} setCurrent={setCurrent} />}
        {current && activePage === 'sociogram' && <SociogramPage current={current} />}
        {current && activePage === 'report' && <ReportPage current={current} />}
      </main>
    </div>
  );
}

export default App;
