// Utility to restore default categories to localStorage
// This will restore all 8 top menu categories and 17 sidebar categories

export function restoreDefaultCategories() {
  console.log('🔄 Restoring default categories...');
  
  const defaultCategories = {
    topMenu: [
      {
        id: 'ointments',
        translations: {
          ru: 'Мази и бальзамы',
          en: 'Ointments & Balms',
          zh: '药膏和香膏',
          vi: 'Thuốc mỡ và dầu bôi'
        },
        order: 0
      },
      {
        id: 'patches',
        translations: {
          ru: 'Пластыри',
          en: 'Patches',
          zh: '贴膏',
          vi: 'Miếng dán'
        },
        order: 1
      },
      {
        id: 'sprays',
        translations: {
          ru: 'Спреи',
          en: 'Sprays',
          zh: '喷雾剂',
          vi: 'Xịt'
        },
        order: 2
      },
      {
        id: 'teas',
        translations: {
          ru: 'Чай',
          en: 'Tea',
          zh: '茶',
          vi: 'Trà'
        },
        order: 3
      },
      {
        id: 'elixirs',
        translations: {
          ru: 'Эликсиры',
          en: 'Elixirs',
          zh: '药酒',
          vi: 'Thuốc бổ'
        },
        order: 4
      },
      {
        id: 'pills',
        translations: {
          ru: 'Пилюли',
          en: 'Pills',
          zh: '丸药',
          vi: 'Viên thuốc'
        },
        order: 5
      },
      {
        id: 'cosmetics',
        translations: {
          ru: 'Косметика',
          en: 'Cosmetics',
          zh: '化妆品',
          vi: 'Mỹ phẩm'
        },
        order: 6
      },
      {
        id: 'accessories',
        translations: {
          ru: 'Аксессуары',
          en: 'Accessories',
          zh: '配件',
          vi: 'Phụ kiện'
        },
        order: 7
      }
    ],
    sidebar: [
      {
        id: 'popular',
        translations: {
          ru: 'Популярные товары',
          en: 'Popular Products',
          zh: '热门产品',
          vi: 'Sản phẩm phổ biến'
        },
        icon: 'Sparkles',
        order: 0
      },
      {
        id: 'allProducts',
        translations: {
          ru: 'Все товары',
          en: 'All Products',
          zh: '所有产品',
          vi: 'Tất cả sản phẩm'
        },
        icon: 'Package',
        order: 1
      },
      {
        id: 'cold',
        translations: {
          ru: 'Простуда',
          en: 'Cold & Flu',
          zh: '感冒',
          vi: 'Cảm lạnh'
        },
        icon: 'Thermometer',
        order: 2
      },
      {
        id: 'digestive',
        translations: {
          ru: 'ЖКТ',
          en: 'Digestive System',
          zh: '消化系统',
          vi: 'Hệ tiêu hóa'
        },
        icon: 'Activity',
        order: 3
      },
      {
        id: 'skin',
        translations: {
          ru: 'Кожа',
          en: 'Skin',
          zh: '皮肤',
          vi: 'Da'
        },
        icon: 'Droplet',
        order: 4
      },
      {
        id: 'joints',
        translations: {
          ru: 'Суставы',
          en: 'Joints',
          zh: '关节',
          vi: 'Khớp'
        },
        icon: 'Bone',
        order: 5
      },
      {
        id: 'heart',
        translations: {
          ru: 'Сердце и сосуды',
          en: 'Heart & Vessels',
          zh: '心脏和血管',
          vi: 'Tim mạch'
        },
        icon: 'Heart',
        order: 6
      },
      {
        id: 'liverKidneys',
        translations: {
          ru: 'Печень и почки',
          en: 'Liver & Kidneys',
          zh: '肝肾',
          vi: 'Gan thận'
        },
        icon: 'Leaf',
        order: 7
      },
      {
        id: 'nervous',
        translations: {
          ru: 'Нервная система',
          en: 'Nervous System',
          zh: '神经系统',
          vi: 'Hệ thần kinh'
        },
        icon: 'Zap',
        order: 8
      },
      {
        id: 'womensHealth',
        translations: {
          ru: 'Женское здоровье',
          en: "Women's Health",
          zh: '女性健康',
          vi: 'Sức khỏe phụ nữ'
        },
        icon: 'User',
        order: 9
      },
      {
        id: 'mensHealth',
        translations: {
          ru: 'Мужское здоровье',
          en: "Men's Health",
          zh: '男性健康',
          vi: 'Sức khỏe nam giới'
        },
        icon: 'User',
        order: 10
      },
      {
        id: 'forChildren',
        translations: {
          ru: 'Для детей',
          en: 'For Children',
          zh: '儿童',
          vi: 'Cho trẻ em'
        },
        icon: 'Baby',
        order: 11
      },
      {
        id: 'vision',
        translations: {
          ru: 'Зрение',
          en: 'Vision',
          zh: '视力',
          vi: 'Thị lực'
        },
        icon: 'Eye',
        order: 12
      },
      {
        id: 'hemorrhoids',
        translations: {
          ru: 'Геморрой',
          en: 'Hemorrhoids',
          zh: '痔疮',
          vi: 'Trĩ'
        },
        icon: 'CircleDot',
        order: 13
      },
      {
        id: 'oncology',
        translations: {
          ru: 'Онкология',
          en: 'Oncology',
          zh: '肿瘤',
          vi: 'Ung thư'
        },
        icon: 'Shield',
        order: 14
      },
      {
        id: 'thyroid',
        translations: {
          ru: 'Щитовидная железа',
          en: 'Thyroid',
          zh: '甲状腺',
          vi: 'Tuyến giáp'
        },
        icon: 'Coffee',
        order: 15
      },
      {
        id: 'lungs',
        translations: {
          ru: 'Легкие',
          en: 'Lungs',
          zh: '肺',
          vi: 'Phổi'
        },
        icon: 'Wind',
        order: 16
      }
    ]
  };
  
  localStorage.setItem('categories', JSON.stringify(defaultCategories));
  console.log('✅ Default categories restored!');
  console.log(`📊 Top menu: ${defaultCategories.topMenu.length} categories`);
  console.log(`📊 Sidebar: ${defaultCategories.sidebar.length} categories`);
  console.log('🔄 Refreshing page...');
  
  // Trigger storage event for other tabs/windows
  window.dispatchEvent(new Event('categoriesUpdated'));
  
  // Reload page to apply changes
  window.location.reload();
}

// Clear categories (for debugging)
export function clearOldCategories() {
  const categories = localStorage.getItem('categories');
  if (categories) {
    console.log('🧹 Clearing old categories from localStorage...');
    localStorage.removeItem('categories');
    console.log('✅ Categories cleared!');
  }
}

// Clear and reload (manual command for console)
export function clearCategoriesAndReload() {
  console.log('🧹 Clearing old categories from localStorage...');
  localStorage.removeItem('categories');
  console.log('✅ Categories cleared! Refreshing page...');
  window.location.reload();
}

// Auto-run on import (only in development)
if (typeof window !== 'undefined') {
  console.log('💡 Available commands:');
  console.log('   - restoreDefaultCategories() - restore all 8+17 categories');
  console.log('   - clearCategoriesAndReload() - clear and reload page');
  
  // Make functions globally available in console
  (window as any).restoreDefaultCategories = restoreDefaultCategories;
  (window as any).clearCategoriesAndReload = clearCategoriesAndReload;
}
