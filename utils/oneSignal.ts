/**
 * OneSignal Push Notifications Utility v16+
 * Handles all push notification operations for Asia Pharm
 * 
 * DEBUG COMMANDS (console):
 * - Check if configured: oneSignalService.isConfigured()
 * - Get settings: localStorage.getItem('oneSignalSettings')
 * - Force reload: oneSignalService.reloadSettings()
 * - Check subscription: await oneSignalService.isSubscribed()
 * - Get user ID: await oneSignalService.getUserId()
 * - Diagnostic: await oneSignalService.diagnosticCheckRegistration()
 * - Force re-register: await oneSignalService.forceReRegister()
 * - Get user devices: await oneSignalService.getUserPlayerIds('USER_ID')
 * - Update last active: await oneSignalService.updateLastActive()
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
   * Get OneSignal SDK instance
   */
  private async getOneSignal(): Promise<any> {
    // Wait for SDK to be available
    let attempts = 0;
    while (!window.OneSignal && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!window.OneSignal) {
      throw new Error('OneSignal SDK not loaded after 5 seconds');
    }
    
    return window.OneSignal;
  }

  /**
   * Initialize OneSignal SDK v16+ in browser
   */
  async initializeSDK(): Promise<void> {
    // Reload settings to get latest values
    this.reloadSettings();
    
    if (!this.isEnabled()) {
      console.log('ℹ️ OneSignal not enabled or not configured, skipping initialization');
      return;
    }

    // ✅ ПРОВЕРКА ДОМЕНА - OneSignal работает только на production
    const isProduction = window.location.hostname === 'asia-pharm.ru' || 
                        window.location.hostname === 'asia-pharm.com' ||
                        window.location.hostname === 'www.asia-pharm.ru' ||
                        window.location.hostname === 'www.asia-pharm.com';
    
    if (!isProduction) {
      console.log('ℹ️ OneSignal initialization skipped: Not on production domain');
      console.log('💡 OneSignal will work on: https://asia-pharm.ru');
      console.log('🌐 Current domain:', window.location.hostname);
      return;
    }

    // If already initialized, skip
    if (this.isInitialized) {
      console.log('✅ OneSignal already initialized in service, skipping');
      return;
    }

    // ⚠️ IMPORTANT: OneSignal is now initialized in index.html <head>
    // We just need to wait for it to be ready and set up our listeners
    console.log('⏳ Waiting for OneSignal SDK to be ready (initialized in index.html)...');
    
    try {
      const OneSignal = await this.getOneSignal();
      
      // Check if OneSignal is already initialized globally (should be true from index.html)
      // @ts-ignore - accessing internal state
      if (OneSignal.__isInitialized || (typeof window !== 'undefined' && (window as any).__oneSignalInitialized)) {
        console.log('✅ OneSignal already initialized globally (from index.html)');
        this.isInitialized = true;
        
        // Set up our event listeners if not already done
        if (!((window as any).__oneSignalEventListenerSetup)) {
          this.setupEventListeners(OneSignal);
          (window as any).__oneSignalEventListenerSetup = true;
        }
        
        // Check current subscription status
        await this.checkInitialSubscription(OneSignal);
        return;
      }
      
      // If not initialized yet, wait a bit more for index.html init to complete
      console.log('⏳ OneSignal not yet initialized, waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check again
      // @ts-ignore
      if (OneSignal.__isInitialized || (typeof window !== 'undefined' && (window as any).__oneSignalInitialized)) {
        console.log('✅ OneSignal now initialized (from index.html after wait)');
        this.isInitialized = true;
        
        if (!((window as any).__oneSignalEventListenerSetup)) {
          this.setupEventListeners(OneSignal);
          (window as any).__oneSignalEventListenerSetup = true;
        }
        
        await this.checkInitialSubscription(OneSignal);
        return;
      }
      
      console.warn('⚠️ OneSignal not initialized from index.html, this is unexpected');
      console.warn('⚠️ Check that OneSignal script is in <head> of index.html');
    } catch (error) {
      console.error('❌ Error waiting for OneSignal initialization:', error);
      throw error;
    }
  }

  /**
   * Initialize OneSignal v16+ with current settings
   * ⚠️ DEPRECATED: Now handled by index.html <head> script
   * This method is kept for backwards compatibility but should not be called
   */
  private async initializeOneSignal(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ OneSignal already initialized in this instance, skipping init call');
      return;
    }
    
    console.log('🔧 Initializing OneSignal v16+ with App ID:', this.appId);
    console.log('🔑 App ID length:', this.appId.length);
    console.log('🔑 App ID format check:', /^[a-f0-9-]{36}$/i.test(this.appId) ? 'Valid UUID' : 'Invalid UUID');
    
    try {
      // Get OneSignal SDK instance
      const OneSignal = await this.getOneSignal();
      
      console.log('🔧 OneSignal SDK loaded, type:', typeof OneSignal);
      console.log('🔧 OneSignal methods:', Object.keys(OneSignal || {}).join(', '));
      
      // Check if OneSignal is already initialized globally
      // @ts-ignore - accessing internal state
      if (OneSignal.__isInitialized || (typeof window !== 'undefined' && (window as any).__oneSignalInitialized)) {
        console.log('✅ OneSignal already initialized globally, reusing existing instance');
        this.isInitialized = true;
        
        // Still set up our event listener if not already done
        if (!((window as any).__oneSignalEventListenerSetup)) {
          this.setupEventListeners(OneSignal);
          (window as any).__oneSignalEventListenerSetup = true;
        }
        
        // Check current subscription status
        await this.checkInitialSubscription(OneSignal);
        return;
      }
      
      console.log('🔧 Calling OneSignal.init()...');
      
      // Initialize using v16 API
      await OneSignal.init({
        appId: this.appId,
        allowLocalhostAsSecureOrigin: true,
        
        // Service Worker configuration
        serviceWorkerParam: { scope: '/' },
        serviceWorkerPath: 'OneSignalSDKWorker.js',
        
        // Notifications
        notifyButton: {
          enable: false,
        },
        
        // Don't auto-subscribe - user must click button
        autoRegister: false,
        autoResubscribe: true,
      });
      
      console.log('✅ OneSignal.init() completed successfully');
      
      this.isInitialized = true;
      
      // Mark as initialized globally
      if (typeof window !== 'undefined') {
        (window as any).__oneSignalInitialized = true;
      }
      
      // Set up event listeners
      this.setupEventListeners(OneSignal);
      if (typeof window !== 'undefined') {
        (window as any).__oneSignalEventListenerSetup = true;
      }
      
      console.log('✅ OneSignal v16+ initialized successfully');
      
      // Check initial subscription status
      await this.checkInitialSubscription(OneSignal);
    } catch (error) {
      console.error('❌ Error initializing OneSignal v16:', error);
      
      // Don't throw if already initialized
      if (error instanceof Error && error.message.includes('already initialized')) {
        console.log('✅ Recovering from "already initialized" error - SDK is ready');
        this.isInitialized = true;
        if (typeof window !== 'undefined') {
          (window as any).__oneSignalInitialized = true;
        }
        return;
      }
      
      throw error;
    }
  }
  
  /**
   * Set up OneSignal event listeners
   */
  private setupEventListeners(OneSignal: any): void {
    console.log('🔔 Setting up subscription change listener...');
    try {
      OneSignal.User.PushSubscription.addEventListener('change', (event: any) => {
        console.log('🔔 Push subscription changed:', event);
        console.log('📊 Current subscription:', {
          id: event.current.id,
          token: event.current.token,
          optedIn: event.current.optedIn,
        });
        console.log('📊 Previous subscription:', {
          id: event.previous?.id,
          token: event.previous?.token,
          optedIn: event.previous?.optedIn,
        });
        
        // If user just subscribed, sync to database
        // Note: External ID linking happens in subscribe() method, not here
        if (event.current.optedIn && event.current.id) {
          console.log('✅ Subscription changed:', event.current.id);
          
          // Sync to database
          this.syncSubscriptionToDatabase(event.current.id).catch(err => {
            console.error('❌ Failed to sync subscription:', err);
          });
        }
      });
      console.log('✅ Event listeners set up successfully');
    } catch (error) {
      console.warn('⚠️ Failed to set up event listeners:', error);
    }
  }
  
  /**
   * Check initial subscription status after initialization
   */
  private async checkInitialSubscription(OneSignal: any): Promise<void> {
    console.log('🔍 Checking initial subscription status...');
    try {
      const isPushSupported = OneSignal.Notifications?.isPushSupported() ?? false;
      console.log('🔔 Push supported:', isPushSupported);
      
      if (isPushSupported) {
        const permission = OneSignal.Notifications?.permission ?? false;
        console.log('🔔 Permission status:', permission);
        
        if (permission) {
          // Get Subscription ID (used for sending notifications in OneSignal API)
          const subscriptionId = await OneSignal.User?.PushSubscription?.id;
          const onesignalUserId = await OneSignal.User?.onesignalId;
          const externalId = await OneSignal.User?.externalId;
          
          console.log('🔍 OneSignal IDs:');
          console.log('Subscription ID (for notifications):', subscriptionId);
          console.log('OneSignal User ID:', onesignalUserId);
          console.log('External User ID:', externalId);
          
          if (subscriptionId) {
            console.log('✅ User already subscribed with Subscription ID:', subscriptionId);
            
            // Link External User ID if user is logged in
            await this.linkExternalUserIdIfNeeded(OneSignal);
            
            // Sync Subscription ID to database
            await this.syncSubscriptionToDatabase(subscriptionId);
            
            // Update last active
            await this.updateLastActive();
          } else {
            console.log('ℹ️ User not subscribed yet (no subscription)');
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not get OneSignal initial status:', error);
    }
  }

  /**
   * Subscribe user to push notifications (v16+ API)
   */
  async subscribe(): Promise<string | null> {
    try {
      console.log('🔔 Requesting push notification permission...');
      
      const OneSignal = await this.getOneSignal();
      
      if (!OneSignal.Notifications) {
        throw new Error('OneSignal.Notifications API not available. SDK may not be initialized.');
      }
      
      console.log('🔍 OneSignal.Notifications available, checking permission...');
      const currentPermission = OneSignal.Notifications.permission;
      console.log('📋 Current permission:', currentPermission);
      
      // Check if already subscribed
      const existingId = await OneSignal.User?.PushSubscription?.id;
      const existingOptedIn = await OneSignal.User?.PushSubscription?.optedIn;
      console.log('📊 Current subscription state:', { 
        id: existingId, 
        optedIn: existingOptedIn,
        hasPermission: currentPermission
      });
      
      // If permission is NOT granted yet, request it
      if (!currentPermission) {
        console.log('📤 Requesting permission...');
        const permissionGranted = await OneSignal.Notifications.requestPermission();
        
        console.log('✅ Permission request completed:', permissionGranted);
        
        if (!permissionGranted) {
          console.warn('⚠️ Permission NOT granted, cannot subscribe');
          return null;
        }
      } else {
        console.log('✅ Permission already granted');
      }
      
      // CRITICAL: ALWAYS call optIn() to ensure user is subscribed on OneSignal servers
      // Even if we already have a subscription ID, the user might not be opted-in on server
      console.log('🔔 Calling optIn() to subscribe on OneSignal servers...');
      try {
        await OneSignal.User.PushSubscription.optIn();
        console.log('✅ Successfully called optIn()');
        
        // Wait for optIn to process on OneSignal servers
        console.log('⏳ Waiting for OneSignal servers to process optIn...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify optIn status
        const optedIn = await OneSignal.User.PushSubscription.optedIn;
        console.log('📊 OptedIn status after optIn():', optedIn);
        
        if (!optedIn) {
          console.warn('⚠️ optIn() called but status is still false, retrying...');
          await OneSignal.User.PushSubscription.optIn();
          await new Promise(resolve => setTimeout(resolve, 2000));
          const retryOptedIn = await OneSignal.User.PushSubscription.optedIn;
          console.log('📊 OptedIn status after retry:', retryOptedIn);
          
          if (!retryOptedIn) {
            console.error('❌ Failed to opt-in after retry!');
            throw new Error('Failed to subscribe to push notifications');
          }
        }
      } catch (optInError) {
        console.error('❌ Error opting in:', optInError);
        throw optInError;
      }
      
      // Wait for subscription ID to appear
      console.log('⏳ Waiting for Subscription ID...');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Увеличено с 2s до 3s
      
      // Get Subscription ID (used for notifications API)
      const subscriptionId = await OneSignal.User?.PushSubscription?.id;
      const onesignalUserId = await OneSignal.User?.onesignalId;
      const externalId = await OneSignal.User?.externalId;
      
      console.log('🔍 Got IDs from OneSignal:');
      console.log('Subscription ID (for notifications):', subscriptionId);
      console.log('OneSignal User ID:', onesignalUserId);
      console.log('External User ID:', externalId);
      
      // Check subscription status
      const isPushEnabled = OneSignal.User?.PushSubscription?.optedIn;
      const token = OneSignal.User?.PushSubscription?.token;
      const currentPermissionStatus = OneSignal.Notifications?.permission;
      console.log('📊 Subscription status:', {
        subscriptionId,
        onesignalUserId,
        externalId,
        optedIn: isPushEnabled,
        hasToken: !!token,
        permission: currentPermissionStatus
      });
      
      if (subscriptionId) {
        console.log('✅ User subscribed with Subscription ID:', subscriptionId);
        console.log('🔍 Verifying in OneSignal dashboard...');
        console.log('💡 Check: https://dashboard.onesignal.com/apps/' + this.appId + '/audiences');
        
        // Link External User ID first (must be done after subscription is created)
        await this.linkExternalUserIdIfNeeded(OneSignal);
        
        // Then sync Subscription ID to database
        await this.syncSubscriptionToDatabase(subscriptionId);
        
        // Double-check that user is opted in
        const finalOptedIn = await OneSignal.User.PushSubscription.optedIn;
        console.log('📊 Final optedIn status:', finalOptedIn);
        
        if (!finalOptedIn) {
          console.warn('⚠️ User has Player ID but not opted in! Fixing...');
          try {
            await OneSignal.User.PushSubscription.optIn();
            console.log('✅ Forced opt-in call completed');
            
            // Wait and check again
            await new Promise(resolve => setTimeout(resolve, 1500));
            const afterForceOptIn = await OneSignal.User.PushSubscription.optedIn;
            console.log('📊 OptedIn after forced opt-in:', afterForceOptIn);
            
            if (!afterForceOptIn) {
              console.error('❌ Still not opted in after force! Check OneSignal config.');
              console.error('💡 Make sure your App ID and site origin are correct.');
              console.error('💡 Check: https://dashboard.onesignal.com/apps/' + this.appId + '/settings');
            } else {
              console.log('✅ Successfully opted in after retry!');
            }
          } catch (e) {
            console.error('❌ Failed to force opt-in:', e);
          }
        } else {
          console.log('✅ User is properly opted in!');
        }
        
        // Validate Subscription ID format before syncing
        console.log('🔍 Validating Subscription ID format');
        console.log('Subscription ID:', subscriptionId);
        console.log('Type:', typeof subscriptionId);
        console.log('Length:', subscriptionId?.length);
        const isValidUUID = subscriptionId && /^[a-f0-9-]{36}$/i.test(subscriptionId);
        console.log('Is valid UUID:', isValidUUID);
        
        if (!isValidUUID) {
          console.error('❌ Invalid Subscription ID format! Cannot sync to database.');
          console.error('Expected: UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)');
          console.error('Got:', subscriptionId);
          return null;
        }
        
        // Update last active timestamp
        await this.updateLastActive().catch(err => {
          console.warn('⚠️ Failed to update last active:', err);
        });
        
        return subscriptionId;
      } else {
        console.warn('⚠️ Subscription initiated but no ID yet.');
        console.warn('📋 Debug info:', {
          permission: newPermission,
          isPushSupported: OneSignal.Notifications.isPushSupported(),
          hasUser: !!OneSignal.User,
          hasPushSubscription: !!OneSignal.User?.PushSubscription
        });
        
        // Wait a bit more and try again
        console.log('⏳ Waiting 3 more seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Get Subscription ID on retry
        const retrySubId = await OneSignal.User?.PushSubscription?.id;
        console.log('🔍 Retry Subscription ID:', retrySubId);
        
        if (retrySubId) {
          console.log('✅ Got Subscription ID on retry:', retrySubId);
          console.log('🔍 Format check:', /^[a-f0-9-]{36}$/i.test(retrySubId) ? 'Valid UUID' : 'Invalid');
          await this.syncSubscriptionToDatabase(retrySubId);
          return retrySubId;
        }
        
        console.error('❌ Failed to get Subscription ID after retry');
        return null;
      }
    } catch (error) {
      console.error('❌ Error subscribing to push notifications:', error);
      console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
      
      // Check if permission was blocked (common in Incognito mode)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Permission blocked') || errorMessage.includes('blocked')) {
        // Import toast dynamically to avoid circular dependencies
        const { toast } = await import('sonner');
        toast.error('Push-уведомления заблокированы', {
          description: 'В режиме инкогнито браузеры блокируют push-уведомления. Попробуйте в обычном режиме.',
          duration: 8000,
        });
        console.warn('⚠️ Push notifications blocked - likely Incognito mode');
        return null;
      }
      
      throw error;
    }
  }

  /**
   * Link External User ID to OneSignal subscription if user is logged in
   * This must be called AFTER subscription is created
   */
  private async linkExternalUserIdIfNeeded(OneSignal: any): Promise<void> {
    try {
      console.log('🔗 Checking if External User ID needs to be set...');
      const { supabase } = await import('./supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('ℹ️ No user logged in, skipping External User ID');
        return;
      }
      
      // Check current External User ID
      const currentExternalId = OneSignal.User?.externalId;
      
      if (!currentExternalId || currentExternalId !== session.user.id) {
        console.log('🔗 Setting External User ID to link subscription:', session.user.id);
        try {
          await OneSignal.login(session.user.id);
          console.log('✅ External User ID linked successfully');
        } catch (loginError) {
          console.error('❌ Failed to link External User ID:', loginError);
          throw loginError;
        }
      } else {
        console.log('✅ External User ID already set:', currentExternalId);
      }
    } catch (error) {
      console.error('❌ Error linking External User ID:', error);
      throw error;
    }
  }

  /**
   * Sync OneSignal Player ID to database for current user
   */
  private async syncSubscriptionToDatabase(playerId: string): Promise<void> {
    try {
      console.log('💾 Starting subscription sync to database...');
      const { supabase } = await import('./supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('ℹ️ No user logged in, skipping subscription sync');
        return;
      }

      console.log('✅ User session found:', session.user.email);

      // Get device info
      const deviceType = this.getDeviceType();
      const browser = this.getBrowser();
      const os = this.getOS();

      console.log('💾 Syncing subscription to database:', {
        userId: session.user.id,
        userEmail: session.user.email,
        playerId,
        deviceType,
        browser,
        os,
      });
      
      // Verify Subscription ID format
      console.log('🔍 Subscription ID validation:');
      console.log('Subscription ID:', playerId);
      console.log('Length:', playerId?.length);
      const isValidFormat = /^[a-f0-9-]{36}$/i.test(playerId);
      console.log('Format (UUID):', isValidFormat);
      
      if (!isValidFormat) {
        console.error('❌ Invalid Subscription ID format - aborting sync!');
        return;
      }
      
      console.log('✅ Subscription ID format is valid - proceeding with database sync');

      // Check if subscription already exists
      const { data: existingData, error: selectError } = await supabase
        .from('user_push_subscriptions')
        .select('*')
        .eq('player_id', playerId)
        .maybeSingle(); // Use maybeSingle() to avoid 406 error when no rows
      
      if (selectError) {
        console.error('❌ Error checking existing subscription:', selectError);
      } else {
        console.log('📋 Existing subscription:', existingData || 'None');
      }

      // Save Subscription ID to database
      console.log('💾 Saving Subscription ID to database...');
      
      // Insert or update subscription
      const { data, error } = await supabase
        .from('user_push_subscriptions')
        .upsert({
          user_id: session.user.id,
          player_id: playerId, // This is the Subscription ID for sending notifications
          device_type: deviceType,
          browser,
          os,
          is_active: true,
          last_active_at: new Date().toISOString(),
        }, {
          onConflict: 'player_id',
        })
        .select();

      if (error) {
        console.error('❌ Error syncing subscription:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error details:', error.details);
      } else {
        console.log('✅ Subscription synced to database successfully');
        console.log('📊 Synced data:', data);
        
        // Update profile to enable push notifications
        console.log('📝 Enabling push notifications in profile...');
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            push_notifications_enabled: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id);
        
        if (profileError) {
          console.error('⚠️ Failed to update profile:', profileError);
        } else {
          console.log('✅ Profile updated: push_notifications_enabled = true');
        }
      }
    } catch (error) {
      console.error('❌ Error syncing subscription to database:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Get all Player IDs for a specific user
   * Also checks if user has push notifications enabled
   */
  async getUserPlayerIds(userId: string): Promise<string[]> {
    try {
      const { supabase } = await import('./supabase/client');
      
      // First check if user has push notifications enabled
      const { data: profile } = await supabase
        .from('profiles')
        .select('push_notifications_enabled')
        .eq('id', userId)
        .single();
      
      if (!profile?.push_notifications_enabled) {
        console.log('⚠️ User has push notifications disabled');
        return [];
      }
      
      const { data, error } = await supabase
        .from('user_push_subscriptions')
        .select('player_id')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('❌ Error getting user player IDs:', error);
        return [];
      }

      const playerIds = data?.map(row => row.player_id) || [];
      console.log('📱 User has', playerIds.length, 'active devices');
      return playerIds;
    } catch (error) {
      console.error('❌ Error getting user player IDs:', error);
      return [];
    }
  }

  /**
   * Update last active timestamp for current subscription
   */
  async updateLastActive(): Promise<void> {
    try {
      const playerId = await this.getUserId();
      if (!playerId) return;

      const { supabase } = await import('./supabase/client');
      
      await supabase
        .from('user_push_subscriptions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('player_id', playerId);
      
      console.log('✅ Last active timestamp updated');
    } catch (error) {
      console.error('❌ Error updating last active:', error);
    }
  }

  /**
   * Link OneSignal subscription to user after login
   * This is for when user logs in AFTER creating an anonymous subscription
   */
  async linkUserAfterLogin(userId: string): Promise<void> {
    try {
      console.log('🔗 Linking OneSignal subscription to user after login:', userId);
      
      const OneSignal = await this.getOneSignal();
      const currentExternalId = OneSignal.User?.externalId;
      
      // Only call login if External ID is not already set or is different
      if (!currentExternalId || currentExternalId !== userId) {
        console.log('🔗 Calling OneSignal.login to link subscription:', userId);
        await OneSignal.login(userId);
        console.log('✅ Subscription linked to user after login');
        
        // Get subscription ID and sync to database
        const subscriptionId = await OneSignal.User?.PushSubscription?.id;
        if (subscriptionId) {
          await this.syncSubscriptionToDatabase(subscriptionId);
        }
      } else {
        console.log('✅ External User ID already set:', currentExternalId);
      }
    } catch (error) {
      console.error('❌ Error linking user after login:', error);
      throw error;
    }
  }

  /**
   * Logout user from OneSignal
   * This clears the External ID and converts subscription back to anonymous
   */
  async logoutUser(): Promise<void> {
    try {
      console.log('🚪 Logging out from OneSignal...');
      
      const OneSignal = await this.getOneSignal();
      await OneSignal.logout();
      
      console.log('✅ OneSignal logout completed - subscription now anonymous');
    } catch (error) {
      console.error('❌ Error logging out from OneSignal:', error);
      throw error;
    }
  }

  /**
   * Detect device type
   */
  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  /**
   * Detect browser
   */
  private getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
    return 'Unknown';
  }

  /**
   * Detect operating system
   */
  private getOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Win')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Unknown';
  }

  /**
   * Get current user's Subscription ID (v16+ API)
   */
  async getUserId(): Promise<string | null> {
    try {
      const OneSignal = await this.getOneSignal();
      
      if (!OneSignal.User?.PushSubscription) {
        console.warn('⚠️ OneSignal.User.PushSubscription not available');
        return null;
      }
      
      // Return Subscription ID (used for sending notifications)
      const subscriptionId = await OneSignal.User.PushSubscription.id;
      
      console.log('📱 Subscription ID:', subscriptionId || 'Not subscribed');
      
      return subscriptionId || null;
    } catch (error) {
      console.error('❌ Error getting user ID:', error);
      return null;
    }
  }

  /**
   * Check if user is subscribed (v16+ API)
   */
  async isSubscribed(): Promise<boolean> {
    try {
      const OneSignal = await this.getOneSignal();
      
      if (!OneSignal.Notifications || !OneSignal.User?.PushSubscription) {
        console.warn('⚠️ OneSignal APIs not available');
        return false;
      }
      
      const permission = OneSignal.Notifications.permission;
      const subscriptionId = await OneSignal.User.PushSubscription.id;
      const isSubscribed = permission && !!subscriptionId;
      console.log('🔍 Subscription check:', isSubscribed, '(Subscription ID exists:', !!subscriptionId, ')');
      return isSubscribed;
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
      // Get current Supabase user ID (External User ID in OneSignal)
      const { supabase } = await import('./supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.error('❌ Cannot send: User not logged in');
        throw new Error('You must be logged in to receive test notifications.');
      }

      const externalUserId = session.user.id;
      console.log('📤 Sending test notification to current user via External User ID (Supabase User ID):', externalUserId);

      // Send to specific External User ID (Supabase User ID)
      return await this.sendNotification(data, {
        externalUserIds: [externalUserId]
      });
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      throw error;
    }
  }

  /**
   * Tag user with custom data (v16+ API)
   */
  async tagUser(tags: Record<string, string>): Promise<void> {
    try {
      const OneSignal = await this.getOneSignal();
      
      if (!OneSignal.User?.addTags) {
        throw new Error('OneSignal.User.addTags not available');
      }
      
      await OneSignal.User.addTags(tags);
      console.log('✅ Tags added:', tags);
    } catch (error) {
      console.error('❌ Error tagging user:', error);
    }
  }

  /**
   * Delete user tags (v16+ API)
   */
  async deleteUserTags(tagKeys: string[]): Promise<void> {
    try {
      const OneSignal = await this.getOneSignal();
      
      if (!OneSignal.User?.removeTags) {
        throw new Error('OneSignal.User.removeTags not available');
      }
      
      await OneSignal.User.removeTags(tagKeys);
      console.log('✅ Tags removed:', tagKeys);
    } catch (error) {
      console.error('❌ Error deleting tags:', error);
    }
  }

  /**
   * Send order status notification to ALL user's devices
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

    console.log(`📤 Sending order notification to user: ${userId}`);

    // Send to user via External User ID (Supabase User ID)
    // This will deliver to ALL devices associated with this user
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
        externalUserIds: [userId], // Send via External User ID (Supabase User ID)
      }
    );
  }

  /**
   * DIAGNOSTIC: Check if user is registered on OneSignal server
   */
  async diagnosticCheckRegistration() {
    try {
      console.log('🔍 Starting OneSignal registration diagnostic...');
      const OneSignal = await this.getOneSignal();
      const playerId = OneSignal.User?.PushSubscription?.id || null;
      const token = OneSignal.User?.PushSubscription?.token || null;
      const optedIn = OneSignal.User?.PushSubscription?.optedIn || false;
      const permission = OneSignal.Notifications?.permission || 'default';
      
      console.log('📱 Local subscription:', { playerId, hasToken: !!token, optedIn, permission });

      let registeredOnServer = false;
      let serverResponse: any = null;

      if (playerId && this.apiKey) {
        try {
          const response = await fetch(`${this.apiUrl}/players/${playerId}?app_id=${this.appId}`, {
            headers: { 'Authorization': `Basic ${this.apiKey}` }
          });
          serverResponse = await response.json();
          registeredOnServer = response.ok;
          console.log('📥 Server response:', { status: response.status, ok: response.ok, data: serverResponse });
        } catch (error) {
          console.error('❌ Error checking server:', error);
          serverResponse = { error: String(error) };
        }
      } else {
        console.warn('⚠️ Cannot check server: missing playerId or apiKey');
      }

      return {
        success: !!playerId && !!token && optedIn,
        playerId,
        token,
        optedIn,
        permission,
        registeredOnServer,
        serverResponse,
        error: registeredOnServer ? undefined : 'User not found on OneSignal server'
      };
    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
      return { 
        success: false, 
        playerId: null, 
        token: null, 
        optedIn: false, 
        permission: 'denied', 
        registeredOnServer: false, 
        error: String(error) 
      };
    }
  }

  /**
   * FORCE RE-REGISTER: Unsubscribe and re-subscribe to fix registration
   */
  async forceReRegister() {
    try {
      console.log('🔄 Force re-registering...');
      const OneSignal = await this.getOneSignal();
      console.log('1️⃣ Opting out...');
      await OneSignal.User?.PushSubscription?.optOut();
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('2️⃣ Opting in...');
      await OneSignal.User?.PushSubscription?.optIn();
      await new Promise(resolve => setTimeout(resolve, 2000));
      const newPlayerId = OneSignal.User?.PushSubscription?.id;
      console.log('3️⃣ New Player ID:', newPlayerId);
      if (newPlayerId) {
        console.log('✅ Re-registration successful!');
        setTimeout(async () => {
          const diagnostic = await this.diagnosticCheckRegistration();
          console.log('📊 Post-registration diagnostic:', diagnostic);
        }, 3000);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Force re-register failed:', error);
      return false;
    }
  }

  /**
   * Prompt user to subscribe (for use during registration)
   * Shows native browser prompt AND opts in
   */
  async promptAndSubscribe(): Promise<boolean> {
    try {
      console.log('🔔 Prompting user to subscribe...');
      const OneSignal = await this.getOneSignal();
      
      if (!OneSignal.Slidedown) {
        console.warn('⚠️ OneSignal.Slidedown not available, using direct subscribe');
        const subscriptionId = await this.subscribe();
        return !!subscriptionId;
      }
      
      // Show native prompt
      console.log('📱 Showing native browser prompt...');
      await OneSignal.Slidedown.promptPush();
      
      // Wait for user to respond
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if permission was granted
      const permission = OneSignal.Notifications?.permission;
      console.log('📋 Permission after prompt:', permission);
      
      if (!permission) {
        console.warn('⚠️ Permission denied by user');
        return false;
      }
      
      // CRITICAL: Even with permission, we must call optIn()
      console.log('🔔 Permission granted, calling optIn()...');
      await OneSignal.User.PushSubscription.optIn();
      
      // Wait for optIn to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get subscription ID
      const subscriptionId = await OneSignal.User?.PushSubscription?.id;
      const optedIn = await OneSignal.User?.PushSubscription?.optedIn;
      
      console.log('📊 Subscription result:', { subscriptionId, optedIn });
      
      if (subscriptionId && optedIn) {
        console.log('✅ User subscribed successfully');
        await this.syncSubscriptionToDatabase(subscriptionId);
        return true;
      } else {
        console.warn('⚠️ Subscription incomplete');
        return false;
      }
    } catch (error) {
      console.error('❌ Error during prompt and subscribe:', error);
      return false;
    }
  }
}

// Singleton instance
export const oneSignalService = new OneSignalService();

// Type definitions for window.OneSignal (v16+)
declare global {
  interface Window {
    OneSignal: any;
  }
}