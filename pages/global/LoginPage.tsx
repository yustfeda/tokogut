
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';

interface LoginPageProps {
  setActiveView: (view: string) => void;
  showAdminLogin?: boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({ setActiveView, showAdminLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { hardcodedAdminLogin } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (showAdminLogin) {
        if (hardcodedAdminLogin(password)) {
            // Success, AuthProvider will handle the state change.
        } else {
            setError("Password admin tidak valid.");
        }
        setLoading(false);
        return;
    }
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError("Email atau password salah. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center">{showAdminLogin ? 'Portal Admin' : 'Masuk'}</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          {!showAdminLogin && (
            <div>
              <label htmlFor="email" className="block text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          )}
          <div>
            <label htmlFor="password" className="block text-sm font-medium">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 font-semibold text-gray-900 bg-yellow-500 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
            >
              {loading ? 'Sedang memproses...' : 'Masuk'}
            </button>
          </div>
        </form>
        {!showAdminLogin && (
            <p className="text-sm text-center">
            Belum punya akun?{' '}
            <button onClick={() => setActiveView('register')} className="font-medium text-blue-600 hover:text-blue-500">
                Daftar
            </button>
            </p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;