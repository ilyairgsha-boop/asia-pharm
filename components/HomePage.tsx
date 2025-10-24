import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ProductSlideshow } from './ProductSlideshow';
import { ProductList } from './ProductList';
import { Product } from '../contexts/CartContext';
import { fetchProducts } from '../utils/supabase/database';
import { getMockProducts } from '../utils/mockData';

interface HomePageProps {
  selectedCategory: string | null;
  selectedDisease: string | null;
  currentStore: 'china' | 'thailand' | 'vietnam';
  onProductClick?: (product: Product) => void;
}

export const HomePage = ({ selectedCategory, selectedDisease, currentStore, onProductClick }: HomePageProps) => {
  const { t } = useLanguage();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const result = await fetchProducts();
      
      if (result.success && result.products.length > 0) {
        setAllProducts(result.products);
        console.log('✅ Products loaded from database');
      } else {
        console.warn('⚠️ No products in database, using mock data for local development');
        setAllProducts(getMockProducts());
      }
    } catch (error) {
      console.warn('⚠️ Database error, using mock data for local development');
      setAllProducts(getMockProducts());
    } finally {
      setLoading(false);
    }
  };

  // Filter products by current store
  const storeProducts = allProducts.filter(p => p.store === currentStore);
  
  // Get popular products (for demo, just take random products from current store)
  const popularProducts = storeProducts.slice(0, 8);
  
  // Get new arrivals (for demo, take last products from current store)
  const newArrivals = storeProducts.slice(-8);
  
  // Get third slideshow - featured products (middle section)
  const featuredProducts = storeProducts.slice(8, 16);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white text-3xl animate-pulse">
          中
        </div>
      </div>
    );
  }

  // Show "no products" message if no products in current store
  if (!loading && storeProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">{t('noProductsFound')}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Show slideshows only when no filters are active */}
      {!selectedCategory && !selectedDisease ? (
        <>
          {popularProducts.length > 0 && (
            <ProductSlideshow
              title={t('popularProducts')}
              products={popularProducts}
              onProductClick={onProductClick}
            />
          )}
          
          {featuredProducts.length > 0 && (
            <ProductSlideshow
              title={t('allProducts')}
              products={featuredProducts}
              onProductClick={onProductClick}
            />
          )}
          
          {newArrivals.length > 0 && (
            <ProductSlideshow
              title={t('newArrivals')}
              products={newArrivals}
              onProductClick={onProductClick}
            />
          )}
        </>
      ) : (
        /* Regular product list when filters are active */
        <ProductList
          selectedCategory={selectedCategory}
          selectedDisease={selectedDisease}
          currentStore={currentStore}
          onProductClick={onProductClick}
        />
      )}
    </div>
  );
};
