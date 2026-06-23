"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface LoginDialogProps {
  onClose: () => void;
}

interface LoginFormValues {
  username: string;
  password: string;
}

export default function LoginDialog({ onClose }: LoginDialogProps) {
  const { login } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>();

  const onSubmit = async ({ username, password }: LoginFormValues) => {
    const result = await login(username, password);
    if (result.success) {
      toast.success("Zalogowano pomyślnie");
      onClose();
      router.refresh();
    } else {
      toast.error(result.error ?? "Błąd logowania");
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Nazwa użytkownika
            </label>
            <input
              {...register("username", { required: true })}
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a0069]"
            />
          </div>
          <div className="space-y-1 relative">
            <label className="text-sm font-medium text-gray-700">Hasło</label>
            <input
              {...register("password", { required: true })}
              type={showPassword ? "text" : "password"}
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
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Logowanie..." : "Zaloguj"}
          </Button>
        </form>
      </div>
    </div>
  );
}
