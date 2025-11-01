import { useState, useEffect } from 'react';
import { ProductCard } from './ProductCard';
import { Product } from '../contexts/CartContext';
import { fetchProducts } from '../utils/supabase/database';
import { useLanguage } from '../contexts/LanguageContext';
import { Loader2 } from 'lucide-react';
import { getMockProducts } from '../utils/mockData';
import { MOCK_MODE } from '../utils/mockMode';

interface ProductListProps {
  selectedCategory: string | null;
  selectedDisease: string | null;
  currentStore: 'china' | 'thailand' | 'vietnam';
  onProductClick?: (product: Product) => void;
}

export const ProductList = ({ selectedCategory, selectedDisease, currentStore, onProductClick }: ProductListProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (MOCK_MODE) {
        console.log('🔧 MOCK MODE: Using local demo data');
        setProducts(getMockProducts());
        setLoading(false);
        return;
      }

      const result = await fetchProducts();
      
      if (result.success && result.products.length > 0) {
        console.log(`✅ Successfully loaded ${result.products.length} products from database`);
        setProducts(result.products);
      } else {
        console.warn('⚠️ No products in database, using mock data for local development');
        console.warn('Database result:', result);
        setProducts(getMockProducts());
        setError('Using demo data - database connection issue');
      }
    } catch (error: any) {
      console.error('⚠️ Database error, using mock data for local development:', error);
      setProducts(getMockProducts());
      setError('Using demo data - database connection issue');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    // Filter by store (товар принадлежит только одному магазину)
    if (product.store !== currentStore) {
      return false;
    }
    
    // Filter by category - только одна категория товара (ointments, patches и т.д.)
    if (selectedCategory && product.category !== selectedCategory) {
      return false;
    }
    
    // Filter by disease - поддержка множественных категорий заболеваний (включая 'popular')
    if (selectedDisease) {
      const productDiseases = product.diseaseCategories || [product.disease];
      if (!productDiseases.includes(selectedDisease)) {
        return false;
      }
    }
    return true;
  });

  // Debug logging for popular products
  useEffect(() => {
    if (selectedDisease === 'popular') {
      console.log('🔍 Filtering for popular products');
      console.log('📊 Total products:', products.length);
      console.log('🏪 Current store:', currentStore);
      console.log('✅ Filtered products:', filteredProducts.length);
      console.log('📦 Sample products with "popular":', 
        products.filter(p => {
          const diseases = p.diseaseCategories || [p.disease];
          return diseases.includes('popular') && p.store === currentStore;
        }).map(p => ({ name: p.name, diseases: p.diseaseCategories, store: p.store }))
      );
    }
  }, [selectedDisease, filteredProducts.length, products.length, currentStore]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-red-600" size={48} />
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">{t('noProductsFound')}</p>
        {error && (
          <p className="text-yellow-600 text-sm mt-2">
            ℹ️ {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            ℹ️ {error}
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
        {filteredProducts.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onProductClick={onProductClick}
          />
        ))}
      </div>
    </div>
  );
};
