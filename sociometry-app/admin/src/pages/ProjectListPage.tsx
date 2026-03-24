import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import PrimaryButton from '../components/PrimaryButton';
import SectionCard from '../components/SectionCard';
import TextInput from '../components/TextInput';
import type { ProjectMeta } from '../modules/types/project';

export default function ProjectListPage({
  projects,
  onRefresh,
  onLoad,
}: {
  projects: ProjectMeta[];
  onRefresh: () => Promise<void>;
  onLoad: (slug: string) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    window.sociometryApi.getRecentProjects().then(setRecent);
  }, [projects.length]);

  return (
    <>
      <PageHeader title="Projeler" subtitle="Yerel proje klasörleri" />
      <SectionCard>
        <div className="row">
          <TextInput placeholder="Proje adı" value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextInput placeholder="Kurum adı" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} />
          <PrimaryButton
            onClick={async () => {
              if (!title.trim()) return;
              await window.sociometryApi.createProject(title.trim(), organizationName.trim());
              setTitle('');
              setOrganizationName('');
              await onRefresh();
            }}
          >
            Yeni Proje
          </PrimaryButton>
        </div>
      </SectionCard>
      <SectionCard>
        <h3>Projeler</h3>
        {projects.map((p) => (
          <div key={p.id} className="list-row">
            <span>{p.title}</span>
            <PrimaryButton onClick={() => onLoad(p.slug)}>Proje Aç</PrimaryButton>
          </div>
        ))}
      </SectionCard>
      <SectionCard>
        <h3>Son Açılanlar</h3>
        {recent.map((slug) => (
          <div key={slug} className="list-row">
            <span>{slug}</span>
            <PrimaryButton onClick={() => onLoad(slug)}>Proje Aç</PrimaryButton>
          </div>
        ))}
      </SectionCard>
    </>
  );
}
