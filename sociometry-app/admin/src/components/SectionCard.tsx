import React, { PropsWithChildren } from 'react';

export default function SectionCard({ children }: PropsWithChildren) {
  return <section className="section-card">{children}</section>;
}
