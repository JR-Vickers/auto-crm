import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type CustomFieldDefinition = Database['public']['Tables']['custom_field_definitions']['Row'];
type CustomFieldValue = string | number | boolean | Date | null;

export interface CustomField {
  definition: CustomFieldDefinition;
  value: CustomFieldValue;
}

export function useCustomFields() {
  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadDefinitions();
  }, []);

  async function loadDefinitions() {
    try {
      const { data, error } = await supabase
        .from('custom_field_definitions')
        .select('*')
        .order('name');

      if (error) throw error;
      setDefinitions(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load custom field definitions'));
    } finally {
      setLoading(false);
    }
  }

  async function createDefinition(definition: Omit<CustomFieldDefinition, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('custom_field_definitions')
        .insert(definition)
        .select()
        .single();

      if (error) throw error;
      setDefinitions([...definitions, data]);
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create custom field definition');
    }
  }

  async function updateDefinition(id: string, updates: Partial<Omit<CustomFieldDefinition, 'id' | 'created_at' | 'updated_at'>>) {
    try {
      const { data, error } = await supabase
        .from('custom_field_definitions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setDefinitions(definitions.map(d => d.id === id ? data : d));
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update custom field definition');
    }
  }

  async function deleteDefinition(id: string) {
    try {
      const { error } = await supabase
        .from('custom_field_definitions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setDefinitions(definitions.filter(d => d.id !== id));
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete custom field definition');
    }
  }

  function validateFieldValue(definition: CustomFieldDefinition, value: any): CustomFieldValue {
    if (value === null || value === undefined) {
      if (definition.required) {
        throw new Error(`${definition.name} is required`);
      }
      return null;
    }

    switch (definition.field_type) {
      case 'text':
        return String(value);
      case 'number':
        const num = Number(value);
        if (isNaN(num)) throw new Error(`${definition.name} must be a number`);
        return num;
      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) throw new Error(`${definition.name} must be a valid date`);
        return date;
      case 'boolean':
        return Boolean(value);
      case 'select':
        const options = definition.options as string[] | null;
        if (!options?.includes(value)) {
          throw new Error(`${definition.name} must be one of: ${options?.join(', ')}`);
        }
        return value;
      default:
        throw new Error(`Unknown field type: ${definition.field_type}`);
    }
  }

  return {
    definitions,
    loading,
    error,
    createDefinition,
    updateDefinition,
    deleteDefinition,
    validateFieldValue,
  };
} 