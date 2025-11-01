// Категории товаров для Asia Pharm
// Обновлено: 28 октября 2025

import { translations } from './i18n';

// Типы категорий
export type TopMenuCategory = 'ointments' | 'patches' | 'sprays' | 'teas' | 'elixirs' | 'pills' | 'cosmetics';
export type SideMenuCategory = 'popular' | 'allProducts' | 'cold' | 'digestive' | 'skin' | 'joints' | 'heart' | 'liverKidneys' | 'nervous' | 'womensHealth' | 'mensHealth' | 'forChildren' | 'vision' | 'hemorrhoids' | 'oncology' | 'thyroid' | 'lungs';

// Legacy categories (for backward compatibility with old DB records)
export type LegacySideMenuCategory = 'headache' | 'liver' | 'kidneys' | 'eyes';
export type AllSideMenuCategories = SideMenuCategory | LegacySideMenuCategory;

// Верхнее меню (7 категорий - не пересекаются)
// Эти категории определяют ТИП товара
export const topMenuCategories: TopMenuCategory[] = [
  'ointments',    // Мази и бальзамы
  'patches',      // Пластыри
  'sprays',       // Спреи
  'teas',         // Чай
  'elixirs',      // Эликсиры
  'pills',        // Пилюли
  'cosmetics',    // Косметика
];

// Боковое меню (17 категорий - пересекающиеся)
// Эти категории определяют НАЗНАЧЕНИЕ товара (для какого заболевания)
export const sideMenuCategories: SideMenuCategory[] = [
  'popular',       // Популярные товары
  'allProducts',   // Все товары
  'cold',          // Простуда
  'digestive',     // ЖКТ
  'skin',          // Кожа
  'joints',        // Суставы
  'heart',         // Сердце и сосуды
  'liverKidneys',  // Печень и почки
  'nervous',       // Нервная система
  'womensHealth',  // Женское здоровье
  'mensHealth',    // Мужское здоровье
  'forChildren',   // Для детей
  'vision',        // Зрение
  'hemorrhoids',   // Геморрой
  'oncology',      // Онкология
  'thyroid',       // Щитовидная железа
  'lungs',         // Легкие
];

// Функция для получения локализованного названия категории верхнего меню
export function getTopMenuCategoryName(category: TopMenuCategory, language: 'ru' | 'en' | 'zh' | 'vi'): string {
  return translations[language][category] || category;
}

// Функция для получения локализованного названия категории бокового меню
export function getSideMenuCategoryName(category: SideMenuCategory | LegacySideMenuCategory | string, language: 'ru' | 'en' | 'zh' | 'vi'): string {
  return translations[language][category] || category;
}

// Категории верхнего меню для отображения
export const getTopMenuCategoriesForDisplay = (language: 'ru' | 'en' | 'zh' | 'vi') => {
  return topMenuCategories.map(cat => ({
    id: cat,
    name: getTopMenuCategoryName(cat, language),
  }));
};

// Категории бокового меню для отображения
export const getSideMenuCategoriesForDisplay = (language: 'ru' | 'en' | 'zh' | 'vi') => {
  return sideMenuCategories.map(cat => ({
    id: cat,
    name: getSideMenuCategoryName(cat, language),
  }));
};

// Проверка, является ли категория верхнего меню
export const isTopMenuCategory = (category: string): category is TopMenuCategory => {
  return topMenuCategories.includes(category as TopMenuCategory);
};

// Проверка, является ли категория бокового меню
export const isSideMenuCategory = (category: string): category is SideMenuCategory => {
  return sideMenuCategories.includes(category as SideMenuCategory);
};

// Экспорт для обратной совместимости
export const categories = {
  top: topMenuCategories,
  side: sideMenuCategories,
};
