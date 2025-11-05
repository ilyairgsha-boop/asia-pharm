/**
 * OneSignal Debug Utilities
 * Helpers for debugging OneSignal subscriptions and API
 */

import { supabase } from './supabase/client';

/**
 * Check if player exists in OneSignal via REST API
 */
export async function checkPlayerInOneSignal(playerId: string): Promise<any> {
  console.log('🔍 Checking player in OneSignal:', playerId);
  
  try {
    // Get settings from localStorage or Supabase
    let settings: any = null;
    
    const localSettings = localStorage.getItem('oneSignalSettings');
    if (localSettings) {
      settings = JSON.parse(localSettings);
    } else {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'oneSignal')
        .maybeSingle();
      
      if (data?.value) {
        settings = data.value;
      }
    }
    
    if (!settings?.appId || !settings?.restApiKey) {
      console.error('❌ OneSignal not configured');
      return null;
    }
    
    // Call OneSignal API to get player
    const url = `https://onesignal.com/api/v1/players/${playerId}?app_id=${settings.appId}`;
    
    console.log('📡 Fetching player from OneSignal API...');
    console.log('🔗 URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${settings.restApiKey}`,
      }
    });
    
    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OneSignal API error:', errorText);
      return { error: errorText, status: response.status };
    }
    
    const player = await response.json();
    console.log('✅ Player found in OneSignal:', player);
    console.log('📊 Player details:', {
      id: player.id,
      identifier: player.identifier,
      session_count: player.session_count,
      language: player.language,
      timezone: player.timezone,
      game_version: player.game_version,
      device_os: player.device_os,
      device_type: player.device_type,
      device_model: player.device_model,
      tags: player.tags,
      last_active: player.last_active,
      playtime: player.playtime,
      amount_spent: player.amount_spent,
      created_at: player.created_at,
      invalid_identifier: player.invalid_identifier,
      badge_count: player.badge_count,
      test_type: player.test_type,
    });
    
    return player;
  } catch (error: any) {
    console.error('❌ Error checking player:', error?.message);
    return null;
  }
}

/**
 * Get all players from OneSignal (admin only)
 */
export async function getAllPlayersFromOneSignal(limit: number = 10): Promise<any> {
  console.log('🔍 Fetching all players from OneSignal...');
  
  try {
    // Get settings
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'oneSignal')
      .maybeSingle();
    
    if (!data?.value) {
      console.error('❌ OneSignal not configured');
      return null;
    }
    
    const settings = data.value as any;
    
    if (!settings?.appId || !settings?.restApiKey) {
      console.error('❌ OneSignal credentials missing');
      return null;
    }
    
    // Call OneSignal API
    const url = `https://onesignal.com/api/v1/players?app_id=${settings.appId}&limit=${limit}`;
    
    console.log('📡 Fetching from:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${settings.restApiKey}`,
      }
    });
    
    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OneSignal API error:', errorText);
      return { error: errorText, status: response.status };
    }
    
    const data2 = await response.json();
    console.log('✅ Players fetched:', data2);
    console.log('📊 Total players:', data2.total_count);
    console.log('📋 Players:', data2.players?.length || 0);
    
    return data2;
  } catch (error: any) {
    console.error('❌ Error fetching players:', error?.message);
    return null;
  }
}

/**
 * Get app info from OneSignal
 */
export async function getOneSignalAppInfo(): Promise<any> {
  console.log('🔍 Fetching OneSignal app info...');
  
  try {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'oneSignal')
      .maybeSingle();
    
    if (!data?.value) {
      console.error('❌ OneSignal not configured');
      return null;
    }
    
    const settings = data.value as any;
    
    if (!settings?.appId || !settings?.restApiKey) {
      console.error('❌ OneSignal credentials missing');
      return null;
    }
    
    const url = `https://onesignal.com/api/v1/apps/${settings.appId}`;
    
    console.log('📡 Fetching from:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${settings.restApiKey}`,
      }
    });
    
    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OneSignal API error:', errorText);
      return { error: errorText, status: response.status };
    }
    
    const appInfo = await response.json();
    console.log('✅ App info:', appInfo);
    console.log('📊 App details:', {
      id: appInfo.id,
      name: appInfo.name,
      players: appInfo.players,
      messageable_players: appInfo.messageable_players,
      updated_at: appInfo.updated_at,
      created_at: appInfo.created_at,
      chrome_web_origin: appInfo.chrome_web_origin,
      chrome_web_default_notification_icon: appInfo.chrome_web_default_notification_icon,
      chrome_web_sub_domain: appInfo.chrome_web_sub_domain,
    });
    
    return appInfo;
  } catch (error: any) {
    console.error('❌ Error fetching app info:', error?.message);
    return null;
  }
}

// Export for window access
if (typeof window !== 'undefined') {
  (window as any).oneSignalDebug = {
    checkPlayer: checkPlayerInOneSignal,
    getAllPlayers: getAllPlayersFromOneSignal,
    getAppInfo: getOneSignalAppInfo,
  };
  
  console.log('💡 OneSignal Debug tools available:');
  console.log('  - await window.oneSignalDebug.checkPlayer(playerId)');
  console.log('  - await window.oneSignalDebug.getAllPlayers(limit)');
  console.log('  - await window.oneSignalDebug.getAppInfo()');
}
