import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getServerUrl } from '../../utils/supabase/client';
import { Users, Check, X, Loader2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name?: string;
  isAdmin?: boolean;
  isWholesaler?: boolean;
  createdAt?: string;
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
      const response = await fetch(getServerUrl('/admin/users'), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.warn('⚠️ Server not available, users unavailable');
    } finally {
      setLoading(false);
    }
  };

  const toggleWholesaler = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(getServerUrl(`/admin/users/${userId}/wholesaler`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isWholesaler: !currentStatus }),
      });

      if (response.ok) {
        await loadUsers();
        alert(t('saveSuccess'));
      } else {
        alert(t('saveError'));
      }
    } catch (error) {
      console.warn('⚠️ Error toggling wholesaler status:', error);
      alert(t('saveError'));
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-gray-800 flex items-center gap-2">
          <Users size={24} />
          {t('userManagement')}
        </h3>
        <p className="text-sm text-gray-600 mt-2">
          {t('userManagementDescription')}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-red-600" size={48} />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-gray-700">{t('fullName')}</th>
                  <th className="px-6 py-3 text-left text-gray-700">{t('date')}</th>
                  <th className="px-6 py-3 text-left text-gray-700">{t('admin')}</th>
                  <th className="px-6 py-3 text-left text-gray-700">{t('wholesalerStatus')}</th>
                  <th className="px-6 py-3 text-left text-gray-700">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-800">{user.email}</td>
                    <td className="px-6 py-4 text-gray-700">{user.name || '—'}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('ru-RU')
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {user.isAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                          <Check size={14} />
                          Admin
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.isWholesaler ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                          <Check size={14} />
                          {t('wholesaler')}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {!user.isAdmin && (
                        <button
                          onClick={() => toggleWholesaler(user.id, user.isWholesaler || false)}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            user.isWholesaler
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {user.isWholesaler ? t('removeWholesaler') : t('setWholesaler')}
                        </button>
                      )}
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
