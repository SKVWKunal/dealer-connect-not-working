import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface LikertScaleProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  labels?: string[];
  required?: boolean;
  error?: string;
}

const defaultLabels = [
  'Very Dissatisfied',
  'Dissatisfied',
  'Neutral',
  'Satisfied',
  'Very Satisfied'
];

export function LikertScale({
  label,
  value,
  onChange,
  labels = defaultLabels,
  required = false,
  error
}: LikertScaleProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={cn(
              'flex-1 py-3 px-2 text-xs font-medium rounded-md border-2 transition-all',
              'hover:border-primary/50',
              value === rating
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card hover:bg-muted'
            )}
          >
            <div className="text-center">
              <div className="text-lg font-bold">{rating}</div>
              <div className="text-[10px] leading-tight opacity-80 hidden sm:block">
                {labels[rating - 1]}
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground sm:hidden">
        <span>{labels[0]}</span>
        <span>{labels[4]}</span>
      </div>
      
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
