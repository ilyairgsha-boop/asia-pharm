import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Gift, TrendingUp } from 'lucide-react';

interface LoyaltyProgramProps {
  onNavigate: (page: string) => void;
}

export const LoyaltyProgram = ({ onNavigate }: LoyaltyProgramProps) => {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => onNavigate('home')}
        className="mb-4 text-red-600 hover:underline"
      >
        ← {t('backToHome')}
      </button>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <Gift className="text-red-600" size={32} />
          <h2 className="text-gray-800">{t('loyaltyProgram')}</h2>
        </div>

        <div className="prose max-w-none">
          <h3 className="text-gray-800">{t('loyaltyProgramTitle')}</h3>
          <p className="text-gray-700">{t('loyaltyProgramDescription')}</p>

          <div className="grid md:grid-cols-2 gap-6 my-6">
            {/* Tier 1 */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="text-gray-600" size={24} />
                <h4 className="text-gray-800 m-0">{t('loyaltyTier1Title')}</h4>
              </div>
              <p className="text-gray-700 m-0">
                {t('loyaltyTier1Description')}
              </p>
              <div className="mt-4 p-4 bg-white rounded border border-gray-300">
                <p className="m-0 text-gray-600">{t('monthlyOrders')}: &lt; 10 000 ₽</p>
                <p className="m-0 text-green-600 mt-2"><strong>5% кэшбэк</strong></p>
              </div>
            </div>

            {/* Tier 2 */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border-2 border-red-300">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="text-red-600" size={24} />
                <h4 className="text-gray-800 m-0">{t('loyaltyTier2Title')}</h4>
              </div>
              <p className="text-gray-700 m-0">
                {t('loyaltyTier2Description')}
              </p>
              <div className="mt-4 p-4 bg-white rounded border border-red-300">
                <p className="m-0 text-gray-600">{t('monthlyOrders')}: ≥ 10 000 ₽</p>
                <p className="m-0 text-red-600 mt-2"><strong>10% кэшбэк</strong></p>
              </div>
            </div>
          </div>

          <h3 className="text-gray-800">{t('howItWorks')}</h3>
          <ul className="text-gray-700">
            <li>{t('loyaltyRule1')}</li>
            <li>{t('loyaltyRule2')}</li>
            <li>{t('loyaltyRule3')}</li>
            <li>{t('loyaltyRule4')}</li>
            <li>{t('loyaltyRule5')}</li>
            <li className="text-red-600"><strong>{t('samplesNoLoyalty')}</strong></li>
          </ul>

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mt-6">
            <h4 className="text-gray-800 mt-0">{t('example')}:</h4>
            <p className="text-gray-700 m-0">
              {t('loyaltyExample')}
            </p>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="m-0 text-sm text-gray-600">
              <strong>{t('note')}:</strong> {t('loyaltyNote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
