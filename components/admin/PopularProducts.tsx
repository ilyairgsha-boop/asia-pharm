import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { createClient } from '../../utils/supabase/client';
import { Star, GripVertical, ChevronUp, ChevronDown, X, Plus, Loader2, Eye, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  weight: number;
  store: string;
  popular_order: number | null;
}

type Store = 'china' | 'thailand' | 'vietnam';

export const PopularProducts = () => {
  const { t } = useLanguage();
  const [currentStore, setCurrentStore] = useState<Store>('china');
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [currentStore]);

  const loadProducts = async () => {
    setLoading(true);
    setHasChanges(false);
    try {
      const supabase = createClient();
      
      // Load popular products for current store
      const { data: popular, error: popularError } = await supabase
        .from('products')
        .select('id, name, image, price, weight, store, popular_order')
        .eq('store', currentStore)
        .not('popular_order', 'is', null)
        .order('popular_order', { ascending: true });

      if (popularError) {
        console.error('Error loading popular products:', popularError);
        toast.error(t('errorLoadingProducts'));
        return;
      }

      // Load all products for search
      const { data: all, error: allError } = await supabase
        .from('products')
        .select('id, name, image, price, weight, store, popular_order')
        .eq('store', currentStore)
        .order('name', { ascending: true });

      if (allError) {
        console.error('Error loading all products:', allError);
        toast.error(t('errorLoadingProducts'));
        return;
      }

      setPopularProducts(popular || []);
      setAllProducts(all || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('errorLoadingProducts'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      
      // Update popular_order for all popular products
      const updates = popularProducts.map((product, index) => ({
        id: product.id,
        popular_order: index + 1,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('products')
          .update({ popular_order: update.popular_order })
          .eq('id', update.id);

        if (error) {
          console.error('Error updating product:', error);
          throw error;
        }
      }

      toast.success(t('popularOrderSaved'));
      setHasChanges(false);
      await loadProducts();
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error(t('errorSavingOrder'));
    } finally {
      setSaving(false);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newProducts = [...popularProducts];
    [newProducts[index - 1], newProducts[index]] = [newProducts[index], newProducts[index - 1]];
    setPopularProducts(newProducts);
    setHasChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index === popularProducts.length - 1) return;
    const newProducts = [...popularProducts];
    [newProducts[index], newProducts[index + 1]] = [newProducts[index + 1], newProducts[index]];
    setPopularProducts(newProducts);
    setHasChanges(true);
  };

  const handleMoveToPosition = (fromIndex: number, toPosition: number) => {
    if (toPosition < 1 || toPosition > popularProducts.length) return;
    const toIndex = toPosition - 1;
    if (fromIndex === toIndex) return;

    const newProducts = [...popularProducts];
    const [movedProduct] = newProducts.splice(fromIndex, 1);
    newProducts.splice(toIndex, 0, movedProduct);
    setPopularProducts(newProducts);
    setHasChanges(true);
  };

  const handleRemoveFromPopular = async (productId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('products')
        .update({ popular_order: null })
        .eq('id', productId);

      if (error) throw error;

      toast.success(t('removedFromPopular'));
      await loadProducts();
      setHasChanges(false);
    } catch (error) {
      console.error('Error removing from popular:', error);
      toast.error(t('errorRemovingFromPopular'));
    }
  };

  const handleAddToPopular = async (productId: string) => {
    try {
      const supabase = createClient();
      
      // Find max popular_order
      const maxOrder = popularProducts.length > 0 
        ? Math.max(...popularProducts.map(p => p.popular_order || 0))
        : 0;

      const { error } = await supabase
        .from('products')
        .update({ popular_order: maxOrder + 1 })
        .eq('id', productId);

      if (error) throw error;

      toast.success(t('addedToPopular'));
      setSearchQuery('');
      setShowSearch(false);
      await loadProducts();
    } catch (error) {
      console.error('Error adding to popular:', error);
      toast.error(t('errorAddingToPopular'));
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newProducts = [...popularProducts];
    const draggedProduct = newProducts[draggedIndex];
    newProducts.splice(draggedIndex, 1);
    newProducts.splice(index, 0, draggedProduct);

    setPopularProducts(newProducts);
    setDraggedIndex(index);
    setHasChanges(true);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Filter products for search
  const availableProducts = allProducts.filter(
    (product) =>
      product.popular_order === null &&
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStoreIcon = (store: Store) => {
    const icons = {
      china: '🇨🇳',
      thailand: '🇹🇭',
      vietnam: '🇻🇳',
    };
    return icons[store];
  };

  const getStoreName = (store: Store) => {
    const names = {
      china: t('storeChina'),
      thailand: t('storeThailand'),
      vietnam: t('storeVietnam'),
    };
    return names[store];
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-white flex items-center gap-2">
          <Star size={24} />
          {t('popularProducts')}
        </h3>
        <p className="text-white text-sm mt-2">
          {t('popularProductsDescription')}
        </p>
      </div>

      {/* Store Tabs */}
      <div className="flex gap-2 mb-6">
        {(['china', 'thailand', 'vietnam'] as Store[]).map((store) => (
          <button
            key={store}
            onClick={() => setCurrentStore(store)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              currentStore === store
                ? 'bg-white text-gray-800 shadow-lg'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <span className="text-xl">{getStoreIcon(store)}</span>
            <span>{getStoreName(store)}</span>
            <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-800 text-xs">
              {popularProducts.filter(p => p.store === store).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 bg-white rounded-lg">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Add Product Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-gray-800">
                {t('addToPopular')}
              </h4>
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                {t('addProduct')}
              </button>
            </div>

            {showSearch && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchProducts')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  autoFocus
                />

                {searchQuery && (
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                    {availableProducts.length > 0 ? (
                      availableProducts.slice(0, 10).map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleAddToPopular(product.id)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                        >
                          <img
                            src={product.image || '/placeholder.png'}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 text-left">
                            <p className="text-sm text-gray-800">{product.name}</p>
                            <p className="text-xs text-gray-500">
                              {product.price} ₽ • {product.weight} {t('kg')}
                            </p>
                          </div>
                          <Plus size={18} className="text-blue-600" />
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        {t('noProductsFound')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Popular Products List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-gray-800">
                {t('popularProductsList')} ({popularProducts.length})
              </h4>
              {hasChanges && (
                <button
                  onClick={handleSaveOrder}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      {t('saving')}
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {t('saveOrder')}
                    </>
                  )}
                </button>
              )}
            </div>

            {popularProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Star size={48} className="mx-auto mb-4 opacity-20" />
                <p>{t('noPopularProducts')}</p>
                <p className="text-sm mt-2">{t('addFirstPopularProduct')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {popularProducts.map((product, index) => (
                  <div
                    key={product.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-4 border rounded-lg transition-all ${
                      draggedIndex === index
                        ? 'opacity-50 border-blue-400 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Drag Handle */}
                    <div className="cursor-move text-gray-400 hover:text-gray-600">
                      <GripVertical size={20} />
                    </div>

                    {/* Position Number */}
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                      {index + 1}
                    </div>

                    {/* Product Image */}
                    <img
                      src={product.image || '/placeholder.png'}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                    />

                    {/* Product Info */}
                    <div className="flex-1">
                      <p className="text-gray-800">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        {product.price} ₽ • {product.weight} {t('kg')}
                      </p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                      {/* Move Up */}
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title={t('moveUp')}
                      >
                        <ChevronUp size={18} />
                      </button>

                      {/* Move Down */}
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === popularProducts.length - 1}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title={t('moveDown')}
                      >
                        <ChevronDown size={18} />
                      </button>

                      {/* Position Selector */}
                      <select
                        value={index + 1}
                        onChange={(e) => handleMoveToPosition(index, parseInt(e.target.value))}
                        className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                        title={t('changePosition')}
                      >
                        {popularProducts.map((_, i) => (
                          <option key={i} value={i + 1}>
                            #{i + 1}
                          </option>
                        ))}
                      </select>

                      {/* Remove */}
                      <button
                        onClick={() => handleRemoveFromPopular(product.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title={t('removeFromPopular')}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Button (Bottom) */}
          {hasChanges && popularProducts.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleSaveOrder}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 shadow-lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {t('saveOrder')}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-gray-800 mb-3">💡 {t('popularProductsTips')}</h4>
            <div className="text-sm text-gray-700 space-y-2">
              <p>• {t('popularTip1')}</p>
              <p>• {t('popularTip2')}</p>
              <p>• {t('popularTip3')}</p>
              <p>• {t('popularTip4')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
