import { X, ShoppingCart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart, Product } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailsModal = ({ product, onClose }: ProductDetailsModalProps) => {
  const { language, t } = useLanguage();
  const { addToCart } = useCart();
  const { user } = useAuth();

  if (!product) return null;
  
  const isWholesaler = user?.isWholesaler || false;
  const wholesalePrice = (product as any).wholesalePrice;

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

  const getComposition = () => {
    switch (language) {
      case 'zh':
        return product.composition_zh;
      case 'en':
        return product.composition_en;
      case 'vi':
        return product.composition_vi;
      default:
        return product.composition;
    }
  };

  const getUsage = () => {
    switch (language) {
      case 'zh':
        return product.usage_zh;
      case 'en':
        return product.usage_en;
      case 'vi':
        return product.usage_vi;
      default:
        return product.usage;
    }
  };

  const handleAddToCart = () => {
    addToCart(product, product.store);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-gray-800">{getName()}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Image */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden product-image-container">
              <ImageWithFallback
                src={product.image}
                alt={getName()}
                className="w-full h-full object-cover product-image"
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
              />
              {!product.inStock && (
                <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full">
                  {t('outOfStock')}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div>
                <div className="text-3xl text-red-600 mb-2">
                  {product.price.toFixed(0)} ₽
                </div>
                {isWholesaler && wholesalePrice && (
                  <div className="text-lg text-green-600 mb-4">
                    {t('wholesalePrice')}: ¥{wholesalePrice.toFixed(2)}
                  </div>
                )}
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                    product.inStock
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart size={20} />
                  <span>{t('addToCart')}</span>
                </button>
              </div>

              <div>
                <h3 className="text-gray-800 mb-2">{t('description')}</h3>
                <p className="text-gray-700 whitespace-pre-line">{getDescription()}</p>
              </div>

              <div>
                <h3 className="text-gray-800 mb-2">{t('composition')}</h3>
                <p className="text-gray-700 whitespace-pre-line">{getComposition()}</p>
              </div>

              <div>
                <h3 className="text-gray-800 mb-2">{t('usage')}</h3>
                <p className="text-gray-700 whitespace-pre-line">{getUsage()}</p>
              </div>

              {product.inStock && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm">{t('inStock')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
