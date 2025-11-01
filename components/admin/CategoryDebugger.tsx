import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { createClient } from '../../utils/supabase/client';
import { Loader2, RefreshCw } from 'lucide-react';

export const CategoryDebugger = () => {
  const { accessToken } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});
  const [diseaseStats, setDiseaseStats] = useState<Record<string, number>>({});

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products')
        .select('*');

      if (!error && data) {
        setProducts(data);
        
        // Calculate statistics
        const catStats: Record<string, number> = {};
        const disStats: Record<string, number> = {};
        
        data.forEach((product: any) => {
          catStats[product.category] = (catStats[product.category] || 0) + 1;
          disStats[product.disease] = (disStats[product.disease] || 0) + 1;
        });
        
        setCategoryStats(catStats);
        setDiseaseStats(disStats);
      } else {
        console.error('Error loading products:', error);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get translated category label
  const getCategoryLabel = (categoryId: string): string => {
    return t(categoryId) || categoryId;
  };

  // Get translated disease label
  const getDiseaseLabel = (diseaseId: string): string => {
    return t(diseaseId) || diseaseId;
  };

  // Get translated product name based on current language
  const getProductName = (product: any): string => {
    if (currentLanguage === 'en' && product.name_en) {
      return product.name_en;
    }
    if (currentLanguage === 'zh' && product.name_zh) {
      return product.name_zh;
    }
    if (currentLanguage === 'vi' && product.name_vi) {
      return product.name_vi;
    }
    // Default to Russian (name)
    return product.name || '';
  };

  const clearLocalStorageCategories = () => {
    localStorage.removeItem('categories');
    alert(t('categoryDebuggerClearSuccess'));
  };

  const [categoriesInfo, setCategoriesInfo] = useState<any>(null);

  useEffect(() => {
    const storedCategories = localStorage.getItem('categories');
    if (storedCategories) {
      try {
        const parsed = JSON.parse(storedCategories);
        setCategoriesInfo(parsed);
      } catch (error) {
        console.error('Error parsing categories:', error);
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-gray-800">🔍 {t('categoryDebuggerTitle')}</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={clearLocalStorageCategories}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            🗑️ {t('categoryDebuggerClearCache')}
          </button>
          <button
            onClick={loadProducts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('loading')}
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                {t('refresh')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Categories Info */}
      {categoriesInfo && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
          <h3 className="text-gray-800 mb-4">📂 {t('categoryDebuggerCacheInfo')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">{t('categoryDebuggerTopMenu')} ({categoriesInfo.topMenu?.length || 0}):</h4>
              <div className="space-y-1">
                {categoriesInfo.topMenu?.map((cat: any) => (
                  <div key={cat.id} className="text-sm text-gray-600 bg-white p-2 rounded">
                    <strong>{cat.id}</strong>: {cat.translations?.[currentLanguage] || cat.translations?.ru || cat.name || t('categoryDebuggerNoName')}
                    {cat.translations ? ' ✅' : ` ❌ (${t('categoryDebuggerNoTranslations')})`}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">{t('categoryDebuggerSideMenu')} ({categoriesInfo.sidebar?.length || 0}):</h4>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {categoriesInfo.sidebar?.map((cat: any) => (
                  <div key={cat.id} className="text-sm text-gray-600 bg-white p-2 rounded">
                    <strong>{cat.id}</strong>: {cat.translations?.[currentLanguage] || cat.translations?.ru || cat.name || t('categoryDebuggerNoName')}
                    {cat.translations ? ' ✅' : ` ❌ (${t('categoryDebuggerNoTranslations')})`}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-800 mb-4">📦 {t('categoryDebuggerCategoryStats')}</h3>
          <div className="space-y-2">
            {Object.entries(categoryStats)
              .sort((a, b) => b[1] - a[1])
              .map(([category, count]) => (
                <div key={category} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-gray-700">
                    {getCategoryLabel(category)}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {count}
                  </span>
                </div>
              ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">{t('categoryDebuggerTotalProducts')}:</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                {products.length}
              </span>
            </div>
          </div>
        </div>

        {/* Disease Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-800 mb-4">🏥 {t('categoryDebuggerDiseaseStats')}</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Object.entries(diseaseStats)
              .sort((a, b) => b[1] - a[1])
              .map(([disease, count]) => (
                <div key={disease} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-gray-700">
                    {getDiseaseLabel(disease)}
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-gray-800 mb-4">📋 {t('categoryDebuggerProductsList')} ({products.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left text-gray-700">{t('name')}</th>
                <th className="px-4 py-2 text-left text-gray-700">{t('category')}</th>
                <th className="px-4 py-2 text-left text-gray-700">{t('categoryDebuggerDisease')}</th>
                <th className="px-4 py-2 text-left text-gray-700">{t('store')}</th>
                <th className="px-4 py-2 text-left text-gray-700">{t('price')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-gray-800">{getProductName(product)}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {getCategoryLabel(product.category)}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                      {getDiseaseLabel(product.disease)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{product.store}</td>
                  <td className="px-4 py-2 text-gray-800">{product.price} ₽</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
