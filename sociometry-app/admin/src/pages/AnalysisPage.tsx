import type { ProjectState } from '../App';
import PageHeader from '../components/PageHeader';
import PrimaryButton from '../components/PrimaryButton';
import SectionCard from '../components/SectionCard';

export default function AnalysisPage({ current, setCurrent }: { current: ProjectState; setCurrent: (v: ProjectState) => void }) {
  return (
    <>
      <PageHeader title="Analiz" />
      <SectionCard>
        <PrimaryButton
          onClick={async () => {
            const analysis = await window.sociometryApi.runAnalysis(current.project.slug);
            setCurrent({ ...current, analysis });
          }}
        >
          Analiz Et
        </PrimaryButton>
      </SectionCard>
      <SectionCard>
        <pre>{JSON.stringify(current.analysis, null, 2)}</pre>
      </SectionCard>
    </>
  );
}
