/**
 * Push Notifications Utilities
 * Шаблоны и утилиты для отправки push-уведомлений
 */

export type NotificationType = 
  | 'order_pending'      // Заказ создан, ожидает оплаты
  | 'order_processing'   // Оплата получена
  | 'order_shipped'      // Заказ отправлен
  | 'order_delivered'    // Заказ доставлен
  | 'order_cancelled'    // Заказ отменен
  | 'welcome'            // Приветственное сообщение
  | 'loyalty_earned'     // Начислены баллы
  | 'loyalty_spent';     // Списаны баллы

export interface PushNotificationData {
  type: NotificationType;
  userId: string;
  orderId?: string;
  orderNumber?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  points?: number;
  language?: 'ru' | 'zh' | 'en' | 'vi';
  url?: string; // Custom URL override
}

/**
 * Шаблоны сообщений на разных языках
 */
const NOTIFICATION_TEMPLATES = {
  order_pending: {
    ru: {
      title: '✅ Заказ оформлен',
      message: (data: PushNotificationData) => `Вы оформили заказ ${data.orderNumber || data.orderId}`,
    },
    zh: {
      title: '✅ 订单已创建',
      message: (data: PushNotificationData) => `您已下单 ${data.orderNumber || data.orderId}`,
    },
    en: {
      title: '✅ Order Created',
      message: (data: PushNotificationData) => `You have placed order ${data.orderNumber || data.orderId}`,
    },
    vi: {
      title: '✅ Đơn hàng đã tạo',
      message: (data: PushNotificationData) => `Bạn đã đặt đơn hàng ${data.orderNumber || data.orderId}`,
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
      message: (data: PushNotificationData) => `Начислено баллов лояльности: ${data.points}`,
    },
    zh: {
      title: '⭐ 积分已添加',
      message: (data: PushNotificationData) => `已添加忠诚度积分: ${data.points}`,
    },
    en: {
      title: '⭐ Points Earned',
      message: (data: PushNotificationData) => `Loyalty points earned: ${data.points}`,
    },
    vi: {
      title: '⭐ Điểm đã thêm',
      message: (data: PushNotificationData) => `Điểm thưởng đã nhận: ${data.points}`,
    },
  },
  
  loyalty_spent: {
    ru: {
      title: '💎 Баллы списаны',
      message: (data: PushNotificationData) => `Списано баллов лояльности: ${data.points}`,
    },
    zh: {
      title: '💎 积分已使用',
      message: (data: PushNotificationData) => `已使用忠诚度积分: ${data.points}`,
    },
    en: {
      title: '💎 Points Spent',
      message: (data: PushNotificationData) => `Loyalty points spent: ${data.points}`,
    },
    vi: {
      title: '💎 Điểm đã dùng',
      message: (data: PushNotificationData) => `Điểm thưởng đã sử dụng: ${data.points}`,
    },
  },
};

/**
 * Генерация URL для deep links
 */
export function generateNotificationUrl(data: PushNotificationData): string {
  // Если URL указан явно, используем его
  if (data.url) {
    return data.url;
  }

  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://asia-farm.vercel.app'; // Fallback для Edge Functions

  switch (data.type) {
    case 'order_pending':
      // Открывает страницу оплаты заказа
      return `${baseUrl}/checkout?order=${data.orderId}`;
    
    case 'order_processing':
    case 'order_delivered':
    case 'order_cancelled':
      // Открывает историю заказов в личном кабинете
      return `${baseUrl}/profile?tab=orders`;
    
    case 'order_shipped':
      // Если есть tracking URL, открываем его, иначе историю заказов
      if (data.trackingUrl) {
        return data.trackingUrl;
      }
      return `${baseUrl}/profile?tab=orders&order=${data.orderId}`;
    
    case 'welcome':
      // Открывает главную страницу
      return baseUrl;
    
    case 'loyalty_earned':
    case 'loyalty_spent':
      // Открывает историю начисления бонусов
      return `${baseUrl}/profile?tab=loyalty`;
    
    default:
      return baseUrl;
  }
}

/**
 * Получение текста уведомления
 */
export function getNotificationContent(data: PushNotificationData) {
  const lang = data.language || 'ru';
  const template = NOTIFICATION_TEMPLATES[data.type];
  
  if (!template || !template[lang]) {
    console.error('Unknown notification type or language:', data.type, lang);
    return {
      title: 'Уведомление',
      message: 'У вас новое уведомление',
      url: generateNotificationUrl(data),
    };
  }

  const langTemplate = template[lang];
  
  return {
    title: langTemplate.title,
    message: typeof langTemplate.message === 'function' 
      ? langTemplate.message(data) 
      : langTemplate.message,
    url: generateNotificationUrl(data),
  };
}

/**
 * Подготовка данных для отправки через OneSignal REST API
 */
export function prepareOneSignalPayload(
  playerIds: string[],
  data: PushNotificationData
) {
  const content = getNotificationContent(data);
  
  return {
    include_player_ids: playerIds,
    headings: { en: content.title },
    contents: { en: content.message },
    url: content.url,
    data: {
      type: data.type,
      orderId: data.orderId,
      orderNumber: data.orderNumber,
      trackingNumber: data.trackingNumber,
      points: data.points,
    },
  };
}
