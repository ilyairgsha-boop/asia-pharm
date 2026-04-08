import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { createClient } from '../utils/supabase/client';
import { Package, Loader2, Gift, TrendingUp, Calendar, Heart, Mail, Bell, Trash2, AlertTriangle, Settings } from 'lucide-react';
import { OrderDetails } from './OrderDetails';
import { ProductCard } from './ProductCard';
import { Product } from '../contexts/CartContext';
import { getMockProducts, getMockOrders } from '../utils/mockData';
import { toast } from "sonner@2.0.3";
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
  type: 'earned' | 'spent' | 'refunded';
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
  initialOrderId?: string;
  initialTab?: string;
}

export const ProfileNew = ({ onNavigate, onProductClick, initialOrderId, initialTab }: ProfileNewProps) => {
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

  // Handle initial navigation from push notification
  useEffect(() => {
    if (initialTab === 'loyalty') {
      console.log('🔗 Opening loyalty tab from push notification');
      setSettingsTab('bonusHistory');
    }
  }, [initialTab]);

  // Handle initial order selection from push notification
  useEffect(() => {
    if (initialOrderId && orders.length > 0) {
      console.log('🔗 Opening order from push notification:', initialOrderId);
      const order = orders.find(o => o.id === initialOrderId);
      if (order) {
        setSelectedOrder(order);
        setSettingsTab('orders');
      } else {
        console.warn('⚠️ Order not found:', initialOrderId);
      }
    }
  }, [initialOrderId, orders]);

  useEffect(() => {
    if (user && accessToken) {
      loadOrders();
      loadLoyaltyInfo();
      loadBonusHistory();
      loadFavorites();
      loadUserSettings();
    }
  }, [user, accessToken]);

  // Check localStorage for loyalty updates (polling every 2 seconds)
  useEffect(() => {
    if (!user || !accessToken) return;

    const checkLoyaltyUpdate = () => {
      const lastUpdate = localStorage.getItem('loyaltyPointsLastUpdate');
      const lastCheck = localStorage.getItem('loyaltyPointsLastCheck');
      
      if (lastUpdate && lastUpdate !== lastCheck) {
        console.log('📊 ProfileNew: Detected loyalty update in localStorage, reloading...');
        loadLoyaltyInfo();
        loadBonusHistory();
        localStorage.setItem('loyaltyPointsLastCheck', lastUpdate);
      }
    };

    // Check immediately
    checkLoyaltyUpdate();

    // Poll every 2 seconds
    const interval = setInterval(checkLoyaltyUpdate, 2000);

    return () => clearInterval(interval);
  }, [user, accessToken]);

  // Listen for loyalty points updates
  useEffect(() => {
    const handleLoyaltyPointsUpdate = (event: CustomEvent) => {
      if (event.detail?.newPoints !== undefined) {
        console.log('📊 ProfileNew: Received loyalty points update event:', event.detail.newPoints);
        setLoyaltyPoints(event.detail.newPoints);
        // Reload from database after a short delay to ensure consistency
        setTimeout(() => {
          console.log('📊 ProfileNew: Reloading from DB after event...');
          loadLoyaltyInfo();
          loadBonusHistory();
        }, 500);
      }
    };

    const handleReloadLoyaltyHistory = () => {
      console.log('📊 ProfileNew: Received reload loyalty history event');
      setTimeout(() => {
        console.log('📊 ProfileNew: Reloading loyalty history...');
        loadBonusHistory();
      }, 500);
    };

    window.addEventListener('loyaltyPointsUpdated', handleLoyaltyPointsUpdate as EventListener);
    window.addEventListener('reloadLoyaltyHistory', handleReloadLoyaltyHistory);

    return () => {
      window.removeEventListener('loyaltyPointsUpdated', handleLoyaltyPointsUpdate as EventListener);
      window.removeEventListener('reloadLoyaltyHistory', handleReloadLoyaltyHistory);
    };
  }, []);

  // Reload loyalty info when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && accessToken) {
        console.log('📊 ProfileNew: Tab became visible, reloading loyalty info...');
        loadLoyaltyInfo();
        loadBonusHistory();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, accessToken]);

  // Reload loyalty info when switching to bonusHistory or orders tab
  useEffect(() => {
    if ((settingsTab === 'bonusHistory' || settingsTab === 'orders') && user && accessToken) {
      console.log('📊 ProfileNew: Switched to tab:', settingsTab, '- reloading loyalty info...');
      loadLoyaltyInfo();
      if (settingsTab === 'bonusHistory') {
        loadBonusHistory();
      }
    }
  }, [settingsTab, user, accessToken]);

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
      
      console.log('🔔 Toggle push subscription:', { currentValue: isSubscribed, newValue });
      
      const { error } = await supabase
        .from('profiles')
        .update({ push_notifications_enabled: newValue })
        .eq('id', user.id);

      if (!error) {
        setIsSubscribed(newValue);
        
        // Если отключаем - деактивируем все устройства пользователя
        if (!newValue) {
          console.log('🔕 Disabling push notifications...');
          await supabase
            .from('user_push_subscriptions')
            .update({ is_active: false })
            .eq('user_id', user.id);
          console.log('🔕 All push subscriptions deactivated');
          
          // Отписываемся от OneSignal
          try {
            const { oneSignalService } = await import('../utils/oneSignal');
            const OneSignal = await oneSignalService.getOneSignalPublic();
            if (OneSignal?.User?.PushSubscription) {
              await OneSignal.User.PushSubscription.optOut();
              console.log('✅ Opted out from OneSignal');
            }
          } catch (pushError) {
            console.error('❌ Could not opt out from OneSignal:', pushError);
          }
          
          toast.success(t('pushDisabled') || 'Push notifications disabled');
        } else {
          console.log('✅ Enabling push notifications...');
          // Если включаем - активируем все устройства и подписываемся на текущем
          await supabase
            .from('user_push_subscriptions')
            .update({ is_active: true })
            .eq('user_id', user.id);
          console.log('✅ All push subscriptions activated');
          
          // Пытаемся подписаться на текущем устройстве
          try {
            const { oneSignalService } = await import('../utils/oneSignal');
            console.log('🔍 OneSignal service loaded');
            console.log('🔍 OneSignal enabled:', oneSignalService.isEnabled());
            console.log('🔍 OneSignal configured:', oneSignalService.isConfigured());
            
            if (!oneSignalService.isConfigured()) {
              console.error('❌ OneSignal not configured! Check settings in Admin panel.');
              toast.error('OneSignal не настроен. Обратитесь к администратору.');
              return;
            }
            
            if (oneSignalService.isEnabled()) {
              console.log('🔔 Initializing OneSignal SDK...');
              await oneSignalService.initializeSDK();
              
              console.log('🔔 Calling subscribe() from profile...');
              const playerId = await oneSignalService.subscribe();
              
              if (playerId) {
                console.log('✅ Subscribed to push notifications with Player ID:', playerId);
                toast.success(t('pushEnabled') || 'Push notifications enabled');
              } else {
                console.warn('⚠️ Subscribe returned no Player ID');
                toast.warning('Не удалось подписаться на уведомления. Проверьте разрешения браузера.');
              }
            } else {
              console.warn('⚠️ OneSignal not enabled in settings');
              toast.error('Push-уведомления отключены. Включите в настройках админ-панели.');
            }
          } catch (pushError) {
            console.error('❌ Could not subscribe to push:', pushError);
            toast.error('Ошибка подписки: ' + (pushError instanceof Error ? pushError.message : String(pushError)));
          }
        }
      } else {
        console.error('❌ Error updating profile:', error);
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
        console.log('📊 ProfileNew: Loaded loyalty points from DB:', profileData.loyalty_points);
        setLoyaltyPoints(profileData.loyalty_points || 0);
      } else {
        console.warn('⚠️ ProfileNew: Error loading loyalty points:', profileError);
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
      
      console.log('📊 ProfileNew: Loading loyalty history from both sources...');
      
      // Load loyalty history from the dedicated loyalty_history table
      const { data: historyData, error: historyError } = await supabase
        .from('loyalty_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (historyError) {
        console.warn('⚠️ Error loading loyalty history table:', historyError);
      }
      
      console.log(`📊 ProfileNew: Loaded ${historyData?.length || 0} entries from loyalty_history table`);
      console.log('📊 ProfileNew: Loyalty history data:', historyData);
      
      // Load all orders for this user to build history from orders (for backward compatibility)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      
      if (ordersError) {
        console.warn('⚠️ Error loading orders:', ordersError);
      }
      
      console.log(`📊 ProfileNew: Loaded ${ordersData?.length || 0} orders`);
      
      const history: LoyaltyHistory[] = [];
      
      // First, add entries from loyalty_history table
      if (historyData && historyData.length > 0) {
        const ordersMap = new Map(ordersData?.map(o => [o.id, o]) || []);
        
        console.log('📊 ProfileNew: Processing loyalty_history entries...');
        historyData.forEach(entry => {
          console.log('📊 ProfileNew: Processing entry:', {
            id: entry.id,
            type: entry.type,
            points: entry.points,
            description: entry.description,
            order_id: entry.order_id
          });
          
          const order = entry.order_id ? ordersMap.get(entry.order_id) : null;
          
          history.push({
            id: entry.id,
            points: entry.points,
            type: entry.type,
            description: entry.description,
            createdAt: entry.created_at,
            orderId: entry.order_id,
            orderNumber: order?.order_number || (entry.order_id ? entry.order_id.slice(0, 8) : ''),
            orderDate: order?.created_at,
          });
        });
        console.log(`📊 ProfileNew: Added ${historyData.length} entries from loyalty_history`);
      }
      
      // Then, build history from orders for backward compatibility
      // (only add entries that are not already in loyalty_history)
      if (ordersData && ordersData.length > 0) {
        let cumulativeTotal = 0;
        const historyOrderIds = new Set(historyData?.map(h => h.order_id).filter(Boolean) || []);
        
        ordersData.forEach(order => {
          const orderInHistory = historyOrderIds.has(order.id);
          
          // Add points spent (if any) - only if not already in loyalty_history
          if (order.loyalty_points_used && order.loyalty_points_used > 0 && !orderInHistory) {
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
          
          // Add points earned (only for delivered orders) - only if not already in loyalty_history
          if (order.status === 'delivered' && !orderInHistory) {
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
            
            // Calculate points earned
            let pointsEarned = 0;
            if (typeof order.loyalty_points_earned === 'number') {
              pointsEarned = order.loyalty_points_earned;
            } else if (order.loyalty_points_earned === true) {
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
      }
      
      // Sort by date descending
      history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      console.log(`📊 ProfileNew: Total history entries: ${history.length}`);
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
            wholesalePrice: item.wholesale_price,
            saleEnabled: item.sale_enabled || false,
            saleDiscount: item.sale_discount || 0,
            saleEndDate: item.sale_end_date || null,
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
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <h2 className="text-gray-800 mb-4 sm:mb-6 text-xl sm:text-2xl px-2">{t('myProfile')}</h2>

      <div className="grid lg:grid-cols-4 gap-4 sm:gap-8">
        {/* User info sidebar */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 -mx-2 sm:mx-0">
            <div className="text-center mb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-600 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl mx-auto mb-3">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-gray-800 text-base sm:text-lg">{user?.name || 'User'}</h3>
              <p className="text-gray-600 text-xs sm:text-sm break-all px-2">{user?.email}</p>
              
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
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 -mx-2 sm:mx-0">
              <button
                onClick={() => onNavigate('admin')}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2 sm:py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('adminPanel')}
              </button>
            </div>
          )}

          {/* Loyalty Program Card */}
          <div className="profile-loyalty-card bg-gradient-to-br from-red-600 to-red-700 rounded-lg shadow-md p-4 sm:p-6 text-white -mx-2 sm:mx-0">
            <div className="flex items-center gap-2 mb-4">
              <Gift size={20} className="sm:w-6 sm:h-6" />
              <h3 className="text-base sm:text-lg">{t('loyaltyProgram')}</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-red-100 text-xs sm:text-sm">{t('availablePoints')}</p>
                <p className="text-xl sm:text-2xl">{pluralizePoints(loyaltyPoints || 0, language)}</p>
              </div>

              <div>
                <p className="text-red-100 text-xs sm:text-sm">{t('currentTier')}</p>
                <p className="text-base sm:text-lg">
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
                <p className="text-red-100 text-xs sm:text-sm">{t('lifetimeTotal')}</p>
                <p className="text-base sm:text-lg">{(lifetimeTotal || 0).toLocaleString()} ₽</p>
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
              className="w-full mt-4 bg-white text-red-600 py-2 rounded-lg hover:bg-red-50 transition-colors text-xs sm:text-sm"
            >
              {t('learnMore')}
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          {/* Tabs - vertical on mobile, horizontal on desktop */}
          <div className="bg-white rounded-lg shadow-md -mx-2 sm:mx-0">
            <div className="flex flex-col sm:flex-row sm:border-b sm:border-gray-200">
              <button
                onClick={() => setSettingsTab('orders')}
                className={`profile-tab flex items-center gap-2 px-4 sm:px-6 py-3 transition-colors text-sm sm:text-base border-b sm:border-b-0 border-gray-200 ${
                  settingsTab === 'orders'
                    ? 'sm:border-b-2 sm:border-red-600 text-red-600 bg-red-50 sm:bg-transparent active'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Package size={18} className="sm:w-5 sm:h-5" />
                {t('orderHistory')}
              </button>
              <button
                onClick={() => setSettingsTab('favorites')}
                className={`profile-tab flex items-center gap-2 px-4 sm:px-6 py-3 transition-colors text-sm sm:text-base border-b sm:border-b-0 border-gray-200 ${
                  settingsTab === 'favorites'
                    ? 'sm:border-b-2 sm:border-red-600 text-red-600 bg-red-50 sm:bg-transparent active'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Heart size={18} className="sm:w-5 sm:h-5" />
                {t('favorites')}
              </button>
              <button
                onClick={() => setSettingsTab('bonusHistory')}
                className={`profile-tab flex items-center gap-2 px-4 sm:px-6 py-3 transition-colors text-sm sm:text-base border-b sm:border-b-0 border-gray-200 ${
                  settingsTab === 'bonusHistory'
                    ? 'sm:border-b-2 sm:border-red-600 text-red-600 bg-red-50 sm:bg-transparent active'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <TrendingUp size={18} className="sm:w-5 sm:h-5" />
                {t('bonusPointsHistory')}
              </button>
              <button
                onClick={() => setSettingsTab('settings')}
                className={`profile-tab flex items-center gap-2 px-4 sm:px-6 py-3 transition-colors text-sm sm:text-base ${
                  settingsTab === 'settings'
                    ? 'sm:border-b-2 sm:border-red-600 text-red-600 bg-red-50 sm:bg-transparent active'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Settings size={18} className="sm:w-5 sm:h-5" />
                {t('profileSettings')}
              </button>
            </div>
          </div>

          {/* Order history */}
          {settingsTab === 'orders' && (
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 -mx-2 sm:mx-0">
              <h3 className="text-gray-800 mb-4 text-base sm:text-lg">{t('orderHistory')}</h3>

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
                    className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-red-600 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start sm:items-center justify-between mb-2 gap-2">
                      <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <Package className="text-gray-600 flex-shrink-0 mt-1 sm:mt-0" size={18} />
                        <div className="min-w-0 flex-1">
                          <p className="text-gray-800 text-sm sm:text-base break-words">
                            {t('orderNumber')} #{order.orderNumber || order.id.slice(0, 8)}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {(order.orderDate || order.createdAt) ? new Date(order.orderDate || order.createdAt!).toLocaleDateString(
                              language === 'ru' ? 'ru-RU' :
                              language === 'zh' ? 'zh-CN' :
                              language === 'vi' ? 'vi-VN' : 'en-US'
                            ) : t('invalidDate')}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${getStatusColor(order.status)}`}>
                        {t(order.status)}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 pt-3 border-t border-gray-100 gap-2">
                      <div className="text-xs sm:text-sm text-gray-600">
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
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 -mx-2 sm:mx-0">
              <h3 className="text-gray-800 mb-4 text-base sm:text-lg">{t('favorites')}</h3>

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
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 -mx-2 sm:mx-0">
              <h3 className="text-gray-800 mb-4 text-base sm:text-lg">{t('bonusPointsHistory')}</h3>

              {loyaltyHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Gift className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600 text-sm sm:text-base">{t('noBonusHistory')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-3 sm:mx-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 sm:py-3 px-1 sm:px-4 text-xs sm:text-sm text-gray-600">{t('action')}</th>
                        <th className="text-left py-2 sm:py-3 px-1 sm:px-4 text-xs sm:text-sm text-gray-600">{t('forOrder')}</th>
                        <th className="text-left py-2 sm:py-3 px-1 sm:px-4 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">{t('orderDate')}</th>
                        <th className="text-left py-2 sm:py-3 px-1 sm:px-4 text-xs sm:text-sm text-gray-600">{t('creditedDate')}</th>
                        <th className="text-right py-2 sm:py-3 px-1 sm:px-4 text-xs sm:text-sm text-gray-600">{t('pointsCredited')}</th>
                        <th className="text-right py-2 sm:py-3 px-1 sm:px-4 text-xs sm:text-sm text-gray-600">{t('pointsSpent')}</th>
                        <th className="text-left py-2 sm:py-3 px-1 sm:px-4 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">{t('tierAtCredit')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loyaltyHistory.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-2 sm:py-3 px-1 sm:px-4">
                            {item.type === 'earned' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-800 rounded text-xs sm:text-sm">
                                <TrendingUp size={12} className="sm:w-3.5 sm:h-3.5" />
                                <span className="hidden sm:inline">{t('crediting')}</span>
                                <span className="sm:hidden">+</span>
                              </span>
                            ) : item.type === 'refunded' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-purple-100 text-purple-800 rounded text-xs sm:text-sm">
                                <TrendingUp size={12} className="sm:w-3.5 sm:h-3.5" />
                                <span className="hidden sm:inline">{t('refund')}</span>
                                <span className="sm:hidden">↩</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-800 rounded text-xs sm:text-sm">
                                <Gift size={12} className="sm:w-3.5 sm:h-3.5" />
                                <span className="hidden sm:inline">{t('spending')}</span>
                                <span className="sm:hidden">-</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2 sm:py-3 px-1 sm:px-4">
                            {item.orderId ? (
                              <button
                                onClick={() => {
                                  const order = orders.find(o => o.id === item.orderId);
                                  if (order) setSelectedOrder(order);
                                }}
                                className="text-red-600 hover:text-red-700 hover:underline cursor-pointer text-xs sm:text-sm"
                              >
                                #{item.orderNumber}
                              </button>
                            ) : (
                              <span className="text-gray-600 text-xs sm:text-sm">-</span>
                            )}
                          </td>
                          <td className="py-2 sm:py-3 px-1 sm:px-4 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">
                            {item.orderDate ? new Date(item.orderDate).toLocaleDateString(
                              language === 'ru' ? 'ru-RU' :
                              language === 'zh' ? 'zh-CN' :
                              language === 'vi' ? 'vi-VN' : 'en-US'
                            ) : '-'}
                          </td>
                          <td className="py-2 sm:py-3 px-1 sm:px-4 text-xs sm:text-sm text-gray-600">
                            {new Date(item.createdAt).toLocaleDateString(
                              language === 'ru' ? 'ru-RU' :
                              language === 'zh' ? 'zh-CN' :
                              language === 'vi' ? 'vi-VN' : 'en-US'
                            )}
                          </td>
                          <td className="py-2 sm:py-3 px-1 sm:px-4 text-right text-gray-800">
                            {item.type === 'earned' || item.type === 'refunded' ? (
                              <span className={`text-xs sm:text-sm ${item.type === 'earned' ? 'bonus-history-earned text-green-600' : 'text-purple-600'}`}>+{item.points.toLocaleString()}</span>
                            ) : (
                              <span className="text-gray-400 text-xs sm:text-sm">-</span>
                            )}
                          </td>
                          <td className="py-2 sm:py-3 px-1 sm:px-4 text-right text-gray-800">
                            {item.type === 'spent' ? (
                              <span className="bonus-history-spent text-blue-600 text-xs sm:text-sm">-{item.points.toLocaleString()}</span>
                            ) : (
                              <span className="text-gray-400 text-xs sm:text-sm">-</span>
                            )}
                          </td>
                          <td className="py-2 sm:py-3 px-1 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">
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
            <div className="space-y-4 sm:space-y-6">
              {/* Email Settings */}
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 -mx-2 sm:mx-0">
                <div className="flex items-center gap-2 mb-4">
                  <Mail size={18} className="sm:w-5 sm:h-5 profile-email-icon text-red-600" />
                  <h3 className="text-gray-800 text-base sm:text-lg">{t('emailSettings')}</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-700 mb-2">{t('currentEmail')}</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {showEmailEdit ? (
                        <>
                          <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder={user?.email}
                            className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-sm sm:text-base"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdateEmail}
                              className="profile-settings-button px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base flex-1 sm:flex-initial"
                            >
                              {t('save')}
                            </button>
                            <button
                              onClick={() => {
                                setShowEmailEdit(false);
                                setNewEmail('');
                              }}
                              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base flex-1 sm:flex-initial"
                            >
                              {t('cancel')}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 px-3 sm:px-4 py-2 bg-gray-50 rounded-lg text-gray-700 break-all text-sm sm:text-base">
                            {user?.email}
                          </div>
                          <button
                            onClick={() => setShowEmailEdit(true)}
                            className="profile-settings-button px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base whitespace-nowrap"
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
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 -mx-2 sm:mx-0">
                <div className="flex items-center gap-2 mb-4">
                  <Bell size={18} className="sm:w-5 sm:h-5 profile-settings-icon text-red-600" />
                  <h3 className="text-gray-800 text-base sm:text-lg">{t('pushNotificationSettings') || 'Push Notifications'}</h3>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg gap-3">
                  <div className="flex-1">
                    <p className="text-gray-800 text-sm sm:text-base">
                      {isSubscribed ? (t('pushSubscribed') || 'You are subscribed to push notifications') : (t('pushUnsubscribed') || 'Push notifications are disabled')}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      {isSubscribed ? (t('pushSubscribedDesc') || 'You will receive notifications about orders and promotions') : (t('pushUnsubscribedDesc') || 'Enable to receive instant updates')}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleSubscription}
                    className={`profile-settings-button px-4 sm:px-6 py-2 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap ${
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
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 -mx-2 sm:mx-0">
                <div className="flex items-center gap-2 mb-4">
                  <Mail size={18} className="sm:w-5 sm:h-5 profile-settings-icon text-red-600" />
                  <h3 className="text-gray-800 text-base sm:text-lg">{t('newsletterSettings') || 'Email Newsletter'}</h3>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg gap-3">
                  <div className="flex-1">
                    <p className="text-gray-800 text-sm sm:text-base">
                      {isSubscribedToNewsletter ? (t('newsletterSubscribed') || 'Subscribed to email newsletter') : (t('newsletterUnsubscribed') || 'Not subscribed to newsletter')}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      {isSubscribedToNewsletter ? (t('newsletterSubscribedDesc') || 'You will receive promotional emails and updates') : (t('newsletterUnsubscribedDesc') || 'Subscribe to receive special offers via email')}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleNewsletterSubscription}
                    className={`profile-settings-button px-4 sm:px-6 py-2 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap ${
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
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-2 border-red-200 -mx-2 sm:mx-0">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={18} className="sm:w-5 sm:h-5 text-red-600" />
                  <h3 className="text-red-600 text-base sm:text-lg">{t('dangerZone')}</h3>
                </div>

                <div className="space-y-3">
                  <p className="text-gray-700 text-sm sm:text-base">{t('deleteAccountConfirm')}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{t('deleteAccountWarning')}</p>
                  
                  {showDeleteConfirm ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={handleDeleteAccount}
                        className="profile-settings-button flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
                      >
                        <Trash2 size={16} />
                        {t('confirmDeleteAccount')}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="profile-settings-button flex items-center justify-center gap-2 px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm sm:text-base w-full sm:w-auto"
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
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 -mx-2 sm:mx-0">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={18} className="sm:w-5 sm:h-5 text-gray-600" />
                <h3 className="text-gray-800 text-base sm:text-lg">{t('pointsHistory')}</h3>
              </div>

              <div className="space-y-2">
                {loyaltyHistory.slice(0, 10).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">
                        {entry.description.startsWith('Earned for order') 
                          ? entry.description.replace('Earned for order', t('loyaltyEarnedForOrder'))
                          : entry.description.startsWith('Refunded for cancelled order')
                          ? entry.description.replace('Refunded for cancelled order', t('loyaltyRefundedForCancelled'))
                          : entry.description.startsWith('Spent for order')
                          ? entry.description.replace('Spent for order', t('loyaltySpentForOrder'))
                          : entry.description.includes('Order') 
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