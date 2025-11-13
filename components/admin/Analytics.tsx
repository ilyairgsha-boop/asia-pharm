import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { createClient } from '../../utils/supabase/client';
import { TrendingUp, TrendingDown, ShoppingBag, DollarSign, Users, Award, Store } from 'lucide-react';
import { Button } from '../ui/button';

type Period = 'today' | 'week' | 'month' | 'year' | 'all';

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
  const [period, setPeriod] = useState<Period>('today');
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
  }, [period]);

  const loadAnalytics = async () => {
    try {
      const supabase = createClient();
      
      // Calculate date ranges based on period
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(0); // All time
      }
      
      // Fetch orders for the period
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total, created_at, store')
        .gte('created_at', startDate.toISOString());
      
      // Fetch users for the period
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, created_at, loyalty_points')
        .gte('created_at', startDate.toISOString());
      
      if (ordersError || usersError) {
        console.warn('⚠️ Error loading analytics:', ordersError || usersError);
        return;
      }
      
      // Calculate analytics
      const ordersToday = orders?.length || 0;
      const revenueToday = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
      const newCustomers = users?.length || 0;
      const loyaltyPoints = users?.reduce((sum, u) => sum + (u.loyalty_points || 0), 0) || 0;
      
      // Group by store
      const storeStats = (orders || []).reduce((acc: any, order) => {
        const store = order.store || 'unknown';
        if (!acc[store]) {
          acc[store] = { orders: 0, revenue: 0 };
        }
        acc[store].orders += 1;
        acc[store].revenue += order.total || 0;
        return acc;
      }, {});
      
      setData({
        ordersToday,
        ordersYesterday: 0, // Would need more complex logic
        revenueToday,
        revenueYesterday: 0,
        newCustomers,
        loyaltyPointsIssued: loyaltyPoints,
        storeStats: {
          china: storeStats.china || { orders: 0, revenue: 0 },
          thailand: storeStats.thailand || { orders: 0, revenue: 0 },
          vietnam: storeStats.vietnam || { orders: 0, revenue: 0 },
        },
      });
    } catch (error) {
      console.warn('⚠️ Error loading analytics:', error);
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const ordersChange = calculateChange(data.ordersToday || 0, data.ordersYesterday || 0);
  const revenueChange = calculateChange(data.revenueToday || 0, data.revenueYesterday || 0);

  // Get period labels based on selected period
  const getPeriodLabel = (type: 'orders' | 'revenue' | 'customers') => {
    if (period === 'today') {
      if (type === 'orders') return t('ordersToday');
      if (type === 'revenue') return t('revenueToday');
      return t('newCustomers');
    } else if (period === 'week') {
      if (type === 'orders') return t('ordersWeek');
      if (type === 'revenue') return t('revenueWeek');
      return t('customersWeek');
    } else if (period === 'month') {
      if (type === 'orders') return t('ordersMonth');
      if (type === 'revenue') return t('revenueMonth');
      return t('customersMonth');
    } else if (period === 'year') {
      if (type === 'orders') return t('ordersYear');
      if (type === 'revenue') return t('revenueYear');
      return t('customersYear');
    } else {
      if (type === 'orders') return t('ordersAllTime');
      if (type === 'revenue') return t('revenueAllTime');
      return t('customersAllTime');
    }
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={period === 'today' ? 'default' : 'outline'}
            onClick={() => setPeriod('today')}
            className={period === 'today' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {t('forToday')}
          </Button>
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            onClick={() => setPeriod('week')}
            className={period === 'week' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {t('ordersWeek').replace('Заказы за ', '').replace('Orders this ', '').replace('Đơn hàng trong ', '').replace('本周', '')}
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            onClick={() => setPeriod('month')}
            className={period === 'month' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {t('ordersMonth').replace('Заказы за ', '').replace('Orders this ', '').replace('Đơn hàng trong ', '').replace('本月', '')}
          </Button>
          <Button
            variant={period === 'year' ? 'default' : 'outline'}
            onClick={() => setPeriod('year')}
            className={period === 'year' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {t('ordersYear').replace('Заказы за ', '').replace('Orders this ', '').replace('Đơn hàng trong ', '').replace('本年', '')}
          </Button>
          <Button
            variant={period === 'all' ? 'default' : 'outline'}
            onClick={() => setPeriod('all')}
            className={period === 'all' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {t('ordersAllTime').replace('Заказы за ', '').replace('Orders ', '').replace('Đơn hàng ', '').replace('所有', '')}
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShoppingBag className="text-blue-600" size={24} />
              <h4 className="text-gray-600 text-sm">{getPeriodLabel('orders')}</h4>
            </div>
            {period === 'today' && (
              ordersChange > 0 ? (
                <TrendingUp className="text-green-600" size={20} />
              ) : (
                <TrendingDown className="text-red-600" size={20} />
              )
            )}
          </div>
          <div className="text-3xl text-gray-800 mb-1">{data.ordersToday || 0}</div>
          {period === 'today' && (
            <div className={`text-sm ${ordersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {ordersChange >= 0 ? '+' : ''}{ordersChange.toFixed(1)}% {t('fromYesterday')}
            </div>
          )}
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="text-green-600" size={24} />
              <h4 className="text-gray-600 text-sm">{getPeriodLabel('revenue')}</h4>
            </div>
            {period === 'today' && (
              revenueChange > 0 ? (
                <TrendingUp className="text-green-600" size={20} />
              ) : (
                <TrendingDown className="text-red-600" size={20} />
              )
            )}
          </div>
          <div className="text-3xl text-gray-800 mb-1">
            {(data.revenueToday || 0).toLocaleString()} ₽
          </div>
          {period === 'today' && (
            <div className={`text-sm ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}% {t('fromYesterday')}
            </div>
          )}
        </div>

        {/* New Customers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-purple-600" size={24} />
            <h4 className="text-gray-600 text-sm">{getPeriodLabel('customers')}</h4>
          </div>
          <div className="text-3xl text-gray-800 mb-1">{data.newCustomers || 0}</div>
          {period === 'today' && (
            <div className="text-sm text-gray-600">{t('forToday')}</div>
          )}
        </div>

        {/* Loyalty Points */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-2">
            <Award className="text-yellow-600" size={24} />
            <h4 className="text-gray-600 text-sm">{t('loyaltyPointsIssued')}</h4>
          </div>
          <div className="text-3xl text-gray-800 mb-1">
            {(data.loyaltyPointsIssued || 0).toLocaleString()}
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
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-gray-800 mb-3">{t('chinaStore')}</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('orders')}:</span>
                <span className="text-gray-800">{data.storeStats?.china?.orders || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{getPeriodLabel('revenue')}:</span>
                <span className="text-gray-800">
                  {(data.storeStats?.china?.revenue || 0).toLocaleString()} ₽
                </span>
              </div>
            </div>
          </div>

          {/* Thailand Store */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-gray-800 mb-3">{t('thailandStore')}</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('orders')}:</span>
                <span className="text-gray-800">{data.storeStats?.thailand?.orders || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{getPeriodLabel('revenue')}:</span>
                <span className="text-gray-800">
                  {(data.storeStats?.thailand?.revenue || 0).toLocaleString()} ₽
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
                <span className="text-gray-800">{data.storeStats?.vietnam?.orders || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{getPeriodLabel('revenue')}:</span>
                <span className="text-gray-800">
                  {(data.storeStats?.vietnam?.revenue || 0).toLocaleString()} ₽
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};