import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { createClient } from '../../utils/supabase/client';
import { Users, Check, X, Loader2, Award, Crown, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name?: string;
  isAdmin?: boolean;
  isWholesaler?: boolean;
  createdAt?: string;
  loyaltyPoints?: number;
  loyaltyTier?: string;
  monthlyTotal?: number;
}

export const UserManagement = () => {
  const { t } = useLanguage();
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accessToken) {
      loadUsers();
    }
  }, [accessToken]);

  const loadUsers = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to load users:', error);
      } else {
        console.log('✅ Users loaded:', data?.length || 0);
        const mappedUsers = (data || []).map((profile: any) => ({
          id: profile.id,
          email: profile.email,
          name: profile.full_name,
          isAdmin: profile.is_admin,
          isWholesaler: profile.is_wholesaler,
          createdAt: profile.created_at,
          loyaltyPoints: profile.loyalty_points,
          loyaltyTier: profile.loyalty_tier,
          monthlyTotal: profile.monthly_total,
        }));
        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error('❌ Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: 'customer' | 'wholesaler' | 'admin') => {
    try {
      const isWholesaler = role === 'wholesaler';
      const isAdmin = role === 'admin';

      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_wholesaler: isWholesaler,
          is_admin: isAdmin,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error updating user role:', error);
        toast.error(`${t('userRoleUpdateError')}: ${error.message}`);
      } else {
        await loadUsers();
        toast.success(t('userRoleUpdated'));
      }
    } catch (error) {
      console.error('❌ Error updating user role:', error);
      toast.error(t('userRoleUpdateError'));
    }
  };

  const getRoleBadge = (user: User) => {
    if (user.isAdmin) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
          <Crown size={14} />
          {t('roleAdmin')}
        </span>
      );
    }
    if (user.isWholesaler) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
          <ShoppingBag size={14} />
          {t('roleWholesaler')}
        </span>
      );
    }
    return (
      <span className="text-gray-500 text-sm">
        {t('roleCustomer')}
      </span>
    );
  };

  const getLoyaltyBadge = (tier?: string) => {
    if (!tier || tier === 'basic') {
      return <span className="text-gray-600 text-sm">{t('tierBasic')} (5%)</span>;
    }
    if (tier === 'premium') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded text-sm">
          <Award size={14} />
          {t('tierPremium')} (10%)
        </span>
      );
    }
    return <span className="text-gray-600 text-sm">—</span>;
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-white flex items-center gap-2">
          <Users size={24} />
          {t('userManagement')}
        </h3>
        <p className="text-white text-sm mt-2">
          {t('userManagementDescription')}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-red-600" size={48} />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500">
            {t('noUsersFound')}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-2 sm:px-6 py-3 text-left text-gray-700 text-xs sm:text-sm">Email</th>
                  <th className="px-2 sm:px-6 py-3 text-left text-gray-700 text-xs sm:text-sm hidden sm:table-cell">{t('fullName')}</th>
                  <th className="px-2 sm:px-6 py-3 text-left text-gray-700 text-xs sm:text-sm hidden sm:table-cell">{t('userRole')}</th>
                  <th className="px-2 sm:px-6 py-3 text-left text-gray-700 text-xs sm:text-sm">{t('loyaltyPoints')}</th>
                  <th className="px-2 sm:px-6 py-3 text-left text-gray-700 text-xs sm:text-sm hidden sm:table-cell">{t('loyaltyStatus')}</th>
                  <th className="px-2 sm:px-6 py-3 text-left text-gray-700 text-xs sm:text-sm">{t('monthlyAmount')}</th>
                  <th className="px-2 sm:px-6 py-3 text-left text-gray-700 text-xs sm:text-sm">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-2 sm:px-6 py-4 text-gray-800 text-xs sm:text-sm">{user.email}</td>
                    <td className="px-2 sm:px-6 py-4 text-gray-700 text-xs sm:text-sm hidden sm:table-cell">{user.name || '—'}</td>
                    <td className="px-2 sm:px-6 py-4 hidden sm:table-cell">
                      {getRoleBadge(user)}
                    </td>
                    <td className="px-2 sm:px-6 py-4 text-gray-700 text-xs sm:text-sm">
                      {user.loyaltyPoints !== undefined ? (
                        <span className="inline-flex items-center gap-1">
                          <Award size={12} className="text-amber-500 sm:w-3.5 sm:h-3.5" />
                          {user.loyaltyPoints} ₽
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-2 sm:px-6 py-4 hidden sm:table-cell">
                      {getLoyaltyBadge(user.loyaltyTier)}
                    </td>
                    <td className="px-2 sm:px-6 py-4 text-gray-600 text-xs sm:text-sm">
                      {user.monthlyTotal ? `${user.monthlyTotal.toLocaleString()} ₽` : '0 ₽'}
                    </td>
                    <td className="px-2 sm:px-6 py-4">
                      <select
                        value={user.isAdmin ? 'admin' : user.isWholesaler ? 'wholesaler' : 'customer'}
                        onChange={(e) => updateUserRole(user.id, e.target.value as 'customer' | 'wholesaler' | 'admin')}
                        className="px-2 sm:px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="customer">{t('roleCustomer')}</option>
                        <option value="wholesaler">{t('roleWholesaler')}</option>
                        <option value="admin">{t('roleAdmin')}</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};