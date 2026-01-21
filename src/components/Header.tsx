import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            WOTR - FPC Management System
          </h2>
        </div>
      </div>
    </header>
  );
};

export default Header;