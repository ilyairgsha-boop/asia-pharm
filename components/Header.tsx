import { useMemo } from 'react';
import { ShoppingCart, User, LogOut, UserPlus, Settings } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Language } from '../utils/i18n';
import { SmartSearch } from './SmartSearch';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  currentStore: 'china' | 'thailand' | 'vietnam';
  onStoreChange: (store: 'china' | 'thailand' | 'vietnam') => void;
  onProductClick?: (product: any) => void;
}

export const Header = ({ onNavigate, currentPage, currentStore, onStoreChange, onProductClick }: HeaderProps) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const { totalItemsCount } = useCart();

  const languages: { code: Language; flag: string }[] = [
    { code: 'ru', flag: '🇷🇺' },
    { code: 'en', flag: '🇬🇧' },
    { code: 'zh', flag: '🇨🇳' },
    { code: 'vi', flag: '🇻🇳' },
  ];

  // Мемоизируем stores, чтобы они пересоздавались при изменении языка
  const stores = useMemo(() => [
    { id: 'china' as const, label: t('chinaStore'), flag: '🇨🇳' },
    { id: 'thailand' as const, label: t('thailandStore'), flag: '🇹🇭' },
    { id: 'vietnam' as const, label: t('vietnamStore'), flag: '🇻🇳' },
  ], [t]);

  const cartItemsCount = totalItemsCount;

  return (
    <header className="bg-white border-b-4 border-red-600 shadow-md sticky top-0 z-50">
      {/* Top bar with language selector */}
      <div className="bg-red-600 text-white py-2">
        <div className="container mx-auto px-4 flex justify-end items-center">
          {/* Language switcher - only flags */}
          <div className="flex gap-3 items-center">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`transition-all duration-200 hover:scale-110 ${
                  language === lang.code
                    ? 'scale-125'
                    : 'scale-100 opacity-70 hover:opacity-100'
                }`}
                title={lang.code.toUpperCase()}
              >
                <span className="text-2xl">{lang.flag}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-4">
          {/* Top row: Logo, Search, Actions */}
          <div className="flex items-center justify-between gap-4">
            {/* Logo with beautiful Chinese font */}
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0"
            >
              <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">
                <span className="text-3xl">中</span>
              </div>
              <div>
                <h1 
                  className={`text-red-600 text-4xl md:text-5xl leading-tight tracking-wide ${
                    language === 'ru' ? 'font-russian' : 'font-chinese'
                  }`}
                  style={{ 
                    fontFamily: language === 'ru' 
                      ? "'Marck Script', cursive" 
                      : "'Ma Shan Zheng', cursive" 
                  }}
                >
                  {t('siteName')}
                </h1>
              </div>
            </button>

            {/* Smart Search */}
            <div className="flex-1 max-w-2xl hidden md:block">
              <SmartSearch 
                onProductClick={(product) => {
                  if (onProductClick) {
                    onProductClick(product);
                  }
                }}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Cart */}
              <button
                onClick={() => onNavigate('cart')}
                className={`relative p-2 rounded-lg transition-colors ${
                  currentPage === 'cart'
                    ? 'bg-red-600 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                <ShoppingCart size={24} />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {cartItemsCount}
                  </span>
                )}
              </button>

              {/* User menu */}
              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('profile')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      currentPage === 'profile'
                        ? 'bg-red-600 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <User size={20} />
                    <span className="hidden lg:inline">{user.name || user.email || t('user')}</span>
                  </button>

                  {user.isAdmin && (
                    <button
                      onClick={() => onNavigate('admin')}
                      className={`p-2 rounded-lg transition-colors ${
                        currentPage === 'admin'
                          ? 'bg-red-600 text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <Settings size={20} />
                    </button>
                  )}

                  <button
                    onClick={logout}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={t('logout')}
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => onNavigate('login')}
                    className="flex items-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <User size={20} />
                    <span className="hidden lg:inline">{t('login')}</span>
                  </button>
                  <button
                    onClick={() => onNavigate('register')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <UserPlus size={20} />
                    <span className="hidden lg:inline">{t('register')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom row: Store selector */}
          <div className="flex gap-2 justify-center">
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => {
                  onStoreChange(store.id);
                  onNavigate('home');
                }}
                className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                  currentStore === store.id
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-lg">{store.flag}</span>
                <span>{store.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile search */}
          <div className="md:hidden">
            <SmartSearch 
              onProductClick={(product) => {
                if (onProductClick) {
                  onProductClick(product);
                }
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
