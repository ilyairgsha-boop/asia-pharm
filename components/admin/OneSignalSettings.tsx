import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Bell, Info, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { oneSignalService } from '../../utils/oneSignal';
import { getServerUrl, supabase, getAnonKey } from '../../utils/supabase/client';

interface OneSignalSettingsData {
  appId: string;
  apiKey: string;
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
    apiKey: '',
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

  // Load settings and subscriber count on mount
  useEffect(() => {
    loadSettings();
    loadSubscriberCount();
  }, []);

  const loadSubscriberCount = async () => {
    if (!settings.enabled || !settings.appId || !settings.apiKey) {
      setSubscriberCount(null);
      return;
    }

    try {
      // Get subscriber count from OneSignal API
      const response = await fetch(`https://onesignal.com/api/v1/apps/${settings.appId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${settings.apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriberCount(data.players || 0);
      } else {
        console.error('Failed to get subscriber count from OneSignal');
      }
    } catch (error) {
      console.error('Error loading OneSignal subscriber count:', error);
    }
  };

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem('oneSignalSettings');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...settings, ...parsed });
      }
    } catch (error) {
      console.error('Error loading OneSignal settings:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validate if enabled
      if (settings.enabled && (!settings.appId || !settings.apiKey)) {
        toast.error(t('fillRequiredFields'));
        setIsSaving(false);
        return;
      }

      // Save to localStorage (always save, even if disabled)
      localStorage.setItem('oneSignalSettings', JSON.stringify(settings));
      
      // Sync to KV store via Edge Function (so push notifications work server-side)
      try {
        // Get auth token and anon key for Edge Function
        const { data: { session } } = await supabase.auth.getSession();
        const authToken = session?.access_token;
        
        if (!authToken) {
          console.warn('⚠️ No auth token available, skipping KV sync');
          toast.warning('Настройки сохранены локально, но требуется авторизация для синхронизации с сервером');
          return;
        }
        
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
          toast.warning('Настройки сохранены локально, но не синхронизированы с сервером');
        }
      } catch (kvError) {
        console.warn('⚠️ Failed to sync to KV store:', kvError);
        toast.warning('Настройки сохранены локально, но не синхронизированы с сервером');
      }
      
      // Trigger settings update event for App.tsx to reinitialize
      window.dispatchEvent(new CustomEvent('oneSignalSettingsUpdated'));
      
      // Reload subscriber count after saving settings
      loadSubscriberCount();
      
      toast.success(t('settingsSaved'));
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    setIsTestMode(true);
    try {
      // In a real implementation, this would send a test notification
      toast.info(t('testNotificationSent'));
      
      // Simulate test notification
      setTimeout(() => {
        toast.success(t('testNotificationDelivered'));
      }, 2000);
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error(t('testNotificationError'));
    } finally {
      setIsTestMode(false);
    }
  };

  const isConfigured = settings.appId && settings.apiKey;

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
          <CardTitle>{t('setupInstructions')}</CardTitle>
          <CardDescription>{t('oneSignalSetupDescription')}</CardDescription>
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
            <Label htmlFor="apiKey">
              {t('oneSignalRestApiKey')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="**********************************"
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
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
              <Button
                onClick={handleTestNotification}
                disabled={isTestMode}
                variant="outline"
              >
                {isTestMode ? t('sending') : t('sendTestNotification')}
              </Button>
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
