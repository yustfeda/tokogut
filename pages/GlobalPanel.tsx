
import React, { useState, useCallback } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { IconHome, IconTrophy } from '../constants';
import HomePage from './global/HomePage';
import LeaderboardPage from './global/LeaderboardPage';
import LoginPage from './global/LoginPage';
import RegisterPage from './global/RegisterPage';

const GlobalPanel: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('home');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [prefilledEmail, setPrefilledEmail] = useState('');

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const menuItems = [
    { name: 'Beranda', view: 'home', icon: <IconHome /> },
    { name: 'Papan Peringkat', view: 'leaderboard', icon: <IconTrophy /> },
  ];
  
  const navigateTo = (view: string) => {
    if (view !== 'login') {
      // Reset admin state if navigating away from login or to a non-admin login
      setShowAdminLogin(false);
      setPrefilledEmail('');
    }
    setActiveView(view);
  };

  const handleAdminClick = () => {
    setShowAdminLogin(true);
    setActiveView('login');
  }

  const renderContent = () => {
    switch (activeView) {
      case 'home':
        return <HomePage setActiveView={navigateTo} />;
      case 'leaderboard':
        return <LeaderboardPage />;
      case 'login':
        return <LoginPage setActiveView={navigateTo} showAdminLogin={showAdminLogin} />;
      case 'register':
        return <RegisterPage setActiveView={navigateTo} />;
      default:
        return <HomePage setActiveView={navigateTo} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Header 
        toggleSidebar={toggleSidebar} 
        isSidebarOpen={sidebarOpen}
        activeView={activeView}
        setActiveView={navigateTo}
        menuItems={menuItems}
        isLoggedIn={false}
        onAdminClick={handleAdminClick}
      />
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
        activeView={activeView}
        setActiveView={navigateTo}
        menuItems={menuItems}
        isLoggedIn={false}
        onAdminClick={handleAdminClick}
      />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default GlobalPanel;