import { useState } from 'react';
import { useCustomFields } from '@/hooks/useCustomFields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type CustomFieldDefinition = Database['public']['Tables']['custom_field_definitions']['Row'];
type FieldType = CustomFieldDefinition['field_type'];

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Yes/No' },
  { value: 'select', label: 'Select' },
];

interface FieldFormData {
  name: string;
  field_type: FieldType;
  options: string[];
  required: boolean;
  description: string;
}

const DEFAULT_FORM_DATA: FieldFormData = {
  name: '',
  field_type: 'text',
  options: [],
  required: false,
  description: '',
};

export function CustomFieldManager() {
  const { definitions, createDefinition, updateDefinition, deleteDefinition } = useCustomFields();
  const [isOpen, setIsOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
  const [formData, setFormData] = useState<FieldFormData>(DEFAULT_FORM_DATA);
  const [optionInput, setOptionInput] = useState('');

  const resetForm = () => {
    setFormData(DEFAULT_FORM_DATA);
    setOptionInput('');
    setEditingField(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fieldData = {
        name: formData.name,
        field_type: formData.field_type,
        options: formData.field_type === 'select' ? formData.options : null,
        required: formData.required,
        description: formData.description || null,
      };

      if (editingField) {
        await updateDefinition(editingField.id, fieldData);
      } else {
        await createDefinition(fieldData);
      }

      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save custom field:', error);
      // TODO: Show error toast
    }
  };

  const handleEdit = (field: CustomFieldDefinition) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      field_type: field.field_type,
      options: (field.options as string[]) || [],
      required: field.required,
      description: field.description || '',
    });
    setIsOpen(true);
  };

  const handleDelete = async (field: CustomFieldDefinition) => {
    if (confirm(`Are you sure you want to delete the field "${field.name}"?`)) {
      try {
        await deleteDefinition(field.id);
      } catch (error) {
        console.error('Failed to delete custom field:', error);
        // TODO: Show error toast
      }
    }
  };

  const addOption = () => {
    if (optionInput && !formData.options.includes(optionInput)) {
      setFormData({
        ...formData,
        options: [...formData.options, optionInput],
      });
      setOptionInput('');
    }
  };

  const removeOption = (option: string) => {
    setFormData({
      ...formData,
      options: formData.options.filter((o) => o !== option),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Custom Fields</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Field
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingField ? 'Edit Field' : 'Add Field'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Field Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Field Type</Label>
                <Select
                  value={formData.field_type}
                  onValueChange={(value: FieldType) => setFormData({ ...formData, field_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.field_type === 'select' && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="flex gap-2">
                    <Input
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      placeholder="Add an option"
                    />
                    <Button type="button" onClick={addOption}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.options.map((option) => (
                      <div
                        key={option}
                        className="flex items-center gap-1 bg-secondary px-2 py-1 rounded"
                      >
                        <span>{option}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => removeOption(option)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  id="required"
                  checked={formData.required}
                  onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
                />
                <Label htmlFor="required">Required Field</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Help text for this field"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {definitions.map((field) => (
          <Card key={field.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {field.name}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </CardTitle>
                  {field.description && (
                    <p className="text-sm text-muted-foreground mt-1">{field.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(field)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(field)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <span className="font-medium">Type:</span>{' '}
                {FIELD_TYPES.find((t) => t.value === field.field_type)?.label}
                {field.field_type === 'select' && field.options && (
                  <div className="mt-1">
                    <span className="font-medium">Options:</span>{' '}
                    {(field.options as string[]).join(', ')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 