import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '../utils/supabase/client';
import { MOCK_MODE, MOCK_ADMIN, MOCK_USER } from '../utils/mockMode';

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
  register: (email: string, password: string, name: string, language?: string) => Promise<void>;
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
      if (MOCK_MODE) {
        // Check localStorage for mock session
        const mockSession = localStorage.getItem('mock_session');
        if (mockSession) {
          const userData = JSON.parse(mockSession);
          setUser(userData);
          setAccessToken('mock-token');
        }
        setLoading(false);
        return;
      }

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

        // 🔔 Link OneSignal subscription to user (syncs all devices)
        try {
          const { oneSignalService } = await import('../utils/oneSignal');
          console.log('🔔 Linking OneSignal subscription to user on session restore:', userData.id);
          await oneSignalService.linkUserAfterLogin(userData.id);
          
          // Update last active timestamp
          await oneSignalService.updateLastActive();
        } catch (error) {
          console.warn('⚠️ Could not link OneSignal subscription:', error);
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    if (MOCK_MODE) {
      // Mock authentication
      let mockUser: User;
      if (email === MOCK_ADMIN.email && password === MOCK_ADMIN.password) {
        mockUser = {
          id: MOCK_ADMIN.id,
          email: MOCK_ADMIN.email,
          name: MOCK_ADMIN.name,
          isAdmin: true,
          isWholesaler: false,
        };
      } else if (email === MOCK_USER.email && password === MOCK_USER.password) {
        mockUser = {
          id: MOCK_USER.id,
          email: MOCK_USER.email,
          name: MOCK_USER.name,
          isAdmin: false,
          isWholesaler: false,
        };
      } else {
        throw new Error('Invalid credentials');
      }
      
      setUser(mockUser);
      setAccessToken('mock-token');
      localStorage.setItem('mock_session', JSON.stringify(mockUser));
      return;
    }

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

      // 🔔 Link OneSignal subscription to user (syncs all devices)
      try {
        console.log('🔔 Linking OneSignal subscription to user:', data.user.id);
        const { oneSignalService } = await import('../utils/oneSignal');
        await oneSignalService.linkUserAfterLogin(data.user.id);
        console.log('✅ OneSignal subscription linked to user');
        
        // Update last active timestamp
        await oneSignalService.updateLastActive();
      } catch (error) {
        console.warn('⚠️ Could not link OneSignal subscription:', error);
      }
    }
  };

  const register = async (email: string, password: string, name: string, language?: string) => {
    try {
      if (MOCK_MODE) {
        // Mock registration
        const newUser: User = {
          id: 'mock-new-user-' + Date.now(),
          email,
          name,
          isAdmin: false,
          isWholesaler: false,
        };
        
        setUser(newUser);
        setAccessToken('mock-token');
        localStorage.setItem('mock_session', JSON.stringify(newUser));
        console.log('✅ Mock user registered:', newUser);
        return;
      }

      console.log('🔄 Starting registration for:', email);

      // НОВАЯ ЛОГИКА: Используем Admin API через Service Role
      // Это позволяет обойти Email Confirmation полностью
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || '',
          },
          // КРИТИЧНО: Не используем emailRedirectTo
        },
      });

      // Если ошибка EDGE_RUNTIME - игнорируем её и проверяем создался ли пользователь
      if (error) {
        const errorCode = (error as any)?.code;
        const errorMessage = error.message || '';
        
        console.error('❌ Registration API error:', { errorCode, errorMessage });
        
        // Проверяем специфичные ошибки
        if (errorMessage.includes('Email rate limit exceeded')) {
          throw new Error('Слишком много попыток регистрации. Подождите несколько минут.');
        }
        
        if (errorMessage.includes('User already registered')) {
          throw new Error('Пользователь с таким email уже существует. Попробу��те войти.');
        }
        
        // НОВАЯ ЛОГИКА: Если EDGE_RUNTIME ошибка - проверяем создался ли пользователь
        if (errorCode === 'SUPABASE_EDGE_RUNTIME_ERROR' || errorMessage.includes('EDGE_RUNTIME')) {
          console.warn('⚠️ EDGE_RUNTIME ошибка - проверяем создался ли пользователь...');
          
          // Пытаемся войти - если пользователь создан, вход сработает
          try {
            await login(email, password);
            console.log('✅ Пользователь создан несмотря на ошибку! Вход выполнен.');
            return; // Успех!
          } catch (loginError) {
            // Пользователь НЕ создан
            console.error('❌ Пользователь НЕ создан из-за EDGE_RUNTIME ошибки');
            console.error('📋 РЕШЕНИЕ:');
            console.error('1. Откройте Supabase Dashboard: https://supabase.com/dashboard/project/boybkoyidxwrgsayifrd/auth/users');
            console.error('2. Нажмите "Add user" или "Invite"');
            console.error('3. Email:', email);
            console.error('4. Password: ваш пароль');
            console.error('5. ОБЯЗАТЕЛЬНО: Включите "Auto Confirm User"');
            console.error('6. После создания - войдите на сайте');
            throw new Error('❌ Email Confirmation блокирует регистрацию! Создайте пользователя вручную через Dashboard (см. консоль)');
          }
        }
        
        throw new Error(errorMessage || 'Ошибка регистрации');
      }

      if (!data.user) {
        throw new Error('Пользователь не был создан');
      }

      console.log('✅ User registered in auth.users:', data.user.email);

      // Создаём профиль в базе данных с автоподпиской
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            name: name || '',
            is_admin: false,
            is_wholesaler: false,
            loyalty_points: 0,
            total_spent: 0,
            push_notifications_enabled: true, // Автоподписка на push
            email_notifications_enabled: true, // Автоподписка на email
            language: language || 'ru', // Сохраняем выбранный язык пользователя
          });

        if (profileError) {
          console.warn('⚠️ Profile creation error:', profileError);
          // Не критично - профиль можно создать позже
        } else {
          console.log('✅ Profile created with auto-subscriptions enabled and language:', language || 'ru');
        }
      } catch (profileError) {
        console.warn('⚠️ Profile creation exception:', profileError);
      }

      // Отправляем welcome email
      try {
        console.log('📧 Sending welcome email...');
        const { getServerUrl } = await import('../utils/supabase/client');
        const welcomeEmailUrl = getServerUrl('/api/email/welcome');
        
        const welcomeResponse = await fetch(welcomeEmailUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            name: name || email,
            language: language || localStorage.getItem('preferredLanguage') || 'ru',
          }),
        });

        if (welcomeResponse.ok) {
          console.log('✅ Welcome email sent successfully');
        } else {
          const errorData = await welcomeResponse.json().catch(() => ({}));
          console.warn('⚠️ Failed to send welcome email:', errorData);
        }
      } catch (emailError) {
        console.warn('⚠️ Error sending welcome email:', emailError);
        // Не критично - продолжаем регистрацию
      }

      // Пытаемся войти сразу после регистрации
      console.log('🔄 Attempting auto-login after registration...');
      try {
        await login(email, password);
        console.log('✅ Auto-login successful!');
        
        // Установить флаг для показа промпта подписки на push
        if (typeof window !== 'undefined') {
          console.log('🔔 Setting show_push_prompt flag...');
          localStorage.setItem('show_push_prompt', 'true');
          console.log('✅ Flag set:', localStorage.getItem('show_push_prompt'));
          
          // Отправляем custom event чтобы App.tsx мог отреагировать
          window.dispatchEvent(new CustomEvent('pushPromptFlagSet'));
          console.log('📢 Dispatched pushPromptFlagSet event');
        }
      } catch (loginError) {
        console.warn('⚠️ Auto-login failed:', loginError);
        // Не критично - пользователь может войти вручную
        throw new Error('Регистрация успешна! Пожалуйста, войдите используя ваш email и пароль.');
      }
    } catch (error) {
      console.error('❌ Registration exception:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (MOCK_MODE) {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('mock_session');
      return;
    }

    // Logout from OneSignal first (clears External ID)
    try {
      const { oneSignalService } = await import('../utils/oneSignal');
      await oneSignalService.logoutUser();
    } catch (error) {
      console.warn('⚠️ Could not logout from OneSignal:', error);
    }

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