import React, { SelectHTMLAttributes } from 'react';

export default function SelectBox(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="select-box" {...props} />;
}
