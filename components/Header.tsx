import { useMemo, useState, useEffect } from 'react';
import { ShoppingCart, User, LogOut, UserPlus, Settings, Menu, X, Activity, Heart, Droplet, Bone, Thermometer, Leaf, Shield, Zap, Baby, Eye, CircleDot, Package, Sparkles, Coffee, Wind, TestTube } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart, type Product } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';
import { Language } from '../utils/i18n';
import { SmartSearch } from './SmartSearch';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  currentStore: 'china' | 'thailand' | 'vietnam';
  onStoreChange: (store: 'china' | 'thailand' | 'vietnam') => void;
  onProductClick?: (product: Product) => void;
  onSelectDisease?: (disease: string | null) => void;
  onSelectCategory?: (category: string | null) => void;
}

export const Header = ({ onNavigate, currentPage, currentStore, onStoreChange, onProductClick, onSelectDisease, onSelectCategory }: HeaderProps) => {
  const { language, setLanguage, t, currentLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const { totalItemsCount } = useCart();
  const { currentTheme } = useTheme();
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false);
  const [sidebarCategories, setSidebarCategories] = useState<any[]>([]);

  const languages: { code: Language; flag: string }[] = [
    { code: 'ru', flag: '🇷🇺' },
    { code: 'en', flag: '🇬🇧' },
    { code: 'zh', flag: '🇨🇳' },
    { code: 'vi', flag: '🇻🇳' },
  ];

  // Icon mapping for sidebar categories
  const ICON_MAP: Record<string, any> = {
    Activity, Heart, Droplet, Bone, Thermometer, Leaf, Shield, Zap, Baby, Eye, CircleDot, Package, Sparkles, Coffee, Wind, TestTube,
    User: ({ size }: { size?: number }) => (
      <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
        <path d="M8 11 L6 15"></path>
        <path d="M16 11 L18 15"></path>
      </svg>
    ),
  };

  // Load sidebar categories from localStorage
  useEffect(() => {
    const loadSidebarCategories = () => {
      const storedCategories = localStorage.getItem('categories');
      if (storedCategories) {
        try {
          const parsed = JSON.parse(storedCategories);
          console.log('📱 Header: Loading categories from localStorage', parsed);
          if (parsed.sidebar && Array.isArray(parsed.sidebar)) {
            console.log('📱 Header: Setting sidebar categories', parsed.sidebar.length, 'items');
            setSidebarCategories(parsed.sidebar);
          } else {
            console.warn('📱 Header: No sidebar array found in categories');
          }
        } catch (error) {
          console.error('📱 Header: Error loading sidebar categories:', error);
        }
      } else {
        console.warn('📱 Header: No categories in localStorage');
      }
    };
    
    loadSidebarCategories();
    
    const handleCategoriesUpdate = () => {
      loadSidebarCategories();
    };
    
    window.addEventListener('categoriesUpdated', handleCategoriesUpdate);
    window.addEventListener('storage', handleCategoriesUpdate);
    
    return () => {
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdate);
      window.removeEventListener('storage', handleCategoriesUpdate);
    };
  }, []);

  // Мемоизируем stores, чтобы они пересоздавались при изменении языка
  const stores = useMemo(() => [
    { id: 'china' as const, label: t('chinaStore'), flag: '🇨🇳' },
    { id: 'thailand' as const, label: t('thailandStore'), flag: '🇹🇭' },
    { id: 'vietnam' as const, label: t('vietnamStore'), flag: '🇻🇳' },
  ], [t]);

  const cartItemsCount = totalItemsCount;

  // Функция для получения декорации логотипа в зависимости от темы
  const getLogoDecoration = () => {
    switch (currentTheme) {
      case 'new-year':
        return <span className="ml-2 text-3xl">❄️</span>;
      case 'womens-day':
        return <span className="ml-2 text-3xl">🌷</span>;
      case 'autumn':
        return <span className="ml-2 text-3xl">🍁</span>;
      case 'defenders-day':
        return <span className="ml-2 text-2xl">⭐🎗️</span>;
      case 'summer':
        return <span className="ml-2 text-3xl">☀️</span>;
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b-4 border-red-600 shadow-md sticky top-0 z-50">
      {/* Top bar with language selector - Desktop only */}
      <div className="hidden md:block bg-red-600 text-white py-2">
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

      {/* Main header content */}
      <div className="container mx-auto px-4 py-3">
        
        {/* ========== MOBILE VERSION - 3 ROWS ========== */}
        <div className="md:hidden flex flex-col">
          
          {/* ROW 1: Logo + Name + Language Button */}
          <div className="flex items-center justify-between pb-8">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-3"
            >
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg flex-shrink-0">
                <span className="text-4xl">中</span>
              </div>
              <div className="flex items-center">
                <h1 
                  className="text-red-600 text-4xl whitespace-nowrap"
                  style={{ fontFamily: "'Marck Script', cursive" }}
                >
                  Азия Фарм
                </h1>
                {getLogoDecoration()}
              </div>
            </button>
            
            <div className="relative">
              <button
                onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-md flex-shrink-0"
              >
                <span className="text-3xl">
                  {languages.find(l => l.code === language)?.flag}
                </span>
              </button>

              {languageMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-16 bg-white rounded-lg shadow-lg border-2 border-red-600 overflow-hidden z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setLanguageMenuOpen(false);
                      }}
                      className={`w-full h-16 flex items-center justify-center hover:bg-red-50 transition-colors ${
                        language === lang.code ? 'bg-red-100' : ''
                      }`}
                    >
                      <span className="text-2xl">{lang.flag}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ROW 2: Store Buttons */}
          <div className="flex gap-2 pb-8">
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => {
                  onStoreChange(store.id);
                  onNavigate('home');
                }}
                className={`store-button flex-1 px-3 py-4 rounded-lg transition-all flex items-center justify-center text-center ${
                  currentStore === store.id
                    ? 'bg-red-600 text-white shadow-md border-2 border-red-600'
                    : 'border-2 border-red-600 text-red-600 hover:bg-red-50'
                }`}
              >
                <span className="text-[16px]">{store.label}</span>
              </button>
            ))}
          </div>

          {/* ROW 3: Burger + Login + Search */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarMenuOpen(!sidebarMenuOpen)}
              className="mobile-burger-button h-12 w-12 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
              aria-label="Menu"
            >
              {sidebarMenuOpen ? <X size={24} strokeWidth={2.5} className="mobile-burger-icon" /> : <Menu size={24} strokeWidth={2.5} className="mobile-burger-icon" />}
            </button>
            
            <button
              onClick={() => user ? onNavigate('profile') : onNavigate('login')}
              className="h-12 w-12 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center flex-shrink-0"
            >
              <User size={24} strokeWidth={2} />
            </button>
            
            <div className="flex-1 h-12">
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

        {/* ========== DESKTOP VERSION ========== */}
        <div className="hidden md:flex items-center justify-between gap-4">
          {/* Logo with beautiful Chinese font */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">
              <span className="text-3xl">中</span>
            </div>
            <div className="flex items-center">
              <h1 
                className="text-red-600 text-5xl leading-tight tracking-wide font-russian"
                style={{ 
                  fontFamily: "'Marck Script', cursive" 
                }}
              >
                Азия Фарм
              </h1>
              {getLogoDecoration()}
            </div>
          </button>

          {/* Smart Search - Desktop */}
          <div className="flex-1 max-w-2xl">
            <SmartSearch 
              onProductClick={(product) => {
                if (onProductClick) {
                  onProductClick(product);
                }
              }}
            />
          </div>

          {/* Actions - Desktop */}
          <div className="flex items-center gap-4">
            {/* Cart - Desktop only */}
            <button
              onClick={() => onNavigate('cart')}
              className={`relative p-2 rounded-lg transition-colors ${
                currentPage === 'cart'
                  ? 'bg-red-600 text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              <ShoppingCart size={24} strokeWidth={1.5} data-cart-icon />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* User menu - Desktop */}
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
                  <User size={20} strokeWidth={1.5} />
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
                    <Settings size={20} strokeWidth={1.5} />
                  </button>
                )}

                <button
                  onClick={logout}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={t('logout')}
                >
                  <LogOut size={20} strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => onNavigate('login')}
                  className="flex items-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <User size={18} strokeWidth={1.5} />
                  <span className="hidden lg:inline">{t('login')}</span>
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <UserPlus size={18} strokeWidth={1.5} />
                  <span className="hidden lg:inline">{t('register')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Store Selector */}
        <div className="hidden md:flex gap-2 mt-4">
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => {
                onStoreChange(store.id);
                onNavigate('home');
              }}
              className={`store-button px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                currentStore === store.id
                  ? 'bg-red-600 text-white shadow-md border-2 border-red-600 active'
                  : 'border-2 border-red-600 text-red-600 hover:bg-red-50'
              }`}
            >
              <span className="text-lg">{store.flag}</span>
              <span className="text-sm whitespace-nowrap">{store.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile sidebar menu - disease categories */}
      {sidebarMenuOpen && (
        <div className="mobile-sidebar-menu md:hidden bg-white border-t-2 border-gray-200 shadow-lg">
          <div className="container mx-auto px-4 py-4 max-h-[70vh] overflow-y-auto">
            <h3 className="mobile-categories-title text-xl font-semibold text-gray-800 mb-3 px-1">{t('categories')}</h3>
            <div className="space-y-1">
              {sidebarCategories.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>{t('noCategories') || 'Категории не загружены'}</p>
                  <p className="text-sm mt-2">Обновите страницу или настройте категории в админ панели</p>
                </div>
              )}
              {sidebarCategories.map((category) => {
                const IconComponent = ICON_MAP[category.icon || 'Package'];
                const label = category.translations?.[currentLanguage] || category.translations?.ru || category.id;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      if (onSelectDisease) {
                        onSelectDisease(category.id);
                        onNavigate('home');
                      }
                      setSidebarMenuOpen(false);
                    }}
                    className="mobile-category-item w-full flex items-center gap-3 px-4 py-3.5 rounded-lg hover:bg-red-50 transition-colors text-left group"
                  >
                    <div className="mobile-category-icon text-red-600 group-hover:scale-110 transition-transform flex-shrink-0">
                      {IconComponent && <IconComponent size={22} strokeWidth={1.67} />}
                    </div>
                    <span className="mobile-category-label text-gray-700 group-hover:text-red-600 transition-colors text-lg">
                      {label}
                    </span>
                  </button>
                );
              })}
              
              {/* Add Samples category at the bottom for China store only */}
              {currentStore === 'china' && (
                <button
                  onClick={() => {
                    // Samples is a product category, not a disease category
                    if (onSelectCategory) {
                      onSelectCategory('samples');
                    }
                    // Disease filter is automatically cleared by handleCategorySelect in App.tsx
                    onNavigate('home');
                    setSidebarMenuOpen(false);
                  }}
                  className="mobile-category-item w-full flex items-center gap-3 px-4 py-3.5 rounded-lg hover:bg-red-50 transition-colors text-left group border-t-2 border-gray-200 mt-2 pt-4"
                >
                  <div className="mobile-category-icon text-red-600 group-hover:scale-110 transition-transform flex-shrink-0">
                    <TestTube size={22} strokeWidth={1.67} />
                  </div>
                  <span className="mobile-category-label text-gray-700 group-hover:text-red-600 transition-colors text-lg">
                    {t('samples')}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
