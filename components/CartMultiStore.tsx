import { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart, type StoreType } from '../contexts/CartContext';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface CartMultiStoreProps {
  onNavigate: (page: string, store?: StoreType) => void;
}

export const CartMultiStore = ({ onNavigate }: CartMultiStoreProps) => {
  const { language, t } = useLanguage();
  const { 
    chinaCart, 
    thailandCart, 
    vietnamCart,
    removeFromCart, 
    updateQuantity, 
    getTotalByStore 
  } = useCart();

  const [selectedStore, setSelectedStore] = useState<StoreType>('china');

  const stores: { id: StoreType; nameKey: string }[] = [
    { id: 'china', nameKey: 'chinaStore' },
    { id: 'thailand', nameKey: 'thailandStore' },
    { id: 'vietnam', nameKey: 'vietnamStore' },
  ];

  const getName = (item: any) => {
    switch (language) {
      case 'zh':
        return item.name_zh;
      case 'en':
        return item.name_en;
      case 'vi':
        return item.name_vi;
      default:
        return item.name;
    }
  };

  const currentCart = 
    selectedStore === 'china' ? chinaCart :
    selectedStore === 'thailand' ? thailandCart :
    vietnamCart;

  const totalPrice = getTotalByStore(selectedStore);

  const allCartsEmpty = chinaCart.length === 0 && thailandCart.length === 0 && vietnamCart.length === 0;

  if (allCartsEmpty) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingCart size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-gray-800 mb-4">{t('yourCart')}</h2>
          <p className="text-gray-600 mb-6">{t('cartEmpty')}</p>
          <button
            onClick={() => onNavigate('home')}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors text-center flex items-center justify-center mx-auto"
          >
            {t('continueShopping')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-gray-800 mb-6">{t('yourCart')}</h2>
      </div>

      {/* Переключатель магазинов */}
      <div className="mb-6 md:relative md:min-h-[60px]">
        <div className="flex gap-2 overflow-x-auto px-4 md:hidden">
          {stores.map((store) => {
            const itemCount = 
              store.id === 'china' ? chinaCart.reduce((sum, item) => sum + item.quantity, 0) :
              store.id === 'thailand' ? thailandCart.reduce((sum, item) => sum + item.quantity, 0) :
              vietnamCart.reduce((sum, item) => sum + item.quantity, 0);

            return (
              <button
                key={store.id}
                onClick={() => setSelectedStore(store.id)}
                className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
                  selectedStore === store.id
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-red-600'
                }`}
              >
                {t(store.nameKey)}
                {itemCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    selectedStore === store.id
                      ? 'bg-white text-red-600'
                      : 'bg-red-600 text-white'
                  }`}>
                    {itemCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="hidden md:flex md:absolute md:left-1/2 md:-translate-x-1/2 gap-2">
          {stores.map((store) => {
          const itemCount = 
            store.id === 'china' ? chinaCart.reduce((sum, item) => sum + item.quantity, 0) :
            store.id === 'thailand' ? thailandCart.reduce((sum, item) => sum + item.quantity, 0) :
            vietnamCart.reduce((sum, item) => sum + item.quantity, 0);

          return (
            <button
              key={store.id}
              onClick={() => setSelectedStore(store.id)}
              className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
                selectedStore === store.id
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-red-600'
              }`}
            >
              {t(store.nameKey)}
              {itemCount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  selectedStore === store.id
                    ? 'bg-white text-red-600'
                    : 'bg-red-600 text-white'
                }`}>
                  {itemCount}
                </span>
              )}
            </button>
          );
        })}
        </div>
      </div>

      <div className="container mx-auto px-4">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2">
          {currentCart.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600">{t('cartEmpty')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentCart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-md p-4 flex gap-4"
                >
                  <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={item.image}
                      alt={getName(item)}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-grow">
                    <h3 className="text-gray-800 mb-2">{getName(item)}</h3>
                    <p className="text-red-600 mb-2">
                      {(item.price || 0).toLocaleString()} ₽
                    </p>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1, selectedStore)}
                        className="p-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-gray-700 min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1, selectedStore)}
                        className="p-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeFromCart(item.id, selectedStore)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={t('remove')}
                    >
                      <Trash2 size={20} />
                    </button>
                    <p className="text-gray-800">
                      {((item.price || 0) * (item.quantity || 0)).toLocaleString()} ₽
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h3 className="text-gray-800 mb-4">{t('orderSummary')}</h3>
            
            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">{t('subtotal')}:</span>
                <span className="text-gray-800">{(totalPrice || 0).toLocaleString()} ₽</span>
              </div>
            </div>

            {currentCart.length > 0 && (
              <>
                <button
                  onClick={() => onNavigate('checkout', selectedStore)}
                  className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors mb-3 text-center flex items-center justify-center"
                >
                  {t('checkout')}
                </button>

                <button
                  onClick={() => onNavigate('home')}
                  className="w-full border border-red-600 text-red-600 py-3 rounded-lg hover:bg-red-50 transition-colors text-center flex items-center justify-center"
                >
                  {t('continueShopping')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
