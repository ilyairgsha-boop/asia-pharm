import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type StoreType = 'china' | 'thailand' | 'vietnam';

export interface Product {
  id: string;
  name: string;
  name_en: string;
  name_zh: string;
  name_vi: string;
  price: number;
  category: string; // Категория товара (ointments, patches, pills и т.д.) - только ОДНА
  disease: string; // Основная категория заболевания (для обратной совместимости)
  diseaseCategories?: string[]; // Множественные категории заболеваний (cold, headache, popular и т.д.)
  shortDescription: string;
  shortDescription_en: string;
  shortDescription_zh: string;
  shortDescription_vi: string;
  description: string;
  description_en: string;
  description_zh: string;
  description_vi: string;
  image: string;
  inStock: boolean;
  store: StoreType; // Магазин товара (china/thailand/vietnam) - только ОДИН
  weight?: number; // Вес в кг (для расчета доставки)
  isSample?: boolean; // Пробник (только для магазина Китай)
  saleEnabled?: boolean; // Акция включена
  saleDiscount?: number | null; // Процент скидки (1-100)
  saleEndDate?: string | null; // Дата окончания акции (ISO string)
}

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  // Отдельные корзины для каждого магазина
  chinaCart: CartItem[];
  thailandCart: CartItem[];
  vietnamCart: CartItem[];
  
  // Методы для работы с корзинами
  addToCart: (product: Product, store: StoreType) => void;
  removeFromCart: (productId: string, store: StoreType) => void;
  updateQuantity: (productId: string, quantity: number, store: StoreType) => void;
  clearStoreCart: (store: StoreType) => void;
  
  // Получение корзины и общей суммы для конкретного магазина
  getCartByStore: (store: StoreType) => CartItem[];
  getTotalByStore: (store: StoreType) => number;
  
  // Общее количество товаров во всех корзинах
  totalItemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [chinaCart, setChinaCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('chinaCart');
    return saved ? JSON.parse(saved) : [];
  });

  const [thailandCart, setThailandCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('thailandCart');
    return saved ? JSON.parse(saved) : [];
  });

  const [vietnamCart, setVietnamCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('vietnamCart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('chinaCart', JSON.stringify(chinaCart));
  }, [chinaCart]);

  useEffect(() => {
    localStorage.setItem('thailandCart', JSON.stringify(thailandCart));
  }, [thailandCart]);

  useEffect(() => {
    localStorage.setItem('vietnamCart', JSON.stringify(vietnamCart));
  }, [vietnamCart]);

  const getSetterForStore = (store: StoreType) => {
    switch (store) {
      case 'china':
        return setChinaCart;
      case 'thailand':
        return setThailandCart;
      case 'vietnam':
        return setVietnamCart;
      default:
        return setChinaCart;
    }
  };

  const getCartByStore = (store: StoreType): CartItem[] => {
    switch (store) {
      case 'china':
        return chinaCart;
      case 'thailand':
        return thailandCart;
      case 'vietnam':
        return vietnamCart;
      default:
        return chinaCart;
    }
  };

  const addToCart = (product: Product, store: StoreType) => {
    const setter = getSetterForStore(store);
    setter((prev) => {
      // Проверка для пробников: только 1 наименование в 1 экземпляре
      if (product.isSample && store === 'china') {
        const hasSamples = prev.some(item => item.isSample);
        if (hasSamples) {
          alert('Вы можете добавить только 1 наименование пробника в 1 экземпляре на заказ');
          return prev;
        }
      }
      
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        // Для пробников не увеличиваем количество
        if (product.isSample && store === 'china') {
          alert('Вы можете добавить только 1 экземпляр пробника');
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string, store: StoreType) => {
    const setter = getSetterForStore(store);
    setter((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number, store: StoreType) => {
    if (quantity <= 0) {
      removeFromCart(productId, store);
      return;
    }
    
    const setter = getSetterForStore(store);
    setter((prev) => {
      const item = prev.find(i => i.id === productId);
      // Для пробников количество всегда 1
      if (item?.isSample && store === 'china' && quantity > 1) {
        alert('Количество пробника не может быть больше 1');
        return prev;
      }
      
      return prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const clearStoreCart = (store: StoreType) => {
    const setter = getSetterForStore(store);
    setter([]);
  };

  const getTotalByStore = (store: StoreType): number => {
    const cart = getCartByStore(store);
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const totalItemsCount = 
    chinaCart.reduce((sum, item) => sum + item.quantity, 0) +
    thailandCart.reduce((sum, item) => sum + item.quantity, 0) +
    vietnamCart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        chinaCart,
        thailandCart,
        vietnamCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearStoreCart,
        getCartByStore,
        getTotalByStore,
        totalItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
