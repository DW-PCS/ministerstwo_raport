'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface TestDataBannerProps {
  className?: string;
}

export default function TestDataBanner({ className }: TestDataBannerProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border border-amber-400 bg-amber-50 px-3 py-2.5 text-xs text-amber-800',
        className
      )}
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
      <span>
        Dane testowe obejmują wyłącznie okres <strong>lipiec – grudzień 2025</strong>. Dla wybranego
        okresu dane mogą być niedostępne lub niekompletne.
      </span>
    </div>
  );
}
