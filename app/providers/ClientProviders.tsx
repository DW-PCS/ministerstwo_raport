'use client'
import { AuthProvider } from "@/contexts/AuthContext";
import { RaportProvider } from "@/contexts/RaportContext";
import React from 'react';

const ClientProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <RaportProvider>
        {children}
      </RaportProvider>
    </AuthProvider>
  )
}

export default ClientProviders
