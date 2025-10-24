import { useState } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider, type StoreType } from './contexts/CartContext';
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

function AppContent() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<string | null>(null);
  const [currentStore, setCurrentStore] = useState<StoreType>('china');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const { user, loading } = useAuth();

  const handleNavigate = (page: string, store?: StoreType) => {
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
      <Header 
        onNavigate={handleNavigate} 
        currentPage={currentPage}
        currentStore={currentStore}
        onStoreChange={setCurrentStore}
        onProductClick={setSelectedProduct}
      />

      {currentPage === 'home' && (
        <>
          <CategoryMenu
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            currentStore={currentStore}
          />

          <div className="flex">
            <DiseaseSidebar
              selectedDisease={selectedDisease}
              onSelectDisease={setSelectedDisease}
            />

            <main className="flex-1 p-6">
              <HomePage
                selectedCategory={selectedCategory}
                selectedDisease={selectedDisease}
                currentStore={currentStore}
                onProductClick={setSelectedProduct}
              />
            </main>
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
      <LiveChat />

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
