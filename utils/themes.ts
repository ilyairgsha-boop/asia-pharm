// Тематические цветовые схемы и декорации для праздников

export type ThemeType = 
  | 'default' 
  | 'black-friday' 
  | 'new-year' 
  | 'womens-day' 
  | 'defenders-day' 
  | 'autumn' 
  | 'summer';

export interface ThemeConfig {
  id: ThemeType;
  name: {
    ru: string;
    en: string;
    zh: string;
    vi: string;
  };
  description: {
    ru: string;
    en: string;
    zh: string;
    vi: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    border: string;
  };
  decorations?: {
    type: 'snow' | 'ribbon' | 'flowers' | 'leaves' | 'stars';
    enabled: boolean;
  };
}

export const themes: Record<ThemeType, ThemeConfig> = {
  default: {
    id: 'default',
    name: {
      ru: 'Стандартная',
      en: 'Default',
      zh: '默认',
      vi: 'Mặc định',
    },
    description: {
      ru: 'Классическая красно-белая тема',
      en: 'Classic red and white theme',
      zh: '经典红白主题',
      vi: 'Chủ đề đỏ trắng cổ điển',
    },
    colors: {
      primary: '#dc2626',
      secondary: '#991b1b',
      accent: '#f87171',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#1f2937',
      border: '#e5e7eb',
    },
  },
  'black-friday': {
    id: 'black-friday',
    name: {
      ru: 'Черная пятница',
      en: 'Black Friday',
      zh: '黑色星期五',
      vi: 'Thứ Sáu Đen',
    },
    description: {
      ru: 'Черно-бело-желтая тема для главной распродажи года',
      en: 'Black, white and yellow theme for the biggest sale',
      zh: '黑白黄主题为最大促销',
      vi: 'Chủ đề đen trắng vàng cho đợt giảm giá lớn nhất',
    },
    colors: {
      primary: '#fbbf24',
      secondary: '#eab308',
      accent: '#fcd34d',
      background: '#000000',
      surface: '#000000',
      text: '#ffffff',
      border: '#333333',
    },
  },
  'new-year': {
    id: 'new-year',
    name: {
      ru: 'Новый год',
      en: 'New Year',
      zh: '新年',
      vi: 'Năm Mới',
    },
    description: {
      ru: 'Новогодняя атмосфера со снегом',
      en: 'New Year atmosphere with snow',
      zh: '新年氛围与雪花',
      vi: 'Không khí năm mới với tuyết',
    },
    colors: {
      primary: '#dc2626',
      secondary: '#991b1b',
      accent: '#f87171',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#1f2937',
      border: '#e5e7eb',
    },
    decorations: {
      type: 'snow',
      enabled: true,
    },
  },
  'womens-day': {
    id: 'womens-day',
    name: {
      ru: '8 Марта',
      en: "Women's Day",
      zh: '妇女节',
      vi: 'Ngày Phụ Nữ',
    },
    description: {
      ru: 'Весенняя тема с тюльпанами',
      en: 'Spring theme with tulips',
      zh: '春天主题与郁金香',
      vi: 'Chủ đề mùa xuân với hoa tulip',
    },
    colors: {
      primary: '#dc2626',
      secondary: '#991b1b',
      accent: '#f87171',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#1f2937',
      border: '#e5e7eb',
    },
    decorations: {
      type: 'flowers',
      enabled: true,
    },
  },
  'defenders-day': {
    id: 'defenders-day',
    name: {
      ru: '23 Февраля',
      en: "Defender's Day",
      zh: '祖国保卫者日',
      vi: 'Ngày Bảo Vệ Tổ Quốc',
    },
    description: {
      ru: 'Патриотическая тема с георгиевской лентой',
      en: 'Patriotic theme with St. George ribbon',
      zh: '爱国主题与乔治丝带',
      vi: 'Chủ đề yêu nước với ruy băng St. George',
    },
    colors: {
      primary: '#dc2626',
      secondary: '#991b1b',
      accent: '#f87171',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#1f2937',
      border: '#e5e7eb',
    },
    decorations: {
      type: 'ribbon',
      enabled: true,
    },
  },
  autumn: {
    id: 'autumn',
    name: {
      ru: 'Осень',
      en: 'Autumn',
      zh: '秋天',
      vi: 'Mùa Thu',
    },
    description: {
      ru: 'Осенняя тема с падающими листьями',
      en: 'Autumn theme with falling leaves',
      zh: '秋天主题与落叶',
      vi: 'Chủ đề mùa thu với lá rơi',
    },
    colors: {
      primary: '#dc2626',
      secondary: '#991b1b',
      accent: '#f87171',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#1f2937',
      border: '#e5e7eb',
    },
    decorations: {
      type: 'leaves',
      enabled: true,
    },
  },
  summer: {
    id: 'summer',
    name: {
      ru: 'Лето',
      en: 'Summer',
      zh: '夏天',
      vi: 'Mùa Hè',
    },
    description: {
      ru: 'Летняя тема с солнцем',
      en: 'Summer theme with sunshine',
      zh: '夏季主题与阳光',
      vi: 'Chủ đề mùa hè với ánh nắng',
    },
    colors: {
      primary: '#dc2626',
      secondary: '#991b1b',
      accent: '#f87171',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#1f2937',
      border: '#e5e7eb',
    },
  },
};

export const getTheme = (themeId: ThemeType): ThemeConfig => {
  return themes[themeId] || themes.default;
};

export const applyTheme = (theme: ThemeConfig) => {
  const root = document.documentElement;
  
  // Устанавливаем CSS переменные темы
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-secondary', theme.colors.secondary);
  root.style.setProperty('--color-accent', theme.colors.accent);
  root.style.setProperty('--color-background', theme.colors.background);
  root.style.setProperty('--color-surface', theme.colors.surface);
  root.style.setProperty('--color-text', theme.colors.text);
  root.style.setProperty('--color-border', theme.colors.border);
  
  // Применяем основные цвета к body
  document.body.style.backgroundColor = theme.colors.background;
  document.body.style.color = theme.colors.text;
  
  // Добавляем класс темы к body для дополнительных стилей
  document.body.className = document.body.className
    .split(' ')
    .filter(c => !c.startsWith('theme-'))
    .concat(`theme-${theme.id}`)
    .join(' ');
};
