import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authChecked: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  authChecked: false,
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (isMounted) {
          if (error) {
            console.error('AuthContext: Session error:', error);
            setUser(null);
          } else {
            setUser(session?.user ?? null);
          }
          setAuthChecked(true);
          // Ensure loading is false only after the check is complete
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('AuthContext: Unexpected error getting session:', err);
          setUser(null);
          setAuthChecked(true);
          setLoading(false);
        }
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
        // This is important for when the user signs in/out in another tab
        if (!authChecked) {
          setAuthChecked(true);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    authChecked,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
