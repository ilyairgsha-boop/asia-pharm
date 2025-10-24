import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Save, Upload } from 'lucide-react';

export const PaymentSettings = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({
    cardNumber: '2202 2004 3395 7386',
    contractNumber: '505 518 5408',
    qrCodeUrl: '',
  });

  const handleSave = async () => {
    // В реальном приложении здесь будет сохранение в базу данных
    // Сейчас просто показываем успешное сообщение
    alert(t('saveSuccess'));
    console.log('Payment settings saved:', settings);
  };

  const handleQRUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // В реальном приложении здесь будет загрузка в хранилище
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, qrCodeUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-gray-800 mb-6">{t('paymentSettings')}</h3>

      <div className="space-y-6">
        {/* Card Number */}
        <div>
          <label className="block text-gray-700 mb-2">
            {t('cardNumber')} {t('sberbankParenthesis')}
          </label>
          <input
            type="text"
            value={settings.cardNumber}
            onChange={(e) => setSettings({ ...settings, cardNumber: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
          />
          <p className="text-sm text-gray-500 mt-1">
            {t('cardNumberDescription')}
          </p>
        </div>

        {/* Contract Number */}
        <div>
          <label className="block text-gray-700 mb-2">
            {t('contractNumber')} {t('tbankParenthesis')}
          </label>
          <input
            type="text"
            value={settings.contractNumber}
            onChange={(e) => setSettings({ ...settings, contractNumber: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
          />
          <p className="text-sm text-gray-500 mt-1">
            {t('contractNumberDescription')}
          </p>
        </div>

        {/* QR Code */}
        <div>
          <label className="block text-gray-700 mb-2">
            {t('qrCodeImage')} {t('sbpParenthesis')}
          </label>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Upload size={20} />
              <span>{t('uploadQRCode')}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleQRUpload}
                className="hidden"
              />
            </label>
          </div>
          {settings.qrCodeUrl && (
            <div className="mt-4">
              <img
                src={settings.qrCodeUrl}
                alt="QR Code"
                className="w-48 h-48 object-contain border rounded"
              />
            </div>
          )}
          <p className="text-sm text-gray-500 mt-1">
            {t('qrCodeDescription')}
          </p>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t">
          <button
            onClick={handleSave}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Save size={20} />
            <span>{t('save')}</span>
          </button>
        </div>

        {/* Info Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
          <strong>ℹ️ {t('note')}:</strong> {t('paymentSettingsNote')}
        </div>
      </div>
    </div>
  );
};
