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
import { performHealthCheck, logHealthCheckResults } from './utils/supabase/health-check';
import { checkEnvironmentVariables, logEnvCheck } from './utils/supabase/env-check';
import { clearOldCategories } from './utils/clearOldCategories';
import { MOCK_MODE } from './utils/mockMode';
import { oneSignalService } from './utils/oneSignal';
import { createClient, getAnonKey, getServerUrl, supabase } from './utils/supabase/client';
import { checkAndCreateSettingsTable, checkOneSignalSettings } from './utils/checkSettingsTable';
import './utils/clearOldCategories'; // Import to make functions available in console
import './utils/oneSignalDebug'; // Import debug tools

function AppContent() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<string | null>('popular'); // Default to "popular"
  const [currentStore, setCurrentStore] = useState<StoreType>('china');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const { user, loading } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const { totalItemsCount } = useCart();

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
    
    // Clear old category format (without translations) from localStorage
    clearOldCategories();
    
    // Load OneSignal settings from database and initialize
    const initOneSignal = async () => {
      console.log('🚀 [INIT] Starting OneSignal initialization...');
      
      try {
        // Step 1: Check if settings table exists
        console.log('📥 [INIT] Step 1: Checking settings table...');
        const tableExists = await checkAndCreateSettingsTable();
        
        if (!tableExists) {
          console.error('❌ [INIT] Settings table not accessible');
          console.error('💡 [INIT] Run /CHECK_SETTINGS_TABLE.sql in Supabase SQL Editor');
          return;
        }
        
        // Step 2: Load OneSignal settings
        console.log('📥 [INIT] Step 2: Loading OneSignal settings...');
        const settings = await checkOneSignalSettings();
        
        if (settings) {
          console.log('✅ [INIT] Settings loaded from database');
          
          // Migrate old apiKey to restApiKey
          if (settings.apiKey && !settings.restApiKey) {
            console.log('🔄 [INIT] Migrating apiKey to restApiKey...');
            settings.restApiKey = settings.apiKey;
            delete settings.apiKey;
          }
          
          // Store in localStorage
          console.log('💾 [INIT] Saving to localStorage...');
          localStorage.setItem('oneSignalSettings', JSON.stringify(settings));
          console.log('✅ [INIT] Saved to localStorage');
          
          // Reload in service
          console.log('🔄 [INIT] Reloading in OneSignal service...');
          oneSignalService.reloadSettings();
        } else {
          console.warn('⚠️ [INIT] No OneSignal settings in database');
          console.warn('💡 [INIT] SOLUTION OPTIONS:');
          console.warn('   1. Configure in Admin Panel -> OneSignal Settings');
          console.warn('   2. Or run SQL: /FIX_ONESIGNAL_SETTINGS.sql');
          console.warn('   3. Or insert manually:');
          console.warn(`      INSERT INTO settings (key, value) VALUES ('oneSignal', '{"enabled":false}'::jsonb);`);
          
          // Check localStorage fallback
          const localSettings = localStorage.getItem('oneSignalSettings');
          if (localSettings) {
            console.log('📦 [INIT] Using localStorage fallback');
            try {
              const parsed = JSON.parse(localSettings);
              console.log('📋 [INIT] Fallback settings:', {
                enabled: parsed?.enabled,
                hasAppId: !!parsed?.appId,
                hasRestApiKey: !!parsed?.restApiKey
              });
              
              // If localStorage has valid settings, reload service
              if (parsed?.enabled && parsed?.appId && parsed?.restApiKey) {
                console.log('✅ [INIT] Valid settings in localStorage, using them');
                oneSignalService.reloadSettings();
              }
            } catch (parseError) {
              console.error('❌ [INIT] Failed to parse localStorage settings:', parseError);
            }
          } else {
            console.warn('⚠️ [INIT] No settings in localStorage either');
            console.warn('⚠️ [INIT] OneSignal will NOT work until configured');
          }
        }
        
        // Step 3: Initialize SDK if enabled
        console.log('📥 [INIT] Step 3: Checking if enabled...');
        const isEnabled = oneSignalService.isEnabled();
        console.log('📊 [INIT] isEnabled:', isEnabled);
        
        if (isEnabled) {
          console.log('🔔 [INIT] Initializing OneSignal SDK...');
          await oneSignalService.initializeSDK();
          console.log('✅ [INIT] OneSignal SDK initialized');
        } else {
          console.log('ℹ️ [INIT] OneSignal not enabled, skipping SDK init');
        }
      } catch (error: any) {
        console.error('❌ [INIT] Initialization failed:', error?.message);
      }
      
      console.log('🏁 [INIT] Completed');
    };
    
    // Call async function
    initOneSignal().catch(err => {
      console.error('❌ [INIT] Unhandled error in initOneSignal:', err);
    });
    
    // Listen for OneSignal settings changes (from admin panel)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'oneSignalSettings') {
        console.log('🔄 OneSignal settings changed in localStorage, reloading settings...');
        oneSignalService.reloadSettings();
        
        // Note: Don't re-initialize SDK here to avoid "SDK already initialized" error
        // The SDK will pick up new settings on next page load
        console.log('💡 OneSignal settings updated. Please refresh the page to apply changes.');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event (for same-tab changes)
    const handleSettingsUpdate = () => {
      console.log('🔄 OneSignal settings updated, reloading...');
      oneSignalService.reloadSettings();
    };
    
    window.addEventListener('oneSignalSettingsUpdated', handleSettingsUpdate);
    
    // Make oneSignalService available in console for debugging
    if (typeof window !== 'undefined') {
      (window as any).oneSignalService = oneSignalService;
      (window as any).testPushPrompt = () => {
        console.log('🧪 Testing push prompt...');
        setShowPushPrompt(true);
      };
      (window as any).checkOneSignalSetup = async () => {
        console.log('🔍 === OneSignal Setup Check ===');
        
        // 1. Check table
        console.log('\n1️⃣ Checking settings table...');
        const tableExists = await checkAndCreateSettingsTable();
        console.log('   Table exists:', tableExists);
        
        // 2. Check database settings
        console.log('\n2️⃣ Checking database settings...');
        const dbSettings = await checkOneSignalSettings();
        console.log('   Database settings:', dbSettings);
        
        // 3. Check localStorage
        console.log('\n3️⃣ Checking localStorage...');
        const localSettings = localStorage.getItem('oneSignalSettings');
        console.log('   localStorage:', localSettings ? JSON.parse(localSettings) : null);
        
        // 4. Check service
        console.log('\n4️⃣ Checking OneSignal service...');
        console.log('   isConfigured:', oneSignalService.isConfigured());
        console.log('   isEnabled:', oneSignalService.isEnabled());
        
        // 5. Check SDK
        console.log('\n5️⃣ Checking OneSignal SDK...');
        console.log('   SDK loaded:', !!window.OneSignal);
        
        if (window.OneSignal) {
          try {
            const userId = await window.OneSignal.User.PushSubscription.id;
            console.log('   User ID:', userId);
            const isSubscribed = window.OneSignal.User.PushSubscription.optedIn;
            console.log('   Subscribed:', isSubscribed);
          } catch (e) {
            console.log('   SDK check failed:', e);
          }
        }
        
        console.log('\n✅ Check complete');
      };
      (window as any).debugSupabase = {
        getAnonKey,
        getServerUrl,
        testConnection: async () => {
          const url = getServerUrl('');
          const key = getAnonKey();
          console.log('🧪 Testing Edge Function...');
          console.log('URL:', url);
          console.log('API Key:', key.substring(0, 20) + '...');
          
          try {
            const response = await fetch(url, {
              headers: {
                'Authorization': `Bearer ${key}`,
                'apikey': key,
              }
            });
            const data = await response.json();
            console.log('✅ Status:', response.status);
            console.log('✅ Response:', data);
            return data;
          } catch (error) {
            console.error('❌ Error:', error);
            throw error;
          }
        },
        testDirect: async () => {
          const url = 'https://boybkoyidxwrgsayifrd.supabase.co/functions/v1/make-server-a75b5353';
          const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveWJrb3lpZHh3cmdzYXlpZnJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDI3ODEsImV4cCI6MjA3NzQxODc4MX0.1R7AMGegpzlJL45AaeT2BJHQi4-Oswe1tMcAYXK8e2Y';
          
          console.log('🧪 Direct Test (hardcoded URL)...');
          console.log('URL:', url);
          
          try {
            const response = await fetch(url, {
              headers: {
                'Authorization': `Bearer ${key}`,
                'apikey': key,
              }
            });
            
            console.log('📡 Status:', response.status);
            console.log('📡 Headers:', Object.fromEntries(response.headers.entries()));
            
            const text = await response.text();
            console.log('📄 Raw response:', text);
            
            try {
              const data = JSON.parse(text);
              console.log('✅ Parsed JSON:', data);
              return data;
            } catch {
              console.log('⚠️ Response is not JSON');
              return { raw: text };
            }
          } catch (error) {
            console.error('❌ Error:', error);
            throw error;
          }
        }
      };
      console.log('💡 Debug tools available:');
      console.log('  - window.oneSignalService');
      console.log('  - window.testPushPrompt() - test push prompt display');
      console.log('  - await window.checkOneSignalSetup() - comprehensive OneSignal check');
      console.log('  - await window.oneSignalDebug.checkPlayer(playerId) - check player in OneSignal');
      console.log('  - await window.oneSignalDebug.getAllPlayers(10) - get all players');
      console.log('  - await window.oneSignalDebug.getAppInfo() - get app info and player count');
      console.log('  - window.debugSupabase.getAnonKey()');
      console.log('  - window.debugSupabase.getServerUrl(path)');
      console.log('  - await window.debugSupabase.testConnection()');
    }
    
    try {
      // Check environment variables
      const envCheck = checkEnvironmentVariables();
      logEnvCheck(envCheck);
    } catch (error) {
      console.warn('⚠️ Environment check skipped:', error);
    }

    // Check database health
    performHealthCheck().then((results) => {
      logHealthCheckResults(results);
      
      if (results.status === 'unhealthy') {
        console.warn('⚠️ Supabase connection is unhealthy. The application will use demo data.');
      } else if (results.status === 'degraded') {
        console.warn('⚠️ Supabase connection is degraded. Some features may not work correctly.');
      } else {
        console.log('✅ Database connection is healthy!');
      }
    }).catch((error) => {
      console.warn('⚠️ Health check failed:', error);
    });
    
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
    const checkSharedProduct = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get('product');
      
      if (productId) {
        console.log('🔗 Shared product link detected:', productId);
        
        try {
          const supabase = createClient();
          const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
          
          if (error) {
            console.error('❌ Error fetching shared product:', error);
            toast.error(t('productNotFound') || 'Товар не найден');
          } else if (product) {
            console.log('✅ Shared product loaded:', product.name);
            setSelectedProduct(product as Product);
            
            // Remove product parameter from URL without reloading
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
          }
        } catch (error) {
          console.error('❌ Error loading shared product:', error);
        }
      }
    };
    
    checkSharedProduct();
  }, []);

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
          setSelectedProduct(product as Product);
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

      {currentPage === 'payment-info' && <PaymentInfo onNavigate={handleNavigate} />}

      {currentPage === 'profile' && user && <ProfileNew onNavigate={handleNavigate} />}

      {currentPage === 'admin' && user?.isAdmin && <AdminPanelNew />}

      {currentPage === 'privacy-policy' && <PrivacyPolicy onNavigate={handleNavigate} />}

      {currentPage === 'terms-of-service' && <TermsOfService onNavigate={handleNavigate} />}

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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="push-prompt-container bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">
                🔔
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentLanguage === 'ru' && 'Включить уведомления?'}
                  {currentLanguage === 'en' && 'Enable Notifications?'}
                  {currentLanguage === 'zh' && '启用通知？'}
                  {currentLanguage === 'vi' && 'Bật thông báo?'}
                </h3>
                <p className="text-sm text-gray-600">
                  {currentLanguage === 'ru' && 'Будьте в курсе всех новостей'}
                  {currentLanguage === 'en' && 'Stay updated on your orders'}
                  {currentLanguage === 'zh' && '及时了解您的订单'}
                  {currentLanguage === 'vi' && 'Cập nhật đơn hàng của bạn'}
                </p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              {currentLanguage === 'ru' && (
                <>
                  <p>✅ Статусы заказов в реальном времени</p>
                  <p>✅ Эксклюзивные предложения и акции</p>
                  <p>✅ Новинки и рекомендации</p>
                  <p className="text-xs text-gray-500 mt-3">
                    Вы можете отключить уведомления в любое время в настройках профиля
                  </p>
                </>
              )}
              {currentLanguage === 'en' && (
                <>
                  <p>✅ Real-time order status updates</p>
                  <p>✅ Exclusive offers and promotions</p>
                  <p>✅ New products and recommendations</p>
                  <p className="text-xs text-gray-500 mt-3">
                    You can disable notifications anytime in profile settings
                  </p>
                </>
              )}
              {currentLanguage === 'zh' && (
                <>
                  <p>✅ 实时订单状态更新</p>
                  <p>✅ 独家优惠和促销</p>
                  <p>✅ 新产品和推荐</p>
                  <p className="text-xs text-gray-500 mt-3">
                    您可以随时在个人资料设置中禁用通知
                  </p>
                </>
              )}
              {currentLanguage === 'vi' && (
                <>
                  <p>✅ Cập nhật trạng thái đơn hàng theo thời gian thực</p>
                  <p>✅ Ưu đãi và khuyến mãi độc quyền</p>
                  <p>✅ Sản phẩm mới và đề xuất</p>
                  <p className="text-xs text-gray-500 mt-3">
                    Bạn có thể tắt thông báo bất cứ lúc nào trong cài đặt hồ sơ
                  </p>
                </>
              )}
            </div>

            <div className="flex gap-3 pt-2">
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
                          '✅ Thông báo đã бật!'
                        );
                      } else {
                        console.warn('⚠️ Subscription failed - no Player ID returned');
                        toast.warning(
                          currentLanguage === 'ru' ? '⚠️ Не удалось подписаться. Попробуйте еще раз.' :
                          currentLanguage === 'en' ? '⚠️ Subscription failed. Please try again.' :
                          currentLanguage === 'zh' ? '⚠️ 订阅失败。请重试。' :
                          '⚠️ Đăng ký thất bại. Vui lòng thử lại.'
                        );
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
                className="push-prompt-enable-button flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
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
                className="push-prompt-later-button px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
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
