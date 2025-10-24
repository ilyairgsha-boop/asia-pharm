import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getServerUrl } from '../../utils/supabase/client';
import { TrendingUp, TrendingDown, ShoppingBag, DollarSign, Users, Award, Store } from 'lucide-react';

interface AnalyticsData {
  ordersToday: number;
  revenueToday: number;
  newCustomers: number;
  loyaltyPointsIssued: number;
  ordersYesterday: number;
  revenueYesterday: number;
  storeStats: {
    china: { orders: number; revenue: number };
    thailand: { orders: number; revenue: number };
    vietnam: { orders: number; revenue: number };
  };
}

export const Analytics = () => {
  const { t } = useLanguage();
  const { accessToken } = useAuth();
  const [data, setData] = useState<AnalyticsData>({
    ordersToday: 0,
    revenueToday: 0,
    newCustomers: 0,
    loyaltyPointsIssued: 0,
    ordersYesterday: 0,
    revenueYesterday: 0,
    storeStats: {
      china: { orders: 0, revenue: 0 },
      thailand: { orders: 0, revenue: 0 },
      vietnam: { orders: 0, revenue: 0 },
    },
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await fetch(getServerUrl('/admin/analytics'), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.warn('⚠️ Server not available, analytics unavailable');
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const ordersChange = calculateChange(data.ordersToday, data.ordersYesterday);
  const revenueChange = calculateChange(data.revenueToday, data.revenueYesterday);

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Orders Today */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShoppingBag className="text-blue-600" size={24} />
              <h4 className="text-gray-600 text-sm">{t('ordersToday')}</h4>
            </div>
            {ordersChange > 0 ? (
              <TrendingUp className="text-green-600" size={20} />
            ) : (
              <TrendingDown className="text-red-600" size={20} />
            )}
          </div>
          <div className="text-3xl text-gray-800 mb-1">{data.ordersToday}</div>
          <div className={`text-sm ${ordersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {ordersChange >= 0 ? '+' : ''}{ordersChange.toFixed(1)}% {t('fromYesterday')}
          </div>
        </div>

        {/* Revenue Today */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="text-green-600" size={24} />
              <h4 className="text-gray-600 text-sm">{t('revenueToday')}</h4>
            </div>
            {revenueChange > 0 ? (
              <TrendingUp className="text-green-600" size={20} />
            ) : (
              <TrendingDown className="text-red-600" size={20} />
            )}
          </div>
          <div className="text-3xl text-gray-800 mb-1">
            {data.revenueToday.toLocaleString()} ₽
          </div>
          <div className={`text-sm ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}% {t('fromYesterday')}
          </div>
        </div>

        {/* New Customers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-purple-600" size={24} />
            <h4 className="text-gray-600 text-sm">{t('newCustomers')}</h4>
          </div>
          <div className="text-3xl text-gray-800 mb-1">{data.newCustomers}</div>
          <div className="text-sm text-gray-600">{t('forToday')}</div>
        </div>

        {/* Loyalty Points */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-2">
            <Award className="text-yellow-600" size={24} />
            <h4 className="text-gray-600 text-sm">{t('loyaltyPointsIssued')}</h4>
          </div>
          <div className="text-3xl text-gray-800 mb-1">
            {data.loyaltyPointsIssued.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">{t('issuedToday')}</div>
        </div>
      </div>

      {/* Store Statistics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-6">
          <Store className="text-red-600" size={24} />
          <h3 className="text-gray-800">{t('storeStatistics')}</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* China Store */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-gray-800 mb-3">{t('chinaStore')}</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('orders')}:</span>
                <span className="text-gray-800">{data.storeStats.china.orders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('revenueToday')}:</span>
                <span className="text-gray-800">
                  {data.storeStats.china.revenue.toLocaleString()} ₽
                </span>
              </div>
            </div>
          </div>

          {/* Thailand Store */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-gray-800 mb-3">{t('thailandStore')}</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('orders')}:</span>
                <span className="text-gray-800">{data.storeStats.thailand.orders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('revenueToday')}:</span>
                <span className="text-gray-800">
                  {data.storeStats.thailand.revenue.toLocaleString()} ₽
                </span>
              </div>
            </div>
          </div>

          {/* Vietnam Store */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-gray-800 mb-3">{t('vietnamStore')}</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('orders')}:</span>
                <span className="text-gray-800">{data.storeStats.vietnam.orders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('revenueToday')}:</span>
                <span className="text-gray-800">
                  {data.storeStats.vietnam.revenue.toLocaleString()} ₽
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
