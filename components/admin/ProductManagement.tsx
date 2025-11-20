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
    // Default to Russian (name)
    return product.name || '';
  };

  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    name_zh: '',
    name_vi: '',
    price: '',
    wholesalePrice: '',
    category: 'ointments', // Категория товара (только ОДНА)
    disease: 'cold', // Основная категория заболевания
    diseaseCategories: [] as string[], // Множественные категории заболеваний
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
    
    // Listen for category updates
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
      // First try to load from localStorage
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

      // Load from Supabase kv_store
      console.log('⚠️ No categories in localStorage, fetching from Supabase...');
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('kv_store_a75b5353')
        .select('value')
        .eq('key', 'categories')
        .maybeSingle();

      if (error) {
        console.error('❌ Failed to load categories:', error);
        // Use empty categories as fallback
        setCategories({ topMenu: [], sidebar: [] });
      } else if (data?.value) {
        const categoriesData = data.value;
        setCategories(categoriesData);
        localStorage.setItem('categories', JSON.stringify(categoriesData));
        console.log('✅ Categories loaded from kv_store');
      } else {
        // No categories in database, use empty
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
        // Map server format to frontend format
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

  // Handle disease category checkboxes (вертикальное меню - может быть несколько)
  const handleDiseaseCategoryToggle = (categoryId: string) => {
    const newDiseaseCategories = formData.diseaseCategories.includes(categoryId)
      ? formData.diseaseCategories.filter(c => c !== categoryId)
      : [...formData.diseaseCategories, categoryId];
    
    setFormData({
      ...formData,
      diseaseCategories: newDiseaseCategories,
      // Update main disease to first selected disease category
      disease: newDiseaseCategories.length > 0 ? newDiseaseCategories[0] : 'cold'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
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

      // Validate that at least one disease category is selected
      if (formData.diseaseCategories.length === 0) {
        toast.error(t('pleaseSelectCategory') || 'Выберите хотя бы одну категорию заболевания');
        setLoading(false);
        return;
      }

      // Validate sale fields if sale is enabled
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

      // Exclude frontend-only fields and map to DB column names
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
        // Update existing product
        result = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .select()
          .single();
      } else {
        // Insert new product
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
    const wholesalePriceValue = (product as any).wholesalePrice; // Keep as any for backwards compatibility
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

      // Проверяем наличие API ключа
      const checkKeyResponse = await fetch(getServerUrl('/api/translate/key'), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const keyData = await checkKeyResponse.json();
      const hasApiKey = keyData.hasKey;

      if (!hasApiKey) {
        console.warn('⚠️ Google Translate API key not configured');
        toast.warning('API ключ Google Translate не настроен. Используется заглушка.');
        
        // Fallback: использовать заглушку
        for (const lang of languages) {
          for (const { field, text } of fieldsToTranslate) {
            if (!text) continue;
            const key = `${field}_${lang}`;
            translations[key] = `[${lang.toUpperCase()}] ${text}`;
          }
        }
        
        setFormData(prev => ({
          ...prev,
          ...translations,
        }));
        
        setLoading(false);
        return;
      }

      // Переводим для каждого языка
      for (const lang of languages) {
        console.log(`🌐 Translating to ${lang}...`);
        
        // Собираем все тексты для пакетного перевода
        const textsToTranslate = fieldsToTranslate
          .filter(({ text }) => text)
          .map(({ text }) => text);

        if (textsToTranslate.length === 0) continue;

        try {
          // Используем пакетный перевод для эффективности
          const response = await fetch(getServerUrl('/api/translate/batch'), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              texts: textsToTranslate,
              targetLanguage: lang,
              sourceLanguage: 'ru',
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Translation to ${lang} failed`);
          }

          const data = await response.json();
          
          if (data.success && data.translations) {
            // Применяем переводы к полям
            fieldsToTranslate.forEach(({ field, text }, index) => {
              if (text && data.translations[index]) {
                const key = `${field}_${lang}`;
                translations[key] = data.translations[index].translatedText;
                console.log(`✅ Translated ${field} to ${lang}: ${translations[key].substring(0, 50)}...`);
              }
            });
          }
        } catch (langError) {
          console.error(`❌ Error translating to ${lang}:`, langError);
          // Fallback для этого языка
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

  // Функция массового автоперевода всех товаров в каталоге
  const autoTranslateAllProducts = async () => {
    if (!accessToken) {
      toast.error(t('authRequired') || 'Необходима авторизация');
      return;
    }

    if (products.length === 0) {
      toast.error(t('noProductsFound') || 'Нет товаров для перевода');
      return;
    }

    const confirmed = confirm(t('autoTranslateConfirm'));
    if (!confirmed) return;

    setIsAutoTranslating(true);
    setTranslateProgress({ current: 0, total: products.length });
    
    let successCount = 0;
    let errorCount = 0;

    try {
      const supabase = createClient();

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        setTranslateProgress({ current: i + 1, total: products.length });

        // Пропустить, если нет русского названия
        if (!product.name || !product.shortDescription) {
          console.log(`⚠️ Skipping product ${product.id}: missing Russian name or description`);
          errorCount++;
          continue;
        }

        try {
          // Переводим название и описания
          const textsToTranslate = [
            product.name,
            product.shortDescription,
            product.description || '',
          ];

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

          // Переводим на каждый язык
          for (const lang of ['en', 'zh', 'vi']) {
            try {
              const response = await fetch(getServerUrl('/api/translate'), {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  text: textsToTranslate.join('|||'), // Используем разделитель
                  targetLanguage: lang,
                  sourceLanguage: 'ru',
                }),
              });

              if (response.ok) {
                const data = await response.json();
                if (data.success && data.translatedText) {
                  const translatedParts = data.translatedText.split('|||');
                  translations[`name_${lang}`] = translatedParts[0] || textsToTranslate[0];
                  translations[`short_description_${lang}`] = translatedParts[1] || textsToTranslate[1];
                  translations[`description_${lang}`] = translatedParts[2] || textsToTranslate[2];
                }
              }
            } catch (langError) {
              console.error(`Error translating to ${lang}:`, langError);
            }

            // Небольшая задержка между запросами
            await new Promise(resolve => setTimeout(resolve, 300));
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

      // Обновляем список товаров
      await loadProducts();

      // Показываем результат
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

  // Fallback categories if none are loaded from API
  const fallbackTopMenuCategories = ['ointments', 'patches', 'sprays', 'teas', 'elixirs', 'pills', 'cosmetics', 'accessories'];
  const fallbackSidebarCategories = ['popular', 'allProducts', 'cold', 'digestive', 'skin', 'joints', 'heart', 'liverKidneys', 'nervous', 'womensHealth', 'mensHealth', 'forChildren', 'vision', 'hemorrhoids', 'oncology', 'thyroid', 'lungs'];

  // Use loaded categories or fallback
  const topMenuCategoryIds = categories.topMenu.length > 0
    ? categories.topMenu.map(cat => cat.id)
    : fallbackTopMenuCategories;

  const sidebarCategoryIds = categories.sidebar.length > 0
    ? categories.sidebar.map(cat => cat.id)
    : fallbackSidebarCategories;

  // Helper to get category translation - memoized to update when language changes
  const getCategoryTranslation = useCallback((categoryId: string, menuType: 'topMenu' | 'sidebar') => {
    const categoryList = menuType === 'topMenu' ? categories.topMenu : categories.sidebar;
    const category = categoryList.find(cat => cat.id === categoryId);
    if (category && category.translations) {
      return category.translations[currentLanguage] || category.translations.ru;
    }
    // Fallback to translation key
    return t(categoryId);
  }, [categories, currentLanguage, t]);

  // Filter products based on search query
  const filteredProducts = products.filter(product => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const name = (product.name || '').toLowerCase();
    const name_en = (product.name_en || '').toLowerCase();
    const name_zh = (product.name_zh || '').toLowerCase();
    const name_vi = (product.name_vi || '').toLowerCase();
    const category = t(product.category).toLowerCase();
    const description = (product.description || '').toLowerCase();
    const shortDescription = (product.shortDescription || '').toLowerCase();
    
    return (
      name.includes(query) ||
      name_en.includes(query) ||
      name_zh.includes(query) ||
      name_vi.includes(query) ||
      category.includes(query) ||
      description.includes(query) ||
      shortDescription.includes(query)
    );
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

            <button
              onClick={autoTranslateAllProducts}
              disabled={isAutoTranslating || products.length === 0}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              title={t('autoTranslateProductsDesc')}
            >
              {isAutoTranslating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>{t('autoTranslating')}</span>
                  {translateProgress.total > 0 && (
                    <span className="text-xs">
                      ({translateProgress.current}/{translateProgress.total})
                    </span>
                  )}
                </>
              ) : (
                <>
                  🌐
                  <span>{t('autoTranslateProducts')}</span>
                </>
              )}
            </button>
          </div>

          {/* Warning banner */}
          {!isAutoTranslating && products.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                {t('autoTranslateWarning')}
              </p>
            </div>
          )}

          {/* Progress banner */}
          {isAutoTranslating && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-blue-800">
                  {t('autoTranslateProgress')
                    .replace('{current}', translateProgress.current.toString())
                    .replace('{total}', translateProgress.total.toString())}
                </p>
                <span className="text-sm text-blue-600">
                  {translateProgress.total > 0
                    ? Math.round((translateProgress.current / translateProgress.total) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      translateProgress.total > 0
                        ? (translateProgress.current / translateProgress.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-red-600" size={48} />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Search Bar */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`${t('search')} (${t('productName')}, ${t('category')}, ${t('productDescription')}...)`}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {t('totalFound')}: {filteredProducts.length} {t('of')} {products.length}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-2 sm:px-6 py-3 text-left text-gray-700 text-xs sm:text-sm">{t('productName')}</th>
                      <th className="px-2 sm:px-6 py-3 text-left text-gray-700 text-xs sm:text-sm">{t('price')}</th>
                      <th className="px-2 sm:px-6 py-3 text-left text-gray-700 text-xs sm:text-sm hidden sm:table-cell">{t('category')}</th>
                      <th className="px-2 sm:px-6 py-3 text-left text-gray-700 text-xs sm:text-sm">{t('stockStatus')}</th>
                      <th className="px-2 sm:px-6 py-3 text-left text-gray-700 text-xs sm:text-sm">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-2 sm:px-6 py-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <img
                              src={product.image}
                              alt={getProductName(product)}
                              className="w-8 h-8 sm:w-12 sm:h-12 object-cover rounded"
                            />
                            <span className="text-gray-800 text-xs sm:text-sm">{getProductName(product)}</span>
                          </div>
                        </td>
                        <td className="px-2 sm:px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {(() => {
                              const saleEnabled = (product as any).saleEnabled;
                              const saleDiscount = (product as any).saleDiscount;
                              const saleEndDate = (product as any).saleEndDate;
                              const now = new Date();
                              const isSaleActive = saleEnabled && saleEndDate && new Date(saleEndDate) > now;
                              
                              if (isSaleActive && saleDiscount) {
                                const originalPrice = product.price || 0;
                                const discountedPrice = originalPrice * (1 - saleDiscount / 100);
                                return (
                                  <>
                                    <div className="flex items-center gap-1 sm:gap-2">
                                      <span className="text-gray-400 line-through text-xs">{originalPrice.toLocaleString()} ₽</span>
                                      <span className="bg-red-600 text-white px-1 sm:px-2 py-0.5 rounded text-xs">-{saleDiscount}%</span>
                                    </div>
                                    <span className="text-red-600 text-xs sm:text-sm">{discountedPrice.toLocaleString()} ₽</span>
                                  </>
                                );
                              }
                              return <span className="text-gray-700 text-xs sm:text-sm">{(product.price || 0).toLocaleString()} ₽</span>;
                            })()}
                          </div>
                        </td>
                        <td className="px-2 sm:px-6 py-4 hidden sm:table-cell">
                          <div className="flex flex-col gap-1">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded inline-block">
                              {t(product.category)}
                            </span>
                            {product.diseaseCategories && product.diseaseCategories.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {product.diseaseCategories.slice(0, 3).map((cat, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                    {t(cat)}
                                  </span>
                                ))}
                                {product.diseaseCategories.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                    +{product.diseaseCategories.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 sm:px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs sm:text-sm ${
                              product.inStock
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {product.inStock ? t('inStock') : t('outOfStock')}
                          </span>
                        </td>
                        <td className="px-2 sm:px-6 py-4">
                          <div className="flex gap-1 sm:gap-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-1 sm:p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-1 sm:p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
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
                  {t('productCategory')} * <span className="text-sm text-gray-500">{t('productCategoryHint')}</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  {topMenuCategoryIds.map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryTranslation(cat, 'topMenu')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">
                  {t('productDisease')} * <span className="text-sm text-gray-500">{t('productDiseaseHint')}</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 border border-gray-300 rounded-lg bg-gray-50">
                  {sidebarCategoryIds.map((dis) => (
                    <label key={dis} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.diseaseCategories.includes(dis)}
                        onChange={() => handleDiseaseCategoryToggle(dis)}
                        className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-600"
                      />
                      <span className="text-sm text-gray-700">
                        {getCategoryTranslation(dis, 'sidebar')}
                      </span>
                    </label>
                  ))}
                </div>
                {formData.diseaseCategories.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">⚠️ {t('pleaseSelectCategory') || 'Выберите хотя бы одну категорию заболевания'}</p>
                )}
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

            {/* Sale / Promotion Section */}
            <div className="md:col-span-2 border-t pt-6">
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
            <div className="grid md:grid-cols-2 gap-4">
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