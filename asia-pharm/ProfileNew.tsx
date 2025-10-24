import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserOrders, fetchLoyaltyInfo } from '../utils/supabase/database';
import { getServerUrl } from '../utils/supabase/client';
import { Package, Loader2, Gift, TrendingUp, Calendar, Heart } from 'lucide-react';
import { OrderDetails } from './OrderDetails';
import { ProductCard } from './ProductCard';
import { Product } from '../contexts/CartContext';
import { getMockProducts, getMockOrders } from '../utils/mockData';

interface Order {
  id: string;
  orderNumber?: string;
  orderDate?: string;
  createdAt?: string;
  status: string;
  trackingNumber?: string;
  totalPrice: number;
  subtotal?: number;
  shippingCost?: number;
  promoDiscount?: number;
  loyaltyDiscount?: number;
  loyaltyPointsUsed?: number;
  items: any[];
  shippingInfo: any;
  store?: string;
}

interface LoyaltyHistory {
  id: string;
  points: number;
  type: 'earned' | 'spent';
  description: string;
  createdAt: string;
}

interface ProfileNewProps {
  onNavigate: (page: string) => void;
}

export const ProfileNew = ({ onNavigate }: ProfileNewProps) => {
  const { language, t } = useLanguage();
  const { user, accessToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [currentTier, setCurrentTier] = useState<'basic' | 'premium'>('basic');
  const [loyaltyHistory, setLoyaltyHistory] = useState<LoyaltyHistory[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  useEffect(() => {
    if (user && accessToken) {
      loadOrders();
      loadLoyaltyInfo();
      loadFavorites();
    }
  }, [user, accessToken]);

  const loadOrders = async () => {
    if (!user?.id) return;
    
    try {
      const result = await fetchUserOrders(user.id);

      if (result.success && result.orders.length > 0) {
        setOrders(result.orders as any);
      } else {
        console.warn('⚠️ No orders in database, using mock data for local development');
        setOrders(getMockOrders() as any);
      }
    } catch (error) {
      console.warn('⚠️ Database error, using mock data for local development');
      setOrders(getMockOrders() as any);
    } finally {
      setLoading(false);
    }
  };

  const loadLoyaltyInfo = async () => {
    if (!user?.id) return;
    
    try {
      const result = await fetchLoyaltyInfo(user.id);

      if (result.success) {
        setLoyaltyPoints(result.points);
        setMonthlyTotal(result.monthlyTotal);
        setCurrentTier(result.tier as 'basic' | 'premium');
        
        // Transform transactions to history format
        const history = (result.history || []).map((t: any) => ({
          id: t.id,
          points: t.points,
          type: t.type,
          description: t.description,
          createdAt: t.created_at,
        }));
        setLoyaltyHistory(history);
      } else {
        console.warn('⚠️ No loyalty data, using defaults');
        setLoyaltyPoints(0);
        setMonthlyTotal(0);
        setCurrentTier('basic');
      }
    } catch (error) {
      console.warn('⚠️ Database error, using defaults');
      setLoyaltyPoints(0);
      setMonthlyTotal(0);
      setCurrentTier('basic');
    }
  };

  const loadFavorites = async () => {
    if (!user) return;
    
    setLoadingFavorites(true);
    try {
      // Get favorite IDs from localStorage
      const saved = localStorage.getItem(`favorites_${user.id}`);
      const favoriteIds: string[] = saved ? JSON.parse(saved) : [];
      
      if (favoriteIds.length === 0) {
        setFavoriteProducts([]);
        return;
      }

      // Fetch all products
      let allProducts: Product[] = [];
      try {
        const response = await fetch(getServerUrl('/products'));
        if (response.ok) {
          const data = await response.json();
          allProducts = data.products || [];
        } else {
          allProducts = getMockProducts();
        }
      } catch {
        allProducts = getMockProducts();
      }
      
      // Filter products by favorite IDs
      const favorites = allProducts.filter((p: Product) => 
        favoriteIds.includes(p.id)
      );
      setFavoriteProducts(favorites);
    } catch (error) {
      console.warn('⚠️ Error loading favorites:', error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const removeFavorite = (productId: string) => {
    if (!user) return;
    
    const saved = localStorage.getItem(`favorites_${user.id}`);
    const favoriteIds: string[] = saved ? JSON.parse(saved) : [];
    const newFavorites = favoriteIds.filter(id => id !== productId);
    localStorage.setItem(`favorites_${user.id}`, JSON.stringify(newFavorites));
    
    setFavoriteProducts(prev => prev.filter(p => p.id !== productId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'paid':
        return 'bg-emerald-100 text-emerald-800';
      case 'awaitingPayment':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-gray-800 mb-6">{t('myProfile')}</h2>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* User info sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-4">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-3">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-gray-800">{user?.name || 'User'}</h3>
              <p className="text-gray-600 text-sm">{user?.email}</p>
              
              {/* Status badges */}
              <div className="mt-3 space-y-1">
                {user?.isAdmin && (
                  <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                    👑 {t('administrator')}
                  </span>
                )}
                {user?.isWholesaler && (
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded ml-1">
                    📦 {t('wholesaler')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Admin Panel Link */}
          {user?.isAdmin && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <button
                onClick={() => onNavigate('admin')}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('adminPanel')}
              </button>
            </div>
          )}

          {/* Loyalty Program Card */}
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Gift size={24} />
              <h3>{t('loyaltyProgram')}</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-red-100 text-sm">{t('availablePoints')}</p>
                <p className="text-2xl">{(loyaltyPoints || 0).toLocaleString()} {t('points')}</p>
              </div>

              <div>
                <p className="text-red-100 text-sm">{t('currentTier')}</p>
                <p className="text-lg">
                  {currentTier === 'premium' ? (
                    <span className="flex items-center gap-1">
                      <TrendingUp size={16} />
                      {t('loyaltyTier2Title')} (10%)
                    </span>
                  ) : (
                    <span>{t('loyaltyTier1Title')} (5%)</span>
                  )}
                </p>
              </div>

              <div>
                <p className="text-red-100 text-sm">{t('monthlyTotal')}</p>
                <p className="text-lg">{(monthlyTotal || 0).toLocaleString()} ₽</p>
                {(monthlyTotal || 0) < 10000 && (
                  <p className="text-xs text-red-100 mt-1">
                    {(10000 - (monthlyTotal || 0)).toLocaleString()} ₽ {t('untilPremium')}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => onNavigate('loyalty-program')}
              className="w-full mt-4 bg-white text-red-600 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm"
            >
              {t('learnMore')}
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Order history */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-800 mb-4">{t('orderHistory')}</h3>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-red-600" size={48} />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto text-gray-400 mb-4" size={64} />
                <p className="text-gray-600">{t('noOrdersYet')}</p>
                <button
                  onClick={() => onNavigate('home')}
                  className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  {t('continueShopping')}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder({
                      ...order,
                      orderNumber: order.orderNumber || order.id.slice(0, 8),
                      createdAt: order.createdAt || order.orderDate || new Date().toISOString(),
                      subtotal: order.subtotal || order.totalPrice,
                      shippingCost: order.shippingCost || 0,
                      store: order.store || 'china',
                    })}
                    className="border border-gray-200 rounded-lg p-4 hover:border-red-600 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Package className="text-gray-600" size={20} />
                        <div>
                          <p className="text-gray-800">
                            {t('orderNumber')} #{order.orderNumber || order.id.slice(0, 8)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {(order.orderDate || order.createdAt) ? new Date(order.orderDate || order.createdAt!).toLocaleDateString(
                              language === 'ru' ? 'ru-RU' :
                              language === 'zh' ? 'zh-CN' :
                              language === 'vi' ? 'vi-VN' : 'en-US'
                            ) : t('invalidDate')}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                        {t(order.status)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="text-sm text-gray-600">
                        {order.items.length} {t('product')}
                      </div>
                      <div className="text-gray-800">
                        {((order.totalPrice || order.subtotal || 0) as number).toLocaleString()} ₽
                      </div>
                    </div>

                    {order.trackingNumber && (
                      <div className="mt-2 text-sm text-blue-600">
                        {t('trackingNumber')}: {order.trackingNumber}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Favorites */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart size={20} className="text-red-600" />
              <h3 className="text-gray-800">{t('favorites')}</h3>
            </div>

            {loadingFavorites ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-red-600" size={48} />
              </div>
            ) : favoriteProducts.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="mx-auto text-gray-400 mb-4" size={64} />
                <p className="text-gray-600">{t('noFavorites')}</p>
                <button
                  onClick={() => onNavigate('home')}
                  className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  {t('continueShopping')}
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoriteProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Loyalty Points History */}
          {loyaltyHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={20} className="text-gray-600" />
                <h3 className="text-gray-800">{t('pointsHistory')}</h3>
              </div>

              <div className="space-y-2">
                {loyaltyHistory.slice(0, 10).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm text-gray-800">
                        {entry.description.includes('Order') 
                          ? entry.description.replace('Order', t('order')).replace('delivered', t('delivered'))
                          : entry.description}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(entry.createdAt).toLocaleDateString(
                          language === 'ru' ? 'ru-RU' :
                          language === 'zh' ? 'zh-CN' :
                          language === 'vi' ? 'vi-VN' : 'en-US'
                        )}
                      </p>
                    </div>
                    <div className={`text-sm ${
                      entry.type === 'earned' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {entry.type === 'earned' ? '+' : '-'}{entry.points} {t('points')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onViewPayment={(orderNumber, totalAmount) => {
            // Save payment info to localStorage
            localStorage.setItem('lastOrderPayment', JSON.stringify({
              orderNumber,
              paymentMethod: 'card',  // default to card, user can change on page
              totalAmount,
            }));
            setSelectedOrder(null);
            onNavigate('payment-info');
          }}
        />
      )}
    </div>
  );
};
