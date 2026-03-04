'use client';

import * as React from 'react';
import { toast as sonnerToast } from 'sonner';

export const TOAST_DURATION = 5000;

type Toast = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: 'default' | 'destructive';
};

function normalizeContent(content?: React.ReactNode): string {
  if (typeof content === 'string') {
    return content;
  }

  if (typeof content === 'number') {
    return content.toString();
  }

  if (content === undefined || content === null) {
    return '';
  }

  return String(content);
}

function toast({ title, description, variant = 'default' }: Toast) {
  const titleText = normalizeContent(title);
  const descriptionText = normalizeContent(description);

  if (variant === 'destructive') {
    return sonnerToast.error(titleText || 'Błąd', {
      description: descriptionText || undefined,
      duration: TOAST_DURATION,
    });
  }

  return sonnerToast.success(titleText || 'Informacja', {
    description: descriptionText || undefined,
    duration: TOAST_DURATION,
  });
}

function useToast() {
  return {
    toasts: [],
    toast,
    dismiss: sonnerToast.dismiss,
  };
}

export { toast, useToast };
