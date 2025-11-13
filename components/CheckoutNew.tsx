import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart, type StoreType } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { createClient } from '../utils/supabase/client';
import { ChevronDown, Package, Plane, MapPin, CreditCard, Tag, Gift, Info, X, QrCode, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PrivacyPolicy } from './PrivacyPolicy';
import { TermsOfService } from './TermsOfService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { pluralizePoints } from '../utils/pluralize';

interface CheckoutProps {
  onNavigate: (page: string) => void;
  store: StoreType;
}

type DeliveryMethod = 'russian_post' | 'pyaterochka' | 'air_delivery';
type PaymentMethod = 'card' | 'qr' | 'tbank';

export const CheckoutNew = ({ onNavigate, store }: CheckoutProps) => {
  const { t, language } = useLanguage();
  const { getCartByStore, getTotalByStore, clearStoreCart } = useCart();
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const cart = getCartByStore(store);
  const subtotal = getTotalByStore(store);
  
  // Разделение товаров на обычные и пробники
  const regularItems = cart.filter(item => !item.isSample);
  const sampleItems = cart.filter(item => item.isSample);
  
  // Сумма без пробников (для расчета бесплатной доставки и баллов)
  const subtotalWithoutSamples = regularItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const samplesTotal = sampleItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    store === 'china' ? 'russian_post' : 'air_delivery'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  const [formData, setFormData] = useState(() => {
    // Load saved data from localStorage
    const savedData = localStorage.getItem('checkoutFormData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        return {
          fullName: user?.name || parsed.fullName || '',
          email: user?.email || parsed.email || '',
          phone: parsed.phone || '',
          region: parsed.region || '',
          city: parsed.city || '',
          address: parsed.address || '',
          postalCode: parsed.postalCode || '',
          notes: parsed.notes || '',
        };
      } catch (e) {
        console.error('Error parsing saved form data:', e);
      }
    }
    return {
      fullName: user?.name || '',
      email: user?.email || '',
      phone: '',
      region: '',
      city: '',
      address: '',
      postalCode: '',
      notes: '',
    };
  });

  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [loyaltyPointsToUse, setLoyaltyPointsToUse] = useState(0);
  const [availableLoyaltyPoints, setAvailableLoyaltyPoints] = useState(0);
  const [currentTier, setCurrentTier] = useState<'basic' | 'silver' | 'gold' | 'platinum'>('basic');
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);

  // Load loyalty info on mount
  useEffect(() => {
    if (user && accessToken) {
      loadLoyaltyInfo();
    }
  }, [user, accessToken]);

  const loadLoyaltyInfo = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('loyalty_points')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.warn('⚠️ Error loading loyalty points:', error);
        setAvailableLoyaltyPoints(0);
        setCurrentTier('basic');
      } else {
        setAvailableLoyaltyPoints(data?.loyalty_points || 0);
      }
      
      // Calculate loyalty tier based on lifetime spending
      const { data: ordersData } = await supabase
        .from('orders')
        .select('subtotal, total')
        .eq('user_id', user?.id)
        .in('status', ['delivered', 'shipped', 'processing']);
      
      if (ordersData) {
        const lifetime = ordersData.reduce((sum, order) => sum + (order.subtotal || order.total || 0), 0);
        
        if (lifetime >= 200000) {
          setCurrentTier('platinum');
        } else if (lifetime >= 100000) {
          setCurrentTier('gold');
        } else if (lifetime >= 50000) {
          setCurrentTier('silver');
        } else {
          setCurrentTier('basic');
        }
      } else {
        setCurrentTier('basic');
      }
    } catch (error) {
      console.warn('⚠️ Error loading loyalty points:', error);
      setAvailableLoyaltyPoints(0);
      setCurrentTier('basic');
    }
  };

  // Расчет веса для авиа доставки
  const totalWeight = cart.reduce((sum, item) => sum + (item.weight || 0.1) * item.quantity, 0);

  // Расчет стоимости доставки
  const calculateShipping = () => {
    // Бесплатная доставка от 8000 руб (пробники не учитываются)
    if (subtotalWithoutSamples >= 8000) return 0;

    switch (deliveryMethod) {
      case 'russian_post':
        return 600;
      case 'pyaterochka':
        return 500;
      case 'air_delivery':
        return Math.ceil(totalWeight) * 2000; // 2000 руб за кг
      default:
        return 0;
    }
  };

  const shippingCost = calculateShipping();

  // Сначала применяем баллы лояльности (только на товары без пробников)
  const loyaltyDiscount = useLoyaltyPoints ? Math.min(loyaltyPointsToUse, subtotalWithoutSamples) : 0;

  // Затем применяем промокод к результату после вычета баллов (без пробников и без доставки)
  // Пример: товары 10,000 руб, баллы 5,000, промокод применяется к (10,000 - 5,000) = 5,000 руб
  const subtotalAfterLoyalty = subtotalWithoutSamples - loyaltyDiscount;
  const promoDiscount = appliedPromo
    ? appliedPromo.discount_type === 'percent'
      ? Math.round((subtotalAfterLoyalty * appliedPromo.discount_value) / 100) // округляем до целых рублей
      : Math.min(appliedPromo.discount_value, subtotalAfterLoyalty) // фиксированная скидка не больше оставшейся суммы
    : 0;

  // Итоговая сумма: subtotal (включая пробники) - баллы - промокод + доствка
  const total = Math.max(0, subtotal - loyaltyDiscount - promoDiscount + shippingCost);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newFormData = {
      ...formData,
      [e.target.name]: e.target.value,
    };
    setFormData(newFormData);
    // Save to localStorage
    localStorage.setItem('checkoutFormData', JSON.stringify(newFormData));
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('active', true)
        .maybeSingle();

      if (!error && data) {
        // Check if promo code is still valid (not expired, usage limits, etc.)
        const now = new Date();
        const validFrom = data.valid_from ? new Date(data.valid_from) : null;
        const validUntil = data.valid_until ? new Date(data.valid_until) : null;
        
        if (validFrom && now < validFrom) {
          alert(t('promoCodeNotYetActive'));
          return;
        }
        
        if (validUntil && now > validUntil) {
          alert(t('promoCodeExpired'));
          return;
        }
        
        if (data.usage_limit && data.usage_count >= data.usage_limit) {
          alert(t('promoCodeUsageLimitReached'));
          return;
        }
        
        setAppliedPromo(data);
        toast.success(t('promoCodeApplied'));
      } else {
        toast.error(t('invalidPromoCode'));
      }
    } catch (error) {
      console.warn('⚠️ Error applying promo code:', error);
      toast.error(t('invalidPromoCode'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert(t('pleaseLogin'));
      onNavigate('login');
      return;
    }

    if (!agreedToPrivacy) {
      alert(t('agreePrivacyPolicy'));
      return;
    }

    if (!agreedToTerms) {
      alert(t('agreeTermsOfService'));
      return;
    }

    // Проверка для пробников: минимальная сумма заказа 3000 руб (без учета самих пробников)
    if (sampleItems.length > 0 && store === 'china' && subtotalWithoutSamples < 3000) {
      alert(t('samplesMinOrderError'));
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      
      // Generate order number in format DDMM01 (day, month, sequential number)
      // Generate order number with retry logic to handle race conditions
      let order = null;
      let orderNumber = '';
      let retryCount = 0;
      const maxRetries = 5;
      
      while (!order && retryCount < maxRetries) {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const datePrefix = `${day}${month}`;
        
        // Get today's orders count to generate sequential number for today
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        
        // Get all order numbers for today to find the next available number
        const { data: todayOrders } = await supabase
          .from('orders')
          .select('order_number')
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString())
          .like('order_number', `${datePrefix}%`)
          .order('order_number', { ascending: false });
        
        // Find the highest sequential number for today
        let nextSequentialNumber = 1;
        if (todayOrders && todayOrders.length > 0) {
          // Extract sequential numbers and find the max
          const sequentialNumbers = todayOrders
            .map(order => {
              const orderNum = order.order_number || '';
              if (orderNum.startsWith(datePrefix)) {
                const seqPart = orderNum.substring(4); // Get part after DDMM
                return parseInt(seqPart, 10);
              }
              return 0;
            })
            .filter(num => !isNaN(num));
          
          if (sequentialNumbers.length > 0) {
            nextSequentialNumber = Math.max(...sequentialNumbers) + 1;
          }
        }
        
        const sequentialNumber = String(nextSequentialNumber).padStart(2, '0');
        orderNumber = `${datePrefix}${sequentialNumber}`;
        
        // Create order
        const orderData = {
          user_id: user?.id,
          email: formData.email,
          full_name: formData.fullName,
          phone: formData.phone,
          store,
          items: cart,
          shipping_info: { ...formData, deliveryMethod },
          payment_method: paymentMethod,
          subtotal,
          shipping_cost: shippingCost,
          promo_code: appliedPromo?.code || null,
          promo_discount: promoDiscount > 0 ? promoDiscount : null,
          loyalty_points_used: loyaltyDiscount > 0 ? loyaltyDiscount : null,
          total,
          status: 'pending',
          order_number: orderNumber,
          language: language, // Сохраняем язык пользователя для email и push
        };

        const { data, error } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single();
        
        // If duplicate key error, retry with next number
        if (error && error.code === '23505') {
          console.log(`⚠️ Order number ${orderNumber} already exists, retrying... (attempt ${retryCount + 1}/${maxRetries})`);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay before retry
          continue;
        }
        
        if (error) {
          console.error('❌ Error creating order:', error);
          toast.error(`${t('errorPlacingOrder')}: ${error.message}`);
          setLoading(false);
          return;
        }
        
        order = data;
      }

      if (!order) {
        console.error('❌ Failed to create order after multiple retries');
        toast.error(t('errorPlacingOrder'));
        setLoading(false);
        return;
      }

      // Order created successfully
      clearStoreCart(store);
      
      // Only subtract used loyalty points now
      // Points will be earned when order status changes to "delivered"
      if (user?.id && loyaltyDiscount > 0) {
        const newLoyaltyPoints = Math.max(0, availableLoyaltyPoints - loyaltyDiscount);
        
        await supabase
          .from('profiles')
          .update({ 
            loyalty_points: newLoyaltyPoints
          })
          .eq('id', user.id);
        
        console.log(`✅ Loyalty points subtracted: ${availableLoyaltyPoints} - ${loyaltyDiscount} = ${newLoyaltyPoints}`);
        console.log(`ℹ️ Cashback points will be earned when order is delivered`);
      }
      
      // Send order confirmation email
      try {
        console.log('📧 Sending order confirmation email...');
        const { data: { session } } = await supabase.auth.getSession();
        const authToken = session?.access_token;
        
        if (!authToken) {
          console.error('❌ No auth token available for email');
        } else {
          const serverUrl = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';
          const response = await fetch(`${serverUrl}/make-server-a75b5353/api/email/order-status`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              orderId: order.id,
              email: formData.email,
              status: 'pending'
            }),
          });
          
          if (response.ok) {
            console.log('✅ Order confirmation email sent successfully');
          } else {
            const errorData = await response.json();
            console.error('❌ Failed to send order email:', errorData);
          }
        }
      } catch (emailError) {
        console.error('❌ Error sending order email:', emailError);
        // Don't fail the whole order if email fails
      }
      
      // Send push notification
      try {
        console.log('📱 Sending order push notification...', {
          userId: user?.id,
          orderId: order.id,
          orderNumber: order.order_number
        });
        
        if (user?.id) {
          const serverUrl = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';
          const pushPayload = {
            userId: user.id,
            type: 'order_pending',
            orderId: order.id,
            orderNumber: order.order_number
          };
          
          console.log('📤 Push payload:', pushPayload);
          
          const pushResponse = await fetch(`${serverUrl}/make-server-a75b5353/api/push/auto-notify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(pushPayload),
          });
          
          console.log('📥 Push response status:', pushResponse.status);
          
          if (pushResponse.ok) {
            const pushResult = await pushResponse.json();
            console.log('✅ Push notification sent successfully:', pushResult);
          } else {
            const errorData = await pushResponse.json().catch(() => ({}));
            console.error('❌ Failed to send push notification:', {
              status: pushResponse.status,
              error: errorData
            });
          }
        } else {
          console.warn('⚠️ No user ID available for push notification');
        }
      } catch (pushError) {
        console.error('❌ Error sending push notification:', pushError);
        // Don't fail the whole order if push fails
      }
      
      // Save order payment info to localStorage
      const paymentInfo = {
        orderNumber: order.order_number,
        paymentMethod: paymentMethod,
        totalAmount: total,
      };
      localStorage.setItem('lastOrderPayment', JSON.stringify(paymentInfo));
      
      toast.success(t('orderPlacedSuccess'));
      // Navigate to payment info page
      onNavigate('payment-info');
    } catch (error) {
      console.warn('⚠️ Error placing order:', error);
      toast.error(t('errorPlacingOrder'));
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    onNavigate('cart');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-gray-800 mb-6">{t('checkout')} - {t(`${store}Store`)}</h2>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Shipping form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Способ доставки */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-800 mb-4">{t('deliveryMethod')}</h3>

              {store === 'china' && (
                <div className="space-y-3">
                  <label className={`delivery-option flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    deliveryMethod === 'russian_post' ? 'selected' : ''
                  }`}>
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="russian_post"
                      checked={deliveryMethod === 'russian_post'}
                      onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
                    />
                    <div className="flex-1">
                      <div className="text-gray-800">{t('russianPost')}</div>
                      <div className="text-sm text-gray-600">600 ₽</div>
                    </div>
                  </label>

                  <label className={`delivery-option flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    deliveryMethod === 'pyaterochka' ? 'selected' : ''
                  }`}>
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="pyaterochka"
                      checked={deliveryMethod === 'pyaterochka'}
                      onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
                    />
                    <div className="flex-1">
                      <div className="text-gray-800">{t('pyaterochkaPickup')}</div>
                      <div className="text-sm text-gray-600">500 ₽</div>
                    </div>
                  </label>
                </div>
              )}

              {(store === 'thailand' || store === 'vietnam') && (
                <div className="p-3 border rounded-lg bg-gray-50">
                  <div className="text-gray-800">{t('airDelivery')}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    2000 ₽ / {t('kg')} × {totalWeight.toFixed(2)} {t('kg')} = {(Math.ceil(totalWeight) * 2000).toLocaleString()} ₽
                  </div>
                </div>
              )}

              {subtotal >= 8000 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                  {t('freeDeliveryFrom')}
                </div>
              )}
            </div>

            {/* Способ оплаты */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-800 mb-4">{t('paymentMethod')}</h3>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Card Transfer */}
                <label
                  className={`payment-option flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'card'
                      ? 'border-red-500 bg-red-50 selected'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="sr-only"
                  />
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
                    <div className="text-xs text-gray-600 mt-1">{t('sberbankParenthesis')}</div>
                  </div>
                </label>

                {/* QR Code */}
                <label
                  className={`payment-option flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'qr'
                      ? 'border-blue-500 bg-blue-50 selected'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="qr"
                    checked={paymentMethod === 'qr'}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="sr-only"
                  />
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    paymentMethod === 'qr' ? 'bg-blue-500' : 'bg-blue-100'
                  }`}>
                    <QrCode
                      className={paymentMethod === 'qr' ? 'text-white' : 'text-blue-600'}
                      size={24}
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-gray-800 text-sm">{t('qrCodePayment')}</div>
                    <div className="text-xs text-gray-600 mt-1">{t('sbpParenthesis')}</div>
                  </div>
                </label>

                {/* T-Bank */}
                <label
                  className={`payment-option flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'tbank'
                      ? 'border-yellow-500 bg-yellow-50 selected'
                      : 'border-gray-200 hover:border-yellow-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="tbank"
                    checked={paymentMethod === 'tbank'}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="sr-only"
                  />
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    paymentMethod === 'tbank' ? 'bg-yellow-400' : 'bg-yellow-100'
                  }`}>
                    <Building2
                      className={paymentMethod === 'tbank' ? 'text-gray-900' : 'text-yellow-600'}
                      size={24}
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-gray-800 text-sm">{t('tbankPayment')}</div>
                    <div className="text-xs text-gray-600 mt-1">{t('tbankParenthesis')}</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Информация для доставки */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-800 mb-4">{t('shippingInfo')}</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2">
                    {t('fullName')} *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="checkout-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">
                    {t('phone')} *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="checkout-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">
                    {t('region')} *
                  </label>
                  <input
                    type="text"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    required
                    className="checkout-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2">
                    {t('cityOrTown')} *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="checkout-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                {deliveryMethod === 'russian_post' && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-gray-700 mb-2">
                        {t('streetAndHouse')} *
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        className="checkout-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-gray-700 mb-2">
                        {t('postalIndex')} *
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        required
                        className="checkout-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  </>
                )}

                {deliveryMethod === 'pyaterochka' && (
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 mb-2">
                      {t('pyaterochkaAddress')} *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="checkout-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                )}

                {deliveryMethod === 'air_delivery' && (
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 mb-2">
                      {t('cdekAddress')} *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="checkout-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2">
                    {t('orderNotes')}
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="checkout-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>
            </div>

            {/* Соглашеня */}
            <div className="agreement-section bg-white rounded-lg shadow-md p-6 space-y-3">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="privacyPolicy"
                  checked={agreedToPrivacy}
                  onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                  className="agreement-checkbox mt-1"
                />
                <label htmlFor="privacyPolicy" className="text-sm text-gray-700">
                  {t('iAgreeWith')}{' '}
                  <button
                    type="button"
                    onClick={() => setShowPrivacyDialog(true)}
                    className="text-red-600 hover:underline"
                  >
                    {t('privacyPolicyInstrumental')}
                  </button>{' '}
                  *
                </label>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="termsOfService"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="agreement-checkbox mt-1"
                />
                <label htmlFor="termsOfService" className="text-sm text-gray-700">
                  {t('iAgreeWith')}{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsDialog(true)}
                    className="text-red-600 hover:underline"
                  >
                    {t('termsOfServiceInstrumental')}
                  </button>{' '}
                  *
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>{t('processing')}</span>
                </>
              ) : (
                t('placeOrder')
              )}
            </button>
          </form>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24 space-y-4">
            <h3 className="text-gray-800">{t('orderSummary')}</h3>

            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.name} × {item.quantity}
                    {item.isSample && <span className="ml-1 text-xs text-blue-600">({t('productIsSample')})</span>}
                  </span>
                  <span className="text-gray-800">
                    {((item.price || 0) * (item.quantity || 0)).toLocaleString()} ₽
                  </span>
                </div>
              ))}
            </div>
            
            {/* Предупреждение о пробниках */}
            {sampleItems.length > 0 && store === 'china' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                <strong>{t('note')}:</strong> {t('samplesMinOrderAmount')}. {t('samplesNoLoyalty')}.
              </div>
            )}

            {/* Промокод */}
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm text-gray-700 mb-2">
                {t('promoCode')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder={t('enterPromoCode')}
                  className="promo-code-input flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                />
                <button
                  type="button"
                  onClick={applyPromoCode}
                  className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  <Tag size={16} />
                </button>
              </div>
              {appliedPromo && (
                <div className="mt-2 text-sm text-green-600">
                  ✓ {t('promoCodeApplied')}: {appliedPromo.code}
                </div>
              )}
            </div>

            {/* Баллы лояльности */}
            {user && availableLoyaltyPoints > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={useLoyaltyPoints}
                    onChange={(e) => {
                      setUseLoyaltyPoints(e.target.checked);
                      if (e.target.checked) {
                        // Auto-fill with max available points (пробники не участвуют)
                        setLoyaltyPointsToUse(Math.min(availableLoyaltyPoints, subtotalWithoutSamples));
                      } else {
                        setLoyaltyPointsToUse(0);
                      }
                    }}
                  />
                  <span className="text-sm text-gray-700">
                    {t('useLoyaltyPoints')}: {pluralizePoints(availableLoyaltyPoints, language)}
                  </span>
                </label>
                {useLoyaltyPoints && (
                  <input
                    type="number"
                    min="0"
                    max={Math.min(availableLoyaltyPoints, subtotalWithoutSamples)}
                    value={loyaltyPointsToUse}
                    onChange={(e) => setLoyaltyPointsToUse(Math.min(Number(e.target.value), Math.min(availableLoyaltyPoints, subtotalWithoutSamples)))}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded text-sm"
                    placeholder={t('pointsPlaceholder')}
                  />
                )}
              </div>
            )}

            {/* Итого */}
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('subtotal')}:</span>
                <span className="text-gray-800">{subtotal.toLocaleString()} ₽</span>
              </div>

              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{t('loyaltyDiscount')}:</span>
                  <span>-{loyaltyDiscount.toLocaleString()} ₽</span>
                </div>
              )}

              {promoDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{t('promoDiscount')}:</span>
                  <span>-{promoDiscount.toLocaleString()} ₽</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('shipping')}:</span>
                <span className="text-gray-800">
                  {shippingCost === 0 ? (
                    <span className="text-green-600">{t('free')}</span>
                  ) : (
                    `${shippingCost.toLocaleString()} ₽`
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-800">{t('finalTotal')}:</span>
                <span className="final-total-price text-red-600 text-xl">
                  {total.toLocaleString()} ₽
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('privacyPolicy')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <PrivacyPolicy onNavigate={() => {}} language={language} t={t} embedded={true} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Dialog */}
      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('termsOfService')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <TermsOfService onNavigate={() => {}} language={language} t={t} embedded={true} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};