'use client';

import { useAuth } from "@/contexts/AuthContext";

export default function LoginButton() {
  const { isAuthenticated, login, logout } = useAuth();

  return (
    <button
      onClick={isAuthenticated ? logout : login}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
    >
      {isAuthenticated ? 'Logout' : 'Login with Azure AD'}
    </button>
  );
}
