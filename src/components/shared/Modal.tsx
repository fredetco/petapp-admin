import type { ReactNode } from 'react';
import { Dialog, DialogTitle, DialogBody } from '../catalyst/dialog';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'md' as const,
  md: 'lg' as const,
  lg: '2xl' as const,
  xl: '4xl' as const,
};

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} size={sizeMap[size]}>
      <DialogTitle>{title}</DialogTitle>
      <DialogBody>{children}</DialogBody>
    </Dialog>
  );
}
