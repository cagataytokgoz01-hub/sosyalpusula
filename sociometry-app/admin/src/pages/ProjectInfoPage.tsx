import PageHeader from '../components/PageHeader';
import PrimaryButton from '../components/PrimaryButton';
import SectionCard from '../components/SectionCard';
import TextInput from '../components/TextInput';
import type { ProjectState } from '../App';

export default function ProjectInfoPage({ current, setCurrent }: { current: ProjectState; setCurrent: (v: ProjectState) => void }) {
  return (
    <>
      <PageHeader title="Proje Bilgisi" />
      <SectionCard>
        <label>Proje Adı</label>
        <TextInput
          value={current.project.title}
          onChange={(e) => setCurrent({ ...current, project: { ...current.project, title: e.target.value } })}
        />
        <label>Kurum</label>
        <TextInput
          value={current.project.organizationName}
          onChange={(e) => setCurrent({ ...current, project: { ...current.project, organizationName: e.target.value } })}
        />
        <div className="row">
          <PrimaryButton
            onClick={async () => {
              const next = { ...current.project, updatedAt: new Date().toISOString() };
              await window.sociometryApi.writeProjectFile(current.project.slug, 'project.json', next);
              setCurrent({ ...current, project: next });
            }}
          >
            Kaydet
          </PrimaryButton>
        </div>
      </SectionCard>
    </>
  );
}
