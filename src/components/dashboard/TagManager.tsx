import { useState } from 'react';
import { useTags } from '@/hooks/useTags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function TagManager() {
  const { tags, loading, error, createTag, updateTag, deleteTag } = useTags();
  const [newTag, setNewTag] = useState({ name: '', color: '#6366f1', description: '' });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading tags: {error.message}
      </div>
    );
  }

  const handleCreateTag = async () => {
    try {
      await createTag(newTag);
      setNewTag({ name: '', color: '#6366f1', description: '' });
      toast.success('Tag created successfully');
    } catch (err) {
      toast.error('Failed to create tag');
    }
  };

  const handleUpdateTag = async (id: string, updates: { name?: string; color?: string; description?: string }) => {
    try {
      await updateTag(id, updates);
      toast.success('Tag updated successfully');
    } catch (err) {
      toast.error('Failed to update tag');
    }
  };

  const handleDeleteTag = async (id: string) => {
    try {
      await deleteTag(id);
      toast.success('Tag deleted successfully');
    } catch (err) {
      toast.error('Failed to delete tag');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Create New Tag</h3>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={newTag.name}
              onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
              placeholder="Enter tag name"
            />
          </div>
          <div>
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={newTag.color}
                onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                className="w-20"
              />
              <Input
                value={newTag.color}
                onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={newTag.description}
              onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
              placeholder="Enter tag description (optional)"
            />
          </div>
          <Button
            onClick={handleCreateTag}
            disabled={!newTag.name || !newTag.color}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Tag
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Existing Tags</h3>
        <div className="grid gap-4">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-4 p-2 border rounded">
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: tag.color }}
              />
              <Input
                value={tag.name}
                onChange={(e) => handleUpdateTag(tag.id, { name: e.target.value })}
                className="flex-1"
              />
              <Input
                type="color"
                value={tag.color}
                onChange={(e) => handleUpdateTag(tag.id, { color: e.target.value })}
                className="w-20"
              />
              <Input
                value={tag.description || ''}
                onChange={(e) => handleUpdateTag(tag.id, { description: e.target.value })}
                placeholder="Description"
                className="flex-1"
              />
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDeleteTag(tag.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 