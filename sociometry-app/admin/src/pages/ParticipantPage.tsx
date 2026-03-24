import { useState } from 'react';
import type { ProjectState } from '../App';
import PageHeader from '../components/PageHeader';
import PrimaryButton from '../components/PrimaryButton';
import SectionCard from '../components/SectionCard';
import SelectBox from '../components/SelectBox';
import TextInput from '../components/TextInput';

export default function ParticipantPage({ current, setCurrent }: { current: ProjectState; setCurrent: (v: ProjectState) => void }) {
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'kiz' | 'erkek'>('kiz');
  const [editingId, setEditingId] = useState<string>('');
  const [error, setError] = useState('');

  const save = async (participants = current.participants) => {
    await window.sociometryApi.writeProjectFile(current.project.slug, 'participants.json', participants);
    setCurrent({ ...current, participants });
  };

  const ensureUniqueName = (name: string, excludeId = '') =>
    !current.participants.some((p) => p.id !== excludeId && p.fullName.toLocaleLowerCase('tr-TR') === name.toLocaleLowerCase('tr-TR'));

  return (
    <>
      <PageHeader title="Katılımcılar" />
      <SectionCard>
        <div className="row">
          <TextInput value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ad Soyad" />
          <SelectBox value={gender} onChange={(e) => setGender(e.target.value as 'kiz' | 'erkek')}>
            <option value="kiz">kiz</option>
            <option value="erkek">erkek</option>
          </SelectBox>
          <PrimaryButton
            onClick={async () => {
              const name = fullName.trim();
              if (!name) return;
              if (!ensureUniqueName(name, editingId)) {
                setError('Aynı isim tekrar edemez.');
                return;
              }

              const now = new Date().toISOString();
              if (editingId) {
                await save(
                  current.participants.map((p) =>
                    p.id === editingId ? { ...p, fullName: name, gender, updatedAt: now } : p,
                  ),
                );
                setEditingId('');
              } else {
                await save([
                  ...current.participants,
                  { id: crypto.randomUUID(), fullName: name, gender, createdAt: now, updatedAt: now },
                ]);
              }
              setError('');
              setFullName('');
              setGender('kiz');
            }}
          >
            {editingId ? 'Güncelle' : 'Ekle'}
          </PrimaryButton>
        </div>
        {error && <p className="error-text">{error}</p>}
      </SectionCard>

      <SectionCard>
        {current.participants.map((p) => (
          <div key={p.id} className="list-row">
            <span>
              {p.fullName} ({p.gender})
            </span>
            <div className="row">
              <PrimaryButton
                onClick={() => {
                  setEditingId(p.id);
                  setFullName(p.fullName);
                  setGender(p.gender);
                  setError('');
                }}
              >
                Düzenle
              </PrimaryButton>
              <PrimaryButton onClick={() => save(current.participants.filter((x) => x.id !== p.id))}>Sil</PrimaryButton>
            </div>
          </div>
        ))}
      </SectionCard>
    </>
  );
}
