/**
 * OneSignal Push Notifications Utility
 * Handles all push notification operations for Asia Pharm
 * 
 * DEBUG COMMANDS (console):
 * - Check if configured: oneSignalService.isConfigured()
 * - Get settings: localStorage.getItem('oneSignalSettings')
 * - Force reload: oneSignalService.reloadSettings()
 * - Check subscription: await oneSignalService.isSubscribed()
 * - Get user ID: await oneSignalService.getUserId()
 */

import { getServerUrl } from './supabase/client';

export interface PushNotificationData {
  title: string;
  message: string;
  url?: string;
  icon?: string;
  image?: string;
  data?: Record<string, any>;
}

export interface SegmentOptions {
  userIds?: string[];
  segments?: string[];
  tags?: Record<string, string>;
  language?: string;
  store?: 'china' | 'thailand' | 'vietnam';
}

export class OneSignalService {
  private appId: string;
  private apiKey: string;
  private apiUrl = 'https://onesignal.com/api/v1';
  private isInitialized = false;

  constructor() {
    // Get credentials from environment or localStorage
    this.reloadSettings();
  }

  /**
   * Reload settings from localStorage
   */
  reloadSettings() {
    const settings = this.getSettings();
    this.appId = settings.appId || '';
    // Support both old (apiKey) and new (restApiKey) format
    this.apiKey = settings.restApiKey || settings.apiKey || '';
    console.log('🔄 Settings reloaded:', {
      hasAppId: !!this.appId,
      hasApiKey: !!this.apiKey,
    });
    // Don't reset isInitialized flag when reloading settings
  }

  /**
   * Get OneSignal settings from localStorage
   */
  private getSettings() {
    try {
      const settings = localStorage.getItem('oneSignalSettings');
      const parsed = settings ? JSON.parse(settings) : {};
      
      // Support both old (apiKey) and new (restApiKey) format
      const apiKey = parsed.restApiKey || parsed.apiKey;
      
      console.log('📋 OneSignal settings loaded:', {
        enabled: parsed.enabled,
        hasAppId: !!parsed.appId,
        hasRestApiKey: !!parsed.restApiKey,
        hasApiKey: !!parsed.apiKey,
        hasAnyKey: !!apiKey,
        appIdLength: parsed.appId?.length,
      });
      
      return parsed;
    } catch (error) {
      console.error('Error loading OneSignal settings:', error);
      return {};
    }
  }

  /**
   * Check if OneSignal is configured (credentials are set)
   */
  isConfigured(): boolean {
    const settings = this.getSettings();
    const apiKey = settings.restApiKey || settings.apiKey;
    const result = !!(settings.appId && apiKey);
    console.log('🔍 isConfigured check:', {
      hasAppId: !!settings.appId,
      hasApiKey: !!apiKey,
      result: result
    });
    return result;
  }

  /**
   * Check if OneSignal is enabled and configured
   */
  isEnabled(): boolean {
    const settings = this.getSettings();
    const apiKey = settings.restApiKey || settings.apiKey;
    const result = !!(settings.enabled && settings.appId && apiKey);
    console.log('🔍 isEnabled check:', {
      enabled: settings.enabled,
      hasAppId: !!settings.appId,
      hasApiKey: !!apiKey,
      result: result
    });
    return result;
  }

  /**
   * Initialize OneSignal SDK in browser
   */
  async initializeSDK(): Promise<void> {
    // Reload settings to get latest values
    this.reloadSettings();
    
    if (!this.isEnabled()) {
      console.log('ℹ️ OneSignal not enabled or not configured, skipping initialization');
      return;
    }

    // Check if OneSignal is already initialized globally
    if (window.OneSignal && window.OneSignal.initialized) {
      console.log('✅ OneSignal already initialized globally, skipping');
      this.isInitialized = true;
      return;
    }

    // If already initialized in our service, skip
    if (this.isInitialized) {
      console.log('✅ OneSignal already initialized in service, skipping');
      return;
    }

    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="OneSignalSDK"]');
    
