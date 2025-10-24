import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Product } from '../../contexts/CartContext';
import { getServerUrl } from '../../utils/supabase/client';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { getMockProducts } from '../../utils/mockData';
import { toast } from 'sonner';

export const ProductManagement = () => {
  const { t } = useLanguage();
  const { accessToken } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    name_zh: '',
    name_vi: '',
    price: '',
    wholesalePrice: '',
    category: 'ointments',
    disease: 'cold',
    store: 'china' as 'china' | 'thailand' | 'vietnam',
    weight: '0.1',
    description: '',
    description_en: '',
    description_zh: '',
    description_vi: '',
    composition: '',
    composition_en: '',
    composition_zh: '',
    composition_vi: '',
    usage: '',
    usage_en: '',
    usage_zh: '',
    usage_vi: '',
    image: '',
    inStock: true,
    isSample: false,
  });

  useEffect(() => {
    loadProducts();
  }, [accessToken]);

  const loadProducts = async () => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization token if available
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(getServerUrl('/products'), {
        headers,
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.products && data.products.length > 0) {
          // Map server format to frontend format
          const mappedProducts = data.products.map((p: any) => ({
            ...p,
            inStock: p.in_stock ?? p.inStock ?? true,
            isSample: p.is_sample ?? p.isSample ?? false,
            wholesalePrice: p.wholesale_price ?? p.wholesalePrice,
          }));
          setProducts(mappedProducts);
        } else {
          console.warn('⚠️ No products in database, using mock data');
          setProducts(getMockProducts());
        }
      } else {
        console.warn('⚠️ Server error, using mock data');
        setProducts(getMockProducts());
      }
    } catch (error) {
      console.warn('⚠️ Network error, using mock data:', error);
      setProducts(getMockProducts());
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : e.target.value;
    
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!accessToken) {
        toast.error('Необходима авторизация');
        setLoading(false);
        return;
      }

      // Exclude frontend-only fields and map to DB column names
      const { inStock, isSample, wholesalePrice, ...restFormData } = formData;
      
      const productData = {
        ...restFormData,
        price: parseFloat(formData.price),
        wholesale_price: formData.wholesalePrice ? parseFloat(formData.wholesalePrice) : null,
        weight: parseFloat(formData.weight),
        is_sample: formData.isSample,
        in_stock: formData.inStock,
      };

      console.log('📦 Sending product data:', productData);

      const url = editingProduct
        ? getServerUrl(`/products/${editingProduct.id}`)
        : getServerUrl('/products');
      
      const method = editingProduct ? 'PUT' : 'POST';

      console.log(`📤 ${method} request to:`, url);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(productData),
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (response.ok) {
        await loadProducts();
        resetForm();
        toast.success(t('saveSuccess'));
      } else {
        let errorMessage = 'Неизвестная ошибка';
        try {
          const responseText = await response.text();
          console.error('❌ Server error response:', responseText);
          
          // Try to parse as JSON
          try {
            const error = JSON.parse(responseText);
            errorMessage = error.error || error.details || errorMessage;
          } catch {
            // Not JSON, use as-is
            errorMessage = responseText || `HTTP ${response.status}`;
          }
        } catch (readError) {
          console.error('❌ Failed to read response:', readError);
          errorMessage = `HTTP ${response.status}`;
        }
        toast.error(`${t('saveError')}: ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ Error saving product:', error);
      toast.error(`${t('saveError')}: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      name_en: product.name_en,
      name_zh: product.name_zh,
      name_vi: product.name_vi,
      price: product.price.toString(),
      wholesalePrice: (product as any).wholesalePrice ? (product as any).wholesalePrice.toString() : '',
      category: product.category,
      disease: product.disease,
      store: product.store || 'china',
      weight: (product.weight || 0.1).toString(),
      description: product.description,
      description_en: product.description_en,
      description_zh: product.description_zh,
      description_vi: product.description_vi,
      composition: product.composition,
      composition_en: product.composition_en,
      composition_zh: product.composition_zh,
      composition_vi: product.composition_vi,
      usage: product.usage,
      usage_en: product.usage_en,
      usage_zh: product.usage_zh,
      usage_vi: product.usage_vi,
      image: product.image,
      inStock: product.inStock,
      isSample: (product as any).isSample || false,
    });
    setShowForm(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm(t('confirmDelete'))) return;

    try {
      if (!accessToken) {
        toast.error('Необходима авторизация');
        return;
      }

      const response = await fetch(getServerUrl(`/products/${productId}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        await loadProducts();
        toast.success(t('saveSuccess'));
      } else {
        let errorMessage = t('deleteError');
        try {
          const responseText = await response.text();
          console.error('❌ Delete error response:', responseText);
          
          // Try to parse as JSON
          try {
            const error = JSON.parse(responseText);
            errorMessage = error.error || error.details || errorMessage;
          } catch {
            // Not JSON, use as-is
            errorMessage = responseText || `HTTP ${response.status}`;
          }
        } catch (readError) {
          console.error('❌ Failed to read response:', readError);
          errorMessage = `HTTP ${response.status}`;
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      toast.error(t('deleteError'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      name_en: '',
      name_zh: '',
      name_vi: '',
      price: '',
      wholesalePrice: '',
      category: 'ointments',
      disease: 'cold',
      store: 'china',
      weight: '0.1',
      description: '',
      description_en: '',
      description_zh: '',
      description_vi: '',
      composition: '',
      composition_en: '',
      composition_zh: '',
      composition_vi: '',
      usage: '',
      usage_en: '',
      usage_zh: '',
      usage_vi: '',
      image: '',
      inStock: true,
      isSample: false,
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  // Функция автоперевода через серверный API
  const autoTranslate = async () => {
    if (!accessToken) {
      toast.error('Необходима авторизация');
      return;
    }

    if (!formData.name || !formData.description) {
      toast.error('Заполните русские поля (Название и Описание) перед переводом');
      return;
    }

    setLoading(true);
    toast.info('Перевод текстов...');

    try {
      const fieldsToTranslate = [
        { field: 'name', text: formData.name },
        { field: 'description', text: formData.description },
        { field: 'composition', text: formData.composition },
        { field: 'usage', text: formData.usage },
      ];

      const languages = ['en', 'zh', 'vi'];
      const translations: any = {};

      for (const lang of languages) {
        for (const { field, text } of fieldsToTranslate) {
          if (!text) continue;

          try {
            const response = await fetch(getServerUrl('/translate'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                text,
                targetLang: lang,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              const key = `${field}_${lang}`;
              
              // Если перевод содержит [AUTO], используем оригинальный текст
              if (data.translatedText && !data.translatedText.startsWith('[AUTO]')) {
                translations[key] = data.translatedText;
              } else {
                console.warn(`⚠️ Translation service unavailable for ${field} to ${lang}, using original text`);
                translations[key] = text;
              }
              
              if (data.warning) {
                console.warn(`⚠️ ${data.warning}`);
              }
            } else {
              console.error(`Translation failed for ${field} to ${lang}`);
              // Use original text as fallback
              const key = `${field}_${lang}`;
              translations[key] = text;
            }
          } catch (error) {
            console.error(`Translation error for ${field} to ${lang}:`, error);
            // Use original text as fallback
            const key = `${field}_${lang}`;
            translations[key] = text;
          }
        }
      }

      setFormData(prev => ({
        ...prev,
        ...translations,
      }));

      const translatedCount = Object.keys(translations).length;
      if (translatedCount > 0) {
        toast.success(`Перевод завершен! Переведено полей: ${translatedCount}`);
      } else {
        toast.warning('Не удалось перевести поля. Заполните их вручную.');
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Ошибка перевода. Попробуйте позже или заполните поля вручную.');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['ointments', 'patches', 'elixirs', 'capsules', 'teas', 'oils', 'samples', 'other'];
  const diseases = ['cold', 'digestive', 'skin', 'joints', 'headache', 'heart', 'liver', 'kidneys', 'oncology', 'nervous', 'womensHealth', 'mensHealth', 'forChildren', 'vision', 'hemorrhoids'];

  return (
    <div>
      {!showForm ? (
        <>
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus size={20} />
            <span>{t('addProduct')}</span>
          </button>

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
                      <th className="px-6 py-3 text-left text-gray-700">{t('productName')}</th>
                      <th className="px-6 py-3 text-left text-gray-700">{t('price')}</th>
                      <th className="px-6 py-3 text-left text-gray-700">{t('category')}</th>
                      <th className="px-6 py-3 text-left text-gray-700">{t('stockStatus')}</th>
                      <th className="px-6 py-3 text-left text-gray-700">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <span className="text-gray-800">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {product.price.toLocaleString()} ₽
                        </td>
                        <td className="px-6 py-4 text-gray-700">{t(product.category)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-sm ${
                              product.inStock
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {product.inStock ? t('inStock') : t('outOfStock')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
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
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-800">
              {editingProduct ? t('editProduct') : t('addProduct')}
            </h3>
            <button
              type="button"
              onClick={autoTranslate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              🌐 {t('autoTranslate') || 'Автоперевод'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">
                  {t('productName')} (RU) *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  {t('productName')} (EN) *
                </label>
                <input
                  type="text"
                  name="name_en"
                  value={formData.name_en}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  {t('productName')} (ZH) *
                </label>
                <input
                  type="text"
                  name="name_zh"
                  value={formData.name_zh}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  {t('productName')} (VI) *
                </label>
                <input
                  type="text"
                  name="name_vi"
                  value={formData.name_vi}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  {t('retailPrice')} (₽) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  {t('wholesalePriceInYuan')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="wholesalePrice"
                  value={formData.wholesalePrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  {t('weight')} ({t('kg')}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  required
                  placeholder="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  {t('productCategory')} *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {t(cat)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  {t('productDisease')} *
                </label>
                <select
                  name="disease"
                  value={formData.disease}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  {diseases.map((dis) => (
                    <option key={dis} value={dis}>
                      {t(dis)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  {t('store')} *
                </label>
                <select
                  name="store"
                  value={formData.store}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="china">{t('storeChina')}</option>
                  <option value="thailand">{t('storeThailand')}</option>
                  <option value="vietnam">{t('storeVietnam')}</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  {t('productImage')}
                </label>
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="inStock"
                  checked={formData.inStock}
                  onChange={handleChange}
                  className="w-5 h-5 text-red-600"
                />
                <label className="text-gray-700">{t('inStock')}</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isSample"
                  checked={formData.isSample}
                  onChange={handleChange}
                  className="w-5 h-5 text-red-600"
                  disabled={formData.store !== 'china'}
                />
                <label className="text-gray-700">
                  {t('isSample')}
                  {formData.store !== 'china' && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({t('samples')} - {t('storeChina')})
                    </span>
                  )}
                </label>
              </div>
            </div>

            {/* Description fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">
                  {t('productDescription')} (RU)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  {t('productDescription')} (EN)
                </label>
                <textarea
                  name="description_en"
                  value={formData.description_en}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  {t('productDescription')} (ZH)
                </label>
                <textarea
                  name="description_zh"
                  value={formData.description_zh}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  {t('productDescription')} (VI)
                </label>
                <textarea
                  name="description_vi"
                  value={formData.description_vi}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>

            {/* Composition fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">
                  {t('productComposition')} (RU)
                </label>
                <textarea
                  name="composition"
                  value={formData.composition}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  {t('productComposition')} (EN)
                </label>
                <textarea
                  name="composition_en"
                  value={formData.composition_en}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  {t('productComposition')} (ZH)
                </label>
                <textarea
                  name="composition_zh"
                  value={formData.composition_zh}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  {t('productComposition')} (VI)
                </label>
                <textarea
                  name="composition_vi"
                  value={formData.composition_vi}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>

            {/* Usage fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">
                  {t('productUsage')} (RU)
                </label>
                <textarea
                  name="usage"
                  value={formData.usage}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  {t('productUsage')} (EN)
                </label>
                <textarea
                  name="usage_en"
                  value={formData.usage_en}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  {t('productUsage')} (ZH)
                </label>
                <textarea
                  name="usage_zh"
                  value={formData.usage_zh}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  {t('productUsage')} (VI)
                </label>
                <textarea
                  name="usage_vi"
                  value={formData.usage_vi}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? t('saving') : t('save')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
