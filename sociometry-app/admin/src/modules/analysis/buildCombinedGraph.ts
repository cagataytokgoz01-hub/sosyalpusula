import type { Edge } from '../types/analysis';

export const buildCombinedGraph = (
  choice: Record<string, Record<string, number>>[],
  reject: Record<string, Record<string, number>>[],
): Edge[] => {
  const edgeMap = new Map<string, Edge>();
  const upsert = (from: string, to: string, relationType: 'choice' | 'reject', weight: number) => {
    const key = `${from}__${to}__${relationType}`;
    const current = edgeMap.get(key);
    if (current) {
      current.weight += weight;
      return;
    }
    edgeMap.set(key, { from, to, relationType, weight, mutual: false });
  };

  for (const matrix of choice) {
    for (const [from, targets] of Object.entries(matrix)) {
      for (const [to, weight] of Object.entries(targets)) upsert(from, to, 'choice', weight);
    }
  }
  for (const matrix of reject) {
    for (const [from, targets] of Object.entries(matrix)) {
      for (const [to, weight] of Object.entries(targets)) upsert(from, to, 'reject', weight);
    }
  }

  const edges = [...edgeMap.values()];
  for (const e of edges) {
    e.mutual = edges.some((x) => x.from === e.to && x.to === e.from && x.relationType === e.relationType);
  }
  return edges;
};
