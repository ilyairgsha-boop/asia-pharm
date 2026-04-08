import { Bell, Info, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from "sonner@2.0.3";
import { getServerUrl, supabase, getAnonKey } from '../../utils/supabase/client';

interface OneSignalSettingsData {
  appId: string;
  restApiKey: string; // Changed from apiKey to match Edge Function
  safariWebId?: string;
  enabled: boolean;
  autoSubscribe: boolean;
  welcomeNotification: boolean;
  orderNotifications: boolean;
  marketingNotifications: boolean;
}

export const OneSignalSettings = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<OneSignalSettingsData>({
    appId: '',
    restApiKey: '',
    safariWebId: '',
    enabled: false,
    autoSubscribe: false,
    welcomeNotification: true,
    orderNotifications: true,
    marketingNotifications: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Load subscriber count when settings change
  useEffect(() => {
    if (settings.enabled && settings.appId && settings.restApiKey) {
      loadSubscriberCount();
    }
  }, [settings.enabled, settings.appId, settings.restApiKey]);

  const loadSubscriberCount = async () => {
    if (!settings.enabled || !settings.appId || !settings.restApiKey) {
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

  const loadSettings = async () => {
    try {
      console.log('📥 Loading OneSignal settings...');
      
      // 1️⃣ Try to load from Supabase (primary source)
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'oneSignal')
          .maybeSingle(); // Use maybeSingle() instead of single() to avoid 406 error
        
        if (error) {
          console.error('❌ Failed to load from Supabase:', error.message, error.code);
          throw error;
        }
        
        if (data) {
          console.log('✅ Loaded OneSignal settings from Supabase');
          const parsed = data.value as OneSignalSettingsData;
          
          // Migrate old apiKey to restApiKey
          if ((parsed as any).apiKey && !parsed.restApiKey) {
            parsed.restApiKey = (parsed as any).apiKey;
            delete (parsed as any).apiKey;
          }
          
          setSettings({ ...settings, ...parsed });
          
          // Sync to localStorage for offline access
          localStorage.setItem('oneSignalSettings', JSON.stringify(parsed));
          
          // Dispatch event for App.tsx to reload
          window.dispatchEvent(new CustomEvent('oneSignalSettingsUpdated'));
          
          return;
        } else {
          console.warn('⚠️ No OneSignal settings found in Supabase');
          console.log('💡 Creating default settings record...');
          
          // Create default settings
          const defaultSettings = {
            appId: '',
            restApiKey: '',
            safariWebId: '',
            enabled: false,
            autoSubscribe: false,
            welcomeNotification: true,
            orderNotifications: true,
            marketingNotifications: false,
          };
          
          try {
            const { error: insertError } = await supabase
              .from('settings')
              .insert({
                key: 'oneSignal',
                value: defaultSettings,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            
            if (insertError) {
              console.error('❌ Failed to create default settings:', insertError);
            } else {
              console.log('✅ Created default OneSignal settings');
              setSettings({ ...settings, ...defaultSettings });
              localStorage.setItem('oneSignalSettings', JSON.stringify(defaultSettings));
            }
          } catch (insertErr) {
            console.error('❌ Error creating default settings:', insertErr);
          }
        }
      } catch (dbError) {
        console.error('❌ Database error loading settings:', dbError);
      }
      
      // 2️⃣ Fallback to localStorage (for backward compatibility)
      const stored = localStorage.getItem('oneSignalSettings');
      if (stored) {
        console.log('📦 Loaded OneSignal settings from localStorage');
        const parsed = JSON.parse(stored);
        
        // Migrate old apiKey to restApiKey
        if (parsed.apiKey && !parsed.restApiKey) {
          parsed.restApiKey = parsed.apiKey;
          delete parsed.apiKey;
        }
        
        setSettings({ ...settings, ...parsed });
        
        // Migrate to Supabase for future use
        try {
          await supabase
            .from('settings')
            .upsert({
              key: 'oneSignal',
              value: parsed,
              updated_at: new Date().toISOString()
            });
          console.log('✅ Migrated localStorage settings to Supabase');
        } catch (migrateError) {
          console.warn('⚠️ Failed to migrate to Supabase:', migrateError);
        }
      }
    } catch (error) {
      console.error('❌ Error loading OneSignal settings:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validate if enabled
      if (settings.enabled && (!settings.appId || !settings.restApiKey)) {
        toast.error(t('fillRequiredFields'));
        setIsSaving(false);
        return;
      }

      console.log(' Saving OneSignal settings...');
      
      // 1️⃣ Save to Supabase (primary storage - syncs across devices)
      try {
        const { error } = await supabase
          .from('settings')
          .upsert({
            key: 'oneSignal',
            value: settings,
            updated_at: new Date().toISOString()
          });
        
        if (error) {
          console.error('❌ Failed to save to Supabase:', error);
          toast.error('Ошибка сохранения в базу данных: ' + error.message);
          setIsSaving(false);
          return;
        }
        
        console.log('✅ OneSignal settings saved to Supabase');
      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        toast.error('Ошибка подключения к базе данных');
        setIsSaving(false);
        return;
      }
      
      // 2️⃣ Sync to localStorage (for offline access)
      localStorage.setItem('oneSignalSettings', JSON.stringify(settings));
      console.log('✅ OneSignal settings synced to localStorage');
      
      // 3️⃣ Sync to KV store via Edge Function (for server-side push notifications)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const authToken = session?.access_token;
        
        if (!authToken) {
          console.warn('⚠️ No auth token available, skipping KV sync');
        } else {
          const syncUrl = getServerUrl('/api/kv/set');
          const response = await fetch(syncUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
              'apikey': getAnonKey(),
            },
            body: JSON.stringify({
              key: 'oneSignalSettings',
              value: settings,
            }),
          });
          
          if (response.ok) {
            console.log('✅ OneSignal settings synced to KV store');
          } else {
            const errorData = await response.json();
            console.warn('⚠️ Failed to sync to KV store:', errorData);
          }
        }
      } catch (kvError) {
        console.warn('⚠️ Failed to sync to KV store:', kvError);
      }
      
      // Trigger settings update event for App.tsx to reinitialize
      window.dispatchEvent(new CustomEvent('oneSignalSettingsUpdated'));
      
      // Reload subscriber count after saving settings
      loadSubscriberCount();
      
      toast.success(t('settingsSaved') + ' ✅ Доступно на всех устройствах');
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      toast.error(t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    setIsTestMode(true);
    try {
      // Dynamically import oneSignalService
      const { oneSignalService } = await import('../../utils/oneSignal');
      
      // Check if user is subscribed
      const isSubscribed = await oneSignalService.isSubscribed();
      if (!isSubscribed) {
        toast.warning('Сначала подпишитесь на уведомления');
        setIsTestMode(false);
        return;
      }
      
      // Send test notification
      const result = await oneSignalService.sendNotification(
        {
          title: 'Тестовое уведомление',
          message: 'Это тестовое push-уведомление от Asia Pharm',
        },
        {
          segments: ['All'],
        }
      );
      
      if (result) {
        toast.success(`Уведомление отправлено (получателей: ${result.recipients})`);
      } else {
        toast.error('Ошибка отправки уведомления');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error(t('testNotificationError'));
    } finally {
      setIsTestMode(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      // Dynamically import oneSignalService
      const { oneSignalService } = await import('../../utils/oneSignal');
      
      const userId = await oneSignalService.subscribe();
      if (userId) {
        toast.success(`Подписка оформлена! Player ID: ${userId}`);
        loadSubscriberCount();
      } else {
        toast.error('Не удалось подписаться');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error('Ошибка подписки');
    }
  };

  const isConfigured = settings.appId && settings.restApiKey;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="w-8 h-8 text-red-600" />
        <div>
          <h2 className="text-2xl font-semibold">{t('pushNotificationsSettings')}</h2>
          <p className="text-gray-600">{t('pushNotificationsDescription')}</p>
        </div>
      </div>

      {/* Status Alert */}
      {settings.enabled && isConfigured ? (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="flex items-center justify-between">
              <span>{t('oneSignalConfigured')}</span>
              {subscriberCount !== null && (
                <span className="ml-4">
                  📱 {t('pushSubscribers')}: <strong>{subscriberCount}</strong>
                  <button
                    onClick={loadSubscriberCount}
                    className="ml-2 text-gray-600 hover:text-gray-800"
                    title="Обновить"
                  >
                    🔄
                  </button>
                </span>
              )}
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-yellow-50 border-yellow-200">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {t('oneSignalNotConfigured')}
          </AlertDescription>
        </Alert>
      )}

      {/* Enable/Disable Toggle - Main Control */}
      <Card className="border-2 border-red-200 bg-red-50/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-lg font-semibold">{t('enablePushNotifications')}</Label>
              <p className="text-sm text-gray-600">{t('enablePushNotificationsDescription')}</p>
              {!isConfigured && (
                <p className="text-sm text-red-600 font-medium pt-1">
                  ⚠️ {t('firstFillCredentials')}
                </p>
              )}
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
              className="scale-125"
            />
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">{t('setupInstructions')}</CardTitle>
          <CardDescription className="text-white">{t('oneSignalSetupDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <p><strong>1. {t('createOneSignalAccount')}</strong></p>
            <p className="text-gray-600 pl-4">
              {t('visitWebsite')}: <a href="https://onesignal.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://onesignal.com</a>
            </p>
            
            <p className="pt-2"><strong>2. {t('createNewApp')}</strong></p>
            <p className="text-gray-600 pl-4">{t('selectWebPushPlatform')}</p>
            
            <p className="pt-2"><strong>3. {t('getCredentials')}</strong></p>
            <ul className="text-gray-600 pl-8 list-disc space-y-1">
              <li><strong>App ID:</strong> {t('findInSettings')} → Keys & IDs</li>
              <li><strong>REST API Key:</strong> {t('findInSettings')} → Keys & IDs</li>
              <li><strong>Safari Web ID:</strong> {t('optionalForSafari')}</li>
            </ul>
            
            <p className="pt-2"><strong>4. {t('configureWebPush')}</strong></p>
            <ul className="text-gray-600 pl-8 list-disc space-y-1">
              <li>{t('addSiteUrl')}: <code className="bg-gray-100 px-1 rounded">{window.location.origin}</code></li>
              <li>{t('uploadIcon')}: 256x256px PNG</li>
              <li>{t('setPermissionPrompt')}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('configuration')}</CardTitle>
          <CardDescription>{t('enterOneSignalCredentials')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* App ID */}
          <div className="space-y-2">
            <Label htmlFor="appId">
              {t('oneSignalAppId')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="appId"
              type="text"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={settings.appId}
              onChange={(e) => setSettings({ ...settings, appId: e.target.value })}
            />
            <p className="text-sm text-gray-500">{t('oneSignalAppIdDescription')}</p>
          </div>

          {/* REST API Key */}
          <div className="space-y-2">
            <Label htmlFor="restApiKey">
              {t('oneSignalRestApiKey')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="restApiKey"
              type="password"
              placeholder="**********************************"
              value={settings.restApiKey}
              onChange={(e) => setSettings({ ...settings, restApiKey: e.target.value })}
            />
            <p className="text-sm text-gray-500">{t('oneSignalRestApiKeyDescription')}</p>
          </div>

          {/* Safari Web ID (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="safariWebId">{t('safariWebId')} ({t('optional')})</Label>
            <Input
              id="safariWebId"
              type="text"
              placeholder="web.onesignal.auto.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={settings.safariWebId}
              onChange={(e) => setSettings({ ...settings, safariWebId: e.target.value })}
            />
            <p className="text-sm text-gray-500">{t('safariWebIdDescription')}</p>
          </div>

          {/* Notification Options */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium">{t('notificationOptions')}</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('autoSubscribe')}</Label>
                <p className="text-sm text-gray-600">{t('autoSubscribeDescription')}</p>
              </div>
              <Switch
                checked={settings.autoSubscribe}
                onCheckedChange={(checked) => setSettings({ ...settings, autoSubscribe: checked })}
                disabled={!settings.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('welcomeNotification')}</Label>
                <p className="text-sm text-gray-600">{t('welcomeNotificationDescription')}</p>
              </div>
              <Switch
                checked={settings.welcomeNotification}
                onCheckedChange={(checked) => setSettings({ ...settings, welcomeNotification: checked })}
                disabled={!settings.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('orderStatusNotifications')}</Label>
                <p className="text-sm text-gray-600">{t('orderStatusNotificationsDescription')}</p>
              </div>
              <Switch
                checked={settings.orderNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, orderNotifications: checked })}
                disabled={!settings.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('marketingNotifications')}</Label>
                <p className="text-sm text-gray-600">{t('marketingNotificationsDescription')}</p>
              </div>
              <Switch
                checked={settings.marketingNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, marketingNotifications: checked })}
                disabled={!settings.enabled}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSaving ? t('saving') : t('saveSettings')}
            </Button>
            
            {isConfigured && settings.enabled && (
              <>
                <Button
                  onClick={handleSubscribe}
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  🔔 {t('subscribeToNotifications')}
                </Button>
                <Button
                  onClick={handleTestNotification}
                  disabled={isTestMode}
                  variant="outline"
                >
                  {isTestMode ? t('sending') : t('testSendToMe')}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Card */}
      {isConfigured && settings.enabled && (
        <Card>
          <CardHeader>
            <CardTitle>{t('statistics')}</CardTitle>
            <CardDescription>{t('pushNotificationStatistics')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{t('totalSubscribers')}</p>
                <p className="text-2xl font-semibold">—</p>
                <p className="text-xs text-gray-500">{t('viewInOneSignal')}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{t('notificationsSent')}</p>
                <p className="text-2xl font-semibold">—</p>
                <p className="text-xs text-gray-500">{t('last30Days')}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{t('clickRate')}</p>
                <p className="text-2xl font-semibold">—</p>
                <p className="text-xs text-gray-500">{t('averageClickRate')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};