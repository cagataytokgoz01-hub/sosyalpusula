import React from 'react';

export default function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}
