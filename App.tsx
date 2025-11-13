
import React from 'react';
import { useAuth } from './hooks/useAuth';
import UserPanel from './pages/UserPanel';
import AdminPanel from './pages/AdminPanel';
import GlobalPanel from './pages/GlobalPanel';
import { Spinner } from './components/Spinner';

const App: React.FC = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <Spinner />
      </div>
    );
  }

  if (user && role === 'admin') {
    return <AdminPanel />;
  } else if (user) {
    return <UserPanel />;
  } else {
    return <GlobalPanel />;
  }
};

export default App;
