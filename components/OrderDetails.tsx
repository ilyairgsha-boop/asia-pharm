import { X, Package, MapPin, CreditCard, Gift, Tag } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isSample?: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  totalPrice: number;
  subtotal: number;
  shippingCost: number;
  promoDiscount?: number;
  loyaltyDiscount?: number;
  loyaltyPointsUsed?: number;
  loyaltyPointsEarned?: boolean;
  promoCode?: string;
  items: OrderItem[];
  shippingInfo: {
    fullName: string;
    phone: string;
    region: string;
    city: string;
    address: string;
    deliveryMethod: string;
  };
  store: string;
  trackingNumber?: string;
  user_id?: string;
}

interface OrderDetailsProps {
  order: Order;
  onClose: () => void;
  onViewPayment?: (orderNumber: string, totalAmount: number) => void;
  onNavigate?: (page: string, productId?: string) => void;
}

export const OrderDetails = ({ order, onClose, onViewPayment, onNavigate }: OrderDetailsProps) => {
  const { t, language } = useLanguage();
  const [loyaltyPointsToEarn, setLoyaltyPointsToEarn] = useState(0);
  const [currentTier, setCurrentTier] = useState<'basic' | 'silver' | 'gold' | 'platinum'>('basic');

  useEffect(() => {
    calculateLoyaltyPoints();
  }, [order]);

  const calculateLoyaltyPoints = async () => {
    if (!order.user_id || order.status === 'cancelled') {
      setLoyaltyPointsToEarn(0);
      return;
    }

    try {
      const supabase = createClient();
      
      // Calculate subtotal without samples
      const items = order.items || [];
      const subtotalWithoutSamples = items
        .filter((item: any) => !item.isSample)
        .reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 0), 0);
      
      if (subtotalWithoutSamples <= 0) {
        setLoyaltyPointsToEarn(0);
        return;
      }
      
      // Subtract loyalty points used from the subtotal
      const loyaltyPointsUsed = order.loyaltyPointsUsed || 0;
      const amountForCashback = Math.max(0, subtotalWithoutSamples - loyaltyPointsUsed);
      
      if (amountForCashback <= 0) {
        setLoyaltyPointsToEarn(0);
        return;
      }
      
      // Calculate user's loyalty tier based on lifetime spending
      const { data: ordersData } = await supabase
        .from('orders')
        .select('subtotal, total')
        .eq('user_id', order.user_id)
        .in('status', ['delivered', 'shipped', 'processing']);
      
      let tier: 'basic' | 'silver' | 'gold' | 'platinum' = 'basic';
      if (ordersData) {
        const lifetime = ordersData.reduce((sum, o) => sum + (o.subtotal || o.total || 0), 0);
        
        if (lifetime >= 200000) {
          tier = 'platinum';
        } else if (lifetime >= 100000) {
          tier = 'gold';
        } else if (lifetime >= 50000) {
          tier = 'silver';
        }
      }
      
      setCurrentTier(tier);
      
      // Calculate cashback percentage based on tier
      const cashbackPercentage = 
        tier === 'platinum' ? 0.10 :
        tier === 'gold' ? 0.07 :
        tier === 'silver' ? 0.05 :
        0.03; // basic
      
      const points = Math.floor(amountForCashback * cashbackPercentage);
      setLoyaltyPointsToEarn(points);
    } catch (error) {
      console.error('Error calculating loyalty points:', error);
      setLoyaltyPointsToEarn(0);
    }
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeliveryMethodName = (method: string) => {
    switch (method) {
      case 'russian_post':
        return t('russianPost');
      case 'pyaterochka':
        return t('pyaterochkaPickup');
      case 'air_delivery':
        return t('airDelivery');
      default:
        return method;
    }
  };

  const handleProductClick = (productId: string) => {
    if (onNavigate) {
      onClose();
      // Navigate to product details
      onNavigate('product', productId);
    }
  };

  const getTierName = (tier: string) => {
    switch (tier) {
      case 'platinum': return `💎 ${t('tierPlatinum')} (10%)`;
      case 'gold': return `🥇 ${t('tierGold')} (7%)`;
      case 'silver': return `🥈 ${t('tierSilver')} (5%)`;
      default: return `🔰 ${t('tierBasic')} (3%)`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-gray-800">{t('orderDetails')}</h2>
            <p className="text-sm text-gray-600">
              {t('orderNumber')} #{order.orderNumber || order.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Date */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('orderDate')}</p>
              <p className="text-gray-800">
                {order.createdAt ? (() => {
                  try {
                    const date = new Date(order.createdAt);
                    if (isNaN(date.getTime())) {
                      return t('invalidDate') || '-';
                    }
                    return date.toLocaleDateString(
                      language === 'ru' ? 'ru-RU' :
                      language === 'zh' ? 'zh-CN' :
                      language === 'vi' ? 'vi-VN' : 'en-US',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }
                    );
                  } catch (e) {
                    console.error('Error formatting date:', e);
                    return t('invalidDate') || '-';
                  }
                })() : t('invalidDate') || '-'}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
              {t(order.status)}
            </span>
          </div>

          {/* Payment Info Button for pending orders */}
          {order.status === 'pending' && onViewPayment && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-800 mb-1">⚠️ {t('pending')}</p>
                  <p className="text-sm text-gray-600">
                    {t('viewPaymentInfo')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onViewPayment(order.orderNumber, order.totalPrice)}
                className="w-full mt-3 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard size={20} />
                {t('viewPaymentInfo')}
              </button>
            </div>
          )}

          {/* Loyalty Points Status */}
          {order.status !== 'cancelled' && loyaltyPointsToEarn > 0 && (
            <>
              {/* Already Earned Points - when delivered */}
              {order.status === 'delivered' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Gift size={20} className="text-green-600" />
                    <p className="text-green-800">
                      ✅ {loyaltyPointsToEarn.toLocaleString()} {t('pointsEarnedMessage') || 'баллов начислено'}
                    </p>
                  </div>
                </div>
              ) : (
                /* Points to Be Earned - for all other cases */
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift size={20} className="text-red-600" />
                    <p className="text-gray-800">{t('loyaltyPointsToEarn') || 'Баллы к начислению'}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {t('loyaltyPointsAfterDelivery') || 'После доставки заказа'}
                    </p>
                    <div className="text-right">
                      <p className="text-2xl text-red-600">+{loyaltyPointsToEarn.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{getTierName(currentTier)}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Promo Code and Loyalty Points Used */}
          {((order.promoCode && order.promoDiscount && order.promoDiscount > 0) || (order.loyaltyPointsUsed && order.loyaltyPointsUsed > 0)) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag size={20} className="text-blue-600" />
                <h3 className="text-gray-800">{t('discountsApplied') || 'Применённые скидки'}</h3>
              </div>
              <div className="space-y-2 text-sm">
                {order.promoCode && order.promoDiscount && order.promoDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('promoCode') || 'Промокод'}:</span>
                    <span className="text-gray-800">{order.promoCode} (-{(order.promoDiscount || 0).toLocaleString()} ₽)</span>
                  </div>
                )}
                {order.loyaltyPointsUsed && order.loyaltyPointsUsed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('loyaltyPointsUsed') || 'Использовано баллов'}:</span>
                    <span className="text-gray-800">{order.loyaltyPointsUsed.toLocaleString()} {t('points')} (-{(order.loyaltyDiscount || order.loyaltyPointsUsed || 0).toLocaleString()} ₽)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tracking Number */}
          {order.trackingNumber && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">{t('trackingNumber')}</p>
              <a
                href={order.trackingNumber}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
              >
                {t('clickHereToTrack') || 'Нажмите здесь'} {t('toTrackYourOrder') || 'чтобы отследить свой заказ'}
              </a>
            </div>
          )}

          {/* Order Items */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package size={20} className="text-gray-600" />
              <h3 className="text-gray-800">{t('orderItems')}</h3>
            </div>
            <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
              {order.items.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <button
                        onClick={() => handleProductClick(item.id)}
                        className="text-gray-800 hover:text-red-600 transition-colors text-left hover:underline"
                      >
                        {item.name}
                        {item.isSample && (
                          <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            {t('sample') || 'Пробник'}
                          </span>
                        )}
                      </button>
                      <p className="text-sm text-gray-600 mt-1">
                        {t('quantity')}: {item.quantity} × {(item.price || 0).toLocaleString()} ₽
                      </p>
                    </div>
                    <p className="text-gray-800 ml-4">
                      {((item.price || 0) * (item.quantity || 0)).toLocaleString()} ₽
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Details */}
          {order.shippingInfo && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={20} className="text-gray-600" />
                <h3 className="text-gray-800">{t('shippingDetails')}</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">{t('fullName')}:</span>{' '}
                  <span className="text-gray-800">{order.shippingInfo.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('phone')}:</span>{' '}
                  <span className="text-gray-800">{order.shippingInfo.phone}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('deliveryMethod')}:</span>{' '}
                  <span className="text-gray-800">
                    {getDeliveryMethodName(order.shippingInfo.deliveryMethod)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">{t('address')}:</span>{' '}
                  <span className="text-gray-800">
                    {order.shippingInfo.region}, {order.shippingInfo.city},{' '}
                    {order.shippingInfo.address}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">{t('selectStore')}:</span>{' '}
                  <span className="text-gray-800">{t(`${order.store}Store`)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Details */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={20} className="text-gray-600" />
              <h3 className="text-gray-800">{t('orderSummary')}</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('subtotal')}:</span>
                <span className="text-gray-800">{(order.subtotal || 0).toLocaleString()} ₽</span>
              </div>

              {order.loyaltyDiscount && order.loyaltyDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{t('loyaltyDiscount')}:</span>
                  <span>-{(order.loyaltyDiscount || 0).toLocaleString()} ₽</span>
                </div>
              )}

              {order.promoDiscount && order.promoDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{t('promoDiscount')}:</span>
                  <span>-{(order.promoDiscount || 0).toLocaleString()} ₽</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('shipping')}:</span>
                <span className="text-gray-800">
                  {order.shippingCost === 0 ? (
                    <span className="text-green-600">{t('free')}</span>
                  ) : (
                    `${(order.shippingCost || 0).toLocaleString()} ₽`
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-800">{t('finalTotal')}:</span>
                <span className="text-red-600 text-xl">
                  {(order.totalPrice || 0).toLocaleString()} ₽
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
