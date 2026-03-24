import React, { InputHTMLAttributes } from 'react';

export default function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="text-input" {...props} />;
}
