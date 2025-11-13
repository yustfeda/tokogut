
import React from 'react';
import { IconX } from '../constants';
import Logo from './Logo';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
  menuItems: { name: string; view: string; icon: React.ReactElement; badge?: number }[];
  isLoggedIn: boolean;
  onLogout?: () => void;
  onAdminClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, activeView, setActiveView, menuItems, isLoggedIn, onLogout, onAdminClick }) => {
  const handleItemClick = (view: string) => {
    if (view === 'logout' && onLogout) {
      onLogout();
    } else {
      setActiveView(view);
    }
    toggleSidebar();
  };
  
  const handleAdminItemClick = () => {
    onAdminClick();
    toggleSidebar();
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleSidebar}
      ></div>
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
           <Logo />
          <button onClick={toggleSidebar} className="text-gray-500 dark:text-gray-400">
            <IconX />
          </button>
        </div>
        <nav className="flex-1 px-2 space-y-1 py-4">
          {menuItems.map((item) => (
            <a
              key={item.name}
              href="#"
              onClick={(e) => { e.preventDefault(); handleItemClick(item.view); }}
              className={`flex items-center px-4 py-2 text-base font-medium rounded-lg group ${
                activeView === item.view
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-700 dark:text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white'
              }`}
            >
              {item.icon}
              <span className="ml-3 flex-1">{item.name}</span>
              {item.badge && item.badge > 0 && (
                <span className="ml-auto inline-block py-0.5 px-2 text-xs font-semibold text-white bg-red-500 rounded-full">
                  {item.badge}
                </span>
              )}
            </a>
          ))}
        </nav>
        {!isLoggedIn && (
            <div className="p-4 space-y-2 border-t border-gray-200 dark:border-gray-700">
                <button onClick={handleAdminItemClick} className="w-full bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-600 transition">Admin</button>
                <button onClick={() => handleItemClick('login')} className="w-full bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-md text-sm hover:bg-yellow-600 transition">Masuk</button>
                <button onClick={() => handleItemClick('register')} className="w-full bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition">Daftar</button>
            </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;