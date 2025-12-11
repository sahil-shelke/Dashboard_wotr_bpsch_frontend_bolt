import { Menu } from 'lucide-react';
import React from 'react';

import Logo from '../assets/farm-precise-logo.png';

interface HeaderProps {
  error: string | null;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
  error,
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  return (
    <div className="md:hidden flex flex-row w-full absolute items-center h-15 mb-1 bg-[#0F4C44] z-10">
      <button
        className={`${
          isSidebarOpen ? 'z-50' : 'z-1'
        } md:hidden left-4 absolute text-[#FFB800]`}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle menu"
      >
        <p className="sr-only">{error}</p>
        <Menu className="h-6 w-6" />
      </button>
      <div className="title-bar flex justify-center items-center w-full gap-2">
        <img src={Logo} alt="farm precise logo" width={40} height="auto" />
        <h3 className="text-white font-bold">FarmPrecise AI</h3>
      </div>
    </div>
  );
};

export default Header;
