import { ShoppingCart, Heart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart, Product } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useState, useEffect, useRef } from 'react';
import { FlyingNumber } from './FlyingNumber';

interface ProductCardProps {
  product: Product;
  onProductClick?: (product: Product) => void;
}

export const ProductCard = ({ product, onProductClick }: ProductCardProps) => {
  const { language, t } = useLanguage();
  const { addToCart } = useCart();
  const { user } = useAuth();
  
  const isWholesaler = user?.isWholesaler || false;
  const wholesalePrice = (product as any).wholesalePrice; // Keep as any for backwards compatibility
  
  // Favorites state (stored in localStorage)
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Animation state
  const [flyingNumbers, setFlyingNumbers] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // Sale status
  const [isSaleActive, setIsSaleActive] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Check if sale is active
  useEffect(() => {
    const saleEnabled = product.saleEnabled;
    const saleEndDate = product.saleEndDate;

    if (!saleEnabled || !saleEndDate) {
      setIsSaleActive(false);
      return;
    }

    const now = new Date().getTime();
    const end = new Date(saleEndDate).getTime();

    if (end > now) {
      setIsSaleActive(true);
    } else {
      setIsSaleActive(false);
    }
  }, [product]);

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
    
    // Only trigger animation on desktop
    if (isDesktop && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const id = Date.now();
      setFlyingNumbers(prev => [...prev, {
        id,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      }]);
    }
  };

  // Calculate discounted price
  const saleDiscount = product.saleDiscount || 0;
  const originalPrice = product.price;
  const discountedPrice = isSaleActive && saleDiscount > 0 
    ? originalPrice * (1 - saleDiscount / 100) 
    : originalPrice;

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow border border-gray-200 cursor-pointer relative"
      onClick={() => onProductClick?.(product)}
    >
      <div className="relative aspect-square bg-gray-100 product-image-container">
        <ImageWithFallback
          src={product.image}
          alt={getName()}
          className="w-full h-full object-cover product-image"
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
        />
        
        {/* Badges container */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 md:gap-2 items-end">
          {isSaleActive && saleDiscount > 0 && (
            <div className="sale-badge bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1 rounded-full text-sm shadow-lg font-semibold">
              -{saleDiscount}%
            </div>
          )}
          
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
          className="favorite-button absolute top-2 left-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all z-10"
          title={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
        >
          <Heart
            size={20}
            className={`md:w-5 md:h-5 transition-colors ${
              isFavorite 
                ? 'fill-red-600 text-red-600' 
                : 'text-gray-400 hover:text-red-600'
            }`}
          />
        </button>
      </div>

      <div className="p-3 md:p-4">
        <h3 className="text-gray-800 mb-2 line-clamp-2 min-h-[3rem] md:min-h-[3rem] text-base md:text-base text-[16px]">{getName()}</h3>
        
        {/* Зачеркнутая цена - показываем под названием для товаров с акцией */}
        {isSaleActive && saleDiscount > 0 ? (
          <div className="text-gray-400 text-sm line-through whitespace-nowrap mb-2">
            {originalPrice.toFixed(0)} ₽
          </div>
        ) : (
          <div className="text-sm mb-2 invisible">0 ₽</div>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="min-w-0">
            {/* Актуальная цена (для товаров с акцией и без) */}
            <div className="product-price text-red-600 font-semibold text-lg md:text-base whitespace-nowrap">
              {isSaleActive && saleDiscount > 0 ? discountedPrice.toFixed(0) : product.price.toFixed(0)} ₽
            </div>
            {isWholesaler && wholesalePrice && (
              <div className="text-sm md:text-sm text-green-600 mt-1 whitespace-nowrap">
                {t('wholesalePrice')}: ¥{wholesalePrice.toFixed(2)}
              </div>
            )}
          </div>
          
          <button
            ref={buttonRef}
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className={`add-to-cart-button flex items-center justify-center gap-2 px-4 py-2.5 md:py-2 rounded-lg transition-colors text-base md:text-sm whitespace-nowrap shrink-0 ${
              product.inStock
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShoppingCart size={18} className="md:w-[18px] md:h-[18px] shrink-0" />
            <span className="hidden md:inline">{t('addToCart')}</span>
            <span className="md:hidden">+</span>
          </button>
        </div>
      </div>
      
      {/* Flying numbers animation - Desktop only */}
      {flyingNumbers.map(num => (
        <FlyingNumber
          key={num.id}
          startX={num.x}
          startY={num.y}
          onComplete={() => {
            setFlyingNumbers(prev => prev.filter(n => n.id !== num.id));
          }}
        />
      ))}
    </div>
  );
};
