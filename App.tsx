import { useState, useEffect } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider, type StoreType, type Product } from './contexts/CartContext';
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
import { Footer } from './components/Footer';
import { Toaster } from './components/ui/sonner';
import { DatabaseStatus } from './components/DatabaseStatus';
import { performHealthCheck, logHealthCheckResults } from './utils/supabase/health-check';
import { checkEnvironmentVariables, logEnvCheck } from './utils/supabase/env-check';
import { clearOldCategories } from './utils/clearOldCategories';
import { MOCK_MODE } from './utils/mockMode';
import { oneSignalService } from './utils/oneSignal';
import { createClient, getAnonKey, getServerUrl } from './utils/supabase/client';
import './utils/clearOldCategories'; // Import to make functions available in console

function AppContent() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<string | null>('popular'); // Default to "popular"
  const [currentStore, setCurrentStore] = useState<StoreType>('china');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { user, loading } = useAuth();

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
    console.log('🚀 Asia Pharm - Starting application... v2.2.7-ONESIGNAL-FIX');
    
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
    
    // Initialize OneSignal if enabled
    const initOneSignal = async () => {
      try {
        if (oneSignalService.isEnabled()) {
          console.log('🔔 Initializing OneSignal...');
          await oneSignalService.initializeSDK();
          console.log('✅ OneSignal initialized successfully');
        } else {
          console.log('ℹ️ OneSignal not enabled or not configured (skip initialization)');
        }
      } catch (error) {
        console.warn('⚠️ OneSignal initialization failed:', error);
      }
    };
    
    initOneSignal();
    
    // Make oneSignalService available in console for debugging
    if (typeof window !== 'undefined') {
      (window as any).oneSignalService = oneSignalService;
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
    
    // Listen for OneSignal settings updates
    const handleOneSignalUpdate = () => {
      console.log('🔄 OneSignal settings updated, reinitializing...');
      initOneSignal();
    };
    
    window.addEventListener('oneSignalSettingsUpdated', handleOneSignalUpdate);
    
    return () => {
      window.removeEventListener('oneSignalSettingsUpdated', handleOneSignalUpdate);
    };
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
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
