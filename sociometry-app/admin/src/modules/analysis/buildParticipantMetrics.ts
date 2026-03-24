import type { Edge, ParticipantMetrics } from '../types/analysis';

export const buildParticipantMetrics = (participantIds: string[], edges: Edge[]): ParticipantMetrics[] => {
  return participantIds.map((id) => {
    const sentChoices = edges.filter((e) => e.from === id && e.relationType === 'choice').reduce((a, b) => a + b.weight, 0);
    const sentRejects = edges.filter((e) => e.from === id && e.relationType === 'reject').reduce((a, b) => a + b.weight, 0);
    const receivedChoices = edges.filter((e) => e.to === id && e.relationType === 'choice').reduce((a, b) => a + b.weight, 0);
    const receivedRejects = edges.filter((e) => e.to === id && e.relationType === 'reject').reduce((a, b) => a + b.weight, 0);
    const mutualChoices = edges.filter((e) => e.mutual && e.relationType === 'choice' && (e.from === id || e.to === id)).length;
    const mutualRejects = edges.filter((e) => e.mutual && e.relationType === 'reject' && (e.from === id || e.to === id)).length;
    const mixedRelations = edges.filter((e) => e.from === id || e.to === id).filter((e) => {
      const oppositeType = e.relationType === 'choice' ? 'reject' : 'choice';
      return edges.some((x) => x.from === e.to && x.to === e.from && x.relationType === oppositeType);
    }).length;
    return {
      participantId: id,
      receivedChoices,
      receivedRejects,
      sentChoices,
      sentRejects,
      mutualChoices,
      mutualRejects,
      mixedRelations,
      inDegree: edges.filter((e) => e.to === id).length,
      outDegree: edges.filter((e) => e.from === id).length,
    };
  });
};
