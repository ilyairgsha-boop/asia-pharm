import { useLanguage } from '../contexts/LanguageContext';

interface CategoryMenuProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  currentStore?: 'china' | 'thailand' | 'vietnam';
}

export const CategoryMenu = ({ selectedCategory, onSelectCategory, currentStore }: CategoryMenuProps) => {
  const { t } = useLanguage();

  const baseCategories = [
    { id: 'all', label: t('allProducts') },
    { id: 'ointments', label: t('ointments') },
    { id: 'patches', label: t('patches') },
    { id: 'elixirs', label: t('elixirs') },
    { id: 'capsules', label: t('capsules') },
    { id: 'teas', label: t('teas') },
    { id: 'oils', label: t('oils') },
  ];
  
  // Добавляем категорию "Пробники" только для магазина Китай
  const categories = currentStore === 'china' 
    ? [...baseCategories, { id: 'samples', label: t('samples') }, { id: 'other', label: t('other') }]
    : [...baseCategories, { id: 'other', label: t('other') }];

  return (
    <nav className="bg-white border-b-2 border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-2">
          <span className="text-gray-600 mr-2">{t('categories')}:</span>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() =>
                onSelectCategory(category.id === 'all' ? null : category.id)
              }
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                (category.id === 'all' && !selectedCategory) ||
                selectedCategory === category.id
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};
