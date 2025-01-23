import { TagManager } from '@/components/dashboard/TagManager';

export default function AdminTagsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Tag Management</h1>
      <TagManager />
    </div>
  );
} 