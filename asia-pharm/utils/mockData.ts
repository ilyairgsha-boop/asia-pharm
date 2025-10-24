import { Product } from '../contexts/CartContext';

// Mock products data for local development when Edge Function is not deployed
export const mockProducts: Product[] = [
  // China Store - Traditional medicines
  {
    id: '1',
    name: '云南白药',
    name_en: 'Yunnan Baiyao',
    name_vi: 'Vân Nam Bạch Dược',
    name_zh: '云南白药',
    description: 'Традиционное китайское средство для остановки кровотечений и заживления ран',
    description_en: 'Traditional Chinese medicine for stopping bleeding and wound healing',
    description_vi: 'Thuốc cổ truyền Trung Quốc để cầm máu và chữa lành vết thương',
    description_zh: '传统中药止血愈伤药',
    price: 850,
    price_wholesale: 45,
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
    category: 'herbal_medicine',
    disease: 'wounds',
    store: 'china',
    stock: 50,
    is_sample: false
  },
  {
    id: '2',
    name: 'Жемчужный крем',
    name_en: 'Pearl Cream',
    name_vi: 'Kem Ngọc Trai',
    name_zh: '珍珠膏',
    description: 'Увлажняющий крем с жемчужной пудрой для здоровой кожи',
    description_en: 'Moisturizing cream with pearl powder for healthy skin',
    description_vi: 'Kem dưỡng ẩm với bột ngọc trai cho làn da khỏe mạnh',
    description_zh: '含珍珠粉的保湿霜',
    price: 1200,
    price_wholesale: 65,
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400',
    category: 'cosmetics',
    disease: 'skin_care',
    store: 'china',
    stock: 30,
    is_sample: false
  },
  {
    id: '3',
    name: 'Женьшень красный',
    name_en: 'Red Ginseng',
    name_vi: 'Nhân Sâm Đỏ',
    name_zh: '红参',
    description: 'Корень красного женьшеня для повышения энергии и иммунитета',
    description_en: 'Red ginseng root for energy and immunity boost',
    description_vi: 'Rễ nhân sâm đỏ tăng cường năng lượng và miễn dịch',
    description_zh: '红参根增强能量和免疫力',
    price: 3500,
    price_wholesale: 180,
    image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=400',
    category: 'supplements',
    disease: 'immunity',
    store: 'china',
    stock: 20,
    is_sample: false
  },
  {
    id: '4',
    name: 'Бальзам Тигровый',
    name_en: 'Tiger Balm',
    name_vi: 'Cao Hổ',
    name_zh: '虎标万金油',
    description: 'Обезболивающий бальзам при мышечных и суставных болях',
    description_en: 'Pain relief balm for muscle and joint pain',
    description_vi: 'Dầu giảm đau cho đau cơ và khớp',
    description_zh: '缓解肌肉和关节疼痛的药膏',
    price: 450,
    price_wholesale: 25,
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400',
    category: 'ointments',
    disease: 'pain',
    store: 'china',
    stock: 100,
    is_sample: false
  },
  {
    id: '5',
    name: 'Пробник - Женьшень',
    name_en: 'Sample - Ginseng',
    name_vi: 'Mẫu thử - Nhân Sâm',
    name_zh: '试用装 - 人参',
    description: 'Пробная упаковка женьшеня (10г)',
    description_en: 'Ginseng sample pack (10g)',
    description_vi: 'Gói mẫu nhân sâm (10g)',
    description_zh: '人参试用装（10克）',
    price: 200,
    price_wholesale: 12,
    image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=400',
    category: 'samples',
    disease: 'immunity',
    store: 'china',
    stock: 50,
    is_sample: true
  },

  // Thailand Store - Thai traditional medicines
  {
    id: '11',
    name: 'Тайский бальзам',
    name_en: 'Thai Herbal Balm',
    name_vi: 'Dầu Thảo Dược Thái',
    name_zh: '泰国草药膏',
    description: 'Травяной бальзам для облегчения головной боли и простуды',
    description_en: 'Herbal balm for headache and cold relief',
    description_vi: 'Dầu thảo dược giảm đau đầu và cảm lạnh',
    description_zh: '缓解头痛和感冒的草药膏',
    price: 380,
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400',
    category: 'ointments',
    disease: 'headache',
    store: 'thailand',
    stock: 80,
    is_sample: false
  },
  {
    id: '12',
    name: 'Мангостиновая паста',
    name_en: 'Mangosteen Paste',
    name_vi: 'Thuốc Măng Cụt',
    name_zh: '山竹膏',
    description: 'Натуральная паста из мангостина для пищеварения',
    description_en: 'Natural mangosteen paste for digestion',
    description_vi: 'Thuốc dán măng cụt tự nhiên cho tiêu hóa',
    description_zh: '天然山竹膏助消化',
    price: 650,
    image: 'https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=400',
    category: 'herbal_medicine',
    disease: 'digestion',
    store: 'thailand',
    stock: 40,
    is_sample: false
  },
  {
    id: '13',
    name: 'Капсулы из кордицепса',
    name_en: 'Cordyceps Capsules',
    name_vi: 'Viên Đông Trùng Hạ Thảo',
    name_zh: '冬虫夏草胶囊',
    description: 'Капсулы кордицепса для энергии и выносливости',
    description_en: 'Cordyceps capsules for energy and endurance',
    description_vi: 'Viên đông trùng hạ thảo tăng năng lượng',
    description_zh: '冬虫夏草胶囊增强能量',
    price: 2800,
    image: 'https://images.unsplash.com/photo-1550572017-4414fac29c7c?w=400',
    category: 'supplements',
    disease: 'immunity',
    store: 'thailand',
    stock: 25,
    is_sample: false
  },
  {
    id: '14',
    name: 'Кокосовое масло лечебное',
    name_en: 'Therapeutic Coconut Oil',
    name_vi: 'Dầu Dừa Trị Liệu',
    name_zh: '治疗椰子油',
    description: 'Органическое кокосовое масло для кожи и волос',
    description_en: 'Organic coconut oil for skin and hair',
    description_vi: 'Dầu dừa hữu cơ cho da và tóc',
    description_zh: '有机椰子油护肤护发',
    price: 520,
    image: 'https://images.unsplash.com/photo-1474440692490-2e83ae13ba29?w=400',
    category: 'cosmetics',
    disease: 'skin_care',
    store: 'thailand',
    stock: 60,
    is_sample: false
  },

  // Vietnam Store - Vietnamese medicines
  {
    id: '21',
    name: 'Вьетнамский бальзам Звезда',
    name_en: 'Vietnamese Golden Star Balm',
    name_vi: 'Cao Sao Vàng',
    name_zh: '越南金星膏',
    description: 'Классический вьетнамский бальзам от головной боли',
    description_en: 'Classic Vietnamese balm for headache relief',
    description_vi: 'Cao Việt Nam cổ điển giảm đau đầu',
    description_zh: '经典越南头痛药膏',
    price: 250,
    image: 'https://images.unsplash.com/photo-1612831200409-d3cd0c6c9c9f?w=400',
    category: 'ointments',
    disease: 'headache',
    store: 'vietnam',
    stock: 120,
    is_sample: false
  },
  {
    id: '22',
    name: 'Капсулы лотоса',
    name_en: 'Lotus Capsules',
    name_vi: 'Viên Sen',
    name_zh: '莲花胶囊',
    description: 'Капсулы из семян лотоса для успокоения нервной системы',
    description_en: 'Lotus seed capsules for calming nervous system',
    description_vi: 'Viên hạt sen an thần',
    description_zh: '莲子胶囊镇静神经',
    price: 890,
    image: 'https://images.unsplash.com/photo-1628016041793-389e8265524f?w=400',
    category: 'supplements',
    disease: 'stress',
    store: 'vietnam',
    stock: 45,
    is_sample: false
  },
  {
    id: '23',
    name: 'Масло кайепута',
    name_en: 'Cajeput Oil',
    name_vi: 'Dầu Tràm',
    name_zh: '白千层油',
    description: 'Эфирное масло для лечения простуды и мышечных болей',
    description_en: 'Essential oil for cold and muscle pain treatment',
    description_vi: 'Tinh dầu trị cảm lạnh và đau cơ',
    description_zh: '治疗感冒和肌肉疼痛的精油',
    price: 420,
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400',
    category: 'herbal_medicine',
    disease: 'cold',
    store: 'vietnam',
    stock: 70,
    is_sample: false
  },
  {
    id: '24',
    name: 'Травяной чай от печени',
    name_en: 'Liver Detox Tea',
    name_vi: 'Trà Giải Độc Gan',
    name_zh: '护肝茶',
    description: 'Травяной чай для очищения и поддержки печени',
    description_en: 'Herbal tea for liver cleansing and support',
    description_vi: 'Trà thảo dược làm sạch và hỗ trợ gan',
    description_zh: '清肝护肝草药茶',
    price: 680,
    image: 'https://images.unsplash.com/photo-1563822249366-3efaa8b9e2fc?w=400',
    category: 'herbal_medicine',
    disease: 'liver',
    store: 'vietnam',
    stock: 55,
    is_sample: false
  }
];

