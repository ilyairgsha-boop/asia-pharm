/**
 * Product Cache Utility
 * Кэширует товары в памяти и sessionStorage для быстрой загрузки
 */

import { Product } from '../contexts/CartContext';

const CACHE_KEY = 'asia_pharm_products_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

interface CacheData {
  products: Product[];
  timestamp: number;
  version: string;
}

const CACHE_VERSION = '1.0';

// In-memory cache для мгновенного доступа
let memoryCache: Product[] | null = null;
let memoryCacheTimestamp = 0;

/**
 * Сохранить товары в кэш
 */
export function setCachedProducts(products: Product[]): void {
  try {
    // Сохраняем в память
    memoryCache = products;
    memoryCacheTimestamp = Date.now();

    // Сохраняем в sessionStorage (только для текущей вкладки)
    // ✅ ОПТИМИЗАЦИЯ: Сохраняем только нужные поля для уменьшения размера
    const lightweightProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      store: p.store,
      category_id: p.category_id,
      price: p.price,
      wholesale_price: p.wholesale_price,
      currency: p.currency,
      image_url: p.image_url,
      short_description: p.short_description,
      in_stock: p.in_stock,
    }));
    
    const cacheData: CacheData = {
      products: lightweightProducts as Product[],
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log(`✅ Cached ${products.length} products (memory + session)`);
    } catch (storageError) {
      // Если sessionStorage переполнен, очищаем его и пробуем снова
      if (storageError instanceof DOMException && storageError.name === 'QuotaExceededError') {
        console.warn('⚠️ sessionStorage quota exceeded, clearing old data...');
        sessionStorage.clear();
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
          console.log(`✅ Cached ${products.length} products after clearing storage`);
        } catch (retryError) {
          console.error('❌ Failed to cache even after clearing:', retryError);
          // В памяти все равно сохранили, так что продолжаем работу
        }
      } else {
        throw storageError;
      }
    }
  } catch (error) {
    console.error('Error caching products:', error);
    // Даже если sessionStorage не работает, in-memory кэш все равно работает
  }
}

/**
 * Получить товары из кэ��а
 */
export function getCachedProducts(): Product[] | null {
  // Сначала проверяем memory cache (мгновенно)
  if (memoryCache && Date.now() - memoryCacheTimestamp < CACHE_DURATION) {
    console.log(`⚡ Using in-memory cache (${memoryCache.length} products)`);
    return memoryCache;
  }

  // Затем проверяем sessionStorage
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const cacheData: CacheData = JSON.parse(cached);
    
    // Проверяем версию кэша
    if (cacheData.version !== CACHE_VERSION) {
      console.log('⚠️ Cache version mismatch, clearing...');
      clearProductCache();
      return null;
    }

    // Проверяем не устарел ли кэш
    const age = Date.now() - cacheData.timestamp;
    if (age > CACHE_DURATION) {
      console.log(`⏰ Cache expired (${Math.round(age / 1000)}s old)`);
      clearProductCache();
      return null;
    }

    // Восстанавливаем memory cache
    memoryCache = cacheData.products;
    memoryCacheTimestamp = cacheData.timestamp;

    console.log(`✅ Using session cache (${cacheData.products.length} products, ${Math.round(age / 1000)}s old)`);
    return cacheData.products;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

/**
 * Очистить кэш товаров
 */
export function clearProductCache(): void {
  memoryCache = null;
  memoryCacheTimestamp = 0;
  try {
    sessionStorage.removeItem(CACHE_KEY);
    console.log('🗑️ Product cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Проверить актуальность кэша
 */
export function isCacheValid(): boolean {
  if (memoryCache && Date.now() - memoryCacheTimestamp < CACHE_DURATION) {
    return true;
  }

  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return false;

    const cacheData: CacheData = JSON.parse(cached);
    return (
      cacheData.version === CACHE_VERSION &&
      Date.now() - cacheData.timestamp < CACHE_DURATION
    );
  } catch {
    return false;
  }
}

/**
 * Получить товары для конкретного магазина из кэша
 */
export function getCachedProductsByStore(store: 'china' | 'thailand' | 'vietnam'): Product[] | null {
  const allProducts = getCachedProducts();
  if (!allProducts) return null;
  
  return allProducts.filter(p => p.store === store);
}