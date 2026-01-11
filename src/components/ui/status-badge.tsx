import React from 'react';
import { cn } from '@/lib/utils';
import { PCCStatus } from '@/types';

interface StatusBadgeProps {
  status: PCCStatus;
  className?: string;
}

const statusConfig: Record<PCCStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'status-draft'
  },
  submitted: {
    label: 'Submitted',
    className: 'status-submitted'
  },
  under_review: {
    label: 'Under Review',
    className: 'status-under-review'
  },
  approved: {
    label: 'Approved',
    className: 'status-approved'
  },
  rejected: {
    label: 'Rejected',
    className: 'status-rejected'
  },
  more_info_required: {
    label: 'More Info Required',
    className: 'status-more-info'
  }
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
