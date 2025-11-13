
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ref, onValue, off } from 'firebase/database';
import { auth, db } from '../services/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  role: 'user' | 'admin' | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  role: null,
  loading: true,
});

export const useAuth = () => {
  return useContext(AuthContext);
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<'user' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      if (user) {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
