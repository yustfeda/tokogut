
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db } from '../../services/firebase';

interface RegisterPageProps {
  setActiveView: (view: string) => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ setActiveView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Password tidak cocok.");
      return;
    }
    setError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await set(ref(db, 'users/' + user.uid), {
        uid: user.uid,
        email: user.email,
        role: 'user',
        createdAt: Date.now(),
        totalSpent: 0,
        mysteryBoxPlays: 0,
      });
      
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError("Email ini sudah terdaftar.");
      } else {
        setError("Gagal mendaftar. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center">Buat Akun Baru</h2>
        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label htmlFor="email-reg" className="block text-sm font-medium">Email</label>
            <input
              id="email-reg"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="password-reg" className="block text-sm font-medium">Password</label>
            <input
              id="password-reg"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="confirm-password-reg" className="block text-sm font-medium">Konfirmasi Password</label>
            <input
              id="confirm-password-reg"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? 'Mendaftarkan...' : 'Daftar'}
            </button>
          </div>
        </form>
        <p className="text-sm text-center">
          Sudah punya akun?{' '}
          <button onClick={() => setActiveView('login')} className="font-medium text-blue-600 hover:text-blue-500">
            Masuk
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;