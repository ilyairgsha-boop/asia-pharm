import { X, ShoppingCart, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart, Product } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useState, useEffect, useRef } from 'react';
import { FlyingNumber } from './FlyingNumber';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailsModal = ({ product, onClose }: ProductDetailsModalProps) => {
  const { language, t } = useLanguage();
  const { addToCart } = useCart();
  const { user } = useAuth();
  
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
    if (!product) return;

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

  if (!product) return null;
  
  const isWholesaler = user?.isWholesaler || false;
  const wholesalePrice = (product as any).wholesalePrice; // Keep as any for backwards compatibility

  // Calculate discounted price
  const saleDiscount = product.saleDiscount || 0;
  const originalPrice = product.price;
  const discountedPrice = isSaleActive && saleDiscount > 0 
    ? originalPrice * (1 - saleDiscount / 100) 
    : originalPrice;

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

  const getShortDescription = () => {
    switch (language) {
      case 'zh':
        return product.shortDescription_zh;
      case 'en':
        return product.shortDescription_en;
      case 'vi':
        return product.shortDescription_vi;
      default:
        return product.shortDescription;
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

  const handleAddToCart = () => {
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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-4 flex items-center justify-between">
          <h2 className="text-gray-800 text-lg md:text-xl">{getName()}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={28} className="md:w-6 md:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {/* Image */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden product-image-container">
              <ImageWithFallback
                src={product.image}
                alt={getName()}
                className="w-full h-full object-cover product-image"
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
              />
              
              {/* Badges */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                {isSaleActive && saleDiscount > 0 && (
                  <div className="sale-badge bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-full text-base shadow-lg font-semibold">
                    -{saleDiscount}%
                  </div>
                )}
                {!product.inStock && (
                  <div className="bg-red-600 text-white px-4 py-2 rounded-full text-base">
                    {t('outOfStock')}
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4 md:space-y-4">
              <div>
                {/* Sale badge */}
                {isSaleActive && (
                  <div className="mb-3 flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                    <Zap size={18} className="fill-orange-600" />
                    <span className="text-base font-semibold">{t('sale')}</span>
                  </div>
                )}

                {isSaleActive && saleDiscount > 0 ? (
                  <div className="mb-3">
                    <div className="text-gray-400 text-xl line-through mb-2">
                      {originalPrice.toFixed(0)} ₽
                    </div>
                    <div className="product-price text-3xl md:text-3xl text-red-600 font-semibold">
                      {discountedPrice.toFixed(0)} ₽
                    </div>
                  </div>
                ) : (
                  <div className="product-price text-3xl md:text-3xl text-red-600 mb-3 md:mb-2">
                    {product.price.toFixed(0)} ₽
                  </div>
                )}
                {isWholesaler && wholesalePrice && (
                  <div className="text-xl md:text-lg text-green-600 mb-4">
                    {t('wholesalePrice')}: ¥{wholesalePrice.toFixed(2)}
                  </div>
                )}
                <button
                  ref={buttonRef}
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className={`add-to-cart-button w-full flex items-center justify-center gap-2 px-6 py-4 md:py-3 rounded-lg transition-colors text-lg md:text-base ${
                    product.inStock
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart size={24} className="md:w-5 md:h-5" />
                  <span className="text-[16px]">{t('addToCart')}</span>
                </button>
              </div>

              {/* Short description without header */}
              <div>
                <p className="text-gray-700 whitespace-pre-line text-base md:text-base text-[16px]">{getShortDescription()}</p>
              </div>

              {/* Full description with header */}
              <div>
                <h3 className="text-gray-800 mb-2 text-lg md:text-lg text-[16px]">{t('description')}</h3>
                <p className="text-gray-700 whitespace-pre-line text-base md:text-base text-[16px]">{getDescription()}</p>
              </div>

              {product.inStock && (
                <div className="mt-4 p-3 md:p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-base md:text-sm">{t('inStock')}</p>
                </div>
              )}
            </div>
          </div>
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
