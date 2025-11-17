// Email Templates for Asia Pharm
// Шаблоны email уведомлений для Азия Фарм

const translations = {
  ru: {
    greeting: 'Здравствуйте',
    thankYou: 'Благодарим Вас за заказ. Детали заказа представлены ниже',
    orderNumber: 'Номер заказа',
    orderDate: 'Дата заказа',
    orderStatus: 'Статус заказа',
    trackingNumber: 'Трек-номер заказа',
    productName: 'Наименование товара',
    quantity: 'Количество',
    price: 'Цена',
    sum: 'Сумма',
    deliveryCost: 'Стоимость доставки',
    totalAmount: 'Общая сумма',
    deliveryMethod: 'Выбранный способ доставки',
    deliveryAddress: 'Адрес доставки',
    paymentMethod: 'Способ оплаты',
    promoCode: 'Применен промокод',
    loyaltyPoints: 'Будет начислено баллов',
    loyaltyPointsEarned: 'Начислено баллов',
    loyaltyUsed: 'Списано баллов',
    currentBalance: 'Текущий баланс баллов',
    footer: 'Китайская Аптека Азия Фарм',
    deliveryMethods: {
      russian_post: 'Почта России',
      pyaterochka: 'Доставка в магазин Пятерочка',
      air_delivery: 'Авиа доставка'
    },
    statuses: {
      pending: 'Ожидает обработки',
      processing: 'В обработке',
      shipped: 'Отправлен',
      delivered: 'Доставлен',
      cancelled: 'Отменен'
    },
    messages: {
      pending: 'Ваш заказ принят и ожидает обработки. Пожалуйста, произведите оплату одним из способов, указанных ниже.',
      processing: 'Мы получили оплату Вашего заказа! Ваш заказ находится в обработке и скоро будет отправлен.',
      shipped: 'Ваш заказ отправлен! Для отслеживания посылки нажмите на кнопку ниже.',
      delivered: 'Благодарим Вас за использование сервиса Азия Фарм! Ваш заказ успешно доставлен.',
      cancelled: 'К сожалению, Ваш заказ был отменен.'
    },
    trackOrder: 'Отследить заказ',
    paymentMethods: 'Доступные способы оплаты'
  },
  en: {
    greeting: 'Hello',
    thankYou: 'Thank you for your order. Order details are presented below',
    orderNumber: 'Order Number',
    orderDate: 'Order Date',
    orderStatus: 'Order Status',
    trackingNumber: 'Tracking Number',
    productName: 'Product Name',
    quantity: 'Quantity',
    price: 'Price',
    sum: 'Amount',
    deliveryCost: 'Delivery Cost',
    totalAmount: 'Total Amount',
    deliveryMethod: 'Selected Delivery Method',
    deliveryAddress: 'Delivery Address',
    paymentMethod: 'Payment Method',
    promoCode: 'Promo Code Applied',
    loyaltyPoints: 'Points to be credited',
    loyaltyPointsEarned: 'Points earned',
    loyaltyUsed: 'Points used',
    currentBalance: 'Current Points Balance',
    footer: 'Chinese Pharmacy Asia Pharm',
    deliveryMethods: {
      russian_post: 'Russian Post',
      pyaterochka: 'Delivery to Pyaterochka Store',
      air_delivery: 'Air Delivery'
    },
    statuses: {
      pending: 'Pending',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    },
    messages: {
      pending: 'Your order has been received and is awaiting processing. Please make payment using one of the methods below.',
      processing: 'We have received your payment! Your order is being processed and will be shipped soon.',
      shipped: 'Your order has been shipped! Click the button below to track your package.',
      delivered: 'Thank you for using Asia Pharm service! Your order has been successfully delivered.',
      cancelled: 'Unfortunately, your order has been cancelled.'
    },
    trackOrder: 'Track Order',
    paymentMethods: 'Available Payment Methods'
  },
  zh: {
    greeting: '您好',
    thankYou: '感谢您的订单。订单详情如下',
    orderNumber: '订单号',
    orderDate: '订单日期',
    orderStatus: '订单状态',
    trackingNumber: '追踪号码',
    productName: '产品名称',
    quantity: '数量',
    price: '价格',
    sum: '金额',
    deliveryCost: '运费',
    totalAmount: '总金额',
    deliveryMethod: '选择的配送方式',
    deliveryAddress: '收货地址',
    paymentMethod: '付款方式',
    promoCode: '已应用促销代码',
    loyaltyPoints: '将获得积分',
    loyaltyPointsEarned: '获得积分',
    loyaltyUsed: '已使用积分',
    currentBalance: '当前积分余额',
    footer: '中国药房亚洲药房',
    deliveryMethods: {
      russian_post: '俄罗斯邮政',
      pyaterochka: '五分钱商店配送',
      air_delivery: '航空配送'
    },
    statuses: {
      pending: '待处理',
      processing: '处理中',
      shipped: '已发货',
      delivered: '已送达',
      cancelled: '已取消'
    },
    messages: {
      pending: '您的订单已收到，正在等待处理。请使用以下方式之一付款。',
      processing: '我们已收到您的付款！您的订正在处理中，即将发货。',
      shipped: '您的订单已发货！点击下面的钮跟踪您的包裹。',
      delivered: '感谢您使用亚洲药房服务！您的订单已成功送达。',
      cancelled: '很遗憾，您的订单已被取消。'
    },
    trackOrder: '跟踪订单',
    paymentMethods: '可用付款方式'
  },
  vi: {
    greeting: 'Xin chào',
    thankYou: 'Cảm ơn bạn đã đặt hàng. Chi tiết đơn hàng được trình bày bên dưới',
    orderNumber: 'Số đơn hàng',
    orderDate: 'Ngày đặt hàng',
    orderStatus: 'Trạng thái đơn hàng',
    trackingNumber: 'Mã theo dõi',
    productName: 'Tên sản phẩm',
    quantity: 'Số lượng',
    price: 'Giá',
    sum: 'Số tiền',
    deliveryCost: 'Chi phí vận chuyển',
    totalAmount: 'Tổng số tiền',
    deliveryMethod: 'Phương thức giao hàng đã chọn',
    deliveryAddress: 'Địa chỉ giao hàng',
    paymentMethod: 'Phương thức thanh toán',
    promoCode: 'Đã áp dụng mã khuyến mãi',
    loyaltyPoints: 'Điểm sẽ được tích lũy',
    loyaltyPointsEarned: 'Điểm đã tích lũy',
    loyaltyUsed: 'Điểm đã sử dụng',
    currentBalance: 'Số dư điểm hiện tại',
    footer: 'Nhà thuốc Trung Quốc Asia Pharm',
    deliveryMethods: {
      russian_post: 'Bưu điện Nga',
      pyaterochka: 'Giao hàng đến cửa hàng Pyaterochka',
      air_delivery: 'Giao hàng hàng không'
    },
    statuses: {
      pending: 'Đang chờ xử lý',
      processing: 'Đang xử lý',
      shipped: 'Đã gửi hàng',
      delivered: 'Đã giao hàng',
      cancelled: 'Đã hủy'
    },
    messages: {
      pending: 'Đơn hàng của bạn đã được nhận và đang chờ xử lý. Vui lòng thanh toán bằng một trong các phương thức bên dưới.',
      processing: 'Chúng tôi đã nhận được thanh toán của bạn! Đơn hàng của bạn đang được xử lý và sẽ sớm được gửi đi.',
      shipped: 'Đơn hàng của bạn đã được gửi đi! Nhấp vào nút bên dưới để theo dõi gói hàng của bạn.',
      delivered: 'Cảm ơn bạn đã sử dụng dịch vụ Asia Pharm! Đơn hàng của bạn đã được giao thành công.',
      cancelled: 'Rất tiếc, đơn hàng của bạn đã bị hủy.'
    },
    trackOrder: 'Theo dõi đơn hàng',
    paymentMethods: 'Phương thức thanh toán có sẵn'
  }
};

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
  total: number;
  id?: string; // Product ID for linking
}

