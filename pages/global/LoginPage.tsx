
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import { ref, get } from 'firebase/database';

interface LoginPageProps {
  setActiveView: (view: string) => void;
  showAdminLogin?: boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({ setActiveView, showAdminLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Admin login check
    if (showAdminLogin && password === 'Masuk22') {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            // Verify admin role from DB
            const userRef = ref(db, `users/${user.uid}`);
            const snapshot = await get(userRef);
            if (snapshot.exists() && snapshot.val().role === 'admin') {
                // Admin login successful, App.tsx will handle redirect
            } else {
                setError("You are not authorized as an admin.");
                await auth.signOut();
            }
        } catch (err) {
            setError("Failed to login as admin. Check credentials.");
        } finally {
            setLoading(false);
        }
        return;
    }
    
    // Regular user login
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // On successful login, the AuthProvider will automatically update the state
      // and App.tsx will render the UserPanel.
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center">{showAdminLogin ? 'Admin Login' : 'Login'}</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
        {!showAdminLogin && (
            <p className="text-sm text-center">
            Don't have an account?{' '}
            <button onClick={() => setActiveView('register')} className="font-medium text-indigo-600 hover:text-indigo-500">
                Register
            </button>
            </p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
