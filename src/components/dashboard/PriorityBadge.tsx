import { Badge } from '@/components/ui/badge';
import type { Priority } from '@/types';

const PRIORITY_COLORS = {
  low: 'bg-green-500/20 text-green-700 hover:bg-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30',
  high: 'bg-orange-500/20 text-orange-700 hover:bg-orange-500/30',
  urgent: 'bg-red-500/20 text-red-700 hover:bg-red-500/30',
} as const;

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge
      variant="secondary"
      className={PRIORITY_COLORS[priority]}
    >
      {priority}
    </Badge>
  );
} 