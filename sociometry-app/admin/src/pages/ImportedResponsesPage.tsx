import type { ProjectState } from '../App';
import PageHeader from '../components/PageHeader';
import PrimaryButton from '../components/PrimaryButton';
import SectionCard from '../components/SectionCard';

export default function ImportedResponsesPage({ current, setCurrent }: { current: ProjectState; setCurrent: (v: ProjectState) => void }) {
  return (
    <>
      <PageHeader title="İçe Aktarılan Ham Veriler" />
      <SectionCard>
        {current.rawResponses.map((r) => (
          <div className="response-item" key={r.id}>
            <div>
              <strong>{r.respondentName}</strong> - {r.submittedAt}
            </div>
            <div>Seçimler: {JSON.stringify(r.parsedChoicesByQuestion)}</div>
            <div>Durum: {r.isPassive ? 'Pasif' : 'Aktif'}</div>
            <div>Reddetmeler: {JSON.stringify(r.parsedRejectsByQuestion)}</div>
            <div>Açık uçlu: {r.openQuestionAnswer}</div>
            <PrimaryButton
              onClick={async () => {
                const updated = await window.sociometryApi.setPassive(current.project.slug, r.id, !r.isPassive);
                setCurrent({ ...current, rawResponses: updated.raw, cleanResponses: updated.clean });
              }}
            >
              {r.isPassive ? 'Aktif Yap' : 'Pasifleştir'}
            </PrimaryButton>
          </div>
        ))}
      </SectionCard>
    </>
  );
}
