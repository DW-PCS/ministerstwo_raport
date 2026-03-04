'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function AuthRequiredToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get('auth') !== 'required') {
      return;
    }

    toast.error('Wymagane logowanie', {
      description: 'Musisz się najpierw uwierzytelnić, aby wejść do raportów.',
    });

    const params = new URLSearchParams(searchParams.toString());
    params.delete('auth');
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl);
  }, [pathname, router, searchParams]);

  return null;
}
