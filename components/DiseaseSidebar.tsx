import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Activity, Heart, Pill, Droplet, Brain, Bone, Thermometer, Leaf, Shield, Zap, User, Baby, Eye, CircleDot, Package, Sparkles, Coffee, Wind, Apple, Star, TestTube } from 'lucide-react';

// Icon mapping
const ICON_MAP: Record<string, any> = {
  Activity,
  Heart,
  Pill,
  Droplet,
  Brain,
  Bone,
  Thermometer,
  Leaf,
  Shield,
  Zap,
  User,
  Baby,
  Eye,
  CircleDot,
  Package,
  Sparkles,
  Coffee,
  Wind,
  Apple,
  Star,
  TestTube,
};

// Custom Female User Icon with long hair
const FemaleUser = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
    {/* Long hair strands */}
    <path d="M8 11 L6 15"></path>
    <path d="M16 11 L18 15"></path>
  </svg>
);

interface Category {
  id: string;
  translations: {
    ru: string;
    en: string;
    zh: string;
    vi: string;
  };
  icon?: string;
  order: number;
}

interface DiseaseSidebarProps {
  selectedDisease: string | null;
  onSelectDisease: (disease: string | null) => void;
}

export const DiseaseSidebar = ({ selectedDisease, onSelectDisease }: DiseaseSidebarProps) => {
  const { t, currentLanguage } = useLanguage();
  const [sidebarCategories, setSidebarCategories] = useState<Category[]>([]);

  const loadCategories = async () => {
    // Default categories to use as fallback
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
        },
        {
          id: 'samples',
          translations: {
            ru: 'Пробники',
            en: 'Samples',
            zh: '样品',
            vi: 'Mẫu thử'
          },
          icon: 'TestTube',
          order: 17
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
        const hasTranslations = parsed.sidebar && parsed.sidebar.length > 0 && 
          parsed.sidebar[0].translations && 
          typeof parsed.sidebar[0].translations === 'object';
        
        if (parsed.sidebar && parsed.sidebar.length > 0 && hasPopular && hasTranslations) {
          setSidebarCategories(parsed.sidebar);
          console.log('✅ DiseaseSidebar: Categories loaded from localStorage (with translations)', parsed.sidebar.length);
          return;
        } else {
          console.log('⚠️ DiseaseSidebar: Categories in localStorage missing "popular", using defaults');
          // Clear old categories
          localStorage.removeItem('categories');
        }
      } catch (error) {
        console.error('Error parsing categories:', error);
        localStorage.removeItem('categories');
      }
    }

    // Use default categories as fallback (don't try API)
    console.log('⚠️ DiseaseSidebar: No categories in localStorage, using defaults');
    setSidebarCategories(defaultCategories.sidebar);
    localStorage.setItem('categories', JSON.stringify(defaultCategories));
  };

  useEffect(() => {
    loadCategories();
    
    // Listen for category updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'categories') {
        console.log('📢 DiseaseSidebar: Categories updated, reloading...');
        loadCategories();
      }
    };
    
    // Custom event listener for same-window updates
    const handleCategoriesUpdate = () => {
      console.log('📢 DiseaseSidebar: Custom categories update event');
      loadCategories();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('categoriesUpdated', handleCategoriesUpdate as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdate as EventListener);
    };
  }, []);

  // Memoize diseases display - recalculate when language or loaded categories change
  const { diseases } = useMemo(() => {
    // Fallback to hardcoded categories if none are loaded
    const fallbackDiseases = [
      { id: 'popular', label: t('popular'), icon: Star },
      { id: 'cold', label: t('cold'), icon: Thermometer },
      { id: 'digestive', label: t('digestive'), icon: Activity },
      { id: 'skin', label: t('skin'), icon: Droplet },
      { id: 'joints', label: t('joints'), icon: Bone },
      { id: 'headache', label: t('headache'), icon: Brain },
      { id: 'heart', label: t('heart'), icon: Heart },
      { id: 'liver', label: t('liver'), icon: Leaf },
      { id: 'kidneys', label: t('kidneys'), icon: Pill },
      { id: 'nervous', label: t('nervous'), icon: Zap },
      { id: 'womensHealth', label: t('womensHealth'), icon: FemaleUser },
      { id: 'mensHealth', label: t('mensHealth'), icon: User },
      { id: 'forChildren', label: t('forChildren'), icon: Baby },
      { id: 'vision', label: t('vision'), icon: Eye },
      { id: 'hemorrhoids', label: t('hemorrhoids'), icon: CircleDot },
    ];

    const diseases = (sidebarCategories.length > 0
      ? sidebarCategories.map(cat => ({
          id: cat.id,
          label: cat.translations?.[currentLanguage] || cat.translations?.ru || t(cat.id),
          icon: ICON_MAP[cat.icon || 'Package'] || Package
        }))
      : fallbackDiseases
    );

    return { diseases };
  }, [sidebarCategories, currentLanguage, t]);

  return (
    <aside className="hidden lg:block w-64 bg-white border-r-2 border-gray-200 pr-4 py-4">
      
      <div className="space-y-2">
        {/* All diseases (including popular and allProducts) */}
        {diseases.map((disease) => {
          const Icon = disease.icon;
          // "allProducts" should set selectedDisease to null (show all)
          const isAllProducts = disease.id === 'allProducts';
          const isActive = isAllProducts ? !selectedDisease : selectedDisease === disease.id;
          
          return (
            <button
              key={disease.id}
              onClick={() => onSelectDisease(isAllProducts ? null : disease.id)}
              className={`sidebar-category-button w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                isActive
                  ? 'bg-red-600 text-white active'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Icon size={20} />
              <span>{disease.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
