import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

/**
 * Edge Function: send-push-notification
 * 
 * Отправляет push-уведомления через OneSignal REST API
 * 
 * Принимает:
 * - userId: string (обязательно)
 * - type: string (тип уведомления)
 * - orderId?: string
 * - orderNumber?: string
 * - trackingNumber?: string
 * - trackingUrl?: string
 * - points?: number
 * - language?: 'ru' | 'zh' | 'en' | 'vi'
 */

interface PushNotificationRequest {
  userId: string;
  type: string;
  orderId?: string;
  orderNumber?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  points?: number;
  language?: 'ru' | 'zh' | 'en' | 'vi';
  url?: string;
}

// Шаблоны сообщений
const NOTIFICATION_TEMPLATES: Record<string, Record<string, { title: string; message: (data: any) => string }>> = {
  order_pending: {
    ru: {
      title: '✅ Заказ оформлен',
      message: (data) => `Вы оформили заказ ${data.orderNumber || data.orderId}`,
    },
    zh: {
      title: '✅ 订单已创建',
      message: (data) => `您已下单 ${data.orderNumber || data.orderId}`,
    },
    en: {
      title: '✅ Order Created',
      message: (data) => `You have placed order ${data.orderNumber || data.orderId}`,
    },
    vi: {
      title: '✅ Đơn hàng đã tạo',
      message: (data) => `Bạn đã đặt đơn hàng ${data.orderNumber || data.orderId}`,
    },
  },
  order_processing: {
    ru: {
      title: '💳 Оплата получена',
      message: () => 'Мы получили оплату Вашего заказа',
    },
    zh: {
      title: '💳 已收到付款',
      message: () => '我们已收到您的订单付款',
    },
    en: {
      title: '💳 Payment Received',
      message: () => 'We have received payment for your order',
    },
    vi: {
      title: '💳 Đã nhận thanh toán',
      message: () => 'Chúng tôi đã nhận được thanh toán cho đơn hàng của bạn',
    },
  },
  order_shipped: {
    ru: {
      title: '📦 Заказ отправлен',
      message: () => 'Ваш заказ отправлен',
    },
    zh: {
      title: '📦 订单已发货',
      message: () => '您的订单已发货',
    },
    en: {
      title: '📦 Order Shipped',
      message: () => 'Your order has been shipped',
    },
    vi: {
      title: '📦 Đơn hàng đã gửi',
      message: () => 'Đơn hàng của bạn đã được gửi đi',
    },
  },
  order_delivered: {
    ru: {
      title: '🎉 Заказ доставлен',
      message: () => 'Благодарим Вас за заказ! Ваш заказ выполнен',
    },
    zh: {
      title: '🎉 订单已送达',
      message: () => '感谢您的订单！您的订单已完成',
    },
    en: {
      title: '🎉 Order Delivered',
      message: () => 'Thank you for your order! Your order is complete',
    },
    vi: {
      title: '🎉 Đơn hàng đã giao',
      message: () => 'Cảm ơn bạn đã đặt hàng! Đơn hàng của bạn đã hoàn thành',
    },
  },
  order_cancelled: {
    ru: {
      title: '❌ Заказ отменен',
      message: () => 'К сожалению Ваш заказ был отменен',
    },
    zh: {
      title: '❌ 订单已取消',
      message: () => '很抱歉，您的订单已被取消',
    },
    en: {
      title: '❌ Order Cancelled',
      message: () => 'Unfortunately your order has been cancelled',
    },
    vi: {
      title: '❌ Đơn hàng đã hủy',
      message: () => 'Rất tiếc, đơn hàng của bạn đã bị hủy',
    },
  },
  welcome: {
    ru: {
      title: '🎉 Добро пожаловать!',
      message: () => 'Благодарим Вас за подписку!',
    },
    zh: {
      title: '🎉 欢迎！',
      message: () => '感谢您的订阅！',
    },
    en: {
      title: '🎉 Welcome!',
      message: () => 'Thank you for subscribing!',
    },
    vi: {
      title: '🎉 Chào mừng!',
      message: () => 'Cảm ơn bạn đã đăng ký!',
    },
  },
  loyalty_earned: {
    ru: {
      title: '⭐ Баллы начислены',
      message: (data) => `Начислено баллов лояльности: ${data.points}`,
    },
    zh: {
      title: '⭐ 积分已添加',
      message: (data) => `已添加忠诚度积分: ${data.points}`,
    },
    en: {
      title: '⭐ Points Earned',
      message: (data) => `Loyalty points earned: ${data.points}`,
    },
    vi: {
      title: '⭐ Điểm đã thêm',
      message: (data) => `Điểm thưởng đã nhận: ${data.points}`,
    },
  },
  loyalty_spent: {
    ru: {
      title: '💎 Баллы списаны',
      message: (data) => `Списано баллов лояльности: ${data.points}`,
    },
    zh: {
      title: '💎 积分已使用',
      message: (data) => `已使用忠诚度积分: ${data.points}`,
    },
    en: {
      title: '💎 Points Spent',
      message: (data) => `Loyalty points spent: ${data.points}`,
    },
    vi: {
      title: '💎 Điểm đã dùng',
      message: (data) => `Điểm thưởng đã sử dụng: ${data.points}`,
    },
  },
};

