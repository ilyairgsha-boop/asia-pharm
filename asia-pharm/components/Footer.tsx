import { useLanguage } from '../contexts/LanguageContext';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer = ({ onNavigate }: FooterProps) => {
  const { t } = useLanguage();

  return (
    <footer className="bg-white border-t-2 border-gray-200 mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <h3 className="text-gray-800 mb-3">{t('information')}</h3>
            <ul className="space-y-2 text-gray-600">
              <li>
                <button 
                  onClick={() => onNavigate('privacy-policy')}
                  className="hover:text-red-600 transition-colors"
                >
                  {t('privacyPolicy')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('terms-of-service')}
                  className="hover:text-red-600 transition-colors"
                >
                  {t('termsOfService')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('loyalty-program')}
                  className="hover:text-red-600 transition-colors"
                >
                  {t('loyaltyProgram')}
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-gray-800 mb-3">{t('contacts')}</h3>
            <ul className="space-y-2 text-gray-600">
              <li>{t('contactEmail')}: info@asia-pharm.ru</li>
              <li>{t('contactPhone')}: +7 (xxx) xxx-xx-xx</li>
            </ul>
          </div>
          <div>
            <h3 className="text-gray-800 mb-3">{t('stores')}</h3>
            <ul className="space-y-2 text-gray-600">
              <li>{t('chinaStore')}</li>
              <li>{t('thailandStore')}</li>
              <li>{t('vietnamStore')}</li>
            </ul>
          </div>
        </div>
        <div className="text-center text-gray-600 mt-8 pt-8 border-t border-gray-200">
          <p>© 2025 Asia-Pharm.ru. {t('siteName')}.</p>
        </div>
      </div>
    </footer>
  );
};
