/**
 * Полная диагностика системы Push-уведомлений
 * Вызов: await window.pushDiagnostic()
 */

import { oneSignalService } from './oneSignal';

export async function fullPushDiagnostic() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  🔍 ПОЛНАЯ ДИАГНОСТИКА PUSH-УВЕДОМЛЕНИЙ             ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    // 1. Проверка домена
    console.log('1️⃣ Проверка домена');
    console.log('   Domain:', window.location.hostname);
    console.log('   Protocol:', window.location.protocol);
    const isProduction = window.location.hostname === 'asia-pharm.ru';
    console.log('   Is Production:', isProduction ? '✅ YES' : '❌ NO (OneSignal works only on asia-pharm.ru)');
    console.log('');
    
    // 2. Проверка SDK
    console.log('2️⃣ Проверка OneSignal SDK');
    console.log('   SDK loaded:', !!window.OneSignal ? '✅ YES' : '❌ NO');
    if (window.OneSignal) {
      console.log('   SDK type:', typeof window.OneSignal);
      console.log('   SDK methods:', Object.keys(window.OneSignal).slice(0, 10).join(', ') + '...');
    }
    console.log('');
    
    // 3. Проверка Service Worker
    console.log('3️⃣ Проверка Service Workers');
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('   Registered:', registrations.length);
      registrations.forEach((reg, i) => {
        console.log(`   SW ${i + 1}:`, reg.active?.scriptURL || 'inactive');
      });
      
      const oneSignalSW = registrations.find(reg => 
        reg.active?.scriptURL.includes('OneSignalSDKWorker')
      );
      console.log('   OneSignal SW:', oneSignalSW ? '✅ YES' : '❌ NO');
      
      // Проверка доступности файла
      try {
        const swResponse = await fetch('/OneSignalSDKWorker.js');
        console.log('   SW File accessible:', swResponse.ok ? '✅ YES' : `❌ NO (${swResponse.status})`);
      } catch (e) {
        console.log('   SW File accessible:', '❌ NO (network error)');
      }
    } else {
      console.log('   Service Workers:', '❌ NOT SUPPORTED');
    }
    console.log('');
    
    // 4. Проверка настроек
    console.log('4️⃣ Проверка настроек OneSignal');
    const configured = oneSignalService.isConfigured();
    const enabled = oneSignalService.isEnabled();
    console.log('   Configured:', configured ? '✅ YES' : '❌ NO');
    console.log('   Enabled:', enabled ? '✅ YES' : '❌ NO');
    
    const settings = localStorage.getItem('oneSignalSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      console.log('   App ID:', parsed.appId ? `✅ ${parsed.appId}` : '❌ NOT SET');
      console.log('   API Key:', parsed.restApiKey ? `✅ ${parsed.restApiKey.substring(0, 20)}...` : '❌ NOT SET');
    } else {
      console.log('   Settings:', '❌ NOT FOUND in localStorage');
    }
    console.log('');
    
    // 5. Проверка подписки (если SDK доступен)
    if (window.OneSignal) {
      console.log('5️⃣ Проверка подписки пользователя');
      try {
        const OneSignal = window.OneSignal;
        
        const subscriptionId = OneSignal.User?.PushSubscription?.id;
        const optedIn = OneSignal.User?.PushSubscription?.optedIn;
        const token = OneSignal.User?.PushSubscription?.token;
        const permission = OneSignal.Notifications?.permission;
        
        console.log('   Subscription ID:', subscriptionId || '❌ NOT SET');
        console.log('   Opted In:', optedIn ? '✅ YES' : '❌ NO');
        console.log('   Has Token:', token ? '✅ YES' : '❌ NO');
        console.log('   Permission:', permission ? '✅ GRANTED' : '❌ NOT GRANTED');
        console.log('');
        
        // 6. Проверка браузерных permissions
        console.log('6️⃣ Проверка браузерных permissions');
        const browserPermission = Notification.permission;
        console.log('   Browser permission:', browserPermission);
        console.log('   Status:', browserPermission === 'granted' ? '✅ GRANTED' : 
                                   browserPermission === 'denied' ? '❌ DENIED' : 
                                   '⚠️ DEFAULT (not asked yet)');
        console.log('');
        
        // 7. Проверка базы данных
        console.log('7️⃣ Проверка синхронизации с БД');
        try {
          const { supabase } = await import('./supabase/client');
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            console.log('   User logged in:', '✅ YES');
            console.log('   User ID:', session.user.id);
            console.log('   Email:', session.user.email);
            
            const { data: subscriptions, error } = await supabase
              .from('user_push_subscriptions')
              .select('*')
              .eq('user_id', session.user.id);
            
            if (error) {
              console.log('   DB Query:', '❌ ERROR', error.message);
            } else {
              console.log('   Subscriptions in DB:', subscriptions?.length || 0);
              subscriptions?.forEach((sub: any, i: number) => {
                console.log(`   Sub ${i + 1}:`, {
                  player_id: sub.player_id,
                  is_active: sub.is_active,
                  device: sub.device_type,
                  browser: sub.browser,
                });
              });
            }
          } else {
            console.log('   User logged in:', '❌ NO');
          }
        } catch (e) {
          console.log('   DB Check:', '❌ ERROR', e);
        }
        console.log('');
        
        // 8. Рекомендации
        console.log('8️⃣ РЕКОМЕНДАЦИИ:');
        
        if (!isProduction) {
          console.log('   ⚠️ Вы НЕ на production домене! OneSignal работает только на asia-pharm.ru');
        }
        
        if (!window.OneSignal) {
          console.log('   ⚠️ OneSignal SDK НЕ загружен! Выполните:');
          console.log('       await window.oneSignalService.initializeSDK()');
        }
        
        if (!subscriptionId && browserPermission === 'granted') {
          console.log('   ⚠️ Permission granted, но нет Subscription ID!');
          console.log('       Проблема: OneSignal SDK не инициализирован после загрузки');
          console.log('       Решение 1: Перезагрузите страницу');
          console.log('       Решение 2: await window.oneSignalService.subscribe()');
        }
        
        if (subscriptionId && !optedIn) {
          console.log('   ⚠️ Subscription ID есть, но optedIn = false!');
          console.log('       Это значит что подписка не активирована на сервере OneSignal');
          console.log('       Попробуйте:');
          console.log('       1. await OneSignal.User.PushSubscription.optIn()');
          console.log('       2. Подождите 2 секунды');
          console.log('       3. Проверьте: OneSignal.User.PushSubscription.optedIn');
        }
        
        if (permission && !subscriptionId && browserPermission === 'granted') {
          console.log('   ⚠️ Permission GRANTED, но нет Subscription ID!');
          console.log('       КРИТИЧЕСКАЯ ОШИБКА: OneSignal SDK не создал подписку');
          console.log('       Возможные причины:');
          console.log('       1. OneSignal.init() не был вызван');
          console.log('       2. App ID неправильный');
          console.log('       3. Service Worker не зарегистрирован');
          console.log('       Попробуйте: location.reload() или await window.oneSignalService.initializeSDK()');
        }
        
        if (browserPermission === 'default') {
          console.log('   ℹ️ Permission еще не запрашивалась');
          console.log('       Выполните: await window.oneSignalService.subscribe()');
        }
        
        if (browserPermission === 'denied') {
          console.log('   ❌ Permission DENIED пользователем');
          console.log('       Пользователь должен вручную разрешить уведомления в настройках браузера');
        }
        
        console.log('');
        console.log('╔═══════════════════════════════════════════════════════╗');
        console.log('║  ✅ ДИАГНОСТИКА ЗАВЕРШЕНА                            ║');
        console.log('╚═══════════════════════════════════════════════════════╝');
        console.log('');
        console.log('💡 Быстрые команды:');
        console.log('   await window.oneSignalService.initializeSDK() - инициализировать SDK');
        console.log('   await window.oneSignalService.subscribe() - подписаться');
        console.log('   await OneSignal.User.PushSubscription.optIn() - активировать подписку');
        console.log('   await window.pushDiagnostic() - запустить диагностику снова');
        console.log('');
        
        return {
          domain: { hostname: window.location.hostname, isProduction },
          sdk: { loaded: !!window.OneSignal },
          serviceWorker: { registered: (await navigator.serviceWorker.getRegistrations()).length },
          settings: { configured, enabled },
          subscription: { subscriptionId, optedIn, hasToken: !!token, permission },
          browserPermission,
        };
      } catch (e) {
        console.error('❌ Error during subscription check:', e);
        console.log('');
        return { error: String(e) };
      }
    } else {
      console.log('5️⃣ OneSignal SDK не загружен - пропускаем проверку подписки');
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════╗');
      console.log('║  ⚠️ ДИАГНОСТИКА ПРЕРВАНА - SDK НЕ ЗАГРУЖЕН          ║');
      console.log('╚═══════════════════════════════════════════════════════╝');
      console.log('');
      console.log('💡 Выполните: await window.oneSignalService.initializeSDK()');
      console.log('');
      return { error: 'OneSignal SDK not loaded' };
    }
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    return { error: String(error) };
  }
}

// Expose to window
if (typeof window !== 'undefined') {
  (window as any).pushDiagnostic = fullPushDiagnostic;
  console.log('🔧 pushDiagnostic() доступна в консоли');
}