export const getMockProducts = (): Product[] => {
  return mockProducts;
};

// Mock orders data for local development
export const mockOrders = [
  {
    id: 'order-1',
    orderNumber: '221001',
    userId: 'user-1',
    userEmail: 'test@example.com',
    store: 'china',
    items: [
      {
        productId: '1',
        name: 'Yunnan Baiyao',
        quantity: 2,
        price: 850
      }
    ],
    totalAmount: 1700,
    totalPrice: 1700,
    subtotal: 1700,
    status: 'processing',
    shippingMethod: 'standard',
    shippingAddress: {
      fullName: 'Тест Пользователь',
      phone: '+79001234567',
      address: 'ул. Тестовая, д. 1',
      city: 'Москва',
      country: 'Россия',
      postalCode: '123456'
    },
    paymentMethod: 'card',
    createdAt: new Date().toISOString(),
    orderDate: new Date().toISOString()
  },
  {
    id: 'order-2',
    orderNumber: '221002',
    userId: 'user-1',
    userEmail: 'test@example.com',
    store: 'thailand',
    items: [
      {
        productId: '11',
        name: 'Thai Herbal Balm',
        quantity: 1,
        price: 380
      }
    ],
    totalAmount: 380,
    totalPrice: 380,
    subtotal: 380,
    status: 'delivered',
    shippingMethod: 'express',
    shippingAddress: {
      fullName: 'Тест Пользователь',
      phone: '+79001234567',
      address: 'ул. Тестовая, д. 1',
      city: 'Москва',
      country: 'Россия',
      postalCode: '123456'
    },
    paymentMethod: 'card',
    trackingNumber: 'TRACK123456',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    orderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const getMockOrders = () => {
  return mockOrders;
};