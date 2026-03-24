import React from 'react';
import PrimaryButton from './PrimaryButton';

export default function ConfirmModal({
  open,
  text,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  text: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <p>{text}</p>
        <div className="row">
          <PrimaryButton onClick={onConfirm}>Onayla</PrimaryButton>
          <PrimaryButton onClick={onCancel}>İptal</PrimaryButton>
        </div>
      </div>
    </div>
  );
}
