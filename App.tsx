import { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider, useCart, type StoreType, type Product } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Header } from './components/Header';
import { CategoryMenu } from './components/CategoryMenu';
import { DiseaseSidebar } from './components/DiseaseSidebar';
import { HomePage } from './components/HomePage';
import { CartMultiStore } from './components/CartMultiStore';
import { CheckoutNew } from './components/CheckoutNew';
import { PaymentInfo } from './components/PaymentInfo';
import { Auth } from './components/Auth';
import { ProfileNew } from './components/ProfileNew';
import { AdminPanelNew } from './components/admin/AdminPanelNew';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { LoyaltyProgram } from './components/LoyaltyProgram';
import { LiveChat } from './components/LiveChat';
import { CookieConsent } from './components/CookieConsent';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { CreateAdminPage } from './components/CreateAdminPage';
import { PopUpModal } from './components/PopUpModal';
import { ThemeDecorations } from './components/ThemeDecorations';
import { Footer } from './components/Footer';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';
import { DatabaseStatus } from './components/DatabaseStatus';
import { MOCK_MODE } from './utils/mockMode';
import { oneSignalService } from './utils/oneSignal';
import { createClient, getAnonKey, getServerUrl } from './utils/supabase/client';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<string | null>('popular'); // Default to "popular"
  const [currentStore, setCurrentStore] = useState<StoreType>('china');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [pushNavigationParams, setPushNavigationParams] = useState<{ orderId?: string; tab?: string } | null>(null);
  const { user, loading } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const { totalItemsCount } = useCart();
  
  // Read URL parameters synchronously on mount (Safari compatibility)
  const [sharedProductId] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('product');
    } catch (e) {
      // Fallback for older browsers
      const searchParams = window.location.search;
      const match = searchParams.match(/[?&]product=([^&]+)/);
      return match ? match[1] : null;
    }
  });

  // Handle hash navigation with query parameters (for push notifications)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove '#'
      
      if (!hash) {
        setCurrentPage('home');
        setPushNavigationParams(null);
        return;
      }
      
      // Check if hash contains query parameters
      // Format: #profile?order=xxx or #profile?tab=loyalty
      const [page, queryString] = hash.split('?');
      
      if (queryString) {
        const params = new URLSearchParams(queryString);
        const orderId = params.get('order');
        const tab = params.get('tab');
        
        console.log('🔗 Push navigation detected:', { page, orderId, tab });
        
        setPushNavigationParams({ orderId: orderId || undefined, tab: tab || undefined });
        setCurrentPage(page || 'home');
      } else if (page.startsWith('payment-')) {
        // Handle payment page navigation: #payment-{orderId}
        const orderId = page.replace('payment-', '');
        console.log('🔗 Payment navigation detected:', { orderId });
        setPushNavigationParams({ orderId });
        setCurrentPage('payment-info');
      } else {
        setCurrentPage(page || 'home');
        setPushNavigationParams(null);
      }
    };

    // Handle initial hash on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Handlers for exclusive category selection
  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setSelectedDisease(null); // Clear disease selection when category is selected
  };

  const handleDiseaseSelect = (disease: string | null) => {
    setSelectedDisease(disease);
    setSelectedCategory(null); // Clear category selection when disease is selected
  };

  // Perform environment and health checks on mount
  useEffect(() => {
    console.log('🚀 Asia Pharm - Starting application... v2.2.8-SETTINGS-SYNC');
    
    if (MOCK_MODE) {
      console.log('');
      console.log('╔════════════════════════════════════════════╗');
      console.log('║  🔧 MOCK MODE АКТИВЕН                     ║');
      console.log('║  Работа БЕЗ базы данных Supabase          ║');
      console.log('║                                            ║');
      console.log('║  Тестовые учетные данные:                 ║');
      console.log('║  Админ: admin@asia-pharm.com / admin123   ║');
      console.log('║  Юзер:  user@test.com / user123           ║');
      console.log('╚════════════════════════════════════════════╝');
      console.log('');
      console.log('📖 См. LOCAL_DEVELOPMENT.md для деталей');
      return;
    }

    console.log('📦 Project ID: boybkoyidxwrgsayifrd');
    console.log('🔗 Edge Function: https://boybkoyidxwrgsayifrd.supabase.co/functions/v1/make-server-a75b5353/');
    console.log('💡 Test Edge Function directly: https://boybkoyidxwrgsayifrd.supabase.co/functions/v1/make-server-a75b5353/test/db');
    
    // ✅ ВАЖНО: Очищаем старый кэш товаров при загрузке
    // Это исправляет проблему с неправильной структурой данных
    try {
      const oldCache = sessionStorage.getItem('asia_pharm_products_cache');
      if (oldCache) {
        const parsed = JSON.parse(oldCache);
        // Проверяем версию кэша - если стара��, удаляем
        if (parsed.version !== '1.0') {
          sessionStorage.removeItem('asia_pharm_products_cache');
          console.log('🗑️ Cleared old product cache');
        }
      }
    } catch (e) {
      // Если ошибка парсинга - точно старый формат
      sessionStorage.removeItem('asia_pharm_products_cache');
      console.log('🗑️ Cleared corrupted product cache');
    }
    
    // Initialize OneSignal from localStorage
    const initOneSignal = async () => {
      try {
        if (oneSignalService.isEnabled()) {
          console.log('🔔 Initializing OneSignal SDK...');
          await oneSignalService.initializeSDK();
          console.log('✅ OneSignal SDK initialized');
        } else {
          console.log('ℹ️ OneSignal not enabled');
        }
      } catch (error) {
        console.error('❌ OneSignal init failed:', error);
      }
    };
    
    initOneSignal();
    
    // Listen for OneSignal settings changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'oneSignalSettings') {
        console.log('🔄 OneSignal settings changed, please refresh page');
        oneSignalService.reloadSettings();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    const handleSettingsUpdate = () => {
      console.log('🔄 OneSignal settings updated');
      oneSignalService.reloadSettings();
    };
    
    window.addEventListener('oneSignalSettingsUpdated', handleSettingsUpdate);
    
    // Debug tools
    if (typeof window !== 'undefined') {
      (window as any).oneSignalService = oneSignalService;
      (window as any).testPushPrompt = () => setShowPushPrompt(true);
      console.log('💡 Debug: window.oneSignalService, window.testPushPrompt()');
    }
    
    // Cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('oneSignalSettingsUpdated', handleSettingsUpdate);
    };
  }, []);

  // Log when showPushPrompt changes
  useEffect(() => {
    console.log('🔔 showPushPrompt state changed:', showPushPrompt);
  }, [showPushPrompt]);

  // Listen for custom event when push prompt flag is set
  useEffect(() => {
    const handlePushPromptFlag = () => {
      console.log('📢 Received pushPromptFlagSet event!');
      
      if (user && !loading) {
        console.log('✅ User is logged in, checking OneSignal...');
        
        const checkAndShowPrompt = async () => {
          try {
            console.log('⏳ Waiting 1.5s for OneSignal initialization...');
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            console.log('🔍 Checking if OneSignal is enabled...');
            const isEnabled = oneSignalService.isEnabled();
            console.log('OneSignal enabled:', isEnabled);
            
            if (isEnabled) {
              console.log('✅ OneSignal enabled, showing push prompt NOW');
              setShowPushPrompt(true);
            } else {
              console.warn('⚠️ OneSignal not enabled, skipping push prompt');
              localStorage.removeItem('show_push_prompt');
            }
          } catch (error) {
            console.error('❌ Error checking OneSignal:', error);
            localStorage.removeItem('show_push_prompt');
          }
        };
        
        checkAndShowPrompt();
      }
    };
    
    window.addEventListener('pushPromptFlagSet', handlePushPromptFlag);
    
    return () => {
      window.removeEventListener('pushPromptFlagSet', handlePushPromptFlag);
    };
  }, [user, loading]);

  // Auto-show push prompt for logged in users who haven't subscribed yet
  useEffect(() => {
    if (user && !loading) {
      // Wait for OneSignal to initialize
      const checkSubscription = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
          
          if (!oneSignalService.isEnabled()) {
            console.log('ℹ️ OneSignal not enabled, skipping auto-prompt');
            return;
          }
          
          // Check if user is already subscribed
          const isSubscribed = await oneSignalService.isSubscribed();
          console.log('🔍 Auto-check: User subscribed?', isSubscribed);
          
          if (!isSubscribed) {
            // Check if we've shown the prompt before
            const promptShownBefore = localStorage.getItem('push_prompt_shown');
            if (!promptShownBefore) {
              console.log('🔔 User not subscribed, showing auto-prompt...');
              setShowPushPrompt(true);
              localStorage.setItem('push_prompt_shown', 'true');
            } else {
              console.log('ℹ️ Prompt was shown before, not showing again');
            }
          }
        } catch (error) {
          console.error('❌ Error checking subscription:', error);
        }
      };
      
      checkSubscription();
    }
  }, [user, loading]);

  // Check for push prompt flag after user login
  useEffect(() => {
    console.log('🔍 Push prompt useEffect triggered:', { 
      user: user?.email, 
      loading,
      flag: localStorage.getItem('show_push_prompt')
    });
    
    if (user && !loading) {
      // Проверяем флаг с небольшой задержкой, чтобы дать время на установку флага
      const checkPromptFlag = () => {
        const shouldShowPrompt = localStorage.getItem('show_push_prompt');
        console.log('🔔 Checking push prompt flag:', shouldShowPrompt);
        
        if (shouldShowPrompt === 'true') {
          console.log('✅ Flag is true, preparing to show prompt...');
          
          // Wait for OneSignal to initialize and check if enabled
          const checkAndShowPrompt = async () => {
            try {
              console.log('⏳ Waiting 1.5s for OneSignal initialization...');
              // Wait for OneSignal to be ready
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              // Check if OneSignal is configured
              console.log('🔍 Checking if OneSignal is enabled...');
              const isEnabled = oneSignalService.isEnabled();
              console.log('OneSignal enabled:', isEnabled);
              
              if (isEnabled) {
                console.log('✅ OneSignal enabled, showing push prompt NOW');
                setShowPushPrompt(true);
              } else {
                console.warn('⚠️ OneSignal not enabled, skipping push prompt');
                // Remove flag if OneSignal is not enabled
                localStorage.removeItem('show_push_prompt');
              }
            } catch (error) {
              console.error('❌ Error checking OneSignal:', error);
              // Remove flag on error
              localStorage.removeItem('show_push_prompt');
            }
          };
          
          checkAndShowPrompt();
        } else {
          console.log('ℹ️ No push prompt flag or flag is not "true"');
        }
      };
      
      // Проверяем сразу
      checkPromptFlag();
      
      // И проверяем еще раз через 500ms (на случай если флаг установится позже)
      const timeoutId = setTimeout(() => {
        console.log('🔄 Rechecking push prompt flag after delay...');
        checkPromptFlag();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      console.log('ℹ️ Conditions not met: user=' + !!user + ', loading=' + loading);
    }
  }, [user, loading]);

  // Handle shared product URL on mount
  useEffect(() => {
    if (!sharedProductId) return;
    
    console.log('🔗 Shared product link detected:', sharedProductId);
    
    const loadSharedProduct = async () => {
      try {
        const supabase = createClient();
        const { data: product, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', sharedProductId)
          .single();
        
        if (error) {
          console.error('❌ Error fetching shared product:', error);
          toast.error(t('productNotFound') || 'Товар не найден');
        } else if (product) {
          console.log('✅ Shared product loaded:', product.name);
          
          // Map database fields (snake_case) to TypeScript interface (camelCase)
          const mappedProduct: Product = {
            ...product,
            inStock: product.in_stock ?? true, // Map in_stock to inStock with fallback
            isSample: product.is_sample ?? false,
            wholesalePrice: product.wholesale_price,
            saleEnabled: product.sale_enabled ?? false,
            saleDiscount: product.sale_discount ?? 0,
            saleEndDate: product.sale_end_date ?? null,
            shortDescription: product.short_description || product.description || '',
            shortDescription_en: product.short_description_en || product.description_en || '',
            shortDescription_zh: product.short_description_zh || product.description_zh || '',
            shortDescription_vi: product.short_description_vi || product.description_vi || '',
          };
          
          setSelectedProduct(mappedProduct);
          
          // Remove product parameter from URL without reloading (Safari compatible)
          try {
            const newUrl = window.location.pathname + window.location.hash;
            if (window.history && window.history.replaceState) {
              window.history.replaceState({}, document.title, newUrl);
            }
          } catch (e) {
            console.log('Could not update URL (Safari privacy mode)');
          }
        }
      } catch (error) {
        console.error('❌ Error loading shared product:', error);
      }
    };
    
    loadSharedProduct();
  }, [sharedProductId, t]);

  const handleNavigate = async (page: string, store?: StoreType) => {
    // Handle product navigation (from order history)
    if (page.startsWith('product-')) {
      const productId = page.replace('product-', '');
      // Fetch product by ID and open modal
      try {
        const supabase = createClient();
        const { data: product } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();
        
        if (product) {
          // Map database fields (snake_case) to TypeScript interface (camelCase)
          const mappedProduct: Product = {
            ...product,
            inStock: product.in_stock ?? true, // Map in_stock to inStock with fallback
            isSample: product.is_sample ?? false,
            wholesalePrice: product.wholesale_price,
            saleEnabled: product.sale_enabled ?? false,
            saleDiscount: product.sale_discount ?? 0,
            saleEndDate: product.sale_end_date ?? null,
            shortDescription: product.short_description || product.description || '',
            shortDescription_en: product.short_description_en || product.description_en || '',
            shortDescription_zh: product.short_description_zh || product.description_zh || '',
            shortDescription_vi: product.short_description_vi || product.description_vi || '',
          };
          
          setSelectedProduct(mappedProduct);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      }
      return;
    }
    
    setCurrentPage(page);
    if (store) {
      setCurrentStore(store);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white text-3xl animate-pulse">
          中
        </div>
      </div>
    );
  }

  // Auth pages
  if (currentPage === 'login') {
    return <Auth mode="login" onNavigate={handleNavigate} />;
  }

  if (currentPage === 'register') {
    return <Auth mode="register" onNavigate={handleNavigate} />;
  }

  if (currentPage === 'create-admin') {
    return <CreateAdminPage onBack={() => handleNavigate('home')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Database Status Banner - only show if NOT in mock mode */}
      {!MOCK_MODE && <DatabaseStatus />}
      
      <Header 
        onNavigate={handleNavigate} 
        currentPage={currentPage}
        currentStore={currentStore}
        onStoreChange={setCurrentStore}
        onProductClick={setSelectedProduct}
        onSelectDisease={handleDiseaseSelect}
        onSelectCategory={handleCategorySelect}
      />

      {currentPage === 'home' && (
        <>
          <CategoryMenu
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
            currentStore={currentStore}
          />

          <div className="container mx-auto px-2 md:px-4">
            <div className="flex">
              <DiseaseSidebar
                selectedDisease={selectedDisease}
                onSelectDisease={handleDiseaseSelect}
              />

              <main className="flex-1 py-3 md:py-6 px-1 md:px-4">
                <HomePage
                  selectedCategory={selectedCategory}
                  selectedDisease={selectedDisease}
                  currentStore={currentStore}
                  onProductClick={setSelectedProduct}
                />
              </main>
            </div>
          </div>
        </>
      )}

      {currentPage === 'cart' && <CartMultiStore onNavigate={handleNavigate} />}

      {currentPage === 'checkout' && <CheckoutNew onNavigate={handleNavigate} store={currentStore} />}

      {currentPage === 'payment-info' && <PaymentInfo onNavigate={handleNavigate} orderId={pushNavigationParams?.orderId} />}

      {currentPage === 'profile' && user && (
        <ProfileNew 
          onNavigate={handleNavigate} 
          onProductClick={setSelectedProduct}
          initialOrderId={pushNavigationParams?.orderId}
          initialTab={pushNavigationParams?.tab}
        />
      )}

      {currentPage === 'admin' && user?.isAdmin && <AdminPanelNew />}

      {currentPage === 'privacy-policy' && <PrivacyPolicy onNavigate={handleNavigate} language={currentLanguage} />}

      {currentPage === 'terms-of-service' && <TermsOfService onNavigate={handleNavigate} language={currentLanguage} />}

      {currentPage === 'loyalty-program' && <LoyaltyProgram onNavigate={handleNavigate} />}

      {/* Live Chat Widget */}
      <LiveChat onNavigate={setCurrentPage} />

      {/* Cookie Consent Banner */}
      <CookieConsent />

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Push Notification Prompt */}
      {showPushPrompt && (() => {
        console.log('🎨 RENDERING PUSH PROMPT!');
        return true;
      })() && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-2 sm:p-4">
          <div className="push-prompt-container bg-white rounded-lg shadow-xl max-w-full sm:max-w-md w-full mx-2 sm:mx-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center text-xl sm:text-2xl">
                🔔
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {currentLanguage === 'ru' && 'Включить уведомления?'}
                  {currentLanguage === 'en' && 'Enable Notifications?'}
                  {currentLanguage === 'zh' && '启用通知？'}
                  {currentLanguage === 'vi' && 'Bật thông báo?'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {currentLanguage === 'ru' && 'Будьте в курсе всех новостей'}
                  {currentLanguage === 'en' && 'Stay updated on your orders'}
                  {currentLanguage === 'zh' && '及时了解您的订单'}
                  {currentLanguage === 'vi' && 'Cập nhật đơn hàng của bạn'}
                </p>
              </div>
            </div>
            
            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
              {currentLanguage === 'ru' && (
                <>
                  <p>✅ Статусы заказов в реальном времени</p>
                  <p>✅ Эксклюзивные предложения и акции</p>
                  <p>✅ Новинки и рекомендации</p>
                  <p className="text-xs text-gray-500 mt-2 sm:mt-3">
                    Вы можете отключить уведомления в любое время в настройках профиля
                  </p>
                </>
              )}
              {currentLanguage === 'en' && (
                <>
                  <p>✅ Real-time order status updates</p>
                  <p>✅ Exclusive offers and promotions</p>
                  <p>✅ New products and recommendations</p>
                  <p className="text-xs text-gray-500 mt-2 sm:mt-3">
                    You can disable notifications anytime in profile settings
                  </p>
                </>
              )}
              {currentLanguage === 'zh' && (
                <>
                  <p>✅ 实时订单状态更新</p>
                  <p>✅ 独家优惠和促销</p>
                  <p>✅ 新产品和推荐</p>
                  <p className="text-xs text-gray-500 mt-2 sm:mt-3">
                    您可以随时在个人资料设置中禁用通知
                  </p>
                </>
              )}
              {currentLanguage === 'vi' && (
                <>
                  <p>✅ Cập nhật trạng thái đơn hàng theo thời gian thực</p>
                  <p>✅ Ưu đãi và khuyến mãi độc quyền</p>
                  <p>✅ Sản phẩm mới và đề xuất</p>
                  <p className="text-xs text-gray-500 mt-2 sm:mt-3">
                    Bạn có thể tắt thông báo bất cứ lúc nào trong cài đặt hồ sơ
                  </p>
                </>
              )}
            </div>

            <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
              <button
                onClick={async () => {
                  console.log('🔔 User clicked "Subscribe" on custom prompt');
                  
                  // Don't close prompt yet - wait for browser permission
                  // Remove flag when user interacts with prompt
                  localStorage.removeItem('show_push_prompt');
                  
                  try {
                    if (oneSignalService.isEnabled()) {
                      console.log('🔔 OneSignal enabled, requesting browser permission...');
                      
                      // Close custom prompt FIRST, then show browser prompt
                      setShowPushPrompt(false);
                      
                      // Small delay to let UI update
                      await new Promise(resolve => setTimeout(resolve, 100));
                      
                      console.log('🔔 Calling oneSignalService.subscribe()...');
                      const playerId = await oneSignalService.subscribe();
                      
                      if (playerId) {
                        console.log('✅ Successfully subscribed with Player ID:', playerId);
                        toast.success(
                          currentLanguage === 'ru' ? '✅ Уведомления включены!' :
                          currentLanguage === 'en' ? '✅ Notifications enabled!' :
                          currentLanguage === 'zh' ? '✅ 通知已启用！' :
                          '✅ Thông báo đã bật!'
                        );
                      } else {
                        console.warn('⚠️ Subscription failed - no Player ID returned');
                        // Only show warning on desktop (push notifications don't work on mobile web)
                        if (window.innerWidth > 768) {
                          toast.warning(
                            currentLanguage === 'ru' ? '⚠️ Не удалось подписаться. Попробуйте еще раз.' :
                            currentLanguage === 'en' ? '⚠️ Subscription failed. Please try again.' :
                            currentLanguage === 'zh' ? '⚠️ 订阅失败。请重试。' :
                            '⚠️ Đăng ký thất bại. Vui lòng thử lại.'
                          );
                        }
                      }
                    } else {
                      toast.error(
                        currentLanguage === 'ru' ? 'OneSignal не настроен' :
                        currentLanguage === 'en' ? 'OneSignal not configured' :
                        currentLanguage === 'zh' ? 'OneSignal 未配置' :
                        'OneSignal chưa được cấu hình'
                      );
                    }
                  } catch (error: any) {
                    console.error('⚠️ Push subscription failed:', error);
                    toast.error(
                      currentLanguage === 'ru' ? '❌ Не удалось подписаться: ' + (error.message || 'Неизвестная ошибка') :
                      currentLanguage === 'en' ? '❌ Subscription failed: ' + (error.message || 'Unknown error') :
                      currentLanguage === 'zh' ? '❌ 订阅失败：' + (error.message || '未知错误') :
                      '❌ Đăng ký thất bại: ' + (error.message || 'Lỗi không xác định')
                    );
                  }
                }}
                className="push-prompt-enable-button flex-1 bg-red-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm sm:text-base"
              >
                {currentLanguage === 'ru' && 'Включить'}
                {currentLanguage === 'en' && 'Enable'}
                {currentLanguage === 'zh' && '启用'}
                {currentLanguage === 'vi' && 'Bật'}
              </button>
              <button
                onClick={() => {
                  setShowPushPrompt(false);
                  // Remove flag when user dismisses prompt
                  localStorage.removeItem('show_push_prompt');
                  // Mark that we've shown the prompt
                  localStorage.setItem('push_prompt_shown', 'true');
                }}
                className="push-prompt-later-button px-3 sm:px-4 py-2 sm:py-3 text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base"
              >
                {currentLanguage === 'ru' && 'Не сейчас'}
                {currentLanguage === 'en' && 'Not now'}
                {currentLanguage === 'zh' && '以后再说'}
                {currentLanguage === 'vi' && 'Để sau'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop Up Modal */}
      <PopUpModal />

      {/* Theme Decorations */}
      <ThemeDecorations />

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}