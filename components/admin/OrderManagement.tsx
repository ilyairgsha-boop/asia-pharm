import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getServerUrl } from '../../utils/supabase/client';
import { Loader2, Send } from 'lucide-react';
import { getMockOrders } from '../../utils/mockData';

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

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await fetch(getServerUrl('/admin/orders'), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        console.warn('⚠️ Server not available, using mock data for local development');
        setOrders(getMockOrders() as any);
      }
    } catch (error) {
      console.warn('⚠️ Server not available, using mock data for local development');
      setOrders(getMockOrders() as any);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingOrder(orderId);

    try {
      console.log(`📝 Updating order ${orderId} to status: ${status}`);
      
      const response = await fetch(getServerUrl(`/admin/orders/${orderId}/status`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      });

      console.log(`📥 Response status: ${response.status}`);

      if (response.ok) {
        await loadOrders();
        alert(t('saveSuccess'));
      } else {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        
        let errorMessage = t('saveError');
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = `${t('saveError')}: ${errorData.error || errorData.details || ''}`;
        } catch {
          errorMessage = `${t('saveError')}: ${errorText}`;
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error('❌ Exception updating status:', error);
      alert(`${t('saveError')}: ${error}`);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const sendTrackingNumber = async (orderId: string) => {
    const trackingNumber = prompt(t('trackNumber') + ':');
    if (!trackingNumber) return;

    setUpdatingOrder(orderId);

    try {
      const response = await fetch(getServerUrl(`/admin/orders/${orderId}/tracking`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ trackingNumber }),
      });

      if (response.ok) {
        await loadOrders();
        alert(t('saveSuccess'));
      } else {
        const error = await response.json();
        alert(`${t('saveError')}: ${error.error || ''}`);
      }
    } catch (error) {
      console.warn('⚠️ Error sending tracking number:', error);
      alert(t('saveError'));
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

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-gray-700">{t('orderNumber')}</th>
              <th className="px-6 py-3 text-left text-gray-700">{t('customer')}</th>
              <th className="px-6 py-3 text-left text-gray-700">{t('date')}</th>
              <th className="px-6 py-3 text-left text-gray-700">{t('total')}</th>
              <th className="px-6 py-3 text-left text-gray-700">{t('orderStatus')}</th>
              <th className="px-6 py-3 text-left text-gray-700">{t('trackNumber')}</th>
              <th className="px-6 py-3 text-left text-gray-700">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-800">
                  #{order.orderNumber || order.id.slice(0, 8)}
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-gray-800">
                      {order.userName || order.shippingInfo?.fullName || order.userEmail}
                    </p>
                    <p className="text-gray-600 text-sm">{order.userEmail}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {order.orderDate ? new Date(order.orderDate).toLocaleDateString('ru-RU') : '-'}
                </td>
                <td className="px-6 py-4 text-gray-800">
                  {order.totalPrice.toLocaleString()} ₽
                </td>
                <td className="px-6 py-4">
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
                <td className="px-6 py-4">
                  {order.trackingNumber ? (
                    <span className="text-gray-700 text-sm">{order.trackingNumber}</span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => sendTrackingNumber(order.id)}
                    disabled={updatingOrder === order.id}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                    title={t('sendTrackingNumber')}
                  >
                    <Send size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12 text-gray-600">{t('noProductsFound')}</div>
      )}
    </div>
  );
};
