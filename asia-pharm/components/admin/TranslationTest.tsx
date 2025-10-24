import { useLanguage } from '../../contexts/LanguageContext';

export const TranslationTest = () => {
  const { language, t } = useLanguage();
  
  const keysToTest = [
    'saveSettings',
    'enableChatSupport',
    'smtpSettings',
    'smtpDescription',
    'ordersToday',
    'revenueToday',
    'newCustomers',
    'loyaltyPointsIssued',
    'issuedToday',
    'forToday',
    'fromYesterday',
    'storeStatistics',
    'orders',
    'storeChina',
    'storeThailand',
    'storeVietnam',
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl mb-4">Translation Test - Current Language: {language}</h2>
      <div className="space-y-2">
        {keysToTest.map((key) => (
          <div key={key} className="flex gap-4 p-2 border-b">
            <span className="text-gray-600 w-48">{key}:</span>
            <span className="text-gray-900">{t(key)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
