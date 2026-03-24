import { useEffect, useMemo, useState } from 'react';
import type { ProjectState } from '../App';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import SelectBox from '../components/SelectBox';

type Point = { x: number; y: number };

const WIDTH = 900;
const HEIGHT = 520;

export default function SociogramPage({ current }: { current: ProjectState }) {
  const [questionId, setQuestionId] = useState('combined');
  const [selectedNode, setSelectedNode] = useState<string>('');
  const [positions, setPositions] = useState<Record<string, Point>>({});
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string>('');

  const participantsById = useMemo(
    () => Object.fromEntries(current.participants.map((p) => [p.id, p])),
    [current.participants],
  );

  const edges = useMemo(() => {
    if (questionId === 'combined') return current.analysis.combinedAnalysis.edges;
    return current.analysis.questionAnalyses.find((q) => q.questionId === questionId)?.edges ?? [];
  }, [current.analysis, questionId]);

  useEffect(() => {
    const next: Record<string, Point> = {};
    const count = current.participants.length || 1;
    current.participants.forEach((p, i) => {
      const angle = (Math.PI * 2 * i) / count;
      next[p.id] = { x: 430 + Math.cos(angle) * 180, y: 240 + Math.sin(angle) * 180 };
    });
    setPositions(next);
  }, [current.participants]);

  const selectedMetrics = current.analysis.participantMetrics.find((m) => m.participantId === selectedNode);
  const selectedParticipant = current.participants.find((p) => p.id === selectedNode);

  const isMixed = (from: string, to: string, relationType: 'choice' | 'reject' | 'mixed') => {
    if (relationType === 'mixed') return true;
    const opposite = relationType === 'choice' ? 'reject' : 'choice';
    return edges.some((e) => e.from === to && e.to === from && e.relationType === opposite);
  };

  return (
    <>
      <PageHeader title="Sosyogram" subtitle="Sürükleme geçicidir, kaydedilmez." />
      <SectionCard>
        <div className="row">
          <SelectBox value={questionId} onChange={(e) => setQuestionId(e.target.value)} style={{ width: 280 }}>
            <option value="combined">Birleşik</option>
            {current.questions.sociometryQuestions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.dimensionLabel}
              </option>
            ))}
          </SelectBox>

          <button className="primary-btn" onClick={() => setScale((v) => Math.min(2.4, v + 0.1))}>Zoom +</button>
          <button className="primary-btn" onClick={() => setScale((v) => Math.max(0.6, v - 0.1))}>Zoom -</button>
          <button className="primary-btn" onClick={() => setOffset({ x: 0, y: 0 })}>Pan Sıfırla</button>
        </div>

        <svg
          width={WIDTH}
          height={HEIGHT}
          style={{ border: '1px solid #d8dee8', marginTop: 12, background: '#fcfdff', cursor: draggingNodeId ? 'grabbing' : 'grab' }}
          onMouseMove={(e) => {
            if (!draggingNodeId) return;
            const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
            const x = (e.clientX - rect.left - offset.x) / scale;
            const y = (e.clientY - rect.top - offset.y) / scale;
            setPositions((prev) => ({ ...prev, [draggingNodeId]: { x, y } }));
          }}
          onMouseUp={() => setDraggingNodeId('')}
          onMouseLeave={() => setDraggingNodeId('')}
          onWheel={(e) => {
            e.preventDefault();
            setScale((v) => Math.max(0.6, Math.min(2.4, v + (e.deltaY < 0 ? 0.08 : -0.08))));
          }}
        >
          <g transform={`translate(${offset.x},${offset.y}) scale(${scale})`}>
            {edges.map((e, idx) => {
              const from = positions[e.from];
              const to = positions[e.to];
              if (!from || !to) return null;
              const color = e.relationType === 'reject' ? '#b33b3b' : '#2f6dc6';
              const dash = e.relationType === 'reject' ? '6,4' : undefined;
              const mixed = isMixed(e.from, e.to, e.relationType);

              return (
                <g key={`${idx}-${e.from}-${e.to}-${e.relationType}`}>
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeDasharray={dash} strokeWidth={e.mutual ? 3 : 1.8} />
                  {mixed && <circle cx={(from.x + to.x) / 2} cy={(from.y + to.y) / 2} r={4} fill="#7f4ac7" />}
                </g>
              );
            })}

            {current.participants.map((p) => {
              const pos = positions[p.id] || { x: 0, y: 0 };
              return (
                <g
                  key={p.id}
                  transform={`translate(${pos.x},${pos.y})`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggingNodeId(p.id);
                  }}
                  onClick={() => setSelectedNode(p.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {p.gender === 'erkek' ? (
                    <polygon points="0,-12 11,10 -11,10" fill={selectedNode === p.id ? '#144680' : '#1f74c9'} />
                  ) : (
                    <circle r={11} fill={selectedNode === p.id ? '#1f6b48' : '#2d9a69'} />
                  )}
                  <text x={14} y={4} fontSize={12} fill="#1a1a1a">
                    {p.fullName}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </SectionCard>

      <SectionCard>
        <h3>Node Bilgisi</h3>
        {!selectedParticipant && <p>Bir katılımcıya tıklayın.</p>}
        {selectedParticipant && selectedMetrics && (
          <ul>
            <li>ad soyad: {selectedParticipant.fullName}</li>
            <li>cinsiyet: {selectedParticipant.gender}</li>
            <li>aldığı seçim sayısı: {selectedMetrics.receivedChoices}</li>
            <li>aldığı reddetme sayısı: {selectedMetrics.receivedRejects}</li>
            <li>verdiği seçim sayısı: {selectedMetrics.sentChoices}</li>
            <li>verdiği reddetme sayısı: {selectedMetrics.sentRejects}</li>
            <li>karşılıklı seçim sayısı: {selectedMetrics.mutualChoices}</li>
            <li>karşılıklı reddetme sayısı: {selectedMetrics.mutualRejects}</li>
          </ul>
        )}
      </SectionCard>
    </>
  );
}
