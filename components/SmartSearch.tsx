import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Search, X } from 'lucide-react';
import { createClient } from '../utils/supabase/client';
import { getMockProducts } from '../utils/mockData';

interface Product {
  id: string;
  name: string;
  name_en?: string;
  name_zh?: string;
  name_vi?: string;
  description: string;
  description_en?: string;
  description_zh?: string;
  description_vi?: string;
  category: string;
  disease: string;
  price: number;
  image: string;
}

interface SmartSearchProps {
  onProductClick: (product: Product) => void;
}

export const SmartSearch = ({ onProductClick }: SmartSearchProps) => {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, language]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      let data: any[] = [];
      let error = null;

      // Try to fetch from Supabase first
      try {
        const supabase = createClient();
        const response = await supabase
          .from('products')
          .select('*')
          .or(`name.ilike.%${searchQuery}%,name_en.ilike.%${searchQuery}%,name_zh.ilike.%${searchQuery}%,name_vi.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,description_en.ilike.%${searchQuery}%,description_zh.ilike.%${searchQuery}%,description_vi.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%,disease.ilike.%${searchQuery}%`)
          .limit(10);
        
        data = response.data || [];
        error = response.error;
      } catch (e) {
        // If Supabase fails, use mock data
        console.warn('⚠️ Server not available, using mock data for search');
        data = getMockProducts();
      }

      if (!error && data) {
        // Smart ranking algorithm
        const ranked = data.map(product => {
          const searchLower = searchQuery.toLowerCase();
          let score = 0;

          // Get appropriate field names based on language
          const nameField = language === 'en' ? 'name_en' :
            language === 'zh' ? 'name_zh' :
              language === 'vi' ? 'name_vi' : 'name';

          const descField = language === 'en' ? 'description_en' :
            language === 'zh' ? 'description_zh' :
              language === 'vi' ? 'description_vi' : 'description';

          const name = product[nameField] || product.name || '';
          const desc = product[descField] || product.description || '';

          // Exact match in name = highest priority
          if (name.toLowerCase() === searchLower) score += 100;
          // Starts with query in name
          else if (name.toLowerCase().startsWith(searchLower)) score += 50;
          // Contains query in name
          else if (name.toLowerCase().includes(searchLower)) score += 25;

          // Match in description
          if (desc.toLowerCase().includes(searchLower)) score += 10;

          // Match in category or disease
          if (product.category?.toLowerCase().includes(searchLower)) score += 15;
          if (product.disease?.toLowerCase().includes(searchLower)) score += 15;

          return { ...product, searchScore: score };
        });

        // Sort by score and filter out 0 scores
        const sorted = ranked
          .filter(p => p.searchScore > 0)
          .sort((a, b) => b.searchScore - a.searchScore);

        setResults(sorted);
      }
    } catch (error) {
      console.warn('⚠️ Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    onProductClick(product);
    setIsOpen(false);
    setQuery('');
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };

  const getProductName = (product: Product) => {
    if (language === 'en') return product.name_en || product.name;
    if (language === 'zh') return product.name_zh || product.name;
    if (language === 'vi') return product.name_vi || product.name;
    return product.name;
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={t('searchPlaceholder')}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              {t('searching')}...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
                >
                  <img
                    src={product.image}
                    alt={getProductName(product)}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-800 truncate">{getProductName(product)}</div>
                    <div className="text-sm text-gray-500">
                      {t(product.category)} • {t(product.disease)}
                    </div>
                  </div>
                  <div className="text-red-600">
                    {product.price.toLocaleString()} ₽
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              {t('noResults')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
