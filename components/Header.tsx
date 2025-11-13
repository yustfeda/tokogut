
import React from 'react';
import { IconSun, IconMoon, AnimatedMenuIcon } from '../constants';
import { useAuth } from '../hooks/useAuth';
import Logo from './Logo';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
  activeView: string;
  setActiveView: (view: string) => void;
  menuItems: { name: string; view: string, icon: React.ReactElement }[];
  isLoggedIn: boolean;
  onAdminClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, isSidebarOpen, activeView, setActiveView, menuItems, isLoggedIn, onAdminClick }) => {
  const { theme, toggleTheme } = useAuth();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Logo />
            <nav className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {menuItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setActiveView(item.view)}
                    className={`${
                      activeView === item.view
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 hover:bg-blue-500 hover:text-white dark:text-gray-300 dark:hover:bg-blue-700'
                    } px-3 py-2 rounded-md text-sm font-medium transition-all active:scale-95`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </nav>
          </div>
          <div className="hidden md:flex items-center space-x-4">
             {!isLoggedIn && (
                 <div className="flex items-center space-x-2">
                    <button onClick={onAdminClick} className="bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-600 transition-all active:scale-95">Admin</button>
                    <button onClick={() => setActiveView('login')} className="bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-md text-sm hover:bg-yellow-600 transition-all active:scale-95">Masuk</button>
                    <button onClick={() => setActiveView('register')} className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-all active:scale-95">Daftar</button>
                 </div>
             )}
             <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <IconSun /> : <IconMoon />}
            </button>
          </div>
          <div className="-mr-2 flex md:hidden">
             <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mr-2"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <IconSun /> : <IconMoon />}
            </button>
            <button
              onClick={toggleSidebar}
              className="bg-gray-100 dark:bg-gray-700 inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              <span className="sr-only">Buka menu utama</span>
              <AnimatedMenuIcon isOpen={isSidebarOpen} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;