import React, { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className="primary-btn" {...props} />;
}
