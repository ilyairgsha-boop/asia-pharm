import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Home } from 'lucide-react';

interface AuthProps {
  mode: 'login' | 'register';
  onNavigate: (page: string) => void;
}

export const Auth = ({ mode, onNavigate }: AuthProps) => {
  const { t, language, setLanguage } = useLanguage();
  const { login, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [selectedLanguage, setSelectedLanguage] = useState(language);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        onNavigate('home');
      } else {
        if (formData.password !== formData.confirmPassword) {
          alert('Passwords do not match');
          setLoading(false);
          return;
        }
        await register(formData.email, formData.password, formData.name, selectedLanguage);
        onNavigate('home');
      }
    } catch (error: any) {
      console.warn('⚠️ Auth error:', error);
      alert(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="auth-logo w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-4">
            中
          </div>
          <h2 className="text-gray-800">
            {isLogin ? t('signIn') : t('signUp')}
          </h2>
        </div>

        <div className="auth-container bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Language Selector - for both login and register */}
            <div>
              <label className="block text-gray-700 mb-2">
                {t('chooseLanguage')} *
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  const newLang = e.target.value as 'ru' | 'en' | 'zh' | 'vi';
                  setSelectedLanguage(newLang);
                  setLanguage(newLang);
                }}
                className="auth-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="ru">🇷🇺 Русский</option>
                <option value="en">🇬🇧 English</option>
                <option value="zh">🇨🇳 中文</option>
                <option value="vi">🇻🇳 Tiếng Việt</option>
              </select>
            </div>
            
            {!isLogin && (
              <div>
                <label className="block text-gray-700 mb-2">
                  {t('fullName')} *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required={!isLogin}
                  className="auth-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            )}

            <div>
              <label className="block text-gray-700 mb-2">
                {t('email')} *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="auth-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                {t('password')} *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="auth-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-gray-700 mb-2">
                  {t('confirmPassword')} *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required={!isLogin}
                  className="auth-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{isLogin ? t('signIn') : t('signUp')}</span>
              )}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className={`${isLogin ? 'auth-no-account' : 'auth-have-account'} text-red-600 hover:underline`}
              >
                {isLogin ? t('noAccount') : t('haveAccount')}
              </button>
            </div>
            <div className="text-center">
              <button
                onClick={() => onNavigate('home')}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <Home size={18} />
                <span>{t('backToHome')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};