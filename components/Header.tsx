'use client';
import LoginDialog from '@/components/auth/LoginDialog';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { useState } from 'react';

const Header = () => {
  const { logout, isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <header className="max-w-6xl mx-auto bg-[#1a0069] text-white p-4 rounded-[25px] shadow-lg mt-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
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
          <AuthButton
            callback={isAuthenticated ? logout : () => setShowLogin(true)}
            text={isAuthenticated ? 'Wyloguj' : 'Zaloguj'}
          />
        </div>
      </header>
      {showLogin && <LoginDialog onClose={() => setShowLogin(false)} />}
    </>
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
