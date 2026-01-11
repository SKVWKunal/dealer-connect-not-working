import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';

interface MultiSelectProps {
  label: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  required?: boolean;
  error?: string;
}

export function MultiSelect({
  label,
  options,
  value,
  onChange,
  required = false,
  error
}: MultiSelectProps) {
  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => toggleOption(option.value)}
            className={cn(
              'flex items-center gap-2 py-2.5 px-3 text-sm font-medium rounded-md border-2 transition-all text-left',
              value.includes(option.value)
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card hover:border-primary/50'
            )}
          >
            <div className={cn(
              'h-4 w-4 rounded border flex items-center justify-center shrink-0',
              value.includes(option.value)
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-muted-foreground'
            )}>
              {value.includes(option.value) && <Check className="h-3 w-3" />}
            </div>
            <span className="truncate">{option.label}</span>
          </button>
        ))}
      </div>
      
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
