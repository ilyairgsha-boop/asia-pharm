import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient, getServerUrl } from '../utils/supabase/client';
import { publicAnonKey } from '../utils/supabase/info';

interface User {
  id: string;
  email: string;
  name?: string;
  isAdmin?: boolean;
  isWholesaler?: boolean;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setAccessToken(session.access_token);
        const userData = session.user;
        
        // Check profile in database for admin status
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin, is_wholesaler, name')
          .eq('id', userData.id)
          .maybeSingle();
        
        setUser({
          id: userData.id,
          email: userData.email!,
          name: profile?.name || userData.user_metadata?.name,
          isAdmin: profile?.is_admin || false,
          isWholesaler: profile?.is_wholesaler || false,
        });
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.session) {
      setAccessToken(data.session.access_token);
      
      // Check profile in database for admin status
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_wholesaler, name')
        .eq('id', data.user.id)
        .maybeSingle();
      
      setUser({
        id: data.user.id,
        email: data.user.email!,
        name: profile?.name || data.user.user_metadata?.name,
        isAdmin: profile?.is_admin || false,
        isWholesaler: profile?.is_wholesaler || false,
      });
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch(getServerUrl('/signup'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password, name }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Registration error:', result);
        throw new Error(result.error || 'Registration failed');
      }

      // После регистрации сразу входим
      await login(email, password);
    } catch (error) {
      console.error('Registration exception:', error);
      throw error;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};