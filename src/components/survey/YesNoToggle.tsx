import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface YesNoToggleProps {
  label: string;
  value: 'yes' | 'no' | undefined;
  onChange: (value: 'yes' | 'no') => void;
  required?: boolean;
  error?: string;
}

export function YesNoToggle({
  label,
  value,
  onChange,
  required = false,
  error
}: YesNoToggleProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange('yes')}
          className={cn(
            'flex-1 py-2.5 px-4 text-sm font-medium rounded-md border-2 transition-all',
            value === 'yes'
              ? 'border-success bg-success/10 text-success'
              : 'border-border bg-card hover:border-success/50 hover:bg-success/5'
          )}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange('no')}
          className={cn(
            'flex-1 py-2.5 px-4 text-sm font-medium rounded-md border-2 transition-all',
            value === 'no'
              ? 'border-destructive bg-destructive/10 text-destructive'
              : 'border-border bg-card hover:border-destructive/50 hover:bg-destructive/5'
          )}
        >
          No
        </button>
      </div>
      
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
