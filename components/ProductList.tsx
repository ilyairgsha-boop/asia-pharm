import { useState, useEffect } from 'react';
import { ProductCard } from './ProductCard';
import { Product } from '../contexts/CartContext';
import { fetchProducts } from '../utils/supabase/database';
import { useLanguage } from '../contexts/LanguageContext';
import { Loader2 } from 'lucide-react';
import { getMockProducts } from '../utils/mockData';

interface ProductListProps {
  selectedCategory: string | null;
  selectedDisease: string | null;
  currentStore: 'china' | 'thailand' | 'vietnam';
  onProductClick?: (product: Product) => void;
}

export const ProductList = ({ selectedCategory, selectedDisease, currentStore, onProductClick }: ProductListProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const result = await fetchProducts();
      
      if (result.success && result.products.length > 0) {
        setProducts(result.products);
      } else {
        console.warn('⚠️ No products in database, using mock data for local development');
        setProducts(getMockProducts());
      }
    } catch (error) {
      console.warn('⚠️ Database error, using mock data for local development');
      setProducts(getMockProducts());
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    // Filter by store
    if (product.store !== currentStore) {
      return false;
    }
    if (selectedCategory && product.category !== selectedCategory) {
      return false;
    }
    if (selectedDisease && product.disease !== selectedDisease) {
      return false;
    }
    return true;
  });

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
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredProducts.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          onProductClick={onProductClick}
        />
      ))}
    </div>
  );
};
