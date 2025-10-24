import { ShoppingCart, Heart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart, Product } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useState, useEffect } from 'react';

interface ProductCardProps {
  product: Product;
  onProductClick?: (product: Product) => void;
}

export const ProductCard = ({ product, onProductClick }: ProductCardProps) => {
  const { language, t } = useLanguage();
  const { addToCart } = useCart();
  const { user } = useAuth();
  
  const isWholesaler = user?.isWholesaler || false;
  const wholesalePrice = (product as any).wholesalePrice;
  
  // Favorites state (stored in localStorage)
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (user) {
      const favorites = getFavorites();
      setIsFavorite(favorites.includes(product.id));
    }
  }, [user, product.id]);

  const getFavorites = (): string[] => {
    if (!user) return [];
    const saved = localStorage.getItem(`favorites_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  };

  const saveFavorites = (favorites: string[]) => {
    if (user) {
      localStorage.setItem(`favorites_${user.id}`, JSON.stringify(favorites));
    }
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      alert(t('pleaseLogin'));
      return;
    }

    const favorites = getFavorites();
    let newFavorites: string[];
    
    if (isFavorite) {
      newFavorites = favorites.filter(id => id !== product.id);
      setIsFavorite(false);
      // Optional: Show notification
      // alert(t('removedFromFavorites'));
    } else {
      newFavorites = [...favorites, product.id];
      setIsFavorite(true);
      // Optional: Show notification
      // alert(t('addedToFavorites'));
    }
    
    saveFavorites(newFavorites);
  };

  const getName = () => {
    switch (language) {
      case 'zh':
        return product.name_zh;
      case 'en':
        return product.name_en;
      case 'vi':
        return product.name_vi;
      default:
        return product.name;
    }
  };

  const getDescription = () => {
    switch (language) {
      case 'zh':
        return product.description_zh;
      case 'en':
        return product.description_en;
      case 'vi':
        return product.description_vi;
      default:
        return product.description;
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, product.store);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow border border-gray-200 cursor-pointer relative"
      onClick={() => onProductClick?.(product)}
    >
      <div className="relative h-48 bg-gray-100 product-image-container">
        <ImageWithFallback
          src={product.image}
          alt={getName()}
          className="w-full h-full object-cover product-image"
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
        />
        
        {/* Badges container */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
          {!product.inStock && (
            <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm">
              {t('outOfStock')}
            </div>
          )}
          
          {product.isSample && (
            <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
              {t('productIsSample')}
            </div>
          )}
        </div>
        
        {/* Favorite button */}
        <button
          onClick={toggleFavorite}
          className="absolute top-2 left-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all z-10"
          title={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
        >
          <Heart
            size={20}
            className={`transition-colors ${
              isFavorite 
                ? 'fill-red-600 text-red-600' 
                : 'text-gray-400 hover:text-red-600'
            }`}
          />
        </button>
      </div>

      <div className="p-4">
        <h3 className="text-gray-800 mb-2 line-clamp-2 min-h-[3rem]">{getName()}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 min-h-[2.5rem]">
          {getDescription()}
        </p>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-red-600">
              {product.price.toFixed(0)} ₽
            </div>
            {isWholesaler && wholesalePrice && (
              <div className="text-sm text-green-600 mt-1">
                {t('wholesalePrice')}: ¥{wholesalePrice.toFixed(2)}
              </div>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              product.inStock
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShoppingCart size={18} />
            <span>{t('addToCart')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
