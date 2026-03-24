import React, { TextareaHTMLAttributes } from 'react';

export default function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="text-area" {...props} />;
}
