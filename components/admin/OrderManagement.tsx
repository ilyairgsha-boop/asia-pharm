import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { createClient, getServerUrl, getAnonKey } from '../../utils/supabase/client';
import { Loader2, Send, Eye, X, Trash2, Search } from 'lucide-react';
import { getMockOrders } from '../../utils/mockData';
import { toast } from 'sonner';

interface Order {
  id: string;
  orderNumber?: string;
  userId: string;
  userEmail: string;
  userName?: string;
  orderDate: string;
  status: string;
  trackingNumber?: string;
  totalPrice: number;
  items: any[];
  shippingInfo: any;
  store?: string;
}

export const OrderManagement = () => {
  const { t } = useLanguage();
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [orderToChangeStatus, setOrderToChangeStatus] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️ Error loading orders:', error);
        setOrders(getMockOrders() as any);
      } else if (data) {
        // Map to Order format
        const mappedOrders = data.map((order: any) => ({
          id: order.id,
          orderNumber: order.order_number,
          userId: order.user_id,
          userEmail: order.email || '',
          userName: order.full_name || '',
          orderDate: order.created_at,
          status: order.status,
          trackingNumber: order.tracking_number,
          totalPrice: order.total,
          items: order.items || [],
          shippingInfo: order.shipping_info || {},
          store: order.store,
        }));
        setOrders(mappedOrders);
      } else {
        console.warn('⚠️ No orders in database, using mock data');
        setOrders(getMockOrders() as any);
      }
    } catch (error) {
      console.warn('⚠️ Error loading orders:', error);
      setOrders(getMockOrders() as any);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingOrder(orderId);

    try {
      console.log(`📝 Updating order ${orderId} to status: ${status}`);
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(orderId)) {
        console.warn('⚠️ Invalid UUID format for order ID:', orderId);
        toast.error(t('invalidOrderId'));
        setUpdatingOrder(null);
        return;
      }
      
      const supabase = createClient();
      
      // Get order details before updating
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      console.log('📦 Order data before update:', {
        id: orderData?.id,
        email: orderData?.email,
        hasEmail: !!orderData?.email,
        status: orderData?.status,
      });
      
      // Update order status
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) {
        console.error('❌ Error updating status:', error);
        toast.error(`${t('saveError')}: ${error.message}`);
      } else {
        // If status changed to "delivered", earn loyalty points
        if (status === 'delivered' && orderData && orderData.user_id && !orderData.loyalty_points_earned) {
          await awardLoyaltyPoints(orderData);
        }
        
        // Send email notification about status change
        if (orderData && orderData.email && accessToken) {
          try {
            console.log(`📧 Sending order status email:`, {
              orderId,
              email: orderData.email,
              status,
              hasAccessToken: !!accessToken,
            });
            const emailUrl = getServerUrl('/api/email/order-status');
            const emailResponse = await fetch(emailUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'apikey': getAnonKey(),
              },
              body: JSON.stringify({
                orderId,
                email: orderData.email,
                status,
              }),
            });

            if (emailResponse.ok) {
              const emailResult = await emailResponse.json();
              console.log('✅ Order status email sent successfully:', emailResult);
              toast.success(t('emailNotificationSent'));
            } else {
              const errorData = await emailResponse.json();
              console.error('❌ Failed to send order status email:', {
                status: emailResponse.status,
                error: errorData,
              });
              toast.warning('Email не отправлен: ' + (errorData.error || 'Неизвестная ошибка'));
            }
          } catch (emailError) {
            console.error('❌ Email send error (non-critical):', emailError);
            toast.warning('Ошибка отправки email: ' + emailError);
          }
        } else {
          console.warn('⚠️ Email not sent - missing data:', {
            hasOrderData: !!orderData,
            hasEmail: !!orderData?.email,
            hasAccessToken: !!accessToken,
          });
        }
        
        // Send push notification about status change
        if (orderData && orderData.user_id) {
          try {
            // Map order status to push notification type
            const statusToPushType: Record<string, string> = {
              'pending': 'order_pending',
              'processing': 'order_processing',
              'shipped': 'order_shipped',
              'delivered': 'order_delivered',
              'cancelled': 'order_cancelled',
            };
            
            const pushType = statusToPushType[status] || 'order_pending';
            const pushPayload = {
              userId: orderData.user_id,
              type: pushType,
              orderId,
              orderNumber: orderData.order_number,
            };
            
            console.log(`📱 Sending order status push notification:`, pushPayload);
            
            const pushUrl = getServerUrl('/api/push/auto-notify');
            console.log('📤 Push URL:', pushUrl);
            
            const pushResponse = await fetch(pushUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(pushPayload),
            });

            console.log('📥 Push response status:', pushResponse.status);

            if (pushResponse.ok) {
              const pushResult = await pushResponse.json();
              console.log('✅ Push notification sent successfully:', pushResult);
              toast.success(t('pushNotificationSent'));
            } else {
              const errorData = await pushResponse.json().catch(() => ({}));
              console.error('❌ Failed to send push notification:', {
                status: pushResponse.status,
                error: errorData
              });
              toast.warning('Push не отправлен: ' + (errorData.error || 'Неизвестная ошибка'));
            }
          } catch (pushError) {
            console.error('❌ Push notification error (non-critical):', pushError);
            toast.warning('Ошибка отправки push: ' + pushError);
          }
        } else {
          console.warn('⚠️ Push not sent - missing user_id:', {
            hasOrderData: !!orderData,
            hasUserId: !!orderData?.user_id,
          });
        }
        
        await loadOrders();
        toast.success(t('saveSuccess'));
      }
    } catch (error) {
      console.error('❌ Exception updating status:', error);
      toast.error(`${t('saveError')}: ${error}`);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const awardLoyaltyPoints = async (order: any) => {
    try {
      const supabase = createClient();
      
      // Calculate subtotal without samples (пробники не участвуют в программе лояльности)
      const items = order.items || [];
      const subtotalWithoutSamples = items
        .filter((item: any) => !item.isSample)
        .reduce((sum: number, item: any) => {
          // Use actualPrice if available (price at time of purchase), otherwise use regular price
          const itemPrice = item.actualPrice ?? item.price ?? 0;
          return sum + itemPrice * (item.quantity || 0);
        }, 0);
      
      if (subtotalWithoutSamples <= 0) {
        console.log('ℹ️ No eligible items for loyalty points (only samples or zero amount)');
        return;
      }
      
      // Subtract loyalty points used from the subtotal
      // Points are earned only on the amount actually paid (excluding used loyalty points and shipping)
      const loyaltyPointsUsed = order.loyalty_points_used || 0;
      const amountForCashback = Math.max(0, subtotalWithoutSamples - loyaltyPointsUsed);
      
      if (amountForCashback <= 0) {
        console.log('ℹ️ No eligible amount for loyalty points (used loyalty points cover entire order)');
        return;
      }
      
      // Calculate user's loyalty tier based on lifetime spending
      const { data: ordersData } = await supabase
        .from('orders')
        .select('subtotal, total')
        .eq('user_id', order.user_id)
        .in('status', ['delivered', 'shipped', 'processing']);
      
      let currentTier: 'basic' | 'silver' | 'gold' | 'platinum' = 'basic';
      if (ordersData) {
        const lifetime = ordersData.reduce((sum, o) => sum + (o.subtotal || o.total || 0), 0);
        
        if (lifetime >= 200000) {
          currentTier = 'platinum';
        } else if (lifetime >= 100000) {
          currentTier = 'gold';
        } else if (lifetime >= 50000) {
          currentTier = 'silver';
        }
      }
      
      // Calculate cashback percentage based on tier
      const cashbackPercentage = 
        currentTier === 'platinum' ? 0.10 :
        currentTier === 'gold' ? 0.07 :
        currentTier === 'silver' ? 0.05 :
        0.03; // basic
      
      const pointsEarned = Math.floor(amountForCashback * cashbackPercentage);
      
      // Get current loyalty points
      const { data: profileData } = await supabase
        .from('profiles')
        .select('loyalty_points')
        .eq('id', order.user_id)
        .single();
      
      const currentPoints = profileData?.loyalty_points || 0;
      const newPoints = currentPoints + pointsEarned;
      
      // Update profile with new loyalty points
      await supabase
        .from('profiles')
        .update({ loyalty_points: newPoints })
        .eq('id', order.user_id);
      
      // Add loyalty history record
      await supabase
        .from('loyalty_history')
        .insert([{
          user_id: order.user_id,
          points: pointsEarned,
          type: 'earned',
          description: `Начислено за заказ #${order.order_number || order.id.slice(0, 8)}`,
          order_id: order.id
        }]);
      
      // Mark order as loyalty points earned
      await supabase
        .from('orders')
        .update({ loyalty_points_earned: true })
        .eq('id', order.id);
      
      console.log(`✅ Loyalty points awarded: ${pointsEarned} points (${currentTier} tier - ${cashbackPercentage * 100}%) to user ${order.user_id}`);
      toast.success(`${t('loyaltyPointsAwarded')}: ${pointsEarned} ${t('points')}`);
    } catch (error) {
      console.error('❌ Error awarding loyalty points:', error);
      // Don't show error to admin, just log it
    }
  };

  const sendTrackingNumber = async (orderId: string) => {
    const trackingNumber = prompt(t('trackNumber') + ':');
    if (!trackingNumber) return;

    setUpdatingOrder(orderId);

    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(orderId)) {
        console.warn('️ Invalid UUID format for order ID:', orderId);
        toast.error(t('invalidOrderId'));
        setUpdatingOrder(null);
        return;
      }
      
      const supabase = createClient();
      const { error } = await supabase
        .from('orders')
        .update({ 
          tracking_number: trackingNumber,
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId);

      if (error) {
        console.error('❌ Error updating tracking:', error);
        toast.error(`${t('saveError')}: ${error.message}`);
      } else {
        await loadOrders();
        toast.success(t('saveSuccess'));
      }
    } catch (error) {
      console.warn('⚠️ Error sending tracking number:', error);
      toast.error(t('saveError'));
    } finally {
      setUpdatingOrder(null);
    }
  };

  const deleteOrder = async () => {
    if (!orderToDelete) return;

    setUpdatingOrder(orderToDelete.id);

    try {
      console.log(`🗑️ Deleting order ${orderToDelete.id}`);
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(orderToDelete.id)) {
        console.warn('⚠️ Invalid UUID format for order ID:', orderToDelete.id);
        toast.error(t('invalidOrderId'));
        setUpdatingOrder(null);
        return;
      }
      
      const supabase = createClient();
      
      // Delete order from database
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderToDelete.id);

      if (error) {
        console.error('❌ Error deleting order:', error);
        toast.error(`${t('deleteError')}: ${error.message}`);
      } else {
        console.log(`✅ Order ${orderToDelete.id} deleted successfully`);
        await loadOrders();
        toast.success(t('orderDeleted'));
        setDeleteConfirmOpen(false);
        setOrderToDelete(null);
      }
    } catch (error) {
      console.error('❌ Exception deleting order:', error);
      toast.error(`${t('deleteError')}: ${error}`);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-red-600" size={48} />
      </div>
    );
  }

  // Filter orders based on search query
  const filteredOrders = orders.filter(order => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const orderNumber = order.orderNumber || order.id.slice(0, 8);
    const userName = (order.userName || '').toLowerCase();
    const userEmail = (order.userEmail || '').toLowerCase();
    const fullName = (order.shippingInfo?.fullName || '').toLowerCase();
    const phone = (order.shippingInfo?.phone || '').toLowerCase();
    const trackingNumber = (order.trackingNumber || '').toLowerCase();
    const status = t(order.status).toLowerCase();
    
    return (
      orderNumber.toLowerCase().includes(query) ||
      userName.includes(query) ||
      userEmail.includes(query) ||
      fullName.includes(query) ||
      phone.includes(query) ||
      trackingNumber.includes(query) ||
      status.includes(query)
    );
  });

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${t('search')} (${t('orderNumber')}, Email, ${t('fullNameLabel')}, ${t('phoneLabel')}, ${t('trackNumber')}...)`}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {t('totalFound')}: {filteredOrders.length} {t('of')} {orders.length}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-2 sm:px-6 py-3 text-left text-gray-700 text-xs sm:text-sm">{t('orderNumber')}</th>
              <th className="px-1 sm:px-6 py-3 text-left text-gray-700 text-xs sm:text-sm">{t('customer')}</th>
              <th className="px-1 sm:px-6 py-3 text-left text-gray-700 text-xs sm:text-sm">{t('date')}</th>
              <th className="px-2 sm:px-6 py-3 text-left text-gray-700 text-xs sm:text-sm">{t('total')}</th>
              <th className="px-2 sm:px-6 py-3 text-left text-gray-700 text-xs sm:text-sm hidden sm:table-cell">{t('orderStatus')}</th>
              <th className="px-2 sm:px-6 py-3 text-left text-gray-700 text-xs sm:text-sm hidden sm:table-cell">{t('trackNumber')}</th>
              <th className="px-2 sm:px-6 py-3 text-left text-gray-700 text-xs sm:text-sm">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-2 sm:px-6 py-4 text-gray-800 text-xs sm:text-sm">
                  #{order.orderNumber || order.id.slice(0, 8)}
                </td>
                <td className="px-1 sm:px-6 py-4">
                  <div>
                    <p className="text-gray-800 text-xs sm:text-sm">
                      {order.userName || order.shippingInfo?.fullName || order.userEmail}
                    </p>
                    <p className="text-gray-600 text-xs hidden sm:block">{order.userEmail}</p>
                  </div>
                </td>
                <td className="px-1 sm:px-6 py-4 text-gray-700 text-xs sm:text-sm">
                  {order.orderDate ? new Date(order.orderDate).toLocaleDateString('ru-RU') : '-'}
                </td>
                <td className="px-2 sm:px-6 py-4 text-gray-800 text-xs sm:text-sm">
                  {(order.totalPrice || 0).toLocaleString()} ₽
                </td>
                <td className="px-2 sm:px-6 py-4 hidden sm:table-cell">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    disabled={updatingOrder === order.id}
                    className={`px-3 py-1 rounded-full text-sm border-0 ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {t(status)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 sm:px-6 py-4 hidden sm:table-cell">
                  {order.trackingNumber ? (
                    <span className="text-gray-700 text-sm">{order.trackingNumber}</span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-2 sm:px-6 py-4">
                  <div className="flex items-center gap-1">
                    {/* Status button - mobile only */}
                    <button
                      onClick={() => {
                        setOrderToChangeStatus(order);
                        setStatusModalOpen(true);
                      }}
                      disabled={updatingOrder === order.id}
                      className={`sm:hidden p-1 rounded text-white ${getStatusColor(order.status)} hover:opacity-80`}
                      title={t('orderStatus')}
                    >
                      <span className="text-xs px-1">{t(order.status).substring(0, 3)}</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setDetailsOpen(true);
                      }}
                      className="p-1 sm:p-2 text-green-600 hover:text-green-700 bg-white"
                      title="Детали заказа"
                    >
                      <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                    <button
                      onClick={() => sendTrackingNumber(order.id)}
                      disabled={updatingOrder === order.id}
                      className="p-1 sm:p-2 text-blue-600 hover:text-blue-700 disabled:text-gray-400 bg-white"
                      title={t('sendTrackingNumber')}
                    >
                      <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                    <button
                      onClick={() => {
                        setOrderToDelete(order);
                        setDeleteConfirmOpen(true);
                      }}
                      disabled={updatingOrder === order.id}
                      className="p-1 sm:p-2 text-red-600 hover:text-red-700 disabled:text-gray-400 bg-white"
                      title={t('deleteOrder')}
                    >
                      <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12 text-gray-600">{t('noProductsFound')}</div>
      )}

      {/* Order Details Modal */}
      {detailsOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl text-gray-800">
                {t('orderDetails')} #{selectedOrder.orderNumber || selectedOrder.id.slice(0, 8)}
              </h2>
              <button
                onClick={() => {
                  setDetailsOpen(false);
                  setSelectedOrder(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg text-gray-800 mb-3">{t('customerInfo')}</h3>
                  <div className="space-y-2">
                    <p><span className="text-gray-600">{t('fullNameLabel')}:</span> <strong>{selectedOrder.shippingInfo?.fullName || selectedOrder.userName || t('notSpecifiedNeut')}</strong></p>
                    <p><span className="text-gray-600">{t('emailLabel')}:</span> <strong>{selectedOrder.userEmail}</strong></p>
                    <p><span className="text-gray-600">{t('phoneLabel')}:</span> <strong>{selectedOrder.shippingInfo?.phone || t('notSpecified')}</strong></p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg text-gray-800 mb-3">{t('shippingAddress')}</h3>
                  <div className="space-y-2">
                    <p><span className="text-gray-600">{t('regionLabel')}:</span> <strong>{selectedOrder.shippingInfo?.region || t('notSpecified')}</strong></p>
                    <p><span className="text-gray-600">{t('cityLabel')}:</span> <strong>{selectedOrder.shippingInfo?.city || t('notSpecified')}</strong></p>
                    <p><span className="text-gray-600">{t('addressLabel')}:</span> <strong>{selectedOrder.shippingInfo?.address || t('notSpecified')}</strong></p>
                    <p><span className="text-gray-600">{t('postalOrPVZ')}:</span> <strong>{selectedOrder.shippingInfo?.postalCode || t('notSpecified')}</strong></p>
                  </div>
                </div>
              </div>
              
              {/* Order Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg text-gray-800 mb-3">{t('orderInfo')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">{t('orderDateLabel')}</p>
                    <p className="font-semibold">{selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleDateString('ru-RU') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">{t('statusLabel')}</p>
                    <p className="font-semibold">{t(selectedOrder.status)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">{t('deliveryMethodLabel')}</p>
                    <p className="font-semibold">{selectedOrder.shippingInfo?.deliveryMethod ? t(selectedOrder.shippingInfo.deliveryMethod) : t('notSpecified')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">{t('trackingNumberLabel')}</p>
                    <p className="font-semibold">{selectedOrder.trackingNumber || t('notSpecified')}</p>
                  </div>
                </div>
              </div>
              
              {/* Products */}
              <div>
                <h3 className="text-lg text-gray-800 mb-3">{t('productsInOrder')}</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-700">{t('productLabel')}</th>
                        <th className="px-4 py-3 text-center text-gray-700">{t('quantityLabel')}</th>
                        <th className="px-4 py-3 text-right text-gray-700">{t('priceLabel')}</th>
                        <th className="px-4 py-3 text-right text-gray-700">{t('sumLabel')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedOrder.items?.map((item: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {item.image && (
                                <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                              )}
                              <span className="text-gray-800">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{item.price?.toLocaleString()} ₽</td>
                          <td className="px-4 py-3 text-right text-gray-800 font-semibold">
                            {((item.price || 0) * (item.quantity || 0)).toLocaleString()} ₽
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Totals */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-600">{t('productsSubtotal')}</p>
                    <p className="text-xl font-semibold text-gray-800">
                      {(selectedOrder as any).subtotal?.toLocaleString() || 
                       selectedOrder.items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0).toLocaleString()} ₽
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t('shippingCost')}</p>
                    <p className="text-xl font-semibold text-gray-800">
                      {((selectedOrder as any).shippingCost || 0).toLocaleString()} ₽
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t('totalPayment')}</p>
                    <p className="text-2xl font-bold text-red-600">
                      {(selectedOrder.totalPrice || 0).toLocaleString()} ₽
                    </p>
                  </div>
                </div>
                
                {(selectedOrder as any).promoCode && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-gray-600">
                      Применен промокод: <strong>{(selectedOrder as any).promoCode}</strong>
                      {' '} (скидка: {(selectedOrder as any).promoDiscount?.toLocaleString()} ₽)
                    </p>
                  </div>
                )}
                
                {(selectedOrder as any).loyaltyPointsUsed > 0 && (
                  <div className="mt-2">
                    <p className="text-gray-600">
                      Списано баллов: <strong>{(selectedOrder as any).loyaltyPointsUsed}</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
              <button
                onClick={() => {
                  setDetailsOpen(false);
                  setSelectedOrder(null);
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && orderToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl text-gray-800">{t('deleteOrder')}</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                {t('deleteOrderConfirm')}
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">
                  ⚠️ {t('deleteOrderWarning')}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">
                  <strong>{t('orderNumber')}:</strong> #{orderToDelete.orderNumber || orderToDelete.id.slice(0, 8)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>{t('customer')}:</strong> {orderToDelete.userName || orderToDelete.userEmail}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>{t('total')}:</strong> {orderToDelete.totalPrice.toLocaleString()} ₽
                </p>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setOrderToDelete(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                disabled={updatingOrder === orderToDelete.id}
              >
                {t('cancel')}
              </button>
              <button
                onClick={deleteOrder}
                disabled={updatingOrder === orderToDelete.id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                {updatingOrder === orderToDelete.id ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    {t('deleting')}
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    {t('delete')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal - Mobile */}
      {statusModalOpen && orderToChangeStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl text-gray-800">{t('changeStatus')}</h3>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                {t('orderNumber')} #{orderToChangeStatus.orderNumber || orderToChangeStatus.id.slice(0, 8)}
              </p>
              <div className="space-y-2">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      updateOrderStatus(orderToChangeStatus.id, status);
                      setStatusModalOpen(false);
                      setOrderToChangeStatus(null);
                    }}
                    disabled={updatingOrder === orderToChangeStatus.id}
                    className={`w-full text-left px-4 py-3 rounded-lg ${getStatusColor(status)} hover:opacity-80 transition-opacity ${
                      orderToChangeStatus.status === status ? 'ring-2 ring-red-600' : ''
                    }`}
                  >
                    {t(status)}
                    {orderToChangeStatus.status === status && ' ✓'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
              <button
                onClick={() => {
                  setStatusModalOpen(false);
                  setOrderToChangeStatus(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};