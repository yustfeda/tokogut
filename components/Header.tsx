
import React from 'react';
import { IconBox, IconMenu } from '../constants';

interface HeaderProps {
  toggleSidebar: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
  menuItems: { name: string; view: string, icon: React.ReactElement }[];
  isLoggedIn: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, activeView, setActiveView, menuItems, isLoggedIn }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-white">
              <IconBox />
              <span>Mystery Store</span>
            </div>
            <nav className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {menuItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setActiveView(item.view)}
                    className={`${
                      activeView === item.view
                        ? 'bg-gray-900 text-white dark:bg-gray-700'
                        : 'text-gray-500 hover:bg-gray-700 hover:text-white dark:text-gray-300 dark:hover:bg-gray-600'
                    } px-3 py-2 rounded-md text-sm font-medium transition-colors`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </nav>
          </div>
          <div className="hidden md:block">
             {!isLoggedIn && (
                 <div className="flex items-center space-x-2">
                    <button onClick={() => setActiveView('login')} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition">Login</button>
                    <button onClick={() => setActiveView('register')} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition">Register</button>
                 </div>
             )}
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={toggleSidebar}
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              <IconMenu />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