    if (!existingScript) {
      // Load OneSignal SDK
      console.log('📥 Loading OneSignal SDK script...');
      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';
      script.async = true;
      document.head.appendChild(script);

      await new Promise<void>((resolve, reject) => {
        script.onload = () => {
          console.log('✅ OneSignal SDK script loaded');
          this.initializeOneSignal().then(resolve).catch(reject);
        };
        script.onerror = () => {
          reject(new Error('Failed to load OneSignal SDK'));
        };
      });
    } else {
      // Script already loaded
      console.log('📝 OneSignal SDK script already loaded');
      if (!window.OneSignal || !window.OneSignal.initialized) {
        // Not yet initialized, initialize now
        await this.initializeOneSignal();
      } else {
        // Already initialized
        console.log('✅ OneSignal SDK already initialized');
        this.isInitialized = true;
      }
    }
  }

  /**
   * Initialize OneSignal with current settings
   */
  private async initializeOneSignal(): Promise<void> {
    // Double-check if already initialized
    if (window.OneSignal && window.OneSignal.initialized) {
      console.log('⚠️ OneSignal already initialized, skipping init call');
      this.isInitialized = true;
      return Promise.resolve();
    }
    
    console.log('🔧 Initializing OneSignal v3 with App ID:', this.appId);
    console.log('🔑 App ID length:', this.appId.length);
    console.log('🔑 App ID format check:', /^[a-f0-9-]{36}$/i.test(this.appId) ? 'Valid UUID' : 'Invalid UUID');
    
    const settings = this.getSettings();
    
    try {
      // NEW OneSignal v3 API - direct init, no push() needed
      await window.OneSignal.init({
        appId: this.appId,
        allowLocalhostAsSecureOrigin: true,
        
        // Don't show any prompts automatically
        // User must click "Subscribe" button
        promptOptions: {
          slidedown: {
            enabled: false,
            autoPrompt: false,
          }
        },
        
        // Don't auto-subscribe
        autoRegister: false,
        autoResubscribe: true,
      });
      
      this.isInitialized = true;
      console.log('✅ OneSignal v3 initialized with App ID:', this.appId);
      
      // Log subscription status after init
      try {
        const permission = await window.OneSignal.Notifications.permission;
        const isOptedIn = window.OneSignal.User.PushSubscription.optedIn;
        const playerId = await window.OneSignal.User.PushSubscription.id;
        
        console.log('📊 OneSignal Status:', {
          permission,
          optedIn: isOptedIn,
          playerId: playerId || 'Not subscribed',
          subscribed: permission && isOptedIn
        });
        
        if (permission && isOptedIn && playerId) {
          console.log('✅ User already subscribed with Player ID:', playerId);
          console.log('🎯 To verify: Check OneSignal Dashboard → Audience → All Users');
          console.log('🔍 Search for this Player ID:', playerId);
        } else {
          console.log('ℹ️ User not subscribed yet. Click "Subscribe to Push Notifications" button.');
        }
      } catch (statusError) {
        console.warn('⚠️ Could not check subscription status:', statusError);
      }
      
    } catch (error) {
      console.error('❌ Error initializing OneSignal:', error);
      throw error;
    }
  }

  /**
   * Subscribe user to push notifications
   */
  async subscribe(): Promise<string | null> {
    if (!window.OneSignal) {
      await this.initializeSDK();
    }

    try {
      console.log('🔔 Requesting push notification permission...');
      
      // New OneSignal API - use Notifications namespace
      await window.OneSignal.Notifications.requestPermission();
      
      console.log('✅ Permission granted, getting user ID...');
      
      // Wait a bit for OneSignal to register
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const userId = await window.OneSignal.User.PushSubscription.id;
      console.log('✅ User subscribed with ID:', userId);
      
      return userId;
    } catch (error) {
      console.error('❌ Error subscribing to push notifications:', error);
      return null;
    }
  }

  /**
   * Get current user's OneSignal player ID
   */
  async getUserId(): Promise<string | null> {
    if (!window.OneSignal) {
      return null;
    }

    try {
      // New OneSignal API
      const userId = await window.OneSignal.User.PushSubscription.id;
      console.log('📱 Current Player ID:', userId);
      return userId;
    } catch (error) {
      console.error('❌ Error getting user ID:', error);
      return null;
    }
  }

  /**
   * Check if user is subscribed
   */
  async isSubscribed(): Promise<boolean> {
    if (!window.OneSignal) {
      return false;
    }

    try {
      // New OneSignal API - check permission state
      const permission = await window.OneSignal.Notifications.permission;
      const isOptedIn = window.OneSignal.User.PushSubscription.optedIn;
      
      console.log('🔍 Subscription check:', {
        permission,
        optedIn: isOptedIn,
        subscribed: permission && isOptedIn
      });
      
      return permission && isOptedIn;
    } catch (error) {
      console.error('❌ Error checking subscription status:', error);
      return false;
    }
  }

  /**
   * Send push notification via OneSignal API through Edge Function
   * Note: Settings must be configured in KV store for this to work
   */
  async sendNotification(
    data: PushNotificationData,
    options: SegmentOptions = {}
  ): Promise<{ id: string; recipients: number } | null> {
    if (!this.isEnabled()) {
      console.error('OneSignal not enabled or not configured');
      return null;
    }

    try {
      console.log('📤 Sending notification via Edge Function:', {
        title: data.title,
        message: data.message.substring(0, 50) + '...',
        targeting: options,
      });
      
      // Use Supabase Edge Function
      // Note: Settings must be synced to KV store manually
      const { getServerUrl: getUrl, getAnonKey, supabase } = await import('./supabase/client');
      const url = getUrl('/api/push/send');
      const anonKey = getAnonKey();
      
      console.log('📡 Calling Edge Function URL:', url);
      console.log('⚠️ Note: OneSignal settings must be synced to KV store for this to work');
      
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;
      
      if (!authToken) {
        throw new Error('Authentication required to send push notifications');
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'apikey': anonKey, // Required by Supabase Edge Functions
        },
        body: JSON.stringify({
          title: data.title,
          message: data.message,
          url: data.url,
          icon: data.icon,
          image: data.image,
          data: data.data,
          userIds: options.userIds,
          segments: options.segments,
          tags: options.tags,
          language: options.language,
          store: options.store,
        }),
      });

      console.log('📥 Edge Function response status:', response.status);
      console.log('📥 Edge Function response ok:', response.ok);
      
      const result = await response.json();
      console.log('📥 Edge Function response body:', result);
      
      if (!response.ok) {
        console.error('❌ Edge Function error:', result);
        const errorMessage = result.message || result.error || response.statusText;
        console.error('❌ Error message:', errorMessage);
        console.error('❌ Full error details:', JSON.stringify(result, null, 2));
        throw new Error(`Edge Function error: ${errorMessage}`);
      }

      // Check if result has error even with 200 status
      if (result.error) {
        console.error('❌ OneSignal error in response:', result.error);
        console.error('❌ Error details:', result.details);
        console.error('❌ Full error:', JSON.stringify(result, null, 2));
        throw new Error(`OneSignal error: ${result.error}`);
      }

      console.log('✅ Notification sent successfully:', {
        id: result.id,
        recipients: result.recipients,
      });
      
      return {
        id: result.id || '',
        recipients: result.recipients || 0,
      };
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      return null;
    }
  }

  /**
   * Send notification to current user (test notification)
   */
  async sendToCurrentUser(data: {
    title: string;
    message: string;
    url?: string;
    icon?: string;
    image?: string;
    data?: any;
  }): Promise<{ id: string; recipients: number } | null> {
    try {
      // Get current user's Player ID
      const playerId = await this.getUserId();
      
      if (!playerId) {
        console.error('❌ Cannot send: User is not subscribed or Player ID not found');
        throw new Error('You must be subscribed to receive test notifications. Please subscribe first.');
      }

      console.log('📤 Sending test notification to current user:', playerId);

      // Send to specific user ID
      return await this.sendNotification(data, {
        userIds: [playerId]
      });
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      throw error;
    }
  }

  /**
   * Tag user with custom data
   */
  async tagUser(tags: Record<string, string>): Promise<void> {
    if (!window.OneSignal) {
      await this.initializeSDK();
    }

    try {
      // New OneSignal API - use User.addTags
      await window.OneSignal.User.addTags(tags);
      console.log('✅ Tags added:', tags);
    } catch (error) {
      console.error('❌ Error tagging user:', error);
    }
  }

  /**
   * Delete user tags
   */
  async deleteUserTags(tagKeys: string[]): Promise<void> {
    if (!window.OneSignal) {
      return;
    }

    try {
      // New OneSignal API - use User.removeTags
      await window.OneSignal.User.removeTags(tagKeys);
      console.log('✅ Tags removed:', tagKeys);
    } catch (error) {
      console.error('❌ Error deleting tags:', error);
    }
  }

  /**
   * Send order status notification
   */
  async sendOrderStatusNotification(
    orderNumber: string,
    status: string,
    userId: string,
    language: string = 'ru'
  ): Promise<void> {
    const statusMessages: Record<string, Record<string, { title: string; message: string }>> = {
      pending: {
        ru: {
          title: '📦 Заказ получен',
          message: `Заказ #${orderNumber} принят в обработку. Мы свяжемся с вами в ближайшее время.`,
        },
        en: {
          title: '📦 Order Received',
          message: `Order #${orderNumber} has been received and is being processed.`,
        },
        zh: {
          title: '📦 订单已收到',
          message: `订单 #${orderNumber} 已收到并正在处理中。`,
        },
        vi: {
          title: '📦 Đơn hàng đã nhận',
          message: `Đơn hàng #${orderNumber} đã được nhận và đang được xử lý.`,
        },
      },
      processing: {
        ru: {
          title: '⏳ Заказ в обработке',
          message: `Заказ #${orderNumber} обрабатывается. Скоро он будет отправлен.`,
        },
        en: {
          title: '⏳ Order Processing',
          message: `Order #${orderNumber} is being processed and will be shipped soon.`,
        },
        zh: {
          title: '⏳ 订单处理中',
          message: `订单 #${orderNumber} 正在处理中，很快将发货。`,
        },
        vi: {
          title: '⏳ Đơn hàng đang xử lý',
          message: `Đơn hàng #${orderNumber} đang được xử lý và sẽ sớm được gửi đi.`,
        },
      },
      paid: {
        ru: {
          title: '✅ Оплата получена',
          message: `Заказ #${orderNumber} оплачен. Спасибо за покупку!`,
        },
        en: {
          title: '✅ Payment Received',
          message: `Order #${orderNumber} has been paid. Thank you for your purchase!`,
        },
        zh: {
          title: '✅ 收到付款',
          message: `订单 #${orderNumber} 已付款。感谢您的购买！`,
        },
        vi: {
          title: '✅ Đã nhận thanh toán',
          message: `Đơn hàng #${orderNumber} đã được thanh toán. Cảm ơn bạn đã mua hàng!`,
        },
      },
      shipped: {
        ru: {
          title: '🚚 Заказ отправлен',
          message: `Заказ #${orderNumber} отправлен! Ожидайте доставку.`,
        },
        en: {
          title: '🚚 Order Shipped',
          message: `Order #${orderNumber} has been shipped! Expect delivery soon.`,
        },
        zh: {
          title: '🚚 订单已发货',
          message: `订单 #${orderNumber} 已发货！请等待送达。`,
        },
        vi: {
          title: '🚚 Đơn hàng đã gửi',
          message: `Đơn hàng #${orderNumber} đã được gửi đi! Hãy chờ nhận hàng.`,
        },
      },
      delivered: {
        ru: {
          title: '🎉 Заказ доставлен',
          message: `Заказ #${orderNumber} доставлен. Приятного использования!`,
        },
        en: {
          title: '🎉 Order Delivered',
          message: `Order #${orderNumber} has been delivered. Enjoy your purchase!`,
        },
        zh: {
          title: '🎉 订单已送达',
          message: `订单 #${orderNumber} 已送达。请享受您的购买！`,
        },
        vi: {
          title: '🎉 Đơn hàng đã giao',
          message: `Đơn hàng #${orderNumber} đã được giao. Chúc bạn hài lòng!`,
        },
      },
      cancelled: {
        ru: {
          title: '❌ Заказ отменен',
          message: `Заказ #${orderNumber} был отменен. Свяжитесь с нами для уточнения деталей.`,
        },
        en: {
          title: '❌ Order Cancelled',
          message: `Order #${orderNumber} has been cancelled. Contact us for details.`,
        },
        zh: {
          title: '❌ 订单已取消',
          message: `订单 #${orderNumber} 已取消。请联系我们了解详情。`,
        },
        vi: {
          title: '❌ Đơn hàng đã hủy',
          message: `Đơn hàng #${orderNumber} đã bị hủy. Vui lòng liên hệ với chúng tôi để biết chi tiết.`,
        },
      },
    };

    const statusData = statusMessages[status]?.[language] || statusMessages[status]?.['ru'];
    if (!statusData) {
      console.warn(`No notification template for status: ${status}`);
      return;
    }

    await this.sendNotification(
      {
        title: statusData.title,
        message: statusData.message,
        url: `${window.location.origin}/#profile`,
        data: {
          type: 'order_status',
          orderNumber,
          status,
        },
      },
      {
        userIds: [userId],
      }
    );
  }
}

// Singleton instance
export const oneSignalService = new OneSignalService();

// Type definitions for window.OneSignal
declare global {
  interface Window {
    OneSignal: any;
  }
}
