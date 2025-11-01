import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { createClient } from '../utils/supabase/client';
import { Copy, Check, CreditCard, QrCode, Building2, ArrowLeft, CheckCircle } from 'lucide-react';

interface PaymentInfoProps {
  onNavigate: (page: string) => void;
  orderNumber?: string;
  paymentMethod?: string;
  totalAmount?: number;
}

export const PaymentInfo = ({ onNavigate, orderNumber: propOrderNumber, paymentMethod: propPaymentMethod, totalAmount: propTotalAmount }: PaymentInfoProps) => {
  const { t } = useLanguage();
  const { accessToken } = useAuth();
  const [orderNumber, setOrderNumber] = useState(propOrderNumber || '');
  const [paymentMethod, setPaymentMethod] = useState(propPaymentMethod || 'card');
  const [totalAmount, setTotalAmount] = useState(propTotalAmount || 0);
  const [copiedCard, setCopiedCard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);

  useEffect(() => {
    // Load payment settings
    loadPaymentSettings();
    
    // If we don't have order info from props, try to get it from localStorage
    if (!propOrderNumber) {
      const savedOrder = localStorage.getItem('lastOrderPayment');
      if (savedOrder) {
        try {
          const parsed = JSON.parse(savedOrder);
          setOrderNumber(parsed.orderNumber || '');
          setPaymentMethod(parsed.paymentMethod || 'card');
          setTotalAmount(parsed.totalAmount || 0);
        } catch (e) {
          console.error('Error parsing saved order:', e);
        }
      }
    }
    setLoading(false);
  }, [propOrderNumber]);

  const loadPaymentSettings = async () => {
    try {
      const supabase = createClient();
      
      // Fetch payment settings from kv_store table
      const { data, error } = await supabase
        .from('kv_store_a75b5353')
        .select('value')
        .eq('key', 'setting:payment')
        .maybeSingle();

      if (error) {
        console.warn('⚠️ No payment settings found, using defaults:', error);
        // Use default settings
        setPaymentSettings({
          cardNumber: "2202 2004 3395 7386",
          contractNumber: "505 518 5408",
          qrCodeUrl: null
        });
      } else if (data?.value) {
        setPaymentSettings(data.value);
        console.log('✅ Payment settings loaded:', data.value);
      } else {
        // Use defaults if no data
        setPaymentSettings({
          cardNumber: "2202 2004 3395 7386",
          contractNumber: "505 518 5408",
          qrCodeUrl: null
        });
      }
    } catch (error) {
      console.error('❌ Error loading payment settings:', error);
      // Use defaults on error
      setPaymentSettings({
        cardNumber: "2202 2004 3395 7386",
        contractNumber: "505 518 5408",
        qrCodeUrl: null
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">{t('loading') || 'Загрузка...'}</div>
      </div>
    );
  }

  if (!orderNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{t('orderNotFound') || 'Информация о заказе не найдена'}</p>
          <button
            onClick={() => onNavigate('home')}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            {t('backToHome')}
          </button>
        </div>
      </div>
    );
  }

  const cardNumber = paymentSettings?.cardNumber || "2202 2004 3395 7386";
  const contractNumber = paymentSettings?.contractNumber || "505 518 5408";
  const qrCodeUrl = paymentSettings?.qrCodeUrl || null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <button
          onClick={() => onNavigate('profile')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft size={20} />
          {t('backToProfile')}
        </button>

        {/* Success Message */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="text-green-600" size={32} />
            <h1 className="text-2xl text-green-800">{t('orderPlacedSuccessfully')}</h1>
          </div>
          <p className="text-green-700">
            {t('followPaymentInstructions')}
          </p>
        </div>

        {/* Order Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl text-gray-800 mb-4">{t('orderInformation')}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">{t('orderNumber')}:</span>
              <div className="text-2xl text-gray-800 mt-1">{orderNumber}</div>
            </div>
            <div>
              <span className="text-gray-600">{t('finalTotal')}:</span>
              <div className="text-2xl text-red-600 mt-1">{totalAmount.toLocaleString()} ₽</div>
            </div>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl text-gray-800 mb-4">{t('paymentMethod')}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Card Transfer */}
            <button
              onClick={() => setPaymentMethod('card')}
              className={`flex flex-col items-center p-4 border-2 rounded-lg transition-all ${
                paymentMethod === 'card'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-red-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                paymentMethod === 'card' ? 'bg-red-500' : 'bg-red-100'
              }`}>
                <CreditCard
                  className={paymentMethod === 'card' ? 'text-white' : 'text-red-600'}
                  size={24}
                />
              </div>
              <div className="text-center">
                <div className="text-gray-800 text-sm">{t('cardTransfer')}</div>
                <div className="text-xs text-gray-600 mt-1">{t('sberbank')}</div>
              </div>
            </button>

            {/* QR Code */}
            <button
              onClick={() => setPaymentMethod('qr')}
              className={`flex flex-col items-center p-4 border-2 rounded-lg transition-all ${
                paymentMethod === 'qr'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                paymentMethod === 'qr' ? 'bg-blue-500' : 'bg-blue-100'
              }`}>
                <QrCode
                  className={paymentMethod === 'qr' ? 'text-white' : 'text-blue-600'}
                  size={24}
                />
              </div>
              <div className="text-center">
                <div className="text-gray-800 text-sm">{t('paymentByQrCode')}</div>
                <div className="text-xs text-gray-600 mt-1">{t('sbp')}</div>
              </div>
            </button>

            {/* T-Bank */}
            <button
              onClick={() => setPaymentMethod('tbank')}
              className={`flex flex-col items-center p-4 border-2 rounded-lg transition-all ${
                paymentMethod === 'tbank'
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-gray-200 hover:border-yellow-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                paymentMethod === 'tbank' ? 'bg-yellow-400' : 'bg-yellow-100'
              }`}>
                <Building2
                  className={paymentMethod === 'tbank' ? 'text-gray-900' : 'text-yellow-600'}
                  size={24}
                />
              </div>
              <div className="text-center">
                <div className="text-gray-800 text-sm">{t('paymentByTBank')}</div>
                <div className="text-xs text-gray-600 mt-1">{t('byContract')}</div>
              </div>
            </button>
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Card Payment */}
          {paymentMethod === 'card' && (
            <div className="space-y-6">
              <h2 className="text-xl text-gray-800">{t('cardTransferTitle')}</h2>
              
              <div className="border-2 border-red-200 rounded-lg p-6 bg-red-50">
                <label className="block text-sm text-gray-600 mb-3">{t('cardNumber')}</label>
                <div className="flex items-center gap-4">
                  <div className="text-3xl text-gray-800 tracking-wider flex-1">
                    {cardNumber}
                  </div>
                  <button
                    onClick={() => copyToClipboard(cardNumber)}
                    className="p-3 hover:bg-red-100 rounded-lg transition-colors"
                    title="Копировать"
                  >
                    {copiedCard ? (
                      <Check size={24} className="text-green-600" />
                    ) : (
                      <Copy size={24} className="text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                <p className="text-gray-800">
                  <strong>⚠️ {t('paymentImportantNote')}</strong>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700">
                  ✅ {t('afterPaymentProcessing')}
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg text-gray-800 mb-4">📱 {t('paymentInstructions')}:</h3>
                <ol className="list-decimal list-inside space-y-3 text-gray-700">
                  <li>{t('cardTransferStep1')}</li>
                  <li>{t('cardTransferStep2')}</li>
                  <li>{t('cardTransferStep3')}</li>
                  <li>{t('cardTransferStep4')}: <strong className="text-gray-900">{cardNumber}</strong></li>
                  <li>{t('cardTransferStep5')}: <strong className="text-red-600">{totalAmount.toLocaleString()} ₽</strong></li>
                  <li>{t('cardTransferStep6')}</li>
                  <li>{t('cardTransferStep7')}</li>
                </ol>
              </div>
            </div>
          )}

          {/* QR Payment */}
          {paymentMethod === 'qr' && (
            <div className="space-y-6">
              <h2 className="text-xl text-gray-800">{t('paymentByQrCode')}</h2>
              
              <div className="flex justify-center p-8 bg-gray-50 rounded-lg">
                {qrCodeUrl ? (
                  <div className="w-96 h-96 bg-white border-4 border-blue-500 rounded-lg flex items-center justify-center p-4">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code СБП" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-72 h-72 bg-white border-4 border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="text-center px-6">
                      <QrCode size={64} className="text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {t('qrCodeWillBeGenerated')}
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        {t('checkEmailOrSupport')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700">
                  ✅ {t('openBankApp')}
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg text-gray-800 mb-4">📱 {t('paymentInstructions')}:</h3>
                <ol className="list-decimal list-inside space-y-3 text-gray-700">
                  <li>{t('qrCodeStep1')}</li>
                  <li>{t('qrCodeStep2')}</li>
                  <li>{t('qrCodeStep3')}</li>
                  <li>{t('qrCodeStep4')}: <strong className="text-red-600">{totalAmount.toLocaleString()} ₽</strong></li>
                  <li>{t('qrCodeStep5')}</li>
                </ol>
              </div>
            </div>
          )}

          {/* T-Bank Payment */}
          {paymentMethod === 'tbank' && (
            <div className="space-y-6">
              <h2 className="text-xl text-gray-800">{t('paymentByTBank')}</h2>
              
              <div className="border-2 border-yellow-200 rounded-lg p-6 bg-yellow-50">
                <label className="block text-sm text-gray-600 mb-3">{t('contractNumber')}</label>
                <div className="flex items-center gap-4">
                  <div className="text-3xl text-gray-800 tracking-wider flex-1">
                    {contractNumber}
                  </div>
                  <button
                    onClick={() => copyToClipboard(contractNumber)}
                    className="p-3 hover:bg-yellow-100 rounded-lg transition-colors"
                    title="Копировать"
                  >
                    {copiedCard ? (
                      <Check size={24} className="text-green-600" />
                    ) : (
                      <Copy size={24} className="text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700">
                  ✅ {t('afterPaymentProcessing')}
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg text-gray-800 mb-4">📱 {t('paymentInstructions')}:</h3>
                <ol className="list-decimal list-inside space-y-3 text-gray-700">
                  <li>{t('tbankStep1New')} <a href="https://www.tbank.ru/cardtocard/?tab=card2acc" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{t('tbankClickHere')}</a></li>
                  <li>{t('tbankStep2New')}</li>
                  <li>{t('tbankStep3New')}: <strong className="text-gray-900">{contractNumber}</strong></li>
                  <li>{t('tbankStep4')}: <strong className="text-red-600">{totalAmount.toLocaleString()} ₽</strong></li>
                  <li>{t('tbankStep5')}</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => onNavigate('profile')}
            className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('backToProfile')}
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {t('backToHome')}
          </button>
        </div>
      </div>
    </div>
  );
};
