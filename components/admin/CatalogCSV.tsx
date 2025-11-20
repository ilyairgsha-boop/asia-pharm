import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { createClient } from '../../utils/supabase/client';
import { Download, Upload, FileText, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';
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
  const [showResultModal, setShowResultModal] = useState(false);
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
        { key: 'description_en', header: 'Описание (EN)' },
        { key: 'description_zh', header: 'Описание (ZH)' },
        { key: 'description_vi', header: 'Описание (VI)' },
        { key: 'image', header: 'Изображение' },
        { key: 'in_stock', header: 'В наличии' },
        { key: 'is_sample', header: 'Пробник' },
        { key: 'popular_order', header: 'Позиция в популярных' },
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

  // Parse CSV text into lines, respecting quoted multiline values
  const parseCSVLines = (text: string): string[] => {
    const lines: string[] = [];
    let currentLine = '';
    let insideQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote
          currentLine += '""';
          i++;
        } else {
          // Toggle quote mode
          insideQuotes = !insideQuotes;
          currentLine += char;
        }
      } else if (char === '\n' && !insideQuotes) {
        // End of line (outside quotes)
        if (currentLine.trim()) {
          lines.push(currentLine);
        }
        currentLine = '';
      } else {
        currentLine += char;
      }
    }
    
    // Push last line
    if (currentLine.trim()) {
      lines.push(currentLine);
    }
    
    return lines;
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
          // Escaped quote - add it to the value
          currentValue += '"';
          i++;
        } else {
          // Toggle quote mode
          insideQuotes = !insideQuotes;
        }
      } else if (char === separator && !insideQuotes) {
        // End of field - push value
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Push last value
    values.push(currentValue);
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
      
      // Parse CSV lines respecting quotes (multiline values)
      const lines = parseCSVLines(text);
      
      if (lines.length < 2) {
        toast.error('CSV файл пустой или некорректный');
        setUploading(false);
        return;
      }

      const SEPARATOR = ';';
      const headerLine = lines[0];
      const headers = parseCSVLine(headerLine, SEPARATOR);
      
      console.log('📋 CSV Headers:', headers);
      console.log('📋 Looking for columns:', {
        image: headers.find(h => h.includes('Изображение')),
        imageIndex: headers.findIndex(h => h.includes('Изображение')),
        description: headers.find(h => h.includes('Описание (RU)')),
        descriptionIndex: headers.findIndex(h => h.includes('Описание (RU)')),
        shortDescription: headers.find(h => h.includes('Краткое описание (RU)')),
        shortDescriptionIndex: headers.findIndex(h => h.includes('Краткое описание (RU)'))
      });
      
      const products = [];
      const errors: string[] = [];
      let created = 0;
      let skipped = 0;

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCSVLine(lines[i], SEPARATOR);

          const product: any = {};
          
          // Debug first row in detail
          if (i === 1) {
            console.log(`📊 Row ${i} - FULL DEBUG:`);
            console.log(`  Values count: ${values.length}, Headers count: ${headers.length}`);
            console.log(`  Line text (first 200 chars):`, lines[i].substring(0, 200));
            headers.forEach((header, idx) => {
              const val = values[idx] || '';
              if (header.includes('Изображение') || header.includes('Описание') || header.includes('Название') || header.includes('Краткое')) {
                console.log(`  [${idx}] "${header}" = "${val.substring(0, 100)}${val.length > 100 ? '...' : ''}"`);
              }
            });
          }
          
          headers.forEach((header, index) => {
            const value = values[index] || '';
            let cleanValue = value.trim();
            
            // Remove surrounding quotes if present (double cleanup just in case)
            if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
              cleanValue = cleanValue.slice(1, -1).trim();
            }
            
            if (header.includes('Название (RU)') || header.includes('Название') && header.includes('*')) {
              product.name = cleanValue;
            } else if (header.includes('Название (EN)')) {
              product.name_en = cleanValue;
            } else if (header.includes('Название (ZH)')) {
              product.name_zh = cleanValue;
            } else if (header.includes('Назваие (VI)')) {
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
            } else if (header.includes('Краткое опсание (VI)')) {
              product.short_description_vi = cleanValue;
            } else if (header.includes('Описание (RU)')) {
              product.description = cleanValue;
            } else if (header.includes('Описание (EN)')) {
              product.description_en = cleanValue;
            } else if (header.includes('Описание (ZH)')) {
              product.description_zh = cleanValue;
            } else if (header.includes('Описание (VI)')) {
              product.description_vi = cleanValue;
            } else if (header.includes('Изображение')) {
              // Ensure image URL is properly saved
              const imageUrl = cleanValue;
              if (i === 1) {
                console.log(`🖼️ Image field for first row:`, {
                  raw: value,
                  cleaned: imageUrl,
                  length: imageUrl.length,
                  has_value: imageUrl !== ''
                });
              }
              if (imageUrl && imageUrl !== '') {
                product.image = imageUrl;
                console.log(`🖼️ Image found for row ${i}: ${imageUrl.substring(0, 80)}...`);
              } else {
                console.log(`⚠️ No image for row ${i}, product name: "${product.name}"`);
              }
            } else if (header.includes('В наличии') || header.includes('наличии')) {
              // Parse multiple formats for "in stock"
              const normalized = cleanValue.toLowerCase().trim();
              const isInStock = normalized === 'да' || 
                               normalized === 'д' || 
                               normalized === 'yes' || 
                               normalized === 'y' || 
                               normalized === 'true' || 
                               normalized === '1' || 
                               normalized === 'в наличии' || 
                               normalized === 'в';
              const isOutOfStock = normalized === 'нет' || 
                                  normalized === 'н' || 
                                  normalized === 'no' || 
                                  normalized === 'n' || 
                                  normalized === 'false' || 
                                  normalized === '0' || 
                                  normalized === 'нет в наличии';
              
              if (isOutOfStock) {
                product.in_stock = false;
                console.log(`❌ Row ${i} marked as OUT OF STOCK: "${cleanValue}"`);
              } else if (isInStock) {
                product.in_stock = true;
                console.log(`✅ Row ${i} marked as IN STOCK: "${cleanValue}"`);
              } else {
                // Default to true if unclear
                product.in_stock = true;
                console.log(`⚠️ Row ${i} unclear stock value "${cleanValue}", defaulting to IN STOCK`);
              }
            } else if (header.includes('Пробник')) {
              const normalized = cleanValue.toLowerCase().trim();
              product.is_sample = normalized === 'да' || 
                                 normalized === 'д' || 
                                 normalized === 'yes' || 
                                 normalized === 'true' || 
                                 normalized === '1';
            } else if (header.includes('Позиция в популярных')) {
              const numValue = cleanValue.replace(/[^\d.,]/g, '').replace(',', '.');
              product.popular_order = parseFloat(numValue) || 0;
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
          
          // Log product data for first product in detail
          if (products.length === 0) {
            console.log(`✅ First valid product FULL DATA:`, {
              name: product.name,
              price: product.price,
              weight: product.weight,
              category: product.category,
              disease: product.disease,
              disease_categories: product.disease_categories,
              store: product.store,
              image: product.image,
              image_length: product.image?.length,
              in_stock: product.in_stock,
              short_description_length: product.short_description?.length,
              short_description_preview: product.short_description?.substring(0, 150),
              description_length: product.description?.length,
              description_preview: product.description?.substring(0, 150),
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
        
        // Check Supabase connection and get ALL existing products (no limit)
        const { data: existingProducts, error: fetchError, count } = await supabase
          .from('products')
          .select('id, name', { count: 'exact' });
          
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
        
        console.log('✅ Supabase connection OK.');
        console.log('📊 Total products in database (from count):', count);
        console.log('📊 Products fetched from database:', existingProducts?.length || 0);
        
        // Create a map of existing products by name (storing ALL IDs for duplicates)
        const existingProductsMap = new Map<string, string[]>();
        let productsWithoutName = 0;
        let totalDuplicates = 0;
        
        (existingProducts || []).forEach(p => {
          if (p.name && p.name.trim() !== '') {
            const nameKey = p.name.trim().toLowerCase();
            const existingIds = existingProductsMap.get(nameKey) || [];
            if (existingIds.length > 0) {
              totalDuplicates++;
              console.warn(`⚠️ Duplicate product name in DB: "${p.name}" (ID: ${p.id})`);
            }
            existingIds.push(p.id);
            existingProductsMap.set(nameKey, existingIds);
          } else {
            productsWithoutName++;
            console.warn(`⚠️ Product without name in DB (ID: ${p.id})`);
          }
        });
        
        const uniqueProductCount = existingProductsMap.size;
        const productsWithDuplicates = Array.from(existingProductsMap.entries())
          .filter(([_, ids]) => ids.length > 1)
          .length;
        
        console.log('📋 Products in database with valid names:', uniqueProductCount);
        console.log('📋 Products without names:', productsWithoutName);
        console.log('📋 Total duplicate entries:', totalDuplicates);
        console.log('📋 Products with duplicates:', productsWithDuplicates);
        console.log('📋 Database product names (first 10):', 
          Array.from(existingProductsMap.keys()).slice(0, 10)
        );
        console.log('📋 Products in CSV to process:', products.length);
        console.log('📋 CSV product names (first 10):', 
          products.slice(0, 10).map(p => p.name.trim().toLowerCase())
        );
        
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
          if (p.image && p.image.trim() !== '') {
            cleaned.image = p.image.trim();
            console.log(`💾 Saving image for "${p.name}": ${p.image.substring(0, 50)}...`);
          } else {
            console.log(`⚠️ No image for "${p.name}"`);
          }
          
          const productNameKey = p.name.trim().toLowerCase();
          const existingProductIds = existingProductsMap.get(productNameKey);
          
          // CRITICAL DEBUG: Log matching process
          if (products.indexOf(p) < 3) {
            console.log(`🔍 DEBUG Product ${products.indexOf(p) + 1}: "${p.name}"`);
            console.log(`  - Name key: "${productNameKey}"`);
            console.log(`  - Found in DB: ${existingProductIds ? 'YES' : 'NO'}`);
            console.log(`  - IDs count: ${existingProductIds?.length || 0}`);
            if (existingProductIds) {
              console.log(`  - IDs:`, existingProductIds);
            }
          }
          
          // Log what we're about to save for first product
          if (products.indexOf(p) === 0) {
            console.log('💾 First product data being saved:', {
              name: cleaned.name,
              image: cleaned.image,
              short_description_length: cleaned.short_description?.length,
              description_length: cleaned.description?.length,
              short_description_preview: cleaned.short_description?.substring(0, 100),
              description_preview: cleaned.description?.substring(0, 100)
            });
          }
          
          if (existingProductIds && existingProductIds.length > 0) {
            // Update FIRST product, keep duplicates for deletion
            const firstId = existingProductIds[0];
            
            console.log(`🔄 Updating product "${p.name}" (ID: ${firstId})`);
            console.log(`   - Total IDs for this name: ${existingProductIds.length}`);
            
            const { error: updateError } = await supabase
              .from('products')
              .update(cleaned)
              .eq('id', firstId);
            
            // Remove ONLY the first ID from the array
            const remainingDuplicates = existingProductIds.slice(1);
            
            console.log(`   - Remaining duplicates after update: ${remainingDuplicates.length}`);
            
            // If there are remaining duplicates, keep them in the map for deletion
            if (remainingDuplicates.length > 0) {
              existingProductsMap.set(productNameKey, remainingDuplicates);
              console.log(`🗑️ Kept ${remainingDuplicates.length} duplicate(s) for deletion: "${p.name}"`);
              console.log(`   - Duplicate IDs:`, remainingDuplicates);
            } else {
              // No duplicates, remove from map completely
              existingProductsMap.delete(productNameKey);
              console.log(`✓ No duplicates, removed from map: "${p.name}"`);
            }
              
            if (updateError) {
              console.error(`❌ Error updating "${p.name}":`, updateError);
              updateErrors.push(`Ошибка обновления "${p.name}": ${updateError.message}`);
            } else {
              console.log(`✅ Updated: ${p.name}`);
              updated++;
              
              // Log duplicate info
              if (remainingDuplicates.length > 0) {
                console.log(`🗑️ Found ${remainingDuplicates.length} duplicate(s) for "${p.name}" that will be deleted`);
              }
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
        
        console.log('📊 After processing CSV:');
        console.log('  - Products remaining in map (to delete):', existingProductsMap.size);
        console.log('  - Product names remaining:', Array.from(existingProductsMap.keys()));
        
        // Delete products that are not in CSV (remaining in map)
        const productsToDelete = Array.from(existingProductsMap.values()).flat();
        if (productsToDelete.length > 0) {
          console.log(`🗑 Deleting ${productsToDelete.length} products not in CSV`);
          console.log(`🗑️ Product IDs to delete:`, productsToDelete);
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
        
        // Build success message using translations
        const syncMessageKey = skipped > 0 ? 'csvSyncMessageSkipped' : 'csvSyncMessage';
        const syncMessage = t(syncMessageKey)
          .replace('{updated}', updated.toString())
          .replace('{created}', inserted.toString())
          .replace('{deleted}', deleted.toString())
          .replace('{skipped}', skipped.toString());
        
        const successMsg = `${t('csvSyncComplete')}: ${syncMessage}`;
        
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
        
        // Show modal with results
        setShowResultModal(true);
        
        if (updateErrors.length === 0) {
          toast.success(successMsg);
          // User will reload manually via modal button
        } else {
          toast.error(t('csvSyncCompleteWithErrors'));
        }
      } else {
        console.log('❌ No valid products. Total lines:', lines.length - 1, 'Skipped:', skipped);
        setUploadResult({
          success: false,
          message: 'Нет валидных товаров для импорта',
          details: { errors, skipped, totalRows: lines.length - 1 },
        });
        // Show modal with errors
        setShowResultModal(true);
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
        <h3 className="text-white flex items-center gap-2">
          <FileText size={24} />
          {t('catalogCSV')}
        </h3>
        <p className="text-white text-sm mt-2">
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

      {/* Result Modal */}
      {showResultModal && uploadResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className={`p-6 border-b ${uploadResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {uploadResult.success ? (
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="text-green-600" size={24} />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="text-red-600" size={24} />
                    </div>
                  )}
                  <div>
                    <h3 className={`text-xl ${uploadResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {uploadResult.success ? t('csvImportSuccess') : t('csvImportErrors')}
                    </h3>
                    <p className={`text-sm mt-1 ${uploadResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      {uploadResult.message}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowResultModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {uploadResult.details && (
                <div className="space-y-4">
                  {/* Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadResult.details.created > 0 && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-2xl text-green-600">
                          {uploadResult.details.created}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{t('csvCreated')}</div>
                      </div>
                    )}
                    {uploadResult.details.updated !== undefined && uploadResult.details.updated > 0 && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-2xl text-blue-600">
                          {uploadResult.details.updated}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{t('csvUpdated')}</div>
                      </div>
                    )}
                    {uploadResult.details.deleted !== undefined && uploadResult.details.deleted > 0 && (
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="text-2xl text-orange-600">
                          {uploadResult.details.deleted}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{t('csvDeleted')}</div>
                      </div>
                    )}
                    {uploadResult.details.skipped > 0 && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-2xl text-red-600">
                          {uploadResult.details.skipped}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{t('skipped')}</div>
                      </div>
                    )}
                  </div>

                  {/* Errors List */}
                  {uploadResult.details.errors && uploadResult.details.errors.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="text-red-600" size={20} />
                        <h4 className="text-gray-800">
                          {t('csvValidationErrors')} ({uploadResult.details.errors.length})
                        </h4>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <ul className="space-y-2">
                          {uploadResult.details.errors.map((error: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-red-600 flex-shrink-0 mt-0.5">•</span>
                              <span className="text-red-800">{error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Database Error */}
                  {uploadResult.details.dbError && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="text-red-600 font-semibold mb-2">{t('csvDbError')}:</h4>
                      <p className="text-sm text-red-700">{uploadResult.details.dbError.message}</p>
                      {uploadResult.details.dbError.details && (
                        <p className="text-xs text-red-600 mt-2">{uploadResult.details.dbError.details}</p>
                      )}
                      {uploadResult.details.dbError.hint && (
                        <p className="text-xs text-red-600 mt-2">
                          💡 {uploadResult.details.dbError.hint}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowResultModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                {t('close')}
              </button>
              {uploadResult.success && (
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {t('reload')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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