// Генерация URL для deep links
function generateNotificationUrl(data: PushNotificationRequest, baseUrl: string): string {
  if (data.url) return data.url;

  switch (data.type) {
    case 'order_pending':
      return `${baseUrl}/checkout?order=${data.orderId}`;
    case 'order_processing':
    case 'order_delivered':
    case 'order_cancelled':
      return `${baseUrl}/profile?tab=orders`;
    case 'order_shipped':
      return data.trackingUrl || `${baseUrl}/profile?tab=orders&order=${data.orderId}`;
    case 'welcome':
      return baseUrl;
    case 'loyalty_earned':
    case 'loyalty_spent':
      return `${baseUrl}/profile?tab=loyalty`;
    default:
      return baseUrl;
  }
}

// Получение текста уведомления
function getNotificationContent(data: PushNotificationRequest, baseUrl: string) {
  const lang = data.language || 'ru';
  const template = NOTIFICATION_TEMPLATES[data.type];

  if (!template || !template[lang]) {
    return {
      title: 'Уведомление',
      message: 'У вас новое уведомление',
      url: baseUrl,
    };
  }

  const langTemplate = template[lang];

  return {
    title: langTemplate.title,
    message: langTemplate.message(data),
    url: generateNotificationUrl(data, baseUrl),
  };
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔔 Push Notification Request received');

    // Получаем данные запроса
    const requestData: PushNotificationRequest = await req.json();
    console.log('📋 Request data:', requestData);

    if (!requestData.userId) {
      throw new Error('userId is required');
    }

    // Создаем Supabase клиент
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Looking for push subscriptions for user:', requestData.userId);

    // Получаем все активные подписки пользователя
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('push_subscriptions')
      .select('player_id')
      .eq('user_id', requestData.userId)
      .eq('is_subscribed', true);

    if (subscriptionsError) {
      console.error('❌ Error fetching subscriptions:', subscriptionsError);
      throw subscriptionsError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('ℹ️ No active push subscriptions found for user');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No active push subscriptions found',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const playerIds = subscriptions.map((sub) => sub.player_id);
    console.log('📱 Found player IDs:', playerIds);

    // Получаем OneSignal настройки
    const { data: settings } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'onesignal')
      .single();

    const oneSignalConfig = settings?.value || {};
    const appId = oneSignalConfig.app_id || Deno.env.get('ONESIGNAL_APP_ID');
    const restApiKey = oneSignalConfig.rest_api_key || Deno.env.get('ONESIGNAL_REST_API_KEY');

    if (!appId || !restApiKey) {
      throw new Error('OneSignal configuration missing');
    }

    console.log('🔑 OneSignal App ID:', appId);

    // Получаем профиль пользователя для определения языка
    const { data: profile } = await supabase
      .from('profiles')
      .select('language')
      .eq('id', requestData.userId)
      .single();

    // Используем язык из профиля или из запроса
    const userLanguage = requestData.language || profile?.language || 'ru';
    const baseUrl = 'https://asia-farm.vercel.app'; // TODO: получать из настроек

    // Формируем контент уведомления
    const content = getNotificationContent(
      { ...requestData, language: userLanguage },
      baseUrl
    );

    console.log('📝 Notification content:', content);

    // Отправляем через OneSignal REST API
    const oneSignalPayload = {
      app_id: appId,
      include_player_ids: playerIds,
      headings: { en: content.title },
      contents: { en: content.message },
      url: content.url,
      data: {
        type: requestData.type,
        orderId: requestData.orderId,
        orderNumber: requestData.orderNumber,
        trackingNumber: requestData.trackingNumber,
        points: requestData.points,
      },
    };

    console.log('🚀 Sending to OneSignal:', oneSignalPayload);

    const oneSignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${restApiKey}`,
      },
      body: JSON.stringify(oneSignalPayload),
    });

    const oneSignalResult = await oneSignalResponse.json();
    console.log('📨 OneSignal response:', oneSignalResult);

    if (!oneSignalResponse.ok) {
      throw new Error(`OneSignal API error: ${JSON.stringify(oneSignalResult)}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Push notification sent successfully',
        recipients: playerIds.length,
        oneSignalResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
