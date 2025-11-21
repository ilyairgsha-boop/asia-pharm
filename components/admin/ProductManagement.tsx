import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Product } from '../../contexts/CartContext';
import { createClient, getServerUrl } from '../../utils/supabase/client';
import { Plus, Edit, Trash2, Loader2, Search, X } from 'lucide-react';
import { getMockProducts } from '../../utils/mockData';
import { toast } from 'sonner';

interface Category {
  id: string;
  translations: {
    ru: string;
    en: string;
    zh: string;
    vi: string;
  };
  icon?: string;
  order: number;
}

interface CategoryData {
  topMenu: Category[];
  sidebar: Category[];
}

export const ProductManagement = () => {
  const { t, currentLanguage } = useLanguage();
  const { accessToken } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<CategoryData>({
    topMenu: [],
    sidebar: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoTranslating, setIsAutoTranslating] = useState(false);
  const [translateProgress, setTranslateProgress] = useState({ current: 0, total: 0 });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Get translated product name based on current language
  const getProductName = (product: Product): string => {
    if (currentLanguage === 'en' && product.name_en) {
      return product.name_en;
    }
    if (currentLanguage === 'zh' && product.name_zh) {
      return product.name_zh;
    }
    if (currentLanguage === 'vi' && product.name_vi) {
      return product.name_vi;
    }
    return product.name || '';
  };

  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    name_zh: '',
    name_vi: '',
    price: '',
    wholesalePrice: '',
    category: 'ointments',
    disease: 'cold',
    diseaseCategories: [] as string[],
    store: 'china' as 'china' | 'thailand' | 'vietnam',
    weight: '0.1',
    shortDescription: '',
    shortDescription_en: '',
    shortDescription_zh: '',
    shortDescription_vi: '',
    description: '',
    description_en: '',
    description_zh: '',
    description_vi: '',
    image: '',
    inStock: true,
    isSample: false,
    saleEnabled: false,
    saleDiscount: '',
    saleEndDate: '',
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
    
    const handleCategoriesUpdate = () => {
      console.log('📢 ProductManagement: Categories updated, reloading...');
      loadCategories();
    };
    
    window.addEventListener('categoriesUpdated', handleCategoriesUpdate as EventListener);
    
    return () => {
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdate as EventListener);
    };
  }, [accessToken]);

  const loadCategories = async () => {
    try {
      const storedCategories = localStorage.getItem('categories');
      if (storedCategories) {
        try {
          const parsed = JSON.parse(storedCategories);
          const hasPopular = parsed.sidebar && parsed.sidebar.some((cat: any) => cat.id === 'popular');
          
          if (parsed.topMenu && parsed.topMenu.length > 0 && hasPopular) {
            setCategories(parsed);
            console.log('✅ Categories loaded from localStorage');
            return;
          } else {
            console.log('⚠️ Categories in localStorage missing data, reloading...');
            localStorage.removeItem('categories');
          }
        } catch (error) {
          console.error('Error parsing stored categories:', error);
        }
      }

      console.log('⚠️ No categories in localStorage, fetching from Supabase...');
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('kv_store_a75b5353')
        .select('value')
        .eq('key', 'categories')
        .maybeSingle();

      if (error) {
        console.error('❌ Failed to load categories:', error);
        setCategories({ topMenu: [], sidebar: [] });
      } else if (data?.value) {
        const categoriesData = data.value;
        setCategories(categoriesData);
        localStorage.setItem('categories', JSON.stringify(categoriesData));
        console.log('✅ Categories loaded from kv_store');
      } else {
        console.log('⚠️ No categories found in database, using empty');
        setCategories({ topMenu: [], sidebar: [] });
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️ Error loading products:', error);
        setProducts(getMockProducts());
      } else if (data && data.length > 0) {
        const mappedProducts = data.map((p: any) => ({
          ...p,
          inStock: p.in_stock ?? p.inStock ?? true,
          isSample: p.is_sample ?? p.isSample ?? false,
          wholesalePrice: p.wholesale_price ?? p.wholesalePrice ?? '',
          shortDescription: p.short_description ?? p.shortDescription ?? '',
          shortDescription_en: p.short_description_en ?? p.shortDescription_en ?? '',
          shortDescription_zh: p.short_description_zh ?? p.shortDescription_zh ?? '',
          shortDescription_vi: p.short_description_vi ?? p.shortDescription_vi ?? '',
          description: p.description ?? '',
          description_en: p.description_en ?? '',
          description_zh: p.description_zh ?? '',
          description_vi: p.description_vi ?? '',
          diseaseCategories: p.disease_categories ?? p.diseaseCategories ?? [p.disease],
          saleEnabled: p.sale_enabled ?? false,
          saleDiscount: p.sale_discount ?? null,
          saleEndDate: p.sale_end_date ?? null,
        }));
        setProducts(mappedProducts);
      } else {
        console.warn('⚠️ No products in database, using mock data');
        setProducts(getMockProducts());
      }
    } catch (error) {
      console.warn('⚠️ Error loading products:', error);
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

  const handleDiseaseCategoryToggle = (categoryId: string) => {
    const newDiseaseCategories = formData.diseaseCategories.includes(categoryId)
      ? formData.diseaseCategories.filter(c => c !== categoryId)
      : [...formData.diseaseCategories, categoryId];
    
    setFormData({
      ...formData,
      diseaseCategories: newDiseaseCategories,
      disease: newDiseaseCategories.length > 0 ? newDiseaseCategories[0] : 'cold'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) {
      console.log('⚠️ Submission already in progress, ignoring...');
      return;
    }
    
    setLoading(true);

    try {
      if (!accessToken) {
        toast.error('Необходима авторизация');
        setLoading(false);
        return;
      }

      if (formData.diseaseCategories.length === 0) {
        toast.error(t('pleaseSelectCategory') || 'Выберите хотя бы одну категорию заболевания');
        setLoading(false);
        return;
      }

      if (formData.saleEnabled) {
        if (!formData.saleDiscount || parseFloat(formData.saleDiscount) <= 0 || parseFloat(formData.saleDiscount) > 100) {
          toast.error('Укажите скидку от 1% до 100%');
          setLoading(false);
          return;
        }
        if (!formData.saleEndDate) {
          toast.error('Укажите дату окончания акции');
          setLoading(false);
          return;
        }
        const endDate = new Date(formData.saleEndDate);
        const now = new Date();
        if (endDate <= now) {
          toast.error('Дата окончания акции должна быть в будущем');
          setLoading(false);
          return;
        }
      }

      const { inStock, isSample, wholesalePrice, description_en, description_zh, description_vi, saleEnabled, saleDiscount, saleEndDate, ...restFormData } = formData;
      
      const productData = {
        name: formData.name,
        name_en: formData.name_en,
        name_zh: formData.name_zh,
        name_vi: formData.name_vi,
        price: parseFloat(formData.price),
        wholesale_price: formData.wholesalePrice ? parseFloat(formData.wholesalePrice) : null,
        category: formData.category,
        disease: formData.diseaseCategories[0] || 'cold',
        disease_categories: formData.diseaseCategories,
        store: formData.store,
        weight: parseFloat(formData.weight),
        short_description: formData.shortDescription,
        short_description_en: formData.shortDescription_en,
        short_description_zh: formData.shortDescription_zh,
        short_description_vi: formData.shortDescription_vi,
        description: formData.description,
        description_en: formData.description_en,
        description_zh: formData.description_zh,
        description_vi: formData.description_vi,
        image: formData.image,
        is_sample: formData.isSample,
        in_stock: formData.inStock,
        sale_enabled: formData.saleEnabled,
        sale_discount: formData.saleDiscount ? parseFloat(formData.saleDiscount) : null,
        sale_end_date: formData.saleEndDate || null,
      };

      console.log('📦 Sending product data:', productData);

      const supabase = createClient();
      
      let result;
      if (editingProduct) {
        result = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();
      }

      console.log('📥 Supabase result:', result);

      if (result.error) {
        const errorMessage = result.error.message || 'Не удалось сохранить товар';
        console.error('❌ Supabase error:', result.error);
        toast.error(`${t('saveError')}: ${errorMessage}`);
      } else {
        await loadProducts();
        resetForm();
        toast.success(t('saveSuccess'));
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
    const wholesalePriceValue = (product as any).wholesalePrice;
    const saleEnabled = product.saleEnabled || false;
    const saleDiscount = product.saleDiscount;
    const saleEndDate = product.saleEndDate;
    
    setFormData({
      name: product.name || '',
      name_en: product.name_en || '',
      name_zh: product.name_zh || '',
      name_vi: product.name_vi || '',
      price: product.price ? product.price.toString() : '',
      wholesalePrice: wholesalePriceValue ? wholesalePriceValue.toString() : '',
      category: product.category || 'ointments',
      disease: product.disease || 'cold',
      diseaseCategories: product.diseaseCategories || [product.disease || 'cold'],
      store: product.store || 'china',
      weight: product.weight ? product.weight.toString() : '0.1',
      shortDescription: product.shortDescription || '',
      shortDescription_en: product.shortDescription_en || '',
      shortDescription_zh: product.shortDescription_zh || '',
      shortDescription_vi: product.shortDescription_vi || '',
      description: product.description || '',
      description_en: product.description_en || '',
      description_zh: product.description_zh || '',
      description_vi: product.description_vi || '',
      image: product.image || '',
      inStock: product.inStock ?? true,
      isSample: product.isSample || false,
      saleEnabled: saleEnabled,
      saleDiscount: saleDiscount ? saleDiscount.toString() : '',
      saleEndDate: saleEndDate ? new Date(saleEndDate).toISOString().slice(0, 16) : '',
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

      const supabase = createClient();
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('❌ Error deleting product:', error);
        toast.error(`${t('deleteError')}: ${error.message}`);
      } else {
        await loadProducts();
        toast.success(t('saveSuccess'));
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
      diseaseCategories: [],
      store: 'china',
      weight: '0.1',
      shortDescription: '',
      shortDescription_en: '',
      shortDescription_zh: '',
      shortDescription_vi: '',
      description: '',
      description_en: '',
      description_zh: '',
      description_vi: '',
      image: '',
      inStock: true,
      isSample: false,
      saleEnabled: false,
      saleDiscount: '',
      saleEndDate: '',
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  // Функция автоперевода через серверный API (для отдельного товара в форме)
  const autoTranslate = async () => {
    if (!accessToken) {
      toast.error('Необходима авторизация');
      return;
    }

    if (!formData.name || !formData.shortDescription) {
      toast.error('Заполните русские поля (Название и Краткое описание) перед переводом');
      return;
    }

    setLoading(true);
    toast.info('Перевод текстов...');

    try {
      const fieldsToTranslate = [
        { field: 'name', text: formData.name },
        { field: 'shortDescription', text: formData.shortDescription },
        { field: 'description', text: formData.description },
      ];

      const languages = ['en', 'zh', 'vi'];
      const translations: any = {};

      for (const lang of languages) {
        console.log(`🌐 Translating to ${lang}...`);
        
        try {
          for (const { field, text } of fieldsToTranslate) {
            if (!text) continue;

            try {
              const response = await fetch(getServerUrl('/api/translate'), {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  text: text,
                  targetLanguage: lang,
                  sourceLanguage: 'ru',
                }),
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Translation failed`);
              }

              const data = await response.json();
              
              if (data.success && data.translatedText) {
                const key = `${field}_${lang}`;
                const translatedValue = data.translatedText.trim();
                translations[key] = translatedValue;
                const valuePreview = translatedValue.length > 50 ? translatedValue.substring(0, 50) + '...' : translatedValue;
                console.log(`✅ Translated ${field} to ${lang}: "${valuePreview}"`);
              }

              await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (fieldError) {
              console.error(`❌ Error translating ${field} to ${lang}:`, fieldError);
              const key = `${field}_${lang}`;
              translations[key] = `[${lang.toUpperCase()}] ${text}`;
            }
          }
        } catch (langError) {
          console.error(`❌ Error translating to ${lang}:`, langError);
          for (const { field, text } of fieldsToTranslate) {
            if (!text) continue;
            const key = `${field}_${lang}`;
            translations[key] = `[${lang.toUpperCase()}] ${text}`;
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

  // Функция автоперевода выбранных товаров с задержками 2000ms между запросами
  const autoTranslateSelectedProducts = async () => {
    if (!accessToken) {
      toast.error(t('authRequired') || 'Необходима авторизация');
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error(t('noProductsSelected') || 'Не выбрано ни одного товара');
      return;
    }

    const confirmed = confirm(
      t('autoTranslateConfirm').replace('ВСЕ товары', `выбранные товары (${selectedProducts.length})`)
    );
    if (!confirmed) return;

    setIsAutoTranslating(true);
    setTranslateProgress({ current: 0, total: selectedProducts.length });
    
    let successCount = 0;
    let errorCount = 0;

    try {
      const supabase = createClient();
      const productsToTranslate = products.filter(p => selectedProducts.includes(p.id));

      for (let i = 0; i < productsToTranslate.length; i++) {
        const product = productsToTranslate[i];
        setTranslateProgress({ current: i + 1, total: productsToTranslate.length });

        if (!product.name || !product.shortDescription) {
          console.log(`⚠️ Skipping product ${product.id}: missing Russian name or description`);
          errorCount++;
          continue;
        }

        try {
          const translations: any = {
            name_en: '',
            name_zh: '',
            name_vi: '',
            short_description_en: '',
            short_description_zh: '',
            short_description_vi: '',
            description_en: '',
            description_zh: '',
            description_vi: '',
          };

          // Переводим на каждый язык с задержками 2000ms между запросами
          for (const lang of ['en', 'zh', 'vi']) {
            console.log(`🔵 Product ${product.id} - Translating to ${lang.toUpperCase()}`);
            
            // Переводим название
            try {
              const response = await fetch(getServerUrl('/api/translate'), {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  text: product.name,
                  targetLanguage: lang,
                  sourceLanguage: 'ru',
                }),
              });

              if (response.ok) {
                const data = await response.json();
                if (data.success && data.translatedText) {
                  translations[`name_${lang}`] = data.translatedText.trim();
                }
              }
              await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
              console.error(`❌ Error translating name to ${lang}:`, error);
            }

            // Переводим краткое описание
            try {
              const response = await fetch(getServerUrl('/api/translate'), {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  text: product.shortDescription,
                  targetLanguage: lang,
                  sourceLanguage: 'ru',
                }),
              });

              if (response.ok) {
                const data = await response.json();
                if (data.success && data.translatedText) {
                  translations[`short_description_${lang}`] = data.translatedText.trim();
                }
              }
              await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
              console.error(`❌ Error translating short description to ${lang}:`, error);
            }

            // Переводим полное описание (если есть)
            if (product.description) {
              try {
                const response = await fetch(getServerUrl('/api/translate'), {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    text: product.description,
                    targetLanguage: lang,
                    sourceLanguage: 'ru',
                  }),
                });

                if (response.ok) {
                  const data = await response.json();
                  if (data.success && data.translatedText) {
                    translations[`description_${lang}`] = data.translatedText.trim();
                  }
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
              } catch (error) {
                console.error(`❌ Error translating description to ${lang}:`, error);
              }
            }
          }

          // Обновляем товар в базе данных
          const { error: updateError } = await supabase
            .from('products')
            .update(translations)
            .eq('id', product.id);

          if (updateError) {
            console.error(`Error updating product ${product.id}:`, updateError);
            errorCount++;
          } else {
            successCount++;
            console.log(`✅ Product ${product.id} translated successfully`);
          }

        } catch (productError) {
          console.error(`Error processing product ${product.id}:`, productError);
          errorCount++;
        }
      }

      await loadProducts();
      setSelectedProducts([]);

      const message = t('autoTranslateSuccess').replace('{count}', successCount.toString());
      toast.success(message + (errorCount > 0 ? ` (Ошибок: ${errorCount})` : ''));

    } catch (error) {
      console.error('Auto-translate error:', error);
      toast.error(t('autoTranslateError'));
    } finally {
      setIsAutoTranslating(false);
      setTranslateProgress({ current: 0, total: 0 });
    }
  };

  // Функции для работы с выбором товаров
  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  // Filter products by search query
  const filteredProducts = products.filter(product => {
    const productName = getProductName(product).toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    return productName.includes(searchLower);
  });

  return (
    <div>
      {!showForm ? (
        <>
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus size={20} />
              <span>{t('addProduct')}</span>
            </button>
          </div>

          {/* Selection controls */}
          <div className="mb-4 flex flex-wrap items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 bg-gray-600 text-white px-3 py-1.5 rounded hover:bg-gray-700 transition-colors text-sm"
            >
              {selectedProducts.length === filteredProducts.length && filteredProducts.length > 0 ? '☑️ Снять все' : '☐ Выбрать все'}
            </button>

            {selectedProducts.length > 0 && (
              <>
                <span className="text-sm text-gray-700">
                  Выбрано: <strong>{selectedProducts.length}</strong>
                </span>

                <button
                  onClick={autoTranslateSelectedProducts}
                  disabled={isAutoTranslating}
                  className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  {isAutoTranslating ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Перевод...</span>
                      {translateProgress.total > 0 && (
                        <span className="text-xs">
                          ({translateProgress.current}/{translateProgress.total})
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      🌐
                      <span>Перевести выбранные</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setSelectedProducts([])}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm"
                >
                  <X size={16} />
                  Очистить
                </button>
              </>
            )}
          </div>

          {/* Search */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={t('searchProducts') || 'Поиск товаров...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-red-600" size={48} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery ? t('noProductsFound') : t('noProducts')}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                      className="mt-1 w-5 h-5 text-red-600"
                    />
                    
                    {product.image && (
                      <img
                        src={product.image}
                        alt={getProductName(product)}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {getProductName(product)}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {t('price')}: ¥{product.price}
                        {product.wholesalePrice && ` | ${t('wholesalePrice')}: ¥${product.wholesalePrice}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('category')}: {product.category} | {t('store')}: {product.store}
                      </p>
                      {product.saleEnabled && product.saleEndDate && (
                        <div className="mt-2 inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                          🔥 Акция -{product.saleDiscount}% до {new Date(product.saleEndDate).toLocaleString()}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title={t('edit')}
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title={t('delete')}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              {editingProduct ? t('editProduct') : t('addProduct')}
            </h2>
            <button
              type="button"
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
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
                {t('productName')} (EN)
              </label>
              <input
                type="text"
                name="name_en"
                value={formData.name_en}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                {t('productName')} (ZH)
              </label>
              <input
                type="text"
                name="name_zh"
                value={formData.name_zh}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                {t('productName')} (VI)
              </label>
              <input
                type="text"
                name="name_vi"
                value={formData.name_vi}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>

          {/* Auto-translate button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={autoTranslate}
              disabled={loading || !formData.name || !formData.shortDescription}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Перевод...</span>
                </>
              ) : (
                <>
                  🌐
                  <span>Автоперевод на EN, ZH, VI</span>
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Сначала заполните русские поля (Название и Краткое описание)
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 mb-2">
                {t('price')} (¥) *
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
                {t('wholesalePrice')} (¥)
              </label>
              <input
                type="number"
                step="0.01"
                name="wholesalePrice"
                value={formData.wholesalePrice}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                {t('category')} *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                {categories.topMenu.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.translations[currentLanguage as keyof typeof cat.translations]}
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
                {t('weight')} (kg) *
              </label>
              <input
                type="number"
                step="0.01"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                {t('imageUrl')}
              </label>
              <input
                type="text"
                name="image"
                value={formData.image}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>

          {/* Disease categories */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              {t('diseaseCategories')} *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {categories.sidebar
                .filter(cat => cat.id !== 'popular')
                .map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center gap-2 p-2 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.diseaseCategories.includes(cat.id)}
                      onChange={() => handleDiseaseCategoryToggle(cat.id)}
                      className="w-4 h-4 text-red-600"
                    />
                    <span className="text-sm">
                      {cat.translations[currentLanguage as keyof typeof cat.translations]}
                    </span>
                  </label>
                ))}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="inStock"
                checked={formData.inStock}
                onChange={handleChange}
                className="w-5 h-5 text-red-600"
              />
              <label className="text-gray-700">
                {t('inStock')}
              </label>
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
              <label className="text-gray-700 flex items-center gap-2">
                {t('isSample')}
                {formData.store === 'china' && formData.isSample && (
                  <span className="text-xs text-gray-500">
                    ({t('samples')} - {t('storeChina')})
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* Sale / Promotion Section */}
          <div className="md:col-span-2 border-t pt-6 mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🔥 {t('salePromotion')}</h3>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="saleEnabled"
                  checked={formData.saleEnabled}
                  onChange={handleChange}
                  className="w-5 h-5 text-red-600"
                />
                <label className="text-gray-700 font-medium">
                  {t('enableSale')}
                </label>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  {t('saleDiscount')} {formData.saleEnabled && '*'}
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="99"
                  name="saleDiscount"
                  value={formData.saleDiscount}
                  onChange={handleChange}
                  disabled={!formData.saleEnabled}
                  placeholder="10"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">{t('saleDiscountRange')}</p>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  {t('saleEndDate')} {formData.saleEnabled && '*'}
                </label>
                <input
                  type="datetime-local"
                  name="saleEndDate"
                  value={formData.saleEndDate}
                  onChange={handleChange}
                  disabled={!formData.saleEnabled}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">{t('saleDateTimeEnd')}</p>
              </div>
            </div>

            {formData.saleEnabled && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>{t('salePreview')}:</strong> {currentLanguage === 'ru' && `На карточке товара будет показан бейдж "-${formData.saleDiscount || 0}%", зачеркнутая старая цена и новая цена со скидкой. Таймер обратного отсчета будет показывать время до ${formData.saleEndDate ? new Date(formData.saleEndDate).toLocaleString('ru-RU') : 'окончания акции'}.`}
                  {currentLanguage === 'en' && `The product card will show a "-${formData.saleDiscount || 0}%" badge, crossed out old price and new discounted price. Countdown timer will show time until ${formData.saleEndDate ? new Date(formData.saleEndDate).toLocaleString('en-US') : 'sale end'}.`}
                  {currentLanguage === 'zh' && `产品卡片将显示 "-${formData.saleDiscount || 0}%" 徽章、划掉的旧价格和新的折扣价格。倒计时器将显示距 ${formData.saleEndDate ? new Date(formData.saleEndDate).toLocaleString('zh-CN') : '促销结束'} 的时间。`}
                  {currentLanguage === 'vi' && `Thẻ sản phẩm sẽ hiển thị huy hiệu "-${formData.saleDiscount || 0}%", giá cũ gạch bỏ và giá mới được giảm giá. Bộ đếm ngược sẽ hiển thị thời gian đến ${formData.saleEndDate ? new Date(formData.saleEndDate).toLocaleString('vi-VN') : 'kết thúc khuyến mãi'}.`}
                </p>
              </div>
            )}
          </div>

          {/* Short Description fields */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 mb-2">
                {t('productShortDescription')} (RU) *
              </label>
              <textarea
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                rows={2}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                {t('productShortDescription')} (EN)
              </label>
              <textarea
                name="shortDescription_en"
                value={formData.shortDescription_en}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                {t('productShortDescription')} (ZH)
              </label>
              <textarea
                name="shortDescription_zh"
                value={formData.shortDescription_zh}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                {t('productShortDescription')} (VI)
              </label>
              <textarea
                name="shortDescription_vi"
                value={formData.shortDescription_vi}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>

          {/* Full Description fields */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 mb-2">
                {t('productDescription')} (RU)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
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
                rows={4}
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
                rows={4}
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
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span>{t('saving')}</span>
                </div>
              ) : (
                t('save')
              )}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};