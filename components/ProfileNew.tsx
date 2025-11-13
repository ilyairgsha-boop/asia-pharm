import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { createClient } from '../utils/supabase/client';
import { Package, Loader2, Gift, TrendingUp, Calendar, Heart, Mail, Bell, Trash2, AlertTriangle, Settings } from 'lucide-react';
import { OrderDetails } from './OrderDetails';
import { ProductCard } from './ProductCard';
import { Product } from '../contexts/CartContext';
import { getMockProducts, getMockOrders } from '../utils/mockData';
import { toast } from 'sonner';
import { pluralizePoints } from '../utils/pluralize';

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
  promoCode?: string;
  loyaltyDiscount?: number;
  loyaltyPointsUsed?: number;
  loyaltyPointsEarned?: boolean;
  items: any[];
  shippingInfo: any;
  store?: string;
  user_id?: string;
}

interface LoyaltyHistory {
  id: string;
  points: number;
  type: 'earned' | 'spent';
  description: string;
  createdAt: string;
  orderId?: string;
  orderNumber?: string;
  orderDate?: string;
  tierAtCredit?: 'basic' | 'silver' | 'gold' | 'platinum';
}

interface ProfileNewProps {
  onNavigate: (page: string) => void;
  onProductClick?: (product: Product) => void;
}

