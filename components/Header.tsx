'use client';
import { useAuth } from '@/contexts/AuthContext';
import { normalizePolishText } from '@/lib/helpers';
import Image from 'next/image';

const Header = () => {
  const { login, logout, isAuthenticated, user } = useAuth();

  const displayName = normalizePolishText(user?.name || user?.preferred_username || 'Użytkowniku');
  const userEmail = user?.preferred_username;

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
        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <div className="text-right leading-tight">
              <p className="text-xs">Witaj, {displayName}</p>
              {userEmail && (
                <p className="text-[11px] text-white/80">Zalogowano jako: {userEmail}</p>
              )}
            </div>
          )}
          <AuthButton
            callback={isAuthenticated ? logout : login}
            text={isAuthenticated ? 'Wyloguj' : 'Zaloguj'}
          />
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
