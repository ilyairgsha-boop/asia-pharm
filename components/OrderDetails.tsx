import { X, Package, MapPin, CreditCard } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
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
}

interface OrderDetailsProps {
  order: Order;
  onClose: () => void;
  onViewPayment?: (orderNumber: string, totalAmount: number) => void;
}

export const OrderDetails = ({ order, onClose, onViewPayment }: OrderDetailsProps) => {
  const { t, language } = useLanguage();

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-gray-800">{t('orderDetails')}</h2>
            <p className="text-sm text-gray-600">
              {t('orderNumber')} {order.orderNumber}
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

          {/* Tracking Number */}
          {order.trackingNumber && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">{t('trackingNumber')}</p>
              <p className="text-gray-800">{order.trackingNumber}</p>
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
                <div key={item.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      {t('quantity')}: {item.quantity}
                    </p>
                  </div>
                  <p className="text-gray-800">
                    {(item.price * item.quantity).toLocaleString()} ₽
                  </p>
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
                <span className="text-gray-800">{order.subtotal.toLocaleString()} ₽</span>
              </div>

              {order.promoDiscount && order.promoDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{t('promoDiscount')}:</span>
                  <span>-{order.promoDiscount.toLocaleString()} ₽</span>
                </div>
              )}

              {order.loyaltyDiscount && order.loyaltyDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{t('loyaltyDiscount')}:</span>
                  <span>-{order.loyaltyDiscount.toLocaleString()} ₽</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('shipping')}:</span>
                <span className="text-gray-800">
                  {order.shippingCost === 0 ? (
                    <span className="text-green-600">{t('free')}</span>
                  ) : (
                    `${order.shippingCost.toLocaleString()} ₽`
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-800">{t('finalTotal')}:</span>
                <span className="text-red-600 text-xl">
                  {order.totalPrice.toLocaleString()} ₽
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