interface OrderEmailData {
  orderId: string;
  orderDate: string;
  customerName: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  items: OrderItem[];
  deliveryMethod: string;
  deliveryCost: number;
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    address: string;
  };
  paymentMethod?: string;
  promoCode?: string;
  promoDiscount?: number;
  loyaltyPointsUsed?: number;
  loyaltyPointsEarned?: number;
  currentLoyaltyBalance?: number;
  trackingNumber?: string;
  trackingUrl?: string;
  paymentDetails?: {
    cardNumber?: string;
    contractNumber?: string;
    qrCodeUrl?: string;
  };
}

// Helper function to format currency
function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0 ₽';
  }
  return `${amount.toLocaleString('ru-RU')} ₽`;
}

// Generate welcome email HTML
export function generateWelcomeEmailHTML(userData: any, language: 'ru' | 'en' | 'zh' | 'vi' = 'ru'): string {
  // Logo from GitHub repository
  const logoUrl = 'https://raw.githubusercontent.com/ilyairgsha-boop/asia-pharm/main/image/logo.png';
  
  const welcomeTranslations = {
    ru: {
      welcome: 'Добро пожаловать на сайт Азия Фарм!',
      greeting: 'Здравствуйте',
      registered: 'Вы успешно зарегистрировались на нашем сайте. Ваши регистрационные данные:',
      name: 'ФИО',
      email: 'Email',
      password: 'Пароль',
      loginButton: 'Вход в личный кабинет',
      footer: 'Китайская Аптека Азия Фарм',
      thankYou: 'Спасибо за регистрацию! Мы рады видеть вас среди наших клиентов.',
      benefits: 'Преимущества регистрации:',
      benefit1: 'Накопление баллов лояльности с каждой покупки',
      benefit2: 'Отслеживание истории заказов',
      benefit3: 'Эксклюзивные предложения и скидки',
      benefit4: 'Быстрое оформление заказов'
    },
    en: {
      welcome: 'Welcome to Asia Pharm!',
      greeting: 'Hello',
      registered: 'You have successfully registered on our website. Your registration details:',
      name: 'Full Name',
      email: 'Email',
      password: 'Password',
      loginButton: 'Login to Account',
      footer: 'Chinese Pharmacy Asia Pharm',
      thankYou: 'Thank you for registering! We are glad to see you among our customers.',
      benefits: 'Registration Benefits:',
      benefit1: 'Earn loyalty points with every purchase',
      benefit2: 'Track order history',
      benefit3: 'Exclusive offers and discounts',
      benefit4: 'Quick order checkout'
    },
    zh: {
      welcome: '欢迎来到亚洲药房！',
      greeting: '您好',
      registered: '您已成功在我们的网站上注册。您的注册信息：',
      name: '姓名',
      email: '电子邮件',
      password: '密码',
      loginButton: '登录账户',
      footer: '中国药房亚洲药房',
      thankYou: '感谢您的注册！我们很高兴您成为我们的客户。',
      benefits: '注册优势：',
      benefit1: '每次购买赚取积分',
      benefit2: '跟踪订单历史',
      benefit3: '独家优惠和折扣',
      benefit4: '快速结账'
    },
    vi: {
      welcome: 'Chào mừng đến với Asia Pharm!',
      greeting: 'Xin chào',
      registered: 'Bạn đã đăng ký thành công trên trang web của chúng tôi. Thông tin đăng ký của bạn:',
      name: 'Họ và tên',
      email: 'Email',
      password: 'Mật khẩu',
      loginButton: 'Đăng nhập tài khoản',
      footer: 'Nhà thuốc Trung Quốc Asia Pharm',
      thankYou: 'Cảm ơn bạn đã đăng ký! Chúng tôi rất vui được chào đón bạn.',
      benefits: 'Lợi ích đăng ký:',
      benefit1: 'Tích điểm với mỗi lần mua hàng',
      benefit2: 'Theo dõi lịch sử đơn hàng',
      benefit3: 'Ưu đãi và giảm giá độc quyền',
      benefit4: 'Thanh toán nhanh chóng'
    }
  };
  
  const t = welcomeTranslations[language];
  const flag = { ru: '🇷🇺', en: '🇬🇧', zh: '🇨🇳', vi: '🇻🇳' }[language];
  
  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.welcome}</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(180deg, #c9ecc2 0%, #ffffff 100%); }
    .container { max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 0 40px rgba(201, 236, 194, 0.5); position: relative; }
    .header { background: linear-gradient(180deg, #c9ecc2 0%, #ffffff 100%); padding: 40px 30px; text-align: center; position: relative; }
    .logo-wrapper { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 20px; }
    .logo { width: 120px; height: 120px; }
    .site-name { font-family: 'Lobster', cursive; font-size: 56px; color: #ef1010; text-shadow: 0 0 20px rgba(201, 236, 194, 0.8); margin: 0; }
    .language-flag { position: absolute; top: 20px; right: 20px; font-size: 28px; }
    .content { padding: 40px 30px; }
    .welcome-title { color: #ef1010; font-size: 32px; margin: 0 0 20px 0; text-align: center; font-weight: 600; }
    .greeting { color: #333; font-size: 24px; margin: 0 0 15px 0; }
    .message { color: #666; font-size: 18px; line-height: 1.6; margin: 20px 0; }
    .info-box { background: #f8f9fa; border-left: 4px solid #ef1010; padding: 20px; margin: 25px 0; border-radius: 4px; }
    .info-row { padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #666; font-size: 14px; margin-bottom: 5px; }
    .info-value { color: #333; font-size: 18px; font-weight: 600; }
    .button { display: inline-block; padding: 15px 40px; background: #ef1010; color: white !important; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 18px; margin: 30px 0; text-align: center; transition: background 0.3s; }
    .button:hover { background: #dc0000; }
    .benefits { background: linear-gradient(135deg, #c9ecc2 0%, #e8f5e9 100%); padding: 25px; border-radius: 8px; margin: 25px 0; box-shadow: 0 2px 8px rgba(201, 236, 194, 0.3); }
    .benefits h3 { color: #2e7d32; margin: 0 0 15px 0; }
    .benefits ul { margin: 0; padding: 0 0 0 20px; }
    .benefits li { color: #333; margin: 10px 0; line-height: 1.6; }
    .footer { background: linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%); color: white; text-align: center; padding: 30px 20px; }
  </style>
  <link href="https://fonts.googleapis.com/css2?family=Lobster&display=swap" rel="stylesheet">
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="language-flag">${flag}</div>
      <div class="logo-wrapper">
        <img src="${logoUrl}" alt="Asia Pharm Logo" class="logo" />
      </div>
      <h1 class="site-name">Азия Фарм</h1>
    </div>
    
    <div class="content">
      <h1 class="welcome-title">${t.welcome}</h1>
      <h2 class="greeting">${t.greeting}, ${userData.name}!</h2>
      <p class="message">${t.thankYou}</p>
      <p class="message">${t.registered}</p>
      
      <div class="info-box">
        <div class="info-row">
          <div class="info-label">${t.name}:</div>
          <div class="info-value">${userData.name}</div>
        </div>
        <div class="info-row">
          <div class="info-label">${t.email}:</div>
          <div class="info-value">${userData.email}</div>
        </div>
        <div class="info-row">
          <div class="info-label">${t.password}:</div>
          <div class="info-value">${userData.password || '••••••••'}</div>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="https://asia-pharm.com/profile" class="button">${t.loginButton}</a>
      </div>
      
      <div class="benefits">
        <h3>${t.benefits}</h3>
        <ul>
          <li>✅ ${t.benefit1}</li>
          <li>✅ ${t.benefit2}</li>
          <li>✅ ${t.benefit3}</li>
          <li>✅ ${t.benefit4}</li>
        </ul>
      </div>
    </div>
    
    <div class="footer">
      <p style="margin: 0; font-size: 16px;">${t.footer}</p>
      <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.8;">© 2025 Asia Pharm. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Helper function to translate delivery method
function translateDeliveryMethod(method: string, language: 'ru' | 'en' | 'zh' | 'vi'): string {
  const t = translations[language];
  const methodKey = method.toLowerCase().replace(/\s+/g, '_');
  
  // Try to match with translation keys
  if (methodKey.includes('почта') || methodKey.includes('post')) {
    return t.deliveryMethods.russian_post;
  } else if (methodKey.includes('пятерочка') || methodKey.includes('pyaterochka')) {
    return t.deliveryMethods.pyaterochka;
  } else if (methodKey.includes('авиа') || methodKey.includes('air')) {
    return t.deliveryMethods.air_delivery;
  }
  
  // Return original if no match
  return method;
}

// Generate email HTML template
export function generateOrderEmailHTML(data: OrderEmailData, language: 'ru' | 'en' | 'zh' | 'vi' = 'ru'): string {
  const t = translations[language];
  // Logo from GitHub repository
  const logoUrl = 'https://raw.githubusercontent.com/ilyairgsha-boop/asia-pharm/main/image/logo.png';

  // Language flags
  const flags = {
    ru: '🇷🇺',
    en: '🇬🇧',
    zh: '🇨🇳',
    vi: '🇻🇳'
  };

  // Generate product rows with clickable links
  const productRows = data.items.map(item => {
    const productUrl = item.id ? `https://asia-pharm.com/product/${item.id}` : 'https://asia-pharm.com';
    return `
    <tr>
      <td style="padding: 15px; border: 1px solid #e0e0e0; text-align: center;">
        <img src="${item.image || logoUrl}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" />
      </td>
      <td style="padding: 15px; border: 1px solid #e0e0e0;">
        <a href="${productUrl}" style="color: #ef1010; text-decoration: none; font-weight: 500; transition: opacity 0.3s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">${item.name}</a>
      </td>
      <td style="padding: 15px; border: 1px solid #e0e0e0; text-align: center;">${item.quantity}</td>
      <td style="padding: 15px; border: 1px solid #e0e0e0; text-align: right;">${formatCurrency(item.price)}</td>
      <td style="padding: 15px; border: 1px solid #e0e0e0; text-align: right;">${formatCurrency(item.total)}</td>
    </tr>
  `;
  }).join('');

  // Calculate subtotal
  const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);

  // Status specific content
  let statusMessage = t.messages[data.status];
  let additionalContent = '';

  // Payment methods ONLY for pending orders
  if (data.status === 'pending') {
    const cardNumber = data.paymentDetails?.cardNumber || '2202 2004 3395 7386';
    const contractNumber = data.paymentDetails?.contractNumber || '505 518 5408';
    
    additionalContent += `
      <div style="margin: 30px 0; padding: 20px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
        <h3 style="color: #856404; margin: 0 0 20px 0; text-align: center;">${t.paymentMethods}</h3>
        
        <!-- Three payment methods in horizontal layout -->
        <div style="display: flex; justify-content: space-between; gap: 15px; margin: 15px 0; flex-wrap: wrap;">
          
          <!-- Left: Sberbank Card -->
          <div style="flex: 1; min-width: 250px; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h4 style="color: #ef1010; margin: 0 0 15px 0; text-align: center; font-size: 16px;">💳 ${language === 'ru' ? 'Карта Сбербанк' : language === 'en' ? 'Sberbank Card' : language === 'zh' ? '储蓄银行卡' : 'Thẻ Sberbank'}</h4>
            <p style="margin: 5px 0 3px 0; color: #666; font-size: 12px; text-align: center;"><strong>${language === 'ru' ? 'Номер карты' : language === 'en' ? 'Card Number' : language === 'zh' ? '卡号' : 'Số thẻ'}:</strong></p>
            <p style="margin: 0 0 10px 0; font-size: 18px; color: #ef1010; font-weight: bold; letter-spacing: 1px; text-align: center;">${cardNumber}</p>
            <p style="margin: 0; color: #666; font-size: 12px; text-align: center; line-height: 1.4;">${language === 'ru' ? 'Переведите через мобильное приложение' : language === 'en' ? 'Transfer via mobile app' : language === 'zh' ? '通过移动应用转账' : 'Chuyển qua ứng dụng di động'}</p>
          </div>
          
          <!-- Center: QR Code -->
          <div style="flex: 1; min-width: 250px; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center;">
            <h4 style="color: #0088cc; margin: 0 0 15px 0; font-size: 16px;">📱 ${language === 'ru' ? 'QR-код (СБП)' : language === 'en' ? 'QR Code (SBP)' : language === 'zh' ? '二维码 (SBP)' : 'Mã QR (SBP)'}</h4>
            ${data.paymentDetails?.qrCodeUrl && data.paymentDetails.qrCodeUrl.trim() !== '' ? `
              <img src="${data.paymentDetails.qrCodeUrl}" alt="QR Code" style="max-width: 180px; max-height: 180px; margin: 10px auto; display: block; border: 2px solid #0088cc; border-radius: 8px;" />
              <p style="margin: 10px 0 0 0; color: #666; font-size: 12px; line-height: 1.4;">${language === 'ru' ? 'Отсканируйте в приложении банка' : language === 'en' ? 'Scan in bank app' : language === 'zh' ? '在银行应用中扫描' : 'Quét trong ứng dụng ngân hàng'}</p>
            ` : `
              <div style="width: 180px; height: 180px; margin: 10px auto; display: flex; align-items: center; justify-content: center; border: 2px dashed #0088cc; border-radius: 8px; background: #f0f8ff;">
                <p style="margin: 0; color: #0088cc; font-size: 14px; text-align: center; padding: 15px;">${language === 'ru' ? 'QR-ко�� будет отправлен отдельно' : language === 'en' ? 'QR code will be sent separately' : language === 'zh' ? '二维码将单独发送' : 'Mã QR sẽ được gửi riêng'}</p>
              </div>
            `}
          </div>
          
          <!-- Right: T-Bank -->
          <div style="flex: 1; min-width: 250px; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h4 style="color: #ffdd2d; margin: 0 0 15px 0; text-align: center; font-size: 16px;">🏦 ${language === 'ru' ? 'T-Bank' : language === 'en' ? 'T-Bank' : language === 'zh' ? 'T-Bank' : 'T-Bank'}</h4>
            <p style="margin: 5px 0 3px 0; color: #666; font-size: 12px; text-align: center;"><strong>${language === 'ru' ? 'Номер договора' : language === 'en' ? 'Contract Number' : language === 'zh' ? '合同号码' : 'Số hợp đồng'}:</strong></p>
            <p style="margin: 0 0 10px 0; font-size: 18px; color: #ffdd2d; font-weight: bold; letter-spacing: 1px; text-align: center;">${contractNumber}</p>
            <p style="margin: 0; color: #666; font-size: 12px; text-align: center; line-height: 1.4;">${language === 'ru' ? 'Переведите на счет по номеру через' : language === 'en' ? 'Transfer by contract number via' : language === 'zh' ? '通过合同号码转账' : 'Chuyển theo số hợp đồng qua'} <a href="https://www.tbank.ru/cardtocard/?tab=card2acc" style="color: #0088cc; text-decoration: none;">Card2Card</a></p>
          </div>
          
        </div>
        
        <p style="margin: 20px 0 0 0; color: #856404; font-size: 13px; text-align: center;"><strong>⚠️ ${language === 'ru' ? 'Важно: в комментариях к платежу укажите Вашу фамилию' : language === 'en' ? 'Important: Please specify your last name in payment comments' : language === 'zh' ? '重要：请在付款评论中注明您的姓氏' : 'Quan trọng: Vui lòng ghi họ của bạn trong ghi chú thanh toán'}</strong></p>
      </div>
    `;
  }

  // Tracking link for shipped orders
  if (data.status === 'shipped' && data.trackingNumber) {
    additionalContent += `
      <div style="margin: 30px 0; padding: 20px; background: #d1ecf1; border-left: 4px solid #0c5460; border-radius: 4px; text-align: center;">
        ${data.trackingUrl ? `
          <a href="${data.trackingUrl}" style="display: inline-block; padding: 15px 40px; background: #ef1010; color: white; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 18px;">
            ${t.trackOrder}
          </a>
        ` : ''}
      </div>
    `;
  }

  // Loyalty points information
  let loyaltyInfo = '';
  if (data.status === 'pending' || data.status === 'processing') {
    // For pending and processing: show points that WILL be earned
    if (data.loyaltyPointsEarned) {
      loyaltyInfo += `
        <p style="font-size: 18px; color: #28a745; margin: 10px 0;">
          <strong>${t.loyaltyPoints}: ${data.loyaltyPointsEarned}</strong>
        </p>
      `;
    }
  } else if (data.status === 'delivered') {
    // For delivered: show points that WERE earned
    if (data.loyaltyPointsEarned) {
      loyaltyInfo += `
        <p style="font-size: 18px; color: #28a745; margin: 10px 0;">
          <strong>${t.loyaltyPointsEarned}: ${data.loyaltyPointsEarned}</strong>
        </p>
      `;
    }
  }
  
  if (data.currentLoyaltyBalance !== undefined) {
    loyaltyInfo += `
      <p style="font-size: 18px; color: #666; margin: 10px 0;">
        <strong>${t.currentBalance}: ${data.currentLoyaltyBalance}</strong>
      </p>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.orderNumber} ${data.orderId}</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(180deg, #c9ecc2 0%, #ffffff 100%); }
    .container { max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 0 40px rgba(201, 236, 194, 0.5); position: relative; }
    .header { background: linear-gradient(180deg, #c9ecc2 0%, #ffffff 100%); padding: 40px 30px; text-align: center; position: relative; }
    .logo-wrapper { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 20px; }
    .logo { width: 120px; height: 120px; }
    .site-name { font-family: 'Lobster', cursive; font-size: 56px; color: #ef1010; text-shadow: 0 0 20px rgba(201, 236, 194, 0.8); margin: 0; }
    .language-flag { position: absolute; top: 20px; right: 20px; font-size: 28px; }
    .content { padding: 40px 30px; }
    .greeting { color: #ef1010; font-size: 32px; margin-bottom: 20px; font-weight: 600; }
    .thank-you { font-size: 20px; color: #333; margin-bottom: 10px; }
    .order-info { display: flex; justify-content: space-between; margin: 30px 0; flex-wrap: wrap; gap: 15px; }
    .order-info-item { font-size: 18px; color: #333; font-weight: 600; }
    .status-badge { display: inline-block; padding: 8px 20px; border-radius: 20px; font-weight: 600; font-size: 16px; }
    .status-pending { background: #fff3cd; color: #856404; }
    .status-processing { background: #cce5ff; color: #004085; }
    .status-shipped { background: #d1ecf1; color: #0c5460; }
    .status-delivered { background: #d4edda; color: #155724; }
    .status-cancelled { background: #f8d7da; color: #721c24; }
    .message-box { margin: 20px 0; padding: 20px; background: #f8f9fa; border-left: 4px solid #ef1010; border-radius: 4px; font-size: 18px; color: #333; }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    th { background: #ef1010; color: white; padding: 15px; text-align: left; font-weight: 600; }
    td { padding: 15px; border: 1px solid #e0e0e0; }
    .totals { text-align: right; margin: 20px 0; }
    .totals-row { display: flex; justify-content: flex-end; gap: 20px; margin: 10px 0; font-size: 18px; }
    .totals-label { font-weight: 600; min-width: 200px; text-align: right; }
    .totals-value { min-width: 150px; text-align: right; }
    .total-amount { font-size: 24px; color: #ef1010; font-weight: bold; }
    .delivery-info { margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 4px; }
    .footer { background: linear-gradient(180deg, #ffffff 0%, #c9ecc2 100%); padding: 40px 30px; text-align: center; }
    .footer-logo { width: 80px; height: 80px; margin: 0 auto 15px; }
    .footer-text { color: #333; font-size: 16px; }
    @media only screen and (max-width: 600px) {
      .content { padding: 20px 15px; }
      .site-name { font-size: 36px; }
      .greeting { font-size: 24px; }
      table { font-size: 14px; }
      th, td { padding: 10px 5px; }
      .order-info { flex-direction: column; }
    }
  </style>
  <link href="https://fonts.googleapis.com/css2?family=Lobster&display=swap" rel="stylesheet">
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="language-flag">${flags[language]}</div>
      <div class="logo-wrapper">
        <img src="${logoUrl}" alt="Asia Pharm Logo" class="logo" />
        <h1 class="site-name">Азия Фарм</h1>
      </div>
    </div>

    <!-- Content -->
    <div class="content">
      <h2 class="greeting">${t.greeting}, ${data.customerName}!</h2>
      ${data.status !== 'cancelled' ? `<p class="thank-you">${t.thankYou}</p>` : ''}

      <!-- Order Info -->
      <div class="order-info">
        <div class="order-info-item">${t.orderDate}: ${formatDate(data.orderDate)}</div>
        <div class="order-info-item">${t.orderNumber}: ${data.orderId}</div>
      </div>

      <!-- Status Message -->
      <div class="message-box">
        ${statusMessage}
      </div>

      <!-- Additional Content (Payment, Tracking, etc.) -->
      ${additionalContent}

      <!-- Products Table -->
      <table>
        <thead>
          <tr>
            <th style="width: 80px; text-align: center;">Фото</th>
            <th>${t.productName}</th>
            <th style="width: 100px; text-align: center;">${t.quantity}</th>
            <th style="width: 120px; text-align: right;">${t.price}</th>
            <th style="width: 120px; text-align: right;">${t.sum}</th>
          </tr>
        </thead>
        <tbody>
          ${productRows}
        </tbody>
      </table>

      <!-- Status (after table) for all statuses -->
      <div style="text-align: right; margin: 20px 0;">
        <span style="font-size: 18px; color: #666;">${t.orderStatus}: </span>
        <span class="status-badge status-${data.status}">${t.statuses[data.status]}</span>
      </div>

      <!-- Totals -->
      <div class="totals">
        <div class="totals-row">
          <div class="totals-label">Сумма товаров:</div>
          <div class="totals-value">${formatCurrency(subtotal)}</div>
        </div>
        
        ${data.promoCode ? `
          <div class="totals-row" style="color: #28a745;">
            <div class="totals-label">${t.promoCode} (${data.promoCode}):</div>
            <div class="totals-value">-${formatCurrency(data.promoDiscount || 0)}</div>
          </div>
        ` : ''}
        
        ${data.loyaltyPointsUsed ? `
          <div class="totals-row" style="color: #28a745;">
            <div class="totals-label">${t.loyaltyUsed}:</div>
            <div class="totals-value">-${formatCurrency(data.loyaltyPointsUsed)}</div>
          </div>
        ` : ''}
        
        <div class="totals-row">
          <div class="totals-label">${t.deliveryMethod}:</div>
          <div class="totals-value">${translateDeliveryMethod(data.deliveryMethod, language)}</div>
        </div>
        
        <div class="totals-row">
          <div class="totals-label">${t.deliveryCost}:</div>
          <div class="totals-value">${formatCurrency(data.deliveryCost)}</div>
        </div>
        
        <div class="totals-row total-amount">
          <div class="totals-label">${t.totalAmount}:</div>
          <div class="totals-value">${formatCurrency(data.totalAmount)}</div>
        </div>
      </div>

      <!-- Loyalty Points Info -->
      ${loyaltyInfo}

      <!-- Delivery Address -->
      <div class="delivery-info">
        <h3 style="margin: 0 0 15px 0; color: #333;">${t.deliveryAddress}</h3>
        <p style="margin: 5px 0; font-size: 18px;"><strong>${data.shippingAddress.fullName}</strong></p>
        <p style="margin: 5px 0; color: #666;">${data.shippingAddress.address}</p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <img src="${logoUrl}" alt="Asia Pharm" class="footer-logo" />
      <p class="footer-text">${t.footer} www.asia-pharm.com</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Generate plain text version of the email (for fallback)
export function generateOrderEmailText(data: OrderEmailData, language: 'ru' | 'en' | 'zh' | 'vi' = 'ru'): string {
  const t = translations[language];
  
  let text = `
${t.greeting}, ${data.customerName}!

${t.thankYou}

${t.orderDate}: ${formatDate(data.orderDate)}
${t.orderNumber}: ${data.orderId}
${t.orderStatus}: ${t.statuses[data.status]}

${t.messages[data.status]}
`;

  if (data.trackingNumber) {
    text += `\n${t.trackingNumber}: ${data.trackingNumber}\n`;
  }

  text += `\n${t.productName}:\n`;
  data.items.forEach(item => {
    text += `- ${item.name} x${item.quantity} = ${formatCurrency(item.total)}\n`;
  });

  text += `\n${t.deliveryMethod}: ${data.deliveryMethod}`;
  text += `\n${t.deliveryCost}: ${formatCurrency(data.deliveryCost)}`;
  text += `\n${t.totalAmount}: ${formatCurrency(data.totalAmount)}`;

  if (data.loyaltyPointsEarned) {
    text += `\n\n${t.loyaltyPoints}: ${data.loyaltyPointsEarned}`;
  }

  if (data.currentLoyaltyBalance !== undefined) {
    text += `\n${t.currentBalance}: ${data.currentLoyaltyBalance}`;
  }

  text += `\n\n${t.deliveryAddress}:\n${data.shippingAddress.fullName}\n${data.shippingAddress.address}`;
  
  text += `\n\n---\n${t.footer}\nwww.asia-pharm.com`;

  return text;
}

// Generate broadcast email HTML (for newsletter)
export function generateBroadcastEmailHTML(
  subject: string,
  htmlContent: string,
  language: 'ru' | 'en' | 'zh' | 'vi' = 'ru',
  unsubscribeUrl?: string
): string {
  // Logo from GitHub repository
  const logoUrl = 'https://raw.githubusercontent.com/ilyairgsha-boop/asia-pharm/main/image/logo.png';
  
  const flags = {
    ru: '🇷🇺',
    en: '🇬🇧',
    zh: '🇨🇳',
    vi: '🇻🇳'
  };

  const footerTranslations = {
    ru: {
      footer: 'Китайская Аптека Азия Фарм',
      email: 'Email',
      unsubscribe: 'Отписаться от рассылки',
      rights: 'Все права защищены'
    },
    en: {
      footer: 'Chinese Pharmacy Asia Pharm',
      email: 'Email',
      unsubscribe: 'Unsubscribe from newsletter',
      rights: 'All rights reserved'
    },
    zh: {
      footer: '中国药房亚洲药房',
      email: '电子邮件',
      unsubscribe: '取消订阅',
      rights: '版权所有'
    },
    vi: {
      footer: 'Nhà thuốc Trung Quốc Asia Pharm',
      email: 'Email',
      unsubscribe: 'Hủy đăng ký nhận tin',
      rights: 'Đã đăng ký bản quyền'
    }
  };

  const t = footerTranslations[language];

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(180deg, #c9ecc2 0%, #ffffff 100%); }
    .container { max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 0 40px rgba(201, 236, 194, 0.5); position: relative; }
    .header { background: linear-gradient(180deg, #c9ecc2 0%, #ffffff 100%); padding: 40px 30px; text-align: center; position: relative; }
    .logo-wrapper { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 20px; }
    .logo { width: 120px; height: 120px; }
    .site-name { font-family: 'Lobster', cursive; font-size: 56px; color: #ef1010; text-shadow: 0 0 20px rgba(201, 236, 194, 0.8); margin: 0; }
    .language-flag { position: absolute; top: 20px; right: 20px; font-size: 28px; }
    .content { padding: 40px 30px; }
    .footer { background: linear-gradient(180deg, #ffffff 0%, #c9ecc2 100%); padding: 40px 30px; text-align: center; color: #333; }
    .footer-logo { width: 80px; height: 80px; margin: 0 auto 15px; }
    .footer-text { font-size: 16px; margin: 10px 0; }
    .footer-contacts { font-size: 14px; margin: 15px 0; color: #666; }
    .footer-links { margin: 20px 0; }
    .footer-link { color: #ef1010; text-decoration: none; margin: 0 10px; font-size: 14px; }
    .footer-link:hover { text-decoration: underline; }
    @media only screen and (max-width: 600px) {
      .site-name { font-size: 36px; }
      .content { padding: 20px 15px; }
    }
  </style>
  <link href="https://fonts.googleapis.com/css2?family=Lobster&display=swap" rel="stylesheet">
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="language-flag">${flags[language]}</div>
      <div class="logo-wrapper">
        <img src="${logoUrl}" alt="Asia Pharm Logo" class="logo" />
        <h1 class="site-name">Азия Фарм</h1>
      </div>
    </div>
    <div class="content">
      ${htmlContent}
    </div>
    <div class="footer">
      <img src="${logoUrl}" alt="Asia Pharm Logo" class="footer-logo" />
      <p class="footer-text"><strong>${t.footer}</strong></p>
      <div class="footer-contacts">
        <p>${t.email}: <a href="mailto:info@asia-pharm.com" style="color: #ef1010;">info@asia-pharm.com</a></p>
        <p>www.asia-pharm.com</p>
      </div>
      ${unsubscribeUrl ? `
        <div class="footer-links">
          <a href="${unsubscribeUrl}" class="footer-link">${t.unsubscribe}</a>
        </div>
      ` : ''}
      <p style="margin: 20px 0 0 0; font-size: 12px; color: #999;">© 2025 Asia Pharm. ${t.rights}.</p>
    </div>
  </div>
</body>
</html>
  `;
}