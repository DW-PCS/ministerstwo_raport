'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthCallback } from '@/hooks/useAuthCallback';
import Image from 'next/image';

const Header = () => {
  const { login, logout, isAuthenticated } = useAuth();
  const { isSuccess } = useAuthCallback();

  return (
    <header className="max-w-5xl mx-auto bg-[#1a0069] text-white p-4 rounded-[25px] shadow-lg mt-4">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Image
            src="/polskipcs.svg"
            alt="Polski PCS Logo"
            width={112}
            height={54}
            className="h-12 w-auto"
          />
          <h1 className="text-[18px] font-bold ml-4">Generator Raportów</h1>
        </div>
        <div className="flex items-center">
          {isSuccess || isAuthenticated ? (
            <AuthButton callback={logout} text="Wyloguj" />
          ) : (
            <AuthButton callback={login} text="Zaloguj" />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

const AuthButton = ({ text, callback }: { text: string; callback: () => void }) => {
  return (
    <button
      onClick={callback}
      className="text-xs cursor-pointer bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full duration-150 transition-colors"
    >
      {text}
    </button>
  );
};
