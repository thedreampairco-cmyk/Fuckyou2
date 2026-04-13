import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from '../types';
import axios from 'axios';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const res = await axios.get('/api/user/profile', {
            headers: { Authorization: user.uid }
          });
          setProfile(res.data);
          setLoading(false);
        } catch (err: any) {
          console.error("Profile fetch error:", err);
          if (err.response?.status === 401) {
            // Try to sync user if not found in Prisma
            try {
              console.log("Attempting to sync user...");
              await axios.post('/api/auth/sync', {
                id: user.uid,
                email: user.email,
                displayName: user.displayName,
                role: user.email === 'av4991986@gmail.com' ? 'admin' : 'user'
              });
              // Retry fetch profile
              const retryRes = await axios.get('/api/user/profile', {
                headers: { Authorization: user.uid }
              });
              setProfile(retryRes.data);
            } catch (syncErr) {
              console.error("Sync error:", syncErr);
            }
          }
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [user]);

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin' || user?.email === 'av4991986@gmail.com',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
