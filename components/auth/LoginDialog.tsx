"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

interface LoginDialogProps {
  onClose: () => void;
}

export default function LoginDialog({ onClose }: LoginDialogProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await login(username, password);
    setIsLoading(false);
    if (result.success) {
      await toast.success("Zalogowano pomyślnie");
      onClose();
      router.refresh();
    } else {
      await toast.error(result.error ?? "Błąd logowania");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-[#1a0069] mb-6">Logowanie</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Nazwa użytkownika
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a0069]"
            />
          </div>
          <div className="space-y-1 relative">
            <label className="text-sm font-medium text-gray-700">Hasło</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a0069] relative"
            />
            <div className="absolute right-3 top-1/2 text-black">
              {showPassword ? (
                <EyeOffIcon
                  onClick={() => setShowPassword(false)}
                  className="size-4 cursor-pointer"
                />
              ) : (
                <EyeIcon
                  onClick={() => setShowPassword(true)}
                  className="size-4 cursor-pointer"
                />
              )}
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Logowanie..." : "Zaloguj"}
          </Button>
        </form>
      </div>
    </div>
  );
}
