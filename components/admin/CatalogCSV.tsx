import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { createClient } from '../../utils/supabase/client';
import { Download, Upload, FileText, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
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

export const CatalogCSV = () => {
  const { t } = useLanguage();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const [categories, setCategories] = useState<CategoryData>({
    topMenu: [],
    sidebar: [],
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const storedCategories = localStorage.getItem('categories');
      if (storedCategories) {
        const parsed = JSON.parse(storedCategories);
        setCategories(parsed);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('kv_store_a75b5353')
        .select('value')
        .eq('key', 'categories')
        .single();

      if (error) {
        console.error('Error loading categories:', error);
        return;
      }

      if (data?.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        setCategories(parsed);
        localStorage.setItem('categories', JSON.stringify(parsed));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const getCategoryNameById = (categoryId: string, type: 'topMenu' | 'sidebar'): string => {
    const category = categories[type].find(cat => cat.id === categoryId);
    return category?.translations.ru || categoryId;
  };

  const getCategoryIdByName = (categoryName: string, type: 'topMenu' | 'sidebar'): string | null => {
    if (!categoryName || !categoryName.trim()) return null;
    
    const trimmedName = categoryName.trim();
    
    // Exact match
    const category = categories[type].find(cat => cat.translations.ru === trimmedName);
    if (category) return category.id;
    
    // Case-insensitive match
    const categoryLower = categories[type].find(cat => 
      cat.translations.ru.toLowerCase() === trimmedName.toLowerCase()
    );
    if (categoryLower) return categoryLower.id;
    
    // Check if it's already an ID
    if (categories[type].find(cat => cat.id === trimmedName)) {
      return trimmedName;
    }
    
    console.warn(`⚠️ Category not found: "${trimmedName}" in ${type}`);
    return null;
  };

  const escapeCsvValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    const QUOTE = '"';
    const DOUBLE_QUOTE = '""';
    const SEPARATOR = ';';
    if (str.includes(SEPARATOR) || str.includes('\n') || str.includes(QUOTE)) {
      return QUOTE + str.replace(/"/g, DOUBLE_QUOTE) + QUOTE;
    }
    return str;
  };

  const parseCsvValue = (value: string): string => {
    const QUOTE = '"';
    const DOUBLE_QUOTE = '""';
    if (value.startsWith(QUOTE) && value.endsWith(QUOTE)) {
      return value.slice(1, -1).replace(new RegExp(DOUBLE_QUOTE, 'g'), QUOTE);
    }
    return value;
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Export error:', error);
        toast.error(t('csvExportError'));
        return;
      }

      if (!products || products.length === 0) {
        toast.error('Нет товаров для экспорта');
        return;
      }

      const columns = [
        { key: 'name', header: 'Название (RU) *' },
        { key: 'name_en', header: 'Название (EN)' },
        { key: 'name_zh', header: 'Название (ZH)' },
        { key: 'name_vi', header: 'Название (VI)' },
        { key: 'price', header: 'Розничная цена (₽) *' },
        { key: 'wholesale_price', header: 'Оптовая цена (¥)' },
        { key: 'weight', header: 'Вес (кг) *' },
        { key: 'category', header: 'Категория *' },
        { key: 'disease_categories', header: 'Для заболевания *' },
        { key: 'store', header: 'Магазин *' },
        { key: 'short_description', header: 'Краткое описание (RU) *' },
        { key: 'short_description_en', header: 'Краткое описание (EN)' },
        { key: 'short_description_zh', header: 'Краткое описание (ZH)' },
        { key: 'short_description_vi', header: 'Краткое описание (VI)' },
        { key: 'description', header: 'Описание (RU)' },
        { key: 'image', header: 'Изображение' },
        { key: 'in_stock', header: 'В наличии' },
        { key: 'is_sample', header: 'Пробник' },
      ];

      const SEPARATOR = ';';
      const headers = columns.map(col => col.header).join(SEPARATOR);
      const rows = products.map(product => {
        return columns.map(col => {
          let value = (product as any)[col.key];
          
          if (col.key === 'category' && value) {
            value = getCategoryNameById(value, 'topMenu');
          }
          
          if (col.key === 'disease_categories' && Array.isArray(value)) {
            value = value.map(id => getCategoryNameById(id, 'sidebar')).join(', ');
          }
          
          if (col.key === 'in_stock' || col.key === 'is_sample') {
            value = value ? 'Да' : 'Нет';
          }
          
          return escapeCsvValue(value);
        }).join(SEPARATOR);
      });

      const csv = [headers, ...rows].join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `catalog_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(t('csvExportSuccess'));
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t('csvExportError'));
    } finally {
      setLoading(false);
    }
  };

  const parseCSVLine = (line: string, separator: string): string[] => {
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentValue += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === separator && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());
    return values;
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error(t('csvFileOnly'));
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      let text = await file.text();
      
      // Remove BOM if present
      text = text.replace(/^\ufeff/, '');
      
      // Normalize line endings
      text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('CSV файл пустой или некорректный');
        setUploading(false);
        return;
      }

      const SEPARATOR = ';';
      const headerLine = lines[0];
      const headers = parseCSVLine(headerLine, SEPARATOR);
      
      console.log('📋 CSV Headers:', headers);
      
      const products = [];
      const errors: string[] = [];
      let created = 0;
      let skipped = 0;

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCSVLine(lines[i], SEPARATOR);

          const product: any = {};
          
          // Debug first row
          if (i === 1) {
            console.log('📊 First row values:', values);
            console.log('📊 Values count:', values.length, 'Headers count:', headers.length);
          }
          
          headers.forEach((header, index) => {
            const value = values[index] || '';
            const cleanValue = value.trim();
            
            if (header.includes('Название (RU)') || header.includes('Название') && header.includes('*')) {
              product.name = cleanValue;
            } else if (header.includes('Название (EN)')) {
              product.name_en = cleanValue;
            } else if (header.includes('Название (ZH)')) {
              product.name_zh = cleanValue;
            } else if (header.includes('Название (VI)')) {
              product.name_vi = cleanValue;
            } else if (header.includes('Розничная цена') || header.includes('цена') && header.includes('*')) {
              const numValue = cleanValue.replace(/[^\d.,]/g, '').replace(',', '.');
              product.price = parseFloat(numValue) || 0;
            } else if (header.includes('Оптовая цена')) {
              const numValue = cleanValue.replace(/[^\d.,]/g, '').replace(',', '.');
              product.wholesale_price = numValue ? parseFloat(numValue) : null;
            } else if (header.includes('Вес')) {
              const numValue = cleanValue.replace(/[^\d.,]/g, '').replace(',', '.');
              product.weight = parseFloat(numValue) || 0.1;
            } else if (header.includes('Категория')) {
              const categoryId = getCategoryIdByName(cleanValue, 'topMenu');
              if (categoryId) {
                product.category = categoryId;
              } else {
                product.category = cleanValue || 'ointments';
              }
            } else if (header.includes('Для заболевания') || header.includes('заболевания')) {
              const diseaseNames = cleanValue.split(',').map(d => d.trim()).filter(d => d);
              const diseaseIds = diseaseNames
                .map(name => getCategoryIdByName(name, 'sidebar'))
                .filter(id => id !== null) as string[];
              
              if (diseaseIds.length > 0) {
                product.disease_categories = diseaseIds;
                product.disease = diseaseIds[0];
              } else {
                product.disease_categories = ['cold'];
                product.disease = 'cold';
              }
            } else if (header.includes('Магазин')) {
              const storeMap: any = {
                'Китай': 'china',
                'Таиланд': 'thailand',
                'Вьетнам': 'vietnam',
                'china': 'china',
                'thailand': 'thailand',
                'vietnam': 'vietnam',
              };
              product.store = storeMap[cleanValue] || storeMap[cleanValue.toLowerCase()] || 'china';
            } else if (header.includes('Краткое описание (RU)') || (header.includes('Краткое') && header.includes('*'))) {
              product.short_description = cleanValue;
            } else if (header.includes('Краткое описание (EN)')) {
              product.short_description_en = cleanValue;
            } else if (header.includes('Краткое описание (ZH)')) {
              product.short_description_zh = cleanValue;
            } else if (header.includes('Краткое описание (VI)')) {
              product.short_description_vi = cleanValue;
            } else if (header.includes('Описание (RU)')) {
              product.description = cleanValue;
            } else if (header.includes('Изображение')) {
              product.image = cleanValue;
            } else if (header.includes('В наличии') || header.includes('наличии')) {
              product.in_stock = cleanValue === 'Да' || cleanValue === 'да' || cleanValue === 'true' || cleanValue === '1';
            } else if (header.includes('Пробник')) {
              product.is_sample = cleanValue === 'Да' || cleanValue === 'да' || cleanValue === 'true' || cleanValue === '1';
            }
          });

          const requiredFields = [
            { field: 'name', name: 'Название (RU)' },
            { field: 'price', name: 'Розничная цена' },
            { field: 'weight', name: 'Вес' },
            { field: 'category', name: 'Категория' },
            { field: 'disease_categories', name: 'Для заболевания' },
            { field: 'store', name: 'Магазин' },
            { field: 'short_description', name: 'Краткое описание (RU)' },
          ];

          const missingFields = requiredFields.filter(({ field }) => {
            const val = product[field];
            if (field === 'price' || field === 'weight') {
              return !val || val === 0;
            }
            if (Array.isArray(val)) {
              return val.length === 0;
            }
            return !val || val.trim() === '';
          }).map(({ name }) => name);

          if (missingFields.length > 0) {
            const debugInfo = `Строка ${i + 1}: Отсутствуют обязательные поля: ${missingFields.join(', ')}`;
            if (i <= 3) {
              console.log('❌ Debug row', i + 1, ':', product);
              console.log('   Values:', values);
            }
            errors.push(debugInfo);
            skipped++;
            continue;
          }

          // Set defaults for optional fields
          if (product.in_stock === undefined) product.in_stock = true;
          if (product.is_sample === undefined) product.is_sample = false;
          
          // Ensure we have created_at timestamp
          product.created_at = new Date().toISOString();
          
          // Log product data for first few rows
          if (products.length < 3) {
            console.log(`✅ Valid product ${products.length + 1}:`, {
              name: product.name,
              price: product.price,
              weight: product.weight,
              category: product.category,
              disease: product.disease,
              disease_categories: product.disease_categories,
              store: product.store,
              short_description: product.short_description?.substring(0, 50) + '...',
            });
          }

          products.push(product);
        } catch (error) {
          errors.push(`Строка ${i + 1}: Ошибка парсинга - ${error}`);
          skipped++;
        }
      }

      if (products.length > 0) {
        console.log('🔄 Starting catalog synchronization with', products.length, 'products from CSV');
        
        const supabase = createClient();
        
        // Check Supabase connection and get existing products
        const { data: existingProducts, error: fetchError } = await supabase
          .from('products')
          .select('id, name');
          
        if (fetchError) {
          console.error('❌ Supabase connection error:', fetchError);
          setUploadResult({
            success: false,
            message: `Ошибка подключения к базе данных: ${fetchError.message}`,
            details: { errors, skipped, attempted: products.length },
          });
          toast.error('Ошибка подключения к базе данных');
          return;
        }
        
        console.log('✅ Supabase connection OK. Existing products:', existingProducts?.length || 0);
        
        // Create a map of existing products by name
        const existingProductsMap = new Map<string, string>();
        (existingProducts || []).forEach(p => {
          if (p.name) {
            existingProductsMap.set(p.name.trim().toLowerCase(), p.id);
          }
        });
        
        // Track operations
        let updated = 0;
        let inserted = 0;
        let deleted = 0;
        const updateErrors: string[] = [];
        
        // Clean and process products from CSV
        for (const p of products) {
          const cleaned: any = {
            name: p.name,
            price: p.price,
            weight: p.weight,
            category: p.category,
            disease: p.disease,
            disease_categories: p.disease_categories || [],
            store: p.store,
            short_description: p.short_description,
            in_stock: p.in_stock !== undefined ? p.in_stock : true,
            is_sample: p.is_sample !== undefined ? p.is_sample : false,
          };
          
          // Add optional fields only if they exist
          if (p.name_en) cleaned.name_en = p.name_en;
          if (p.name_zh) cleaned.name_zh = p.name_zh;
          if (p.name_vi) cleaned.name_vi = p.name_vi;
          if (p.wholesale_price) cleaned.wholesale_price = p.wholesale_price;
          if (p.short_description_en) cleaned.short_description_en = p.short_description_en;
          if (p.short_description_zh) cleaned.short_description_zh = p.short_description_zh;
          if (p.short_description_vi) cleaned.short_description_vi = p.short_description_vi;
          if (p.description) cleaned.description = p.description;
          if (p.description_en) cleaned.description_en = p.description_en;
          if (p.description_zh) cleaned.description_zh = p.description_zh;
          if (p.description_vi) cleaned.description_vi = p.description_vi;
          if (p.image) cleaned.image = p.image;
          
          const productNameKey = p.name.trim().toLowerCase();
          const existingProductId = existingProductsMap.get(productNameKey);
          
          if (existingProductId) {
            // Update existing product
            const { error: updateError } = await supabase
              .from('products')
              .update(cleaned)
              .eq('id', existingProductId);
              
            if (updateError) {
              console.error(`❌ Error updating "${p.name}":`, updateError);
              updateErrors.push(`Ошибка обновления "${p.name}": ${updateError.message}`);
            } else {
              console.log(`✅ Updated: ${p.name}`);
              updated++;
              // Remove from map so we know it was processed
              existingProductsMap.delete(productNameKey);
            }
          } else {
            // Insert new product
            const { error: insertError } = await supabase
              .from('products')
              .insert([cleaned]);
              
            if (insertError) {
              console.error(`❌ Error inserting "${p.name}":`, insertError);
              updateErrors.push(`Ошибка добавления "${p.name}": ${insertError.message}`);
            } else {
              console.log(`✅ Inserted: ${p.name}`);
              inserted++;
            }
          }
        }
        
        // Delete products that are not in CSV (remaining in map)
        const productsToDelete = Array.from(existingProductsMap.values());
        if (productsToDelete.length > 0) {
          console.log(`🗑️ Deleting ${productsToDelete.length} products not in CSV`);
          const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .in('id', productsToDelete);
            
          if (deleteError) {
            console.error('❌ Error deleting products:', deleteError);
            updateErrors.push(`Ошибка удаления ${productsToDelete.length} товаров: ${deleteError.message}`);
          } else {
            deleted = productsToDelete.length;
            console.log(`✅ Deleted ${deleted} products`);
          }
        }
        
        // Combine all errors
        const allErrors = [...errors, ...updateErrors];
        
        created = inserted + updated;
        const successMsg = `Синхронизация завершена: обновлено ${updated}, добавлено ${inserted}, удалено ${deleted}${skipped > 0 ? `, пропущено ${skipped}` : ''}`;
        
        setUploadResult({
          success: updateErrors.length === 0,
          message: successMsg,
          details: { 
            created: inserted, 
            updated, 
            deleted, 
            skipped, 
            errors: allErrors 
          },
        });
        
        if (updateErrors.length === 0) {
          toast.success(successMsg);
          // Reload page after successful sync
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          toast.error(`Синхронизация завершена с ошибками`);
        }
      } else {
        console.log('❌ No valid products. Total lines:', lines.length - 1, 'Skipped:', skipped);
        setUploadResult({
          success: false,
          message: 'Нет валидных товаров для импорта',
          details: { errors, skipped, totalRows: lines.length - 1 },
        });
        toast.error('Нет валидных товаров для импорта');
      }
    } catch (error) {
      console.error('❌ Import error:', error);
      setUploadResult({
        success: false,
        message: `Ошибка импорта: ${error}`,
      });
      toast.error(t('csvImportError'));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-gray-800 flex items-center gap-2">
          <FileText size={24} />
          {t('catalogCSV')}
        </h3>
        <p className="text-sm text-gray-600 mt-2">
          {t('catalogCSVDescription')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Download className="text-green-600" size={24} />
            </div>
            <div>
              <h4 className="text-gray-800">{t('csvExport')}</h4>
              <p className="text-sm text-gray-600">{t('csvExportDescription')}</p>
            </div>
          </div>

          <div className="space-y-3 mb-4 text-sm text-gray-600">
            <p>✓ {t('csvExportInfo1')}</p>
            <p>✓ {t('csvExportInfo2')}</p>
            <p>✓ {t('csvExportInfo3')}</p>
          </div>

          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                {t('exporting')}
              </>
            ) : (
              <>
                <Download size={20} />
                {t('downloadCSV')}
              </>
            )}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Upload className="text-blue-600" size={24} />
            </div>
            <div>
              <h4 className="text-gray-800">{t('csvImport')}</h4>
              <p className="text-sm text-gray-600">{t('csvImportDescription')}</p>
            </div>
          </div>

          <div className="space-y-3 mb-4 text-sm text-gray-600">
            <p>✓ {t('csvImportInfo1')}</p>
            <p>✓ {t('csvImportInfo2')}</p>
            <p>✓ {t('csvImportInfo3')}</p>
            <p className="text-blue-600">🔄 <strong>{t('csvSyncTitle')}</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>{t('csvSyncMatching')}</li>
              <li>{t('csvSyncNew')}</li>
              <li className="text-red-600">{t('csvSyncMissing')}</li>
            </ul>
          </div>

          <label className="block">
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              disabled={uploading}
              className="hidden"
              id="csv-upload"
            />
            <div
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => !uploading && document.getElementById('csv-upload')?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {t('uploading')}
                </>
              ) : (
                <>
                  <Upload size={20} />
                  {t('uploadCSV')}
                </>
              )}
            </div>
          </label>

          {uploadResult && (
            <div
              className={`mt-4 p-4 rounded-lg border ${
                uploadResult.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {uploadResult.success ? (
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                ) : (
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                )}
                <div className="flex-1">
                  <p
                    className={`text-sm ${
                      uploadResult.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {uploadResult.message}
                  </p>
                  {uploadResult.details && (
                    <div className="mt-2 text-xs text-gray-600 space-y-1">
                      {uploadResult.details.updated !== undefined && uploadResult.details.updated > 0 && (
                        <p>🔄 {t('csvUpdated')}: {uploadResult.details.updated}</p>
                      )}
                      {uploadResult.details.created > 0 && (
                        <p>✓ {t('csvCreated')}: {uploadResult.details.created}</p>
                      )}
                      {uploadResult.details.deleted !== undefined && uploadResult.details.deleted > 0 && (
                        <p>🗑️ {t('csvDeleted')}: {uploadResult.details.deleted}</p>
                      )}
                      {uploadResult.details.skipped > 0 && (
                        <p>⚠️ {t('skipped')}: {uploadResult.details.skipped}</p>
                      )}
                      {uploadResult.details.dbError && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-red-600 font-semibold">{t('csvDbError')}:</p>
                          <p className="text-sm text-red-700 mt-1">{uploadResult.details.dbError.message}</p>
                          {uploadResult.details.dbError.details && (
                            <p className="text-xs text-red-600 mt-1">{uploadResult.details.dbError.details}</p>
                          )}
                          {uploadResult.details.dbError.hint && (
                            <p className="text-xs text-red-600 mt-1">💡 {uploadResult.details.dbError.hint}</p>
                          )}
                        </div>
                      )}
                      {uploadResult.details.errors && uploadResult.details.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-red-600 font-semibold">{t('csvValidationErrors')}:</p>
                          <ul className="list-disc list-inside mt-1">
                            {uploadResult.details.errors.slice(0, 10).map((error: string, idx: number) => (
                              <li key={idx} className="text-red-700 text-sm">{error}</li>
                            ))}
                            {uploadResult.details.errors.length > 10 && (
                              <li className="text-sm">... {t('andMore')} {uploadResult.details.errors.length - 10}</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-gray-800 mb-3">📋 {t('csvFormatInfo')}</h4>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>{t('csvRequiredFields')}</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>{t('csvFieldNameRu')}</li>
            <li>{t('csvFieldPrice')}</li>
            <li>{t('csvFieldWeight')}</li>
            <li>{t('csvFieldCategory')}</li>
            <li>{t('csvFieldDisease')}</li>
            <li>{t('csvFieldStore')}</li>
            <li>{t('csvFieldShortDesc')}</li>
          </ul>
          
          <p className="mt-3"><strong>{t('csvOptionalFields')}</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>{t('csvFieldNameLangs')}</li>
            <li>{t('csvFieldWholesale')}</li>
            <li>{t('csvFieldShortDescLangs')}</li>
            <li>{t('csvFieldDescription')}</li>
            <li>{t('csvFieldImage')}</li>
            <li>{t('csvFieldInStock')}</li>
            <li>{t('csvFieldIsSample')}</li>
          </ul>

          <div className="mt-4 space-y-2">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm">{t('csvTipExport')}</p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm">{t('csvImportantSeparator')}</p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm">{t('csvNumberFormat')}</p>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm">{t('csvImportWarning')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
