import { useState } from 'react';
import type { ProjectState } from '../App';
import PageHeader from '../components/PageHeader';
import PrimaryButton from '../components/PrimaryButton';
import SectionCard from '../components/SectionCard';

export default function ReportPage({ current }: { current: ProjectState }) {
  const [lastOutput, setLastOutput] = useState('');

  const generate = async (kind: 'pdf' | 'word' | 'excel') => {
    const filePath = await window.sociometryApi.exportReport(current.project.slug, kind);
    setLastOutput(filePath);
  };

  return (
    <>
      <PageHeader title="Rapor" />
      <SectionCard>
        <div className="row">
          <PrimaryButton onClick={() => generate('pdf')}>PDF üret</PrimaryButton>
          <PrimaryButton onClick={() => generate('word')}>Word üret</PrimaryButton>
          <PrimaryButton onClick={() => generate('excel')}>Excel üret</PrimaryButton>
        </div>
        {lastOutput && <p>Oluşturulan dosya: {lastOutput}</p>}
      </SectionCard>
    </>
  );
}
