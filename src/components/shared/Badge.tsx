import type { ReactNode } from 'react';
import { Badge as CatalystBadge } from '../catalyst/badge';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

const variantToColor: Record<BadgeVariant, 'zinc' | 'green' | 'amber' | 'red' | 'blue'> = {
  default: 'zinc',
  success: 'green',
  warning: 'amber',
  danger: 'red',
  info: 'blue',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <CatalystBadge color={variantToColor[variant]} className={className}>
      {children}
    </CatalystBadge>
  );
}
