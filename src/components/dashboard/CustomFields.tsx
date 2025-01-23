import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import type { CustomField } from '@/hooks/useCustomFields';

interface CustomFieldsProps {
  fields: CustomField[];
  onChange: (fieldId: string, value: any) => void;
  readOnly?: boolean;
}

export function CustomFields({ fields, onChange, readOnly = false }: CustomFieldsProps) {
  const [dateField, setDateField] = useState<string | null>(null);

  const renderField = (field: CustomField) => {
    const { definition, value } = field;

    switch (definition.field_type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value as string || ''}
            onChange={(e) => onChange(definition.id, e.target.value)}
            disabled={readOnly}
            required={definition.required}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value as number || ''}
            onChange={(e) => onChange(definition.id, e.target.valueAsNumber)}
            disabled={readOnly}
            required={definition.required}
          />
        );

      case 'date':
        return (
          <Popover open={dateField === definition.id} onOpenChange={(open) => setDateField(open ? definition.id : null)}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !value && 'text-muted-foreground'
                )}
                disabled={readOnly}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(value as Date, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value as Date || undefined}
                onSelect={(date) => {
                  onChange(definition.id, date);
                  setDateField(null);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'boolean':
        return (
          <Switch
            checked={value as boolean || false}
            onCheckedChange={(checked) => onChange(definition.id, checked)}
            disabled={readOnly}
          />
        );

      case 'select':
        return (
          <Select
            value={value as string || ''}
            onValueChange={(value) => onChange(definition.id, value)}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {(definition.options as string[])?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.definition.id} className="space-y-2">
          <Label>
            {field.definition.name}
            {field.definition.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.definition.description && (
            <p className="text-sm text-muted-foreground">{field.definition.description}</p>
          )}
          {renderField(field)}
        </div>
      ))}
    </div>
  );
} 