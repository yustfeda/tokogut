
import React, { useState, useCallback } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { IconHome, IconTrophy } from '../constants';
import HomePage from './global/HomePage';
import LeaderboardPage from './global/LeaderboardPage';
import LoginPage from './global/LoginPage';
import RegisterPage from './global/RegisterPage';

const GlobalPanel: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('home');
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const menuItems = [
    { name: 'Home', view: 'home', icon: <IconHome /> },
    { name: 'Leaderboard', view: 'leaderboard', icon: <IconTrophy /> },
  ];

  const handleAdminClick = () => {
    // A subtle way to show admin login
    setShowAdminLogin(true);
    setActiveView('login');
  }

  const renderContent = () => {
    switch (activeView) {
      case 'home':
        return <HomePage setActiveView={setActiveView} />;
      case 'leaderboard':
        return <LeaderboardPage />;
      case 'login':
        return <LoginPage setActiveView={setActiveView} showAdminLogin={showAdminLogin} />;
      case 'register':
        return <RegisterPage setActiveView={setActiveView} />;
      default:
        return <HomePage setActiveView={setActiveView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Header 
        toggleSidebar={toggleSidebar} 
        activeView={activeView}
        setActiveView={setActiveView}
        menuItems={menuItems}
        isLoggedIn={false}
      />
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
        activeView={activeView}
        setActiveView={setActiveView}
        menuItems={menuItems}
        isLoggedIn={false}
      />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>Copyright © {new Date().getFullYear()} Mystery Store. All rights reserved.</p>
        <div className="w-full h-4" onClick={handleAdminClick} title="Admin Access"></div>
      </footer>
    </div>
  );
};

export default GlobalPanel;