export const ProfileNew = ({ onNavigate, onProductClick }: ProfileNewProps) => {
  const { language, t } = useLanguage();
  const { user, accessToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [lifetimeTotal, setLifetimeTotal] = useState(0);
  const [currentTier, setCurrentTier] = useState<'basic' | 'silver' | 'gold' | 'platinum'>('basic');
  const [loyaltyHistory, setLoyaltyHistory] = useState<LoyaltyHistory[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribedToNewsletter, setIsSubscribedToNewsletter] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [showEmailEdit, setShowEmailEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'orders' | 'favorites' | 'bonusHistory' | 'settings'>('orders');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (user && accessToken) {
      loadOrders();
      loadLoyaltyInfo();
      loadBonusHistory();
      loadFavorites();
      loadUserSettings();
    }
  }, [user, accessToken]);

  const loadUserSettings = async () => {
    if (!user?.id) return;
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('push_notifications_enabled, email_notifications_enabled')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setIsSubscribed(data.push_notifications_enabled !== false); // По умолчанию true
        setIsSubscribedToNewsletter(data.email_notifications_enabled !== false); // По умолчанию true
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error(t('invalidEmail') || 'Invalid email');
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (!error) {
        toast.success(t('emailUpdated'));
        setShowEmailEdit(false);
        setNewEmail('');
        // Reload user info
        window.location.reload();
      } else {
        toast.error(error.message || t('emailUpdateError'));
      }
    } catch (error) {
      console.error('Error updating email:', error);
      toast.error(t('emailUpdateError'));
    }
  };

  const handleToggleSubscription = async () => {
    if (!user?.id) return;
    
    try {
      const supabase = createClient();
      const newValue = !isSubscribed;
      
      const { error } = await supabase
        .from('profiles')
        .update({ push_notifications_enabled: newValue })
        .eq('id', user.id);

      if (!error) {
        setIsSubscribed(newValue);
        
        // Если отключаем - деактивируем все устройства пользователя
        if (!newValue) {
          await supabase
            .from('user_push_subscriptions')
            .update({ is_active: false })
            .eq('user_id', user.id);
          console.log('🔕 All push subscriptions deactivated');
        } else {
          // Если включаем - активируем все устройства и подписываемся на текущем
          await supabase
            .from('user_push_subscriptions')
            .update({ is_active: true })
            .eq('user_id', user.id);
          console.log('✅ All push subscriptions activated');
          
          // Пытаемся подписаться на текущем устройстве
          try {
            const { oneSignalService } = await import('../utils/oneSignal');
            if (oneSignalService.isEnabled()) {
              console.log('🔔 Calling subscribe() from profile...');
              const playerId = await oneSignalService.subscribe();
              if (playerId) {
                console.log('✅ Subscribed to push notifications with Player ID:', playerId);
              } else {
                console.warn('⚠️ Subscribe returned no Player ID');
              }
            } else {
              console.warn('⚠️ OneSignal not enabled');
            }
          } catch (pushError) {
            console.error('❌ Could not subscribe to push:', pushError);
          }
        }
        
        toast.success(newValue ? (t('pushEnabled') || 'Push notifications enabled') : (t('pushDisabled') || 'Push notifications disabled'));
      } else {
        toast.error(t('subscriptionError') || 'Failed to update subscription');
      }
    } catch (error) {
      console.error('Error toggling push subscription:', error);
      toast.error(t('subscriptionError') || 'Failed to update subscription');
    }
  };

  const handleToggleNewsletterSubscription = async () => {
    if (!user?.id) return;
    
    try {
      const supabase = createClient();
      const newValue = !isSubscribedToNewsletter;
      
      const { error } = await supabase
        .from('profiles')
        .update({ email_notifications_enabled: newValue })
        .eq('id', user.id);

      if (!error) {
        setIsSubscribedToNewsletter(newValue);
        toast.success(newValue ? (t('emailEnabled') || 'Email notifications enabled') : (t('emailDisabled') || 'Email notifications disabled'));
      } else {
        toast.error(t('subscriptionError') || 'Failed to update subscription');
      }
    } catch (error) {
      console.error('Error toggling newsletter subscription:', error);
      toast.error(t('subscriptionError') || 'Failed to update subscription');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t('confirmDeleteAccount') || 'Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      const supabase = createClient();
      
      // Delete user profile and related data
      // Note: In production, you may want to use a database function or Edge Function
      // to properly handle cascading deletes and cleanup
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user?.id);

      if (!error) {
        toast.success(t('accountDeleted'));
        // Logout using Supabase
        await supabase.auth.signOut();
        // Redirect
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        console.error('Error deleting account:', error);
        toast.error(t('accountDeleteError'));
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(t('accountDeleteError'));
    }
  };

  const loadOrders = async () => {
    if (!user?.id) return;
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Map snake_case from DB to camelCase
        const mappedOrders = data.map((order: any) => ({
          ...order,
          orderNumber: order.order_number,
          orderDate: order.created_at,
          createdAt: order.created_at,
          totalPrice: order.total,
          subtotal: order.subtotal,
          shippingCost: order.shipping_cost,
          promoDiscount: order.promo_discount,
          promoCode: order.promo_code,
          loyaltyDiscount: order.loyalty_points_used,
          loyaltyPointsUsed: order.loyalty_points_used,
          loyaltyPointsEarned: order.loyalty_points_earned,
          trackingNumber: order.tracking_number,
          shippingInfo: order.shipping_info,
          store: order.store,
          user_id: order.user_id,
        }));
        setOrders(mappedOrders);
      } else {
        console.warn('⚠ No orders found or error:', error);
        setOrders([]);
      }
    } catch (error) {
      console.warn('⚠️ Database error, using mock data for local development:', error);
      setOrders(getMockOrders() as any);
    } finally {
      setLoading(false);
    }
  };

  const loadLoyaltyInfo = async () => {
    if (!user?.id) return;
    
    try {
      const supabase = createClient();
      
      // Load loyalty points from profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('loyalty_points')
        .eq('id', user.id)
        .single();

      if (!profileError && profileData) {
        setLoyaltyPoints(profileData.loyalty_points || 0);
      } else {
        setLoyaltyPoints(0);
      }
      
      // Calculate lifetime total from all completed orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('subtotal, total')
        .eq('user_id', user.id)
        .in('status', ['delivered', 'shipped', 'processing']);
      
      if (!ordersError && ordersData) {
        const lifetime = ordersData.reduce((sum, order) => sum + (order.subtotal || order.total || 0), 0);
        setLifetimeTotal(lifetime);
        
        // Calculate monthly total (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: recentOrders } = await supabase
          .from('orders')
          .select('subtotal, total')
          .eq('user_id', user.id)
          .in('status', ['delivered', 'shipped', 'processing'])
          .gte('created_at', thirtyDaysAgo.toISOString());
        
        if (recentOrders) {
          const monthly = recentOrders.reduce((sum, order) => sum + (order.subtotal || order.total || 0), 0);
          setMonthlyTotal(monthly);
        } else {
          setMonthlyTotal(0);
        }
        
        // Determine tier based on lifetime total
        if (lifetime >= 200000) {
          setCurrentTier('platinum');
        } else if (lifetime >= 100000) {
          setCurrentTier('gold');
        } else if (lifetime >= 50000) {
          setCurrentTier('silver');
        } else {
          setCurrentTier('basic');
        }
      } else {
        setMonthlyTotal(0);
        setLifetimeTotal(0);
        setCurrentTier('basic');
      }
    } catch (error) {
      console.warn('⚠️ Database error, using defaults:', error);
      setLoyaltyPoints(0);
      setMonthlyTotal(0);
      setLifetimeTotal(0);
      setCurrentTier('basic');
    }
  };

  const loadBonusHistory = async () => {
    if (!user?.id) return;
    
    try {
      const supabase = createClient();
      
      // Load all orders for this user, sorted by date ascending to calculate cumulative totals
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      
      if (ordersError) {
        console.warn('⚠️ Error loading bonus history:', ordersError);
        setLoyaltyHistory([]);
        return;
      }
      
      if (!ordersData || ordersData.length === 0) {
        setLoyaltyHistory([]);
        return;
      }
      
      // Build history from orders and calculate tier at each point
      const history: LoyaltyHistory[] = [];
      let cumulativeTotal = 0;
      
      ordersData.forEach(order => {
        // Add points spent (if any) - happens at order time
        if (order.loyalty_points_used && order.loyalty_points_used > 0) {
          history.push({
            id: `spent-${order.id}`,
            points: order.loyalty_points_used,
            type: 'spent',
            description: `${t('forOrder')} #${order.order_number || order.id.slice(0, 8)}`,
            createdAt: order.created_at,
            orderId: order.id,
            orderNumber: order.order_number || order.id.slice(0, 8),
            orderDate: order.created_at,
          });
        }
        
        // Add points earned (only for delivered orders) - happens when status changed to delivered
        if (order.status === 'delivered') {
          // Calculate cumulative total up to this order (for delivered orders only)
          const orderTotal = order.subtotal || order.total || 0;
          cumulativeTotal += orderTotal;
          
          // Determine tier at the time of earning based on cumulative total
          let tierAtTime: 'basic' | 'silver' | 'gold' | 'platinum' = 'basic';
          if (cumulativeTotal >= 200000) {
            tierAtTime = 'platinum';
          } else if (cumulativeTotal >= 100000) {
            tierAtTime = 'gold';
          } else if (cumulativeTotal >= 50000) {
            tierAtTime = 'silver';
          }
          
          // Calculate points earned - loyalty_points_earned is stored as boolean or number
          let pointsEarned = 0;
          if (typeof order.loyalty_points_earned === 'number') {
            pointsEarned = order.loyalty_points_earned;
          } else if (order.loyalty_points_earned === true) {
            // Calculate points based on tier and order total
            const orderSubtotal = order.subtotal || order.total || 0;
            const cashback = orderSubtotal * (tierAtTime === 'platinum' ? 0.10 : tierAtTime === 'gold' ? 0.07 : tierAtTime === 'silver' ? 0.05 : 0.03);
            pointsEarned = Math.floor(cashback);
          }
          
          if (pointsEarned > 0) {
            history.push({
              id: `earned-${order.id}`,
              points: pointsEarned,
              type: 'earned',
              description: `${t('forOrder')} #${order.order_number || order.id.slice(0, 8)}`,
              createdAt: order.updated_at || order.created_at,
              orderId: order.id,
              orderNumber: order.order_number || order.id.slice(0, 8),
              orderDate: order.created_at,
              tierAtCredit: tierAtTime,
            });
          }
        }
      });
      
      // Sort by date descending
      history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setLoyaltyHistory(history);
    } catch (error) {
      console.warn('⚠️ Error loading bonus history:', error);
      setLoyaltyHistory([]);
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
        const supabase = createClient();
        const { data, error } = await supabase
          .from('products')
          .select('*');
        
        if (!error && data) {
          // Map snake_case from DB to camelCase for Product interface
          allProducts = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            name_en: item.name_en || item.name,
            name_zh: item.name_zh || item.name,
            name_vi: item.name_vi || item.name,
            price: item.price,
            category: item.category,
            disease: item.disease,
            diseaseCategories: item.disease_categories || [],
            shortDescription: item.short_description || item.description || '',
            shortDescription_en: item.short_description_en || item.description_en || item.short_description || '',
            shortDescription_zh: item.short_description_zh || item.description_zh || item.short_description || '',
            shortDescription_vi: item.short_description_vi || item.description_vi || item.short_description || '',
            description: item.description || '',
            description_en: item.description_en || item.description || '',
            description_zh: item.description_zh || item.description || '',
            description_vi: item.description_vi || item.description || '',
            image: item.image,
            inStock: item.in_stock !== false, // Default to true if null/undefined
            store: item.store,
            weight: item.weight || 0,
            isSample: item.is_sample || false,
          }));
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
          <div className="profile-loyalty-card bg-gradient-to-br from-red-600 to-red-700 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Gift size={24} />
              <h3>{t('loyaltyProgram')}</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-red-100 text-sm">{t('availablePoints')}</p>
                <p className="text-2xl">{pluralizePoints(loyaltyPoints || 0, language)}</p>
              </div>

              <div>
                <p className="text-red-100 text-sm">{t('currentTier')}</p>
                <p className="text-lg">
                  {currentTier === 'platinum' ? (
                    <span className="flex items-center gap-1">
                      💎 {t('tierPlatinum')} (10%)
                    </span>
                  ) : currentTier === 'gold' ? (
                    <span className="flex items-center gap-1">
                      🥇 {t('tierGold')} (7%)
                    </span>
                  ) : currentTier === 'silver' ? (
                    <span className="flex items-center gap-1">
                      🥈 {t('tierSilver')} (5%)
                    </span>
                  ) : (
                    <span>🔰 {t('tierBasic')} (3%)</span>
                  )}
                </p>
              </div>

              <div>
                <p className="text-red-100 text-sm">{t('lifetimeTotal')}</p>
                <p className="text-lg">{(lifetimeTotal || 0).toLocaleString()} ₽</p>
                {lifetimeTotal < 50000 && (
                  <p className="text-xs text-red-100 mt-1">
                    {(50000 - lifetimeTotal).toLocaleString()} ₽ {t('untilSilver')}
                  </p>
                )}
                {lifetimeTotal >= 50000 && lifetimeTotal < 100000 && (
                  <p className="text-xs text-red-100 mt-1">
                    {(100000 - lifetimeTotal).toLocaleString()} ₽ {t('untilGold')}
                  </p>
                )}
                {lifetimeTotal >= 100000 && lifetimeTotal < 200000 && (
                  <p className="text-xs text-red-100 mt-1">
                    {(200000 - lifetimeTotal).toLocaleString()} ₽ {t('untilPlatinum')}
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
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setSettingsTab('orders')}
                className={`profile-tab flex items-center gap-2 px-6 py-3 transition-colors ${
                  settingsTab === 'orders'
                    ? 'border-b-2 border-red-600 text-red-600 active'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Package size={20} />
                {t('orderHistory')}
              </button>
              <button
                onClick={() => setSettingsTab('favorites')}
                className={`profile-tab flex items-center gap-2 px-6 py-3 transition-colors ${
                  settingsTab === 'favorites'
                    ? 'border-b-2 border-red-600 text-red-600 active'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Heart size={20} />
                {t('favorites')}
              </button>
              <button
                onClick={() => setSettingsTab('bonusHistory')}
                className={`profile-tab flex items-center gap-2 px-6 py-3 transition-colors ${
                  settingsTab === 'bonusHistory'
                    ? 'border-b-2 border-red-600 text-red-600 active'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <TrendingUp size={20} />
                {t('bonusPointsHistory')}
              </button>
              <button
                onClick={() => setSettingsTab('settings')}
                className={`profile-tab flex items-center gap-2 px-6 py-3 transition-colors ${
                  settingsTab === 'settings'
                    ? 'border-b-2 border-red-600 text-red-600 active'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Settings size={20} />
                {t('profileSettings')}
              </button>
            </div>
          </div>

          {/* Order history */}
          {settingsTab === 'orders' && (
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
                    onClick={() => setSelectedOrder(order)}
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
                        {(() => {
                          const totalItems = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
                          // Russian plural rules: 1 товар, 2-4 товара, 5+ товаров
                          if (language === 'ru') {
                            const lastDigit = totalItems % 10;
                            const lastTwoDigits = totalItems % 100;
                            if (totalItems === 1) {
                              return `${totalItems} товар`;
                            } else if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 10 || lastTwoDigits >= 20)) {
                              return `${totalItems} товара`;
                            } else {
                              return `${totalItems} товаров`;
                            }
                          }
                          return `${totalItems} ${totalItems === 1 ? t('productSingular') : t('productPlural')}`;
                        })()}
                      </div>
                      <div className="text-gray-800">
                        {((order.totalPrice || order.subtotal || 0) as number).toLocaleString()} ₽
                      </div>
                    </div>

                    {order.trackingNumber && (
                      <div className="mt-2 text-sm">
                        <a
                          href={order.trackingNumber}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t('clickToTrack')}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            </div>
          )}

          {/* Favorites */}
          {settingsTab === 'favorites' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-800 mb-4">{t('favorites')}</h3>

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
                  className="profile-favorites-button mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
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
                    onProductClick={onProductClick || ((product) => {
                      // Fallback: dispatch event if onProductClick is not provided
                      if (typeof window !== 'undefined') {
                        const event = new CustomEvent('openProductDetails', { detail: product });
                        window.dispatchEvent(event);
                      }
                    })}
                  />
                ))}
              </div>
            )}
            </div>
          )}

          {/* Bonus History */}
          {settingsTab === 'bonusHistory' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-800 mb-4">{t('bonusPointsHistory')}</h3>

              {loyaltyHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Gift className="mx-auto text-gray-400 mb-4" size={64} />
                  <p className="text-gray-600">{t('noBonusHistory')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm text-gray-600">{t('action')}</th>
                        <th className="text-left py-3 px-4 text-sm text-gray-600">{t('forOrder')}</th>
                        <th className="text-left py-3 px-4 text-sm text-gray-600">{t('orderDate')}</th>
                        <th className="text-left py-3 px-4 text-sm text-gray-600">{t('creditedDate')}</th>
                        <th className="text-right py-3 px-4 text-sm text-gray-600">{t('pointsCredited')}</th>
                        <th className="text-right py-3 px-4 text-sm text-gray-600">{t('pointsSpent')}</th>
                        <th className="text-left py-3 px-4 text-sm text-gray-600">{t('tierAtCredit')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loyaltyHistory.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            {item.type === 'earned' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                                <TrendingUp size={14} />
                                {t('crediting')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                                <Gift size={14} />
                                {t('spending')}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {item.orderId ? (
                              <button
                                onClick={() => {
                                  const order = orders.find(o => o.id === item.orderId);
                                  if (order) setSelectedOrder(order);
                                }}
                                className="text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                              >
                                #{item.orderNumber}
                              </button>
                            ) : (
                              <span className="text-gray-600">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {item.orderDate ? new Date(item.orderDate).toLocaleDateString(
                              language === 'ru' ? 'ru-RU' :
                              language === 'zh' ? 'zh-CN' :
                              language === 'vi' ? 'vi-VN' : 'en-US'
                            ) : '-'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(item.createdAt).toLocaleDateString(
                              language === 'ru' ? 'ru-RU' :
                              language === 'zh' ? 'zh-CN' :
                              language === 'vi' ? 'vi-VN' : 'en-US'
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-800">
                            {item.type === 'earned' ? (
                              <span className="bonus-history-earned text-green-600">+{item.points.toLocaleString()}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-800">
                            {item.type === 'spent' ? (
                              <span className="bonus-history-spent text-blue-600">-{item.points.toLocaleString()}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {item.type === 'earned' && item.tierAtCredit ? (
                              item.tierAtCredit === 'platinum' ? (
                                <span>💎 {t('tierPlatinum')} (10%)</span>
                              ) : item.tierAtCredit === 'gold' ? (
                                <span>🥇 {t('tierGold')} (7%)</span>
                              ) : item.tierAtCredit === 'silver' ? (
                                <span>🥈 {t('tierSilver')} (5%)</span>
                              ) : (
                                <span>🔰 {t('tierBasic')} (3%)</span>
                              )
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {settingsTab === 'settings' && (
            <div className="space-y-6">
              {/* Email Settings */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Mail size={20} className="profile-email-icon text-red-600" />
                  <h3 className="text-gray-800">{t('emailSettings')}</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">{t('currentEmail')}</label>
                    <div className="flex gap-2">
                      {showEmailEdit ? (
                        <>
                          <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder={user?.email}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                          />
                          <button
                            onClick={handleUpdateEmail}
                            className="profile-settings-button px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            {t('save')}
                          </button>
                          <button
                            onClick={() => {
                              setShowEmailEdit(false);
                              setNewEmail('');
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {t('cancel')}
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                            {user?.email}
                          </div>
                          <button
                            onClick={() => setShowEmailEdit(true)}
                            className="profile-settings-button px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            {t('changeEmail')}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Push Notification Settings */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Bell size={20} className="profile-settings-icon text-red-600" />
                  <h3 className="text-gray-800">{t('pushNotificationSettings') || 'Push Notifications'}</h3>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-gray-800">
                      {isSubscribed ? (t('pushSubscribed') || 'You are subscribed to push notifications') : (t('pushUnsubscribed') || 'Push notifications are disabled')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {isSubscribed ? (t('pushSubscribedDesc') || 'You will receive notifications about orders and promotions') : (t('pushUnsubscribedDesc') || 'Enable to receive instant updates')}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleSubscription}
                    className={`profile-settings-button px-6 py-2 rounded-lg transition-colors ${
                      isSubscribed
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isSubscribed ? (t('unsubscribe') || 'Disable') : (t('subscribe') || 'Enable')}
                  </button>
                </div>
              </div>

              {/* Email Newsletter Settings */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Mail size={20} className="profile-settings-icon text-red-600" />
                  <h3 className="text-gray-800">{t('newsletterSettings') || 'Email Newsletter'}</h3>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-gray-800">
                      {isSubscribedToNewsletter ? (t('newsletterSubscribed') || 'Subscribed to email newsletter') : (t('newsletterUnsubscribed') || 'Not subscribed to newsletter')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {isSubscribedToNewsletter ? (t('newsletterSubscribedDesc') || 'You will receive promotional emails and updates') : (t('newsletterUnsubscribedDesc') || 'Subscribe to receive special offers via email')}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleNewsletterSubscription}
                    className={`profile-settings-button px-6 py-2 rounded-lg transition-colors ${
                      isSubscribedToNewsletter
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isSubscribedToNewsletter ? (t('unsubscribeNewsletter') || 'Unsubscribe') : (t('subscribeNewsletter') || 'Subscribe')}
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-lg shadow-md p-6 border-2 border-red-200">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={20} className="text-red-600" />
                  <h3 className="text-red-600">{t('dangerZone')}</h3>
                </div>

                <div className="space-y-3">
                  <p className="text-gray-700">{t('deleteAccountConfirm')}</p>
                  <p className="text-sm text-gray-600">{t('deleteAccountWarning')}</p>
                  
                  {showDeleteConfirm ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteAccount}
                        className="profile-settings-button flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 size={16} />
                        {t('confirmDeleteAccount')}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="profile-settings-button flex items-center gap-2 px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} />
                      {t('deleteAccount')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Loyalty Points History */}
          {settingsTab === 'orders' && loyaltyHistory.length > 0 && (
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
          onNavigate={(page: string, productId?: string) => {
            if (page === 'product' && productId) {
              // Navigate to product page
              onNavigate(`product-${productId}`);
            } else {
              onNavigate(page);
            }
          }}
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