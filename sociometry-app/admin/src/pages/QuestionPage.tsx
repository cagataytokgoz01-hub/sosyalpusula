import { useState } from 'react';
import type { ProjectState } from '../App';
import PageHeader from '../components/PageHeader';
import PrimaryButton from '../components/PrimaryButton';
import SectionCard from '../components/SectionCard';
import TextInput from '../components/TextInput';

export default function QuestionPage({ current, setCurrent }: { current: ProjectState; setCurrent: (v: ProjectState) => void }) {
  const [dimensionLabel, setDimensionLabel] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [editingId, setEditingId] = useState('');
  const q = current.questions;

  const saveQuestions = async (next: typeof q) => {
    await window.sociometryApi.writeProjectFile(current.project.slug, 'questions.json', next);
    setCurrent({ ...current, questions: next });
  };

  return (
    <>
      <PageHeader title="Sorular" />
      <SectionCard>
        <div className="row">
          <TextInput placeholder="Boyut" value={dimensionLabel} onChange={(e) => setDimensionLabel(e.target.value)} />
          <TextInput placeholder="Soru" value={questionText} onChange={(e) => setQuestionText(e.target.value)} />
          <PrimaryButton
            onClick={async () => {
              if (!dimensionLabel.trim() || !questionText.trim()) return;

              let next = q;
              if (editingId) {
                next = {
                  ...q,
                  sociometryQuestions: q.sociometryQuestions.map((item) =>
                    item.id === editingId
                      ? { ...item, dimensionLabel: dimensionLabel.trim(), questionText: questionText.trim() }
                      : item,
                  ),
                };
              } else {
                next = {
                  ...q,
                  sociometryQuestions: [
                    ...q.sociometryQuestions,
                    {
                      id: crypto.randomUUID(),
                      dimensionLabel: dimensionLabel.trim(),
                      questionText: questionText.trim(),
                      sortOrder: q.sociometryQuestions.length + 1,
                    },
                  ],
                };
              }

              await saveQuestions(next);
              setDimensionLabel('');
              setQuestionText('');
              setEditingId('');
            }}
          >
            {editingId ? 'Güncelle' : 'Ekle'}
          </PrimaryButton>
        </div>

        <label>
          <input
            type="checkbox"
            checked={q.openQuestionEnabled}
            onChange={async (e) => saveQuestions({ ...q, openQuestionEnabled: e.target.checked })}
          />
          Açık uçlu soru aktif
        </label>

        <TextInput
          placeholder="Açık uçlu soru metni"
          value={q.openQuestionText}
          onChange={async (e) => saveQuestions({ ...q, openQuestionText: e.target.value })}
        />
      </SectionCard>

      <SectionCard>
        {q.sociometryQuestions.map((item, idx) => (
          <div className="list-row" key={item.id}>
            <span>
              {idx + 1}. {item.dimensionLabel}: {item.questionText}
            </span>
            <div className="row">
              <PrimaryButton
                onClick={() => {
                  setEditingId(item.id);
                  setDimensionLabel(item.dimensionLabel);
                  setQuestionText(item.questionText);
                }}
              >
                Düzenle
              </PrimaryButton>
              <PrimaryButton
                onClick={() =>
                  saveQuestions({
                    ...q,
                    sociometryQuestions: q.sociometryQuestions
                      .filter((x) => x.id !== item.id)
                      .map((x, i) => ({ ...x, sortOrder: i + 1 })),
                  })
                }
              >
                Sil
              </PrimaryButton>
            </div>
          </div>
        ))}
      </SectionCard>
    </>
  );
}
