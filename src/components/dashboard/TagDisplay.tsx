import { useTags } from '@/hooks/useTags';
import { Badge } from '@/components/ui/badge';

interface TagDisplayProps {
  tagIds: string[];
  className?: string;
}

export function TagDisplay({ tagIds, className = '' }: TagDisplayProps) {
  const { tags } = useTags();

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {tagIds.map((tagId) => {
        const tag = tags.find(t => t.id === tagId);
        if (!tag) return null;
        return (
          <Badge
            key={tag.id}
            style={{ backgroundColor: tag.color }}
            className="text-xs"
          >
            {tag.name}
          </Badge>
        );
      })}
    </div>
  );
} 