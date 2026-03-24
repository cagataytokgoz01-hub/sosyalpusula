import { useState } from 'react';
import type { ProjectState } from '../App';
import { extractSheetId } from '../modules/google-import/extractSheetId';
import PageHeader from '../components/PageHeader';
import PrimaryButton from '../components/PrimaryButton';
import SectionCard from '../components/SectionCard';
import TextInput from '../components/TextInput';

export default function SourcePage({ current, setCurrent }: { current: ProjectState; setCurrent: (v: ProjectState) => void }) {
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const s = current.source;

  const saveSource = async (source = current.source) => {
    await window.sociometryApi.writeProjectFile(current.project.slug, 'source.json', source);
    setCurrent({ ...current, source });
  };

  return (
    <>
      <PageHeader title="Google Kaynağı" subtitle="Google Form URL + Google Sheet URL/ID" />
      <SectionCard>
        <label>Google Form URL</label>
        <TextInput
          value={s.googleFormUrl}
          onChange={(e) => setCurrent({ ...current, source: { ...s, googleFormUrl: e.target.value } })}
        />

        <label>Google Sheet URL/ID</label>
        <TextInput
          value={s.googleSheetUrl}
          onChange={(e) => {
            const value = e.target.value;
            setCurrent({ ...current, source: { ...s, googleSheetUrl: value, googleSheetId: extractSheetId(value) } });
          }}
        />

        <label>Sheet ID</label>
        <TextInput
          value={s.googleSheetId}
          onChange={(e) => setCurrent({ ...current, source: { ...s, googleSheetId: e.target.value } })}
        />

        <div className="row">
          <PrimaryButton
            onClick={async () => {
              await saveSource();
              setInfo('Kaynak bilgileri kaydedildi.');
              setError('');
            }}
          >
            Kaydet
          </PrimaryButton>

          <PrimaryButton
            onClick={async () => {
              setInfo('');
              setError('');

              await saveSource();
              const imported = await window.sociometryApi.importSheet(current.project.slug);

              if (imported.error) {
                setError(imported.error);
                return;
              }

              setCurrent({
                ...current,
                rawResponses: imported.raw ?? [],
                cleanResponses: imported.clean ?? [],
                source: imported.source ?? current.source,
              });
              setInfo('Veri çekme tamamlandı.');
            }}
          >
            Veri Çek
          </PrimaryButton>
        </div>

        {error && <p className="error-text">{error}</p>}
        {!error && info && <p>{info}</p>}
        <p>Son veri çekme: {current.source.lastImportedAt || '-'}</p>
      </SectionCard>
    </>
  );
}
