import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getTheme } from '../utils/themes';

export const ThemeDecorations = () => {
  const { currentTheme } = useTheme();
  const theme = getTheme(currentTheme);

  if (!theme.decorations?.enabled) {
    return null;
  }

  switch (theme.decorations.type) {
    case 'snow':
      return <SnowEffect />;
    case 'ribbon':
      return <RibbonDecoration />;
    case 'flowers':
      return <FlowersDecoration />;
    case 'leaves':
      return <LeavesDecoration />;
    default:
      return null;
  }
};

// Снег для Нового года - падает 30 сек, перерыв 3 минуты
const SnowEffect = () => {
  const [snowflakes, setSnowflakes] = useState<Array<{ id: number; left: number; delay: number; duration: number }>>([]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const flakes = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 5 + Math.random() * 10,
    }));
    setSnowflakes(flakes);

    // Цикл: 30 секунд снег, 3 минуты пауза
    const interval = setInterval(() => {
      setIsActive(false);
      setTimeout(() => {
        setIsActive(true);
      }, 180000); // 3 минуты = 180 секунд
    }, 30000); // 30 секунд

    return () => clearInterval(interval);
  }, []);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake absolute text-white opacity-70"
          style={{
            left: `${flake.left}%`,
            animationDelay: `${flake.delay}s`,
            animationDuration: `${flake.duration}s`,
            fontSize: `${10 + Math.random() * 10}px`,
          }}
        >
          ❄
        </div>
      ))}
      <style>{`
        .snowflake {
          animation: fall linear infinite;
        }
        @keyframes fall {
          from {
            transform: translateY(-10vh) rotate(0deg);
          }
          to {
            transform: translateY(110vh) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

// Георгиевская лента для 23 февраля
const RibbonDecoration = () => {
  return (
    <>
      {/* Левый верхний угол */}
      <div className="fixed top-0 left-0 z-40 w-40 h-40 pointer-events-none">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <pattern id="georgeRibbonLeft" x="0" y="0" width="6" height="100" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="2" height="100" fill="#f97316"/>
              <rect x="2" y="0" width="2" height="100" fill="#000000"/>
              <rect x="4" y="0" width="2" height="100" fill="#f97316"/>
            </pattern>
          </defs>
          <g transform="rotate(-45 100 100)">
            <rect x="80" y="0" width="40" height="200" fill="url(#georgeRibbonLeft)"/>
          </g>
        </svg>
        {/* Звезда */}
        <div className="absolute top-6 left-6 text-red-600 text-4xl animate-pulse" style={{ animationDuration: '2s' }}>⭐</div>
      </div>

      {/* Правый верхний угол */}
      <div className="fixed top-0 right-0 z-40 w-40 h-40 pointer-events-none">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <pattern id="georgeRibbonRight" x="0" y="0" width="6" height="100" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="2" height="100" fill="#f97316"/>
              <rect x="2" y="0" width="2" height="100" fill="#000000"/>
              <rect x="4" y="0" width="2" height="100" fill="#f97316"/>
            </pattern>
          </defs>
          <g transform="rotate(45 100 100)">
            <rect x="80" y="0" width="40" height="200" fill="url(#georgeRibbonRight)"/>
          </g>
        </svg>
        {/* Звезда */}
        <div className="absolute top-6 right-6 text-red-600 text-4xl animate-pulse" style={{ animationDuration: '2s' }}>⭐</div>
      </div>
    </>
  );
};

// Тюльпаны для 8 марта
const FlowersDecoration = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {/* Нижние углы */}
      <div className="absolute bottom-0 left-0 text-8xl opacity-80 transform -rotate-12">🌷</div>
      <div className="absolute bottom-0 left-20 text-6xl opacity-70 transform rotate-6">🌷</div>
      <div className="absolute bottom-0 right-0 text-8xl opacity-80 transform rotate-12">🌷</div>
      <div className="absolute bottom-0 right-20 text-6xl opacity-70 transform -rotate-6">🌷</div>
      
      {/* Верхние углы (меньше) */}
      <div className="absolute top-4 left-4 text-4xl opacity-60 transform rotate-45">🌸</div>
      <div className="absolute top-4 right-4 text-4xl opacity-60 transform -rotate-45">🌸</div>
    </div>
  );
};

// Осенние листья - падают 30 сек, перерыв 30 сек
const LeavesDecoration = () => {
  const [leaves, setLeaves] = useState<Array<{ id: number; left: number; delay: number; duration: number; emoji: string }>>([]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const leafEmojis = ['🍂', '🍁', '🍃'];
    const items = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 7,
      emoji: leafEmojis[Math.floor(Math.random() * leafEmojis.length)],
    }));
    setLeaves(items);

    // Цикл: 30 секунд листья, 30 секунд пауза
    const interval = setInterval(() => {
      setIsActive(prev => !prev);
    }, 30000); // 30 секунд

    return () => clearInterval(interval);
  }, []);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="falling-leaf absolute text-4xl"
          style={{
            left: `${leaf.left}%`,
            animationDelay: `${leaf.delay}s`,
            animationDuration: `${leaf.duration}s`,
          }}
        >
          {leaf.emoji}
        </div>
      ))}
      <style>{`
        .falling-leaf {
          animation: fall-wiggle linear infinite;
        }
        @keyframes fall-wiggle {
          0% {
            transform: translateY(-10vh) rotate(0deg) translateX(0);
          }
          25% {
            transform: translateY(25vh) rotate(90deg) translateX(20px);
          }
          50% {
            transform: translateY(50vh) rotate(180deg) translateX(0);
          }
          75% {
            transform: translateY(75vh) rotate(270deg) translateX(-20px);
          }
          100% {
            transform: translateY(110vh) rotate(360deg) translateX(0);
          }
        }
      `}</style>
    </div>
  );
};
