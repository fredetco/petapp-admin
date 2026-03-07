import type { ComplexityLevel } from '../../types/template';
import { Badge } from '../shared/Badge';

const config: Record<ComplexityLevel, { variant: 'success' | 'warning' | 'info'; label: string }> = {
  minimal: { variant: 'success', label: 'Minimal' },
  standard: { variant: 'warning', label: 'Standard' },
  detailed: { variant: 'info', label: 'Detailed' },
};

export function ComplexityBadge({ level }: { level: ComplexityLevel }) {
  const { variant, label } = config[level];
  return <Badge variant={variant}>{label}</Badge>;
}
