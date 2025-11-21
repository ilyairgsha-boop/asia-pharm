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
    const cacheData: CacheData = {
      products,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    
    console.log(`✅ Cached ${products.length} products (memory + session)`);
  } catch (error) {
    console.error('Error caching products:', error);
  }
}

/**
 * Получить товары из кэша
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
