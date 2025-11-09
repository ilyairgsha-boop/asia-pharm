import { useEffect, useState } from 'react';

interface FlyingNumberProps {
  startX: number;
  startY: number;
  onComplete: () => void;
}

export const FlyingNumber = ({ startX, startY, onComplete }: FlyingNumberProps) => {
  const [cartPosition, setCartPosition] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Get cart icon position
    const cartIcon = document.querySelector('[data-cart-icon]');
    if (cartIcon) {
      const rect = cartIcon.getBoundingClientRect();
      setCartPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
      
      // Start animation after position is set
      setTimeout(() => setIsAnimating(true), 10);
      
      // Call onComplete after animation duration
      setTimeout(() => {
        onComplete();
      }, 800);
    }
  }, [onComplete]);

  return (
    <div
      className="flying-number fixed pointer-events-none z-[100] bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all duration-[800ms] ease-out"
      style={{
        left: 0,
        top: 0,
        transform: isAnimating 
          ? `translate(${cartPosition.x}px, ${cartPosition.y}px) scale(0.5)`
          : `translate(${startX}px, ${startY}px) scale(1)`,
        opacity: isAnimating ? 0 : 1
      }}
    >
      <span className="flying-number-text text-sm font-semibold">1</span>
    </div>
  );
};
