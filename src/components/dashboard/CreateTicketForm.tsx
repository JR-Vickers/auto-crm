import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { CustomFields } from '@/components/dashboard/CustomFields';
import { useCustomFields } from '@/hooks/useCustomFields';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagSelect } from '@/components/dashboard/TagSelect';
import type { Priority } from '@/types';

export function CreateTicketForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { definitions, validateFieldValue } = useCustomFields();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    custom_fields: {} as Record<string, any>,
    tags: [] as string[],
  });

  const handleCustomFieldChange = (fieldId: string, value: any) => {
    try {
      const definition = definitions.find(d => d.id === fieldId);
      if (!definition) return;

      const validatedValue = validateFieldValue(definition, value);
      setFormData(prev => ({
        ...prev,
        custom_fields: {
          ...prev.custom_fields,
          [fieldId]: validatedValue
        }
      }));
    } catch (error) {
      console.error('Invalid field value:', error);
      toast.error('Invalid field value');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required custom fields
      const missingFields = definitions
        .filter(def => def.required && !formData.custom_fields[def.id])
        .map(def => def.name);

      if (missingFields.length > 0) {
        throw new Error(`Required fields missing: ${missingFields.join(', ')}`);
      }

      // Get the current user's ID to use as customer_id
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user');

      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert({
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          customer_id: user.id, // Use the current user's ID
          custom_fields: formData.custom_fields,
          tags: formData.tags,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Ticket created successfully');
      navigate(`/tickets/${ticket.id}`);
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const customFields = definitions.map(def => ({
    definition: def,
    value: formData.custom_fields[def.id] ?? null
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter ticket title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <RichTextEditor
          content={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value })}
          placeholder="Describe the issue in detail..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select
          value={formData.priority}
          onValueChange={(value) => setFormData({ ...formData, priority: value as Priority })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <TagSelect
          selectedTags={formData.tags}
          onTagsChange={(tags) => setFormData({ ...formData, tags })}
        />
      </div>

      {customFields.length > 0 && (
        <div className="space-y-2">
          <Label>Additional Details</Label>
          <CustomFields
            fields={customFields}
            onChange={handleCustomFieldChange}
          />
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Creating...' : 'Create Ticket'}
      </Button>
    </form>
  );
} 