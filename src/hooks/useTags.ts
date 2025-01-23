import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Tag = Database['public']['Tables']['tags']['Row'];

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load tags'));
    } finally {
      setLoading(false);
    }
  }

  async function createTag(tag: Omit<Tag, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert(tag)
        .select()
        .single();

      if (error) throw error;
      setTags([...tags, data]);
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create tag');
    }
  }

  async function updateTag(id: string, updates: Partial<Omit<Tag, 'id' | 'created_at' | 'updated_at'>>) {
    try {
      const { data, error } = await supabase
        .from('tags')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setTags(tags.map(t => t.id === id ? data : t));
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update tag');
    }
  }

  async function deleteTag(id: string) {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTags(tags.filter(t => t.id !== id));
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete tag');
    }
  }

  return {
    tags,
    loading,
    error,
    createTag,
    updateTag,
    deleteTag,
  };
} 