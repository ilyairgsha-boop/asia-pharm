import { ProductList } from './ProductList';

interface HomePageProps {
  selectedCategory: string | null;
  selectedDisease: string | null;
  currentStore: 'china' | 'thailand' | 'vietnam';
  onProductClick?: (product: any) => void;
}

export const HomePage = ({ selectedCategory, selectedDisease, currentStore, onProductClick }: HomePageProps) => {
  // Pass through the selected category and disease without modification
  // The default state is now managed in App.tsx (selectedDisease = 'popular')
  return (
    <ProductList
      selectedCategory={selectedCategory}
      selectedDisease={selectedDisease}
      currentStore={currentStore}
      onProductClick={onProductClick}
    />
  );
};
