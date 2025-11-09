import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Droplets, Square, Wind, Coffee, Beaker, Pill, Sparkles, ShoppingBag, TestTube } from 'lucide-react';

interface CategoryMenuProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  currentStore?: 'china' | 'thailand' | 'vietnam';
}

interface Category {
  id: string;
  translations: {
    ru: string;
    en: string;
    zh: string;
    vi: string;
  };
  order: number;
}

export const CategoryMenu = ({ selectedCategory, onSelectCategory, currentStore }: CategoryMenuProps) => {
  const { t, currentLanguage } = useLanguage();
  const [topMenuCategories, setTopMenuCategories] = useState<Category[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Icon mapping for top menu categories
  const CATEGORY_ICONS: Record<string, any> = {
    ointments: Droplets,
    patches: Square,
    sprays: Wind,
    teas: Coffee,
    elixirs: Beaker,
    pills: Pill,
    cosmetics: Sparkles,
    accessories: ShoppingBag,
    samples: TestTube,
  };

  const loadCategories = async () => {
    // Default categories - Новая структура (7 категорий)
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
            vi: 'Thuốc bổ'
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
        },
        {
          id: 'samples',
          translations: {
            ru: 'Пробники',
            en: 'Samples',
            zh: '样品',
            vi: 'Mẫu thử'
          },
          order: 8
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
            en: 'Women\'s Health',
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
            en: 'Men\'s Health',
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

    // Load categories from localStorage (set by admin panel or default)
    const storedCategories = localStorage.getItem('categories');
    if (storedCategories) {
      try {
        const parsed = JSON.parse(storedCategories);
        
        // Check if 'popular' category exists in sidebar
        const hasPopular = parsed.sidebar && parsed.sidebar.some((cat: any) => cat.id === 'popular');
        
        // Check if categories have translations structure (new format)
        const hasTranslations = parsed.topMenu && parsed.topMenu.length > 0 && 
          parsed.topMenu[0].translations && 
          typeof parsed.topMenu[0].translations === 'object';
        
        if (parsed.topMenu && parsed.topMenu.length > 0 && hasPopular && hasTranslations) {
          setTopMenuCategories(parsed.topMenu);
          console.log('✅ CategoryMenu: Categories loaded from localStorage (with translations)', parsed.topMenu.length);
          return;
        } else {
          console.log('⚠️ CategoryMenu: Categories in localStorage are outdated (missing popular or translations), clearing...');
          // Clear old categories
          localStorage.removeItem('categories');
        }
      } catch (error) {
        console.error('Error parsing categories:', error);
        localStorage.removeItem('categories');
      }
    }

    // Use default categories as fallback (don't try API)
    console.log('⚠️ CategoryMenu: No valid categories in localStorage, using defaults with translations');
    setTopMenuCategories(defaultCategories.topMenu);
    localStorage.setItem('categories', JSON.stringify(defaultCategories));
  };

  useEffect(() => {
    loadCategories();
    
    // Listen for category updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'categories') {
        console.log('📢 CategoryMenu: Categories updated, reloading...');
        loadCategories();
      }
    };
    
    // Custom event listener for same-window updates
    const handleCategoriesUpdate = () => {
      console.log('📢 CategoryMenu: Custom categories update event');
      loadCategories();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('categoriesUpdated', handleCategoriesUpdate as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdate as EventListener);
    };
  }, []);

  // Mobile category labels - simplified
  const getMobileCategoryLabel = (id: string, fullLabel: string) => {
    const mobileLabels: Record<string, Record<string, string>> = {
      'ointments': { ru: 'Мази', en: 'Ointments', zh: '药膏', vi: 'Thuốc mỡ' },
      'teas': { ru: 'Лечебный чай', en: 'Healing Tea', zh: '药茶', vi: 'Trà chữa bệnh' },
    };
    
    return mobileLabels[id]?.[currentLanguage] || fullLabel;
  };

  // Desktop category labels - full labels for desktop version
  const getDesktopCategoryLabel = (id: string, fullLabel: string) => {
    // Return full label for desktop - no shortening
    return fullLabel;
  };

  // Memoize categories display - recalculate when language or loaded categories change
  const categoriesBase = useMemo(() => {
    // Fallback to hardcoded categories if none are loaded
    const fallbackCategories = [
      { 
        id: 'ointments', 
        label: t('ointments'), 
        mobileLabel: getMobileCategoryLabel('ointments', t('ointments')),
        desktopLabel: getDesktopCategoryLabel('ointments', t('ointments'))
      },
      { id: 'patches', label: t('patches'), mobileLabel: t('patches'), desktopLabel: t('patches') },
      { id: 'sprays', label: t('sprays'), mobileLabel: t('sprays'), desktopLabel: t('sprays') },
      { 
        id: 'teas', 
        label: t('teas'), 
        mobileLabel: getMobileCategoryLabel('teas', t('teas')),
        desktopLabel: t('teas')
      },
      { id: 'elixirs', label: t('elixirs'), mobileLabel: t('elixirs'), desktopLabel: t('elixirs') },
      { id: 'pills', label: t('pills'), mobileLabel: t('pills'), desktopLabel: t('pills') },
      { id: 'cosmetics', label: t('cosmetics'), mobileLabel: t('cosmetics'), desktopLabel: t('cosmetics') },
      { id: 'accessories', label: t('accessories'), mobileLabel: t('accessories'), desktopLabel: t('accessories') },
      { id: 'samples', label: t('samples'), mobileLabel: t('samples'), desktopLabel: t('samples') },
    ];

    const categoriesToDisplay = topMenuCategories.length > 0
      ? topMenuCategories.map(cat => {
          const fullLabel = cat.translations?.[currentLanguage] || cat.translations?.ru || t(cat.id);
          return {
            id: cat.id,
            label: fullLabel,
            mobileLabel: getMobileCategoryLabel(cat.id, fullLabel),
            desktopLabel: getDesktopCategoryLabel(cat.id, fullLabel)
          };
        })
      : fallbackCategories;

    return categoriesToDisplay.filter(cat => cat.id !== 'popular'); // Don't show "popular" in menu
  }, [topMenuCategories, currentLanguage, t]);

  // Desktop categories - show samples only for China store
  const desktopCategories = useMemo(() => {
    return categoriesBase.filter(cat => cat.id !== 'samples' || currentStore === 'china');
  }, [categoriesBase, currentStore]);

  // Mobile categories - never show samples (it's in burger menu)
  const mobileCategories = useMemo(() => {
    return categoriesBase.filter(cat => cat.id !== 'samples');
  }, [categoriesBase]);

  return (
    <nav className="bg-white border-b-2 border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        {/* Desktop version - horizontal scroll */}
        <div className="hidden md:flex items-center justify-end gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 px-[0px] py-[12px] m-[0px]">
          {desktopCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`category-menu-button flex-shrink-0 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? 'bg-red-600 text-white active'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {category.desktopLabel || category.label}
            </button>
          ))}
        </div>

        {/* Mobile version - grid with icons - Following Figma design */}
        <div className="md:hidden py-2.5 px-[6px]">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-category-menu-button w-full px-[13px] py-3 rounded-[10px] flex items-center justify-between transition-colors shadow-md border-2 bg-red-600 text-white hover:bg-red-700 border-red-600"
          >
            <span className="mobile-category-menu-text font-medium text-[20px] leading-[36px] tracking-[-0.47px]">{t('productTypes')}</span>
            <span className={`mobile-category-menu-arrow text-[19.5px] leading-[29.25px] tracking-[-0.11px] transform transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {mobileMenuOpen && (
            <div className="mt-[12px] grid grid-cols-2 gap-[9px]">
              {mobileCategories.map((category) => {
                const IconComponent = CATEGORY_ICONS[category.id];
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      onSelectCategory(category.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`category-menu-button flex items-center gap-[6.5px] px-[10px] py-[16px] rounded-[10px] transition-colors min-h-[51px] ${
                      selectedCategory === category.id
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-gray-100 hover:bg-gray-200 text-[#364153]'
                    }`}
                  >
                    {IconComponent && (
                      <div className={`flex-shrink-0 ${selectedCategory === category.id ? 'text-white' : 'text-red-600'}`}>
                        <IconComponent size={20} strokeWidth={1.67} />
                      </div>
                    )}
                    <span className="text-left leading-[20px] text-[20px] tracking-[-0.31px]">{category.mobileLabel || category.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
