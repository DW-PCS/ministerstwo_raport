'use client'
import { AuthProvider } from "@/contexts/AuthContext";
import { RaportProvider } from "@/contexts/RaportContext";
import { AuthUserPayload } from "@/lib/types";
import React from 'react';

type ClientProvidersProps = {
  children: React.ReactNode;
  initialToken: string | null;
  initialUser: AuthUserPayload | null;
};

const ClientProviders = ({ children, initialToken, initialUser }: ClientProvidersProps) => {
  return (
    <AuthProvider initialToken={initialToken} initialUser={initialUser}>
      <RaportProvider>
        {children}
      </RaportProvider>
    </AuthProvider>
  )
}

export default ClientProviders
