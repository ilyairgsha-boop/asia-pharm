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
        className="loyalty-back-button mb-4 text-red-600 hover:underline"
      >
        ← {t('backToHome')}
      </button>

      <div className="loyalty-program-container bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <Gift className="loyalty-icon text-red-600" size={32} />
          <h2 className="text-gray-800">{t('loyaltyProgram')}</h2>
        </div>

        <div className="prose max-w-none">
          <h3 className="text-gray-800">{t('loyaltyProgramTitle')}</h3>
          <p className="text-gray-700">{t('loyaltyProgramDescription')}</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
            {/* Tier 1 - Basic */}
            <div className="loyalty-tier-card bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="loyalty-tier-badge w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white">1</div>
                <h4 className="text-gray-800 m-0 text-lg">{t('tierBasic')}</h4>
              </div>
              <div className="loyalty-tier-info mt-3 p-3 bg-white rounded border border-gray-300">
                <p className="m-0 text-gray-600 text-sm">{t('lifetimeTotal')}:</p>
                <p className="m-0 text-gray-800 mt-1"><strong>0 - 49 999 ₽</strong></p>
                <p className="loyalty-tier-percent m-0 text-green-600 mt-2 text-xl"><strong>3%</strong></p>
              </div>
            </div>

            {/* Tier 2 - Silver */}
            <div className="loyalty-tier-card bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="loyalty-tier-badge w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">2</div>
                <h4 className="text-gray-800 m-0 text-lg">{t('tierSilver')}</h4>
              </div>
              <div className="loyalty-tier-info mt-3 p-3 bg-white rounded border border-blue-300">
                <p className="m-0 text-gray-600 text-sm">{t('lifetimeTotal')}:</p>
                <p className="m-0 text-gray-800 mt-1"><strong>≥ 50 000 ₽</strong></p>
                <p className="loyalty-tier-percent m-0 text-blue-600 mt-2 text-xl"><strong>5%</strong></p>
              </div>
            </div>

            {/* Tier 3 - Gold */}
            <div className="loyalty-tier-card bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-lg border border-yellow-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="loyalty-tier-badge w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white">3</div>
                <h4 className="text-gray-800 m-0 text-lg">{t('tierGold')}</h4>
              </div>
              <div className="loyalty-tier-info mt-3 p-3 bg-white rounded border border-yellow-400">
                <p className="m-0 text-gray-600 text-sm">{t('lifetimeTotal')}:</p>
                <p className="m-0 text-gray-800 mt-1"><strong>≥ 100 000 ₽</strong></p>
                <p className="loyalty-tier-percent m-0 text-yellow-600 mt-2 text-xl"><strong>7%</strong></p>
              </div>
            </div>

            {/* Tier 4 - Platinum */}
            <div className="loyalty-tier-card bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-lg border-2 border-red-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="loyalty-tier-badge w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white">4</div>
                <h4 className="text-gray-800 m-0 text-lg">{t('tierPlatinum')}</h4>
              </div>
              <div className="loyalty-tier-info mt-3 p-3 bg-white rounded border border-red-400">
                <p className="m-0 text-gray-600 text-sm">{t('lifetimeTotal')}:</p>
                <p className="m-0 text-gray-800 mt-1"><strong>≥ 200 000 ₽</strong></p>
                <p className="loyalty-tier-percent m-0 text-red-600 mt-2 text-xl"><strong>10%</strong></p>
              </div>
            </div>
          </div>

          <h3 className="text-gray-800">{t('howItWorks')}</h3>
          <ul className="text-gray-700">
            <li><strong>{t('loyaltyProgressiveSystem')}</strong></li>
            <li><strong>{t('loyaltyProgressiveCashback')}</strong></li>
            <li>{t('loyaltyRule1')}</li>
            <li>{t('loyaltyRule2')}</li>
            <li>{t('loyaltyRule3')}</li>
            <li>{t('loyaltyRule4')}</li>
            <li className="text-red-600"><strong>{t('samplesNoLoyalty')}</strong></li>
          </ul>

          <div className="loyalty-example-card bg-blue-50 p-6 rounded-lg border border-blue-200 mt-6">
            <h4 className="text-gray-800 mt-0">{t('example')}:</h4>
            <div className="space-y-3">
              <div>
                <p className="text-gray-700 m-0 mb-2"><strong>{t('exampleProgressiveTitle')}</strong></p>
                <p className="text-gray-600 text-sm m-0">{t('exampleProgressiveDescription')}</p>
                <p className="text-gray-600 text-sm m-0 mt-1">• {t('exampleProgressiveLine1')}</p>
                <p className="text-gray-600 text-sm m-0">• {t('exampleProgressiveLine2')}</p>
                <p className="loyalty-example-total text-green-600 m-0 mt-2"><strong>{t('exampleProgressiveTotal')}</strong></p>
              </div>
              <div className="pt-3 border-t border-blue-200">
                <p className="text-gray-700 m-0 mb-2"><strong>{t('exampleHighLevelTitle')}</strong></p>
                <p className="text-gray-600 text-sm m-0">{t('exampleHighLevelDescription')}</p>
                <p className="text-gray-600 text-sm m-0 mt-1">• {t('exampleHighLevelLine1')}</p>
                <p className="text-gray-600 text-sm m-0">• {t('exampleHighLevelLine2')}</p>
                <p className="loyalty-example-total text-green-600 m-0 mt-2"><strong>{t('exampleHighLevelTotal')}</strong></p>
              </div>
            </div>
          </div>

          <div className="loyalty-note-card mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="m-0 text-sm text-gray-600">
              <strong>{t('note')}:</strong> {t('loyaltyNote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
