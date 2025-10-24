import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getServerUrl } from '../../utils/supabase/client';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percent' | 'amount';
  discount_value: number;
  expiry_date: string | null;
  usage_limit: number | null;
  times_used: number;
  active: boolean;
}

export const PromoCodeManagement = () => {
  const { t } = useLanguage();
  const { accessToken } = useAuth();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percent' as 'percent' | 'amount',
    discount_value: 0,
    expiry_date: '',
    usage_limit: '',
    active: true,
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const response = await fetch(getServerUrl('/promo-codes'), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPromoCodes(data.promoCodes || []);
      } else {
        console.warn('⚠️ Server not available, promo codes unavailable');
        setPromoCodes([]);
      }
    } catch (error) {
      console.warn('⚠️ Server not available, promo codes unavailable');
      setPromoCodes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingId
      ? getServerUrl(`/promo-codes/${editingId}`)
      : getServerUrl('/promo-codes');

    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        }),
      });

      if (response.ok) {
        alert(t('saveSuccess'));
        setShowForm(false);
        setEditingId(null);
        resetForm();
        fetchPromoCodes();
      } else {
        alert(t('saveError'));
      }
    } catch (error) {
      console.warn('⚠️ Error saving promo code:', error);
      alert(t('saveError'));
    }
  };

  const handleEdit = (promo: PromoCode) => {
    setFormData({
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      expiry_date: promo.expiry_date || '',
      usage_limit: promo.usage_limit?.toString() || '',
      active: promo.active,
    });
    setEditingId(promo.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) {
      return;
    }

    try {
      const response = await fetch(getServerUrl(`/promo-codes/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        fetchPromoCodes();
      } else {
        alert(t('deleteError'));
      }
    } catch (error) {
      console.warn('⚠️ Error deleting promo code:', error);
      alert(t('deleteError'));
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percent',
      discount_value: 0,
      expiry_date: '',
      usage_limit: '',
      active: true,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-red-600" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-gray-800">{t('promoCodes')}</h3>
        <button
          onClick={() => {
            resetForm();
            setEditingId(null);
            setShowForm(!showForm);
          }}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          <span>{t('createPromoCode')}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-6 bg-gray-50 rounded-lg">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 mb-2">
                {t('promoCodeValue')} *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                {t('discountType')} *
              </label>
              <select
                value={formData.discount_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discount_type: e.target.value as 'percent' | 'amount',
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="percent">{t('discountPercent')}</option>
                <option value="amount">{t('discountAmount')}</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                {t('discountValue')} *
              </label>
              <input
                type="number"
                value={formData.discount_value}
                onChange={(e) =>
                  setFormData({ ...formData, discount_value: Number(e.target.value) })
                }
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                {t('expiryDate')} ({t('expiryDatePlaceholder')})
              </label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) =>
                  setFormData({ ...formData, expiry_date: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">{t('usageLimit')}</label>
              <input
                type="number"
                value={formData.usage_limit}
                onChange={(e) =>
                  setFormData({ ...formData, usage_limit: e.target.value })
                }
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) =>
                  setFormData({ ...formData, active: e.target.checked })
                }
              />
              <label htmlFor="active" className="text-gray-700">
                {t('active')}
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              {t('save')}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                resetForm();
              }}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-gray-700">{t('promoCodeValue')}</th>
              <th className="px-4 py-3 text-left text-gray-700">{t('discountType')}</th>
              <th className="px-4 py-3 text-left text-gray-700">{t('discountValue')}</th>
              <th className="px-4 py-3 text-left text-gray-700">{t('timesUsed')}</th>
              <th className="px-4 py-3 text-left text-gray-700">{t('expiryDate')}</th>
              <th className="px-4 py-3 text-left text-gray-700">{t('active')}</th>
              <th className="px-4 py-3 text-left text-gray-700">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {promoCodes.map((promo) => (
              <tr key={promo.id} className="border-b border-gray-200">
                <td className="px-4 py-3">{promo.code}</td>
                <td className="px-4 py-3">
                  {promo.discount_type === 'percent' ? '%' : '₽'}
                </td>
                <td className="px-4 py-3">{promo.discount_value}</td>
                <td className="px-4 py-3">
                  {promo.times_used}
                  {promo.usage_limit && ` / ${promo.usage_limit}`}
                </td>
                <td className="px-4 py-3">
                  {promo.expiry_date
                    ? new Date(promo.expiry_date).toLocaleDateString()
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  {promo.active ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-red-600">✗</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(promo)}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
