import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Send, Users, Filter, History, Bell, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { oneSignalService } from '../../utils/oneSignal';
import { getServerUrl, getAnonKey, supabase } from '../../utils/supabase/client';

interface NotificationTemplate {
  id: string;
  name: string;
  title: Record<string, string>;
  message: Record<string, string>;
  type: 'order' | 'marketing' | 'system';
}

interface NotificationHistory {
  id: string;
  title: string;
  message: string;
  sentAt: string;
  recipients: number;
  delivered: number;
  clicked: number;
}

export const PushNotifications = () => {
  const { t, currentLanguage } = useLanguage();
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  
  // Notification form
  const [title, setTitle] = useState<Record<string, string>>({
    ru: '',
    en: '',
    zh: '',
    vi: '',
  });
  const [message, setMessage] = useState<Record<string, string>>({
    ru: '',
    en: '',
    zh: '',
    vi: '',
  });
  const [targetLanguage, setTargetLanguage] = useState<string>('all');
  const [targetStore, setTargetStore] = useState<string>('all');
  const [targetSegment, setTargetSegment] = useState<string>('all');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('');
  const [image, setImage] = useState('');

  // Templates
  const [templates] = useState<NotificationTemplate[]>([
    {
      id: 'welcome',
      name: 'Приветственное сообщение',
      title: {
        ru: '👋 Добро пожаловать в Азия Фарм!',
        en: '👋 Welcome to Asia Pharm!',
        zh: '👋 欢迎来到亚洲药房！',
        vi: '👋 Chào mừng đến với Asia Pharm!',
      },
      message: {
        ru: 'Спасибо за подписку! Получайте эксклюзивные предложения и новости о традиционной восточной медицине.',
        en: 'Thank you for subscribing! Get exclusive offers and news about traditional Eastern medicine.',
        zh: '感谢您的订阅！获取关于传统东方医学的独家优惠和新闻。',
        vi: 'Cảm ơn bạn đã đăng ký! Nhận ưu đãi độc quyền và tin tức về y học cổ truyền phương Đông.',
      },
      type: 'system',
    },
    {
      id: 'newProducts',
      name: 'Новые товары',
      title: {
        ru: '🆕 Новинки в каталоге!',
        en: '🆕 New Products Available!',
        zh: '🆕 新产品上架！',
        vi: '🆕 Sản phẩm mới!',
      },
      message: {
        ru: 'Посмотрите наши новые поступления традиционных препаратов. Специальные цены только сегодня!',
        en: 'Check out our new arrivals of traditional medicines. Special prices today only!',
        zh: '查看我们新到的传统药品。仅今天特价！',
        vi: 'Xem các sản phẩm y học cổ truyền mới. Giá đặc biệt chỉ hôm nay!',
      },
      type: 'marketing',
    },
    {
      id: 'sale',
      name: 'Распродажа',
      title: {
        ru: '🔥 Большая распродажа!',
        en: '🔥 Big Sale!',
        zh: '🔥 大促销！',
        vi: '🔥 Giảm giá lớn!',
      },
      message: {
        ru: 'Скидки до 50% на популярные товары! Не упустите возможность купить с выгодой.',
        en: 'Up to 50% off on popular products! Don\'t miss this great opportunity.',
        zh: '热门产品最高可享50%折扣！不要错过这个好机会。',
        vi: 'Giảm giá tới 50% cho các sản phẩm phổ biến! Đừng bỏ lỡ cơ hội tuyệt vời này.',
      },
      type: 'marketing',
    },
    {
      id: 'orderShipped',
      name: 'Заказ отправлен',
      title: {
        ru: '🚚 Ваш заказ в пути!',
        en: '🚚 Your Order is on the way!',
        zh: '🚚 您的订单在运送中！',
        vi: '🚚 Đơn hàng của bạn đang trên đường!',
      },
      message: {
        ru: 'Ваш заказ отправлен. Проверьте статус в личном кабинете.',
        en: 'Your order has been shipped. Check status in your account.',
        zh: '您的订单已发货。请在您的账户中查看状态。',
        vi: 'Đơn hàng của bạn đã được gửi. Kiểm tra trạng thái trong tài khoản của bạn.',
      },
      type: 'order',
    },
  ]);

  // History
  const [history] = useState<NotificationHistory[]>([]);

  // Load subscriber count
  const loadSubscriberCount = async () => {
    if (!isConfigured) {
      setSubscriberCount(null);
      return;
    }

    try {
      console.log('📊 Loading subscriber count from database...');
      
      // Query database directly for active push subscriptions
      const { count, error } = await supabase
        .from('user_push_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (error) {
        console.error('❌ Error loading subscriber count:', error);
        setSubscriberCount(0);
        return;
      }

      const totalCount = count || 0;
      setSubscriberCount(totalCount);
      console.log('✅ Active push subscriptions in database:', totalCount);
      
    } catch (error) {
      console.error('❌ Error loading subscriber count:', error);
      setSubscriberCount(0);
    }
  };

  useEffect(() => {
    // Check if OneSignal is configured (has credentials)
    const checkConfiguration = () => {
      const configured = oneSignalService.isConfigured();
      console.log('🔍 PushNotifications: checking configuration:', configured);
      setIsConfigured(configured);
      
      // Load subscriber count if configured
      if (configured) {
        loadSubscriberCount();
      }
    };
    
    checkConfiguration();
    
    // Listen for settings updates
    const handleSettingsUpdate = () => {
      console.log('📡 PushNotifications: settings updated, rechecking...');
      checkConfiguration();
    };
    
    window.addEventListener('oneSignalSettingsUpdated', handleSettingsUpdate);
    
    return () => {
      window.removeEventListener('oneSignalSettingsUpdated', handleSettingsUpdate);
    };
  }, [isConfigured]);

  const handleLoadTemplate = (template: NotificationTemplate) => {
    setTitle(template.title);
    setMessage(template.message);
    toast.success(t('templateLoaded'));
  };

  const handleSendTestToMe = async () => {
    // Validation
    if (!title[currentLanguage] || !message[currentLanguage]) {
      toast.error(t('fillRequiredFields'));
      return;
    }

    if (!isConfigured) {
      toast.error(t('oneSignalNotConfigured'));
      return;
    }

    setIsSending(true);

    try {
      // Check if user is subscribed
      const isSubscribed = await oneSignalService.isSubscribed();
      const playerId = await oneSignalService.getUserId();
      
      if (!isSubscribed || !playerId) {
        toast.error('You must be subscribed to receive test notifications. Please enable notifications first.');
        setIsSending(false);
        return;
      }

      console.log('🧪 Sending test notification to Player ID:', playerId);

      // Prepare notification data
      const notificationData = {
        title: title[currentLanguage],
        message: message[currentLanguage],
        url: url || undefined,
        icon: icon || undefined,
        image: image || undefined,
      };

      // Send to current user
      const result = await oneSignalService.sendToCurrentUser(notificationData);

      if (result && result.id) {
        toast.success(`✅ Test notification sent! Check your browser. (ID: ${result.id.substring(0, 8)}...)`);
      } else {
        toast.error('Failed to send test notification. Check console for details.');
      }
    } catch (error: any) {
      console.error('Error sending test notification:', error);
      toast.error(error.message || 'Failed to send test notification');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendNotification = async () => {
    // Validation
    if (!title[currentLanguage] || !message[currentLanguage]) {
      toast.error(t('fillRequiredFields'));
      return;
    }

    if (!isConfigured) {
      toast.error(t('oneSignalNotConfigured'));
      return;
    }

    setIsSending(true);

    try {
      // Prepare notification data
      const notificationData = {
        title: title[currentLanguage],
        message: message[currentLanguage],
        url: url || undefined,
        icon: icon || undefined,
        image: image || undefined,
      };

      // Prepare targeting options
      const options: any = {};
      
      // IMPORTANT: For OneSignal SDK v16, we should use External User IDs (Supabase User IDs)
      // instead of segments for reliable delivery
      // The Edge Function will automatically fetch user IDs from database if not provided
      
      // Note: segments option is removed - Edge Function will get External User IDs from DB
      
      if (targetLanguage !== 'all') {
        options.language = targetLanguage;
      }
      
      if (targetStore !== 'all') {
        options.store = targetStore;
      }

      console.log('📤 Sending notification with options:', options);

      // Send notification
      const result = await oneSignalService.sendNotification(notificationData, options);

      if (result) {
        toast.success(t('notificationSent', { recipients: result.recipients }));
        
        // Clear form
        setTitle({ ru: '', en: '', zh: '', vi: '' });
        setMessage({ ru: '', en: '', zh: '', vi: '' });
        setUrl('');
        setIcon('');
        setImage('');
      } else {
        toast.error(t('notificationSendError'));
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error(t('notificationSendError'));
    } finally {
      setIsSending(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="space-y-4">
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {t('oneSignalNotConfiguredWarning')}
          </AlertDescription>
        </Alert>
        <p className="text-gray-600">{t('configureOneSignalFirst')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Send className="w-8 h-8 text-red-600" />
          <div>
            <h2 className="text-2xl font-semibold">{t('pushNotifications')}</h2>
            <p className="text-gray-600">{t('sendPushNotificationsToUsers')}</p>
          </div>
        </div>
        {subscriberCount !== null && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <Users className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-sm text-gray-600">{t('pushSubscribers')}</div>
              <div className="text-2xl font-bold text-green-600">{subscriberCount}</div>
            </div>
            <button
              onClick={loadSubscriberCount}
              className="ml-2 text-gray-600 hover:text-gray-800"
              title={t('refresh')}
            >
              🔄
            </button>
          </div>
        )}
      </div>

      <Tabs defaultValue="send" className="space-y-6">
        <TabsList>
          <TabsTrigger value="send">
            <Send className="w-4 h-4 mr-2" />
            {t('sendNotification')}
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Bell className="w-4 h-4 mr-2" />
            {t('templates')}
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            {t('history')}
          </TabsTrigger>
        </TabsList>

        {/* Send Notification Tab */}
        <TabsContent value="send" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('notificationContent')}</CardTitle>
              <CardDescription>{t('fillNotificationContent')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title for each language */}
              <div className="space-y-3">
                <Label>{t('title')} <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">🇷🇺 {t('russian')}</Label>
                    <Input
                      placeholder={t('notificationTitle')}
                      value={title.ru}
                      onChange={(e) => setTitle({ ...title, ru: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">🇬🇧 {t('english')}</Label>
                    <Input
                      placeholder="Notification title"
                      value={title.en}
                      onChange={(e) => setTitle({ ...title, en: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">🇨🇳 {t('chinese')}</Label>
                    <Input
                      placeholder="通知标题"
                      value={title.zh}
                      onChange={(e) => setTitle({ ...title, zh: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">🇻🇳 {t('vietnamese')}</Label>
                    <Input
                      placeholder="Tiêu đề thông báo"
                      value={title.vi}
                      onChange={(e) => setTitle({ ...title, vi: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Message for each language */}
              <div className="space-y-3">
                <Label>{t('message')} <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">🇷🇺 {t('russian')}</Label>
                    <Textarea
                      placeholder={t('notificationMessage')}
                      value={message.ru}
                      onChange={(e) => setMessage({ ...message, ru: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">🇬🇧 {t('english')}</Label>
                    <Textarea
                      placeholder="Notification message"
                      value={message.en}
                      onChange={(e) => setMessage({ ...message, en: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">🇨🇳 {t('chinese')}</Label>
                    <Textarea
                      placeholder="通知消息"
                      value={message.zh}
                      onChange={(e) => setMessage({ ...message, zh: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">🇻🇳 {t('vietnamese')}</Label>
                    <Textarea
                      placeholder="Nội dung thông báo"
                      value={message.vi}
                      onChange={(e) => setMessage({ ...message, vi: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* URL (Optional) */}
              <div className="space-y-2">
                <Label>{t('url')} ({t('optional')})</Label>
                <Input
                  type="url"
                  placeholder="https://asia-pharm.com/products/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <p className="text-sm text-gray-500">{t('urlDescription')}</p>
              </div>

              {/* Icon and Image */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('iconUrl')} ({t('optional')})</Label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">{t('iconUrlDescription')}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t('imageUrl')} ({t('optional')})</Label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">{t('imageUrlDescription')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Filter className="w-5 h-5 inline mr-2" />
                {t('targeting')}
              </CardTitle>
              <CardDescription>{t('selectTargetAudience')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Language */}
              <div className="space-y-2">
                <Label>{t('language')}</Label>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allLanguages')}</SelectItem>
                    <SelectItem value="ru">🇷🇺 {t('russian')}</SelectItem>
                    <SelectItem value="en">🇬🇧 {t('english')}</SelectItem>
                    <SelectItem value="zh">🇨🇳 {t('chinese')}</SelectItem>
                    <SelectItem value="vi">🇻🇳 {t('vietnamese')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Store */}
              <div className="space-y-2">
                <Label>{t('store')}</Label>
                <Select value={targetStore} onValueChange={setTargetStore}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allStores')}</SelectItem>
                    <SelectItem value="china">{t('chinaStore')}</SelectItem>
                    <SelectItem value="thailand">{t('thailandStore')}</SelectItem>
                    <SelectItem value="vietnam">{t('vietnamStore')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Segment */}
              <div className="space-y-2">
                <Label>{t('segment')}</Label>
                <Select value={targetSegment} onValueChange={setTargetSegment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allUsers')}</SelectItem>
                    <SelectItem value="subscribed">{t('subscribedUsers')}</SelectItem>
                    <SelectItem value="active">{t('activeUsers')}</SelectItem>
                    <SelectItem value="inactive">{t('inactiveUsers')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              onClick={handleSendTestToMe}
              disabled={isSending}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Bell className="w-4 h-4 mr-2" />
              {isSending ? t('sending') : '🧪 Test - Send to Me'}
            </Button>
            <Button
              onClick={handleSendNotification}
              disabled={isSending}
              className="bg-red-600 hover:bg-red-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSending ? t('sending') : t('sendNotification')}
            </Button>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('notificationTemplates')}</CardTitle>
              <CardDescription>{t('useTemplatesDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleLoadTemplate(template)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge variant={template.type === 'order' ? 'default' : template.type === 'marketing' ? 'destructive' : 'secondary'}>
                        {t(template.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>{template.title[currentLanguage]}</strong>
                    </p>
                    <p className="text-sm text-gray-500">
                      {template.message[currentLanguage]}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('notificationHistory')}</CardTitle>
              <CardDescription>{t('viewSentNotifications')}</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{t('noNotificationsSent')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-gray-600">{item.message}</p>
                        </div>
                        <span className="text-xs text-gray-500">{item.sentAt}</span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>👥 {item.recipients} {t('recipients')}</span>
                        <span>✅ {item.delivered} {t('delivered')}</span>
                        <span>👆 {item.clicked} {t('clicked')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
