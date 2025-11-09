import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer = ({ onNavigate }: FooterProps) => {
  const { t } = useLanguage();
  const { currentTheme } = useTheme();

  return (
    <footer className="bg-white border-t-[1.7px] border-gray-200 mt-12 relative overflow-hidden">
      <div className="container mx-auto px-[10px] md:px-4 py-[26px] md:py-8">
        
        {/* DESKTOP VERSION - 3 columns */}
        <div className="hidden md:grid grid-cols-3 gap-8 text-sm">
          {/* Column 1 - Information */}
          <div>
            <h3 className="text-[#1e2939] mb-3 text-[16px] leading-[15px] tracking-[0.04px]">{t('information')}</h3>
            <ul className="space-y-2 text-[#4a5565]">
              <li className="pl-[10px]">
                <button 
                  onClick={() => onNavigate('privacy-policy')}
                  className="hover:text-red-600 transition-colors text-[16px] leading-[15px] tracking-[0.04px]"
                >
                  {t('privacyPolicy')}
                </button>
              </li>
              <li className="pl-[10px]">
                <button 
                  onClick={() => onNavigate('terms-of-service')}
                  className="hover:text-red-600 transition-colors text-[16px] leading-[15px] tracking-[0.04px]"
                >
                  {t('termsOfService')}
                </button>
              </li>
              <li className="pl-[10px]">
                <button 
                  onClick={() => onNavigate('loyalty-program')}
                  className="hover:text-red-600 transition-colors text-[16px] leading-[15px] tracking-[0.04px]"
                >
                  {t('loyaltyProgram')}
                </button>
              </li>
            </ul>
          </div>
          
          {/* Column 2 - Contacts */}
          <div>
            <h3 className="text-[#1e2939] mb-3 text-[16px] leading-[15px] tracking-[0.04px]">{t('contacts')}</h3>
            <ul className="space-y-2 text-[#4a5565]">
              <li className="pl-[10px] text-[16px] leading-[15px] tracking-[0.04px]">{t('contactEmail')}: info@asia-pharm.com</li>
              <li className="pl-[10px] text-[16px] leading-[15px] tracking-[0.04px]">{t('contactPhone')}: +7 (991) 537-00-11</li>
            </ul>
          </div>
          
          {/* Column 3 - Stores */}
          <div>
            <h3 className="text-[#1e2939] mb-3 text-[16px] leading-[15px] tracking-[0.04px]">{t('stores')}</h3>
            <ul className="space-y-2 text-[#4a5565]">
              <li className="pl-[10px] text-[16px] leading-[15px] tracking-[0.04px]">{t('chinaStore')}</li>
              <li className="pl-[10px] text-[16px] leading-[15px] tracking-[0.04px]">{t('thailandStore')}</li>
              <li className="pl-[10px] text-[16px] leading-[15px] tracking-[0.04px]">{t('vietnamStore')}</li>
            </ul>
          </div>
        </div>

        {/* MOBILE VERSION - 1 column with links */}
        <div className="md:hidden">
          {/* Links in one column */}
          <div>
            <ul className="space-y-[10px] text-[#4a5565]">
              <li className="pl-[10px]">
                <button 
                  onClick={() => onNavigate('privacy-policy')}
                  className="hover:text-red-600 transition-colors text-[16px] leading-[15px] tracking-[0.04px]"
                >
                  {t('privacyPolicy')}
                </button>
              </li>
              <li className="pl-[10px]">
                <button 
                  onClick={() => onNavigate('terms-of-service')}
                  className="hover:text-red-600 transition-colors text-[16px] leading-[15px] tracking-[0.04px]"
                >
                  {t('termsOfService')}
                </button>
              </li>
              <li className="pl-[10px]">
                <button 
                  onClick={() => onNavigate('loyalty-program')}
                  className="hover:text-red-600 transition-colors text-[16px] leading-[15px] tracking-[0.04px]"
                >
                  {t('loyaltyProgram')}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-[#4a5565] mt-[26px] pt-[27px] border-t border-gray-200">
          <p className="text-[13px] leading-[19.5px] tracking-[-0.076px]">© 2025 Asia-Pharm.ru. {t('siteName')}.</p>
        </div>
      </div>

      {/* Summer Grass Decoration */}
      {currentTheme === 'summer' && (
        <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none overflow-hidden">
          <div className="flex justify-around items-end h-full">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="text-green-600"
                style={{
                  fontSize: `${20 + Math.random() * 20}px`,
                  transform: `rotate(${-10 + Math.random() * 20}deg)`,
                  opacity: 0.7 + Math.random() * 0.3,
                }}
              >
                🌿
              </div>
            ))}
          </div>
        </div>
      )}
    </footer>
  );
};
