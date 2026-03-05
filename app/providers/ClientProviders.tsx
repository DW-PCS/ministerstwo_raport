'use client'
import { AuthProvider } from "@/contexts/AuthContext";
import { RaportProvider } from "@/contexts/RaportContext";
import React from 'react';

type ClientProvidersProps = {
  children: React.ReactNode;
  initialToken: string | null;
};

const ClientProviders = ({ children, initialToken }: ClientProvidersProps) => {
  return (
    <AuthProvider initialToken={initialToken}>
      <RaportProvider>
        {children}
      </RaportProvider>
    </AuthProvider>
  )
}

export default ClientProviders
