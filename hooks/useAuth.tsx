
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { ref, onValue, off } from 'firebase/database';
import { auth, db } from '../services/firebase';
import { UserProfile } from '../types';

type Theme = 'light' | 'dark';

interface AuthContextType {
  user: User | { uid: string, email: string } | null;
  userProfile: UserProfile | null;
  role: 'user' | 'admin' | null;
  loading: boolean;
  theme: Theme;
  toggleTheme: () => void;
  hardcodedAdminLogin: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  role: null,
  loading: true,
  theme: 'light',
  toggleTheme: () => {},
  hardcodedAdminLogin: () => false,
  logout: () => {},
});

export const useAuth = () => {
  return useContext(AuthContext);
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | { uid: string, email: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<'user' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            return 'dark';
        }
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const hardcodedAdminLogin = (password: string): boolean => {
    if (password === 'Masuk22') {
        setLoading(true);
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        setUser({ uid: 'hardcoded-admin', email: 'admin@tokoaing' });
        setRole('admin');
        setUserProfile(null); // No real profile for this admin
        setLoading(false);
        return true;
    }
    return false;
  };

  const logout = () => {
    if (sessionStorage.getItem('isAdminLoggedIn')) {
        sessionStorage.removeItem('isAdminLoggedIn');
        setUser(null);
        setRole(null);
        setUserProfile(null);
    } else {
        signOut(auth).catch(error => console.error("Logout Error:", error));
    }
  };

  useEffect(() => {
    setLoading(true);
    // Check for hardcoded admin session first
    if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
        setUser({ uid: 'hardcoded-admin', email: 'admin@tokoaing' });
        setRole('admin');
        setLoading(false);
        return; // Don't run firebase auth listener
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const profileData = snapshot.val();
            setUserProfile(profileData);
            setRole(profileData.role);
          }
          setLoading(false);
        });
      } else {
        setUserProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (user && 'uid' in user && user.uid !== 'hardcoded-admin') {
        const userRef = ref(db, `users/${user.uid}`);
        off(userRef);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    user,
    userProfile,
    role,
    loading,
    theme,
    toggleTheme,
    hardcodedAdminLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
