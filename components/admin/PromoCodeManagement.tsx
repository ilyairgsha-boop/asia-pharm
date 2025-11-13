import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { createClient } from '../../utils/supabase/client';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percent' | 'amount';
  discount_value: number;
  expires_at: string | null;
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
    expires_at: '',
    usage_limit: '',
    active: true,
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️ Error loading promo codes:', error);
        setPromoCodes([]);
      } else {
        setPromoCodes(data || []);
      }
    } catch (error) {
      console.warn('⚠️ Error loading promo codes:', error);
      setPromoCodes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const supabase = createClient();
      const promoData = {
        ...formData,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      };

      let result;
      if (editingId) {
        result = await supabase
          .from('promo_codes')
          .update(promoData)
          .eq('id', editingId);
      } else {
        result = await supabase
          .from('promo_codes')
          .insert([promoData]);
      }

      if (result.error) {
        console.error('❌ Error saving promo code:', result.error);
        toast.error(`${t('saveError')}: ${result.error.message}`);
      } else {
        toast.success(t('saveSuccess'));
        setShowForm(false);
        setEditingId(null);
        resetForm();
        fetchPromoCodes();
      }
    } catch (error) {
      console.warn('⚠️ Error saving promo code:', error);
      toast.error(t('saveError'));
    }
  };

  const handleEdit = (promo: PromoCode) => {
    setFormData({
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      expires_at: promo.expires_at || '',
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
      const supabase = createClient();
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting promo code:', error);
        toast.error(`${t('deleteError')}: ${error.message}`);
      } else {
        toast.success(t('saveSuccess'));
        fetchPromoCodes();
      }
    } catch (error) {
      console.warn('⚠️ Error deleting promo code:', error);
      toast.error(t('deleteError'));
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percent',
      discount_value: 0,
      expires_at: '',
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
                value={formData.expires_at}
                onChange={(e) =>
                  setFormData({ ...formData, expires_at: e.target.value })
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
              <th className="px-2 sm:px-4 py-3 text-left text-gray-700 text-xs sm:text-sm">{t('promoCodeValue')}</th>
              <th className="px-2 sm:px-4 py-3 text-left text-gray-700 text-xs sm:text-sm">{t('discountType')}</th>
              <th className="px-2 sm:px-4 py-3 text-left text-gray-700 text-xs sm:text-sm">{t('discountValue')}</th>
              <th className="px-2 sm:px-4 py-3 text-left text-gray-700 text-xs sm:text-sm hidden sm:table-cell">{t('timesUsed')}</th>
              <th className="px-2 sm:px-4 py-3 text-left text-gray-700 text-xs sm:text-sm hidden sm:table-cell">{t('expiryDate')}</th>
              <th className="px-2 sm:px-4 py-3 text-left text-gray-700 text-xs sm:text-sm hidden sm:table-cell">{t('active')}</th>
              <th className="px-2 sm:px-4 py-3 text-left text-gray-700 text-xs sm:text-sm">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {promoCodes.map((promo) => (
              <tr key={promo.id} className="border-b border-gray-200">
                <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm">{promo.code}</td>
                <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm">
                  {promo.discount_type === 'percent' ? '%' : '₽'}
                </td>
                <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm">{promo.discount_value}</td>
                <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm hidden sm:table-cell">
                  {promo.times_used}
                  {promo.usage_limit && ` / ${promo.usage_limit}`}
                </td>
                <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm hidden sm:table-cell">
                  {promo.expiry_date
                    ? new Date(promo.expiry_date).toLocaleDateString()
                    : '—'}
                </td>
                <td className="px-2 sm:px-4 py-3 hidden sm:table-cell">
                  {promo.active ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-red-600">✗</span>
                  )}
                </td>
                <td className="px-2 sm:px-4 py-3">
                  <div className="flex gap-1 sm:gap-2">
                    <button
                      onClick={() => handleEdit(promo)}
                      className="text-blue-600 hover:bg-blue-50 p-1 sm:p-2 rounded transition-colors"
                    >
                      <Edit size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="text-red-600 hover:bg-red-50 p-1 sm:p-2 rounded transition-colors"
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
    </div>
  );
};